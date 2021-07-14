const webapck = require('webpack');
// 配置对象
const config = require('../webpack.config.js');
const Server = require('./lib/server/Server.js');
// 编译器对象
const compiler = webapck(config);
// 创建Server服务器
const server = new Server(compiler);

server.listen(9099, 'localhost', () => {
  console.log('服务已经在9099端口启动 http://localhost:9099');
});