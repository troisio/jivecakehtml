export default class CreateOrganizationInvitationController {
  constructor(
    $timeout,
    $scope,
    $mdDialog,
    organizationInvitationService,
    storageService,
    permissionService,
    uiService,
    OrganizationInvitation,
    organization
  ) {
    this.$timeout = $timeout;
    this.$scope = $scope;
    this.$scope.$mdDialog = $mdDialog;
    this.organizationInvitationService = organizationInvitationService;
    this.storageService = storageService;
    this.permissionService = permissionService;
    this.uiService = uiService;
    this.organization = organization;

    this.$scope.invitation = new OrganizationInvitation();
    this.$scope.invitation.include = this.permissionService.INCLUDE;
    this.$scope.read = true;
    this.$scope.write = false;
    this.$scope.showForm = true;
    this.$scope.showConfirmation = false;
    this.$scope.loading = false;
  }

  submit(invitation, read, write) {
    invitation.permissions = [];

    if (invitation.include !== 0) {
      if (read) {
        invitation.permissions.push(this.permissionService.READ);
      }

      if (write) {
        invitation.permissions.push(this.permissionService.WRITE);
      }
    }

    const storage = this.storageService.read();

    this.$scope.loading = true;

    this.organizationInvitationService.create(
      storage.auth.idToken,
      this.organization.id,
      invitation
    ).then((response) => {
      if (response.status === 409) {
        this.uiService.notify('A user with this email is part of your organization already');
      } else if (response.status === 200) {
        this.$scope.showForm = false;
        this.$scope.showConfirmation = true;
      } else {
        this.uiService.notify('Unable to invite user');
      }
    }, () => {
      this.uiService.notify('Unable to invite user');
    })
    .then(() => {}, () => {})
    .then(() => {
      this.$scope.loading = false;
      this.$timeout();
    });
  }
}

CreateOrganizationInvitationController.$inject = [
  '$timeout',
  '$scope',
  '$mdDialog',
  'OrganizationInvitationService',
  'StorageService',
  'PermissionService',
  'UIService',
  'OrganizationInvitation',
  'organization'
];