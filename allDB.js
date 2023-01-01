const { v4: uuidv4 } = require("uuid");

var globals = {
  consoleLog: false,
};

module.exports = {
  AllDB: class {
    constructor(options, callback) {
      //set default options
      var defaultOptions = {
        
      }
      
      //merge defaults with passed options
      options = {
        ...defaultOptions,
        ...options,
      }

      this.classGlobals = {

      }

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
          callback(
            `mode setting does not match any compatible modes. got '${options.mode}'`
          );
        }
      } else {
        callback("mode setting is required to spawn a new AllDB");
      }
    }
    disconnect() {
      //make disconnect happen and destroy class
    }
  },
};

