'use strict'

const expect = require("chai").expect;
const directLine = require("../lib/DirectLine");
var _secret = "nw5K5v0wAwA.cwA.sCs.1T54ALBU0rEJmtCUtZUYxB578VIY6s9ovGfmcZQr06o";

describe('DirectLine', () => {
  it('should be constructable', () => {
    var dl = new directLine.DirectLine("secret");
    expect(dl).to.be.an('object');
  }),

  it("should be able to start a conversation", (done) => {
    var dl = new directLine.DirectLine(_secret);
    dl.startConversation()
    .then((response) => {
      done();
    })
    .catch((err) => {
      expect.fail();
    })
  })

  it("should be able to send an activity", (done) => {
    var dl = new directLine.DirectLine(_secret);
    dl.startConversation()
    .then((response) => {
      expect(response).to.not.equal(null);
      expect(response.statusCode).to.equal(201);
      let conversationId = JSON.parse(response.body).conversationId;
      dl.postActivity(conversationId, { from : { id : "me" }, type : "message", text : "hi"})
      .then((response => {
        expect(response.statusCode).to.equal(200);
        done();
      }));
    })
    .catch((err) => {
      expect.fail();
    })
  })
});