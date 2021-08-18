const net = require('net');
const server = net.createServer((c) => {
    // 'connection' listener.
    console.log('client connected');
    c.on('end', () => {
        console.log('client disconnected');
    });

    let STATUS = 'undefined';
    c.on('data', (buffer) => {
        console.log('data', buffer.toString());
        if(STATUS == 'undefined'){
            if(buffer[0] == 0x05){
                let nmethods = buffer[1];
                for(let i = 1; i < buffer.length - 1; i++){
                    console.log('methods', buffer[i]);
                }

                c.write(Buffer.from([0x05, 0x00]));

                STATUS = 'init';
            }//todo: err
        }

        if(STATUS == 'init'){
            if(buffer[0] == 0x05){
                let cmd = buffer[1];
                let rsv = buffer[2];
                let atyp = buffer[3];
                let addr;
                let port;
                if(atyp == 0x03){
                    let addrLen = buffer[4];
                    addr = buffer.slice(5, 5 + addrLen).toString();
                    port = buffer.readUInt16BE(5 + addrLen);

                    console.log('init', addr, port);

                    const source = net.createConnection({host: addr, port: port }, () => {
                        console.log('connected to server!', addr, port, source.localPort);

                        let localPort = source.localPort;

                        let myPortBuffer = Buffer.alloc(2);
                        myPortBuffer.writeUInt16BE(localPort);
                        c.write(Buffer.concat([
                            Buffer.from([0x05, 0x00, 0x00, 0x01]),
                            Buffer.from([127, 0, 0, 1]),
                            myPortBuffer
                        ]));
                    
                        STATUS = 'connected';

                        c.pipe(source);
                        source.pipe(c);
                    });

                    source.on('error', (err) => {
                        console.log('connect failed', addr, port);
                        c.write(Buffer.concat([
                            Buffer.from([0x05, 0x04, 0x00]),
                            Buffer.from([127, 0, 0, 1]),
                            Buffer.alloc(2),
                        ]));
                        
                    });
                    
                }
            }
        }
    });
});
server.on('error', (err) => {
  throw err;
});
server.listen(8124, () => {
  console.log('server bound');
});




process.on('uncaughtException', function(msg){
console.log(msg);
});