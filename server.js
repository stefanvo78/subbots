const nconf = require("nconf");
const botbuilder = require("botbuilder");
const MasterBot = require("./lib/MasterBot").UniversalMasterBot;

var config = nconf.env().argv().file({file:'localConfig.json', search:true});

function main() {
  var masterBot = new MasterBot(new botbuilder.ChatConnector({
    appId : config.get("MICROSOFT_APP_ID"),
    appPassword : config.get("MICROSOFT_APP_PASSWORD")
  }));
  masterBot.startServer();

  masterBot.dialog("/", 
    (session, args) => {
      session.send("masterBot: no subbot found to handle: " + session.message.text)
    }
  );

  masterBot.on("conversationUpdate", (activity) => {
    masterBot.send(new botbuilder.Message().address(activity.address).text("Welcome to the MasterBot"));
  });
}

main();