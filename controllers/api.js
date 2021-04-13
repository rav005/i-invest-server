require('dotenv').config();
const finnhub = require('finnhub');
const axios = require('axios');
const common = require('../controllers/common');

// finn hub sandbox
function getAllSandboxAPIkey() {
    try {
        const keys = process.env.SANDBOX_API_KEY.split(',');
        //common.log("api keys: ", keys);
        return keys;
    } catch (err) {
        common.log("", "/api/getAllSandboxAPIkey", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

function getSandboxRandomApi() {
    try {
        const keys = getAllSandboxAPIkey();
        return keys[Math.floor(Math.random() * (keys.length - 1)) + 0];
    } catch (err) {
        common.log("", "/api/getSandboxRandomApi", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

function formSandboxApiUrl(restOfApiUrl) {
    try {
        return process.env.API_URL + restOfApiUrl + "&token=" + getSandboxRandomApi();
    } catch (err) {
        common.log("", "/api/formSandboxApiUrl", "unexpected error" + new Date()) + " " + JSON.stringify(error);
    }
}

// finn hub api
function getAllAPIkey() {
    try {
        const keys = process.env.API_KEY.split(',');
        //common.log("api keys: ", keys);
        return keys;
    } catch (err) {
        common.log("", "/api/getAllAPIkey", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

function getRandomApi() {
    try {
        const keys = getAllAPIkey();
        return keys[Math.floor(Math.random() * (keys.length - 1)) + 0];
    } catch (err) {
        common.log("", "/api/getRandomApi", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

function formApiUrl(restOfApiUrl) {
    try {
        return process.env.API_URL + restOfApiUrl + "&token=" + getRandomApi();
    } catch (err) {
        common.log("", "/api/formApiUrl", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

// market stack
function getAllHistoricalDataAPIkey() {
    try {
        const keys = process.env.HISTORICAL_API.split(',');
        //common.log("api keys: ", keys);
        return keys;
    } catch (err) {
        common.log("", "/api/getAllHistoricalDataAPIkey", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

function getRandomHistoricalDataApi() {
    try {
        const keys = getAllHistoricalDataAPIkey();
        return keys[Math.floor(Math.random() * (keys.length - 1)) + 0];
    } catch (err) {
        common.log("", "/api/getRandomHistoricalDataApi", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

function formHistoricalDataApiUrl(symbol) {
    try {
        return process.env.HISTORICAL_API_URL + "/eod?" + "&access_key=" + getRandomHistoricalDataApi() + "&symbols=" + symbol;
    } catch (err) {
        common.log("", "/api/formHistoricalDataApiUrl", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

function getSandboxApiObject() {
    try {
        const api_key = finnhub.ApiClient.instance.authentications['api_key'];
        const key = getSandboxRandomApi();
        //common.log(key);
        api_key.apiKey = key;
        return new finnhub.DefaultApi();
    } catch (err) {
        common.log("", "/api/getSandboxApiObject", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

async function getStockCurrentRate(stockSymbol) {
    try {
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
    } catch (err) {
        common.log("", "/api/getStockCurrentRate", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

async function getRateForWatchList(watchList) {
    try {
        if (!watchList) {
            return null;
        }
        const contents = await Promise.all(watchList.map(async (stock) => {
            return new Promise((resolve, reject) => {
                getSandboxApiObject().quote(stock.symbol, (error, data, response) => {
                    if (error) {
                        return reject(error);
                    }
                    var s = { name: stock.name, symbol: stock.symbol, currency: stock.currency, data: data };
                    return resolve(s);
                });
            })
        })).then(resp => {
            return resp;
        }).catch(err => {
            common.log("", "/api/getRateForWatchList: err -> ", err.message);
        });
        return contents;
    } catch (err) {
        common.log("", "/api/getRateForWatchList", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}
async function getCurrentPriceForAccountStocks(stocks) {
    common.log("", "/api/getCurrentPriceForAccountStocks:  ", JSON.stringify(stocks));
    try {
        if (!stocks) {
            return null;
        }
        const contents = await Promise.all(stocks.map(async (stock) => {
            return new Promise((resolve, reject) => {
                getSandboxApiObject().quote(stock.symbol, (error, data, response) => {
                    if (error) {
                        return reject(error);
                    }
                    var s = {
                        id: stock.id,
                        name: stock.name,
                        symbol: stock.symbol,
                        currency: stock.currency,
                        quantity: stock.quantity,
                        price: stock.price,
                        accountId: stock.accountId,
                        type: stock.type,
                        completed: stock.completed,
                        currentPrice: data.c
                    };
                    return resolve(s);
                });
            })
        })).then(resp => {
            return resp;
        }).catch(err => {
            common.log("", "/api/getCurrentPriceForAccountStocks: err -> ", err.message);
        });
        return contents;
    } catch (err) {
        common.log("", "/api/getCurrentPriceForAccountStocks", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

async function search(searchText) {
    try {
        common.log("", "/api/search: ", apiUrl);
        const apiUrl = formSandboxApiUrl("/search?q=" + searchText.toUpperCase());
        //common.log("", "getDataForSymbol: ", apiUrl);
        const responseData = await axios.get(apiUrl);
        //common.log("", "getDataForSymbol: ", responseData.data);

        return responseData.data;
    } catch (error) {
        common.log("", "/api/search", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

async function marketNews() {
    try {
        const apiUrl = formApiUrl("/news?category=general");
        common.log("", "/api/marketNews: ", apiUrl);
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("", "/api/marketNews", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

async function companyNews(symbol, fromDate, toDate) {
    try {
        if (!symbol || !fromDate || !toDate) {
            return;
        }
        const apiUrl = formApiUrl("/company-news?symbol=" + symbol + "&from=" + fromDate + "&to=" + toDate);
        common.log("", "/api/companyNews: ", apiUrl);
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("", "/api/companyNews", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

async function recommendationTrends(symbol) {
    try {
        if (!symbol) {
            return;
        }
        const apiUrl = formApiUrl("/stock/recommendation?symbol=" + symbol);
        common.log("", "/api/recommendationTrends: ", apiUrl);
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("", "/api/recommendationTrends", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

async function basicFinancials(symbol) {
    try {

        if (!symbol) {
            return;
        }
        const apiUrl = formApiUrl("/stock/metric?symbol=" + symbol + "&metric=all");
        common.log("", "/api/basicFinancials: ", apiUrl);
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("", "/api/basicFinancials", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

async function secFilings(symbol) {
    try {
        if (!symbol) {
            return;
        }
        const apiUrl = formSandboxApiUrl("/stock/filings?symbol=" + symbol);
        common.log("", "/api/secFilings: ", apiUrl);
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("", "/api/secFilings", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

async function historicalData(symbol) {
    try {
        if (!symbol) {
            return;
        }
        const apiUrl = formHistoricalDataApiUrl(symbol);
        common.log("", "/api/historicalData: ", apiUrl);
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("", "/api/historicalData", "unexpected error" + new Date() + " " + JSON.stringify(error));
    }
}

async function forex(from, to) {
    if (from && to) {
        try {
            apiUrl = "https://api.ratesapi.io/api/latest?base=" + from.toUpperCase() + "&symbols=" + to.toUpperCase();
            const responseData = await axios.get(apiUrl);
            if (responseData.status == 200) {
                const rate = responseData.data.rates[to];
                common.log("", "/api/forex", "rate:" + JSON.stringify(responseData.data));
                return rate;
            }
            else {
                common.log("", "/api/forex", "api response err:" + JSON.stringify(responseData.data));
                return null;
            }
        } catch (err) {
            common.log("", "/api/forex", "err:" + err);
            return null;
        }
    }
    else {
        common.log("", "/api/forex", "from/to required");
        return null;
    }
}

async function getForex() {
    try {
        const USD_TO_CAD = await api.forex("USD", "CAD");
        const USD_TO_CAD_2_decimal = Math.round(USD_TO_CAD * 100) / 100
        const CAD_TO_USD = await api.forex("CAD", "USD");
        const CAD_TO_USD_2_decimal = Math.round(CAD_TO_USD * 100) / 100
        var json = { "USD_CAD": USD_TO_CAD_2_decimal, "CAD_USD": CAD_TO_USD_2_decimal };
        return json;
    } catch (err) {
        var json = { success: false, "message": "common error" };
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
    historicalData,
    forex,
    getCurrentPriceForAccountStocks,
    getForex
};