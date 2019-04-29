var admin = require("firebase-admin");

var serviceAccount = require("./serviceStuff.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://dynamicfirebasehw.firebaseio.com"
});

var db = admin.database();
var ref = db.ref('users');

var express = require('express');
var app = express();
var ejs = require('ejs');
var bodyParser = require('body-parser');
var request = require('request');

var config = require('./config.js');
const yelp = require('yelp-fusion');
const client = yelp.client(config.api_key);

console.log("Hello!!! It's starting!");
var server = app.listen(3000, function(){
	console.log("server is running at port 3000");
});

'use strict';

app.use('/assets', express.static('assets'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.get('/home', function(req, res){
    res.render('home', {log: null, create: null})
});

var usersRef = ref.child("users");

//Home Page
app.post('/home', function(req,res){
	console.log(req.body.button);
	if(req.body.button == "Log In"){
		res.redirect('../login')
	}
	if(req.body.button == "Create Account"){
		res.redirect('../create')
	}
})

app.get('/create', function(req, res){
    res.render('create', {firstname: null, lastname: null, email: null, username: null, password: null, error: null})
});

//Create Account Page
app.post('/create', function(req, res){
	let first = req.body.firstname;
	let last = req.body.lastname;
	let email = req.body.email;
	let username = req.body.username;
	let password = req.body.password;
	let message = "";

	if(req.body.button == "Log In"){
		res.redirect('../login')
	}

	if(req.body.button == "Create Account"){
		let foundErr = false;
		var dbUsers = []
		usersRef.on('value', function(snapshot) {
    		snapshot.forEach(function(childSnapshot) {
		        var item = childSnapshot.val();
		        item.key = childSnapshot.key;
		        dbUsers.push(item);
		    });
		    if (first == "" || last == "" || email == "" || username == "" || password == ""){
				message = "All fields are required. Please try again.";
				foundErr = true;
			} else{
				for (var i=0; i< dbUsers.length; i++){
			    	if(dbUsers[i] !== undefined){
			    		if(dbUsers[i].us == username){
							foundErr = true;
							message = "Username has been taken, please choose another one!"
							// break;
						}
					}
				}
			}
			if (foundErr === true){
				res.render('create', {error: message})
				foundErr = false;
			} else{
				usersRef.push().set({
					fs: first,
					ls: last,
					mail: email,
					us: username,
					pw: password
				}, finished())
				
			}
		});

		function finished(err){
			console.log("Finished");
			res.redirect('../login');
		}
	}
}) //end post

app.get('/login', function(req, res){
    res.render('login', {username: null, password: null, error:null})
});

//Log in Page
app.post('/login', function(req, res){
	let username = req.body.username;
	let password = req.body.password;
	let foundUser = false;
	let message = "Account doesnt exist. Please create a new account.";
	let accountExist = false;

	if(req.body.button == "Create Account"){
		res.redirect('../create')
	}

	if(req.body.button == "Submit"){
		var dbUsers = []
		usersRef.on('value', function(snapshot) {
    		snapshot.forEach(function(childSnapshot) {
		        var item = childSnapshot.val();
		        item.key = childSnapshot.key;
		        dbUsers.push(item);
		    });
		    if (username == "" || password == ""){
				res.render('login', {error: "All fields are required. Please try again."})
			} else{
				for (var i=0; i< dbUsers.length; i++){
			    	if(dbUsers[i] !== undefined){
			    		// console.log(dbUsers[i].us + " " + dbUsers[i].pw)
			    		if(dbUsers[i].us == username && dbUsers[i].pw == password){
							foundUser = true;
							finished();
							break;
						} else if (dbUsers[i].us == username && dbUsers[i].pw !== password){
							accountExist = true;	
						}
					}
				}
				if (foundUser === false){
					if(accountExist){
						message = "Username or Password is incorrect. Please try again.";
					}
					res.render('login', {error: message})
				}
			}
		});

		function finished(err){
			console.log("Finished");
			res.redirect('../search');

			app.get('/search', function(req, res){
			    res.render('index', {keyword: null, error: null})
			});
		}
	}
}) //end post


//Search Page for a Restaurant
app.post('/search', function(req, res){
	let keyword = req.body.keyword;
	let city = req.body.city;
	let options = [];

	let url = `https://api.yelp.com/v3/businesses/search?term=${keyword}&location=${city}`
	request(url,{'auth': {'bearer': config.api_key}}, function (err, response, body) {
	    if(err){
	      res.render('index', {keyword: null, error: 'Error, please try again'});
	    } else {
	      let place = JSON.parse(response.body);
	      	// let randNum = 0;
			if(place.total >= 20){
				// randNum = Math.floor(Math.random() * 20);
				for (var i = 0; i < 5; i++){
					options.push(place.businesses[i].name);
				}
			} else{
				// randNum = Math.floor(Math.random() * place.total);
				for (var i = 0; i < place.total; i++){
					options.push(place.businesses[i].name);
				}
			}
	        res.render('index', {keyword: 'something', error: null, options});
	    }
	}); //end request
}) //end post

