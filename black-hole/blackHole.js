const cluster = require('cluster');
const http = require('http');
const net = require('net');
const dgram = require('dgram');
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
    console.log(Date(), 'TCP', 'new client', clientId);
      
    c.on('data', (data) => {
      console.log(Date(), 'TCP', clientId, 'client data str', data.toString());
      console.log(Date(), 'TCP', clientId, 'client data buf', data.toString('hex'));
    });
      
    c.on('end', () => {
      console.log(Date(), 'TCP', clientId, 'client end');
    });      
  });
  server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
  });
  server.listen(8124, () => {
    console.log('tcp server listening', server.address());
  });
  
  const udpServer = dgram.createSocket('udp4');
  udpServer.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
  });
  udpServer.on('message', (msg, rinfo) => {
    console.log(Date(), 'UDP', `${rinfo.address}:${rinfo.port}`, 'client data str', msg.toString());
    console.log(Date(), 'UDP', `${rinfo.address}:${rinfo.port}`, 'client data buf', msg.toString('hex'));
  });
  udpServer.on('listening', () => {
    const address = udpServer.address();
    console.log(`udp listening ${address.address}:${address.port}`);
  });
  udpServer.bind(41234);
  
  
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  const httpServer = http.createServer((req, res) => {
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
  httpServer.on('listening', () => {
    const address = httpServer.address();
    console.log(`http listening ${address.address}:${address.port}`);
  });
  httpServer.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
  });

  console.log(`Worker ${process.pid} started`);
}
