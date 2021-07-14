/**
 * 实现客户端Client和服务器Server之间通信，需要在入口注入两个文件
 * (webpack)-dev-server/client/index.js
 * (webapck)/hot/dev-server.js
 * ./src/index.js
*/
const path = require('path');
function updateCompilrer (compiler) {
  const config = compiler.options;
  config.entry = {
    main: [
      path.resolve(__dirname, '../../client/index.js'),
      path.resolve(__dirname, '../../../webpack/hot/dev-server.js'),
      config.entry, // ./src/index.js
    ]
  }
}

module.exports = updateCompilrer;