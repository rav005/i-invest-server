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
    common.log(userId, "/stock/quote", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol;
    if (symbol) {
        const respData = await api.getStockCurrentRate(symbol);
        if (respData) {
            common.log(userId, "/stock/quote: ", JSON.stringify(respData));
            resp.status(200).json(respData);
        }
        else {
            common.log(userId, "/stock/quote: err", JSON.stringify(respData));
            resp.status(400).send();
        }
    }
    else {
        resp.status(400).send();
    }
});

router.post('/companyNews', async (req, resp) => {
    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/stock/companyNews", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol;
    const fromDate = common.getFromDate();
    const toDate = common.getToDate();
    if (symbol && fromDate && toDate) {
        const respData = await api.companyNews(symbol, fromDate, toDate);
        if (respData) {
            common.log(userId, "/stock/companyNews: ", JSON.stringify(respData));
            resp.status(200).json(respData);
        }
        else {
            common.log(userId, "/stock/companyNews: err", JSON.stringify(respData));
            resp.status(400).send();
        }
    }
    else {
        resp.status(400).send();
    }
});

router.post('/recommendationTrends', async (req, resp) => {
    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/stock/recommendationTrends", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol;
    if (symbol) {
        const respData = await api.recommendationTrends(symbol);
        if (respData) {

            const months = 6;
            const data = respData.slice(0, months);
            if (data && data.length > 0) {
                var responseData = [];
                responseData.push(['Period', 'Buy', 'Hold', 'Sell', 'Strong buy', 'Strong sell', { role: 'annotation' }]);
                data.slice().reverse().forEach(x => {
                    var res = x.period.split("-");
                    responseData.push([res[0] + "/" + res[1], x.buy, x.hold, x.sell, x.strongBuy, x.strongSell, '']);
                });


                common.log(userId, "/stock/recommendationTrends: ", JSON.stringify(responseData));

                resp.status(200).json(responseData);
            }
            else {
                resp.status(400).send();
            }
        }
        else {
            common.log(userId, "/stock/recommendationTrends: err", JSON.stringify(respData));
            resp.status(400).send();
        }
    }
    else {
        resp.status(400).json({ msg: "symbol is required" });
    }
});

router.post('/basicFinancials', async (req, resp) => {
    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/stock/basicFinancials", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol;
    if (symbol) {
        const respData = await api.basicFinancials(symbol);
        if (respData) {
            common.log(userId, "/stock/basicFinancials: ", JSON.stringify(respData.metric));
            resp.status(200).json(respData.metric);
        }
        else {
            common.log(userId, "/stock/basicFinancials: err", JSON.stringify(respData));
            resp.status(400).send();
        }
    }
    else {
        resp.status(400).send();
    }
});


router.post('/secFilings', async (req, resp) => {
    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/stock/secFilings", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol;
    if (symbol) {
        const respData = await api.secFilings(symbol);
        if (respData) {
            common.log(userId, "/stock/secFilings: ", JSON.stringify(respData));
            resp.status(200).json(respData);
        }
        else {
            common.log(userId, "/stock/secFilings: err", JSON.stringify(respData));
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
        if (hasSymbol) {
            common.log(userId, "/addToWatchlist", "symbol exists");
            resp.status(200).json({ "message": "symbol exists" });
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

router.post('/historical', async (req, resp) => {
    const userId = common.extractUserIdFromResponseLocals(resp);
    common.log(userId, "/stock/historical", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol;

    if (symbol) {
        try {
            const apiData = await api.historicalData(symbol);

            const data = apiData["data"];
            if (data && data.length > 0) {
                var responseData = [];
                responseData.push(['Day', 'Open', 'High', 'Low', 'Close', { role: 'annotation' }]);
                data.slice().reverse().forEach(x => {
                    const date = x.date;
                    if (x.date && x.open && x.high && x.low && x.close) {
                        const dateOnly = date.split("T");
                        responseData.push([dateOnly[0], x.open, x.high, x.low, x.close, '']);
                    }
                });
                common.log(userId, "/stock/historical: ", JSON.stringify(responseData.length));

                resp.status(200).json(responseData);
            }
            else {
                common.log(userId, "/stock/historical: ", JSON.stringify(responseData));
                resp.status(400).send();
            }
        } catch (err) {
            common.log(userId, "/stock/historical: exception: ", err);
            resp.status(400).send();
        }
    }
    else {
        resp.status(400).json({ msg: "symbol is required" });
    }
});

module.exports = router;
