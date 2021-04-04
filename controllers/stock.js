const express = require('express');
const router = express.Router();
const Account = require('../models/account');
const Stock = require('../models/stock');
const jwt = require("jsonwebtoken");
const db = require('../services/db');
const common = require('./common');
const api = require('./api');

router.get('/getWatchlist', async (req, resp) => {
    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/getWatchlist", "req: " + JSON.stringify(req.body));

    if (userId) {
        var user = await common.findUserById(userId);
        if (user) {
            common.log("userId, /getWatchlist", "watchList: " + user.watchList);
            var watchList = await api.getRateForWatchList(user.watchList);
            resp.status(200).json({ watchList: watchList });
        }
        else {
            resp.status(404).json({ "message": "invalid user" });
        }
    }
    else {
        common.log(userId, "/getWatchlist", "error");
        resp.status(400).json({ "message": "invalid userid" });
    }
});

router.post('/quote', async (req, resp) => {
    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/main/quote", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol;
    if (symbol) {
        const respData = await api.getStockCurrentRate(symbol);
        if (respData) {
            common.log(userId, "/main/quote: ", JSON.stringify(respData));
            resp.status(200).json(respData);
        }
        else {
            common.log(userId, "/main/quote: err", JSON.stringify(respData));
            resp.status(400).send();
        }
    }
    else {
        resp.status(400).send();
    }
});

router.post('/companyNews', async (req, resp) => {
    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/main/companyNews", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol;
    const fromDate = common.getFromDate();
    const toDate = common.getToDate();
    if (symbol && fromDate && toDate) {
        const respData = await api.companyNews(symbol, fromDate, toDate);
        if (respData) {
            common.log(userId, "/main/companyNews: ", JSON.stringify(respData));
            resp.status(200).json(respData);
        }
        else {
            common.log(userId, "/main/companyNews: err", JSON.stringify(respData));
            resp.status(400).send();
        }
    }
    else {
        resp.status(400).send();
    }
});

router.post('/recommendationTrends', async (req, resp) => {
    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/main/recommendationTrends", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol;
    if (symbol) {
        const respData = await api.recommendationTrends(symbol);
        if (respData) {
            common.log(userId, "/main/recommendationTrends: ", JSON.stringify(respData));
            const months = 6
            const data = respData.slice(0, months);
            resp.status(200).json(data);
        }
        else {
            common.log(userId, "/main/recommendationTrends: err", JSON.stringify(respData));
            resp.status(400).send();
        }
    }
    else {
        resp.status(400).send();
    }
});

router.post('/basicFinancials', async (req, resp) => {
    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/main/basicFinancials", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol;
    if (symbol) {
        const respData = await api.basicFinancials(symbol);
        if (respData) {
            common.log(userId, "/main/basicFinancials: ", JSON.stringify(respData.metric));
            resp.status(200).json(respData.metric);
        }
        else {
            common.log(userId, "/main/basicFinancials: err", JSON.stringify(respData));
            resp.status(400).send();
        }
    }
    else {
        resp.status(400).send();
    }
});


router.post('/secFilings', async (req, resp) => {
    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/main/secFilings", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol;
    if (symbol) {
        const respData = await api.secFilings(symbol);
        if (respData) {
            common.log(userId, "/main/secFilings: ", JSON.stringify(respData));
            resp.status(200).json(respData);
        }
        else {
            common.log(userId, "/main/secFilings: err", JSON.stringify(respData));
            resp.status(400).send();
        }
    }
    else {
        resp.status(400).send();
    }
});

router.post('/addToWatchlist', async (req, resp) => {
    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/addToWatchlist", "req: " + JSON.stringify(req.body));

    const stockName = req.body.stockName;
    const symbol = req.body.symbol.toUpperCase();
    if (userId && stockName && symbol) {

        var user = await common.findUserById(userId);

        const hasSymbol = user.watchList.find(value => value.symbol === symbol);
        //common.log(userId,"/addToWatchlist", user.watchList);
        if (hasSymbol) {
            common.log(userId, "/addToWatchlist", "symbol exists");
            resp.status(400).json({ "message": "symbol exists" });
        } else {
            //common.log(userId,"/addToWatchlist", "user: " + JSON.stringify(user));
            user.watchList.push({ name: stockName, symbol: symbol });
            user.save(error => {
                if (common.checkServerError(resp, error)) {
                    common.log(userId, "/addToWatchlist err: ", error, ", req: ", req.body);
                    return;
                }
                resp.status(201).send();
                common.log(userId, "/addToWatchlist: ", 'added to watchlist');
            });
        }
    }
    else {
        resp.status(400).send();
    }
});

router.post('/removeFromWatchlist', async (req, resp) => {
    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/removeFromWatchlist", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol.toUpperCase();
    if (userId && symbol) {

        var user = await common.findUserById(userId);
        user.watchList = user.watchList.filter(value => value.symbol !== symbol);
        user.save(error => {
            if (common.checkServerError(resp, error)) {
                common.log(userId, "/removeFromWatchlist err: ", error, ", req: ", req.body);
                return;
            }
            resp.status(200).json({ "message": "symbol removed from watchlist" });
            common.log(userId, "/removeFromWatchlist : ", 'removed from watchlist');
        });
    }
    else {
        resp.status(400).send();
    }
});

router.post('/buyStock', async (req, resp) => {

    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/buyStock", "req: " + JSON.stringify(req.body));

    var reqBody = req.body;
    reqBody.userId = userId;
    const stock = new Stock(reqBody);

    db.connect();

    stock.save(error => {
        if (common.checkServerError(resp, error)) {
            common.log(userId, "/stock/buyStock err: ", error, ", req: ", JSON.stringify(req.body));
            return;
        }

        resp.status(201).json({ "stock": stock });
        common.log(userId, 'stock created successfully!');
    });
});

router.post('/sellStock', async (req, resp) => {
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
