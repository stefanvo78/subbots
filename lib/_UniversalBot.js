"use strict"

const restify = require("restify");
const botbuilder = require("botbuilder");

class _UniversalBot extends botbuilder.UniversalBot {

  constructor(connector, defaultDialog, libraryName) {
    super(connector, defaultDialog, libraryName);
    this._connector = connector;
  }

  startServer(config) {

    if (config === undefined) {
      config = {};
    }

    // Start the server
    var server = restify.createServer();
    server.use(restify.bodyParser({ mapParams: false }));
    server.listen(config.PORT || config.port || 3978, function () {
      console.log('%s listening to %s', server.name, server.url); 
    });

    this._server = server;
  }

  stopServer() {
    if (this._server) {
      this._server.close();
    }
  }
}

module.exports = {
  _UniversalBot : _UniversalBot
}
