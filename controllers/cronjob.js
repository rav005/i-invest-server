require('dotenv').config();
const db = require('../services/db');
const Stock = require('../models/stock');
const common = require('./common');
const api = require('./api');
const Transaction = require('../models/transaction');

const User = require('../models/user');

function isMarketOpen() {
    var days = [0, 1, 2, 3, 4, 5, 6];
    Date.prototype.getDayName = function () {
        return days[this.getDay()];
    };
    var now = new Date();

    var day = now.getDayName();

    var hours = now.getHours();
    var minute = now.getMinutes();

    if (day >= 1 && day <= 5 && hours >= 9 && hours <= 16 && minute >= 30) {
        return true;
    }
    else {
        return false;
    }
}


async function transaction() {
    try {
        //common.log("", "cronjob/transaction", "running a task: " + new Date());

        if (isMarketOpen()) {
            console.log("==========");

            //common.log("", "cronjob/transaction", "market open: " + new Date());

            db.connect();
            var stocks = await Stock.find({ completed: false, type: ['Limit buy', 'Limit sell'] });

            stocks.forEach(async x => {
                console.log(x);
                const symbol = x.symbol;
                const respData = await api.getStockCurrentRate(symbol);
                const currentStockPrice = respData.c;
                //console.log(currentStockPrice);

                const orderTotal = x.price * x.quantity
                if (('Limit buy' == x.type && currentStockPrice <= x.price) ||
                    ('Limit sell' == x.type && currentStockPrice >= x.price)) {
                    var transaction = new Transaction();
                    transaction.name = x.name;
                    transaction.stockSymbol = x.symbol;
                    transaction.quantity = x.quantity;
                    transaction.type = x.type;
                    transaction.amount = orderTotal;
                    transaction.accountId = x.accountId;

                    await transaction.save(error => {
                        if (common.checkServerError(resp, error)) {
                            common.log(userId, "cronjob/transaction err: ", error, ", req: ", JSON.stringify(transaction));
                        }
                        else {
                            common.log(userId, "cronjob/transaction", 'transaction created successfully!');
                        }
                    });

                    await Stock.updateOne({ _id: x._id }, { completed: true });
                }
            });
        }
    } catch (error) {
        common.log("", "cronjob/transaction", "unexpected error: " + new Date() + " " + JSON.stringify(error));
    }
}

module.exports = {
    transaction
};