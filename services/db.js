require('dotenv').config();
const mongoose = require('mongoose');
/**
* Set to Node.js native promises
* Per https://mongoosejs.com/docs/promises.html
*/
mongoose.Promise = global.Promise;

// eslint-disable-next-line max-len
const mongoUri = process.env.DB_URL

function connect() {
    mongoose.set('debug', true);
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);
    return mongoose.connect(mongoUri, { useUnifiedTopology: true, useNewUrlParser: true });
}

function disconnect() {
    return mongoose.disconnect();
}

module.exports = {
    connect,
    disconnect,
    mongoose
};