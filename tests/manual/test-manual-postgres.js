const {AllDB} = require('../../allDB.js')
const fs = require('node:fs')

//test connection to postgres database
var connect = JSON.parse(fs.readFileSync("config/creds.json"))
//console.log(connect)
var db = new AllDB({ mode: 'postgres', connect }, (err, resp) => {
    
    if (err) {
        console.log(err)
    } else {
        console.log(resp)
        console.log(`Database connected!`)
        
    }
})



//test database select all
db.actions.selectAll("semantics")
.then((res) => {
    console.log("test database select all:")
    console.log(res.rows)
    
})
.catch(err => {
    console.error(err)
})

//test database select cols with case
db.actions.selectCols("books", "urltitle, title", {author: 'By Bristol Loren'})
.then((res) => {
    console.log("test database select cols with case:")
    console.log(res.rows)
})
.catch(err => {
    console.error(err)
})

//test database select cols
db.actions.selectCols("books", "urltitle, title")
.then((res) => {
    console.log("test database select cols:")
    console.log(res.rows)
})
.catch(err => {
    console.error(err)
})

//test heal primKey sequence
db.actions.healPrimKeys({table: "semantics"})
.then((res) => {
    console.log("test heal primKey sequence:")
    console.log(res)

    

})
.catch(err => {
    console.error(err)
})


//test database insert
db.actions.insert("semantics", {name: "testSem", val: "I work well!"})
.then((res) => {
    console.log("test database insert:")
    console.log(res.rows)
    
    
    
})
.catch(err => {
    console.error(err)
})

//test database delete
db.actions.delete("semantics", {name: "testSem"})
.then((res) => {
    console.log("test database delete:")
    console.log(res.rows)
})
.catch(err => {
    console.error(err)
})