const mongoose = require('mongoose');

const TransactionSchema = mongoose.Schema({
    stockSymbol: {
        type: String,
        required: true
    },
    quantity: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['buy', 'sell'],
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Balance cannot be below 0']
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