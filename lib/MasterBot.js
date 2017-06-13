"use strict";

const request = require("request");
const _intents = require("./Intents");
const DirectLine = require("./DirectLine").DirectLine;
const TokenCache = require("./TokenCache").TokenCache;
const _UniversalBot = require("./_UniversalBot")._UniversalBot;

function intentFactory(intents) {
  let result = [];
  intents.forEach((intent) => {
    if (typeof intent === "string") {
      intent = JSON.parse(intent);
    }
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
    this._subs = [];
    this._tokenCache = new TokenCache();
    this._defaultHandler = this._connector.listen().bind(this._connector);
  }

  startServer(config) {
    super.startServer(config);
    this._server.get('/api/subbots', this._getSubbots.bind(this));
    this._server.post('/api/subbots', this._postSubbots.bind(this));
    this._server.post('/api/messages', this._routeMessage.bind(this));
    return this._server;
  }

  _getSubbots(req, res, next) {
    
    var subs = "<p>Current Subs</p>";
    if (this._subs.length > 0) {
      for (let sub of this._subs) {
        subs += JSON.stringify(sub);
      }
    }
    else {
      subs += "<p>There are currently no subs installed</p>";
    }

    let body = "<html><title>MasterBot Status</title><p>MasterBot</p></html>" + subs;
    res.writeHead(200, {
      'Content-Length': Buffer.byteLength(body),
      'Content-Type': 'text/html'
    });
    res.end(body);
    next();
  }

  _postSubbots(req, res, next) {
    var json = req.body;
    if (json) {
      var sub = json;
      sub.intents = intentFactory(sub.intents)
      this._subs.push(sub);
    }
    res.end();
    next();
  }

  _sendToSub(credentials, req) {

    var headers = {};

    if (credentials.type === "sharedCredentials") {
      return new Promise((resolve, reject) => {
        this._tokenCache.get(credentials.appId, credentials.appPassword)
        .then((token) => {
          request({
            uri: credentials.endpoint,
            method : 'POST',
            json : req.body,
            headers : { Authorization : `Bearer ${token}` }
          }, 
          (err, response, body) => {
            err ? reject(err) : resolve(response);
          })
        });
      });
    }
    else if (sub.type === "directLine") {
    }
    else {
      throw new Error("Unknown subtype");
    }
  }

  _routeMessage(req, res, next) {

    if (!req.body || req.body.type != 'message' || this._subs.length === 0) {
      this._defaultHandler(req, res, next);
      return;
    }

    let tasks = [];
    let message = req.body.text;
    this._subs.forEach((sub) => {
      sub.intents.forEach((intent) => {
        tasks.push(intent.score(message, sub.credentials));
      });
    });

    Promise.all(tasks)
    .then((results) => {
      var topIntent = results.reduce((prev, curr) => { 
        return prev[1].score < curr[1].score ? prev : curr; 
      });

      if (topIntent.score > 0) {
        this._sendToSub(topIntent.credentials, req)
        .then((response) => {
          if (response.statusCode >= 400) {
            console.warn("sendToSub:" + response.statusCode)
          }
        });
        res.end();
        next()
      }
      else {
        this._defaultHandler(req, res, next);
      }
    });
  }
};

module.exports = {
  UniversalMasterBot : MasterBot
}
