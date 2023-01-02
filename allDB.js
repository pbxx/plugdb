const { v4: uuidv4 } = require("uuid");

var globals = {
  consoleLog: false,
};

module.exports = {
  AllDB: class {
    constructor(options, callback) {
      //set default options
      var defaultOptions = {}
      //merge defaults with passed options
      options = { ...defaultOptions, ...options, }

      if (options.mode) {
        //the mode must be set so adrauth knows what type of database to use
        if (options.mode == "postgres") {
          var { DBLink } = require("./connectors/postgres.js");
          //spawn a new Postgres DBLink
          this.actions = new DBLink(options, (err, resp) => {
            if (err) {
              callback(err);
            } else {

              callback(null, resp);
            }
          });

        } else if (options.mode == "single-json-file") {
          var { DBLink } = require("./connectors/singleJSON.js");
          //under construction

        } else {
          var { DBLink } = require(options.mode);
          this.actions = new DBLink(options, (err, resp) => {
            if (err) {
              callback(err);
            } else {

              callback(null, resp);
            }
          });
        }
      } else {
        callback("mode setting is required to spawn a new AllDB");
      }
    }
    disconnect() {
      //make disconnect happen and destroy class
      return this.actions.disconnect()
    }
  },
};

