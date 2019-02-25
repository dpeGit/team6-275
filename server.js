const express = require('express');
const app = express();
const port = 3000;

app.get('/', function (req, res){
		console.log('Recieved'); res.sendFile('index.html')
});

app.listen(port, ()	=> console.log('Listening on ' + port));
