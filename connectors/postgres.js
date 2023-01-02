const { Pool, Client } = require('pg')
const st = require('simpletype-js')

var globals = {
	consoleLogQueries: false,
}


module.exports = {
	DBLink: class {
		constructor(options, callback) {
			//check for host, username, and password
			let tcheck = st.checkSync({ host: "string", user: "string", password: "string" }, options)
			if (tcheck.correct) {
			//if (typeof(options.host) == "string" && typeof(options.user) == "string" && typeof(options.password) == "string") {
				this.user = options.user
				if (options.mode) { delete options.mode } //clear the mode setting from the options object, so it doesnt go to the database 
				//all clear for this.pool creation
				try {
					var defaultOptions = {
						database: "postgres",
						port: 5432,
						max: 20,
						idleTimeoutMillis: 30000,
						connectionTimeoutMillis: 2000,
					}
					
					//merge defaults with passed options
					options = {
						...defaultOptions,
						...options,
					}
					//this.options = options

					//create this.pool
					this.pool = new Pool(options);
					//add CRUD and utility methods
					this.create = {
						schema: (opts) => {
							return new Promise((resolve, reject) => {
								var defaults = {
									overwrite: false
								}
								var options
								if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
				
								//CREATE SCHEMA IF NOT EXISTS schema_adrauth
								var query = ``;
								if (options.overwrite) {
									query += `CREATE SCHEMA ${options.schema}`;
								} else {
									query += `CREATE SCHEMA IF NOT EXISTS ${options.schema}`;
								}
								log(query)
								dbQuery(this.pool, query)
								.then((queryRes) => {
									resolve(queryRes)
								})
								.catch((err) => {
									reject(err)
								})
							})
						},
						table: (opts) => {
							return new Promise((resolve, reject) => {
								var defaults = {
									schema: "public",
								}
								var options
								if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
								//CREATE SCHEMA IF NOT EXISTS schema_adrauth
								processCols(options.cols, options.name)
								.then((valueSet) => {
									var query = `CREATE TABLE "${options.schema}".${options.name} ( ${valueSet.queryCols} );`;
									log(query)
									dbQuery(this.pool, query)
									.then((queryRes) => {
										resolve(queryRes)
									})
									.catch((err) => {
										reject(err)
									})
								})
								.catch((err) => {
									reject(err)
								})
								
							})
						},
						record: (dataObject, opts) => {
							return new Promise((resolve, reject) => {
								let tcheck = st.checkSync({ dataObject: "object", table: "string", password: "string" }, {dataObject, ...options})
								if (tcheck.correct) {
									try {
										var defaults = {
											schema: "public",
										}
										var options
										if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
					
										var fName = "db.insert";
										//dataObject keys will become columns, dataObject values will be written to those columns
										//make sure <dataObject> is an actual dataObject
										
												processValues(dataObject)
												.then((valueSet) => {
													var query = `INSERT INTO ${options.schema}.${options.table}(${valueSet.cols}) VALUES (${valueSet.valDollars});`;
													log(query)
													dbQuery(this.pool, query, valueSet.valArray)
													.then((queryRes) => {
														resolve(queryRes)
													})
													.catch((err) => {
														reject(err)
													})
					
												})
												.catch((err) => {
													reject(err)
												})
										
									} catch (err) {
										reject(err)
									}
								} else {
									reject(tcheck.failed)
								}
							});
						},
					}

					this.get = {
						all: (opts) => {
							return new Promise((resolve, reject) => {
								try {
									var defaults = {
										schema: "public",
									}
									var options
									if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
				
									var fName = "db.selectAll";
									//object keys will become columns, object values will be written to those columns
									//make sure <object> is an actual object
									if (typeof(options.table) == "string") {
										//no selection cases provided, select all from requested table
										var query = `SELECT * FROM ${options.schema}.${options.table}`;
										
										dbQuery(this.pool, query)
										.then((queryRes) => {
											resolve(queryRes)
										})
										.catch((err) => {
											reject(err)
										})
				
									} else {
										//table name was not string
										reject(`[ERR: ${fName}] First argument must be of type 'string', got '${typeof(options.table)}'.`)
									}
								} catch (err) {
									//general error occurred, in the whole try{}catch block
									reject(err)
								}
							});
							
						},
						allWhere: (whereCases, opts) => {
							return new Promise((resolve, reject) => {
								try {
									var defaults = {
										schema: "public",
									}
									var options
									if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
				
									var fName = "db.selectAll";
									//object keys will become columns, object values will be written to those columns
									//make sure <object> is an actual object
									if (typeof(options.table) == "string") {
										processCases(whereCases, options.opArray)
										.then((valueSet) => {
											//valueSet is an object that contains:
											//valueSet.valArray: the Array that actually contains the data to be filtered
											//valueSet.valCases: literal SQL/native query string representing the templated $ values, to be inserted into the query
											var query = `SELECT * FROM ${options.schema}.${options.table} WHERE ${valueSet.valCases};`;
											log(query)
											dbQuery(this.pool, query, valueSet.valArray)
											.then((queryRes) => {
												resolve(queryRes)
											})
											.catch((err) => {
												reject(err)
											})
										})
										.catch((err) => {
											//error running processCases()
											//handle error
											reject({errText: `[ERR: ${fName}] Error running processCases()`, err})
										})
				
									} else {
										//table name was not string
										reject(`[ERR: ${fName}] First argument must be of type 'string', got '${typeof(options.table)}'.`)
									}
								} catch (err) {
									//general error occurred, in the whole try{}catch block
									reject(err)
								}
							});
						},
						cols: (cols, opts) => {
							return new Promise((resolve, reject) => {
								try {
									var defaults = {
										schema: "public",
										opArray: null,
									}
									var options
									if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
				
									var fName = "db.selectCols";
									var query = `SELECT ${cols} FROM ${options.schema}.${options.table}`;
				
									dbQuery(this.pool, query)
									.then((queryRes) => {
										resolve(queryRes)
									})
									.catch((err) => {
										reject(err)
									})
								} catch (err) {
									reject(err)
								}
							});
						},
						colsWhere: (cols, whereCases, opts) => {
							return new Promise((resolve, reject) => {
								try {
									var defaults = {
										schema: "public",
										opArray: null,
									}
									var options
									if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
				
									var fName = "db.selectCols";
									//object keys will become columns, object values will be written to those columns
									//make sure <object> is an actual object
									processCases(whereCases, options.opArray)
									.then((valueSet) => {
										var query = `SELECT ${cols} FROM ${options.schema}.${options.table} WHERE ${valueSet.valCases};`;
										log(query)
										dbQuery(this.pool, query, valueSet.valArray)
										.then((queryRes) => {
											resolve(queryRes)
										})
										.catch((err) => {
											reject(err)
										})
									})
									.catch((err) => {
										//error running processCases()
										//handle error
										reject({errText: `[ERR: ${fName}] Error running processCases()`, err})
									})
								} catch (err) {
									reject(err)
								}
							});
						}
					}

					this.update = {
						record: (values, whereCases, opts) => {
							return new Promise((resolve, reject) => {
								try {
									var defaults = {
										schema: "public",
										opArray: null
									}
									var options
									if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
				
									var fName = "db.update";
									//object keys will become columns, object values will be written to those columns
									//make sure <object> is an actual object
									if (typeof(options.table) == "string") {
										if (typeof(values) == "object" && !Array.isArray(values)) {
											if (typeof(whereCases) == "object" && !Array.isArray(whereCases)) {
												processCasesWithValues(whereCases, options.opArray, values)
												.then((valueSet) => {
													//var query = `SELECT ${cols} FROM ${table} WHERE ${valueSet.valCases};`;
													var query = `UPDATE ${options.schema}.${options.table} SET ${valueSet.valValues} WHERE ${valueSet.valCases}`
													log(query)
													dbQuery(this.pool, query, valueSet.valArray)
													.then((queryRes) => {
														resolve(queryRes)
													})
													.catch((err) => {
														reject(err)
													})
												})
												.catch((err) => {
													//error running processCases()
													//handle error
													reject({errText: `[ERR: ${fName}] Error running processCases()`, err})
												})
											
												
											} else {
												this.pool.connect((err, client, release) => {
													if (err) {
														return console.error('Error acquiring client', err.stack)
													}
													var query = `UPDATE ${options.table} SET ${valValues}`
													if (globals.consoleLogQueries) { log(`[INFO ${fName}]`, valArray, valValues)
													log(`[INFO ${fName}]`, query) }
													client.query(query, valArray, (err, res) => {
														if (err) {
															//err writing to db
															release()
															reject(err)
														}
														//item written to db
														release()
														resolve(res)
													})
												})
												
												
											}
										} else {
											reject(`[ERR: ${fName}] Second argument must be of type 'object', got '${typeof(values)}'.`)
										}
									} else {
										reject(`[ERR: ${fName}] First argument must be of type 'string', got '${typeof(options.table)}'.`)
									}
								} catch (err) {
									reject(err)
								}
							});
						},
						incDecAll: (inc, column, opts) => {
							return new Promise((resolve, reject) => {
								try {
									var defaults = {
										schema: "public",
										opArray: null,
									}
									var options
									if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
				
									var fName = "db.increment";
									//object keys will become columns, object values will be written to those columns
									//make sure <object> is an actual object
									var query = `UPDATE ${options.schema}.${options.table} SET ${column} = ${column} + ${inc};`
									log(query)
									dbQuery(this.pool, query)
									.then((queryRes) => {
										resolve(queryRes)
									})
									.catch((err) => {
										reject(err)
									})
										
								} catch (err) {
									reject(err)
								}
							});
						},
						incDecWhere: (inc, column, cases, opts) => {
							return new Promise((resolve, reject) => {
								try {
									var defaults = {
										schema: "public",
										opArray: null,
									}
									var options
									if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
				
									var fName = "db.increment";
									//object keys will become columns, object values will be written to those columns
									//make sure <object> is an actual object
									processCases(cases, options.opArray)
									.then((valueSet) => {
										var query = `UPDATE ${options.schema}.${options.table} SET ${column} = ${column} + ${inc} WHERE ${valueSet.valCases};`
										log(query)
										dbQuery(this.pool, query, valueSet.valArray)
										.then((queryRes) => {
											log(valueSet.valArray)
											resolve(queryRes)
										})
										.catch((err) => {
											reject(err)
										})
									})
									.catch((err) => {
										//error running processCasesWithValues()
										//handle error
										reject({errText: `[ERR: ${fName}] Error running processCasesWithValues()`, err})
									})
										
								} catch (err) {
									reject(err)
								}
							});
						},
					}

					this.delete = {
						schema: (opts) => {
							return new Promise((resolve, reject) => {
								var defaults = {
									overwrite: false
								}
								var options
								if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
				
								//CREATE SCHEMA IF NOT EXISTS schema_adrauth
								var query = ``;
								if (options.overwrite) {
									query += `DROP SCHEMA ${options.schema}`;
								} else {
									query += `DROP SCHEMA IF EXISTS ${options.schema}`;
								}
								log(query)
								dbQuery(this.pool, query)
								.then((queryRes) => {
									resolve(queryRes)
								})
								.catch((err) => {
									reject(err)
								})
							})
						},
						table: (opts) => {
							return new Promise((resolve, reject) => {
								var defaults = {
									schema: "public",
								}
								var options
								if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
								//CREATE SCHEMA IF NOT EXISTS schema_adrauth
								var query = `DROP TABLE "${options.schema}".${options.name};`;
								log(query)
								dbQuery(this.pool, query)
								.then((queryRes) => {
									resolve(queryRes)
								})
								.catch((err) => {
									reject(err)
								})
								
							})
						},
						record: (whereCases, opts) => {
							return new Promise((resolve, reject) => {
								try {
									var defaults = {
										schema: "public",
										opArray: null
									}
									var options
									if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
				
									var fName = "db.delete";
				
									//object keys will become columns, object values will be written to those columns
									//make sure <object> is an actual object
									if (typeof(whereCases) == "object" && !Array.isArray(whereCases)) {
										if (typeof(options.table) == "string") {
											processCases(whereCases, options.opArray)
											.then((valueSet) => {
												var query = `DELETE FROM ${options.schema}.${options.table} WHERE ${valueSet.valCases};`;
												log(query)
												dbQuery(this.pool, query, valueSet.valArray)
												.then((queryRes) => {
													resolve(queryRes)
												})
												.catch((err) => {
													reject(err)
												})
											})
											.catch((err) => {
												//error running processCases()
												//handle error
												reject({errText: `[ERR: ${fName}] Error running processCases()`, err})
											})
				
										} else {
											reject(`[ERR: ${fName}] First argument must be of type 'string', got '${typeof(options.table)}'.`)
										}
									} else {
										reject(`[ERR: ${fName}] Second argument must be of type 'object', got '${typeof(whereCases)}'.`)
									}
								} catch (err) {
									reject(err)
								}
							});
						},
					}

					this.list = {
						tables: (opts) => {
							return new Promise((resolve, reject) => {
								var defaults = {
									schema: "public"
								}
								var options
								if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
								//SELECT * FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';
								var query = ""
								if (options.schema) {
									//return all tables in schema
									query = `SELECT * FROM pg_catalog.pg_tables WHERE schemaname = '${options.schema}';`
								} else {
									//return all tables in ALL schemas
									query = `SELECT * FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';`
								}
								dbQuery(this.pool, query)
								.then((queryRes) => {
									log(queryRes)
									resolve(queryRes)
								})
								.catch((err) => {
									//in db query
									reject(err)
								})
							})
						},
						schemas: (opts) => {
							return new Promise((resolve, reject) => {
								var defaults = {
								}
								var options
								if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
								//SELECT schema_name FROM information_schema.schemata;
								var query = `SELECT schema_name FROM information_schema.schemata;`
								dbQuery(this.pool, query)
								.then((queryRes) => {
									log(queryRes)
									resolve(queryRes)
								})
								.catch((err) => {
									//in db query
									reject(err)
								})
							})
						},
					}

					this.count = {
						tables: (opts) => {
							return new Promise((resolve, reject) => {
								try {
									var defaults = {
										schema: "public",
									}
									var options
									if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
									
									var fName = "db.rowCountEstimate";
									//object keys will become columns, object values will be written to those columns
									//make sure <object> is an actual object
									var query = ""
									if (options.schema) {
										//return all tables in schema
										query = `SELECT count(*) FROM information_schema.tables WHERE table_schema = '${options.schema}';`
									} else {
										//return all tables in ALL schemas
										query = `select count(*) from information_schema.tables where table_type = 'BASE TABLE';`
									}
									log(query)
									dbQuery(this.pool, query)
									.then((queryRes) => {
										resolve(queryRes)
									})
									.catch((err) => {
										reject(err)
									})
								} catch (err) {
									reject(err)
								}
							});
						},
						rowsEstimate: (opts) => {
							return new Promise((resolve, reject) => {
								try {
									var defaults = {
										schema: "public",
									}
									var options
									if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
				
									var fName = "db.rowCountEstimate";
									//object keys will become columns, object values will be written to those columns
									//make sure <object> is an actual object
									if (typeof(options.table) == "string") {
										var query = `SELECT reltuples AS estimate FROM pg_class WHERE relname = '${options.schema}.${options.table}';`;
										log(query)
										dbQuery(this.pool, query, valueSet.valArray)
										.then((queryRes) => {
											resolve(queryRes)
										})
										.catch((err) => {
											reject(err)
										})
										
									} else {
										reject(`[ERR: ${fName}] First argument must be of type 'string', got '${typeof(options.table)}'.`)
									}
								} catch (err) {
									reject(err)
								}
							});
						},
						rows: (opts) => {
							return new Promise((resolve, reject) => {
								try {
									var defaults = {
										schema: "public",
									}
									var options
									if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
				
									var fName = "db.rowCount";
									//object keys will become columns, object values will be written to those columns
									//make sure <object> is an actual object
									if (typeof(options.table) == "string") {
										var query = `SELECT count(*) FROM ${options.schema}.${options.table};`;
										log(query)
										dbQuery(this.pool, query, valueSet.valArray)
										.then((queryRes) => {
											resolve(queryRes)
										})
										.catch((err) => {
											reject(err)
										})
										
									} else {
										reject(`[ERR: ${fName}] First argument must be of type 'string', got '${typeof(options.table)}'.`)
									}
								} catch (err) {
									reject(err)
								}
							});
						},
					}

					this.utils = {
						primKey: {
							correctNext: (opts) => {
								return new Promise((resolve, reject) => {
									//this function heals numeric primary key sequences when they error irrationally after things like backup-loads
									var defaults = {
										schema: "public",
									}
									var options
									if (opts) { options = processOptions(opts, defaults) } else {options = defaults}
					
									// Step 1) Get the primary key of the requested table
									var query = `SELECT string_agg(a.attname, ', ') AS pk
													FROM
														pg_constraint AS c
														CROSS JOIN LATERAL UNNEST(c.conkey) AS cols(colnum) -- conkey is a list of the columns of the constraint; so we split it into rows so that we can join all column numbers onto their names in pg_attribute
														INNER JOIN pg_attribute AS a ON a.attrelid = c.conrelid AND cols.colnum = a.attnum
													WHERE
														c.contype = 'p' -- p = primary key constraint
														AND c.conrelid = '${options.schema}.${options.table}'::REGCLASS;`
									
									//log(query)
									dbQuery(this.pool, query)
									.then((DBprimKey) => {
										var primKey = DBprimKey.rows[0].pk
					
											// Step 2) Check max number in <prim key> column of the table
											dbQuery(this.pool, `SELECT MAX(${primKey}) FROM ${options.schema}.${options.table};`)
											.then((queryRes) => {
												var maxKey = queryRes.rows[0].max
												// Step 3) The next primkey number should be one higher than the max value,
												// 	if it is not, set the next key value to the current max number, so the next value will be the next number after the following query increments it
												
												dbQuery(this.pool, `SELECT setval('${options.schema}."${options.table}_${primKey}_seq"', ${parseInt(maxKey)});`)
												.then((queryRes) => {
													//log(queryRes.rows)
													resolve({ schema: options.schema, table: options.table })
												})
												.catch((err) => {
													//in db query
													reject(err)
												})
					
											})
											.catch((err) => {
												//Error checking max number in <prim key> column of the table
												reject(err)
											})
										
									})
									.catch((err) => {
										//Error getting the primary key of the requested table
										reject(err)
									})
								})
							},
						}
					}

					//callback to allDB
					callback(null, "DBLink created")
				} catch (err) {
					callback(err)
				}
			} else {
				callback(tcheck.failed)
				//callback("one or more input parameters were incorrect")
			}
		}
		disconnect() {

		}
	},
};


function processCases(cases, opArray) {
    return new Promise((resolve, reject) => {
        var oaIncrement = 0;
        var valDollarIncrement = 1;
        var valArray = [];
        var valCases = "";

        if (typeof(cases) == "object" && !Array.isArray(cases)) {
            var casesArr = Object.keys(cases);
            if (casesArr.length > 1) {
                //iterate through all keys
                for (var ncase of casesArr) {
                    if (ncase == casesArr[casesArr.length-1]) {
                        //this is the last ncase
                        if (opArray) {
                            if (Array.isArray(opArray)) {
                                //an operator array was passed, and it is actually an array
                                if (typeof(opArray[oaIncrement]) == "string") {
                                    valCases += `${ncase} ${opArray[oaIncrement]} ` + "$" + valDollarIncrement;
                                    valArray.push(cases[ncase]);
                                    valDollarIncrement++;
                                    oaIncrement++;
                                } else {
                                    //all opArray items must be string
                                    reject(`[ERR: ${fName}] All values in third argument array must be string.`);
                                }
                            } else {
                                //opArray must be array
                                reject(`[ERR: ${fName}] If third argument is used, it must be an array. Got '${typeof(opArray)}'.`);
                            }
                        } else {
                            //no opArray was passed at all, or it was falsy
                            valCases += `${ncase} = ` + "$" + valDollarIncrement;
                            valArray.push(cases[ncase]);
                            valDollarIncrement++;
                        }
                    } else {
                        //this is *not* the last ncase
                        if (opArray) {
                            if (Array.isArray(opArray)) {
                                //an operator array was passed, and it is actually an array
                                if (typeof(opArray[oaIncrement]) == "string") {
                                    valCases += `${ncase} ${opArray[oaIncrement]} ` + "$" + valDollarIncrement + " AND ";
                                    valArray.push(cases[ncase]);
                                    valDollarIncrement++;
                                    oaIncrement++;
                                } else {
                                    //all opArray items must be string
                                    reject(`[ERR: ${fName}] All values in third argument array must be string.`);
                                }
                            } else {
                                //opArray must be array
                                reject(`[ERR: ${fName}] If third argument is used, it must be an array. Got '${typeof(opArray)}'.`);
                            }
                        } else {
                            //no opArray was passed at all, or it was falsy
                            valCases += `${ncase} = ` + "$" + valDollarIncrement + " AND ";
                            valArray.push(cases[ncase]);
                            valDollarIncrement++;
                            
                        }
                    }
                }
            } else {
                //only one ncase, no need to loop
                if (opArray && Array.isArray(opArray)) {
                    valCases = `${casesArr[0]} ${opArray[0]} ` + "$1";
                    valArray.push(cases[casesArr[0]]);
                } else {
                    valCases = `${casesArr[0]} = ` + "$1";
                    valArray.push(cases[casesArr[0]]);
                }
            }

			resolve({doCases: true, valArray, valCases})

        } else {
            resolve({doCases: false})
        }
    }) 
}

function processCasesWithValues(cases, opArray, values) {
    return new Promise((resolve, reject) => {
		var oaIncrement = 0;
		var valDollarIncrement = 1;
		var valArray = [];
		var valCases = "";
		var valValues = "";
		
		if (typeof(cases) == "object" && !Array.isArray(cases)) {
			//cases is set
			var casesArr = Object.keys(cases);
			if (casesArr.length > 1) {
				//iterate through all keys
				for (var ncase of casesArr) {
					if (ncase == casesArr[casesArr.length-1]) {
						//this is the last ncase
						if (opArray) {
							if (Array.isArray(opArray)) {
								//an operator array was passed, and it is actually an array
								if (typeof(opArray[oaIncrement]) == "string") {
									valCases += `${ncase} ${opArray[oaIncrement]} ` + "$" + valDollarIncrement;
									valArray.push(cases[ncase]);
									valDollarIncrement++;
									oaIncrement++;
								} else {
									//all opArray items must be string
									reject(`[ERR: ${fName}] All values in third argument array must be string.`);
								}
							} else {
								//opArray must be array
								reject(`[ERR: ${fName}] If fourth argument is used, it must be an array. Got '${typeof(opArray)}'.`);
							}
						} else {
							//no opArray was passed at all, or it was falsy
							valCases += `${ncase} = ` + "$" + valDollarIncrement;
							valArray.push(cases[ncase]);
							valDollarIncrement++;
						}
					} else {
						//this is *not* the last ncase
						if (opArray) {
							if (Array.isArray(opArray)) {
								//an operator array was passed, and it is actually an array
								if (typeof(opArray[oaIncrement]) == "string") {
									valCases += `${ncase} ${opArray[oaIncrement]} ` + "$" + valDollarIncrement + " AND ";
									valArray.push(cases[ncase]);
									valDollarIncrement++;
									oaIncrement++;
								} else {
									//all opArray items must be string
									reject(`[ERR: ${fName}] All values in third argument array must be string.`);
								}
							} else {
								//opArray must be array
								reject(`[ERR: ${fName}] If fourth argument is used, it must be an array. Got '${typeof(opArray)}'.`);
							}
						} else {
							//no opArray was passed at all, or it was falsy
							valCases += `${ncase} = ` + "$" + valDollarIncrement + " AND ";
							valArray.push(cases[ncase]);
							valDollarIncrement++;
							
						}
					}
				}
			} else {
				//only one ncase, no need to loop
				if (opArray && Array.isArray(opArray)) {
					valCases = `${casesArr[0]} ${opArray[0]} ` + "$" + valDollarIncrement;
					valArray.push(cases[casesArr[0]]);
					valDollarIncrement++;
				} else {
					valCases = `${casesArr[0]} = ` + "$" + valDollarIncrement;
					valArray.push(cases[casesArr[0]]);
					valDollarIncrement++;
				}
			}
		}
		
		var keysArr = Object.keys(values);
		if (keysArr.length > 1) {
			//iterate through all keys
			for (key of keysArr) {
				if (key == keysArr[keysArr.length-1]) {
					//this is the last key
					valValues += `${key} = ` + "$" + valDollarIncrement;
					valArray.push(values[key]);
					valDollarIncrement++;
					
				} else {
					//this is *not* the last key
					valValues += `${key} = ` + "$" + valDollarIncrement + ", ";
					valArray.push(values[key]);
					valDollarIncrement++;
				}
			}
		} else {
			valValues = `${keysArr[0]} = ` + "$" + valDollarIncrement;
			valArray.push(values[keysArr[0]]);
			valDollarIncrement++;
		}

		resolve({valArray, valCases, valValues})

	})
}

function processValues(object) {
	return new Promise((resolve, reject) => {
		try {
			var colsArr = Object.keys(object);
			var valArray = [];
			var valDollarIncrement = 1;
			var valDollars = "";
			var cols = "";
			
			if (colsArr.length > 1) {
				//iterate through all keys
				for (var key of colsArr) {
					if (key == colsArr[colsArr.length-1]) {
						//this is the last key, dont add a comma to <cols>
						cols += key;
						valDollars += ("$" + valDollarIncrement)
						valArray.push(object[key]);
					} else {
						//this is *not* the last key
						cols += `${key}, `;
						valDollars += ("$" + valDollarIncrement + ", ")
						valDollarIncrement++
						valArray.push(object[key]);
					}
				}
			} else {
				//only one key, no need to loop
				cols = colsArr[0];
				valDollars = "$1"
				valArray.push(object[colsArr[0]]);
			}

			resolve({cols, valArray, valDollars})
		} catch (err) {
			reject(err)
		}

	})
}

function processCols(cols, tableName) {
	return new Promise((resolve, reject) => {
		/* this processes column settings for creation of tables */
		/* sample <cols> format:
			[
				{name: "id", type: "bigint", allowEmpty: false, autoInc: true, primaryKey: true},
				{name: "title", type: "text"},
				{name: "zip", type: "int"},
			]
		*/
		try {
			var colDefaults = {
				allowEmpty: true,
				autoInc: false,
				primaryKey: false
			}
			var outQueryInsert = ""
			var outConstraints = ""

			let i = 0;
			for ( var col of cols ) {
				//iterate through each passed column def
				if (col["name"] && typeof(col["name"]) == "string") {
					//col name provided
					if (col["type"] && typeof(col["type"]) == "string") {
						//col type provided, process column
						var colOptions = { ...colDefaults, ...col }
						var queryString = `${col["name"]} ${col["type"]} `
						if (!col["allowEmpty"]) {
							//do not allow empty/allow null
							queryString += "NOT NULL "
						}
						if (col["autoInc"]) {
							//set auto increment
							queryString += "GENERATED ALWAYS AS IDENTITY "
						}
						if (col["primaryKey"]) {
							//add primary key constraint to end-attached constraints
							if (outConstraints == "") {
								//outConstraints is blank, do not add leading comma
								outConstraints += `CONSTRAINT ${tableName}_pkey PRIMARY KEY ( ${col["name"]} ) `
							} else {
								outConstraints += ` , CONSTRAINT ${tableName}_pkey PRIMARY KEY ( ${col["name"]} ) `
							}
							
						}
	
	
						//done processing column, add to outQueryInsert string
						if (outQueryInsert == "") {
							//outQueryInsert is blank, do not add leading comma
							outQueryInsert += queryString
						} else {
							outQueryInsert += ` , ${queryString}`
						}
	
					} else {
						log(`column type required, ignoring entry without column type (${i})...`)
					}
	
				} else {
					log(`column name required, ignoring entry without column name (${i})...`)
				}
				i++
			}
			
			if (outConstraints != "") {
				//outConstraints not blank, append to end of query part
				outQueryInsert += ` , ${outConstraints}`
				resolve({queryCols: outQueryInsert})
			} else {
				// no need to append any constraints
				resolve({queryCols: outQueryInsert})
			}
		} catch (err) {
			reject(err)
		}
	})
}

function processOptions(opts, defaults) {
	return { ...defaults, ...opts }
	
}

function processDBCreateOptions(opts, defaults) {
	var outOpts = ""
	if (opts.owner) {

	}
	
}

function dbQuery(pool, query, valArray) {
    return new Promise((resolve, reject) => {
        pool.connect((err, client, release) => {
			try {
				if (err) {
					reject(err)
				}
				if (valArray) {
					//an array of values was passed, which needs to be sent to the database
					client.query(query, valArray, (err, res) => {
						if (err) {
							//err writing to db
							release()
							reject(err)
						} else {
							//item written to db
							release()
							resolve(res)
						}
						
					})
				} else {
					//no values were passed, this request has no selection 
					client.query(query, (err, res) => {
						if (err) {
							//err writing to db
							release()
							reject(err)
						} else {
							//item written to db
							release()
							resolve(res)
						}
						
					})
				}
				
			} catch (err) {
				reject(err)
			}
            
        })
    })
}

function processResponse(queryRes) {

}

function log(text) {
    if (globals.consoleLogQueries) {
        log(text)
    }
}