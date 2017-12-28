import angular from 'angular';
import TransactionService from '../../service/TransactionService';
import createPaymentProfilePartial from '../../payment/profile/partial/create.html';
import createConsentPartial from '../../organization/partial/createConsentAsset.html';

export default class UpdateEventController {
  constructor(
    $timeout,
    $scope,
    $state,
    $mdDialog,
    storageService,
    eventService,
    assetService,
    organizationService,
    uiService,
    db
  ) {
    this.$timeout = $timeout;
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.eventService = eventService;
    this.assetService = assetService;
    this.organizationService = organizationService;
    this.uiService = uiService;
    this.db = db;

    this.$scope.currentDate = new Date();
    this.$scope.paymentProfiles = null;

    this.$scope.loading = false;

    this.$scope.hours = Array.from(new Array(24), (_, index) => index);
    this.$scope.minutes = Array.from(new Array(60), (_, index) => index);

    this.storage = storageService.read();
    this.timeSelections = this.uiService.getTimeSelections();

    const currencies = TransactionService.getSupportedCurrencies();
    const localizationSettings = uiService.getLocalizationSettings(window.navigator);

    currencies.sort((a, b) => {
      if (a.id === localizationSettings.currency) {
        return -1;
      } else if (b.id === localizationSettings.currency) {
        return 1;
      } else {
        return a.label.localeCompare(b.label);
      }
    });
    this.$scope.currencies = currencies;
    this.run();
  }

  run() {
    this.$scope.uiReady = false;

    this.$scope.$parent.ready.then(() => {
      return this.eventService.read(this.storage.auth.idToken, this.$state.params.eventId).then((event) => {
        const paymentProfileFuture = this.organizationService.getPaymentProfiles(this.storage.auth.idToken, event.organizationId);
        const consentFuture = this.assetService.search(this.storage.auth.idToken, {
          entityId: event.organizationId,
          entityType: this.assetService.ORGANIZATION_TYPE,
          assetType: [this.assetService.GOOGLE_CLOUD_STORAGE_CONSENT_PDF, this.assetService.ORGANIZATION_CONSENT_TEXT],
          order: '-timeCreated'
        });

        if (event.timeStart === null) {
          this.$scope.timeStart = {
            time: null,
            hour: null,
            minute: null
          };
        } else {
          this.$scope.timeStart = {
            time: new Date(event.timeStart)
          };

          this.$scope.timeStart.hour = this.$scope.timeStart.time.getHours();
          this.$scope.timeStart.minute = this.$scope.timeStart.time.getMinutes();
        }

        if (event.timeEnd === null) {
          this.$scope.timeEnd = {
            time: null,
            hour: null,
            minute: null
          };
        } else {
          this.$scope.timeEnd = {
            time: new Date(event.timeEnd)
          };

          this.$scope.timeEnd.hour = this.$scope.timeEnd.time.getHours();
          this.$scope.timeEnd.minute = this.$scope.timeEnd.time.getMinutes();
        }

        if (event.facebookEventId !== null) {
          event.facebookEventId = 'https://facebook.com/events/' + event.facebookEventId;
        }

        this.$scope.event = event;

        return Promise.all([consentFuture, paymentProfileFuture]).then(resolve => {
          this.$scope.consentAssets = resolve[0].entity;
          this.$scope.paymentProfiles = resolve[1];
        });
      }, () => {
        this.uiService.notify('Unable to find event');
      });
    }).then(() => {}, () => {})
      .then(() => {
        this.$scope.uiReady = true;
        this.$timeout();
      });
  }

  submit(event, timeStart, timeEnd) {
    this.$scope.loading = true;
    const eventCopy = angular.copy(event);

    const invalidPaymentDetails = (eventCopy.currency === null && eventCopy.paymentProfileId !== null) ||
      (eventCopy.currency !== null && eventCopy.paymentProfileId === null);

    if (timeStart.time === null) {
      eventCopy.timeStart = null;
    } else {
      const date = new Date(timeStart.time);

      if (timeStart.hour === null) {
        date.setHours(0);
      } else {
        date.setHours(timeStart.hour);
      }

      if (timeStart.minute === null) {
        date.setMinutes(0);
      } else {
        date.setMinutes(timeStart.minute);
      }

      eventCopy.timeStart = date.getTime();
    }

    if (timeEnd.time === null) {
      eventCopy.timeEnd = null;
    } else {
      const date = new Date(timeEnd.time);

      if (timeEnd.hour === null) {
        date.setHours(0);
      } else {
        date.setHours(timeEnd.hour);
      }

      if (timeEnd.minute === null) {
        date.setMinutes(0);
      } else {
        date.setMinutes(timeEnd.minute);
      }

      eventCopy.timeEnd = date.getTime();
    }

    for (let key of ['facebookEventId', 'twitterUrl', 'websiteUrl', 'previewImageUrl']) {
      if (eventCopy[key] === '') {
        eventCopy[key] = null;
      }
    }

    if (eventCopy.facebookEventId !== null) {
      const numberIndex = eventCopy.facebookEventId.search(new RegExp('\\d'));
      const eventId = eventCopy.facebookEventId.substring(numberIndex);
      eventCopy.facebookEventId = eventId;
    }

    if (invalidPaymentDetails) {
      this.uiService.notify('Payment Profile and currency are required');
      this.$scope.loading = false;
    } else if (eventCopy.timeEnd !== null && eventCopy.timeStart !== null && eventCopy.timeStart > eventCopy.timeEnd) {
      this.uiService.notify('Start Date / Time must be before End Date / Time');
      this.$scope.loading = false;
    } else {
      this.eventService.update(this.storage.auth.idToken, eventCopy).then(() => {
        this.$state.go('application.internal.event.read');
        this.uiService.notify('Event updated');
      }, (response) => {
        let message = 'Unable to update event';

        if (response.status === 409) {
          message = 'Sorry, that name has already been taken';
        } else if (response.status === 400) {

          if (typeof response.data === 'object' && response.data.error === 'subscription') {
            message = 'Sorry, you do not have enough subscriptions to update this event';
          }
        }

        this.uiService.notify(message);
      }).finally(() => {
        this.$scope.loading = false;
      });
    }
  }

  addConsentAcknowledgement(event) {
    this.$mdDialog.show({
      controller: 'CreateConsentAssetController',
      controllerAs: 'controller',
      template: createConsentPartial,
      clickOutsideToClose: true,
      locals: {
        organization: {id: event.organizationId},
        onAssetCreate: (asset) => {
          this.$scope.consentAssets.unshift(asset);

          if (this.$scope.consentAssets.length === 1) {
            this.$scope.event.entityAssetConsentId = asset.id;
          }
        }
      }
    });
  }

  createPaymentProfile() {
    const organizationTable = this.db.getSchema().table('Organization');
    const eventTable = this.db.getSchema().table('Event');

    this.db.select()
      .from(organizationTable)
      .innerJoin(eventTable, eventTable.organizationId.eq(organizationTable.id))
      .where(eventTable.id.eq(this.$state.params.eventId))
      .exec()
      .then((rows) => {
        const organization = Object.assign({}, rows[0].Organization);

        this.$mdDialog.show({
          controller: 'CreatePaymentProfileController',
          template: createPaymentProfilePartial,
          controllerAs: 'controller',
          clickOutsideToClose: true,
          locals: {
            organization: organization,
            onPaymentProfileCreate: (profile) => {
              this.$scope.paymentProfiles.push(profile);
              this.$scope.event.paymentProfileId = profile.id;
              this.$timeout();
            }
          }
        });
      });
  }
}

UpdateEventController.$inject = [
  '$timeout',
  '$scope',
  '$state',
  '$mdDialog',
  'StorageService',
  'EventService',
  'AssetService',
  'OrganizationService',
  'UIService',
  'db'
];