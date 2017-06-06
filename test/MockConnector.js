const swaggerServer = require("swagger-server");

var _server = null;
function startServer() {
  var app = swaggerServer(__dirname + "/ConnectorAPI.json");
  _server = app.listen(8000, function() {
    console.log(`Mock Connector listening to ${_server.address().port}`)
  });
}

function stopServer() {
  if (_app) {
    _app.close();
  }
}

module.exports = {
  startServer : startServer
}