require('dotenv').config();
const finnhub = require('finnhub');
const axios = require('axios');
const common = require('../controllers/common');

function getAllAPIkey() {
    const keys = process.env.API_KEY.split(',');
    //console.log("api keys: ", keys);
    return keys;
}

function getRandomApi() {
    const keys = getAllAPIkey();
    return keys[Math.floor(Math.random() * (keys.length - 1)) + 0];
}

function getApiObject() {
    const api_key = finnhub.ApiClient.instance.authentications['api_key'];
    const key = getRandomApi();
    //console.log(key);
    api_key.apiKey = key;
    return new finnhub.DefaultApi();
}

async function getStockCurrentRate(stockSymbol) {
    common.log("/api/getStockCurrentRate", "stockSymbol:" + stockSymbol);
    if (!stockSymbol) {
        return null;
    }
    const data = await new Promise((resolve, reject) => {
        getApiObject().quote(stockSymbol, (error, data, response) => {
            if (error) {
                return reject(error);
            }
            return resolve(data);
        });
    }).then(resp => {
        return resp;
    }).catch(err => {
        common.log("/api/getRateForWatchList: err -> ", err.message);
    });
    return common.isValidQuote(data) ? data : null;
}

async function getRateForWatchList(watchList) {
    if (!watchList) {
        return null;
    }
    const contents = await Promise.all(watchList.map(async (stock) => {
        return new Promise((resolve, reject) => {
            getApiObject().quote(stock.symbol, (error, data, response) => {
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
        common.log("/api/getRateForWatchList: err -> ", err.message);
    });
    return contents;
}


function formApiUrl(restOfApiUrl) {
    return process.env.API_URL + restOfApiUrl + "&token=" + getRandomApi();
}

async function search(searchText) {
    common.log("/api/search: ", apiUrl);
    const apiUrl = formApiUrl("/search?q=" + searchText.toUpperCase());
    //common.log("getDataForSymbol: ", apiUrl);
    try {
        const responseData = await axios.get(apiUrl);
        //common.log("getDataForSymbol: ", responseData.data);

        return responseData.data;
    } catch (error) {
        common.log("/api/serach/", error);
    }
}

async function marketNews() {
    const apiUrl = formApiUrl("/news?category=general");
    common.log("/api/marketNews: ", apiUrl);
    try {
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("/api/marketNews/", error);
    }
}

async function companyNews(symbol, fromDate, toDate) {
    if (!symbol || !fromDate || !toDate) {
        return;
    }
    const apiUrl = formApiUrl("/company-news?symbol=" + symbol + "&from=" + fromDate + "&to=" + toDate);
    common.log("/api/companyNews: ", apiUrl);
    try {
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("/api/companyNews/", error);
    }
}

async function majorPressReleases(symbol, fromDate, toDate) {
    if (!symbol || !fromDate || !toDate) {
        return;
    }
    const apiUrl = formApiUrl("/press-releases?symbol=" + symbol + "&from=" + fromDate + "&to=" + toDate);
    common.log("/api/majorPressReleases: ", apiUrl);
    try {
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("/api/majorPressReleases/", error);
    }
}

async function recommendationTrends(symbol) {
    if (!symbol) {
        return;
    }
    const apiUrl = formApiUrl("/stock/recommendation?symbol=" + symbol);
    common.log("/api/recommendationTrends: ", apiUrl);
    try {
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("/api/recommendationTrends/", error);
    }
}

async function basicFinancials(symbol) {

    if (!symbol) {
        return;
    }
    const apiUrl = formApiUrl("/stock/metric?symbol=" + symbol + "&metric=all");
    common.log("/api/basicFinancials: ", apiUrl);
    try {
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("/api/basicFinancials/", error);
    }
}

async function secFilings(symbol) {
    if (!symbol) {
        return;
    }
    const apiUrl = formApiUrl("/stock/filings?symbol=" + symbol);
    common.log("/api/secFilings: ", apiUrl);
    try {
        const responseData = await axios.get(apiUrl);
        return responseData.data;
    } catch (error) {
        common.log("/api/secFilings/", error);
    }
}

module.exports = {
    getStockCurrentRate,
    getRateForWatchList,
    search,
    marketNews,
    companyNews,
    majorPressReleases,
    recommendationTrends,
    basicFinancials,
    secFilings
};