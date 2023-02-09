// const sequelize = require ('./db-config/databaseConfig');
const models = require('./models');
const express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors');
var port = normalizePort(process.env.PORT || '3000');


const app = express();
app.set('port',port);
app.use(bodyParser.json());
app.use(cors());

app.get('/',(req,res) => {
    res.json({'message':'Hello Cloud !!'}); 
});

require('./api-routes/routes')(app);



  models.sequelize.sync().then(function() {
    /**
     * Listen on provided port, on all network interfaces.
     */
    app.listen(port, function() {
      console.log('Express server listening on port ' + port);
    });
    app.on('error', onError);
    app.on('listening', onListening);
  });
  

  function normalizePort(val) {
    var port = parseInt(val, 10);
  
    if (isNaN(port)) {
      // named pipe
      return val;
    }
  
    if (port >= 0) {
      // port number
      return port;
    }
  
    return false;
  }


  function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }
  
    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;
  
    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  }
  
  /**
   * Event listener for HTTP server "listening" event.
   */
  
  function onListening() {
    var addr = app.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    console.log('Listening on ' + bind);
  }