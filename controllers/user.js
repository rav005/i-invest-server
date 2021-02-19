const express = require('express');
const router = express.Router();
const User = require('../models/user');
const jwt = require("jsonwebtoken");
const db = require('../services/db');

router.get('/', async (req, resp) => {

    resp.status(200).send({ message: 'user GET' });
});

router.post('/login', async (req, resp) => {

    //console.log("/login ", req.body);

    const username = req.body.username;
    const password = req.body.password;
    const user = await findUser(username);
    //    console.log(user);
    if (user && password) {
        user.compareHash(password, (err, isMatch) => {
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
    const username = req.body.username;
    const user = await findUser(username);
    //console.log(user);
    if (user) {
        resp.status(200).json({ "question": user.question });
    }
    else {
        resp.status(404).send();
    }
})

router.post('/passwordresetquestion', async (req, resp) => {
    const username = req.body.username;
    const user = await findUser(username);
    //console.log(user);
    if (user) {

        user.compareHash(req.body.answer, (err, isMatch) => {
            if (err || !isMatch) {
                resp.status(403).send();
                return;
            }
            //console.log('valid answer:', isMatch);
            const token = generateAccessToken({ username: username }, '120s');
            resp.status(200).json(token);
        });
    }
    else {
        resp.status(403).send();
    }
})

router.post('/passwordchange', async (req, resp) => {
    const newPassword = req.body.password;
    const token = req.body.token;
    const newPasswordHash = await User.getHash(newPassword);
    console.log("newpasswordhash: ", newPasswordHash);
    if (token && newPassword && newPasswordHash) {
        const username = verifyJwt(token);
        if (username) {
            require('../services/db').connect();
            const user = await User.updateOne({ username: username }, { password: newPasswordHash });
            const token = generateAccessToken({ username: username });
            resp.status(200).json(token);
        }
        else {
            resp.status(400).send();
        }
    }
    else {
        resp.status(500).send();
    }
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

async function findUser(username) {
    db.connect();
    const user = await User.findOne({ username: username });
    //db.disconnect();
    return user;
}

function generateAccessToken(username, expiry = "18000s") {
    // expires after (18000 seconds = 300 minutes)
    return { token: jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: expiry }) };
}

function verifyJwt(token) {
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
            return decoded.username;
        } catch (error) {
            console.log('jwt token error: ', error);
            return null;
        }
    }
    return null;
}

module.exports = router;
