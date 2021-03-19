require('dotenv').config();
const finnhub = require('finnhub');

function getAllAPIkey() {
    const keys = process.env.API_KEY.split(',');
    //console.log("api keys: ", keys);
    return keys;
}

function getRandomApi() {
    const keys = getAllAPIkey();
    return keys[Math.floor(Math.random() * keys.length) + 1];
}

function getApiObject() {
    const api_key = finnhub.ApiClient.instance.authentications['api_key'];
    api_key.apiKey = getRandomApi();
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

    Promise.all(watchList.map(async (stock) => {
        return new Promise((resolve, reject) => {
            getApiObject().quote(stock.symbol, (error, data, response) => {
                if (error) {
                    return reject(error);
                }
                var s = {name: stock.name, symbol: stock.symbol, data: data};
                return resolve(s);
            });
        })
    })).then(resp => {
        return resp;
    }).catch(err => {
        console.log('err => ', err.message);
    });

    // watchList.forEach(stock => {
    //     console.log( getStockCurrentRate(stock.symbol));
    // });

    // await Promise.all(watchList.map(async (stock) => {

    //     await getApiObject().quote(stock.symbol, async (error, data, response) => {
    //         console.log("getStockCurrentRate: ", data);
    //         //return data;
    //         stock.quote = data;
    //     });

    //     //const contents = await fs.readFile(file, 'utf8')
    //     //console.log(contents)
    // }));



    return watchList;
}

module.exports = {
    getStockCurrentRate,
    getRateForWatchList
};