const http = require('http');
const postData = JSON.stringify({ username: 'çapraz', password: 'adana01' });

const req = http.request({
  hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
}, res => {
  let body = '';
  res.on('data', c => { body += c; });
  res.on('end', () => {
    const token = JSON.parse(body).token;
    
    http.get({
        hostname: 'localhost', port: 3000, path: '/api/metadata',
        headers: { 'Authorization': 'Bearer ' + token }
    }, metaRes => {
        let mBody = '';
        metaRes.on('data', c => mBody += c);
        metaRes.on('end', () => console.log('GET /api/metadata:', mBody));
    });
  });
});
req.write(postData);
req.end();
