const express = require('express');
const router = express.Router();
const common = require('./common');
const api = require('./api');
const axios = require('axios');
var path = require('path');
const e = require('express');

// refer to https://finnhub.io/docs/api/symbol-search
router.post('/searchText', async (req, resp) => {
    try {
        common.log("", "/searchText", "req: " + JSON.stringify(req.body));

        const searchText = req.body.searchText;
        if (searchText) {
            const respData = await api.search(searchText);
            common.log("/search: ", respData);
            resp.status(200).json(respData);
        }
        else {
            resp.status(400).send();
        }
    } catch (err) {
        resp.status(500).send();
    }
});

router.get('/marketNews', async (req, resp) => {
    try {
        common.log("", "/main/marketNews", "req: no params needed");

        const respData = await api.marketNews();
        if (respData) {
            common.log("", "/main/marketNews: ", respData.length);
            resp.status(200).json(respData);
        }
        else {
            common.log("", "/main/marketNews: err", respData);
            resp.status(400).send();
        }
    } catch (err) {
        resp.status(500).send();
    }
});

router.get('/getStocksfile', async (req, resp) => {
    try {
        common.log("", "/getStocksfile", "req: no param needed");

        var options = {
            root: path.join(__dirname + "/../resources")
        };

        var fileName = 'stocks.json';
        resp.status(200).sendFile(fileName, options, function (err) {
            if (err) {
                common.log("", "/getStocksfile", err);
                //resp.status(500).send();
            } else {
                common.log("", "/getStocksfile", "resources/stocks.json sent");
                //resp.status(200).send();
            }
        });
    } catch (err) {
        resp.status(500).send();
    }
})

router.get('/forex', async (req, resp) => {
    try {

        common.log("", "/main/forex", "req: " + JSON.stringify(req.body));
        const from = req.body.from;
        const to = req.body.to;
        if (from && to) {

            try {
                apiUrl = "https://api.ratesapi.io/api/latest?base=" + from.toUpperCase() + "&symbols=" + to.toUpperCase();
                const responseData = await axios.get(apiUrl);
                if (responseData.status == 200) {
                    const rate = responseData.data.rates[to];
                    common.log("", "/main/forex", "rate:" + JSON.stringify(responseData.data));
                    resp.status(200).json({ "rate": rate });
                }
                else {
                    resp.status(400).send();
                }
            } catch (err) {
                common.log("", "/main/forex", "err:" + err);
                resp.status(400).send();
            }
        }
        else {
            resp.status(400).json({ "message": "from currency and to currency request params required" });
        }
    } catch (err) {
        resp.status(500).send();
    }
});

module.exports = router;
