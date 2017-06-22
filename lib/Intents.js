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

function intentFactory(intents) {
  let result = [];
  intents.forEach((intent) => {
    if (typeof intent === "string") {
      intent = JSON.parse(intent);
    }
    switch (intent.type) {
      case 'luis' : {
        result.push(new LUISIntent(intent.appId, intent.appSecret));
      }
      break;

      case 'regex' : {
        result.push(new RegexIntent(intent.regex));
      }
      break;

      case 'keyword' : {
        result.push(new KeywordIntent(intent.keyword));
      }
      break;

      default : {
      }
    }
  });
  return result;
}

class LUISIntent extends Intent {
  constructor(modelId, subscriptionKey) {
    super();
    this._modelId = modelId;
    this._subscriptionKey = subscriptionKey;
  }

  _askLUIS(id, key, q) {
    var uri = `https://westeurope.api.cognitive.microsoft.com/luis/v2.0/apps/${id}?subscription-key=${key}&verbose=true&q=${q}`;
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

  score(utterance, sub) {
    return new Promise((resolve, reject) => {
      this._askLUIS(this._modelId, this._subscriptionKey, utterance)
      .then((response) => {
        if (response.statusCode >= 300) {
          resolve({score:0});
        }
        else {
          let topScorer = JSON.parse(response.body).topScoringIntent;
          if (topScorer.intent != 'None') {
            resolve({score:topScorer.score, sub:sub});
          }
          else {
            resolve({score:0});
          }
        }
      });
    });
  }
}

class KeywordIntent extends Intent {

  constructor(keyword) {
    super();
    this._keyword = keyword;
    this._regexes = [ 
      new RegExp(`^ask ${this._keyword} (.*)`, 'iu'), 
      new RegExp(`^tell ${this._keyword} (.*)`, 'iu') 
    ];
  }

  toJSON() {
    var json = {
      type : "keyword",
      keyword : this._keyword
    };
    return JSON.stringify(json);
  }

  score(utterance, sub) {
    let _self = this;
    utterance = utterance.trim();
    return new Promise((resolve, reject) => {
      let handled = false;
      this._regexes.forEach((regex) => {
        let match = regex.exec(utterance);
        if (match !== null) {
          handled = true;
          resolve({score:1, sub:sub, utterance:match[1]});
        }
      });
      if (!handled) {
        resolve({score:0});
      }
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

  score(utterance, sub) {
    let _self = this;
    return new Promise((resolve, reject) => {
      if (_self._regex.test(utterance)) {
        resolve({score:1, sub:sub});
      }
      else {
        resolve({score:0, sub:sub});
      }
    });
  }
}

module.exports = {
  LUISIntent : LUISIntent,
  RegexIntent : RegexIntent,
  KeywordIntent : KeywordIntent,
  intentFactory : intentFactory
} 
