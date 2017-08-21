import request from 'request';
import Promise from 'promise';

export default class EventService {
  constructor(uri) {
    this.uri = uri;
  }

  getByHash(hash) {
    const path = [this.uri, 'event', 'search'].join('/');
    return new Promise((resolve, reject) => {
      request({
        method: 'GET',
        uri: path,
        qs: {
          hash: hash
        }
      }, function (error, response, body) {
        if (error === null) {
          if (response.statusCode === 200) {
            let searchResult =  null;
            let exception = null;

            try {
              searchResult = JSON.parse(body);
            } catch (e) {
              exception = e;
            }

            if (exception === null) {
              if (searchResult.entity.length === 0) {
                reject();
              } else {
                resolve(searchResult.entity[0]);
              }
            } else {
              reject(exception);
            }
          } else {
            reject(response);
          }
        } else {
          reject(error);
        }
      });
    });
  }
}