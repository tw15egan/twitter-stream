var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var users = require('./routes/users');
var credentials = require('./credentials');

var app = express();
var http = require('http')
var server = http.Server(app);
var io = require('socket.io')(server);
server.listen(process.env.PORT || 3005)

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Twitter API
var Twit = require('twit');
var T = new Twit({
  consumer_key: credentials.consumer_key,
  consumer_secret: credentials.consumer_secret,
  access_token: credentials.access_token,
  access_token_secret: credentials.access_token_secret
})

var watchList = ['Austin'];

var stream = T.stream('statuses/filter', { track: watchList})

stream.on('message', function(message) {
  var data = {
    color: message.user.profile_background_color,
    text: message.text,
    url: 'https://twitter.com/statuses/' + message.id_str,
    profileImg: message.user.profile_image_url
  }
  console.log(message);
  if (message.in_reply_to_status_id == null) {
    if (message.in_reply_to_user_id == null) {
      if (data.text.includes('RT') === false) {
        io.sockets.emit('tweet', data)
      }
    }
  }

})

io.sockets.on('connection', function (socket) {
  console.log('User connected!');
})



app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
