var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors')
var indexRouter = require('./routes/index');

var app = express();
var socket_io = require('socket.io')
var io = socket_io()

io.setMaxListeners(Infinity)

app.io = io


var playersRouter = require('./routes/players')
var roomsRouter = require('./routes/rooms')(io)
var handleCookiesRouter = require('./routes/handleCookies')(io)
var mainPageRouter = require('./routes/mainPage')(io)
var getCardsRouter = require('./routes/Roles/getCards')(io)
var updateRolesLimitRouter = require('./routes/Roles/updateRolesLimit')(io)
var updateCurrentRolesRouter = require('./routes/Roles/updateCurrentRoles')(io)
var startGameRouter = require('./routes/StartGame/startGame')(io)
var inGameRouter = require('./routes/InGame/InGame')(io)
var seerActionRouter = require('./routes/InGame/actions/seer/Seer')(io)
var theFoxActionRouter = require('./routes/InGame/actions/the-fox/TheFox')(io)
var getNextTurnRouter = require('./routes/InGame/actions/RetrieveNextTurn')(io)



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors())

app.use('/', indexRouter);
app.use('/players', playersRouter);
app.use('/rooms', roomsRouter)
app.use('/main-page', mainPageRouter)
app.use('/handle-cookies', handleCookiesRouter)
app.use('/get-roles', getCardsRouter)
app.use('/update-roles-limit', updateRolesLimitRouter)
app.use('/update-current-roles', updateCurrentRolesRouter)
app.use('/start-game', startGameRouter)
app.use('/in-game', inGameRouter)
app.use('/in-game/actions', seerActionRouter)
app.use('/in-game/actions', getNextTurnRouter)
app.use('/in-game/actions', theFoxActionRouter)

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
