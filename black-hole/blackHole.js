const cluster = require('cluster');
const http = require('http');
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
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  http.createServer((req, res) => {


    let body = Buffer.alloc(0);
    req.on('data', (buf) => {
        body = Buffer.concat([body, buf]);
    });
    req.on('end', () => {
        console.log(Date(), req.socket.remoteAddress + ':' + req.socket.remotePort, req.method, req.url, JSON.stringify(req.rawHeaders));
        console.log(body.toString('hex'));

        res.writeHead(200);
        res.end('hello world\n');
    });   
  }).listen(443);

  console.log(`Worker ${process.pid} started`);
}
