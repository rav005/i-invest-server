const express = require('express');
const router = express.Router();
const common = require('./common');
const api = require('./api');
var path = require('path');

// refer to https://finnhub.io/docs/api/symbol-search
router.post('/searchText', async (req, resp) => {
    common.log("/searchText", "req: " + JSON.stringify(req.body));

    const searchText = req.body.searchText;
    if (searchText) {
        const respData = await api.search(searchText);
        common.log("/search: ", respData);
        resp.status(200).json(respData);
    }
    else {
        resp.status(400).send();
    }
});

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

router.get('/marketNews', async (req, resp) => {
    common.log("/main/marketNews", "req: no params needed");

    const respData = await api.marketNews();
    if (respData) {
        common.log("/main/marketNews: ", respData);
        resp.status(200).json(respData);
    }
    else {
        common.log("/main/marketNews: err", respData);
        resp.status(400).send();
    }
});

router.get('/getStocksfile', async (req, resp) => {
    common.log("/getStocksfile", "req: no param needed");

    var options = {
        root: path.join(__dirname + "/../resources")
    };

    var fileName = 'stocks.json';
    resp.sendFile(fileName, options, function (err) {
        if (err) {
            common.log("/getStocksfile", err);
            resp.status(500).send();
        } else {
            common.log("/getStocksfile", "resources/stocks.json sent");
            resp.status(200).send();
        }
    });
})

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

router.get('/getWatchlist', async (req, resp) => {
    common.log("/getWatchlist", "req: " + JSON.stringify(req.body));

    const userId = common.extractUserIdFromResponseLocals(resp);
    if (userId) {
        var user = await common.findUserById(userId);
        if (user) {
            common.log("/getWatchlist", "watchList: " + user.watchList);
            resp.status(200).json({ "watchList": user.watchList });
        }
        else {
            resp.status(404).json({ "message": "invalid user" });
        }
    }
    else {
        common.log("/getWatchlist", "error");
        resp.status(400).json({ "message": "invalid userid" });
    }
});


module.exports = router;
