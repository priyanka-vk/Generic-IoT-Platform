// app/routes.js

//For Accessing MongoDB Database
var mongoose = require('mongoose');

//MongoDB Schemas
var Sensor = require('../app/models/sensor');
var ProjectData = require('../app/models/projectSchema');
var userDetails = require('../app/models/userDetails');
var authSchema = require('../app/models/authSchema');
var User = require('../app/models/user');

function nocache(req, res, next) {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}



module.exports = function(app, passport) {

  // =====================================
  // HOME PAGE (with login links) ========
  // =====================================
  app.get('/',nocache,function(req, res) {
    auth = 0;
    res.render('index.ejs'); // load the index.ejs file
  });
  app.get('/nodered',isLoggedIn,function(req, res) {
    
    res.render('nodered.ejs'); // load the index.ejs file
  });
  // =====================================
  // LOGIN ===============================
  // =====================================
  // show the login form
  app.get('/login', function(req, res) {
    auth = 0;

    // render the page and pass in any flash data if it exists
    res.render('login.ejs', {
      message: req.flash('loginMessage')
    });
  });


  // =====================================
  // VISUAL ===============================
  // =====================================
  // show the device details, charts etc.
  app.post('/visual',isLoggedIn, function(req, res) {
    Sensor.findOne({
      device_id: req.body.device_id
    }, function(err, data) {
      res.render('visual.ejs', {
        user: req.user,
        device_id: req.body.device_id,
        device_name: req.body.device_name,
        device_type: req.body.device_type,
        description: req.body.description,
        state: data.state,
        timer: data.timer,
        timerDate: data.timerDate,
        activity: data.activity,
        intensity: data.intensity,
        flag: 0
      });
    })

  });


  // =====================================
  // PROJECT DETAILS ===============================
  // =====================================
  // show the devices under the given project
  app.post('/projectDetails',isLoggedIn, function(req, res) {
    console.log("post");
    var user = req.user;
    var devices = [];
    var deviceID = [];
    ProjectData.findOne({
        "project_id": req.body.project_id
      },
      function(err, project) {
        deviceID = project.device_id; //device id is array of device ids in the project
        console.log("device",deviceID);
        var ctr = 0;
        if (deviceID.length != 0) {
          console.log("yes");
          deviceID.forEach(function(device_id) {
            Sensor.findOne({
              "device_id": device_id
            }, function(err, de) {
              if (err)
                console.log(err);
              else {
                devices.push({
                  "device_id": de.device_id,
                  "device_type": de.device_type,
                  "device_name": de.device_name,
                  "description": de.description,
                  "last_access": de.last_access
                });
                ctr++;
                if (ctr == deviceID.length) {
                  //sort device based on device name
                  devices.sort(function(a, b) {
                    var nameA = a.device_name.toUpperCase(); // ignore upper and lowercase
                    var nameB = b.device_name.toUpperCase(); // ignore upper and lowercase
                    if (nameA < nameB) {
                      return -1;
                    }
                    if (nameA > nameB) {
                      return 1;
                    }
                    return 0;
                  });
                  res.render('projectDetails.ejs', {
                    user: user,
                    project_id: req.body.project_id,
                    project_name: req.body.project_name,
                    devices: devices
                  });
                }
              }
            });

          });
        } else {

          // if there are no devices in the project, no need to query database for device details

          res.render('projectDetails.ejs', {
            user: user,
            project_id: req.body.project_id,
            project_name: req.body.project_name,
            devices: devices
          });

        }
        console.log(devices);
      }
    );

  });

  // =====================================
  // TIMER OFF ===============================
  // =====================================
  // timer is off, no action on device
  app.get('/timerOff',isLoggedIn, function(req, res) {
    Sensor.findOneAndUpdate({
        device_id: req.query.device_id
      }, {
        $set: {
          timer: "false"
        }
      }, {
        safe: true,
        new: true
      },
      function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          res.render('visual.ejs', {
            user: req.user,
            device_id: doc.device_id,
            device_name: doc.device_name,
            device_type: doc.device_type,
            description: doc.description,
            state: doc.state,
            timer: doc.timer,
            timerDate: doc.timerDate,
            activity: doc.activity,
            intensity: doc.intensity,
            flag: 1
          })

        }
      }

    )
  })


  // =====================================
  // PROJECT DETAILS (GET) ===============================
  // =====================================
  // show the devices under the given project, after adding a device in a project
  app.get('/projectDetails', isLoggedIn,function(req, res) {
    console.log("Param:" + req.param("project_id"));
    var project_id = req.param("project_id");
    var project_name;
    var user = req.user;
    var devices = [];
    var deviceID = [];
    ProjectData.findOne({
        "project_id": project_id
      },
      function(err, project) {
        project_name = project.project_name;
        deviceID = project.device_id; //device id is array of device ids in the project
        var ctr = 0;
        if (deviceID.length != 0) {
          deviceID.forEach(function(device_id) {
            Sensor.findOne({
              "device_id": device_id
            }, function(err, de) {
              if (err)
                console.log(err);
              devices.push({
                "device_id": de.device_id,
                "device_type": de.device_type,
                "device_name": de.device_name,
                "description": de.description,
                "last_access": de.last_access
              });
              ctr++;
              if (ctr == deviceID.length) {
                devices.sort(function(a, b) {
                  var nameA = a.device_name.toUpperCase(); // ignore upper and lowercase
                  var nameB = b.device_name.toUpperCase(); // ignore upper and lowercase
                  if (nameA < nameB) {
                    return -1;
                  }
                  if (nameA > nameB) {
                    return 1;
                  }
                  return 0;
                });
                res.render('projectDetails.ejs', {
                  user: user,
                  project_id: project_id,
                  project_name: project_name,
                  devices: devices
                });
              }
            });
          });
        } else {
          res.render('projectDetails.ejs', {
            user: user,
            project_id: project_id,
            project_name: project_name,
            devices: devices
          });

        }
      }
    );

  });



  // =====================================
  // PROJECT DEVICE FORM ===============================
  // =====================================
  // add a device under a project, redirect to projectDetails GET handle
  app.post('/ProjectDeviceForm',isLoggedIn, function(req, res, next) {
    var device = new Sensor();
    console.log(req.body);
    //console.log(req.body);
    device.device_id = new mongoose.mongo.ObjectID();
    userDetails.findOneAndUpdate({
        "email": req.user.local.email
      }, {
        $push: {
          "devices": device.device_id
        }
      }, {
        safe: true,
        upsert: true
      },
      function(err) {
        console.log(err);
      }
    );
    ProjectData.findOneAndUpdate({
        "project_id": req.body.project_id
      }, {
        $push: {
          "device_id": device.device_id
        }
      }, {
        safe: true,
        upsert: true
      },
      function(err) {
        console.log(err);
      }
    );

    device.device_name = req.body.deviceName;
    device.description = req.body.deviceDescription;
    device.device_type = req.body.deviceType;
    device.project_id = req.body.project_id;
    device.save(function(err) {
      if (err)
        throw err;
      else {
        var query = req.body.project_id;
        console.log("shkfhaskfasdhf:  " + query);

        res.redirect("/projectDetails?project_id=" + query);
      }
    });


  });


  // =====================================
  // PROJECT FORM ===============================
  // =====================================
  // add an empty project
  app.post('/projectsForm',isLoggedIn, function(req, res, next) {
    var project = new ProjectData();
    project.project_id = new mongoose.mongo.ObjectID();
    userDetails.findOneAndUpdate({
        "email": req.user.local.email
      }, {
        $push: {
          "projects": project.project_id
        }
      }, {
        safe: true,
        upsert: true
      },
      function(err) {
        console.log(err);
      }
    );
    project.project_name = req.body.projectName;
    project.description = req.body.projectDescription;
    project.save(function(err) {
      if (err) {
        throw err;
        console.log("HII");
      } else {
        var query = req.body.project_id;
        console.log("shkfhaskfasdhf:  " + query);

        res.redirect('/projects');
      }
    });


  });

  // =====================================
  // DEVICES ===============================
  // =====================================
  // show all the devices added by a user
  app.get('/devices',isLoggedIn, function(req, res) {
    auth = 0;
    var user = req.user;
    var devices = [];
    var deviceID;
    if (user) {
      userDetails.find({
        "email": user.local.email
      }, function(err, de) {
        if (err)
          console.log(err);
        deviceID = de[0].devices;

        var ctr = 0;
        if (deviceID.length != 0) {
          deviceID.forEach(function(device_id) {
            Sensor.findOne({
              "device_id": device_id
            }, function(err, de) {
              if (err)
                console.log(err);
              devices.push({
                "device_id": de.device_id,
                "device_type": de.device_type,
                "device_name": de.device_name,
                "description": de.description,
                "last_access": de.last_access
              });
              ctr++;
              if (ctr == deviceID.length) {
                devices.sort(function(a, b) {
                  var nameA = a.device_name.toUpperCase(); // ignore upper and lowercase
                  var nameB = b.device_name.toUpperCase(); // ignore upper and lowercase
                  if (nameA < nameB) {
                    return -1;
                  }
                  if (nameA > nameB) {
                    return 1;
                  }
                  return 0;
                });
                res.render('devices.ejs', {
                  user: user,
                  devices: devices
                });
              }
            });
          });
        } else {
          res.render('devices.ejs', {
            user: user,
            devices: devices
          });

        }
      });

    }

  });



  // =====================================
  // PROJECTS ===============================
  // =====================================
  // shows a list of all the projects present
  app.get('/projects',isLoggedIn, function(req, res) {
    auth = 0;
    var user = req.user;
    var projects = [];
    var projectID;
    if (user) {
      userDetails.find({
        "email": user.local.email
      }, function(err, de) {
        if (err)
          console.log(err);
        projectID = de[0].projects;
        var ctr = 0;
        if (projectID.length != 0) {
          projectID.forEach(function(project_id) {
            ProjectData.findOne({
              "project_id": project_id
            }, function(err, de) {

              if (err)
                console.log(err);
              projects.push({
                "project_id": de.project_id,
                "project_name": de.project_name,
                "description": de.description
              });

              ctr++;
              if (ctr == projectID.length) {

                projects.sort(function(a, b) {
                  console.log(a.project_name);
                  var nameA = a.project_name.toUpperCase(); // ignore upper and lowercase

                  var nameB = b.project_name.toUpperCase(); // ignore upper and lowercase
                  if (nameA < nameB) {
                    return -1;
                  }
                  if (nameA > nameB) {
                    return 1;
                  }
                  return 0;
                });

                res.render('projects.ejs', {
                  user: user,
                  projects: projects
                });
              }

            });

          });
        } else {
          res.render('projects.ejs', {
            user: user,
            projects: projects
          });

        }
      });

    }

  });


  // =====================================
  // LOGIN ===============================
  // =====================================
  // Authentication done using passport, if authentication successful redirect to profile
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));


  // =====================================
  // DEVICE FORM ===============================
  // =====================================
  // Add a new device,entering details like device name,device id,device descriptions
  app.post('/devicesForm', isLoggedIn,function(req, res, next) {
    var device = new Sensor();

    device.device_id = new mongoose.mongo.ObjectID();
    userDetails.findOneAndUpdate({
        "email": req.user.local.email
      }, {
        $push: {
          "devices": device.device_id
        }
      }, {
        safe: true,
        upsert: true
      },
      function(err) {
        console.log(err);
      }
    );

    device.device_name = req.body.deviceName;
    device.description = req.body.deviceDescription;
    device.device_type = req.body.deviceType;
    device.energy = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    device.save(function(err) {
      if (err)
        throw err;
      else {
        res.redirect('/devices');
      }
    });


  });

  app.get('/verifyAccount', function(req, res) {
    // render the page and pass in any flash data if it exists
    res.render('verifyAccount.ejs', {
      //message: req.flash('signupMessage')
    });
  });





  // =====================================
  // SIGNUP ==============================
  // =====================================
  // show the signup for
  app.get('/signup', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('signup.ejs', {
      message: req.flash('signupMessage')
    });
  });

  /*app.get('/scripts/Chart.js', function(req, res) {

    // render the page and pass in any flash data if it exists
    res.render('/scripts/Chart.js', {
      message: req.flash('signupMessage')
    });
  });*/

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/verifyAccount', // redirect to the secure profile section
    failureRedirect: '/signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages

  }));


  // =====================================
  // VERIFY ===============================
  // =====================================
  // During email verification, after clicking on the link sent, creates new entry in 'user' and generates
  //appropriate messages
  //If same link is used twice ,then message displayed is authenticated already
  app.get('/verify', function(req, res) {
    var id = req.query.id;
    console.log(id);
    var auth = new authSchema();
    authSchema.findOneAndRemove({
        "local.url": id
      },
      function(err, user) {
        if (err)
          console.log(err);
        else {

          if (user) {
            if (user.local.state == false) {
              var userDetail = new userDetails();
              userDetail.api_key = user.local.api_key;
              userDetail.email = user.local.email;
              userDetail.devices = [];
              userDetail.projects = [];

              userDetail.save(function(err) {
                if (err)
                  throw err;


              });

              var newUser = new User();
              newUser.local.api_key = user.local.api_key;
              newUser.local.email = user.local.email;
              newUser.local.password = user.local.password;
              newUser.save(function(err) {
                if (err)
                  throw err

              });

              res.send("authenticated");

            } else {
              console.log("Verification unsuccessfull");
              res.send("Verification unsuccessfull");
            }
          } else {
            console.log(user);
            console.log("authenticated");
            res.send("authenticated already");
          }
        }

      }
    );
  });

  // =====================================
  // DATE TO DATE ANALYSIS ==============================
  // =====================================
  // render 'dateAnalysis.ejs' page
  app.post('/dateAnalysis',isLoggedIn, function(req, res) {
    Sensor.findOne({
      device_id: req.body.device_id
    }, function(err, data) {
      res.render('dateAnalysis.ejs', {
        user: req.user,
        device_id: req.body.device_id,
        device_name: data.device_name,
        data: []
      });
    })

  });


  // =====================================
  // DATE TO DATE ANALYSIS ==============================
  // =====================================
  // Create array of values from start to end date

  app.post('/dateGraph',isLoggedIn, function(req, res) {
    Sensor.findOne({
      device_id: req.body.device_id
    }, function(err, data) {
      var arr = [];   // create empty array
      // If the values array in sensor schema is not empty
      if (data.values) {
        var date, start, end;
        start = new Date(req.body.startDate).getTime();
        end = new Date(req.body.endDate).getTime();
        // Loop through the whole array , if the time in values is between the start and end date
        // then push the element in the new array(arr);
        for (var i = 0; i < data.values.length; i++) {
          date = new Date(data.values[i].time).getTime();
          if (date >= start && date <= end) {
            arr.push(data.values[i]);
          }
        }
      }
      // render the 'dateAnalysis.ejs' page
      // Send device_id,and the array create
      res.render('dateAnalysis.ejs', {
        user: req.user,
        data: arr,
        device_id: data.device_id,
        device_name:data.device_name
      })
    })
  })

  // =====================================
  // DELETE DEVICE ==============================
  // =====================================
  // delete device,form submits device_id in the body
  // delete device details from Sensor schema,userDetails schema,ProjectData schema
  app.post('/deleteDevice',isLoggedIn, function(req, res) {
    // Delete the device with that device_id from the sensor schema
    Sensor.findOneAndRemove({
      device_id: req.body.device_id,
    }, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        //If no error, delete from devices array in the userDetails schema
        // $pull command pulls the element from the array
        userDetails.findOneAndUpdate({
          email: req.user.local.email
        }, {
          $pull: {
            devices: req.body.device_id
          }
        }, function(err, doc) {
          if (err) {
            console.log(err);
          } else {
            // If no error,delete from ProjectData,
            // Delete(using $pull) the device_id from the devices array
            ProjectData.findOneAndUpdate({
              project_id:data.project_id
            },{
              $pull:{
                device_id: req.body.device_id
              }
            },function(err,d){
              if(err){
                console.log(err);
              }
              else{
                // redirect to '/devices' again
                res.redirect('/devices');
              }
            });
          }
        })
      }
    })

  })



  // =====================================
  // PROFILE SECTION =========================
  // =====================================
  // we will want this protected so you have to be logged in to visit
  // we will use route middleware to verify this (the isLoggedIn function)
  app.get('/profile', isLoggedIn, function(req, res) {
      var de;
      var pr;
      userDetails.findOne({
        "email":req.user.local.email
      },function(err,doc){
        if(err){
          console.log(err);
        }
        else{
          de=doc.devices.length;
          pr=doc.projects.length;
          res.render('profile.ejs', {
            user: req.user, // get the user out of session and pass to template
            devices: de,
            projects: pr
          });
        }
      })

  });

// =====================================
// LOGOUT ==============================
// =====================================
app.get('/logout',nocache, function(req, res) {
  auth = 0;
  console.log(auth);
  //req.session.destroy();
  //req.session=null;
  req.logout();
  res.redirect('/');
});
};

// route middleware to make sure
function isLoggedIn(req, res, next) {

  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) {
    auth = 1;
    console.log(auth);
    return next();
  }

  // if they aren't redirect them to the home page
  res.redirect('/');
}
