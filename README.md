# Pug-and-Mysql
A short demonstration of how you can interact with a MySql database using Node.js.

## Getting started
If you want to follow along, you'll first of all need a MySql database setup and know its IP and password. Running the code as is will cause an error. The server needs Node.js to be installed to work as well.

[Download Node.js](https://nodejs.org/en/download/)

[Download MySql](https://dev.mysql.com/downloads/installer/)

**Once both MySql and Nodejs have been installed**, go ahead and set up a database connection in MySql, and create a database with a "users" table with a *name* variable and an *id* Primary key as shown below. I will not cover how to but there are plenty of tutorials online.

(MySql)

```
CREATE TABLE brukere
(
    name varchar(50),
    id_ int PRIMARY KEY
);
```
The underscore after the ID is important to add so that we can detect it in the code. This will make us able to differentiate between automatic fields and fields filled out by the user.

To make Nodejs able to send and receive requests, you need to install [express](https://www.npmjs.com/package/express) by typing in `npm install express`. The npm package manager is included with the Nodejs installer.

You also want to be able to display context from the server onto the HTML file. For this, you need to install [pug](https://www.npmjs.com/package/pug) with `npm install pug`

## The code
I will now go into detail as to how the code works.

Import the needed packages and set pug as the view engine

(server.js)

```
const express = require('express')
const app = express()
var mysql = require('mysql')
app.set('view engine', 'pug')
```
Connect to your MySql database

(server.js)

```
var con = mysql.createConnection({
  host: "localhost",
  port : 3306,
  user: "root",
  password: "rootadmin123",
});
```
Try to connect to the database. If any errors arise print them onto the console. If not the code will continue and query the database to use the "test" database. ***If you have named your database something else you need to change "test" into the name of your database***

(server.js)

```
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  con.query("USE test")
});
```
Now you are going to write the first GET function for the server. When the client sends a request for the "/home" page, Express will return a request object and a response object. Before rendering and sending the HTML document to the user, we query the database to get all the rows from the "brukere" table. "brukere" will be "users" in your case. We pass the result as a value in a dictionary to the pug file, the key being named whatever you want.

(server.js)

```
// home page
app.get("/home", (req, res) => {
  con.query("SELECT * FROM brukere", (err, result, fields) => {
    res.render("home", {users : result}) // return all the users to views/home.pug
  })
})
```
Now in the home.pug file, the first line of code indicates that this is an extension of the main.pug file. This makes us able to make a main template, where we house all our bootstrap and css, followed by a [block](https://pugjs.org/language/inheritance.html) that tells pug where any extending files should be inserted.

(main.pug)
```
head
   title Exploring the Pug template
   <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-iYQeCzEYFbKjA/T2uDLTpkwGzCiq6soy8tYaI1GyVh/UjpbCx/TYkiZhlZB6+fzT" crossorigin="anonymous"><script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.1/dist/js/bootstrap.bundle.min.js" integrity="sha384-u1OknCvxWvY5kfmNBILK2hRnQC3Pr17a+RTT6rIHI7NnikvbZlHgTPOOmMi466C8" crossorigin="anonymous"></script>

body(style="background-color:#232323; color:white;")
   block content //- Where any extending files will be inserted.
   style(type="text/css").
      .custom-container {
         display:flex;
         align-items:center;
         justify-content:center;
         margin-top:100px;
      }

      .custom-container1 {
         border-radius:5px;
         background-color:#2c2c2c;
         padding:10px;
      }

      .button {
         background-color:#ffffff;
         border-radius:5px;
      }
```
Now back to home.pug, we see the all-familiar "extends" tag. Followed by the content we want extending into main.pug. The only code we need to look at here is where we check the length of the "users" that we passed in Nodejs. We check that the amount of users is not zero, if so we list all the users in the database. If the number of users is zero, we instead inform the client of that.

(home.pug)
```
extends main.pug

block content
   div.custom-container
      div.custom-container1
         h1 Home
         h4 --All users in the database--
         
         //- important
         if users.length != 0
            ul
               each user in users
                  li= user.name
         else
            p No users in the database
         //- important

         a(href="/adduser") Add new user 
         br
         a(href="/deleteuser") Delete user
         p #{error}
```
Back again at server.js, we see the code where the client can add a new user to the database. We begin by the usual `app.get` and `con.query`. But this time we don't use the results from `con.query` rather we look at the fields returned by the connection. We then loop through all the fields in the "brukere" table and find the ones without an underscore at the end of it. We then add this to the fieldlist and pass the fieldlist to the adduser.pug file when rendering.

(server.js)

```
// add user page
app.get("/adduser", (req, res) => {
  con.query("SELECT * FROM brukere", (err, result, fields) => {
    let fieldList = []
    for (let i = 0; i < fields.length; i++){ // loop through all the fields and check if their name doesnt end with "_", if not add them to the field list.
      if (fields[i].name.slice(-1) != "_") {
        fieldList.push(fields[i].name)
      }
    }
    res.render("adduser", {fields : fieldList})
  })
})
```
This is the adduser.pug file. Here we just loop through the fields from the server and make a label and an input for it.

(adduser.pug)

```
extends main.pug
block content
	div.custom-container
		div
			h1 Add a new user
			a(href="/home") Home
			form(action="/adduserbackend" method="get").pt-2
				each field in fields
					input(type='text' name="name", value='', placeholder=field).form-control
				br
				input(type="submit", value="submit").button
```
When the client clicks the submit button, its form will go into "/adduserbackend" and add the value of the input as a variable in the url. for example `/adduserbackend?name=newuser` In the Nodejs server we can use another `app.get` function on "/adduserbackend" to see the name that the form passed in the URL by looking at `req.query`. Then we just query the database and tell it to insert a user with that name, and also generate a new random ID for that user. Before redirecting the client to the main page to confirm that they have added a new user.

(server.js)

```
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
```
When deleting a user, we first need to let the client know what users are already on the database. So in Nodejs we just return deleteusers.pug with all the users currently on the database.

(server.js)

```
// Delete user page
app.get("/deleteuser", (req, res) => {

  con.query("SELECT * FROM brukere", (err, result, fields) => {

    res.render("deleteuser", {users : result})
  })
})
```
In deleteuser.pug we list all the users passed from the server and place a toggle beghind their name. When the user clicks submit, the form will go to `/deleteuserbackend` and pass in all the ID's for the selected users. We then use `app.get` again to get all the ID's for the users we want to delete before looping through all of them and removing them from the database.

(adduser.pug)

```
extends main.pug

block content
	div.custom-container
		div.custom-container1
			h1 Delete user

			a(href="/home") Home 
			br
			input(type="checkbox", id="source", onchange="toggle()", name="all")
			label(for="all") Select All

			form(action="/deleteuserbackend")
				each user in users
					input(name="id", class="check", type="checkbox" value=user.id_)
					label(for=user.name) #{user.name}
					br
				input(type="submit", value="Delete")

			script(type="text/javascript").
				function toggle(){
					source = document.getElementById("source")
					checks = document.getElementsByClassName("check")
					for (let i = 0; i < checks.length; i++){
						checks[i].checked = source.checked
						}
				}
```

(server.js)

// Delete user backend
app.get("/deleteuserbackend", (req, res) => {

  let ids = req.query["id"] // Get all the ids that has been selected by the user

  if (typeof ids != "string"){ // If the type of ids is a string, the selection is a single user, therefore we only want to loop through all the items in ids when it's not a string. If not we end up looping through all the numbers in the id.

    for (let i = 0; i < ids.length; i++) { // Loop through all the ids and delete the name from the database with the same id.

      con.query(`DELETE FROM brukere WHERE id_ = ${ids[i]}`, (err, result, fields) => {
        console.log(err) // If there are any errors, we just print it on the server. This is mainly for debugging purposes.

      })

    }

  }

  else{

    con.query(`DELETE FROM brukere WHERE id_ = ${ids}`, (err, result, fields) => { // If the selection is a single name, just delete ir from the database.
        console.log(err)

    })

  }
  
  res.redirect("/home")
  
  We also have to prevent the server from looping through the URL query when there is only one ID, because the server will end up looping through the ID itself, instead of the list of multiple ID's
  
(server.js)
  
```
// Listen for connections
app.listen(3000, () => console.log("Listening on port 3000"))
```
Here we just initialize the server and print out when the server is ready.

Here is a visual demonstration of the whole thing.

<img src="https://iili.io/iAKsVI.png" width=100%>
