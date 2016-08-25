export default class FeatureService {
  constructor($http, settings, toolsService, OrganizationFeature) {
    this.$http = $http;
    this.settings = settings;
    this.OrganizationFeature = OrganizationFeature;
    this.toolsService = toolsService;
    this.settings = settings;
  }

  create(token, id, feature) {
    const url = [this.settings.jivecakeapi.uri, 'organization', id, 'feature'].join('/');

    return this.$http.post(url, feature, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      return this.toObject(response.data);
    });
  }

  delete(token, id) {
    const url = [this.settings.jivecakeapi.uri, 'feature', id].join('/');

    return this.$http.delete(url, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }

  search(token, params) {
    const url = [this.settings.jivecakeapi.uri, 'feature'].join('/');
    return this.$http.get(url, {
      headers: {
        Authorization: 'Bearer ' + token
      },
      params: params
    }).then((response) => {
      return {
        entity: response.data.entity.map(this.toObject, this),
        count: response.data.count
      };
    });
  }

  createOrganizationFeature(token, id, feature) {
    const url = [this.settings.jivecakeapi.uri, 'feature', 'organization', id].join('/');

    return this.$http.post(url, feature, {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then((response) => {
      const implementation = this.getImplementation(response.data);
      return this.toolsService.toObject(response.data, implementation);
    });
  }

  toObject(subject) {
    const implementation = this.getImplementation(subject);
    return this.toolsService.toObject(subject, implementation);
  }

  getOrganizationEventFeature() {
    return 0;
  }

  getImplementation(subject) {
    let result;

    if ('organizationId' in subject) {
      result = this.OrganizationFeature;
    }

    return result;
  }
}

FeatureService.$inject = ['$http', 'settings', 'ToolsService', 'OrganizationFeature'];