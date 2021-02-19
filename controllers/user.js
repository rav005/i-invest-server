const express = require('express');
const router = express.Router();
const User = require('../models/user');
var MongoClient = require('mongodb').MongoClient;
const jwt = require("jsonwebtoken");

router.get('/', (req, resp) => {
    resp.status(200).send({ message: 'user GET' });
});

router.post('/login', async (req, resp) => {

    console.log("/login ", req.body);

    const username = req.body.username;
    const password = req.body.password;

    require('../services/db').connect();
    const user = await User.findOne({ username: username });

    //console.log(user);
    if (user) {
        user.comparePassword(password, function (err, isMatch) {
            if (err || !isMatch) {
                resp.status(403).send();
                return;
            }
            console.log('valid password:', isMatch); // -&gt; Password123: true
            const token = generateAccessToken({ username: username });
            resp.status(200).json(token);
        });
    }
    else {
        resp.status(403).send();
    }
})

router.post('/passwordreset', async (req, resp) => {
    db.users.find({ id: "WakefieldFamily" })
})

router.post('/passwordresetquestion', async (req, resp) => {
    db.users.find({ id: "WakefieldFamily" })
})

router.post('/passwordchange', async (req, resp) => {
    db.users.find({ id: "WakefieldFamily" })
})

router.post('/signup', async (req, resp) => {
    console.log('req body: ', req.body);
    const user = new User(req.body);

    require('../services/db').connect();

    user.save(error => {
        if (checkServerError(resp, error)) {
            console.log("/user/signup err: ", error, ", req: ", req.body);
            return;
        }
        const token = generateAccessToken({ username: username });
        resp.status(201).json(token);
        console.log('user created successfully!');
    });
});

function checkServerError(res, error) {
    if (error) {
        res.status(500).send(error);
        return error;
    }
}

function generateAccessToken(username) {
    // expires after (18000 seconds = 300 minutes)
    return { token: jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '18000s' }) };
}


module.exports = router;
