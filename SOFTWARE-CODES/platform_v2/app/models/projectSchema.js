var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// Schema for each project
var projectData = mongoose.Schema({
  project_name :String,
  project_id : String,
  description: String,
  device_id: Array   // Array of device_id of all devices added under that project

},
{
  collection:'projectData',
  safe:true
});

module.exports = mongoose.model('projectData', projectData);
