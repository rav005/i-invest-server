require('dotenv').config();
const jwt = require("jsonwebtoken");
const db = require('../services/db');

const User = require('../models/user');

function log(path, msg) {
    if (process.env.LOGGER) {
        console.log(path, msg);
    }
}

function checkServerError(res, error) {
    if (error) {
        res.status(500).send(error);
        return error;
    }
}

async function findUserByUsername(username) {
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
            return decoded.id;
        } catch (error) {
            console.log('jwt token error: ', error);
            return null;
        }
    }
    return null;
}

function extractUserIdFromResponseLocals(resp) {
    return resp.locals.userId;
}

module.exports = {
    log,
    checkServerError,
    findUserByUsername,
    generateAccessToken,
    verifyJwt,
    extractUserIdFromResponseLocals
};