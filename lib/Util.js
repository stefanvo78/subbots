"use strict";

const request = require("request");

function _refreshToken(id, pass) {
  return new Promise((resolve, reject) => {
    var opts = {
      uri : "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      form : {
        grant_type: 'client_credentials',
        client_id: id,
        client_secret: pass,
        scope: "https://graph.microsoft.com/.default"
      },
      method : "POST"
    };
    request(opts, (err, response, body) => {
      err ? reject(err) : resolve(response);
    })
  });
}

var _tokens = {};
function _getBearerToken(id, pass) {
  if (!(id in _tokens) || _tokens[id].expiry < Date.now()) {
    return new Promise((resolve, reject) => {
      _refreshToken(id, pass)
      .then((response) => {
        if (response.statusCode == 200) {
          let body = JSON.parse(response.body);
          _tokens[id] = { 
            expiry : Date.now() + (body.expires_in * 1000), 
            token : body.access_token 
          };
          resolve(_tokens[id].token);
        }
        else {
          reject(response.body);
        }
      });
    });
  }
  else {
    return new Promise((resolve, reject) => {
      resolve(_tokens[id].token);
    });
  }
  }

function authenticatedRequest(opts, id, pass) {
  return new Promise((resolve, reject) => {
    _getBearerToken(id, pass)
    .then((token) => {
      opts.headers = {
        Authorization : `Bearer ${token}`
      };
      request(opts, (err, response) => {
        err ? reject(err) : resolve(response);
      });
    });
  });
}

module.exports = {
  authenticatedRequest : authenticatedRequest
}