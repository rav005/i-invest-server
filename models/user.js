const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    lowercase: true,
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  securityQuestions: [{
    question: {
      type: String,
      required: true
    },
    answer: {
      type: String,
      required: true
    }
  }],
  accounts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  }]
});

module.exports = mongoose.model('User', UserSchema);