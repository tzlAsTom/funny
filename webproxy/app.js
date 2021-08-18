var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var basicAuth = require('basic-auth');
var session = require('express-session')

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();
app.use(require('compression')());
app.use(function(req, res, next){
  let credential = basicAuth(req);
  if(!(credential && credential.name == 'tong' && credential.pass == 'tp20078')){
    res.status(401);
    res.set('WWW-Authenticate', 'Basic realm="example"');
    res.end('Access denied');
  }else{
    next();
  }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'aaaaa', 
    resave: false, 
    cookie: {maxAge: 60 * 60 * 8 },
    saveUninitialized: false,
}));

app.use('/', index);
app.use('/users', users);
app.use('/proxy', require('./routes/proxy'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  if(req.session._lastReqOptions){
    //use last host port as proxy params
    return res.redirect('/proxy?url=' + encodeURIComponent(req.originalUrl));
  }else{
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  }
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
