"use strict";

class Intent {
  toJSON() {
    throw new Error("Unimplemented");
  }

  score(utterance, credentials) {
    throw new Error("Unimplemented");
  }
}

class LUISIntent extends Intent {
  constructor(appId, appSecret) {
    super();
    this._appId = appId;
    this._appSecret = appSecret;
  }

  _askLUIS(appId, subKey, q) {
    var uri = `https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/${appId}?subscription-key=${subKey}&verbose=true&q=${q}`;
    return new Promise((resolve, reject) => {
      var options = {
        uri: uri,
        method : 'GET'
      };
      request(options, (err, response, body) => {
        resolve(response);
      })
    });
  }

  toJSON() {
    var json = {
      type : "luis",
      appId : this._appId,
      appSecrect : this._appId
    };
    return JSON.stringify(json);
  }

  score(utterance, credentials) {
    return _askLUIS(this._appId, this._appSecret, utterance);
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