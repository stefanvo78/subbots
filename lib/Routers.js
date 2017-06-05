class Route
{
}

class RegexRoute {
  constructor(regex, handler) {
    this._regex = regex;
    this._handler = handler;
  }
}

class KeywordRouter {
}

class LUISRouter {
}

class RegexRouter {
}

module.exports = {
  RegexRoute : RegexRoute,
  RegexRouter : RegexRouter
};
