// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        api_key      : String,
        email        : String,
        password     : String,
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

});
//Schema for each particular sensor mapped with label



// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
