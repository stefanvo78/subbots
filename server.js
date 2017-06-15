const nconf = require("nconf");
const request = require("request");
const botbuilder = require("botbuilder");
const MasterBot = require("./lib/MasterBot").UniversalMasterBot;

function main() {

  console.log("mainBot: starting...");
  var config = nconf.env().argv().file({file:'localConfig.json', search:true});

  var masterBot = new MasterBot(new botbuilder.ChatConnector({
    appId : config.get("MICROSOFT_APP_ID"),
    appPassword : config.get("MICROSOFT_APP_PASSWORD")
  }));
  masterBot.startServer(config.get());
  masterBot._addSubbot({ "intents":[{"type":"regex", "regex" : ".*" }],"credentials":{"type":"sharedCredentials","endpoint":"https://botlette.azurewebsites.net/api/messages","appId":"c4f802e8-dcb5-4cae-97a0-5057d8c3f307","appPassword":"kXVWvoz9W2tGqZybK8knHD1"}});

  masterBot.dialog("/", 
    (session, args) => {
      if (session.message.text.startsWith("/")) {
        masterBot.handleSlashCommand(session);
      }
      else {
        session.send("masterBot: no subbot found to handle: " + session.message.text)
        session.send("(serviceUrl was: " + session.message.address.serviceUrl + ")");
        session.send("(address was: " + JSON.stringify(session.message.address) + ")");
      }
    }
  );

  masterBot.on("conversationUpdate", (activity) => {
    masterBot.send(new botbuilder.Message().address(activity.address).text("Welcome to the MasterBot"));
  });
}

main();
