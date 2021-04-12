const express = require('express');
const router = express.Router();
const common = require('./common');
const api = require('./api');
var path = require('path');
const e = require('express');

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
        const USD_TO_CAD = await api.forex("USD", "CAD");
        const USD_TO_CAD_2_decimal = Math.round(USD_TO_CAD * 100) / 100
        common.log("", "/main/forex", "USD_TO_CAD_2_decimal:" + USD_TO_CAD_2_decimal);
        const CAD_TO_USD = await api.forex("CAD", "USD");
        const CAD_TO_USD_2_decimal = Math.round(CAD_TO_USD * 100) / 100
        common.log("", "/main/forex", "rate:" + CAD_TO_USD_2_decimal);
        resp.status(200).json({ "USD_CAD": USD_TO_CAD_2_decimal, "CAD_USD": CAD_TO_USD_2_decimal });
    } catch (err) {
        common.log("", "/main/forex", "err:" + err);
        resp.status(500).send();
    }
});

module.exports = router;
