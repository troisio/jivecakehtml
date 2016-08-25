export default {
  oauth: {
    auth0: {
      domain: '$AUTH0DOMAIN',
      client_id: '$AUTH0CLIENTID'
    }
  },
  jivecakeapi: {
    uri: '$APIURI'
  },
  google: {
    analytics: {
      enabled: $GA_ENABLED
    }
  },
  paypal: {
    mock: $PAYPALMOCK
  }
};