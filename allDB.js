const { v4: uuidv4 } = require("uuid");

var utils = require("./utils.js");

var globals = {
  consoleLog: false,
};

module.exports = {
  AllDB: class {
    constructor(options, callback) {
      //set default options
      var defaultOptions = {
        database: "single-json-file",
      }
      
      //merge defaults with passed options
      options = {
        ...defaultOptions,
        ...options,
      }

      this.classGlobals = {
        credsRequired: true
      }

      if (options.mode) {
        //the mode must be set so adrauth knows what type of database to use
        if (options.mode == "postgres") {
          var { DBLink } = require("./connectors/postgres.js");
          
          if ((this.classGlobals.credsRequired && options.connect) ) {
            //credentials passed, ready to start database connection
            //spawn a new Postgres DBLink
            this.actions = new DBLink(options.connect, (err, resp) => {
              if (err) {
                callback(err);
              } else {
  
                callback(null, resp);
              }
            });
  
          } else {
            callback(
              `connect setting required for ${options.mode}. This is an object containing {host, user, password} for connection`
            );
          }


        } else if (options.mode == "single-json-file") {
          var { DBLink } = require("./connectors/singleJSON.js");
          this.classGlobals.credsRequired = false
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

