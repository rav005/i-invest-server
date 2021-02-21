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


module.exports = router;
