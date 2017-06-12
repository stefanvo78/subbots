"use strict";

const request = require("request");

class TokenCache {
  constructor() {
    this._tokens = {};
  }

  _requestToken(id, pass) {
    return new Promise((resolve, reject) => {
      let uri = "https://login.microsoftonline.com/botframework.com/oauth2/v2.0/token";
      let body = `grant_type=client_credentials&client_id=${id}&client_secret=${pass}&scope=https%3A%2F%2Fapi.botframework.com%2F.default`;

      var opts = {
        uri : uri,
        body : body,
        method : "POST"
      };

      request(opts, (err, response, body) => {
        err ? reject(err) : resolve(response);
      })
    });
  }

  get(appId, pass) {
    if (!(appId in this._tokens)) {
      return new Promise((resolve, reject) => {
        this._requestToken(appId, pass)
        .then((response) => {
          if (response.statusCode == 200) {
            let body = JSON.parse(response.body);
            this._tokens[appId] = { expiry : null, token : body.access_token };
            resolve(this._tokens[appId].token);
          }
          else {
            reject(response.body);
          }
        });
      });
    }
    else {
      return new Promise((resolve, reject) => {
        resolve(this._tokens[appId])
      });
    }
  }
}

module.exports = {
  TokenCache : TokenCache
}