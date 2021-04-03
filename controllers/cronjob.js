require('dotenv').config();
const jwt = require("jsonwebtoken");
const db = require('../services/db');

const User = require('../models/user');

function transaction() {
    console.log('running a task: ', new Date());
}

module.exports = {
    transaction
};