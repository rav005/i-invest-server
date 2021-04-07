const express = require('express');
const router = express.Router();
const Account = require('../models/account');
const Transaction = require('../models/transaction');
const Stock = require('../models/stock');
const jwt = require("jsonwebtoken");
const db = require('../services/db');
const common = require('./common');

router.get('/getAllAccounts', async (req, resp) => {
    try {
        const userId = common.extractUserIdFromResponseLocals(resp);
        common.log(userId, "/getAllAccounts", "req: " + JSON.stringify(req.body));

        db.connect();
        const accounts = await Account.find({ userId: userId });
        common.log(userId, "/getAllAccounts", "accounts: " + JSON.stringify(accounts));
        resp.status(200).json({ "accounts": accounts });
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/getAccount', async (req, resp) => {
    try {
        const userId = common.extractUserIdFromResponseLocals(resp);
        common.log(userId, "/getAccount", "req: " + JSON.stringify(req.body));
        const accountId = req.body.accountId;
        if (accountId) {
            db.connect();
            const account = await Account.findOne({ _id: accountId });
            common.log(userId, "/getAccount", "account: " + JSON.stringify(account));

            const stocks = await Stock.find({ _id: accountId });
            common.log(userId, "/getAccount", "stocks: " + JSON.stringify(stocks));
            if (account) {
                resp.status(200).json({ account: account, stocks: stocks });
            }
            else {
                resp.status(404).json({ "message": "'" + accountId + "' not found" });
            }

        }
        // only if req.body does not have account id
        resp.status(404).send();
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/addAccount', async (req, resp) => {
    try {
        const userId = common.extractUserIdFromResponseLocals(resp);
        common.log(userId, "/getAllAccounts", "req: " + JSON.stringify(req.body));

        var reqBody = req.body;
        reqBody.userId = userId;
        const account = new Account(reqBody);

        db.connect();

        account.save(error => {
            if (common.checkServerError(resp, error)) {
                common.log(userId, "/account/addAccount err: ", error, ", req: ", JSON.stringify(req.body));
                return;
            }
            var transaction = new Transaction();
            transaction.type = "Initial deposit";
            transaction.amount = account.balance;
            transaction.accountId = account._id;

            transaction.save(error => {
                if (common.checkServerError(resp, error)) {
                    common.log(userId, "/account/addAccount err: ", error, ", req: ", JSON.stringify(req.body));
                    return;
                }
                common.log(userId, "/account/addAccount", 'transaction created successfully!');
            });
            resp.status(201).json({ "account": account });
            common.log(userId, "/account/addAccount", 'account created successfully!');
        });
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/deleteAccount', async (req, resp) => {
    try {
        const userId = common.extractUserIdFromResponseLocals(resp);
        common.log(userId, "/account/deleteAccount", "req: " + JSON.stringify(req.body));
        const accountId = req.body.accountId;
        if (accountId) {
            db.connect();
            Account.deleteOne({ _id: accountId }).then(function () {
                common.log(userId, "/account/deleteAccount", 'account deleted!');
                resp.status(200).json({ "accountDeleted": true });
            }).catch(function (error) {
                common.log(userId, "/account/deleteAccount", 'account not deleted!');
                resp.status(404).json({ "accountDeleted": false, "message": "error occurred" });
            });
        }
        else {
            //only if req.body does not have account id
            resp.status(404).send();
        }
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/newBalance', async (req, resp) => {
    try {
        const userId = common.extractUserIdFromResponseLocals(resp);
        common.log(userId, "/newBalance", "req: " + JSON.stringify(req.body));

        const accountId = req.body.accountId;
        const newBalance = req.body.newBalance;
        const prevBalance = req.body.prevBalance;
        const transactionType = req.body.transactionType;

        if (accountId && newBalance) {

            try {
                db.connect();
                const dbUpdateResponse = await Account.updateOne({ _id: accountId, userId: userId }, { balance: newBalance });

                var transaction = new Transaction();
                transaction.type = transactionType;
                if (transactionType == "Deposit") {
                    transaction.amount = newBalance - prevBalance;
                }
                else {
                    transaction.amount = prevBalance - newBalance;
                }
                transaction.accountId = accountId;

                transaction.save(error => {
                    if (common.checkServerError(resp, error)) {
                        common.log(userId, "/account/newBalance err: ", error, ", req: ", JSON.stringify(req.body));
                        return;
                    }
                    common.log(userId, "/account/newBalance", 'transaction created successfully!');
                });


                if (dbUpdateResponse && dbUpdateResponse.n == 1) {
                    common.log(userId, "/account/newBalance", "updated balance");
                    resp.status(200).send();
                }
                else {
                    common.log(userId, "/account/newBalance", "userid/account not found");
                    resp.status(400).send();
                }
            } catch (err) {
                common.log(userId, "/account/newBalance", "err: " + JSON.stringify(err));
                resp.status(400).send();
            }
        }
        else {
            common.log(userId, "/account/newBalance", "accountId/new balance is invalid: " + JSON.stringify(req.body));
            resp.status(400).json({ "message": "accountId/new balance is invalid" });
        }
    } catch (err) {
        resp.status(500).send();
    }
});

module.exports = router;
