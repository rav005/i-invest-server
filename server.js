const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
var MongoClient = require('mongodb').MongoClient;

const userRoutes = require('./controllers/user');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware
    next();
});

// Routes
app.get('/', (req, res) => res.json('Express Server'));

app.use('/user', userRoutes);

// to test DB connection
app.get('/test', async (req, res) => {
    try {
        MongoClient.connect(process.env.DB_URL, { useUnifiedTopology: true }, function (err, client) {
            console.log('connected to DB!');
            res.send('connected to DB!');
            client.close();
        });
    } catch (err) {
        console.log('Failed to connect to DB. ', err);
        res.send(err);
    }
});


// Start listening to server
app.listen(PORT, () => {
    console.log('server is running on port: ' + PORT);
});
