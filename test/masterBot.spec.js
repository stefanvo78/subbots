'use strict'

const nconf = require("nconf");
const request = require("request");
const expect = require("chai").expect;
const botbuilder = require("botbuilder");
const directLineClient = require("botframework-directlinejs");

const routers = require("../lib/Routers");
const intents = require("../lib/Intents");
const SubBot = require("../lib/SubBot").UniversalSubBot;
const MasterBot = require("../lib/MasterBot").UniversalMasterBot;
const MockConnectorServer = require("./MockConnector");

let config = nconf.env().argv().file({file:'localConfig.json', search:true});

/*
describe('SubBot', () => {

  it('should be constructable', () => {
    var bot = new SubBot(new botbuilder.ChatConnector());
    expect(bot).to.be.an('object');
  })

  it('should be connectable', (done) => {
    var bot = new SubBot(new botbuilder.ChatConnector());
    bot.startServer();
    request.post("http://localhost:3978", (err, res, body) => {
      expect(err).to.be.null;
      bot.stopServer();
      done();
    });
  });

  it('can register with a master', (done) => {
    _mainBot = "http://localhost:3978";
    var master = new MasterBot(new botbuilder.ChatConnector());
    master.startServer();

    var bot = new SubBot(new botbuilder.ChatConnector());
    bot.registerDirectLine(`${_mainBot}/api/subbots`, _secret, [ new intents.RegexIntent(".*") ])
    .then((response) => {
      expect(response).to.not.equal(null);
      expect(response.statusCode).to.equal(201);
      master.stopServer();
      done();
    });
  });

describe('MasterBot', () => {

  it('should be constructable', () => {
    var bot = new MasterBot(new botbuilder.ChatConnector());
    expect(bot).to.be.an('object');
  }),

  it('should be connectable', (done) => {
    var bot = new MasterBot(new botbuilder.ChatConnector());
    bot.startServer();
    request.post("http://localhost:3978", (err, res, body) => {
      expect(err).to.be.null;
      bot.stopServer();
      done();
    });
  }),

  it('should accept control messages', (done) => {
    var bot = new MasterBot(new botbuilder.ChatConnector());
    bot.startServer();
    request.post(
      "http://localhost:3978/api/control", 
      { body : "" }, 
      (err, res, body) => {
        expect(err).to.be.null;
        bot.stopServer();
        done();
      }
    );
  })

  it('should register sharedCredentials subs', (done) => {
    var master = new MasterBot(new botbuilder.ChatConnector());
    master.startServer();

    var sub = new SubBot(new botbuilder.ChatConnector());

    sub.registerSharedCredentials(
      "http://localhost:3978/api/subbots", 
      "http://localhost:3979/api/messages",
      '', '',
      [ new intents.RegexIntent(".*") ]
    )
    .then((response) => {
      master.stopServer();
      expect(response.statusCode).to.equal(200);
      done();      
    });
  })

  it('should register directLine subs', (done) => {
    var master = new MasterBot(new botbuilder.ChatConnector());
    master.startServer();

    var sub = new SubBot(new botbuilder.ChatConnector());

    sub.registerDirectLine(
      "http://localhost:3978/api/subbots",
      "-DtPr646rhg.cwA.vEs.8qTSCP_zWhdmfDMvFiiKllP9Wu5cxy443JuZzgZPQ64",
      [ new intents.RegexIntent(".*") ]
    )
    .then((response) => {
      master.stopServer();
      expect(response.statusCode).to.equal(200);
      done();      
    });
  })

  it('should route regex messages', (done) => {

    MockConnectorServer.startServer();
    var config = nconf.env().argv().file({file:'localConfig.json', search:true});

    var master = new MasterBot(new botbuilder.ChatConnector());
    master.startServer();
    master.dialog("/", (session, args) => {
    });

    let directLineSecret = "-DtPr646rhg.cwA.vEs.8qTSCP_zWhdmfDMvFiiKllP9Wu5cxy443JuZzgZPQ64";
    let subId = config.get("MICROSOFT_APP_ID");
    let subPassword = config.get("MICROSOFT_APP_PASSWORD");

    var sub = new SubBot(new botbuilder.ChatConnector({ 
      appId : subId, 
      appPassword : subPassword
    }));

    let directLine = new directLineClient.DirectLine({
      webSocket : false,
      secret : directLineSecret
    });

    sub.registerDirectLine(
      "http://localhost:3978/api/subbots", 
      directLineSecret,
      [ new intents.RegexIntent(".*") ]
    )
    .then((response) => {
      expect(response.statusCode).to.equal(200);
      sub.startServer({port:3979});
      sub.dialog("/", (session, args) => {
        expect(session.message.text).to.equal('hi');
        sub.stopServer();
        master.stopServer();
        MockConnectorServer.stopServer();
        done();
      });

      directLine.postActivity({from:{id:"master"}, type:"message", text : "hi"})
      .subscribe(
        id => console.log("Posted activity, assigned ID ", id),
        error => console.log("Error posting activity", error)
      );
    })
  });

  it('should route keyword messages', (done) => {

    MockConnectorServer.startServer();
    var config = nconf.env().argv().file({file:'localConfig.json', search:true});

    var master = new MasterBot(new botbuilder.ChatConnector());
    master.startServer();
    master.dialog("/", (session, args) => {
    });

    var sub = new SubBot(new botbuilder.ChatConnector());
    sub.registerSharedCredentials(
      "http://localhost:3978/api/subbots", 
      "http://localhost:3979/api/messages", 
      '', '',
      [ new intents.KeywordIntent("brian") ]
    )
    .then((response) => {
      sub.startServer({port:3979});
      sub.dialog("/", (session, args) => {
        expect(session.message.text).to.equal('howdy');
        sub.stopServer();
        master.stopServer();
        MockConnectorServer.stopServer();
        done();
      });

      postMessage("http://localhost:3978/api/messages", "howdy");
    });
  });
});
*/