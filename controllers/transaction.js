const express = require('express');
const router = express.Router();
const Account = require('../models/account');
const Stock = require('../models/stock');
const jwt = require("jsonwebtoken");
const db = require('../services/db');
const common = require('./common');

router.get('/getAllAccounts', async (req, resp) => {
    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/getAllAccounts", "req: " + JSON.stringify(req.body));

    db.connect();
    const accounts = await Account.find({ userId: userId });
    common.log(userId, "/getAllAccounts", "accounts: " + accounts);
    resp.status(200).json({ "accounts": accounts });
});

router.post('/getAccount', async (req, resp) => {
    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/getAccount", "req: " + JSON.stringify(req.body));
    const accountId = req.body.accountId;
    if (accountId) {
        db.connect();
        const account = await Account.findOne({ _id: accountId });
        common.log(userId, "/getAccount", "account: " + account);

        const stocks = await Stock.find({ _id: accountId });
        common.log(userId, "/getAccount", "stocks: " + stocks);
        if (account) {
            resp.status(200).json({ account: account, stocks: stocks });
        }
        else {
            resp.status(404).json({ "message": "'" + accountId + "' not found" });
        }

    }
    // only if req.body does not have account id
    resp.status(404).send();
});

router.post('/addAccount', async (req, resp) => {
    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/getAllAccounts", "req: " + JSON.stringify(req.body));

    var reqBody = req.body;
    reqBody.userId = userId;
    const account = new Account(reqBody);

    db.connect();

    account.save(error => {
        if (common.checkServerError(resp, error)) {
            console.log(userId, "/account/addAccount err: ", error, ", req: ", req.body);
            return;
        }

        resp.status(201).json({ "account": account });
        console.log(userId, 'account created successfully!');
    });
});

router.post('/deleteAccount', async (req, resp) => {
    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/deleteAccount", "req: " + JSON.stringify(req.body));
    const accountId = req.body.accountId;
    if (accountId) {
        db.connect();
        Account.deleteOne({ _id: accountId }).then(function () {
            resp.status(200).json({ "accountDeleted": true });
        }).catch(function (error) {
            resp.status(404).json({ "accountDeleted": false, "message": "error occurred" });
        });
    }
    else {
        //only if req.body does not have account id
        resp.status(404).send();
    }
});

module.exports = router;
