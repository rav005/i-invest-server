const express = require('express');
const router = express.Router();
const Account = require('../models/account');
const Stock = require('../models/stock');
const jwt = require("jsonwebtoken");
const db = require('../services/db');
const common = require('./common');
const api = require('./api');

router.post('/quote', async (req, resp) => {
    common.log("/main/quote", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol;
    if (symbol) {
        const respData = await api.getStockCurrentRate(symbol);
        if (respData) {
            common.log("/main/quote: ", respData);
            resp.status(200).json(respData);
        }
        else {
            common.log("/main/quote: err", respData);
            resp.status(400).send();
        }
    }
    else {
        resp.status(400).send();
    }
});

router.post('/companyNews', async (req, resp) => {
    common.log("/main/companyNews", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol;
    const fromDate = common.getFromDate();
    const toDate = common.getToDate();
    if (symbol && fromDate && toDate) {
        const respData = await api.companyNews(symbol, fromDate, toDate);
        if (respData) {
            common.log("/main/companyNews: ", respData);
            resp.status(200).json(respData);
        }
        else {
            common.log("/main/companyNews: err", respData);
            resp.status(400).send();
        }
    }
    else {
        resp.status(400).send();
    }
});

router.post('/recommendationTrends', async (req, resp) => {
    common.log("/main/recommendationTrends", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol;
    if (symbol) {
        const respData = await api.recommendationTrends(symbol);
        if (respData) {
            common.log("/main/recommendationTrends: ", respData);
            resp.status(200).json(respData);
        }
        else {
            common.log("/main/recommendationTrends: err", respData);
            resp.status(400).send();
        }
    }
    else {
        resp.status(400).send();
    }
});

router.post('/basicFinancials', async (req, resp) => {
    common.log("/main/basicFinancials", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol;
    if (symbol) {
        const respData = await api.basicFinancials(symbol);
        if (respData) {
            common.log("/main/basicFinancials: ", respData);
            resp.status(200).json(respData);
        }
        else {
            common.log("/main/basicFinancials: err", respData);
            resp.status(400).send();
        }
    }
    else {
        resp.status(400).send();
    }
});


router.post('/secFilings', async (req, resp) => {
    common.log("/main/secFilings", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol;
    if (symbol) {
        const respData = await api.secFilings(symbol);
        if (respData) {
            common.log("/main/secFilings: ", respData);
            resp.status(200).json(respData);
        }
        else {
            common.log("/main/secFilings: err", respData);
            resp.status(400).send();
        }
    }
    else {
        resp.status(400).send();
    }
});

router.post('/addToWatchlist', async (req, resp) => {
    common.log("/addToWatchlist", "req: " + JSON.stringify(req.body));

    const userId = common.extractUserIdFromResponseLocals(resp);
    const stockName = req.body.stockName;
    const symbol = req.body.symbol.toUpperCase();
    if (userId && stockName && symbol) {

        var user = await common.findUserById(userId);

        const hasSymbol = user.watchList.find(value => value.symbol === symbol);
        //common.log("/addToWatchlist", user.watchList);
        if (hasSymbol) {
            common.log("/addToWatchlist", "symbol exists");
            resp.status(400).json({ "message": "symbol exists" });
        } else {
            //common.log("/addToWatchlist", "user: " + JSON.stringify(user));
            user.watchList.push({ name: stockName, symbol: symbol });
            user.save(error => {
                if (common.checkServerError(resp, error)) {
                    console.log("/addToWatchlist err: ", error, ", req: ", req.body);
                    return;
                }
                resp.status(201).send();
                common.log("/addToWatchlist: ", 'added to watchlist');
            });
        }
    }
    else {
        resp.status(400).send();
    }
});

router.post('/removeFromWatchlist', async (req, resp) => {
    common.log("/removeFromWatchlist", "req: " + JSON.stringify(req.body));

    const userId = common.extractUserIdFromResponseLocals(resp);
    const symbol = req.body.symbol.toUpperCase();
    if (userId && symbol) {

        var user = await common.findUserById(userId);
        user.watchList = user.watchList.filter(value => value.symbol !== symbol);
        user.save(error => {
            if (common.checkServerError(resp, error)) {
                console.log("/removeFromWatchlist err: ", error, ", req: ", req.body);
                return;
            }
            resp.status(200).json({ "message": "symbol removed from watchlist" });
            common.log("/removeFromWatchlist : ", 'removed from watchlist');
        });
    }
    else {
        resp.status(400).send();
    }
});

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
