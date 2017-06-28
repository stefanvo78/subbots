const nconf = require("nconf");
const request = require("request");
const botbuilder = require("botbuilder");
const appInsights = require("applicationinsights");
const MasterBot = require("./lib/MasterBot").UniversalMasterBot;

function main() {

  console.log("mainBot: starting...");
  var config = nconf.env().argv().file({file:'localConfig.json', search:true}).get();

  appInsights.setup(config.APP_INSIGHTS_KEY);
  appInsights.start();

  var masterBot = new MasterBot(new botbuilder.ChatConnector({
    appId : config.MICROSOFT_APP_ID,
    appPassword : config.MICROSOFT_APP_PASSWORD
  }));
  masterBot.startServer(config);
  masterBot._server.get("/public/webchat", (req, res, next) => {
    let html = `<html><head><title>IPA MainBot</title></head><body>
    <p align="center">
    <iframe width=800 height=600 src='https://webchat.botframework.com/embed/${config.BOT_HANDLE}?s=${config.WEBCHAT_SECRET}'></iframe>
    </p>
    </body></html>`;
    res.end(html);
    next();
  });

  let errorMessage = config.ERROR_MESSAGE || "I'm sorry, I don't know how to handle that request";

  masterBot.dialog("/", 
    (session, args) => {
      if (session.message.text && session.message.text.startsWith("/")) {
        masterBot.handleSlashCommand(session);
      }
      else {
        session.send(errorMessage);
      }
    }
  );

  let welcomeMessage = config.WELCOME_MESSAGE || "Welcome to the Master Bot";
  masterBot.on("conversationUpdate", (activity) => {
    if (activity.source === "webchat") {
      masterBot.send(new botbuilder.Message().address(activity.address).text(welcomeMessage));
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
