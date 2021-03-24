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

async function search(searchText) {
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

function formApiUrl(restOfApiUrl) {
    return process.env.API_URL + restOfApiUrl + "&token=" + getRandomApi();
}


module.exports = {
    getStockCurrentRate,
    getRateForWatchList,
    search
};