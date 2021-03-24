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
    getApiObject().quote(stockSymbol).then(res => {
        console.log('getStockCurrentRate: res => ', err);
    }).catch(err => {
        console.log('getStockCurrentRate: err =>', err);
    });
    // await getApiObject().quote(stockSymbol, (error, data, response) => {
    //     console.log("getStockCurrentRate: ", data);
    //     return data;
    // });
}

async function getRateForWatchList(watchList) {
    if (!watchList) {
        return;
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