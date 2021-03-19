const express = require('express');
const router = express.Router();
const Account = require('../models/account');
const Stock = require('../models/stock');
const jwt = require("jsonwebtoken");
const db = require('../services/db');
const common = require('./common');

router.post('/buyStock', async (req, resp) => {

    common.log("/buyStock", "req: " + JSON.stringify(req.body));
    const userId = common.extractUserIdFromResponseLocals(resp);

    var reqBody = req.body;
    reqBody.userId = userId;
    const stock = new Stock(reqBody);

    db.connect();

    stock.save(error => {
        if (common.checkServerError(resp, error)) {
            console.log("/stock/buyStock err: ", error, ", req: ", req.body);
            return;
        }

        resp.status(201).json({ "stock": stock });
        console.log('stock created successfully!');
    });
});

router.post('/sellStock', async (req, resp) => {
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
