const express = require('express');
const path = require('path');

const app = express();
const port = 3000; // Our proxy port

app.use(express.static(path.join(__dirname, 'client'))); // add the client folder to the path

app.get('/', function (req, res){
		console.log('Recieved'); res.sendFile('index.html')
});

app.listen(port, () => console.log('Listening on ' + port));
