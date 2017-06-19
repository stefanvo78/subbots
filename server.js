const nconf = require("nconf");
const request = require("request");
const botbuilder = require("botbuilder");
const MasterBot = require("./lib/MasterBot").UniversalMasterBot;

function main() {

  console.log("mainBot: starting...");
  var config = nconf.env().argv().file({file:'localConfig.json', search:true}).get();

  var masterBot = new MasterBot(new botbuilder.ChatConnector({
    appId : config.MICROSOFT_APP_ID,
    appPassword : config.MICROSOFT_APP_PASSWORD
  }));
  masterBot.startServer(config);
  masterBot._server.get("/public/webchat", (req, res, next) => {
    let html = `<html><head><title>IPA MainBot</title></head><body>
    <p align="center">
    <iframe width=800 height=600 src='https://webchat.botframework.com/embed/ipa-mainbot?s=${config.WEBCHAT_SECRET}'></iframe>
    </p>
    </body></html>`;
    res.end(html);
    next();
  });

  masterBot.dialog("/", 
    (session, args) => {
      if (session.message.text.startsWith("/")) {
        masterBot.handleSlashCommand(session);
      }
      else {
        session.send("I'm sorry, I don't know how to handle that request");
      }
    }
  );

  masterBot.on("conversationUpdate", (activity) => {
    if (activity.source === "webchat") {
      masterBot.send(new botbuilder.Message().address(activity.address).text("Welcome to the MasterBot"));
    }
  });

  // Load up the starting subbots
  let subbots = config.SUBBOTS;
  if (subbots) {
    if (typeof subbots === "string") {
      subbots = JSON.parse(subbots);
    }
    subbots.forEach((subbot) => {
      masterBot._addSubbot(subbot);
    });
  }
}

main();
