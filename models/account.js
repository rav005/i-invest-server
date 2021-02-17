const mongoose = require('mongoose');

const AccountSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    required: true,
    min: [0, 'Balance cannot be below 0']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
},
  {
    collection: 'Accounts'
  });

module.exports = mongoose.model('Account', AccountSchema);