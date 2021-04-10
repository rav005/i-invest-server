require('dotenv').config();
const jwt = require("jsonwebtoken");
const db = require('../services/db');
const common = require('../controllers/common');

const User = require('../models/user');

function transaction() {
    try {
        common.log("", "cronjob/transaction", "running a task: " + new Date());
    } catch (error) {
        common.log("", "cronjob/transaction", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

module.exports = {
    transaction
};