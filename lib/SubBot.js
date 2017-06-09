"use strict"

const request = require("request");
const _UniversalBot = require("./_UniversalBot")._UniversalBot;

class SubBot extends _UniversalBot {
  constructor(connector, defaultDialog, libraryName) {
    super(connector, defaultDialog, libraryName);
  }

  startServer(config) {
    super.startServer(config);
    this._server.post('/api/messages', this._connector.listen());
  }

  _register(masterUrl, sub) {
    var options =  {
      uri : masterUrl,
      method : 'POST',
      json : sub 
    };

    return new Promise((resolve, reject) => {
      request(options, (err, res, body) => {
        resolve(res);
      });
    });
  }

  registerSharedCredentials(masterUrl, endpoint, appId, appPassword, intents) {
    var sub = {
      intents : intents,
      credentials : {
        type : "sharedCredentials",
        endpoint : endpoint,
        appId : appId,
        appPassword : appPassword
      }
    }
    return this._register(masterUrl, sub);
  }

  registerDirectLine(masterUrl, secret, intents) {
    var sub = {
      intents : intents,
      credentials : {
        type : "directLine",
        secret : secret
      }
    }
    return this._register(masterUrl, sub);
  }
}

module.exports = {
  UniversalSubBot : SubBot  
}
