const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bodyparser = require('body-parser');
const session = require('express-session');

const app = express();
const port = 3000; // Our proxy port

//sql setup
const con = mysql.createConnection({
	host: "localhost",
	user: "team6",
	password: "team6",
	database: "team6" // wonderful names I know
});
con.connect(function (err){
		if (err) throw err;
});

//session config
app.set('trust proxy', 1);
app.use(session({
		secret: 'C[n3Y|BUH@FU(FxNA~Z,EByWlvT:v|',
		resave: false,
		saveUninitialized: true,
		proxy: true,
		cookie: {
				secure: true,
				httpOnly: true,
				maxAge: 30 * 60 * 1000
		}
})
);

app.use(express.static(path.join(__dirname, 'client/css/'))); // add the client folder to the path

//body parse setup
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

//login page
app.get('/', function (req, res){
		console.log('Recieved request from ' + req.headers['x-forwarded-for']);
		res.sendFile(__dirname + '/client/login.html');
});

app.get('/game', function (req, res) {
		if (req.session.user == null){
				console.log('Invalid session from ' + req.headers['x-forwarded-for'] + ' redirecting to /');
				res.redirect('/');
		} else {
				console.log(req.session.user + ' session authenticated');
				res.sendFile(__dirname + '/client/game.html');
		}
});

//login post request
app.post('/', function (req, res){
		if (req.body.type == 'login'){
				console.log(`Recieved login from ${req.headers['x-forwarded-for']} under login ${req.body.userName}`);
				login(req, res);
		} else if (req.body.type == 'newUser'){
				console.log(`Recieved newUser from ${req.headers['x-forwarded-for']} under login ${req.body.userName}`);
				newUser(req, res);
		}
});

//handles logins
function login(req, res){
		var body = req.body;
		if(isBad(body.userName) || isBad(body.password)){
				res.send({redirect: false, result: 'User Name can only contain A-Z a-z . - _'});
				res.end();
		}else{
				var sqlAuth = `SELECT * FROM users WHERE userName='${body.userName}'`;
				con.query(sqlAuth, function(err, result){
						if (result.length == 0){
								res.send({redirect: false, result: 'User does not exist'});
								res.end();
						} else{
								var sql = `SELECT * FROM users WHERE userName='${body.userName}' AND password='${body.password}'`;
								con.query(sql, function(err, result){
										if (result.length == 0){
												console.log(`Recieved bad password from ${req.headers['x-forwarded-for']} under login ${body.userName}`);
												res.send({redirect: false, result: 'Invalid password'});
												res.end();
										} else {
												console.log(`Sucessful login from ${req.headers['x-forwarded-for']} under login ${body.userName}`);
												req.session.user = body.userName;
												res.send({redirect: true, result: 'Login successful'});
												res.end();
										}
								});
						}
				});
		}
}

//handles creation of new users
function newUser(req, res){
		var body = req.body;

		//check for blank  fields
		for ( i in body ){
				var blankFields = '';
				if (body[i] == '') blankFields += `${i} is blank. `; 
				if (blankFields != '') { res.send({redirect: false, result: blankFields}); res.end(); return; }
		}

		if(isBad(body.userName) || isBad(body.password) || isBad(body.firstName) || isBad(body.lastName)){
				res.send({redirect: false, result: 'Name fields can only contain A-Z a-z . - _'});
				res.end();
		} else{
				var sql = `SELECT * FROM users WHERE userName='${body.userName}'`;
				con.query(sql, function(err, result){
						if(result.length > 0) {
								res.send({redirect: false, result: 'User name is already taken'});
								res.end();
						} else {
								var sqlNew = 'INSERT INTO users (firstName, lastName, userName, salt, password)'; 
								sqlNew += `VALUES ('${body.firstName}', '${body.lastName}', '${body.userName}', 'salt', '${body.password}')`;
								con.query(sqlNew, function(err, result){
										console.log(`Sucessful newUser from ${req.headers['x-forwarded-for']} under login ${body.userName}`);
										req.session.user = body.userName;
										res.send({redirect: true, result: 'newUser successful'});
										res.end();
								});
						}
				});
		}
}

function isBad(input){
		if(/[^A-Za-z0-9\-_.]/g.test(input)){
				return true;
		}else{
				return false;
		}
}
app.listen(port, () => console.log('Listening on ' + port + "..."));
