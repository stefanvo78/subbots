const _UniversalBot = require("./_UniversalBot")._UniversalBot;

class MasterBot extends _UniversalBot {

  startServer(config) {
    super.startServer(config);
    this._server.post('/api/control', this.control);
  }

  control(req, res, next) {
    res.end();
    next();
  }
};

module.exports = {
  UniversalMasterBot : MasterBot
}
