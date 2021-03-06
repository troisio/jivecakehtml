import viewEventPartial from '../partial/viewEvent.html';
import viewItemPartial from '../partial/viewItem.html';
import orderErrorPartial from '../partial/orderError.html';
import consentPartial from '../../organization/partial/consent.html';

export default class PublicEventController {
  constructor(
    $q,
    $state,
    $mdDialog,
    $timeout,
    auth0Service,
    downstreamService,
    $scope,
    eventService,
    transactionService,
    accessService,
    uiService,
    storageService,
    paypalService,
    stripeService,
    userService,
    StripePaymentProfile,
    PaypalPaymentProfile,
    Event,
    settings
  ) {
    this.$q = $q;
    this.$state = $state;
    this.$mdDialog = $mdDialog;
    this.$timeout = $timeout;
    this.auth0Service = auth0Service;
    this.downstreamService = downstreamService;
    this.$scope = $scope;
    this.eventService = eventService;
    this.transactionService = transactionService;
    this.accessService = accessService;
    this.uiService = uiService;
    this.storageService = storageService;
    this.paypalService = paypalService;
    this.stripeService = stripeService;
    this.userService = userService;
    this.StripePaymentProfile = StripePaymentProfile;
    this.PaypalPaymentProfile = PaypalPaymentProfile;
    this.Event = Event;
    this.settings = settings;

    this.$scope.selected = [];
    this.defaultAmountSize = uiService.getDefaultItemCartSelectionSize();
    this.$scope.time = new Date();

    this.setDefaultState();

    this.eventFuture = this.eventService.publicSearch({
      hash: this.$state.params.hash
    });

    this.$scope.$parent.ready.then(() => {}, () => {}).then(() => {
      this.run();
    });
  }

  run() {
    for (let promise of this.timeoutPromises) {
      this.$timeout.cancel(promise);
    }

    this.setDefaultState();

    const groupFuture = this.eventFuture.then((searchResult) => {
      const events = searchResult.entity;
      const storage = this.storageService.read();
      const accessToken = storage.auth === null ? null : storage.auth.accessToken;
      return events.length === 0 ? Promise.reject() : this.eventService.getAggregatedEventData(events[0].id, accessToken);
    });

    groupFuture.then((data) => {
      const group = this.getGroupData(data);

      group.itemData.sort((first, second) => {
        if (first.amountSelections.length === 1) {
          return 1;
        }

        if (second.amountSelections.length === 1) {
          return -1;
        }

        return first.item.name.localeCompare(second.item.name);
      });

      for (let itemData of group.itemData) {
        const canDisplayItem = (
          itemData.item.totalAvailible === null ||
          itemData.remainingTotalAvailibleTransactions > 0
        ) && (
          itemData.item.maximumPerUser === null ||
          itemData.remaingUserTransactions > 0
        );

        if (canDisplayItem) {
          this.$scope.hasAnySelections = true;
          break;
        }
      }

      const currentTime = new Date().getTime();
      const positiveTimes = group.itemData
        .filter(itemData => itemData.item.timeAmounts !== null)
        .reduce((array, itemData) => {
          array.push.apply(array, itemData.item.timeAmounts.map(timeAmount => timeAmount.after));
          return array;
        }, [])
        .map(time => time - currentTime)
        .filter(time => time <= 0x7FFFFFFF && time > 0 && !this.scheduledModificationTimes.has(time));

      for (let time of positiveTimes) {
        this.scheduledModificationTimes.add(time);
      }
      this.timeoutPromises = positiveTimes.map(time => {
        return this.$timeout(() => {
          this.uiService.notify('Updating data');
          this.run();
        }, time);
      });

      this.$scope.group = group;
    }, () => {
      this.uiService.notify('Unable to find the event you are looking for');
    })
    .then(() => {}, () => {})
    .then(() => {
      this.$scope.uiReady = true;
      this.$timeout();
    })
  }

  getGroupData(group) {
    const storage = this.storageService.read();
    const result = Object.assign({}, group);

    result.itemData = group.itemData.map((data) => {
      const itemData = Object.assign({}, data);
      const completeOrPendingTransactions = itemData.transactions.filter(this.transactionService.countingFilter);

      let remaingUserTransactions = null, remainingTotalAvailibleTransactions = null;

      if (storage.auth === null) {
        itemData.completOrPendingUserTransactions = null;
      } else {
        itemData.completOrPendingUserTransactions = itemData.transactions.filter(transaction => transaction.user_id === storage.auth.idTokenPayload.sub)
          .filter(this.transactionService.countingFilter);

        if (itemData.item.maximumPerUser !== null) {
          const total  = itemData.completOrPendingUserTransactions.reduce((previous, next) => previous + next.quantity, 0);
          remaingUserTransactions = itemData.item.maximumPerUser - total;
        }
      }

      if (itemData.item.totalAvailible !== null) {
        const total  = completeOrPendingTransactions.reduce((previous, next) => previous + next.quantity, 0);
        remainingTotalAvailibleTransactions = itemData.item.totalAvailible - total;
      }

      let amountSelectionSize;

      if (remainingTotalAvailibleTransactions === null && remaingUserTransactions === null) {
        amountSelectionSize = this.defaultAmountSize;
      } else if (remaingUserTransactions === null) {
        amountSelectionSize = remainingTotalAvailibleTransactions;
      } else if (remainingTotalAvailibleTransactions === null) {
        amountSelectionSize = remaingUserTransactions;
      } else {
        amountSelectionSize = Math.min(remaingUserTransactions, remainingTotalAvailibleTransactions);
      }

      amountSelectionSize = Math.min(
        amountSelectionSize,
        this.uiService.getMaximumItemCartSelectionSize()
      );

      itemData.remainingTotalAvailibleTransactions = remainingTotalAvailibleTransactions;
      itemData.remaingUserTransactions = remaingUserTransactions;
      itemData.selected = 0;
      itemData.amountSelections = amountSelectionSize > -1 ? Array.from(new Array(amountSelectionSize + 1), (item, index) => index): [0];
      itemData.completeOrPendingTransactions = completeOrPendingTransactions;

      return itemData;
    });

    return result;
  }

  itemIsBlocked(group, itemData) {
    const soldOut = itemData.remainingTotalAvailibleTransactions !== null && itemData.remainingTotalAvailibleTransactions < 1;
    const soldOutForUser = itemData.remaingUserTransactions !== null && itemData.remaingUserTransactions < 1;
    const hasCurrencyAndPaymentProfile = group.event.hasCurrencyAndPaymentProfile();

    return soldOut || soldOutForUser || !hasCurrencyAndPaymentProfile || group.profile === null;
  }

  showFirstNameAndLastName(group, auth) {
    let result;

    if (group.event.requireName) {
      if (auth === null) {
        result = true;
      } else if (this.profile !== null && this.userService.hasFirstAndLastName(this.profile)) {
        result = false;
      } else {
        result = true;
      }
    } else {
      result = false;
    }

    return result;
  }

  requiresLogin(group, itemData, auth) {
    const requiresAccount = group.event.requirePhoto ||
      group.event.assignIntegerToRegistrant ||
      itemData.item.requiresAccountForRegistration();

    return requiresAccount && auth === null  && !this.itemIsBlocked(group, itemData);
  }

  removePaypalFields() {
    const node = document.querySelector('#paypal-button');
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  showInformation(event, organization) {
    this.removePaypalFields();

    this.$mdDialog.show({
      controller: ['$sanitize', '$scope', 'event', 'organization', function($sanitize, $scope, event, organization) {
        $scope.event = event;
        $scope.organization = organization;
        $scope.time = new Date();
        $scope.$sanitize = $sanitize;
      }],
      template: viewEventPartial,
      clickOutsideToClose: true,
      locals: {
        event: event,
        organization: organization
      }
    });
  }

  processStripe(group, information) {
    const defer = this.$q.defer();
    const pk = this.settings.stripe.useAsMock ? this.settings.stripe.pk : group.profile.stripe_publishable_key;
    const total = group.itemData.reduce((sum, itemData) => itemData.selected * itemData.amount + sum, 0);

    const storage = this.storageService.read();
    const email = storage.auth === null ? information.email : storage.profile.email;

    const checkout = StripeCheckout.configure({
      name: group.event.name,
      key: pk,
      image: 'https://jivecake.com/assets/safari/apple-touch-120x120.png',
      locale: 'auto',
      zipCode: true,
      currency: group.event.currency,
      email: email,
      token: (token) => {
        this.uiService.notify('Processing your order...');
        const storage = this.storageService.read();
        const itemData = group.itemData
          .filter(itemData => itemData.selected > 0)
          .map(itemData => ({
            quantity: itemData.selected,
            entity: itemData.item.id
          }));

        const accessToken = storage.auth === null ? null : storage.auth.accessToken;
        const orderFuture = this.stripeService.order(accessToken, group.event.id, {
          token: token,
          data: {
            order: itemData,
            firstName: information.firstName,
            lastName: information.lastName,
            organizationName: information.organizationName,
            email: information.email
          }
        }).then(() => {
          if (accessToken === null) {
            this.$mdDialog.show(
              this.$mdDialog.confirm()
                .title('Your order has been processed. We will send you an email shortly.')
                .ariaLabel('Order Processed')
                .clickOutsideToClose(true)
                .ok('Ok')
            );
            this.run();
          } else {
            this.uiService.notify('Payment complete');

            this.downstreamService.cacheUserTransactions(storage.auth)
              .then(() => {}, () => {})
              .then(() => {
                this.$state.go('application.internal.myTransaction', {
                  user_id: storage.auth.idTokenPayload.sub
                });
              });
          }
        }, (response) => {
          if (response.status == 400 && Array.isArray(response.data)) {
            this.$mdDialog.show({
              controller: 'OrderErrorController',
              template: orderErrorPartial,
              clickOutsideToClose: true,
              locals: {
                errors: response.data
              }
            });
          } else {
            this.uiService.notify('Sorry, unable to process your order');
          }
        });

        orderFuture.then(() => {
          defer.resolve();
        });
      },
      closed: function () {
        defer.reject();
      }
    });

    checkout.open({
      name: 'JiveCake',
      description: 'Checkout',
      amount: total * 100
    });

    return defer.promise;
  }

  processPaypal(group, information) {
    this.removePaypalFields();

    const storage = this.storageService.read();
    const token = storage.auth === null ? null : storage.auth.accessToken;

    paypal.Button.render({
      env: this.settings.paypal.env,
      commit: true,
      payment: () => {
        return new Promise((resolve, reject) => {
          const itemData = group.itemData
            .filter(itemData => itemData.selected > 0)
            .map(itemData => ({
              quantity: itemData.selected,
              entity: itemData.item.id
            }));
          this.paypalService.generatePayment(token, group.event.id, {
            order: itemData,
            firstName: information.firstName,
            lastName: information.lastName,
            organizationName: information.organizationName,
            email: information.email
          }).then(data => {
            resolve(data.id);
          }, (response) => {
            if (response.status == 400 && Array.isArray(response.data)) {
              this.$mdDialog.show({
                controller: 'OrderErrorController',
                template: orderErrorPartial,
                clickOutsideToClose: true,
                locals: {
                  errors: response.data
                }
              });
            } else {
              this.uiService.notify('Sorry, we unable to process your order');
            }

            reject(response);
          });
        });
      },
      onAuthorize: (authorization) => {
        this.uiService.notify('Processing your order...');
        this.uiReady = false;

        const payload = Object.assign({
          firstName: information.firstName,
          lastName: information.lastName,
          email: information.email,
          organizationName: information.organizationName
        }, authorization);

        this.paypalService.execute(token, payload).then(() => {
          if (token === null) {
            this.$mdDialog.show(
              this.$mdDialog.confirm()
                .title('Thanks! Your order has been processed.')
                .ariaLabel('Order Processed')
                .clickOutsideToClose(true)
                .ok('Ok')
            );
            this.run();
          } else {
            this.uiService.notify('Payment complete');

            this.downstreamService.cacheUserTransactions(storage.auth)
              .then(() => {}, () => {})
              .then(() => {
                this.$state.go('application.internal.myTransaction', {
                  user_id: storage.auth.idTokenPayload.sub
                });
              });
          }
        }, () => {
          this.uiService.notify('Unable to complete payment');
        }).then(() => {
          this.uiReady = true;
        });
      }
    }, '#paypal-button');
  }

  submitInformation(group, information) {
    const passesConsent = group.event.entityAssetConsentId === null || this.$scope.hasConsented;

    if (passesConsent) {
      const hasPaidItem = group.itemData.filter(itemData => itemData.amount > 0 &&
        itemData.selected > 0).length > 0;

      const storage = this.storageService.read();

      let accountInformationFuture;

      if (this.showFirstNameAndLastName(group, storage.auth) && storage.auth !== null) {
        accountInformationFuture = this.auth0Service.updateUser(
          storage.auth.accessToken,
          storage.auth.idTokenPayload.sub,
          {
            email: storage.profile.email,
            user_metadata: {
              given_name: information.firstName,
              family_name: information.lastName
            }
          }
        ).then((profile) => {
          storage.profile = profile;
          this.storageService.write(storage);
        })
      } else {
        accountInformationFuture = Promise.resolve();
      }

      accountInformationFuture
        .then(() => {}, () => {})
        .then(() => {
          if (hasPaidItem) {
            if (group.profile instanceof this.StripePaymentProfile) {
              this.processStripe(group, information);
            } else if (group.profile instanceof this.PaypalPaymentProfile) {
              this.processPaypal(group, information);
            } else {
              throw new Error('invalid payment profile implementation');
            }
          } else {
            this.uiService.notify('Processing your order...');

            const unpaidFutures = group.itemData
              .filter(itemData => itemData.amount === 0 && itemData.selected > 0)
              .map((itemData) => {
                  return this.transactionService.purchase(
                    storage.auth.accessToken,
                    itemData.item.id,
                    {quantity: itemData.selected}
                  );
                }
              );

            Promise.all(unpaidFutures).then(() => {
              this.uiService.notify('Payment complete');
            }, () => {
              this.uiService.notify('We were not able to process all of your orders');
            }).then(() => {
              this.downstreamService.cacheUserTransactions(storage.auth)
                .then(() => {}, () => {})
                .then(() => {
                  this.$state.go('application.internal.myTransaction', {
                    user_id: storage.auth.idTokenPayload.sub
                  });
                });
            })
          }
        });
    } else {
      this.uiService.notify('Consent field not checked');
    }
  }

  goToInformationStep(group) {
    const totalSelected = group.itemData.reduce((sum, itemData) => itemData.selected + sum, 0);

    if (totalSelected === 0) {
      this.uiService.notify('No selection made');
    } else {
      this.$scope.isOnSelectionStep = false;
      this.$scope.isOnInformationStep = true;
    }
  }

  login() {
    this.accessService.oauthSignIn();
  }

  viewItem(item) {
    this.$mdDialog.show({
      controller: ['$scope', '$sanitize', 'item',  function($scope, $sanitize, item) {
        $scope.time = new Date();
        $scope.item = item;
        $scope.$sanitize = $sanitize;
      }],
      template: viewItemPartial,
      clickOutsideToClose: true,
      locals: {
        item: item
      }
    });
  }

  showAsset($event, asset) {
    this.$mdDialog.show({
      targetEvent: $event,
      controller: ['$scope', function($scope) {
        $scope.text = atob(asset.data);
      }],
      template: consentPartial,
      clickOutsideToClose: true
    });
  }

  mustUpdateAccountName(group, auth) {
    let result;

    if (auth === null) {
      result = true;
    } else {
      result = group.event.requireName && (this.profile === null || !this.userService.hasFirstAndLastName(this.profile));
    }

    return result;
  }

  setDefaultState() {
    this.timeoutPromises = [];

    const storage = this.storageService.read();
    this.$scope.auth = storage.auth;
    this.profile = storage.profile;

    this.$scope.uiReady = false;
    this.$scope.hasAnySelections = false;
    this.scheduledModificationTimes = new Set();
    this.$scope.isOnSelectionStep = true;
    this.$scope.isOnInformationStep = false;
    this.$scope.hasConsented = false;

    this.$scope.information = {
      firstName: '',
      lastName: '',
      email: ''
    };

    /*
      These defaults are set to prevent the UI
      from 'flashing' elements with an ng-show condition
      todo: stop using angular :(
    */

    const defaultEvent = new this.Event();
    defaultEvent.currency = 'USD';
    defaultEvent.paymentProfileId = '';

    this.$scope.group = {
      event: defaultEvent,
      profile: {}
    };
  }

  cancel() {
    this.$scope.isOnSelectionStep = true;
    this.$scope.isOnInformationStep = false;

    this.removePaypalFields();
  }

  onEmailClicked(organization) {
    this.$mdDialog.show({
      controller: ['$scope', 'organization', ($scope, organization) => {
        $scope.organization = organization;
      }],
      template: '<div layout-padding>Event contact: {{organization.email}}</div>',
      clickOutsideToClose: true,
      locals: {
        organization: organization
      }
    });
  }
}

PublicEventController.$inject = [
  '$q',
  '$state',
  '$mdDialog',
  '$timeout',
  'Auth0Service',
  'DownstreamService',
  '$scope',
  'EventService',
  'TransactionService',
  'AccessService',
  'UIService',
  'StorageService',
  'PaypalService',
  'StripeService',
  'UserService',
  'StripePaymentProfile',
  'PaypalPaymentProfile',
  'Event',
  'settings'
];