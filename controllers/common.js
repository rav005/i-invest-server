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
    try {
        db.connect();
        const user = await User.findOne({ username: username });
        //db.disconnect();
        return user;
    } catch (error) {
        common.log("", "common/findUserByUsername", "unexpected error" + new Date(+ " " + JSON.stringify(error)));
    }
}

async function findUserById(id) {
    try {
        db.connect();
        const user = await User.findOne({ _id: id });
        //db.disconnect();
        return user;
    } catch (error) {
        common.log("", "common/findUserById", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
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
            common.log("", "common/findUserById", "jwt token error" + new Date() + " " + JSON.stringify(error));

            return null;
        }
    }
    return null;
}

function extractUserIdFromResponseLocals(resp) {
    try {
        return resp.locals.userId;
    } catch (error) {
        common.log("", "common/extractUserIdFromResponseLocals", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

function isValidQuote(json) {
    try {
        if (!json) {
            return false;
        }
        const isZero = (currentValue) => currentValue == 0;
        return !Object.values(json).every(isZero);
    } catch (error) {
        common.log("", "common/isValidQuote", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

function formatDate(date) {
    try {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;

        return [year, month, day].join('-');
    } catch (error) {
        common.log("", "common/formatDate", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

function getFromDate() {
    try {
        var d = new Date();
        d.setDate(d.getDate() - 21);
        return formatDate(d);
    } catch (error) {
        common.log("", "common/getFromDate", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

function getToDate() {
    try {
        return formatDate(new Date());
    } catch (error) {
        common.log("", "common/getToDate", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
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