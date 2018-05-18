const config = require('./config.json');
const replaceString = require('replace-string');
const uuidv1 = require('uuid/v1');

const VERSION = "0.1";

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');

var path = require('path');



var sessionstore = require('sessionstore');
var os = require("os");
var mqtt = require('mqtt');


//--------- TWITTER CONFIG -----------------------
var twit = require('twit');

var Twitter = new twit({
  consumer_key: config.consumer_key,
  consumer_secret: config.consumer_secret,
  access_token: config.access_token,
  access_token_secret: config.access_token_secret,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
})

//--------- DB -----------------------
var nano = require('nano')(config.couch_db_url);
var db = null;
nano.db.create(config.couch_db_state_table_name, function () {
  db = nano.use(config.couch_db_state_table_name);
});

uuidv1();


//------- WEBSERVER ---------------------






//----------------------------- EXPRESS APP SETUP ------------------------------------------//
var sess;
app.set('trust proxy', 1);
app.use(function (req, res, next) {
  if (!req.session) {
    return next() //handle error
  }
  next() //otherwise continue
});
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
// Routing
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'ssshhfddghjhgewretjrdhfsgdfadvsgvshthhh',
  store: sessionstore.createSessionStore(),
  resave: true,
  saveUninitialized: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));


server.listen(config.webserver_port, function () {
  console.log('Server listening at port %d', config.webserver_port);
});




//_--------- MAIL SETUP -------------------
var mail = require("nodemailer");

var mail_transporter = mail.createTransport({
  host: config.mail_smtp_server,
  port: config.mail_smtp_port,
  secure: config.mail_smtp_secure, // true for 465, false for other ports
  auth: {
    user: config.mail_smtp_user, // generated ethereal user
    pass: config.mail_smtp_pass // generated ethereal password
  }
});



//---------- BASIC TEXT MESSAGE GENERATOR FuNCTIONS---------

function get_random_start_message(_dataset_id) {
  var link_msg = replaceString(config.route_website_baseurl, '{{log_id}}', '' + _dataset_id);
  var msg = config.twitter_message_start[Math.floor(Math.random() * config.twitter_message_start.length)];
  return replaceString(msg, '{{url}}', link_msg);
}




function get_random_stop_message(_dataset_id) {
  var link_msg = replaceString(config.route_website_baseurl, '{{log_id}}', '' + _dataset_id);
  var msg = config.twitter_message_start[Math.floor(Math.random() * config.twitter_message_start.length)];
  return replaceString(msg, '{{url}}', link_msg);
}









//-------------- WEBSERVER FUNKTIONEN -------------- //

app.get('/', function (req, res) {
  sess = req.session;
  res.render('index.ejs', {
    version: VERSION,
    maps_api_key: config.maps_api_key
  });
});








var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;
  console.log("---- con ----");

  socket.on('new message', function (data) {
    console.log(data);
    var obj = JSON.parse(data.toString())
    if (obj == null) {
      console.log("JSON PARSE NULL");
      return;
    }

  });

  setInterval(function () {
    //wenn letzes update > 5 sek zurück legt dann auch in graph einfügen
    

    var ar = [{
        name: "speed",
        value: Math.floor(Math.random() * 15) + 0  ,
        unit: "km/h",
        icon: null
      },
      {
        name: "battery_voltage",
        value: Math.floor(Math.random() * 12) + 10  ,
        unit: "V",
        icon: null
      },
      {
        name: "air_reservoir",
        value: Math.floor(Math.random() * 3) + 0 ,
        unit: "psi",
        icon: null
      },
    ];


    socket.broadcast.emit('live_chart_update', ar);
  }, 1500);

 



  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    //if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    numUsers++;
    //addedUser = true;
    //socket.emit('login', {
    //  numUsers: numUsers
    //});
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    numUsers--;
  });
});





/*
-> trigger start / top message after x seconds

  */
// Math.floor(millis/1000)


// Twitter.post('statuses/update', { status: ' -- http://marcelochsendorf.com:3052/log?id=32112w3 #emma' }, function(err, data, response) {
//  console.log(data)
//});
