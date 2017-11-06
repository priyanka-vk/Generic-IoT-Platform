// config/passport.js

// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
var nodemailer = require('nodemailer');

// load up the user model
var User = require('../app/models/user');
var authSchema = require('../app/models/authSchema');
var userDetails = require('../app/models/userDetails');

// expose this function to our app using module.exports
module.exports = function(passport) {

  // =========================================================================
  // passport session setup ==================================================
  // =========================================================================
  // required for persistent login sessions
  // passport needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  // =========================================================================
  // LOCAL SIGNUP ============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use('local-signup', new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

      // find a user whose email is the same as the forms email
      // we are checking to see if the user trying to login already exists
      User.findOne({
        'local.email': email
      }, function(err, user) {
        // if there are any errors, return the error
        if (err)
          return done(err);

        // check to see if theres already a user with that email
        if (user) {
          return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
        } else {
          authSchema.findOne({
            "local.email": email
          }, function(err, user) {
            if (user) {
              return done(null, false, req.flash('signupMessage', 'Email already exists but not verified'));
            } else {
              var newUser = new authSchema();


              // set the user's local credentials
              newUser.local.email = email;
              newUser.local.api_key = newUser.generateHash(email + password);
              newUser.local.password = newUser.generateHash(password); // use the generateHash function in our user model
              newUser.local.url = newUser.generateHash(newUser.local.api_key + email + password);
              newUser.local.state = false;
              console.log("here");


              var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'iot.fossee@gmail.com',
                  pass: 'qwerty123456789'
                }
              });

              var text = 'Welcome to Generic IoT Platform!\nTo complete your sign up, please verify your email: \n Click on this link: http://192.168.43.198:3000/verify?id=' + newUser.local.url;
              var mailOptions = {
                from: 'iot.fossee@gmail.com',
                to: email,
                subject: 'Account Verification',
                text: text
              };

              transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });


              // save the user
              newUser.save(function(err) {
                if (err)
                  throw err;
                return done(null, newUser);
              });
              /*userDetail.save(function(err) {
                  if (err)
                      throw err;
                  return done(null, userDetail);
              });*/
            }
          })

          // if there is no user with that email
          // create the user

        }

      });

    }));

  // =========================================================================
  // LOCAL LOGIN =============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
  // by default, if there was no name, it would just be called 'local'

  passport.use('local-login', new LocalStrategy({
      // by default, local strategy uses username and password, we will override with email
      usernameField: 'email',
      passwordField: 'password',
      passReqToCallback: true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

      // find a user whose email is the same as the forms email
      // we are checking to see if the user trying to login already exists
      User.findOne({
        'local.email': email
      }, function(err, user) {
        // if there are any errors, return the error before anything else
        if (err)
          return done(err);

        // if no user is found, return the message
        if (!user) {
          authSchema.findOne({
            'local.email': email
          }, function(err, user) {
            if (err)
              return done(err);
            if (!user) {
              return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
            } else {
              return done(null, false, req.flash('loginMessage', 'Email not verified!')); // req.flash is the way to set flashdata using connect-flash

            }
          })
          //

        }

        // if the user is found but the password is wrong
        else if (!user.validPassword(password))
          return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

        // all is well, return successful user
        else {
          return done(null, user);
        }
      });

    }));

};
