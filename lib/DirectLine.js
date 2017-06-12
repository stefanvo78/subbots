const request = require("request");

class DirectLine {
  constructor(secret) {
    this._secret = secret;
    this._domain = "https://directline.botframework.com/v3/directline";
  }

  postActivity(conversationId, activity) {
    return new Promise((resolve, require) => {
      let opts = {
        method: "POST",
        uri: `${this._domain}/conversations/${conversationId}/activities`,
        json: activity,
        headers: {
          Authorization: `Bearer ${this._secret}`
        }
      };

      request(opts, (err, response, body) => {
        err ? reject(err) : resolve(response);
      });
    });
  }

  startConversation() {
    return new Promise((resolve, reject) => {
      let opts = {
        method: "POST",
        uri: `${this._domain}/conversations`,
        headers: {
          Authorization: `Bearer ${this._secret}`
        }
      };
      request(opts, (err, response, body) => {
        err ? reject(err) : resolve(response);
      });
    });
  }
}

module.exports = {
  DirectLine : DirectLine
}