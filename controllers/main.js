const express = require('express');
const router = express.Router();
const common = require('./common');
const api = require('../services/api');

router.get('/home', async (req, resp) => {
    common.log("/home", "req: " + JSON.stringify(req.body));

    const symbols = ['AAPL', 'MSFT', 'TSLA', "AMZN", "GOOG", "AMD", "GE", "F", "BA"];
    const respData = [];
    for (let symbol of symbols) {
        if (symbol) {
            const respData = await api.getDataForSymbol(symbol);
            //common.log("/home: ", respData);
            respData.append()
        }
    }
    resp.status(200).json(respData);
});

router.get('/search', async (req, resp) => {
    common.log("/search", "req: " + JSON.stringify(req.body));

    const symbol = req.body.symbol;
    if (symbol) {
        const respData = await api.getDataForSymbol(symbol);
        common.log("/search: ", respData);
        resp.status(200).json(respData);
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


module.exports = router;
