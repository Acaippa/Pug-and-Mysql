const express = require('express')
const app = express()
var mysql = require('mysql')

app.set('view engine', 'pug')

// connect to the database
var con = mysql.createConnection({
  host: "192.168.1.191",
  port : 3306,
  user: "root",
  password: "rootadmin123",
});

// Exception handling for conntecting with the databse
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  con.query("USE test")
});

// home page
app.get("/home", (req, res) => { // When the user requests the "/home" url, express returns the request from the client, and a respond object that we can use to send a response back to the client

  con.query("SELECT * FROM brukere", (err, result, fields) => { // When quering the database, we can pass the result onto a function and process them

    res.render("home", {users : result}) // return all the users to the page

  })
})


// add user page
app.get("/adduser", (req, res) => {

  con.query("SELECT * FROM brukere", (err, result, fields) => {

    let fieldList = []

    for (let i = 0; i < fields.length; i++){ // loop through all the fields and check if their name doesnt end with "_", if not add them to the field list.

      if (fields[i].name.slice(-1) != "_") {

        fieldList.push(fields[i].name)

      }

    }

    res.render("adduser", {fields : fieldList}) // In order to be able to use the fieldlist in the html document, we have to pass the context into the rendering engine so it can parse the context into the html document and return it to the user.

  })

})

function get_id(){
  return Math.floor(Math.random() * 1000)
}

// add user backend
app.get("/adduserbackend", (req, res) => {
  // values from the URL.

  name = req.query["name"]

  // Insert the name and id into the database and redirect to the home page

  con.query(`INSERT INTO brukere (name, id_) VALUES ('${name}', ${get_id()})`, function(err, result, fields) {
    console.log(err)

  })

  res.redirect("/home")
})

// Delete user page
app.get("/deleteuser", (req, res) => {

  con.query("SELECT * FROM brukere", (err, result, fields) => {

    res.render("deleteuser", {users : result})
  })
})

// Delete user backend
app.get("/deleteuserbackend", (req, res) => {

  let ids = req.query["id"] // Get all the ids that has been selected by the user

  if (typeof ids != "string"){ // If the type of ids is as tring, the selection is a single user, therefore we only want to loop through all the items in ids when its not a string. If not we end up looping through all the numbers in the id.

    for (let i = 0; i < ids.length; i++) { // Loop through all the ids and delete the name from the database with the same id.

      con.query(`DELETE FROM brukere WHERE id_ = ${ids[i]}`, (err, result, fields) => {
        console.log(err) // If there is any errors, we just print it on the server. This is mainly for debugging purposes.

      })

    }

  }

  else{

    con.query(`DELETE FROM brukere WHERE id_ = ${ids}`, (err, result, fields) => { // If the selection is a single name, just delete ir from the database.
        console.log(err)

    })

  }

  res.redirect("/home")

})

// Listen for connections
app.listen(3000, () => console.log("Listening on port 3000"))