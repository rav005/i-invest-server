const express = require('express');
const router = express.Router();
const User = require('../models/user');
const common = require('./common');
const db = require('../services/db');
const api = require('./api');

router.post('/login', async (req, resp) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const user = await common.findUserByUsername(username);
        if (user && password) {
            user.comparePassword(password, async (err, isMatch) => {
                if (err || !isMatch) {
                    resp.status(403).send();
                    return;
                }
                const token = common.generateAccessToken({ id: user._id });
                resp.status(200).json({ token: token });
            });
        }
        else {
            resp.status(403).send();
        }
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/passwordreset', async (req, resp) => {
    try {
        const username = req.body.username;
        const user = await common.findUserByUsername(username);
        if (user) {
            resp.status(200).json({ "question": user.question });
        }
        else {
            resp.status(404).send();
        }
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/passwordresetquestion', async (req, resp) => {
    try {
        const username = req.body.username;
        const user = await common.findUserByUsername(username);
        if (user) {

            user.compareAnswer(req.body.answer, (err, isMatch) => {
                if (err || !isMatch) {
                    resp.status(403).send();
                    return;
                }
                const token = common.generateAccessToken({ id: user._id }, '120s');
                resp.status(200).json({ token: token });
            });
        }
        else {
            resp.status(403).send();
        }
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/passwordchange', async (req, resp) => {
    try {
        const newPassword = req.body.password;
        const token = req.body.token;

        const newPasswordHash = await User.getHash(newPassword);
        if (token && newPassword && newPasswordHash) {
            const id = common.verifyJwt(token);
            if (id) {
                db.connect();
                const user = await User.updateOne({ _id: id }, { password: newPasswordHash });
                resp.status(200).send();
            }
            else {
                resp.status(400).json({ message: "invalid token" });
            }
        }
        else {
            resp.status(400).json({ message: "token/password required" });
        }
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/securityQuestionAnswerChange', async (req, resp) => {
    try {
        const question = req.body.question;
        const answer = req.body.answer;
        const token = req.body.token;

        const newAnswerHash = await User.getHash(answer);
        if (token && question && newAnswerHash) {
            const id = common.verifyJwt(token);
            if (id) {
                db.connect();
                const user = await User.updateOne({ _id: id }, { question: question, answer: newAnswerHash });
                resp.status(200).send();
            }
            else {
                resp.status(400).json({ message: "invalid token" });
            }
        }
        else {
            resp.status(400).json({ message: "token/question/answer required" });
        }
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/signup', async (req, resp) => {
    try {
        const user = new User(req.body);
        db.connect();

        const userInDb = await common.findUserByUsername(user.username);
        if (userInDb) {
            const msg = "Username already exists";
            common.log("", "/user/signup err", msg);
            resp.status(400).json({ msg: msg });
        }
        else {
            user.save(error => {
                if (common.checkServerError(resp, error)) {
                    console.log("/user/signup err: ", error, ", req: ", req.body);
                    return;
                }
                const token = common.generateAccessToken({ id: user._id });
                resp.status(201).json({ token: token });
                console.log('user created successfully!');
            });
        }
    } catch (err) {
        resp.status(500).send();
    }
});

module.exports = router;
