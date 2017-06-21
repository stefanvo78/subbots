"use strict";

const uuid = require("uuid");
const request = require("request");
const _intents = require("./Intents");
const DirectLine = require("./DirectLine").DirectLine;
const _UniversalBot = require("./_UniversalBot")._UniversalBot;
const BotStateProxy = require("./BotStateProxy").BotStateProxy;
const utils = require("./Util")

class SubBot {
  constructor(endpoint, appId, appPassword, intents) {
    this._endpoint = endpoint;
    this._appId = appId;
    this._appPassword = appPassword;
    this._intents = intents;
  }
  static fromJSON(json) {
    let creds = json.credentials;
    let intents = _intents.intentFactory(json.intents)
    return new SubBot(creds.endpoint, creds.appId, creds.appPassword, intents);
  }
  uid() {
    return this._appId;
  }
  intents(intentType) {
    if (intentType) {
      return this._intents.filter((i) => {
        return (i instanceof intentType);
      });
    }
    return this._intents;
  }
}

class ConversationMapper {
  constructor() {
    this._conversations = {};
  }

  create(convId, subId) {
    if (!(convId in this._conversations)) {
      this._conversations[convId] = {};
    }
    if (!(subId in this._conversations[convId])) {
      this._conversations[convId][subId] = uuid.v4();
    }
    return this._conversations[convId][subId];
  }

  reverseLookup(convId) {
    for (let cid in this._conversations) {
      for (let subId in this._conversations[cid]) {
        if (this._conversations[cid][subId] == convId) {
          return { convId : cid, subId : subId };
        }
      }
    }
    return null;
  }
}

class MasterBot extends _UniversalBot {

  constructor(connector, defaultDialog, libraryName) {
    super(connector, defaultDialog, libraryName);
    this._subs = {};
    this._appId = connector.settings.appId;
    this._appPassword = connector.settings.appPassword;
    this._tokens = {};
    this._defaultHandler = this._connector.listen().bind(this._connector);
    this._focus = {};
    this._conversationMapper = new ConversationMapper();
  }

  startServer(config) {

    super.startServer(config);
    this._serviceURL = `https://${config.WEBSITE_HOSTNAME}`;

    this._server.post('/api/subbots', this._postSubbots.bind(this));
    this._server.post('/api/messages', this._routeMessage.bind(this));

    this._botStateProxy = new BotStateProxy(this._server);

    this._server.post(
      ':originalChannel/v3/conversations/:conversationId/activities/:activityId',
      this._replyToActivity.bind(this)
    );

    return this._server;
  }

  _replyToActivity(req, res, next) {
    let oc = req.params.originalChannel;
    let uri = `https://${oc}.botframework.com/v3`;
    let conv = this._conversationMapper.reverseLookup(req.params.conversationId);
    if (conv) {
      uri += `/conversations/${conv.convId}/activities/${req.params.activityId}`
      var opts = { uri : uri, method : "POST", json : req.body };
      if (req.body.inputHint === "expectingInput") {
        this._focus[conv.convId] = conv.subId;
      }
      else {
        delete this._focus[conv.convId];
      }
      utils.authenticatedRequest(opts, this._appId, this._appPassword)
      .then((response) => {
        res.end(JSON.stringify(response.body));
        next();
      });
      return;
    }
    console.warn("Reply in unknown conversation");
  }

  _addSubbot(json) {
    let sub = SubBot.fromJSON(json);
    this._subs[sub.uid()] = sub;
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
    res.end("done");
    next();
  }

  _sendToSub(sub, req) {
    return new Promise((resolve, reject) => {

      req.body.conversation.id = this._conversationMapper.create(req.body.conversation.id, sub.uid());
      req.body.serviceUrl = `${this._serviceURL}/${req.body.channelId}`;
      req.body.channelId = "emulator";


      let opts = {
        uri: sub._endpoint,
        method : 'POST',
        json : req.body,
      };
      
      utils.authenticatedRequest(opts, sub._appId, sub._appPassword)
      .then((response) => {
        resolve(response);
      });
    });
  }

 _isRouteableMessage(req) {
    if (req.body.type !== "message") {
      return false;
    }
    return !req.body.text.startsWith("/");
  }

  _tryRouteIntentType(req, res, next, intentType) {

    let tasks = [];

    for (let sub in this._subs) {
      let intents = this._subs[sub].intents(intentType);
      tasks = tasks.concat(intents.map(i => { return i.score(req.body.text, sub) }));
    }

    return new Promise((resolve, reject) => {
      if (tasks.length == 0) {
        resolve(false);
      }
      else {
        Promise.all(tasks)
        .then((results) => {
          var topIntent = results.reduce((prev, curr) => { 
            return prev.score > curr.score ? prev : curr; 
          });

          if (topIntent.score > 0) {
            if (topIntent.utterance) {
              // Keyword matches remove the 'ask X' part for us
              req.body.text = topIntent.utterance;
            }
            this._sendToSub(this._subs[topIntent.sub], req)
            .then((response) => {
              if (response.statusCode >= 400) {
                console.warn("sendToSub:" + response.statusCode)
              }
            });
            res.end();
            next();
            resolve(true);
          }
          else {
            resolve(false);
          }
        });
      }
    });
  }

  _routeMessage(req, res, next) {

    if (!req.body || !this._isRouteableMessage(req) || Object.keys(this._subs).length === 0) {
      this._defaultHandler(req, res, next);
      return;
    }

    if (req.body.conversation.id in this._focus) {
      this._sendToSub(this._subs[this._focus[req.body.conversation.id]], req);
      res.end();
      next();
      return;
    }

    this._tryRouteIntentType(req, res, next, _intents.KeywordIntent)
    .then((handled) => {
      if (!handled) {
        return this._tryRouteIntentType(req, res, next, _intents.LUISIntent);
      }
      return handled;
    })
    .then((handled) => {
      if (!handled) {
        return this._tryRouteIntentType(req, res, next, _intents.RegexIntent);
      }
      return handled;
    })
    .then((handled) => {
      if (!handled) {
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
        session.send("done");
      }
      break;

      case "/listsubs" : 
      case "/showsubs" : {
        session.send("Listing subs:");
        if (Object.keys(this._subs).length > 0) {
          for (let sub in this._subs) {
            session.send(JSON.stringify(this._subs[sub]));
          }
        }
        else {
          session.send("No subs registered");
        }
      }
      break;

      case '/debuginfo' : {
        session.send("debug info");
        session.send(`ServiceURL: ${this._serviceURL}`);
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
