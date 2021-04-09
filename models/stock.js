const mongoose = require('mongoose');

const StockSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    symbol: {
        type: String,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [0, 'quantity cannot be below 0']
    },
    buyPrice: {
        // price per stock
        type: Number,
        required: true,
        min: [0, 'Balance cannot be below 0']
    },
    accountId: {
        type: String,
        required: true
    },
    completed: {
        type: Boolean,
        required: true
    }
},
    {
        collection: 'Stocks'
    });

module.exports = mongoose.model('Stock', StockSchema);