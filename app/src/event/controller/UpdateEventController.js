export default class UpdateEventController {
  constructor(
    angular,
    $window,
    $q,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $mdDialog,
    storageService,
    eventService,
    organizationService,
    paymentProfileService,
    uiService
  ) {
    this.angular = angular;
    this.$window = $window;
    this.$q = $q;
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.$mdDialog = $mdDialog;
    this.eventService = eventService;
    this.organizationService = organizationService;
    this.paymentProfileService = paymentProfileService;
    this.uiService = uiService;

    this.$scope.currentDate = new this.$window.Date();
    this.$scope.paymentProfiles = null;

    this.$scope.loading = false;

    this.$scope.hours = this.$window.Array.from(new this.$window.Array(24), (_, index) => index);
    this.$scope.minutes = this.$window.Array.from(new this.$window.Array(60), (_, index) => index);

    this.storage = storageService.read();
    this.timeSelections = this.uiService.getTimeSelections();
    this.run();
  }

  run() {
    this.$scope.uiReady = false;

    this.$scope.$parent.ready.then((resolve) => {
      const readOrganizationIds = resolve.permission.entity.filter((permission) => {
        return permission.objectClass === this.organizationService.getObjectClassName() &&
               permission.has(this.organizationService.getReadPermission());
      }).map(function(permission) {
        return permission.objectId;
      });

      this.$scope.organizationIds = readOrganizationIds;

      this.eventService.read(this.storage.auth.idToken, this.$stateParams.eventId).then((event) => {
        const paymentProfileFuture = this.paymentProfileService.search(this.storage.auth.idToken, {
          organizationId: event.organizationId
        });
        const organizationFuture = this.organizationService.read(this.storage.auth.idToken, event.organizationId);

        if (event.timeStart === null) {
          this.$scope.timeStart = {
            time: null,
            hour: null,
            minute: null
          };
        } else {
          this.$scope.timeStart = {
            time: new this.$window.Date(event.timeStart)
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
            time: new this.$window.Date(event.timeEnd)
          };

          this.$scope.timeEnd.hour = this.$scope.timeEnd.time.getHours();
          this.$scope.timeEnd.minute = this.$scope.timeEnd.time.getMinutes();
        }

        this.$scope.minimumTimeBetweenTransactionTransferEnabled = event.minimumTimeBetweenTransactionTransfer > -1;

        this.$scope.event = event;

        return this.$q.all({
          paymentProfile: paymentProfileFuture,
          organization: organizationFuture
        }).then(resolve => {
          this.$scope.organization = resolve.organization;
          this.$scope.paymentProfiles = resolve.paymentProfile.entity;
        });
      }, () => {
        this.uiService.notify('Unable to find event');
      }).finally(() => {
        this.$scope.uiReady = true;
      });
    });
  }

  createPaymentProfile() {
    this.$mdDialog.show({
      controller: 'CreatePaymentProfileController',
      templateUrl: '/src/payment/profile/partial/create.html',
      clickOutsideToClose: true,
      locals: {
        organization: this.$scope.organization
      }
    }).finally(() => {
      this.$scope.ready.then((resolve) => {
        const readOrganizationIds = resolve.permission.entity.filter((permission) => {
          return permission.objectClass === this.organizationService.getObjectClassName() &&
                 permission.has(this.organizationService.getReadPermission());
        }).map(function(permission) {
          return permission.objectId;
        });

        this.paymentProfileService.search(this.storage.auth.idToken, {
          organizationId: readOrganizationIds
        }).then((search) => {
          this.$scope.paymentProfiles = search.entity;

          if (this.$scope.paymentProfiles.length > 0) {
            this.$scope.event.paymentProfileId = this.$scope.paymentProfiles[0].id;
          }
        });
      });
    });
  }

  submit(event, timeStart, timeEnd, minimumTimeBetweenTransactionTransferEnabled) {
    this.$scope.loading = true;
    const eventCopy = this.angular.copy(event);

    if (!minimumTimeBetweenTransactionTransferEnabled) {
      eventCopy.minimumTimeBetweenTransactionTransfer = -1;
    }

    if (timeStart.time === null) {
      eventCopy.timeStart = null;
    } else {
      const date = new this.$window.Date(timeStart.time);

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
      const date = new this.$window.Date(timeEnd.time);

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

    if (eventCopy.timeEnd !== null && eventCopy.timeStart !== null && eventCopy.timeStart > eventCopy.timeEnd) {
      this.uiService.notify('Start Date / Time must be before End Date / Time');
      this.$scope.loading = false;
    } else {
      this.eventService.update(this.storage.auth.idToken, eventCopy).then((event) => {
        this.$scope.event = event;
        this.$rootScope.$broadcast('EVENT.UPDATED', event);
        this.uiService.notify('Event updated');

        this.$state.go('application.internal.event.read', {
          organizationId: event.organizationId
        });
      }, (response) => {
        let message;

        if (response.status === 409) {
          message = 'Sorry, that name has already been taken';
        } else {
          message = 'Unable to update event';
        }

        this.uiService.notify(message);
      }).finally(() => {
        this.$scope.loading = false;
      });
    }
  }
}

UpdateEventController.$inject = [
  'angular',
  '$window',
  '$q',
  '$rootScope',
  '$scope',
  '$state',
  '$stateParams',
  '$mdDialog',
  'StorageService',
  'EventService',
  'OrganizationService',
  'PaymentProfileService',
  'UIService'
];