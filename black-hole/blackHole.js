const cluster = require('cluster');
const http = require('http');
const net = require('net');
const numCPUs = require('os').cpus().length;
const process = require('process');

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  const server = net.createServer( (c) => {
      let clientId = `${c.remoteAddress}:${c.remotePort}`;
      console.log(Date(), 'new client', clientId);
      
      c.on('data', (data) => {
        console.log(Date(), clientId, 'client data str', data.toString());
        console.log(Date(), clientId, 'client data buf', data.toString('hex'));
      });
      
      c.on('end', () => {
        console.log(Date(), clientId, 'client end');
      });      
  });
  server.on('error', (err) => {
      conosle.log('tcp server error', err);
  });
  server.listen(8124, () => {
      console.log('tcp server started');
  });
  
  
  
  
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  http.createServer((req, res) => {


    let body = Buffer.alloc(0);
    req.on('data', (buf) => {
        body = Buffer.concat([body, buf]);
    });
    req.on('end', () => {
        console.log(Date(), 'HTTP', req.socket.remoteAddress + ':' + req.socket.remotePort, req.method, req.url, JSON.stringify(req.rawHeaders));
        console.log(body.toString('hex'));

        res.writeHead(200);
        res.end('hello world\n');
    });   
  }).listen(8080);

  console.log(`Worker ${process.pid} started`);
}
