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
    await getApiObject().quote(stockSymbol, (error, data, response) => {
        console.log("getStockCurrentRate: ", data);
        return data;
    });
}

async function getRateForWatchList(watchList) {
    if (!watchList) {
        return;
    }

    watchList.forEach(stock => {
        console.log(await getStockCurrentRate(stock.symbol));
    });

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