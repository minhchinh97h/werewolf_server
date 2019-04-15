var port = normalizePort(process.env.PORT || '3001');

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

const serverUrl = "http://localhost:" + port + '/'
// const serverUrl = "https://werewolves-of-millers-hollow.herokuapp.com/"

module.exports = serverUrl