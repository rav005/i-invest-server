require('dotenv').config();
const jwt = require("jsonwebtoken");
const db = require('../services/db');

const User = require('../models/user');

function transaction() {
    common.log("", "cronjob/transaction", "running a task: " + new Date());
}

module.exports = {
    transaction
};