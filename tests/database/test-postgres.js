const assert = require("chai").assert
var expect = require('chai').expect;

const {AllDB} = require('../../allDB.js')
const fs = require('node:fs');

var db = null

describe("Database Connection", () => {
    it("should successfully connect to postgres database with supplied config/creds.json", () => {
        //test connection to postgres database
        var connect = JSON.parse(fs.readFileSync("config/creds.json"))
        assert.typeOf( connect, "object" )

        db = new AllDB({ mode: 'postgres', connect }, (err, resp) => {
            //assert.isUndefined( err )
            //assert.equal( (err == null), true )
            assert.equal( err, null )
            assert.equal( resp, "DBLink created" )
        })
    })
})

describe("Select Operations", () => {
    it("should select all items in a given table", () => {
        //test database select all
        return db.actions.selectAll("books")
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("should select all items within specific columns in a given table", () => {
        //test database select cols
        return db.actions.selectCols("books", "urltitle, title")
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
        })
        .catch(err => {
            throw(err)
        })
    })
    it("should select *specific* items within specific columns in a given table", () => {
        //test database select cols
        return db.actions.selectCols("books", "urltitle, title", {author: 'By Bristol Loren'})
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
        })
        .catch(err => {
            throw(err)
        })
    })
})

describe("Maintenance Operations", () => {
    it("should heal the primary key series in a given table, by setting the next primkey number to the <max> number in the primary key column", () => {
        //test heal primKey sequence
        return db.actions.healPrimKeys({table: "books"})
        .then((res) => {
            console.log(res)
            assert.typeOf( res, "object" )

        })
        .catch(err => {
            throw(err)
        })
    })
})

describe("Insert and modify operations", () => {
    it("should successfully CREATE a schema", () => {
        //test schema creation
        return db.actions.createSchema({schema: "alldb_test_schema"})
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("should successfully CREATE a table in the schema", () => {
        //test table creation
        var cols = [
            {name: "id", type: "bigint", allowEmpty: false, autoInc: true, primaryKey: true},
            {name: "title", type: "text"},
            {name: "zip", type: "int"},
        ]
        return db.actions.createTable({schema: "alldb_test_schema", name: "testTable", cols})
        .then((res) => {

            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("should successfully INSERT a record into the table", () => {
        //test database insert
        db.actions.insert({title: "testSem", zip: 91467}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("should successfully UPDATE a record in a specified table", () => {
        //test database update
        return db.actions.update({zip: 71346}, {title: "testSem", zip: 91467}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
    it("should successfully DELETE a record from a specified table", () => {
        //test database insert
        return db.actions.delete({title: "testSem"}, {schema: "alldb_test_schema", table: "testTable"})
        .then((res) => {
            assert.typeOf( res, "object" )
            assert.isArray( res.rows )
            
        })
        .catch(err => {
            throw(err)
        })
    })
})