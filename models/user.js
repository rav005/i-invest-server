const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const SALT_WORK_FACTOR = 10;

const watchListType = new mongoose.Schema({
  name: String,
  symbol: {
    type: String,
    uppercase: true
  }
});

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
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  watchList: [watchListType]
},
  {
    collection: 'Users'
  }
);

UserSchema.pre('save', function (next) {
  var user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) return next();
  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) return next(err);
    // hash the password using our new salt
    bcrypt.hash(user.password, salt, function (err, hash) {
      if (err) return next(err);
      // override the cleartext password with the hashed one
      user.password = hash;
      //next();
      bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) return next(err);
        // hash the password using our new salt
        bcrypt.hash(user.answer, salt, function (err, hash) {
          if (err) return next(err);
          // override the cleartext password with the hashed one
          user.answer = hash;
          next();
        });
      });

    });
  });
});

UserSchema.methods.comparePassword = function (candidatePassword,  cb) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

UserSchema.methods.compareAnswer = function (answer,  cb) {
  bcrypt.compare(answer, this.answer, function (err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

UserSchema.statics.getHash = async function (password) {
  if (password) {
    var hashPassword = async function () {
      //console.log(bcrypt.hash(password, 10));
      var hashPwd = await bcrypt.hash(password, 10);
      //console.log(hashPwd);
      return hashPwd;
    }
    return hashPassword();
  }
  else {
    return null;
  }
}

// const User = mongoose.model('User', UserSchema);

// module.exports = {
//   getHash,
//   User
// };

module.exports = mongoose.model('User', UserSchema);