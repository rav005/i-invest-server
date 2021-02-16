const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const mongoose = require('mongoose');

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
        await mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true }, () => {
            console.log('connected to DB!');
            res.send('connected to DB!');
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
