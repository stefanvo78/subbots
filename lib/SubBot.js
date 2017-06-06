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

  register(masterUrl, endpoint, intents) {
    var options =  {
      uri : masterUrl,
      method : 'POST',
      json : { 
        endpoint : endpoint, 
        intents : intents.map((i) => { return i.toJSON() }) 
      }
    };

    request(options, (err, res, body) => {
    });
  }
}

module.exports = {
  UniversalSubBot : SubBot  
}
