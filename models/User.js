const mongoose = require('mongoose');
const { v4 } = require("uuid");
const UserSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: v4,
  },
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  picture: {
    type: String,
  },
});

module.exports = mongoose.model('User', UserSchema);
