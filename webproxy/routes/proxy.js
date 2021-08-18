var express = require('express');
var router = express.Router();

const http = require('http');
const https = require('https');

const urlParse = require('url');
const zlib = require('zlib');
const path = require('path');


let httpAgent = new http.Agent({keepAlive: true, maxSockets: 50});
let httpsAgent = new https.Agent({keepAlive: true, maxSockets: 50});
router.get('/', function(req, res, next) {
    let url = req.query.url;
    if(!(url && typeof url == 'string')) return next(Error('invalid url:' + url));

    if(!url.startsWith('http')) url = 'http://' + url;

    let urlObj = urlParse.parse(url);
    let options;
    if(urlObj.hostname){
        options = {
            protocol: urlObj.protocol,
            host: urlObj.hostname,
            port: urlObj.port,
            method: req.method,
            path: urlObj.path,
        }; 

        req.session._lastReqOptions = Object.assign({}, options);
        options.header = Object.assign({}, req.headers, {authorization: undefined, cookie: undefined});
    }else if(req.session._lastReqOptions){
        //page sub req
        options = Object.assign({}, req.session._lastReqOptions, {
            path: urlObj.path,
        });

        options.header = Object.assign({}, req.headers, {
            referer: `${options.protocol}//${options.host}` + (options.port || '') + req.session._lastReqOptions.path,
            authorization: undefined, 
            cookie: undefined
        });
    }

    options.header.host = options.host + (options.port?(':' + options.port):'')
    //console.log(options.header);

    let fHttps = options.protocol == 'https:';
    options.agent = (fHttps?httpsAgent:httpAgent);
    let pReq = (fHttps?https:http).request(options, (pRes) => {
        console.log(`STATUS: ${pRes.statusCode} (${options.protocol}//${options.host}:${options.port || ''}${options.path}})`);
        res.status(pRes.statusCode);
        Object.keys(pRes.headers).forEach( (headerName) => {
          res.set(headerName, pRes.headers[headerName]);
        });
        pRes.pipe(res);
    });

    pReq.on('error', (e) => {
      return next(Error(`problem with request: ${e.message} (${url})`));
    });

    //todo
    // req.write(postData);
    pReq.end();
});


module.exports = router;
