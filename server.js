const express = require('express');
const path = require('path');
const mysql = require('mysql');

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

app.get('/', function (req, res){
		if (req.method == 'POST'){
				//post stuff here
		} else{
			console.log('Recieved'); res.sendFile(__dirname + '/client/login.html');
		}
});

app.listen(port, () => console.log('Listening on ' + port + "..."));
