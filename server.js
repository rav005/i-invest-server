const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
var MongoClient = require('mongodb').MongoClient;

const userRoutes = require('./controllers/user');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

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
