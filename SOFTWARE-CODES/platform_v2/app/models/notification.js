var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
// Schema for notifications


var notification = mongoose.Schema({
  time : {type : Date, default: Date.now},
  message: String
});

module.exports = mongoose.model('notification',notification);
