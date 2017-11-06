var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var sensorData = require('./sensorData')
var notification = require('./notification')

var sensorDataSchema = mongoose.model('SensorData').schema;
var notification = mongoose.model('notification').schema;
//Schema for sensor
var sensorSchema = mongoose.Schema({
     device_name : String,
     device_id   : { type: String, unique: true },
     description : String,
     last_access : {type: Date, default: Date.now},
     device_type : String,
     timer       : {type:String,default:"false"},  // true if timer is on for the device
     timerDate   : String,     // date set by the user while using the timer
     pauseDate   : Date,
     intensity   : {type:String,default:"0"},   // Intensity of the device,initial set to zero
     state       : {type: String, default: "false"},  // state of the device
     project_id  : {type:String,default:""},
     activity    : [notification],      // activity : array of notification schema
     values : [sensorDataSchema],        // Array of sensorDataSchema
     energy: []
},
{
  collection:'sensor',
  safe:true
});

module.exports = mongoose.model('Sensor', sensorSchema);
