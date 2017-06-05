const restify = require("restify");
const botbuilder = require("botbuilder");

class MasterBot {
  constructor(config, router) {

    if (config === undefined) {
      config = {};
    }

    // Start the server
    var server = restify.createServer();
    server.use(restify.bodyParser({ mapParams: false }));
    server.listen(config.port || 3978, function () {
      console.log('%s listening to %s', server.name, server.url); 
    });

    let connector = new botbuilder.ChatConnector({
      appId: config.MICROSOFT_APP_ID,
      appPassword: config.MICROSOFT_APP_PASSWORD
    });

    server.post('/api/messages', connector.listen());
    server.post('/api/control', this.control);
    this.server = server;

    this.bot = new botbuilder.UniversalBot(this.connector);
    this.bot.dialog('/', [
      (session, args) => {
        session.send('mainBot:');
      }
    ]);
  }

  stopServer() {
    this.server.close();
  }

  control(req, res, next) {
    res.end();
    next();
  }
};

module.exports = {
  MasterBot : MasterBot
}
