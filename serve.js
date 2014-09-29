var connect = require('connect'),
    serveStatic = require('serve-static'),
    app = connect(),
    config = {
      path: 'dist/',
      index: 'index.html',
      port: process.env.OPENSHIFT_NODEJS_PORT || 8080,
      ip: process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1"
    };

app.use(serveStatic(config.path, {'index': [config.index]}))
   .listen(config.port, config.ip);

console.log('Sirviendo la carpeta '+config.path);
console.log('Con indice '+config.index);
console.log('En el puerto '+config.port);
