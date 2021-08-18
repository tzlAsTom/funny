const net = require('net');
const url = require('url');
const server = net.createServer((c) => {
    // 'connection' listener.
    console.log('client connected');
    c.on('end', () => {
        console.log('client disconnected');
    });

    let fBind = false;
    c.on('data', (buffer) => {
        if(fBind) return;
        console.log('data', buffer.toString());

        let firstLineEndIndex = buffer.indexOf('\x0d\x0a');
        let firstLine = buffer.slice(0, firstLineEndIndex).toString();
        let result = firstLine.split(' ');
        if(!result[2]){
            console.log('wrong format');
            c.end();
            return;
        }
        
        if(result[0] != 'CONNECT'){
            let urlStr = result[1];
            let urlObj = url.parse(urlStr);
            let path = urlObj.path + (urlObj.hash || '');
            let host = urlObj.hostname;
            let port = urlObj.port?urlObj.port:80;

            let newFirstLine = result[0] + ' ' + path + ' ' + result[2];
            console.log('newFirstLine', newFirstLine);

            let newBuffer = Buffer.concat([
                Buffer.from(newFirstLine),
                buffer.slice(firstLineEndIndex),
            ]);

            console.log(newBuffer.toString());

            const source = net.createConnection({host: host, port: port }, () => {
                //console.log(buffer.toString());

                source.write(newBuffer);
                source.pipe(c);

            });

            source.on('error', (err) => {
                console.log('connect failed', host, port);

                c.end();
                
            });
        }else{
            let urlStr = result[1];

            let tmp = urlStr.split(':');
            let host = tmp[0];
            let port = tmp[1];

            const source = net.createConnection({host: host, port: port }, () => {
                c.write('HTTP/1.1 200 OK\r\n\r\n');
                fBind = true;
                console.log('https bind', source.localPort);

                c.pipe(source);
                source.pipe(c);
            });

            source.on('error', (err) => {
                console.log('connect failed', host, port);

                c.end();
                
            });
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