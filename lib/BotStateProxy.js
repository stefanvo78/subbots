"use strict";

const request = require("request");

class BotStateProxy {
  constructor(server) {
    this._server = server;

    this._server.get(
      ':channel/v3/botstate/emulator/conversations/:cid/users/:uid', 
      this._getPrivateConversationData.bind(this)
    );
    this._server.get(
      ':channel/v3/botstate/emulator/conversations/:cid', 
      this._getConversationData.bind(this)
    );
    this._server.get(
      ':channel/v3/botstate/emulator/users/:uid',
      this._getUserData.bind(this)
    );

    this._server.post(
      ':channel/v3/botstate/emulator/conversations/:cid/users/:uid', 
      this._setPrivateConversationData.bind(this)
    );
    this._server.post(
      ':channel/v3/botstate/emulator/conversations/:cid', 
      this._setConversationData.bind(this)
    );
    this._server.post(
      ':channel/v3/botstate/emulator/users/:uid',
      this._setUserData.bind(this)
    );
  }

  _get(uri, auth, res, next) {
    let opts = { 
      uri : uri, method : "GET",
      headers : {
        "Authorization" : auth
      }
    };
    request(opts, (err, response) => {
      res.end(response.body);
      next();
    });
  }

  _set(uri, body, auth, res, next) {
    let opts = {
      uri : uri, method : "POST", json : body,
      headers : {
        "Authorization" : auth
      }
    };
    request(opts, (err, response) => {
      res.end(response.body);
      next();
    });
  }

  _getUserData(req, res, next) {
    this._get(
      `https://state.botframework.com/v3/botstate/${req.params.channel}/users/${req.params.userId}`,
       req.headers["authorization"],
       res, next
    );
  }

  _setUserData(req, res, next) {
    this._set(
      `https://state.botframework.com/v3/botstate/${req.params.channel}/users/${req.params.uid}`,
      req.body,
      req.headers["authorization"],
      res, next
    );
  }

  _getConversationData(req, res, next) {
    this._get(
      `https://state.botframework.com/v3/botstate/${channel}`
      + `/conversations/${req.params.conversationId}/users/${req.params.userId}`,
      req.headers["authorization"],
      res, next
    );
  }

  _setConversationData(req, res, next) {
    this._set(
      `https://state.botframework.com/v3/botstate/${req.params.channel}` 
      + `/conversations/${req.params.cid}/users/${req.params.uid}`,
      req.body,
      req.headers["authorization"],
      res, next
    );
  }

  _getPrivateConversationData(req, res, next) {
    this._get(
      `https://state.botframework.com/v3/botstate/${req.params.channel}`
      + `/conversations/${req.params.cid}`,
      req.headers["authorization"],
      res, next
    );
  }

  _setPrivateConversationData(req, res, next) {
    this._set(
      `https://state.botframework.com/v3/botstate/${oc}`
      + `/conversations/${req.params.conversationId}`,
      req.body,
      req.headers["authorization"],
      res, next
    );
  }
}

