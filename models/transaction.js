const mongoose = require('mongoose');

const TransactionSchema = mongoose.Schema({
    name: {
        type: String
    },
    stockSymbol: {
        type: String
    },
    quantity: {
        type: Number
    },
    type: {
        type: String,
        enum: ['Market buy', 'Market sell', 'Limit buy', 'Limit sell', 'Initial deposit', 'Deposit', 'Withdraw', 'Canceled'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Balance cannot be below 0']
    },
    transactionDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    accountId: {
        type: String,
        required: true
    }
},
    {
        collection: 'Transactions'
    });

module.exports = mongoose.model('Transaction', TransactionSchema);