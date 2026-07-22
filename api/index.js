const app = require('../app');

module.exports = async function handler(req, res) {
  const { createServer } = require('http');
  const server = createServer(app);

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.emit('request', req, res);
    server.once('listening', () => resolve(undefined));
    server.listen(0, '127.0.0.1');
  });
};
