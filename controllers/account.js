const express = require('express');
const router = express.Router();
const Account = require('../models/account');
const Stock = require('../models/stock');
const jwt = require("jsonwebtoken");
const db = require('../services/db');
const common = require('./common');

router.get('/getAllAccounts', async (req, resp) => {
    common.log("/getAllAccounts", "req: " + JSON.stringify(req.body));
    const userId = common.extractUserIdFromResponseLocals(resp);

    db.connect();
    const accounts = await Account.find({ userId: userId });
    common.log("/getAllAccounts", "accounts: " + JSON.stringify(accounts));
    resp.status(200).json({ "accounts": accounts });
});

router.post('/getAccount', async (req, resp) => {
    common.log("/getAccount", "req: " + JSON.stringify(req.body));
    const accountId = req.body.accountId;
    if (accountId) {
        db.connect();
        const account = await Account.findOne({ _id: accountId });
        common.log("/getAccount", "account: " + JSON.stringify(account));

        const stocks = await Stock.find({ _id: accountId });
        common.log("/getAccount", "stocks: " + JSON.stringify(stocks));
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
    common.log("/getAllAccounts", "req: " + JSON.stringify(req.body));
    const userId = common.extractUserIdFromResponseLocals(resp);

    var reqBody = req.body;
    reqBody.userId = userId;
    const account = new Account(reqBody);

    db.connect();

    account.save(error => {
        if (common.checkServerError(resp, error)) {
            common.log("/account/addAccount err: ", error, ", req: ", JSON.stringify(req.body));
            return;
        }

        resp.status(201).json({ "account": account });
        common.log("/account/addAccount", 'account created successfully!');
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

router.post('/newBalance', async (req, resp) => {
    common.log("/newBalance", "req: " + JSON.stringify(req.body));

    const userId = common.extractUserIdFromResponseLocals(resp);
    const accountId = req.body.accountId;
    const newBalance = req.body.newBalance;

    try {
        db.connect();
        const dbUpdateResponse = await Account.updateOne({ _id: accountId, userId: userId }, { balance: newBalance });

        if (dbUpdateResponse && dbUpdateResponse.n == 1) {
            common.log("/newBalance", "updated balance");
            resp.status(200).send();
        }
        else {
            common.log("/newBalance", "userid/account not found");
            resp.status(400).send();
        }
    } catch (err) {
        common.log("/newBalance", "err: " + JSON.stringify(err));
        resp.status(400).send();
    }
});

module.exports = router;
