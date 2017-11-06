//Required variables for expressJs,sockets,mongoose,passport etc
var express = require('express');
var path = require('path');
var app = express()
var yVal = 0;
var server = require('http').createServer(app);
var io = require('socket.io').listen(app.listen(3000));
app.use(express.static('public')) // Static library(public)
const mqtt = require('mqtt')
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var sys = require('util');

var exec = require('child_process').exec;

function puts(error, stdout, stderr) {
  sys.puts(stdout)
}
exec("node-red", puts);


//Mongodb schemas
var Sensor = require('./app/models/sensor');
var notification = require('./app/models/notification');
var SensorData = require('./app/models/sensorData');
var configDB = require('./config/database.js');

var bodyParser = require('body-parser');
require('mongoose').Types;
// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
var logger = require('morgan');
app.use(logger('dev')); // log every request to the console
var cookieParser = require('cookie-parser');
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('view engine', 'ejs'); // set up ejs for templating
var session = require('express-session');
// required for passport
app.use(session({
  secret: 'ilovescotchscotchyscotchscotch'
})); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
var path = require('path');

path.join(__dirname, 'path/to/views')



// routes ======================================================================
a = require('./app/routes.js')(app, passport, io); // load our routes and pass in our app and fully configured passport
var i = 0;

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

var private_key = 23;

function random(i) { //random numbers from 1 to i (i included)
  return (Math.floor(Math.random() * i) + 1);
}

function encryptMessage(msg) {
  var i, j;
  var x = msg.length;
  var enc_Msg = [];
  var enc_priv_key = [];
  var message = [];
  var rand_key = random(36); // range from 1 to 36 for UPPER CASE ALPHABETICAL MESSAGE, range from 1 to 69 for NUMERICAL MESSAGE.
  var _message = "";
  console.log("rand_key", rand_key);
  for (i = 0; i < x; i++) {
    enc_Msg[i] = msg.charCodeAt(i) + rand_key;
    _message += String.fromCharCode(enc_Msg[i]);
  }
  var pub_key = "" + rand_key;
  var _key = "";
  for (i = 0; i < pub_key.length; i++) {
    enc_priv_key[i] = pub_key.charCodeAt(i) + private_key; //Ascii values add
    _key += String.fromCharCode(enc_priv_key[i]);
  }
  _message = _key + "/" + _message;
  return _message;
}


function decryptMessage(rec) {
  var pub_key = [];
  var x = rec.length;
  var dec_Msg = [];
  var i, j;
  var int_key = 0;
  for (i = 0; i < 2 && rec[i] != '/'; i++) {
    pub_key[i] = rec.charCodeAt(i) - private_key;
    int_key = int_key * 10 + (pub_key[i] - 48);
  }
  if (i == 2 || rec[i] == '/') {
    i++;
    j = 0;
    var msg = "";
    for (; i < x; i++, j++) {
      dec_Msg[j] = rec.charCodeAt(i) - int_key;
      msg += String.fromCharCode(dec_Msg[j]);
    }
    console.log("decrypted", msg);
    return msg;
  }
}
// launch ======================================================================

app.get('/api/users', function(req, res) {
  i++;
  var device_id = req.query.device_id;
  var value = req.query.value;
  console.log(device_id, value);
  io.sockets.emit(device_id, {
    "device_id": device_id,
    "value": value
  });

  var data = new SensorData();
  data.time = Date.now;
  data.value = value;
  Sensor.findOneAndUpdate({
      "device_id": device_id
    }, {
      $push: {
        "values": data
      }
    }, {
      safe: true,
      upsert: true
    },
    function(err) {
      console.log(err);
    }
  );
  res.send("ok");
});

// Create a mqtt client for subscribing notifications received from the device
var client = mqtt.connect('mqtt://192.168.43.198')
client.on('message', function(topic, message) {
  //The payload has the following format:'stateOfDevice intenstiy'
  //The state of the device can be 'On(ON)','Already On(AO)','Already Off(AO)' or 'Off(OF)'

  console.log(message);
  console.log(topic + '=' + message);
  topic = String(topic);
  message = String(message);
  message = String(decryptMessage(message));
  console.log("message", message, topic);
  var topics = topic.split("/");
  if (topics[1] == "notify") {
    var keys = message.split("@");
    var note = keys[0];
    var intensity = parseInt(keys[1]);
    console.log("curr inte", intensity);
    var msg;
    var state = "false";
    switch (note) {
      case "AO":
        msg = "Already On";
        state = "true";
        break;
      case "AF":
        msg = "Already Off";
        state = "false";
        break;
      case "ON":
        msg = "Device is switched on";
        state = "true";
        break;
      case "OF":
        msg = "Device is switched off";
        state = "false";
        break;
      case "AU":
        msg = "Authenticated User Scanned";
        break;
      case "UU":
        msg = "Unauthenticated User Scanned";
        break;
      case "CN":
        msg = "Device Connected";
        break;
      case "TF":
        msg = "Device overheated";
        break;
      default:
        msg = "";
    }
    //Based on the notification sent by the device,appropriate message and the state is inserted in the database
    //For this, schema is searched on the basis of the 'device_id' of the device
    var data = new notification();
    data.time = Date.now;
    data.message = msg;
    Sensor.findOneAndUpdate({
      device_id: topics[0]
    }, {
      $push: {
        activity: data
      },
      $set: {
        state: state,
        intensity: intensity
      }
    }, function(err) {
      if (err) {
        console.log(err);
      }
    });
    //console.log("payload",String(message));
    //The topic and the payload is then again emitted using sockets which is then used in visual.ejs
    io.sockets.in(topic).emit('mqtt', {
      'topic': String(topic),
      'payload': String(message)
    });
  }
  //If the device publishes payload on the topic 'device_id/values'
  else if (topics[1] == "values") {
    //emit values
    var device_id = topics[0];
    var value = message;
    //socket emits the 'value' which is then used in Chart-1.js to plot real time graphs
    io.sockets.emit(topic, {
      "device_id": device_id,
      "value": value
    });
    //The corresponding values and the time corresponding to them are stored in the database
    // This data can then be used for data analysis etc.
    var data = new SensorData();
    data.time = Date.now;
    data.value = parseInt(value);
    // Finds the document corresponding to that device_id and updates corresponding values
    Sensor.findOneAndUpdate({
        "device_id": device_id
      }, {
        $push: {
          "values": data
        }
      }, {
        safe: true,
        upsert: true
      },
      function(err) {
        console.log(err);
      }
    );
  } else if (topics[1] == "energy") {
    //emit values
    console.log("energy");
    var device_id = topics[0];
    var energy = message;
    var date = new Date();
    var day = date.getDate();
    //socket emits the 'energy' which is then used in Chart-1.js to plot energy gauge graph
    io.sockets.emit(topic, {
      "device_id": device_id,
      "energy": energy
    });
    //The corresponding values and the time corresponding to them are stored in the database
    // This data can then be used for data analysis etc.
    // Finds the document corresponding to that device_id and updates corresponding values

    Sensor.findOne({
        "device_id": device_id,
      },
      function(err, doc) {
        if (err)
          console.log(err);
        else {
          var d = day - 1;
          //console.log("date",d);
          //console.log(doc);
          //console.log(JSON.stringify(doc));
          //console.log(doc.energy[d]);
          doc.energy.set(d, energy);
          doc.save();
        }
      }
    );
  }
});


//The socket from visual.ejs sends the switch value and the device id
io.on('connection', function(socket) {
  console.log("user connected " + socket.id + ' ' + socket.request.connection.remoteAddress);
  //On socket.on it connects via mqtt, before publishing the switch value(on/off) to the
  //device, the state of the device is stored in the database so that the next time the user logs in it shows the last state
  socket.on('switch', function(data) {
    var client = mqtt.connect('mqtt://192.168.43.198')
    //console.log("Blehhhhhhhh");
    client.on('connect', function() {
      Sensor.findOne({
          "device_id": data['device_id']
        }, {
          safe: true
        },
        function(err, doc) {
          if (err)
            console.log(err);
          else {
            var msg;
            console.log("State", data['state']);
            if (data['state'] == true) {
              msg = "T";
            } else {
              msg = "F";
              data['intensity'] = 0;
            }
            var intense = pad(data['intensity'], 3);
            console.log("intense", intense);
            //console.log("/state", data['device_id'], msg + "@" + intense);
            //decryptMessage(encryptMessage("AO_60"));
            //decryptMessage("IM/[iyPJ");
            var str = msg + "@" + intense;
            console.log("/state", data['device_id'], str);
            //The device_id and state of the switch is published via mqtt and mosquitto broker,the device then
            //subscribes and gets the state of the switch(on/off).
            str = encryptMessage(str);
            console.log("Str", str);
            client.publish(data['device_id'] + '/state', str);

          }
        }
      );
    })
  });

  socket.on('timer', function(data) {
    var client = mqtt.connect('mqtt://192.168.43.198')
    console.log("Inside timer");
    console.log(data['device_id'], data['state']);
    client.on('connect', function() {
      console.log("inside");
      Sensor.findOne({
          "device_id": data['device_id']
        }, {
          safe: true
        },
        function(err, doc) {
          if (err)
            console.log(err);
          else {
            var msg;
            if (data['state'] == "true") {
              msg = "T";
            } else if (data['state'] == "false") {
              msg = "F";
            } else if (data['state'] == "k") {
              msg = "K";
            }
            data['time'] = Math.floor(data['time']);

            var intense = pad(data['intensity'], 3);
            console.log("/time", data['device_id'], msg, intense, data['time']);
            //The device_id and state of the switch is published via mqtt and mosquitto broker,the device then
            //subscribes and gets the state of the switch(on/off).
            var str = msg + "@" + intense + "@" + data['time'] + "@";
            console.log("/time clean", str);
            str = encryptMessage(str);
            console.log("/time", str);
            client.publish(data['device_id'] + '/time', str);

          }
        }
      );
    })
  });

  socket.on('subscribe', function(data) {
    //var client = mqtt.connect('mqtt://192.168.43.198');
    console.log('Subscribing to ' + data.topic);
    socket.join(data.topic);
    client.subscribe(data.topic);
    // Insert state and Activity after Subscribing
  });



});



function set24Hrs(d) {

  if (d.slice(-2) === "PM") {
    var hrs = parseInt(d.slice(-8, -6))
    var mins = d.slice(-5, -3)
    if (hrs != 12) {
      hrs = hrs + 12
    }
    var dd = d.slice(0, 10) + " " + hrs + ":" + mins;
    return dd;
  } else if (d.slice(-2) === "AM") {
    return (d.slice(0, 17));
  } else {
    throw ("UNRECOGNIZED_FORMAT", "set24Hrs() Received Unrecognized Formatted String");
  }
}


app.get('/timerOn', function(req, res) {
  var flag = 0;
  console.log("int timer On", req.query.intensity);
  //console.log("req", req.query.date);
  Sensor.findOneAndUpdate({
    device_id: req.query.device_id
  }, {
    $set: {
      timer: true,
      timerDate: req.query.date,
      intensity: req.query.intensity
    }
  }, {
    safe: true,
    new: true
  }, function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      //console.log("in timer on", doc.timerDate);
      if (flag == 0) {
        //console.log(doc.state);
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
          flag: 0
        })
      }

    }
  })
});


app.get('*', function(req, res) {
  res.render('404.ejs');
});
