const express = require('express');
const router = express.Router();
const Account = require('../models/account');
const jwt = require("jsonwebtoken");
const db = require('../services/db');
const common = require('./common');

router.get('/getAllAccounts', async (req, resp) => {
    common.log("/getAllAccounts", "req: " + JSON.stringify(req.body));
    const userId = common.extractUserIdFromResponseLocals(resp);

    db.connect();
    const accounts = await Account.find({ userId: userId });
    common.log("/getAllAccounts", "accounts: " + accounts);
    resp.status(200).json({ "accounts": accounts });
});

router.get('/getAccount', async (req, resp) => {
    common.log("/getAccount", "req: " + JSON.stringify(req.body));
    const accountId = req.body.accountId;
    if (accountId) {
        db.connect();
        const account = await Account.findOne({ _id: accountId });
        common.log("/getAccount", "account: " + account);
        if (account) {
            resp.status(200).json({ "account": account });
        }
        else {
            resp.status(404).json({ "message": "'" + accountId + "' not found" });
        }

    }
    // only if req.body does not have account id
    resp.status(404).send();
});

router.post('/addAccount', async (req, resp) => {
    common.log("/getAllAccounts", "req: " + JSON.stringify(req.body));
    const userId = common.extractUserIdFromResponseLocals(resp);

    var reqBody = req.body;
    reqBody.userId = userId;
    const account = new Account(reqBody);

    db.connect();

    account.save(error => {
        if (common.checkServerError(resp, error)) {
            console.log("/account/addAccount err: ", error, ", req: ", req.body);
            return;
        }

        resp.status(201).json({ "account": account });
        console.log('account created successfully!');
    });
});

router.post('/deleteAccount', async (req, resp) => {
    common.log("/deleteAccount", "req: " + JSON.stringify(req.body));
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
