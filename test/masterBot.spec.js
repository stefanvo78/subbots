'use strict'

const expect = require('chai').expect;

const request = require('request');
const botbuilder = require("botbuilder");

const routers = require("../lib/Routers");
const MasterBot = require("../lib/MasterBot").UniversalMasterBot;
const SubBot = require("../lib/SubBot").UniversalSubBot;

function postMessage(url, msg) {
  var options =  {
    uri : url,
    method: 'POST',
    json: { 
      type : "message",
      channelId : "emulator",
      text : msg
    }
  };

  request(options, (err, res, body) => {
  });
}

describe('SubBot', () => {

  it('should be constructable', () => {
    var bot = new SubBot(new botbuilder.ChatConnector())
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
  }),

  it('should route messages', (done) => {
    
    var sub = new SubBot(new botbuilder.ChatConnector());
    sub.addRoute(new routers.RegexRoute("*"));
    sub.register("http://localhost:3978/api/control");
    sub.startServer({port:3979});

    var master = new MasterBot(new botbuilder.ChatConnector());
    master.dialog("/", (session, args) => {
    });
    master.startServer();
    postMessage("http://localhost:3978/api/messages", "hi");

    sub.dialog("/", (session, args) => {
      sub.stopServer();
      master.stopServer();
      done();
    });
  });
});
