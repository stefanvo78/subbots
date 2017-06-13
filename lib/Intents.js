"use strict";

const request = require("request");

class Intent {
  toJSON() {
    throw new Error("Unimplemented");
  }

  score(utterance, credentials) {
    throw new Error("Unimplemented");
  }
}

class LUISIntent extends Intent {
  constructor(modelId, subscriptionKey) {
    super();
    this._modelId = modelId;
    this._subscriptionKey = subscriptionKey;
  }

  _askLUIS(id, key, q) {
    var uri = `https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/${id}?subscription-key=${key}&verbose=true&q=${q}`;
    return new Promise((resolve, reject) => {
      var options = {
        uri: uri,
        method : 'GET'
      };
      request(options, (err, response, body) => {
        err ? reject(err) : resolve(response);
      })
    });
  }

  toJSON() {
    var json = {
      type : "luis",
      appId : this._modelId,
      appSecret : this._subscriptionKey
    };
    return JSON.stringify(json);
  }

  score(utterance, credentials) {
    return new Promise((resolve, reject) => {
      this._askLUIS(this._modelId, this._subscriptionKey, utterance)
      .then((response) => {
        if (response.statusCode >= 300) {
          resolve({score:0});
        }
        else {
          let score = JSON.parse(response.body).topScoringIntent.score;
          resolve({score:score, credentials:credentials});
        }
      });
    });
  }
}

class KeywordIntent extends Intent {

  constructor(keyword) {
    super();
    this._keyword = keyword;
  }

  toJSON() {
    var json = {
      type : "keyword",
      keyword : this._keyword
    };
    return JSON.stringify(json);
  }

  score(utterance, credentials) {
    let _self = this;
    return new Promise((resolve, reject) => {
      let regexes = [ new RegExp(`^ask ${this._keyword}`), new RegExp(`^tell ${this._keyword}`) ];
      regexes.forEach((regex) => {
        if (regex.test(utterance)) {
          resolve({score:1, credentials:credentials});
        }
      });
    });
  }

}

class RegexIntent extends Intent {
  constructor(regex) {
    super();
    this._regex = new RegExp(regex);
  }

  toJSON() {
    var json = {
      type : "regex",
      regex : this._regex.source
    };
    return JSON.stringify(json);
  }

  score(utterance, credentials) {
    let _self = this;
    return new Promise((resolve, reject) => {
      if (_self._regex.test(utterance)) {
        resolve({score:1, credentials:credentials});
      }
      else {
        resolve({score:0, credentials:credentials});
      }
    });
  }
}

module.exports = {
  LUISIntent : LUISIntent,
  RegexIntent : RegexIntent,
  KeywordIntent : KeywordIntent
} 