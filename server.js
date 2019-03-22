const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bodyparser = require('body-parser');
const session = require('express-session');
const timeStamp = require('console-stamp');
const rateLimit = require('express-rate-limit');

const app = express();
const port = 3000; // Our proxy port

//sql setup
const pool = mysql.createPool({
		host: "localhost",
		user: "team6",
		password: "team6",
		database: "team6", // wonderful names I know
		connectionLimit: 10
});


//session config
app.set('trust proxy', 1);
app.use(session({
		secret: 'C[n3Y|BUH@FU(FxNA~Z,EByWlvT:v|',
		resave: false,
		saveUninitialized: true,
		proxy: true,
		rolling: true,
		cookie: {
				secure: true,
				httpOnly: true,
				maxAge: 15 * 60 * 1000
		}
})
);
var logged = {};
setInterval(() => console.log('logged in users: ' + Object.keys(logged)), 15 * 60 * 1000);

//basic rate limiting
const limiter = rateLimit({
		windowMS: 15 * 60 * 1000,
		max: 1000,
		message: 'pls stop botting',
		onLimitReached: function(req, res){
				console.log(`${red}spam limit reached by ${inverse + req.headers['x-forwarded-for'] + reset}`);
				res.end();
		}
});
app.use(limiter);

const pageLimiter = rateLimit({
		windowMS: 15 * 60 * 1000,
		max: 50,
		onLimitReached: function(req, res){
				console.log(`${yellow}page limit reached by ${inverse + req.headers['x-forwarded-for'] + reset}`);
				res.end();
		}
});

const loginLimiter = rateLimit({
		windowMS: 15 * 60 * 1000,
		max: 25,
		message: 'too many login requests in a row, try again in 15 minutes',
		onLimitReached: function(req, res){
				console.log(`${red}login limit reached by ${inverse + req.headers['x-forwarded-for'] + reset}`);
				res.end();
		}
});

const newUserLimiter = rateLimit({
		windowMS: 60 * 60 * 1000,
		max: 5,
		message: 'too many new accounts created in a row, try again in an hour',
		onLimitReached: function(req, res){
				console.log(`${red}newUser limit reached by ${inverse + req.headers['x-forwarded-for'] + reset}`);
				res.end();
		}
});

//logging things
const reset     = '\x1b[0m';
const inverse   = '\x1b[7m';
const underline = '\x1b[4m';
const blue      = '\x1b[34m';
const yellow    = '\x1b[33m';
const red       = '\x1b[31m';
const green     = '\x1b[32m';
timeStamp(console, {pattern: 'yyyy-mm-dd HH:MM:ss', label: false});

app.use(express.static(path.join(__dirname, 'client/css/'))); // add the css folder to the path
app.use(express.static(path.join(__dirname, 'client/js/')));  // add the js folder to the path

//body parse setup
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

//login page
app.get('/', pageLimiter, function (req, res){
		console.log(`recieved request from ${inverse + req.headers['x-forwarded-for'] + reset}`);
		res.sendFile(__dirname + '/client/login.html');
});

const testing = true; //just for testing will remove this later

//game endpoint
app.get('/game', pageLimiter, function (req, res) {
		if (req.session.user == null){
				console.log(`invalid session from ${inverse + req.headers['x-forwarded-for'] + reset} redirecting to /`);
				res.redirect('/');
		} else if (typeof logged[req.session.user] === 'undefined' || testing){
				console.log(`session authenticated from ${inverse + req.headers['x-forwarded-for'] + reset} on user ${underline + req.session.user + reset}`);
				logged[req.session.user] = {id: req.session.id, timeout: setTimeout(() => delete logged[req.session.user], 1 * 30 * 1000)};
				res.sendFile(__dirname + '/client/game.html');
		} else {
				res.sendFile(__dirname + '/client/loginerror.html');
		}
});

//login post requests
app.post('/login', loginLimiter, function (req, res){
		login(req, res);
});
app.post('/newUser', newUserLimiter, function (req, res){
		newUser(req, res);
});
app.post('/logout', function (req, res){
		if (req.session.user != null){
				console.log(`logout from ${inverse + req.headers['x-forwarded-for'] + reset} on user ${underline + req.session.user + reset}`);
				delete logged[req.session.user];
				if (req.body.hardlogout == 'true') {req.session.destroy(); console.log('test');}
				res.end();
		}
});

app.post('/load', function(req, res){
		keepAlive(req.session);
		sqlLoad = `SELECT * FROM saveData WHERE userName='${req.session.user}'`
		pool.query(sqlLoad, function(err, result){
				if (err) throw err;
				if (result.length == 0){
						sqlInit = `INSERT INTO saveData (userName, score) VALUES ('${req.session.user}', 0)`
						pool.query(sqlInit, function (err, result){
								if (err) throw err;
								res.send('init');
								res.end();
						});
				} else {
						res.send(result[0]);
						res.end();
				}
		});
});

app.post('/save', function (req, res){
		if(typeof logged[req.session.user] !== "undefined"){
				keepAlive(req.session)
				sqlSave = `UPDATE saveData SET score=${req.body.score} WHERE userName='${req.session.user}'`
				pool.query(sqlSave, function(err, result){
						if (err) throw err;
						res.send('save sucessful');
						res.end();
				});
		}
});

app.post('/leaderboard', function (req, res){
		var toDisplay = parseInt(req.body.num);
		if (isNaN(toDisplay) || toDisplay > 100 || toDisplay < 1) toDisplay = 10; //defualt case
		var sqlLead = `SELECT userName, score FROM saveData ORDER BY score DESC LIMIT ${toDisplay}`
		pool.query(sqlLead, function(err, result){
				if (err) throw err;
				res.send(result);
				res.end();
		});
});

//handles logins
function login(req, res){
		var body = req.body;
		var ip = req.headers['x-forwarded-for'];
		if(isBad(body.userName) || isBad(body.password)){
				console.log(`${yellow}invalid login from ${inverse + ip + reset + yellow} on user ${underline + body.userName + reset + yellow} reason:${reset} regex failed`);
				res.send({redirect: false, result: 'Invalid Input'});
				res.end();
		} else if(body.userName.length > 16){
				console.log(`${blue}invalid login from ${inverse + ip + reset + blue} on user ${underline + body.userName + reset + blue} reason:${reset} user name too long`);
				res.send({redirect: false, result: 'Invalid Input'});
				res.end();
		} else if(body.password.length != 128){
				console.log(`${yellow}invalid login from ${inverse + ip + reset + yellow} on user ${underline + body.userName + reset + yellow} reason:${reset} password is invalid`);
				res.send({redirect: false, result: 'OI, do not bypass the hashing function it is for your own good'});
				res.end();
		} else{
				var sqlAuth = `SELECT * FROM users WHERE userName='${body.userName}'`;
				pool.query(sqlAuth, function(err, result){
						if (result.length == 0){
								console.log(`${yellow}invalid login from ${inverse + ip + reset + yellow} on user ${underline + body.userName + reset + yellow} reason:${reset} user name does not exist`);
								res.send({redirect: false, result: 'Invalid user name and password combo'});
								res.end();
						} else{
								var sql = `SELECT * FROM users WHERE userName='${body.userName}' AND password='${body.password}'`;
								pool.query(sql, function(err, result){
										if (result.length == 0){
												console.log(`${red}invalid login from ${inverse + ip + reset + red} on user ${underline + body.userName + reset + red} reason:${reset} bad password`);
												res.send({redirect: false, result: 'Invalid user name and password combo'});
												res.end();
										} else {
												if (logged[body.userName] != null){
														//maybe logging later
														res.send({redirect: false, result: 'You are already logged in elsewhere, please logout of your device. If your connection was closed unexpectedly please wait 30 seconds.'});
														res.end();
												} else{
														console.log(`${green}sucessful login from ${inverse + ip + reset + green} on user ${underline + body.userName + reset}`);
														req.session.user = body.userName;
														res.send({redirect: true, result: 'Login successful'});
														res.end();
												}
										}
								});
						}
				});
		}
}

//handles creation of new users
function newUser(req, res){
		var body = req.body;
		var ip = req.headers['x-forwarded-for'];
		//check for blank  fields
		for ( i in body ){
				var blankFields = '';
				if (body[i] == '') blankFields += `${i} is blank. `; 
				if (blankFields != '') { 
						console.log(`${blue}invalid newUser from ${inverse + ip + reset + blue} reason:${reset} blank fields`);
						res.send({redirect: false, result: blankFields}); res.end(); return; 
				}
		}

		if(isBad(body.userName) || isBad(body.password) || isBad(body.firstName) || isBad(body.lastName)){
				console.log(`${yellow}invalid newUser from ${inverse + ip + reset + yellow} reason:${reset} regex failed`);
				res.send({redirect: false, result: 'Name fields can only contain [A-Z a-z . - _], and cannot contain 0x anywhere in them'});
				res.end();
		} else if(body.firstName.length < 3 || body.firstName.length > 255 || /[^A-Za-z]/g.test(body.firstName)){
				console.log(`${blue}invalid newUser from ${inverse + ip + reset + blue} reason:${reset} first name invalid`);
				res.send({redirect: false, result: 'First name must be between 3-255 characters and contain only [A-Z a-z]'});
				res.end();
		} else if(body.lastName.length < 3 || body.lastName.length > 255 || /[^A-Za-z]/g.test(body.lastName)){
				console.log(`${blue}invalid newUser from ${inverse + ip + reset + blue} reason:${reset} last name invalid`);
				res.send({redirect: false, result: 'Last name must be between 3-255 characters and contain only [A-Z a-z]'});
				res.end();
		} else if(body.userName.length < 3 || body.userName.length > 16 || !/[A-Za-z]/g.test(body.userName)){
				console.log(`${blue}invalid newUser from ${inverse + ip + reset + blue} reason:${reset} user name invalid`);
				res.send({redirect: false, result: 'User names must be 3-16 characters and include at least 1 letter'});
				res.end();
		} else if(body.password.length != 128){
				console.log(`${yellow}invalid newUser from ${inverse + ip + reset + yellow} reason:${reset} password incorect length`);
				res.send({redirect: false, result: 'OI, do not bypass the hashing function it is for your own good'});
				res.end();
		} else{
				var sql = `SELECT * FROM users WHERE userName='${body.userName}'`;
				pool.query(sql, function(err, result){
						if(result.length > 0) {
								console.log(`${blue}invalid newUser from ${inverse + ip + reset + blue} reason:${reset} user name taken`);
								res.send({redirect: false, result: 'User name is already taken'});
								res.end();
						} else {
								var sqlNew = 'INSERT INTO users (firstName, lastName, userName, salt, password)'; 
								sqlNew += `VALUES ('${body.firstName}', '${body.lastName}', '${body.userName}', 'salt', '${body.password}')`;
								pool.query(sqlNew, function(err, result){
										console.log(`${green}successful newUser from ${inverse + ip + reset + green} on user ${underline + body.userName + reset}`);
										req.session.user = body.userName;
										res.send({redirect: true, result: 'newUser successful'});
										res.end();
								});
						}
				});
		}
}

function isBad(input){
		if(/[^A-Za-z0-9\-_.]|0x/g.test(input)){
				return true;
		}else{
				return false;
		}
}

function keepAlive(session){
		if (typeof logged[session.user] !== "undefined"){
				clearTimeout(logged[session.user].timeout);
				logged[session.user].timeout = setTimeout(() => delete logged[session.user], 1 * 30 * 1000);
		}
}
		
app.listen(port, () => console.log('Listening on ' + port + "..."));
