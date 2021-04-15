const express = require('express');
const router = express.Router();
const Account = require('../models/account');
const Transaction = require('../models/transaction');
const Stock = require('../models/stock');
const jwt = require("jsonwebtoken");
const db = require('../services/db');
const common = require('./common');
const api = require('./api');

router.get('/getWatchlist', async (req, resp) => {
    try {
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
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/quote', async (req, resp) => {
    try {
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
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/companyNews', async (req, resp) => {
    try {
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
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/recommendationTrends', async (req, resp) => {
    try {
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
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/basicFinancials', async (req, resp) => {
    try {
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
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/addToWatchlist', async (req, resp) => {
    try {
        const userId = common.extractUserIdFromResponseLocals(resp);
        common.log(userId, "/addToWatchlist", "req: " + JSON.stringify(req.body));

        const stockName = req.body.stockName;
        const symbol = req.body.symbol.toUpperCase();
        const currency = req.body.currency.toUpperCase();
        if (userId && stockName && symbol) {

            var user = await common.findUserById(userId);

            const hasSymbol = user.watchList.find(value => value.symbol === symbol);
            if (hasSymbol) {
                common.log(userId, "/addToWatchlist", "symbol exists");
                resp.status(200).json({ "message": "symbol exists" });
            } else {
                //common.log(userId,"/addToWatchlist", "user: " + JSON.stringify(user));
                user.watchList.push({ name: stockName, symbol: symbol, currency: currency });
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
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/removeFromWatchlist', async (req, resp) => {
    try {
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
    } catch (err) {
        resp.status(500).send();
    }
});

router.post('/buyStock', async (req, resp) => {
    try {
        const userId = common.extractUserIdFromResponseLocals(resp);
        common.log(userId, "/stock/buyStock", "req: " + JSON.stringify(req.body));

        var reqBody = req.body;
        const stock = new Stock(reqBody);
        const accountId = reqBody.accountId;

        db.connect();

        const account = await Account.findOne({ _id: accountId });
        if (!account) {
            common.log(userId, "/stock/buyStock account not found: ", JSON.stringify(account));
            resp.status(400).json({ success: false, message: "No account found" });
            return;
        }

        var forex = await api.getForex();
        var exchangeRate = 1;
        if (stock.currency == 'USD' && account?.currency != 'USD') {
            exchangeRate = forex.USD_CAD;
        } else if (stock.currency == 'CAD' && account?.currency != 'CAD') {
            exchangeRate = forex.CAD_USD;
        } else {
            exchangeRate = exchangeRate;
        }

        const orderAmount = (reqBody.price * reqBody.quantity) * exchangeRate;

        if (reqBody.completed == true) {
            const newBalance = account.balance - orderAmount;
            if (newBalance < 0) {
                common.log(userId, "/stock/buyStock new balance is negative: ", "");
                resp.status(400).json({ success: false, message: "Insufficient balance" });
                return;
            }
            await Account.updateOne({ _id: accountId }, { balance: newBalance });
        }

        if (stock.type != 'Limit buy') {
            var transaction = new Transaction();
            transaction.name = reqBody.name;
            transaction.stockSymbol = reqBody.symbol;
            transaction.quantity = reqBody.quantity;
            transaction.type = reqBody.type;
            transaction.amount = orderAmount;
            transaction.accountId = accountId;

            await transaction.save(error => {
                if (common.checkServerError(resp, error)) {
                    common.log(userId, "/stock/buyStock err: ", error, ", req: ", JSON.stringify(transaction));
                }
                else {
                    common.log(userId, "/stock/buyStock", 'transaction created successfully!');
                }
            });
        }

        await stock.save(error => {
            if (common.checkServerError(resp, error)) {
                common.log(userId, "/stock/buyStock err: ", error, ", req: ", JSON.stringify(stock));
                resp.status(400).json({ success: false, message: "Buy error" });
                return;
            }
            else {
                resp.status(201).json({ success: true, message: "Buy successful!" });
                common.log(userId, 'stock created successfully!', '');
            }
        });
    } catch (err) {
        common.log("", "/stock/buyStock: err", err);
        resp.status(500).json({ success: false, message: "Buy exception" });
        return;
    }
});

router.post('/sellStock', async (req, resp) => {
    try {
        const userId = common.extractUserIdFromResponseLocals(resp);
        common.log(userId, "/stock/sellStock", "req: " + JSON.stringify(req.body));

        var reqBody = req.body;
        const accountId = reqBody.accountId;
        const stockId = reqBody.stockId;
        const type = reqBody.type;
        const quantity = reqBody.quantity;
        const price = reqBody.price;
        const completed = reqBody.completed;

        db.connect();

        const account = await Account.findOne({ _id: accountId });
        if (!account) {
            common.log(userId, "/stock/sellStock account not found: ", JSON.stringify(account));
            resp.status(400).json({ success: false, message: "No account found" });
            return;
        }

        const stock = await Stock.findOne({ _id: stockId });
        if (!stock) {
            common.log(userId, "/stock/sellStock stock not found: ", JSON.stringify(stock));
            resp.status(400).json({ success: false, message: "No stock found" });
            return;
        }

        var forex = await api.getForex();
        var exchangeRate = 1;
        if (stock.currency == 'USD' && account?.currency != 'USD') {
            exchangeRate = forex.USD_CAD;
        } else if (stock.currency == 'CAD' && account?.currency != 'CAD') {
            exchangeRate = forex.CAD_USD;
        } else {
            exchangeRate = exchangeRate;
        }
        const orderAmount = (price * quantity) * exchangeRate;
        if (reqBody.completed == true) {
            const newBalance = account.balance + orderAmount;
            await Account.updateOne({ _id: accountId }, { balance: newBalance });
        }

        if (type === 'Market sell') {
            var transaction = new Transaction();
            transaction.name = stock.name;
            transaction.stockSymbol = stock.symbol;
            transaction.quantity = quantity;
            transaction.type = type;
            transaction.amount = orderAmount;
            transaction.accountId = accountId;

            await transaction.save(error => {
                if (common.checkServerError(resp, error)) {
                    common.log(userId, "/stock/sellStock err: ", error, ", req: ", JSON.stringify(transaction));
                }
                else {
                    common.log(userId, "/stock/sellStock", 'transaction created successfully!');
                }
            });
        }

        const quantityRemaining = (stock.quantity - quantity);
        if (quantityRemaining == 0) {
            await Stock.deleteOne({ _id: stock.id }).then(function () {
                common.log(userId, "/stock/sellStock", 'all stock sold!');
                resp.status(200).json({ success: true });
            }).catch(function (error) {
                common.log(userId, "/stock/sellStock", 'stock not sold!');
                resp.status(500).json({ success: true, message: JSON.stringify(error) });
            });
        }
        else {
            // update existing stock holding
            await Stock.updateOne({ _id: stockId }, { quantity: quantityRemaining });
            common.log(userId, "/stock/sellStock", 'stock remaining:', quantityRemaining);

            if (type === 'Limit sell') {

                // add new stock sell order
                var newStockOrder = Stock();
                newStockOrder.name = stock.name;
                newStockOrder.type = "Limit sell";
                newStockOrder.symbol = stock.symbol;
                newStockOrder.currency = stock.currency;
                newStockOrder.quantity = quantity;
                // original purchase price
                newStockOrder.purchasePrice = stock.price;
                // limit sell price
                newStockOrder.price = price;
                newStockOrder.accountId = accountId;
                newStockOrder.completed = false;

                await newStockOrder.save(error => {
                    if (common.checkServerError(resp, error)) {
                        common.log(userId, "/stock/sellStock newStockOrder err: ", error, ", req: ", JSON.stringify(newStockOrder));
                    }
                    else {
                        common.log(userId, "/stock/cancelOrder", 'newStockOrder created!');
                    }
                });
            }
            resp.status(200).json({ success: true });
        }

    } catch (err) {
        common.log("", "/stock/sellStock: err", err);
        resp.status(500).json({ success: false, message: "sell exception" });
        return;
    }
});

router.post('/cancelOrder', async (req, resp) => {
    try {
        const userId = common.extractUserIdFromResponseLocals(resp);
        common.log(userId, "/stock/cancelOrder", "req: " + JSON.stringify(req.body));

        const reqBody = req.body;
        const stockId = reqBody.stockId;
        const accountId = reqBody.accountId;

        db.connect();

        const account = await Account.findOne({ _id: accountId });
        if (!account) {
            common.log(userId, "/stock/cancelOrder account not found: ", JSON.stringify(account));
            resp.status(400).json({ success: false, message: "No account found" });
            return;
        }

        const stock = await Stock.findOne({ _id: stockId });
        if (!stock) {
            common.log(userId, "/stock/cancelOrder account not found: ", JSON.stringify(account));
            resp.status(400).json({ success: false, message: "No stock found" });
            return;
        }

        var forex = await api.getForex();
        var exchangeRate = 1;
        if (stock.currency == 'USD' && account?.currency != 'USD') {
            exchangeRate = forex.USD_CAD;
        } else if (stock.currency == 'CAD' && account?.currency != 'CAD') {
            exchangeRate = forex.CAD_USD;
        } else {
            exchangeRate = exchangeRate;
        }

        const orderAmount = (stock.price * stock.quantity) * exchangeRate;
        var transaction = new Transaction();
        transaction.name = stock.name;
        transaction.stockSymbol = stock.symbol;
        transaction.quantity = stock.quantity;
        transaction.type = "Canceled";
        transaction.amount = orderAmount;
        transaction.accountId = accountId;

        await transaction.save(error => {
            if (common.checkServerError(resp, error)) {
                common.log(userId, "/stock/cancelOrder err: ", error, ", req: ", JSON.stringify(transaction));
            }
            else {
                common.log(userId, "/stock/cancelOrder", 'transaction created successfully!');
            }
        });

        if (stock.type === 'Limit sell') {
            common.log(userId, "/stock/cancelOrder err: ", " stock type limit sell: ", JSON.stringify(stock));
            stock.price = stock.purchasePrice;
            stock.type = 'Market buy';
            stock.completed = true;

            await stock.save(error => {
                if (common.checkServerError(resp, error)) {
                    common.log(userId, "/stock/cancelOrder err: ", error, ", req: ", JSON.stringify(stock));
                }
                else {
                    common.log(userId, "/stock/cancelOrder", 'transaction created successfully!');
                }
            });
            resp.status(200).json({ success: true, message: "Limit sell order cancelled" });
        }
        else {
            await Stock.deleteOne({ _id: stockId }).then(function () {
                common.log(userId, "/stock/cancelOrder", 'order cancelled!');
                resp.status(200).json({ success: true, message: "Order cancelled" });
            }).catch(function (error) {
                common.log(userId, "/stock/cancelOrder", 'order not cancelled!');
                resp.status(500).json({ success: true, message: JSON.stringify(error) });
            });
        }
    } catch (error) {
        common.log("", "/stock/cancelOrder: err", error);
        resp.status(500).json({ success: false, message: "Order cancel exception" });
        return;
    }
});

router.post('/historical', async (req, resp) => {
    try {
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
    } catch (err) {
        resp.status(500).send();
    }
});

module.exports = router;
