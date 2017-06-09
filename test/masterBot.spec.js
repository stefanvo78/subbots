'use strict'

const expect = require('chai').expect;

const request = require('request');
const botbuilder = require("botbuilder");

const routers = require("../lib/Routers");
const intents = require("../lib/Intents");
const MasterBot = require("../lib/MasterBot").UniversalMasterBot;
const SubBot = require("../lib/SubBot").UniversalSubBot;
const MockConnectorServer = require("./MockConnector");

function postMessage(url, msg) {
  var options =  {
    uri : url,
    method: 'POST',
    json: { 
      type : "message",
      channelId : "emulator",
      text : msg,
      from : { id : "testClient" },
      serviceUrl : "http://localhost:8000",
      conversation : { id : "testConversation" }
    }
  };

  request(options, (err, res, body) => {
  });
}

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

  it('should route regex messages', (done) => {

    MockConnectorServer.startServer();

    var master = new MasterBot(new botbuilder.ChatConnector());
    master.startServer();
    master.dialog("/", (session, args) => {
    });
 
    var sub = new SubBot(new botbuilder.ChatConnector());
    sub.registerSharedCredentials(
      "http://localhost:3978/api/subbots", 
      "http://localhost:3979/api/messages", 
      '', '',
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

      postMessage("http://localhost:3978/api/messages", "hi");
    })
  });

  it('should route keyword messages', (done) => {

    MockConnectorServer.startServer();

    var master = new MasterBot(new botbuilder.ChatConnector());
    master.startServer();
    master.dialog("/", (session, args) => {
    });

    var sub = new SubBot(new botbuilder.ChatConnector());
    sub.registerSharedCredentials(
      "http://localhost:3978/api/subbots", 
      "http://localhost:3979/api/messages", 
      '', '',
      [ new intents.RegexIntent(".*") ]
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
