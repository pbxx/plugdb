const assert = require("chai").assert
var expect = require('chai').expect;

const {AllDB} = require('../allDB.js')
const fs = require('node:fs');

var db = null

var testOptions = {
    deleteOnFinish: false,
    deleteOnStart: true,
    consoleLog: true,
}

describe("Database Connection", () => {
    it("should successfully connect to postgres database with supplied config/creds.json", () => {
        //test connection to postgres database
        var config = JSON.parse(fs.readFileSync("config/creds.json"))
        assert.typeOf( config, "object" )

        db = new AllDB(config, (err, resp) => {
            //assert.isUndefined( err )
            //assert.equal( (err == null), true )
            if (err) {
                throw err
            }
            assert.equal( err, null )
            assert.equal( resp, "DBLink created" )
        })
    })
    
})

describe("Delete operations", () => {
    if (testOptions.deleteOnStart) {
        deleteOperations()
    }
})

describe("Create-Read-Update operations", () => {
    it("Create a schema", () => {
        //test schema creation
        return db.actions.create.schema({schema: "alldb_test_schema"})
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("Create a table in the schema", () => {
        //test table creation
        var cols = [
            {name: "id", type: "bigint", allowEmpty: false, autoInc: true, primaryKey: true},
            {name: "title", type: "text"},
            {name: "zip", type: "int"},
        ]
        return db.actions.create.table({schema: "alldb_test_schema", name: "testTable", cols})
        .then((res) => {

            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    
    it("Create a record into the table", () => {
        //test database insert
        return db.actions.create.record({title: "testSem", zip: 91467}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            log(res.rowCount)
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("Read all items in the table", () => {
        //test database select all
        return db.actions.get.all({schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("Read all items within specific columns in a given table", () => {
        //test database select cols
        return db.actions.get.cols("id, zip", {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
        })
        .catch(err => {
            throw(err)
        })
    })
    it("Read *specific* items within specific columns in a given table", () => {
        //test database select cols
        return db.actions.get.colsWhere("title, zip", {id: 1}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
        })
        .catch(err => {
            throw(err)
        })
    })
    it("Update a record in a specified table", () => {
        //test database update
        return db.actions.update.record({zip: 71346}, {title: "testSem", zip: 91467}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            log(res.rowCount)
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("   'zip' value updated to 71346", () => {
        //test database insert
        return db.actions.get.colsWhere("zip", {id: 1}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            log(res.rows)
            assert.isArray( res.rows )
            assert.equal(res.rows[0].zip, 71346)
            
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("Increment a record in a specified table column", () => {
        //test database update
        return db.actions.update.incDecWhere(3, "zip", {id: 1}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            log(res.rowCount)
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("   'zip' value incremented to 71349", () => {
        //test database insert
        return db.actions.get.colsWhere("zip", {id: 1}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            log(res.rows)
            assert.isArray( res.rows )
            assert.equal(res.rows[0].zip, 71349)
            
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("   add another record to test multi increment/decrement", () => {
        //test database insert
        return db.actions.create.record({title: "testSem", zip: 91467}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("Decrement ALL records in a specified table column", () => {
        //test database update
        return db.actions.update.incDecAll(-16, "zip", {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            log(res.rowCount)
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("   'zip' value should now be 71333 for the first record and 91451 for the second record", () => {
        //check first record
        return db.actions.get.colsWhere("zip", {id: 1}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            log(res.rows)
            assert.isArray( res.rows )
            assert.equal(res.rows[0].zip, 71333)

            //now check second record
            return db.actions.get.colsWhere("zip", {id: 2}, {schema: "alldb_test_schema", table: "testTable"})
            .then((res) => {
                assert.typeOf( res, "object" )
                log(res.rows)
                assert.isArray( res.rows )
                assert.equal(res.rows[0].zip, 91451)
                
                
            })
            .catch(err => {
                throw(err)
            })
        })
        .catch(err => {
            throw(err)
        })
    })
})

describe("List operations", () => {
    it("should list all tables", () => {
        //test database insert
        return db.actions.list.tables()
        .then((res) => {
            log(res.rows)
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("should list all tables within a schema", () => {
        //test database insert
        return db.actions.list.tables({schema: "alldb_test_schema"})
        .then((res) => {
            log(res.rows)
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("should list all schemas in the selected database", () => {
        //test database insert
        //SELECT schema_name FROM information_schema.schemata;
        return db.actions.list.schemas()
        .then((res) => {
            assert.typeOf( res, "object" )
            log(res.rows)
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
})

describe("Count operations", () => {
    it("should count all tables", () => {
        //test database insert
        return db.actions.count.tables()
        .then((res) => {
            log(res.rows)
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("should count all tables within a schema", () => {
        //test database insert
        return db.actions.count.tables({schema: "alldb_test_schema"})
        .then((res) => {
            log(res.rows)
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("should count all schemas", () => {
        //test database insert
        return db.actions.count.schemas()
        .then((res) => {
            log(res.rows)
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
})

describe("Correct issues with next primary key numbers", () => {
    it("   add 1 of 2 records...", () => {
        //test database insert
        return db.actions.create.record({title: "badRecord", zip: 14228}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            log(res.rows)
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("   add 2 of 2 records...", () => {
        //test database insert
        return db.actions.create.record({title: "badRecord", zip: 14228}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("   delete the records to introduce a primary key gap", () => {
        //test DELETE a record
        return db.actions.delete.record({title: "badRecord"}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("   add a record to visualize key gap", () => {
        //test database insert
        return db.actions.create.record({title: "fickleRecord", zip: 14228}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("   'id' value is 5, indicating key gap problem", () => {
        //test database insert
        return db.actions.get.colsWhere("id", {title: "fickleRecord"}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            log(res.rows)
            assert.isArray( res.rows )
            assert.equal(res.rows[0].id, 5)
            
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("   delete this record so gap can be manually fixed", () => {
        //test database insert
        return db.actions.delete.record({id: 5}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("Heal next primary key in sequence, by setting the next primkey number to the <max> number in the primary key column", () => {
        //test heal primKey sequence
        return db.actions.utils.primKey.correctNext({schema: "alldb_test_schema", table: "testtable"})
        .then((res) => {
            log(res)
            assert.typeOf( res, "object" )

        })
        .catch(err => {
            throw(err)
        })
    })
    it("   add another record to visualize key gap fixed", () => {
        //test database insert
        return db.actions.create.record({title: "fickleRecord", zip: 14228}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("   'id' value is now 3, indicating key gap has been fixed", () => {
        //test database insert
        return db.actions.get.colsWhere("id", {title: "fickleRecord"}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            log(res.rows)
            assert.isArray( res.rows )
            assert.equal(res.rows[0].id, 3)
            
            
        })
        .catch(err => {
            throw(err)
        })
    })
})



describe("Delete operations", () => {
    if (testOptions.deleteOnFinish) {
        deleteOperations()
    }
})

function deleteOperations() {
    it("Delete a record from a specified table", () => {
        //test DELETE a record
        return db.actions.delete.record({title: "testSem"}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("Delete table", () => {
        //test table deletion
        return db.actions.delete.table({schema: "alldb_test_schema", name: "testTable"})
        .then((res) => {

            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("Delete schema", () => {
        //test schema deletion
        return db.actions.delete.schema({schema: "alldb_test_schema"})
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    
}

describe("Disconnect on finish", () => {
    it("disconnect from database server", () => {
        //test schema deletion
        try {
            db = db.disconnect()
        } catch (err) {
            throw err
        }
    })
})



function log(text) {
    if (testOptions.consoleLog) {
        console.log(text)
    }
}