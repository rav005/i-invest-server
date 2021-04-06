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
                data.forEach(x => {
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

            const apiResp = { "pagination": { "limit": 100, "offset": 0, "count": 100, "total": 250 }, "data": [{ "open": 123.66, "high": 124.18, "low": 122.49, "close": 123.0, "volume": 75089134.0, "adj_high": 124.18, "adj_low": 122.49, "adj_close": 123.0, "adj_open": 123.66, "adj_volume": 75089134.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-04-01T00:00:00+0000" }, { "open": 121.65, "high": 123.52, "low": 121.15, "close": 122.15, "volume": 110940463.0, "adj_high": 123.52, "adj_low": 121.15, "adj_close": 122.15, "adj_open": 121.65, "adj_volume": 118323826.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-31T00:00:00+0000" }, { "open": 120.11, "high": 120.4031, "low": 118.86, "close": 119.9, "volume": 85671919.0, "adj_high": null, "adj_low": null, "adj_close": 119.9, "adj_open": null, "adj_volume": null, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-30T00:00:00+0000" }, { "open": 121.65, "high": 122.58, "low": 120.7299, "close": 121.39, "volume": 80819203.0, "adj_high": null, "adj_low": null, "adj_close": 121.39, "adj_open": null, "adj_volume": null, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-29T00:00:00+0000" }, { "open": 120.35, "high": 121.48, "low": 118.92, "close": 121.21, "volume": 94071234.0, "adj_high": 121.48, "adj_low": 118.92, "adj_close": 121.21, "adj_open": 120.35, "adj_volume": 94071234.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-26T00:00:00+0000" }, { "open": 119.54, "high": 121.66, "low": 119.0, "close": 120.59, "volume": 98844681.0, "adj_high": 121.66, "adj_low": 119.0, "adj_close": 120.59, "adj_open": 119.54, "adj_volume": 98844681.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-25T00:00:00+0000" }, { "open": 122.82, "high": 122.9, "low": 120.065, "close": 120.09, "volume": 85447491.0, "adj_high": 122.9, "adj_low": 120.065, "adj_close": 120.09, "adj_open": 122.82, "adj_volume": 88530485.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-24T00:00:00+0000" }, { "open": 123.33, "high": 124.24, "low": 122.14, "close": 122.54, "volume": 95467142.0, "adj_high": 124.24, "adj_low": 122.14, "adj_close": 122.54, "adj_open": 123.33, "adj_volume": 95467142.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-23T00:00:00+0000" }, { "open": 120.33, "high": 123.87, "low": 120.26, "close": 123.39, "volume": 111912284.0, "adj_high": 123.87, "adj_low": 120.26, "adj_close": 123.39, "adj_open": 120.33, "adj_volume": 111912284.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-22T00:00:00+0000" }, { "open": 119.9, "high": 121.43, "low": 119.675, "close": 119.99, "volume": 185023200.0, "adj_high": 121.43, "adj_low": 119.675, "adj_close": 119.99, "adj_open": 119.9, "adj_volume": 185549522.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-19T00:00:00+0000" }, { "open": 122.88, "high": 123.18, "low": 120.33, "close": 120.53, "volume": 118907153.0, "adj_high": 123.18, "adj_low": 120.32, "adj_close": 120.53, "adj_open": 122.88, "adj_volume": 121469755.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-18T00:00:00+0000" }, { "open": 124.05, "high": 125.8599, "low": 122.34, "close": 124.76, "volume": 111932636.0, "adj_high": 125.8599, "adj_low": 122.336, "adj_close": 124.76, "adj_open": 124.05, "adj_volume": 111932636.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-17T00:00:00+0000" }, { "open": 125.7, "high": 127.22, "low": 124.715, "close": 125.57, "volume": 115227936.0, "adj_high": 127.22, "adj_low": 124.715, "adj_close": 125.57, "adj_open": 125.7, "adj_volume": 115227936.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-16T00:00:00+0000" }, { "open": 121.41, "high": 124.0, "low": 120.43, "close": 123.99, "volume": 92590555.0, "adj_high": 124.0, "adj_low": 120.42, "adj_close": 123.99, "adj_open": 121.41, "adj_volume": 92590555.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-15T00:00:00+0000" }, { "open": 120.4, "high": 121.17, "low": 119.16, "close": 121.03, "volume": 87963400.0, "adj_high": 121.17, "adj_low": 119.16, "adj_close": 121.03, "adj_open": 120.4, "adj_volume": 88105050.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-12T00:00:00+0000" }, { "open": 122.54, "high": 123.21, "low": 121.26, "close": 121.96, "volume": 102753600.0, "adj_high": 123.21, "adj_low": 121.26, "adj_close": 121.96, "adj_open": 122.54, "adj_volume": 103026514.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-11T00:00:00+0000" }, { "open": 121.69, "high": 122.17, "low": 119.45, "close": 119.98, "volume": 111760400.0, "adj_high": 122.17, "adj_low": 119.45, "adj_close": 119.98, "adj_open": 121.69, "adj_volume": 111943326.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-10T00:00:00+0000" }, { "open": 119.03, "high": 122.06, "low": 118.79, "close": 121.09, "volume": 129159600.0, "adj_high": 122.06, "adj_low": 118.79, "adj_close": 121.09, "adj_open": 119.03, "adj_volume": 129525780.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-09T00:00:00+0000" }, { "open": 120.93, "high": 121.0, "low": 116.21, "close": 116.36, "volume": 153918600.0, "adj_high": 121.0, "adj_low": 116.21, "adj_close": 116.36, "adj_open": 120.93, "adj_volume": 154376610.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-08T00:00:00+0000" }, { "open": 120.98, "high": 121.935, "low": 117.57, "close": 121.42, "volume": 153590400.0, "adj_high": 121.935, "adj_low": 117.57, "adj_close": 121.42, "adj_open": 120.98, "adj_volume": 153766601.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-05T00:00:00+0000" }, { "open": 121.75, "high": 123.6, "low": 118.62, "close": 120.13, "volume": 164527934.0, "adj_high": 123.6, "adj_low": 118.62, "adj_close": 120.13, "adj_open": 121.75, "adj_volume": 178154975.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-04T00:00:00+0000" }, { "open": 124.81, "high": 125.71, "low": 121.84, "close": 122.06, "volume": 112965897.0, "adj_high": 125.71, "adj_low": 121.84, "adj_close": 122.06, "adj_open": 124.81, "adj_volume": 112966340.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-03T00:00:00+0000" }, { "open": 128.41, "high": 128.72, "low": 125.015, "close": 125.12, "volume": 102260945.0, "adj_high": 128.72, "adj_low": 125.01, "adj_close": 125.12, "adj_open": 128.41, "adj_volume": 102260945.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-02T00:00:00+0000" }, { "open": 123.75, "high": 127.93, "low": 122.79, "close": 127.79, "volume": 116307892.0, "adj_high": 127.93, "adj_low": 122.79, "adj_close": 127.79, "adj_open": 123.75, "adj_volume": 116307892.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-03-01T00:00:00+0000" }, { "open": 122.59, "high": 124.85, "low": 121.2, "close": 121.26, "volume": 164320000.0, "adj_high": 124.85, "adj_low": 121.2, "adj_close": 121.26, "adj_open": 122.59, "adj_volume": 163424672.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-26T00:00:00+0000" }, { "open": 124.68, "high": 126.4585, "low": 120.54, "close": 120.99, "volume": 148199540.0, "adj_high": 126.4585, "adj_low": 120.54, "adj_close": 120.99, "adj_open": 124.68, "adj_volume": 144766924.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-25T00:00:00+0000" }, { "open": 124.94, "high": 125.56, "low": 122.23, "close": 125.35, "volume": 111039904.0, "adj_high": 125.56, "adj_low": 122.23, "adj_close": 125.35, "adj_open": 124.94, "adj_volume": 111039904.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-24T00:00:00+0000" }, { "open": 123.76, "high": 126.705, "low": 118.39, "close": 125.86, "volume": 158273022.0, "adj_high": 126.71, "adj_low": 118.39, "adj_close": 125.86, "adj_open": 123.76, "adj_volume": 158273022.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-23T00:00:00+0000" }, { "open": 128.01, "high": 129.72, "low": 125.6, "close": 126.0, "volume": 100925374.0, "adj_high": 129.72, "adj_low": 125.6, "adj_close": 126.0, "adj_open": 128.01, "adj_volume": 102886922.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-22T00:00:00+0000" }, { "open": 130.24, "high": 130.71, "low": 128.8, "close": 129.87, "volume": 87668834.0, "adj_high": 130.71, "adj_low": 128.8, "adj_close": 129.87, "adj_open": 130.24, "adj_volume": 87668834.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-19T00:00:00+0000" }, { "open": 129.2, "high": 129.995, "low": 127.41, "close": 129.71, "volume": 96856748.0, "adj_high": 129.995, "adj_low": 127.41, "adj_close": 129.71, "adj_open": 129.2, "adj_volume": 96856748.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-18T00:00:00+0000" }, { "open": 131.25, "high": 132.22, "low": 129.47, "close": 130.84, "volume": 97372199.0, "adj_high": 132.22, "adj_low": 129.47, "adj_close": 130.84, "adj_open": 131.25, "adj_volume": 97372199.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-17T00:00:00+0000" }, { "open": 135.49, "high": 136.01, "low": 132.79, "close": 133.19, "volume": 80576316.0, "adj_high": 136.01, "adj_low": 132.79, "adj_close": 133.19, "adj_open": 135.49, "adj_volume": 80576316.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-16T00:00:00+0000" }, { "open": 134.35, "high": 135.53, "low": 133.6921, "close": 135.37, "volume": 60145130.0, "adj_high": 135.53, "adj_low": 133.6921, "adj_close": 135.37, "adj_open": 134.35, "adj_volume": 60145130.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-12T00:00:00+0000" }, { "open": 135.9, "high": 136.39, "low": 133.77, "close": 135.13, "volume": 64280029.0, "adj_high": 136.39, "adj_low": 133.77, "adj_close": 135.13, "adj_open": 135.9, "adj_volume": 64280029.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-11T00:00:00+0000" }, { "open": 136.48, "high": 136.99, "low": 134.4, "close": 135.39, "volume": 72647988.0, "adj_high": 136.99, "adj_low": 134.4, "adj_close": 135.39, "adj_open": 136.48, "adj_volume": 72647988.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-10T00:00:00+0000" }, { "open": 136.62, "high": 137.877, "low": 135.85, "close": 136.01, "volume": 75986989.0, "adj_high": 137.877, "adj_low": 135.85, "adj_close": 136.01, "adj_open": 136.62, "adj_volume": 75986989.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-09T00:00:00+0000" }, { "open": 136.03, "high": 136.96, "low": 134.92, "close": 136.91, "volume": 71297214.0, "adj_high": 136.96, "adj_low": 134.92, "adj_close": 136.91, "adj_open": 136.03, "adj_volume": 71297214.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-08T00:00:00+0000" }, { "open": 137.35, "high": 137.42, "low": 135.86, "close": 136.76, "volume": 75693830.0, "adj_high": 137.42, "adj_low": 135.86, "adj_close": 136.76, "adj_open": 137.35, "adj_volume": 75693830.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-05T00:00:00+0000" }, { "open": 136.3, "high": 137.4, "low": 134.59, "close": 137.39, "volume": 84183061.0, "adj_high": 137.1943489213, "adj_low": 134.3885547403, "adj_close": 137.1843638886, "adj_open": 136.0959953273, "adj_volume": 84183061.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-04T00:00:00+0000" }, { "open": 135.76, "high": 135.77, "low": 133.61, "close": 133.94, "volume": 89880937.0, "adj_high": 135.5667885956, "adj_low": 133.4100215383, "adj_close": 133.7395276165, "adj_open": 135.556803563, "adj_volume": 89880937.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-03T00:00:00+0000" }, { "open": 135.73, "high": 136.31, "low": 134.61, "close": 134.99, "volume": 82266419.0, "adj_high": 136.31, "adj_low": 134.61, "adj_close": 134.99, "adj_open": 135.73, "adj_volume": 82266419.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-02T00:00:00+0000" }, { "open": 133.75, "high": 135.38, "low": 130.93, "close": 134.14, "volume": 106239823.0, "adj_high": 135.38, "adj_low": 130.93, "adj_close": 134.14, "adj_open": 133.75, "adj_volume": 106239823.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-02-01T00:00:00+0000" }, { "open": 135.83, "high": 136.74, "low": 130.21, "close": 131.96, "volume": 177523812.0, "adj_high": 136.74, "adj_low": 130.21, "adj_close": 131.96, "adj_open": 135.83, "adj_volume": 177523812.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-29T00:00:00+0000" }, { "open": 139.52, "high": 141.99, "low": 136.7, "close": 137.09, "volume": 142621128.0, "adj_high": 141.99, "adj_low": 136.7, "adj_close": 137.09, "adj_open": 139.52, "adj_volume": 142621128.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-28T00:00:00+0000" }, { "open": 143.43, "high": 144.3, "low": 140.41, "close": 142.06, "volume": 140843759.0, "adj_high": 144.3, "adj_low": 140.41, "adj_close": 142.06, "adj_open": 143.43, "adj_volume": 140843759.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-27T00:00:00+0000" }, { "open": 143.6, "high": 144.3, "low": 141.37, "close": 143.16, "volume": 98390555.0, "adj_high": 144.3, "adj_low": 141.37, "adj_close": 143.16, "adj_open": 143.6, "adj_volume": 98390555.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-26T00:00:00+0000" }, { "open": 143.07, "high": 145.09, "low": 136.54, "close": 142.92, "volume": 157611713.0, "adj_high": 145.09, "adj_low": 136.54, "adj_close": 142.92, "adj_open": 143.07, "adj_volume": 157611713.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-25T00:00:00+0000" }, { "open": 136.28, "high": 139.85, "low": 135.02, "close": 139.07, "volume": 114459360.0, "adj_high": 139.85, "adj_low": 135.02, "adj_close": 139.07, "adj_open": 136.28, "adj_volume": 114459360.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-22T00:00:00+0000" }, { "open": 133.8, "high": 139.67, "low": 133.59, "close": 136.87, "volume": 120529544.0, "adj_high": 139.67, "adj_low": 133.59, "adj_close": 136.87, "adj_open": 133.8, "adj_volume": 120529544.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-21T00:00:00+0000" }, { "open": 128.66, "high": 132.49, "low": 128.55, "close": 132.03, "volume": 104319489.0, "adj_high": 132.49, "adj_low": 128.55, "adj_close": 132.03, "adj_open": 128.66, "adj_volume": 104319489.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-20T00:00:00+0000" }, { "open": 127.78, "high": 128.71, "low": 126.938, "close": 127.83, "volume": 90757329.0, "adj_high": 128.71, "adj_low": 126.938, "adj_close": 127.83, "adj_open": 127.78, "adj_volume": 90757329.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-19T00:00:00+0000" }, { "open": 128.78, "high": 130.2242, "low": 127.0, "close": 127.14, "volume": 111598531.0, "adj_high": 130.2242, "adj_low": 127.0, "adj_close": 127.14, "adj_open": 128.78, "adj_volume": 111598531.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-15T00:00:00+0000" }, { "open": 130.8, "high": 131.0, "low": 128.76, "close": 128.91, "volume": 90221755.0, "adj_high": 131.0, "adj_low": 128.76, "adj_close": 128.91, "adj_open": 130.8, "adj_volume": 90221755.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-14T00:00:00+0000" }, { "open": 128.76, "high": 131.45, "low": 128.49, "close": 130.89, "volume": 88636831.0, "adj_high": 131.45, "adj_low": 128.49, "adj_close": 130.89, "adj_open": 128.76, "adj_volume": 88636831.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-13T00:00:00+0000" }, { "open": 128.5, "high": 129.69, "low": 126.86, "close": 128.8, "volume": 90440255.0, "adj_high": 129.69, "adj_low": 126.86, "adj_close": 128.8, "adj_open": 128.5, "adj_volume": 90440255.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-12T00:00:00+0000" }, { "open": 129.19, "high": 130.17, "low": 128.5, "close": 128.98, "volume": 100620880.0, "adj_high": 130.17, "adj_low": 128.5, "adj_close": 128.98, "adj_open": 129.19, "adj_volume": 100620880.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-11T00:00:00+0000" }, { "open": 132.43, "high": 132.63, "low": 130.23, "close": 132.05, "volume": 105158245.0, "adj_high": 132.63, "adj_low": 130.23, "adj_close": 132.05, "adj_open": 132.43, "adj_volume": 105158245.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-08T00:00:00+0000" }, { "open": 128.36, "high": 131.63, "low": 127.86, "close": 130.92, "volume": 109578157.0, "adj_high": 131.63, "adj_low": 127.86, "adj_close": 130.92, "adj_open": 128.36, "adj_volume": 109578157.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-07T00:00:00+0000" }, { "open": 127.72, "high": 131.0499, "low": 126.382, "close": 126.6, "volume": 155087970.0, "adj_high": 131.0499, "adj_low": 126.382, "adj_close": 126.6, "adj_open": 127.72, "adj_volume": 155087970.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-06T00:00:00+0000" }, { "open": 128.89, "high": 131.74, "low": 128.43, "close": 131.01, "volume": 97664898.0, "adj_high": 131.74, "adj_low": 128.43, "adj_close": 131.01, "adj_open": 128.89, "adj_volume": 97664898.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-05T00:00:00+0000" }, { "open": 133.52, "high": 133.6116, "low": 126.76, "close": 129.41, "volume": 143301887.0, "adj_high": 133.6116, "adj_low": 126.76, "adj_close": 129.41, "adj_open": 133.52, "adj_volume": 143301887.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2021-01-04T00:00:00+0000" }, { "open": 134.08, "high": 134.74, "low": 131.72, "close": 132.69, "volume": 99116586.0, "adj_high": 134.74, "adj_low": 131.72, "adj_close": 132.69, "adj_open": 134.08, "adj_volume": 99116586.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-31T00:00:00+0000" }, { "open": 135.58, "high": 135.99, "low": 133.4, "close": 133.72, "volume": 96452124.0, "adj_high": 135.99, "adj_low": 133.4, "adj_close": 133.72, "adj_open": 135.58, "adj_volume": 96452124.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-30T00:00:00+0000" }, { "open": 138.05, "high": 138.789, "low": 134.3409, "close": 134.87, "volume": 121047324.0, "adj_high": 138.789, "adj_low": 134.3409, "adj_close": 134.87, "adj_open": 138.05, "adj_volume": 121047324.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-29T00:00:00+0000" }, { "open": 133.99, "high": 137.34, "low": 133.51, "close": 136.69, "volume": 123124632.0, "adj_high": 137.34, "adj_low": 133.51, "adj_close": 136.69, "adj_open": 133.99, "adj_volume": 123124632.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-28T00:00:00+0000" }, { "open": 131.32, "high": 133.46, "low": 131.1, "close": 131.97, "volume": 54930064.0, "adj_high": 133.46, "adj_low": 131.1, "adj_close": 131.97, "adj_open": 131.32, "adj_volume": 54930064.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-24T00:00:00+0000" }, { "open": 132.16, "high": 132.43, "low": 130.78, "close": 130.96, "volume": 88223692.0, "adj_high": 132.43, "adj_low": 130.78, "adj_close": 130.96, "adj_open": 132.16, "adj_volume": 88223692.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-23T00:00:00+0000" }, { "open": 131.61, "high": 134.405, "low": 129.65, "close": 131.88, "volume": 169351825.0, "adj_high": 134.405, "adj_low": 129.65, "adj_close": 131.88, "adj_open": 131.61, "adj_volume": 169351825.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-22T00:00:00+0000" }, { "open": 125.02, "high": 128.31, "low": 123.449, "close": 128.23, "volume": 121251553.0, "adj_high": 128.31, "adj_low": 123.449, "adj_close": 128.23, "adj_open": 125.02, "adj_volume": 121251553.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-21T00:00:00+0000" }, { "open": 128.96, "high": 129.1, "low": 126.12, "close": 126.655, "volume": 192541496.0, "adj_high": 129.1, "adj_low": 126.12, "adj_close": 126.655, "adj_open": 128.96, "adj_volume": 192541496.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-18T00:00:00+0000" }, { "open": 128.9, "high": 129.58, "low": 128.045, "close": 128.7, "volume": 94359811.0, "adj_high": 129.58, "adj_low": 128.045, "adj_close": 128.7, "adj_open": 128.9, "adj_volume": 94359811.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-17T00:00:00+0000" }, { "open": 127.41, "high": 128.37, "low": 126.56, "close": 127.81, "volume": 98208591.0, "adj_high": 128.37, "adj_low": 126.56, "adj_close": 127.81, "adj_open": 127.41, "adj_volume": 98208591.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-16T00:00:00+0000" }, { "open": 124.34, "high": 127.9, "low": 124.13, "close": 127.88, "volume": 157572262.0, "adj_high": 127.9, "adj_low": 124.13, "adj_close": 127.88, "adj_open": 124.34, "adj_volume": 157572262.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-15T00:00:00+0000" }, { "open": 122.6, "high": 123.35, "low": 121.54, "close": 121.78, "volume": 79075988.0, "adj_high": 123.35, "adj_low": 121.54, "adj_close": 121.78, "adj_open": 122.6, "adj_volume": 79075988.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-14T00:00:00+0000" }, { "open": 122.43, "high": 122.76, "low": 120.55, "close": 122.41, "volume": 86939786.0, "adj_high": 122.76, "adj_low": 120.55, "adj_close": 122.41, "adj_open": 122.43, "adj_volume": 86939786.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-11T00:00:00+0000" }, { "open": 120.5, "high": 123.87, "low": 120.15, "close": 123.24, "volume": 81312170.0, "adj_high": 123.87, "adj_low": 120.15, "adj_close": 123.24, "adj_open": 120.5, "adj_volume": 81312170.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-10T00:00:00+0000" }, { "open": 124.53, "high": 125.95, "low": 121.0, "close": 121.78, "volume": 115089193.0, "adj_high": 125.95, "adj_low": 121.0, "adj_close": 121.78, "adj_open": 124.53, "adj_volume": 115089193.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-09T00:00:00+0000" }, { "open": 124.37, "high": 124.98, "low": 123.09, "close": 124.38, "volume": 82225512.0, "adj_high": 124.98, "adj_low": 123.09, "adj_close": 124.38, "adj_open": 124.37, "adj_volume": 82225512.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-08T00:00:00+0000" }, { "open": 122.31, "high": 124.57, "low": 122.25, "close": 123.75, "volume": 86711990.0, "adj_high": 124.57, "adj_low": 122.25, "adj_close": 123.75, "adj_open": 122.31, "adj_volume": 86711990.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-07T00:00:00+0000" }, { "open": 122.6, "high": 122.8608, "low": 121.52, "close": 122.25, "volume": 78260421.0, "adj_high": 122.8608, "adj_low": 121.52, "adj_close": 122.25, "adj_open": 122.6, "adj_volume": 78260421.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-04T00:00:00+0000" }, { "open": 123.52, "high": 123.78, "low": 122.21, "close": 122.94, "volume": 78967630.0, "adj_high": 123.78, "adj_low": 122.21, "adj_close": 122.94, "adj_open": 123.52, "adj_volume": 78967630.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-03T00:00:00+0000" }, { "open": 122.02, "high": 123.37, "low": 120.89, "close": 123.08, "volume": 89004195.0, "adj_high": 123.37, "adj_low": 120.89, "adj_close": 123.08, "adj_open": 122.02, "adj_volume": 89004195.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-02T00:00:00+0000" }, { "open": 121.01, "high": 123.4693, "low": 120.01, "close": 122.72, "volume": 125920963.0, "adj_high": 123.4693, "adj_low": 120.01, "adj_close": 122.72, "adj_open": 121.01, "adj_volume": 125920963.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-12-01T00:00:00+0000" }, { "open": 116.97, "high": 120.97, "low": 116.81, "close": 119.05, "volume": 169410176.0, "adj_high": 120.97, "adj_low": 116.81, "adj_close": 119.05, "adj_open": 116.97, "adj_volume": 169410176.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-11-30T00:00:00+0000" }, { "open": 116.57, "high": 117.49, "low": 116.22, "close": 116.59, "volume": 46691331.0, "adj_high": 117.49, "adj_low": 116.22, "adj_close": 116.59, "adj_open": 116.57, "adj_volume": 46691331.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-11-27T00:00:00+0000" }, { "open": 115.55, "high": 116.75, "low": 115.17, "close": 116.03, "volume": 76499234.0, "adj_high": 116.75, "adj_low": 115.17, "adj_close": 116.03, "adj_open": 115.55, "adj_volume": 76499234.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-11-25T00:00:00+0000" }, { "open": 113.91, "high": 115.85, "low": 112.59, "close": 115.17, "volume": 113226248.0, "adj_high": 115.85, "adj_low": 112.59, "adj_close": 115.17, "adj_open": 113.91, "adj_volume": 113226248.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-11-24T00:00:00+0000" }, { "open": 117.18, "high": 117.6202, "low": 113.75, "close": 113.85, "volume": 127959318.0, "adj_high": 117.6202, "adj_low": 113.75, "adj_close": 113.85, "adj_open": 117.18, "adj_volume": 127959318.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-11-23T00:00:00+0000" }, { "open": 118.64, "high": 118.77, "low": 117.29, "close": 117.34, "volume": 73604287.0, "adj_high": 118.77, "adj_low": 117.29, "adj_close": 117.34, "adj_open": 118.64, "adj_volume": 73604287.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-11-20T00:00:00+0000" }, { "open": 117.59, "high": 119.06, "low": 116.81, "close": 118.64, "volume": 74112972.0, "adj_high": 119.06, "adj_low": 116.81, "adj_close": 118.64, "adj_open": 117.59, "adj_volume": 74112972.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-11-19T00:00:00+0000" }, { "open": 118.61, "high": 119.82, "low": 118.0, "close": 118.03, "volume": 76322111.0, "adj_high": 119.82, "adj_low": 118.0, "adj_close": 118.03, "adj_open": 118.61, "adj_volume": 76322111.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-11-18T00:00:00+0000" }, { "open": 119.55, "high": 120.6741, "low": 118.96, "close": 119.39, "volume": 74270973.0, "adj_high": 120.6741, "adj_low": 118.96, "adj_close": 119.39, "adj_open": 119.55, "adj_volume": 74270973.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-11-17T00:00:00+0000" }, { "open": 118.92, "high": 120.99, "low": 118.146, "close": 120.3, "volume": 91183018.0, "adj_high": 120.99, "adj_low": 118.146, "adj_close": 120.3, "adj_open": 118.92, "adj_volume": 91183018.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-11-16T00:00:00+0000" }, { "open": 119.44, "high": 119.6717, "low": 117.87, "close": 119.26, "volume": 81688586.0, "adj_high": 119.6717, "adj_low": 117.87, "adj_close": 119.26, "adj_open": 119.44, "adj_volume": 81688586.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-11-13T00:00:00+0000" }, { "open": 119.62, "high": 120.53, "low": 118.57, "close": 119.21, "volume": 103350674.0, "adj_high": 120.53, "adj_low": 118.57, "adj_close": 119.21, "adj_open": 119.62, "adj_volume": 103350674.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-11-12T00:00:00+0000" }, { "open": 117.19, "high": 119.63, "low": 116.44, "close": 119.49, "volume": 112294954.0, "adj_high": 119.63, "adj_low": 116.44, "adj_close": 119.49, "adj_open": 117.19, "adj_volume": 112294954.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-11-11T00:00:00+0000" }, { "open": 115.55, "high": 117.59, "low": 114.13, "close": 115.97, "volume": 138023390.0, "adj_high": 117.59, "adj_low": 114.13, "adj_close": 115.97, "adj_open": 115.55, "adj_volume": 138023390.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-11-10T00:00:00+0000" }, { "open": 120.5, "high": 121.99, "low": 116.05, "close": 116.32, "volume": 154515315.0, "adj_high": 121.99, "adj_low": 116.05, "adj_close": 116.32, "adj_open": 120.5, "adj_volume": 154515315.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-11-09T00:00:00+0000" }, { "open": 118.32, "high": 119.2, "low": 116.13, "close": 118.69, "volume": 114457922.0, "adj_high": 119.2, "adj_low": 116.13, "adj_close": 118.69, "adj_open": 118.32, "adj_volume": 114457922.0, "split_factor": 1.0, "symbol": "AAPL", "exchange": "XNAS", "date": "2020-11-06T00:00:00+0000" }] }

            const data = apiResp["data"];
            if (data && data.length > 0) {
                var responseData = [];
                //responseData.push(['Period', 'Buy', 'Hold', 'Sell', 'Strong buy', 'Strong sell', { role: 'annotation' }]);
                //data.forEach(x => {
                //    var res = x.period.split("-");
                //    responseData.push([res[0] + "/" + res[1], x.buy, x.hold, x.sell, x.strongBuy, x.strongSell, '']);
                //});
                responseData.push(['Day', 'Open', 'High', 'Low', 'Close', 'Adj open', 'Adj high', 'Adj low', 'Adj close', { role: 'annotation' }]);
                data.forEach(x => {
                    const date = x.date;
                    if (x.date && x.open && x.high && x.low && x.close && x.adj_open && x.adj_high && x.adj_low && x.adj_close) {
                        const dateOnly = date.split("T");
                        responseData.push([dateOnly[0], x.open, x.high, x.low, x.close, x.adj_open, x.adj_high, x.adj_low, x.adj_close, '']);
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
