"use strict";

const _intents = require("./Intents");
const _UniversalBot = require("./_UniversalBot")._UniversalBot;

function intentFactory(intents) {
  let result = [];
  intents.forEach((intent) => {
    intent = JSON.parse(intent);
    switch (intent.type) {
      case 'luis' : {
        result.push(new _intents.LUISIntent(intent.appId, intent.appSecret));
      }
      break;

      case 'regex' : {
        result.push(new _intents.RegexIntent(intent.regex));
      }
      break;

      case 'keyword' : {
        result.push(new _intents.KeywordIntent(intent.keyword));
      }
      break;

      default : {
      }
    }
  });
  return result;
}

class MasterBot extends _UniversalBot {

  constructor(connector, defaultDialog, libraryName) {
    super(connector, defaultDialog, libraryName);
    this._subs = {};
    this._defaultHandler = this._connector.listen().bind(this._connector);
  }

  startServer(config) {
    super.startServer(config);
    this._server.post('/api/control', this._control.bind(this));
    this._server.post('/api/messages', this._routeMessage.bind(this));
  }

  _control(req, res, next) {
    
    var json = req.body;

    if (json) {
      var endpoint = json.endpoint;
      if (!(endpoint in Object.keys(this._subs))) {
        this._subs[endpoint] = [];
      }

      let intents = intentFactory(json.intents);
      this._subs[endpoint] = this._subs[endpoint].concat(intents);
    }
    res.end();
    next();
  }

  _sendToSub(endpoint, req) {

    var headers = {};
    headers.authorization = req.headers.authorization;

    return new Promise((resolve, reject) => {
      request({
        uri: uri,
        method : 'POST',
        json : req.body,
        headers : headers
      }, 
      (err, response, body) => {
        if (response) {
          console.log(response.statusCode);
          console.log(response.body);
        }
        resolve(response);
      })
    });
  }

  _routeMessage(req, res, next) {

    if (!req.body || req.body.type != 'message') {
      res.end();
      next();
      return;
    }

    let tasks = [];
    let message = req.body.text;
    for (let endpoint in this._subs) {
     this._subs[endpoint].forEach((intent) => {
        tasks.push(intent.score(message, endpoint));
      });
    }
    if (tasks.length > 0) {
      Promise.all(tasks)
      .then((results) => {
        var topIntent = results.reduce((prev, curr) => { 
          return prev[1].score < curr[1].score ? prev : curr; 
        });

        if (topIntent.score > 0) {
          _sendToSub(topIntent.endpoint, req)
        }
        else {
          this._defaultHandler(req, res, next);
        }
      });
    }
  }
};

module.exports = {
  UniversalMasterBot : MasterBot
}
