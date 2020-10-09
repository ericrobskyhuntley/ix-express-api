const path = require('path')
const express = require('express')
const cors = require('cors')
const app = express()
const db = require('./queries')

app.use(cors())

//Load HTTP module
const http = require("http");
const hostname = '127.0.0.1';
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.set('port', (process.env.PORT || port));

app.get('/booths/', db.getIXBooths)
app.get('/booths/:boothNum', db.getIXBoothsByInvestor)
app.get('/exhibitorHQ/', db.getExhibitorHQ)
app.get('/HQCountry/', db.getHQCountry)
app.get('/countries/', db.getCountries)
app.get('/exhibitors/', db.getExhibitors)


//listen for request on port 3000, and as a callback function have the port listened on logged
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});