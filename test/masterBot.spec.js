'use strict'

const request = require('request');
const expect = require('chai').expect;
const MasterBot = require("../lib/MasterBot").MasterBot;

describe('MasterBot', () => {
  it('should export a class', () => {
    expect(MasterBot).to.be.a('function');
  }),
  it('should be constructable', () => {
    var bot = new MasterBot();
    expect(bot).to.be.an('object');
    bot.stopServer();
  }),
  it('should be connectable', (done) => {
    var bot = new MasterBot();
    request.post("http://localhost:3978", (err, res, body) => {
      expect(err).to.be.null;
      bot.stopServer();
      done();
    });
  }),
  it('should accept control messages', (done) => {
    var bot = new MasterBot();
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
});
