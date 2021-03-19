const express = require('express');
const router = express.Router();
const User = require('../models/user');
const common = require('./common');
const db = require('../services/db');
const api = require('./api');

router.post('/login', async (req, resp) => {

    //console.log("/login ", req.body);

    const username = req.body.username;
    const password = req.body.password;
    const user = await common.findUserByUsername(username);
    //console.log(user);
    if (user && password) {
        user.comparePassword(password, (err, isMatch) => {
            if (err || !isMatch) {
                resp.status(403).send();
                return;
            }
            //console.log('valid password:', isMatch);
            const token = common.generateAccessToken({ id: user._id });
            console.log(user.watchList);
            var watchList = api.getRateForWatchList(user.watchList);
            console.log(watchList);
            resp.status(200).json({ token: token, watchList: watchList });
        });
    }
    else {
        resp.status(403).send();
    }
})

router.post('/passwordreset', async (req, resp) => {
    const username = req.body.username;
    const user = await common.findUserByUsername(username);
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
    const user = await common.findUserByUsername(username);
    //console.log(user);
    if (user) {

        user.compareAnswer(req.body.answer, (err, isMatch) => {
            if (err || !isMatch) {
                resp.status(403).send();
                return;
            }
            //console.log('valid answer:', isMatch);
            const token = common.generateAccessToken({ id: user._id }, '120s');
            resp.status(200).json({ token: token });
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
        const id = common.verifyJwt(token);
        if (id) {
            db.connect();
            const user = await User.updateOne({ _id: id }, { password: newPasswordHash });
            const token = common.generateAccessToken({ id: user._id });
            resp.status(200).json({ token: token });
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

    db.connect();

    user.save(error => {
        if (common.checkServerError(resp, error)) {
            console.log("/user/signup err: ", error, ", req: ", req.body);
            return;
        }
        const token = common.generateAccessToken({ id: user._id });
        resp.status(201).json({ token: token });
        console.log('user created successfully!');
    });
});

module.exports = router;
