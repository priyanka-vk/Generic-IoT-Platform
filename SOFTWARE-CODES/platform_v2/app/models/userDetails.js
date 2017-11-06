var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userDetailsSchema = mongoose.Schema({

  api_key : {type:String, unique:true},   // unique for each user
  email   : String,
  devices : Array,                        // All the devices added by the user
  projects : Array                        // All the projects added by the user
},
{
  collection:'userDetails',
  safe:true
});


module.exports = mongoose.model('userDetails', userDetailsSchema);
