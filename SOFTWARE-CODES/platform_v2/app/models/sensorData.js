var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');



var sensorData = mongoose.Schema({
  time : {type : Date, default: Date.now},
  value : Number
},
{
  collection:'sensorData',
  safe:true
});

module.exports = mongoose.model('SensorData', sensorData);
