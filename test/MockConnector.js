const swagger = require("swagger-server");

var _server = null;
function startServer() {
  var server = new swagger.Server();
  //server.parse(__dirname + "/ConnectorAPI.json");
  server.parse(__dirname + "/StateAPI.json");
  server.dataStore.save(
    new swagger.Resource('/v3/botstate/emulator/users/testClient', {}),
    new swagger.Resource('/v3/botstate/emulator/conversations/testConversation', {}),
    new swagger.Resource('/v3/botstate/emulator/conversations/testConversation/users/testClient', {})
  );

  _server = server.listen(8000, function() {
    console.log(`Mock Connector listening to ${_server.address().port}`)
  });
}

function stopServer() {
  if (_server) {
    _server.close();
    _server = null;
  }
}

module.exports = {
  startServer : startServer,
  stopServer : stopServer
}
