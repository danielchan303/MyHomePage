require('dotenv').config()

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const logger = require('morgan');

const indexRouter = require('./routes/index');

// auth router
const loginRouter = require('./routes/auth/login');
const registerRouter = require('./routes/auth/register');
const forgotPasswordRouter = require('./routes/auth/forgotPassword');

const profileRouter = require('./routes/profile');
const blogRouter = require('./routes/blog');
const commentRouter = require('./routes/comment');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false, limit: 10000000 }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));

// helmet
var helmet = require('helmet')
app.use(helmet())

// setup method-override
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// connect to the database
const db = require('./database');

// setup session
const session = require('./session');
app.use(session);

// setup flash message
const flash = require('connect-flash');
app.use(flash());

// csrf protection
const csrf = require('csurf');
const csrfProtection = csrf();
app.use(csrfProtection);
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// setup passport
const passport = require('./passportConfig');
app.use(passport.initialize());
app.use(passport.session());

// attach user and function to view
const attachToView = require('./middlewares/attachToView');
app.use(attachToView);

// retrieve flash message
const retrieveFlashMessage = require('./middlewares/retrieveFlashMessage');
app.use(retrieveFlashMessage);

// routes setup
app.use('/', indexRouter);
app.use('/', loginRouter);
app.use('/', registerRouter);
app.use('/', forgotPasswordRouter);
app.use('/profile', profileRouter);
app.use('/blog', blogRouter);
app.use('/blog/:blogId', commentRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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
