// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var authSchema = mongoose.Schema({

    local            : {
        api_key      : String,
        email        : String,
        password     : String,
        url          : String,
        state        : Boolean
    },
    facebook         : {
        api_key      : String,
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    twitter          : {
        api_key      : String,
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        api_key      : String,
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }

},
{
  collection:'authSchema',
  safe:true
});
//Schema for each particular sensor mapped with label



// methods ======================
// generating a hash
authSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
authSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('authSchema', authSchema);
