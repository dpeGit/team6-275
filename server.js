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

/*
con.connect(function(err){
	if (err) throw err;
	console.log("Database Connected.");
	var sql = "CREATE TABLE hi (hello VARCHAR(255));"
	con.query(sql, function (err, result){
		if (err) throw err;
		console.log("Table created.");
	});
	var sql = "ALTER TABLE test ADD COLUMN itWorks INT";
	con.query(sql, function(err, result){
		if (err) throw err;
		console.log("Table altered.");
	});
	var sql = "INSERT INTO test (test, itWorks) VALUES ('This is', 'awful');"
	con.query(sql, function (err, result){
		if (err) throw err;
		console.log("Inserted.");
	});
});
*/

app.use(express.static(path.join(__dirname, 'client'))); // add the client folder to the path

app.get('/', function (req, res){
		console.log('Recieved'); res.sendFile('index.html')
});

app.listen(port, () => console.log('Listening on ' + port + "..."));
