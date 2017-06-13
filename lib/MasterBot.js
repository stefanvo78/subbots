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

    this._server.get(
      ':originalChannel/v3/botstate/:channel/conversations/:conversationId/users/:userId', 
      this._getPrivateConversationData.bind(this)
    );
    this._server.get(
      ':originalChannel/v3/botstate/:channel/conversations/:conversationId', 
      this._getConversationData.bind(this)
    );
    this._server.get(
      ':originalChannel/v3/botstate/:channel/users/:userId',
      this._getUserData.bind(this)
    );

    this._server.post(
      ':originalChannel/v3/botstate/:channel/conversations/:conversationId/users/:userId', 
      this._getPrivateConversationData.bind(this)
    );
    this._server.post(
      ':originalChannel/v3/botstate/:channel/conversations/:conversationId', 
      this._getConversationData.bind(this)
    );
    this._server.post(
      ':originalChannel/v3/botstate/:channel/users/:userId',
      this._getUserData.bind(this)
    );

    this._server.post(
      ':originalChannel/v3/conversations/:conversationId/activities/:activityId',
      this._replyToActivity.bind(this)
    );

    return this._server;
  }

  _replyToActivity(req, res, next) {
    let oc = req.params.originalChannel;
    let uri = `https://${oc}.botframework.com/v3`;
    uri += `/conversations/${req.params.conversationId}/activities/${req.params.activityId}`
    var opts = {
      uri : uri,
      method : "POST",
      json : req.body,
      headers : {
        Authorization : req.headers["authorization"]
      }
    };
    request(opts, (err, response) => {
      res.end(JSON.stringify(response.body));
      next();
    });
  }

  _setUserData(req, res, next) {
    let oc = req.params.originalChannel;
    let uri = `https://state.botframework.com/v3/botstate/${oc}`;
    uri += `/users/${req.params.userId}`;
    var opts = {
      uri : uri,
      method : "POST",
      json : req.body,
      headers : {
        Authorization : req.headers["authorization"]
      }
    };
    request(opts, (err, response) => {
      res.end(response.body);
      next();
    });
  }

  _setConversationData(req, res, next) {
    let oc = req.params.originalChannel;
    let uri = `https://state.botframework.com/v3/botstate/${oc}`;
    uri += `/conversations/${req.params.conversationId}/users/${req.params.userId}`;
    var opts = {
      uri : uri,
      method : "POST",
      json : req.body,
      headers : {
        Authorization : req.headers["authorization"]
      }
    };
    request(opts, (err, response) => {
      res.end(response.body);
      next();
    });
  }

  _setPrivateConversationData(req, res, next) {
    let oc = req.params.originalChannel;
    let uri = `https://state.botframework.com/v3/botstate/${oc}`;
    uri += `/conversations/${req.params.conversationId}`;
    var opts = {
      uri : uri,
      method : "POST",
      json : req.body,
      headers : {
        Authorization : req.headers["authorization"]
      }
    };
    request(opts, (err, response) => {
      res.end(response.body);
      next();
    });
  }

  _getUserData(req, res, next) {
    let oc = req.params.originalChannel;
    let uri = `https://state.botframework.com/v3/botstate/${oc}`;
    uri += `/users/${req.params.userId}`;
    var opts = {
      uri : uri,
      method : "GET",
      headers : {
        Authorization : req.headers["authorization"]
      }
    };
    request(opts, (err, response) => {
      res.end(response.body);
      next();
    });
  }

  _getConversationData(req, res, next) {
    let oc = req.params.originalChannel;
    let uri = `https://state.botframework.com/v3/botstate/${oc}`;
    uri += `/conversations/${req.params.conversationId}/users/${req.params.userId}`;
    var opts = {
      uri : uri,
      method : "GET",
      headers : {
        Authorization : req.headers["authorization"]
      }
    };
    request(opts, (err, response) => {
      res.end(response.body);
      next();
    });
  }

  _getPrivateConversationData(req, res, next) {
    let oc = req.params.originalChannel;
    let uri = `https://state.botframework.com/v3/botstate/${oc}`;
    uri += `/conversations/${req.params.conversationId}`;
    var opts = {
      uri : uri,
      method : "GET",
      headers : {
        Authorization : req.headers["authorization"]
      }
    };
    request(opts, (err, response) => {
      res.end(response.body);
      next();
    });
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

  _addSubbot(sub) {
    sub.intents = intentFactory(sub.intents)
    this._subs.push(sub);
  }

  _deleteSubbot(appId) {
    this._subs = this._subs.filter((s) => {
      if (s.credentials.type == "sharedCredentials") {
        return !(s.credentials.appId == appId);
      }
      return true;
    });
  }

  _postSubbots(req, res, next) {
    var json = req.body;
    if (json) {
      this._addSubbot(json);
    }
    res.end();
    next();
  }

  _sendToSub(credentials, req) {

    var headers = {};

    if (credentials.type === "sharedCredentials") {
      req.body.serviceUrl = `https://43519276.ngrok.io/${req.body.channelId}`;
      req.body.channelId = "emulator";
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

  _isRouteableMessage(req) {
    if (req.body.type == 'message') {
      return !req.body.text.startsWith("/");
    }
    return true;
  }

  _routeMessage(req, res, next) {

    if (!req.body || !this._isRouteableMessage(req) || this._subs.length === 0) {
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

  handleSlashCommand(session) {
    let command = session.message.text.split(" ")[0];
    switch (command.toLowerCase()) {
      case "/addsub" : {
        let sub = session.message.text.substring(command.length);
        sub = sub.replace(/[\u201C\u201D]/g, '"');
        sub = JSON.parse(sub);
        this._addSubbot(sub);
        session.send("done");
      }
      break;

      case "/deletesub" : {
        let appId = session.message.text.split(" ")[1];
        this._deleteSubbot(appId);
        session.send("done");
      }
      break;

      case "/deletesubs" : {
        this._subs = [];
      }
      break;

      case "/listsubs" : 
      case "/showsubs" : {
        session.send("Listing subs:");
        if (this._subs.length > 0) {
          for (let sub of this._subs) {
            session.send(JSON.stringify(sub));
          }
        }
        else {
          session.send("No subs registered");
        }
      }
      break;
      
      default : {
        session.send("Unrecognised slash command");
      }
    }
  }
}

module.exports = {
  UniversalMasterBot : MasterBot
}
