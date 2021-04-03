require('dotenv').config();
const jwt = require("jsonwebtoken");
const db = require('../services/db');

const User = require('../models/user');

function log(userId, path, msg) {
    if (userId && userId.length > 0 && process.env.LOGGER) {
        console.log("user id: " + userId + " path: " + path, msg);
    }
    else {
        console.log("path: " + path, msg);
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

async function findUserById(id) {
    db.connect();
    const user = await User.findOne({ _id: id });
    //db.disconnect();
    return user;
}

function generateAccessToken(username, expiry = "18000s") {
    // expires after (18000 seconds = 300 minutes)
    return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: expiry });
}

function verifyJwt(token) {
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
            return decoded.id;
        } catch (error) {
            console.log('jwt token error: ', error.message);
            return null;
        }
    }
    return null;
}

function extractUserIdFromResponseLocals(resp) {
    return resp.locals.userId;
}

function isValidQuote(json) {
    const isZero = (currentValue) => currentValue == 0;
    return !Object.values(json).every(isZero);
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}

function getFromDate() {
    var d = new Date();
    d.setDate(d.getDate() - 21);
    return formatDate(d);
}

function getToDate() {
    return formatDate(new Date());
}

module.exports = {
    log,
    checkServerError,
    findUserByUsername,
    findUserById,
    generateAccessToken,
    verifyJwt,
    extractUserIdFromResponseLocals,
    isValidQuote,
    getFromDate,
    getToDate
};