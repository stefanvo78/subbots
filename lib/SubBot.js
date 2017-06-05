"use strict"

const request = require("request");
const _UniversalBot = require("./_UniversalBot")._UniversalBot;

class SubBot extends _UniversalBot {
  constructor(connector, defaultDialog, libraryName) {
    super(connector, defaultDialog, libraryName);
    this._routes = [];
  }

  addRoute(route, handler) {
    this._routes.push([route, handler]);
  }

  register(masterUrl) {
    let routes = [];
    this._routes.forEach((r) => {
      routes.push(r[0]);
    });

    var options =  {
      uri : masterUrl,
      method: 'POST',
      json: routes
    };

    request(options, (err, res, body) => {
    });
  }
}

module.exports = {
  UniversalSubBot : SubBot  
}
