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
            resp.status(403).json({ message: "User not found" });
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
            resp.status(403).json({ message: "User not found" });
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
                    resp.status(403).json({ message: "Incorrect answer" });
                }
                else {
                    const token = common.generateAccessToken({ id: user._id }, '120s');
                    resp.status(200).json({ token: token });
                }
            });
        }
        else {
            resp.status(403).json({ message: "User not found" });
        }
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/passwordChange', async (req, resp) => {
    try {
        const type = req.body.type;
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;
        const token = req.body.token;

        const newPasswordHash = await User.getHash(newPassword);
        if (token && (type == "reset" || currentPassword) && newPasswordHash) {
            const id = common.verifyJwt(token);
            if (id) {
                db.connect();
                if (type == "reset") {
                    await User.updateOne({ _id: id }, { password: newPasswordHash });
                    resp.status(200).json({ message: "password reset!!!" });
                } else {
                    const user = await common.findUserById(id);
                    if (user) {
                        user.comparePassword(currentPassword, async (err, isMatch) => {
                            if (err || !isMatch) {
                                resp.status(403).json({ message: "Incorrect password" });
                            }
                            else {
                                await User.updateOne({ _id: id }, { password: newPasswordHash });
                                resp.status(200).json({ message: "password changed!!!" });
                            }
                        });
                    }
                    else {
                        resp.status(403).json({ message: "User not found" });
                    }
                }
            }
            else {
                resp.status(400).json({ message: "invalid token" });
            }
        }
        else {
            resp.status(400).json({ message: "token/current password/new password required" });
        }
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/securityQuestionAnswerChange', async (req, resp) => {
    try {
        const currentPassword = req.body.currentPassword;
        const question = req.body.question;
        const answer = req.body.answer;
        const token = req.body.token;

        const newAnswerHash = await User.getHash(answer);
        if (token && currentPassword && question && newAnswerHash) {
            const id = common.verifyJwt(token);
            if (id) {
                db.connect();
                const user = await common.findUserById(id);
                if (user) {
                    user.comparePassword(currentPassword, async (err, isMatch) => {
                        if (err || !isMatch) {
                            resp.status(403).json({ message: "Incorrect password" });
                        }
                        else {
                            await User.updateOne({ _id: id }, { question: question, answer: newAnswerHash });
                            resp.status(200).send();
                        }
                    });
                }
                else {
                    resp.status(403).json({ message: "User not found" });
                }
            }
            else {
                resp.status(400).json({ message: "invalid token" });
            }
        }
        else {
            resp.status(400).json({ message: "token/current password/question/answer required" });
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
