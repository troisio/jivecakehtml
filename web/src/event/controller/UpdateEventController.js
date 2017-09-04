import angular from 'angular';

export default class UpdateEventController {
  constructor(
    $q,
    $scope,
    $state,
    $mdDialog,
    storageService,
    eventService,
    assetService,
    organizationService,
    permissionService,
    paymentProfileService,
    uiService,
    db,
    Permission
  ) {
    this.$q = $q;
    this.$scope = $scope;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.eventService = eventService;
    this.assetService = assetService;
    this.organizationService = organizationService;
    this.permissionService = permissionService;
    this.paymentProfileService = paymentProfileService;
    this.uiService = uiService;
    this.db = db;
    this.Permission = Permission;

    this.$scope.currentDate = new Date();
    this.$scope.paymentProfiles = null;

    this.$scope.loading = false;

    this.$scope.hours = Array.from(new Array(24), (_, index) => index);
    this.$scope.minutes = Array.from(new Array(60), (_, index) => index);

    this.storage = storageService.read();
    this.timeSelections = this.uiService.getTimeSelections();

    this.run();
  }

  run() {
    this.$scope.uiReady = false;

    this.$scope.$parent.ready.then(() => {
      const permissionTable = this.db.getSchema().table('Permission');

      return this.db.select()
        .from(permissionTable)
        .where(permissionTable.objectClass.eq('Organization'))
        .exec()
        .then(rows => {
          const hasPermission = new this.Permission().has;
          this.$scope.organizationIds = rows.filter(row => hasPermission.call(row, this.permissionService.READ))
            .map(row => row.objectId);

          return this.eventService.read(this.storage.auth.idToken, this.$state.params.eventId).then((event) => {
            const paymentProfileFuture = this.paymentProfileService.search(this.storage.auth.idToken, {
              organizationId: event.organizationId
            });
            const organizationFuture = this.organizationService.read(this.storage.auth.idToken, event.organizationId);
            const consentFuture = this.assetService.search(this.storage.auth.idToken, {
              entityId: event.organizationId,
              entityType: this.assetService.ORGANIZATION_TYPE,
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

            return this.$q.all({
              consent: consentFuture,
              paymentProfile: paymentProfileFuture,
              organization: organizationFuture
            }).then(resolve => {
              this.$scope.consentAssets = resolve.consent.entity;
              this.$scope.organization = resolve.organization;
              this.$scope.paymentProfiles = resolve.paymentProfile.entity;
            });
          }, () => {
            this.uiService.notify('Unable to find event');
          });
        });
    }).then(() => {
      this.$scope.uiReady = true;
    }, () => {
      this.$scope.uiReady = true;
    });
  }

  createPaymentProfile() {
    this.$mdDialog.show({
      controller: 'CreatePaymentProfileController',
      templateUrl: '/src/payment/profile/partial/create.html',
      controllerAs: 'controller',
      clickOutsideToClose: true,
      locals: {
        organization: this.$scope.organization,
        onPaymentProfileCreate: (profile) => {
          this.$scope.paymentProfiles.push(profile);
        }
      }
    }).finally(() => {
      this.$scope.ready.then(() => {
        const readOrganizationIds = this.$scope.organizationIds;

        this.paymentProfileService.search(this.storage.auth.idToken, {
          organizationId: readOrganizationIds
        }).then(search => {
          this.$scope.paymentProfiles = search.entity;

          if (this.$scope.paymentProfiles.length > 0) {
            this.$scope.event.paymentProfileId = this.$scope.paymentProfiles[0].id;
          }
        });
      });
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
      templateUrl: '/src/organization/partial/createConsentAsset.html',
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
}

UpdateEventController.$inject = [
  '$q',
  '$scope',
  '$state',
  '$mdDialog',
  'StorageService',
  'EventService',
  'AssetService',
  'OrganizationService',
  'PermissionService',
  'PaymentProfileService',
  'UIService',
  'db',
  'Permission'
];