import AccessService from './AccessService';
import ApplicationService from './ApplicationService';
import Auth0Service from './Auth0Service';
import ConnectionService from './ConnectionService';
import EventService from './EventService';
import FeatureService from './FeatureService';
import ItemService from './ItemService';
import TransactionService from './TransactionService';
import NotificationService from './NotificationService';
import OrganizationService from './OrganizationService';
import Paging from './Paging';
import PaymentProfileService from './PaymentProfileService';
import PaymentService from './PaymentService';
import PaypalService from './PaypalService';
import PermissionService from './PermissionService';
import RelationalService from './RelationalService';
import StorageService from './StorageService';
import SubscriptionService from './SubscriptionService';
import ToolsService from './ToolsService';
import UIService from './UIService';

export default angular.module('jivecakeservice', [])
  .service('AccessService', AccessService)
  .service('ApplicationService', ApplicationService)
  .service('Auth0Service', Auth0Service)
  .service('ConnectionService', ConnectionService)
  .service('EventService', EventService)
  .service('FeatureService', FeatureService)
  .service('ItemService', ItemService)
  .service('ItemTransactionService', TransactionService)
  .service('NotificationService', NotificationService)
  .service('OrganizationService', OrganizationService)
  .constant('Paging', Paging)
  .service('PaymentProfileService', PaymentProfileService)
  .service('PaymentService', PaymentService)
  .service('PaypalService', PaypalService)
  .service('PermissionService', PermissionService)
  .service('RelationalService', RelationalService)
  .service('StorageService', StorageService)
  .service('SubscriptionService', SubscriptionService)
  .service('ToolsService', ToolsService)
  .service('UIService', UIService);