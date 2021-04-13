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

            var forex = common.getForex();

            stocks.forEach(async x => {
                console.log(x);
                const symbol = x.symbol;
                const respData = await api.getStockCurrentRate(symbol);
                const currentStockPrice = respData.c;
                //console.log(currentStockPrice);

                if (('Limit buy' == x.type && currentStockPrice <= x.price) ||
                    ('Limit sell' == x.type && currentStockPrice >= x.price)) {

                    const account = await Account.findOne({ _id: stock.accountId });

                    var exchangeRate = 1;
                    if (stock.currency == 'USD' && account?.currency != 'USD') {
                        exchangeRate = forex.CAD_USD;
                    } else if (stock.currency == 'CAD' && account?.currency != 'CAD') {
                        exchangeRate = forex.USD_CAD;
                    } else {
                        exchangeRate = exchangeRate;
                    }

                    const orderTotal = (x.price * x.quantity) * exchangeRate;

                    var orderFail = false;
                    if ((account.balance - orderTotal) < 0) {
                        orderFail = true;

                    }

                    var transaction = new Transaction();
                    transaction.name = x.name;
                    transaction.stockSymbol = x.symbol;
                    transaction.quantity = x.quantity;
                    if (orderFail) {
                        transaction.type = 'Limit buy failed(insufficient funds)';
                    }
                    else {
                        transaction.type = x.type;
                    }
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

                    if (orderFail) {
                        Stock.deleteOne({ _id: x._id }).then(function () {
                            common.log(userId, "cronjob/transaction", 'stock order failed:', x._id);
                        }).catch(function (error) {
                            common.log(userId, "cronjob/transaction", 'error deleting failed stock order:', x._id);
                        });
                    }
                    else {
                        await Stock.updateOne({ _id: x._id }, { completed: true });
                        const newBalance = account.balance;
                        if ('Limit buy' == x.type) {
                            newBalance = account.balance - orderTotal;
                        }
                        else if ('Limit sell' == x.type) {
                            newBalance = account.balance + orderTotal;
                        }
                        await Account.updateOne({ _id: accountId }, { balance: newBalance });
                    }
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