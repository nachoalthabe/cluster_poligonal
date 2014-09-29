var connect = require('connect'),
    serveStatic = require('serve-static'),
    app = connect(),
    config = {
      path: 'dist/',
      index: 'index.html',
      port: 8080
    };

app.use(serveStatic(config.path, {'index': [config.index]}))
   .listen(config.port);

console.log('Sirviendo la carpeta '+config.path);
console.log('Con indice '+config.index);
console.log('En el puerto '+config.port);
