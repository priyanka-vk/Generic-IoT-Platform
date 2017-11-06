var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');



var energy = mongoose.Schema({
  index :Number,
  energy :{type:String , default:"0"}
},
{
  collection:'energy',
  safe:true
});

module.exports = mongoose.model('energy', energy);
