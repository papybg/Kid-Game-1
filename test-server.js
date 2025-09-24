const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Basic server works!' }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3007, () => {
  console.log('Basic HTTP server listening on port 3007');
});