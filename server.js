require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const common = require('./controllers/common');

const userRoutes = require('./controllers/user');
const accountRoutes = require('./controllers/account');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

app.use(function (req, resp, next) {
    const url = req.url;
    if (!url.includes("/user/")) {
        var token = req.headers.authorization;

        if (token.includes("Bearer ")) {
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
app.get('/', (req, res) => res.json('Express Server'));

app.use('/user', userRoutes);

app.use('/account', accountRoutes);

// Start listening to server
app.listen(PORT, () => {
    console.log('server is running on port: ' + PORT);
});
