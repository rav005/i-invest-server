require('dotenv').config();
const finnhub = require('finnhub');
const axios = require('axios');
const common = require('../controllers/common');

// finn hub sandbox
function getAllSandboxAPIkey() {
    const keys = process.env.SANDBOX_API_KEY.split(',');
    //common.log("api keys: ", keys);
    return keys;
}

function getSandboxRandomApi() {
    const keys = getAllSandboxAPIkey();
    return keys[Math.floor(Math.random() * (keys.length - 1)) + 0];
}

function formSandboxApiUrl(restOfApiUrl) {
    return process.env.API_URL + restOfApiUrl + "&token=" + getSandboxRandomApi();
}

// finn hub api
function getAllAPIkey() {
    const keys = process.env.API_KEY.split(',');
    //common.log("api keys: ", keys);
    return keys;
}

function getRandomApi() {
    const keys = getAllAPIkey();
    return keys[Math.floor(Math.random() * (keys.length - 1)) + 0];
}

function formApiUrl(restOfApiUrl) {
    return process.env.API_URL + restOfApiUrl + "&token=" + getRandomApi();
}

// market stack
function getAllHistoricalDataAPIkey() {
    const keys = process.env.HISTORICAL_API.split(',');
    //common.log("api keys: ", keys);
    return keys;
}

function getRandomHistoricalDataApi() {
    const keys = getAllHistoricalDataAPIkey();
    return keys[Math.floor(Math.random() * (keys.length - 1)) + 0];
}

function formHistoricalDataApiUrl(symbol) {
    return process.env.HISTORICAL_API_URL + "/eod?" + "&access_key=" + getRandomHistoricalDataApi() + "&symbols=" + symbol;
}

function getSandboxApiObject() {
    const api_key = finnhub.ApiClient.instance.authentications['api_key'];
    const key = getSandboxRandomApi();
    //common.log(key);
    api_key.apiKey = key;
    return new finnhub.DefaultApi();
}

async function getStockCurrentRate(stockSymbol) {
    common.log("", "/api/getStockCurrentRate", "stockSymbol:" + stockSymbol);
    if (!stockSymbol) {
        return null;
    }
    const data = await new Promise((resolve, reject) => {
        getSandboxApiObject().quote(stockSymbol, (error, data, response) => {
            if (error) {
                return reject(error);
            }
            return resolve(data);
        });
    }).then(resp => {
        return resp;
    }).catch(err => {
        common.log("", "/api/getStockCurrentRate: err -> ", err);
    });
    return common.isValidQuote(data) ? data : null;
}

async function getRateForWatchList(watchList) {
    if (!watchList) {
        return null;
    }
    const contents = await Promise.all(watchList.map(async (stock) => {
        return new Promise((resolve, reject) => {
            getSandboxApiObject().quote(stock.symbol, (error, data, response) => {
                if (error) {
                    return reject(error);
                }
                var s = { name: stock.name, symbol: stock.symbol, data: data };
                return resolve(s);
            });
        })
    })).then(resp => {
        return resp;
    }).catch(err => {
        common.log("", "/api/getRateForWatchList: err -> ", err.message);
    });
    return contents;
}

async function search(searchText) {
    common.log("", "/api/search: ", apiUrl);
    const apiUrl = formSandboxApiUrl("/search?q=" + searchText.toUpperCase());
    //common.log("", "getDataForSymbol: ", apiUrl);
    try {
        const responseData = await axios.get(apiUrl);
        //common.log("", "getDataForSymbol: ", responseData.data);

        return responseData.data;
    } catch (error) {
        common.log("", "/api/serach/", error);
    }
}

async function marketNews() {
    const apiUrl = formApiUrl("/news?category=general");
    common.log("", "/api/marketNews: ", apiUrl);
    try {
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("", "/api/marketNews/", error);
    }
}

async function companyNews(symbol, fromDate, toDate) {
    if (!symbol || !fromDate || !toDate) {
        return;
    }
    const apiUrl = formApiUrl("/company-news?symbol=" + symbol + "&from=" + fromDate + "&to=" + toDate);
    common.log("", "/api/companyNews: ", apiUrl);
    try {
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("", "/api/companyNews/", error);
    }
}

async function recommendationTrends(symbol) {
    if (!symbol) {
        return;
    }
    const apiUrl = formApiUrl("/stock/recommendation?symbol=" + symbol);
    common.log("", "/api/recommendationTrends: ", apiUrl);
    try {
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("", "/api/recommendationTrends/", error);
    }
}

async function basicFinancials(symbol) {

    if (!symbol) {
        return;
    }
    const apiUrl = formApiUrl("/stock/metric?symbol=" + symbol + "&metric=all");
    common.log("", "/api/basicFinancials: ", apiUrl);
    try {
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("", "/api/basicFinancials/", error);
    }
}

async function secFilings(symbol) {
    if (!symbol) {
        return;
    }
    const apiUrl = formSandboxApiUrl("/stock/filings?symbol=" + symbol);
    common.log("", "/api/secFilings: ", apiUrl);
    try {
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("", "/api/secFilings/", error);
    }
}

async function historicalData(symbol) {
    if (!symbol) {
        return;
    }
    const apiUrl = formHistoricalDataApiUrl(symbol);
    common.log("", "/api/historicalData: ", apiUrl);
    try {
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("", "/api/historicalData: ", error);
    }
}

module.exports = {
    getStockCurrentRate,
    getRateForWatchList,
    search,
    marketNews,
    companyNews,
    recommendationTrends,
    basicFinancials,
    secFilings,
    historicalData
};