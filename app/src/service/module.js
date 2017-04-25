import AccessService from './AccessService';
import ApplicationService from './ApplicationService';
import AssetService from './AssetService';
import Auth0Service from './Auth0Service';
import ConnectionService from './ConnectionService';
import EventService from './EventService';
import ItemService from './ItemService';
import TransactionService from './TransactionService';
import NotificationService from './NotificationService';
import OrganizationService from './OrganizationService';
import Paging from './Paging';
import PaymentProfileService from './PaymentProfileService';
import PaypalService from './PaypalService';
import PermissionService from './PermissionService';
import RelationalService from './RelationalService';
import StorageService from './StorageService';
import StripeService from './StripeService';
import ToolsService from './ToolsService';
import UIService from './UIService';
import UserService from './UserService';

export default angular.module('jivecakeservice', [])
  .service('AccessService', AccessService)
  .service('ApplicationService', ApplicationService)
  .service('AssetService', AssetService)
  .service('Auth0Service', Auth0Service)
  .service('ConnectionService', ConnectionService)
  .service('EventService', EventService)
  .service('ItemService', ItemService)
  .service('TransactionService', TransactionService)
  .service('NotificationService', NotificationService)
  .service('OrganizationService', OrganizationService)
  .constant('Paging', Paging)
  .service('PaymentProfileService', PaymentProfileService)
  .service('PaypalService', PaypalService)
  .service('PermissionService', PermissionService)
  .service('RelationalService', RelationalService)
  .service('StorageService', StorageService)
  .service('StripeService', StripeService)
  .service('ToolsService', ToolsService)
  .service('UIService', UIService)
  .service('UserService', UserService);