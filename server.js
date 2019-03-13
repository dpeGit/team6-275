const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bodyparser = require('body-parser');

const app = express();
const port = 3000; // Our proxy port

const con = mysql.createConnection({
	host: "localhost",
	user: "team6",
	password: "team6",
	database: "team6" // wonderful names I know
});
con.connect(function (err){
		if (err) throw err;
});

app.use(express.static(path.join(__dirname, 'client/css/'))); // add the client folder to the path

//body parse setup
app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

app.get('/', function (req, res){
		console.log('Recieved'); 
		res.sendFile(__dirname + '/client/login.html');
});

app.post('/', function (req, res){
		console.log(req.body);
});

app.listen(port, () => console.log('Listening on ' + port + "..."));
