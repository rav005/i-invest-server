const axios = require('axios');
const common = require('../controllers/common');

async function getDataForSymbol(symbol) {
    const apiUrl = formApiUrl("/quote?symbol=" + symbol.toUpperCase());
    //common.log("getDataForSymbol: ", apiUrl);
    try {
        const responseData = await axios.get(apiUrl);
        //common.log("getDataForSymbol: ", responseData.data);

        return responseData.data;
    } catch (error) {
        console.error(error);
    }
}

function formApiUrl(restOfApiUrl) {
    return process.env.API_URL + restOfApiUrl + "&token=" + process.env.API_KEY;
}

module.exports = {
    getDataForSymbol,
};