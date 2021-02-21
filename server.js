require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const common = require('./controllers/common');

const mainRoutes = require('./controllers/main');
const userRoutes = require('./controllers/user');
const accountRoutes = require('./controllers/account');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Pass to next layer of middleware

    if (req.method === 'OPTIONS') {
        res.status(200).send();
        return;
    }
    next();
});

app.use(function (req, resp, next) {
    const url = req.url;
    if (!url.includes("/user/")) {
        var token = req.headers.authorization;

        if (token && token.includes("Bearer ")) {
            token = token.replace("Bearer ", "");
        }

        const userId = common.verifyJwt(token);
        if (userId) {
            common.log("middleware", "userId valid: " + userId);
            resp.locals.userId = userId;
        }
        else {
            resp.status(401).send();
        }
    }
    next();
});

// Routes

app.use('/main', mainRoutes);

app.use('/user', userRoutes);

app.use('/account', accountRoutes);

// Start listening to server
app.listen(PORT, () => {
    console.log('server is running on port: ' + PORT);
});
