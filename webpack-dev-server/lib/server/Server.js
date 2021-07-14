const express = require('express');
const http = require('http');
const path = require('path');
// const MemoryFS = require('memory-fs');
const fs = require('fs-extra');
fs.join = path.join;
const mime = require('mime');
const socketIO = require('socket.io');
const updateCompilrer = require('../utils/updateCompilrer.js');

class Server {
  constructor (compiler) {
    this.compiler = compiler; // 保存编译器对象
    updateCompilrer(compiler); // 注入client和server通信的文件
    this.currentHash; // 当前的hash值，每次编译都会产生一个新的hash值
    this.clientSocketList = []; // 存放所有的通过websocket连接到服务器的客户端
    this.setupHooks(); // webpack生命周期监听钩子 done事件监听
    this.setupApp(); // 创建App
    this.setupDevMiddleware();
    this.routes(); // 配置路由
    this.createServer(); // 创建HTTP服务器，以app作为路由
    this.createSocketServer(); // 创建socket服务器
  }
  createSocketServer () {
    // websocket协议握手是需要依赖http服务器的
    const io = socketIO(this.server);
    // 服务器要监听客户端的连接，当客户端连接上后，socket：代表和这个客户端连接的对象
    io.on('connection', (socket) => {
      console.log('[新的客户端连接完成]');
      this.clientSocketList.push(socket); // 把新的socket放入数组中
      socket.emit('hash', this.currentHash); // 新的hash发送给客户端
      socket.emit('ok'); // 给客户端发送一个确认
      socket.on('disconnect', () => {
        let index = this.clientSocketList.indexOf(socket);
        this.clientSocketList.splice(index, 1);
      })
    })
  }
  routes () {
    let { compiler } = this;
    let config = compiler.options;
    this.app.use(this.middleware(config.output.path));
  }
  createServer () {
    this.server = http.createServer(this.app);
  }
  listen (port, host, callback) {
    this.server.listen(port, host, callback);
  }
  setupDevMiddleware () {
    this.middleware = this.webapckDevMiddleware(); // 返回一个express中间件
  }
  webapckDevMiddleware () {
    let { compiler } = this;
    // 以监听模式启动编译，如果以后文件发生变更，会重新编译
    compiler.watch({}, () => {
      console.log('监听模式编译成功');
    })
    // let fs = new MemoryFS(); // 内存文件系统实例
    // 打包后的文件写入内存文件系统，读取的时候从内存文件系统读
    this.fs = compiler.outputFileSystem = fs;
    // 返回一个中间件，相应客户端对于产出文件的请求
    return (staticDir) => {
      return (req, res, next) => {
        let { url } = req;
        if (url === '/favicon.ico') return res.sendStatus(404);
        url === '/' ? url = '/index.html' : null;
        let filePath = path.join(staticDir, url);
        try {
          // 返回此路径上的文件的描述对象，如果不存在，抛出异常
          let statObj = this.fs.statSync(filePath);
          // console.log('[statObj]', statObj);
          if (statObj.isFile()){
            let content = this.fs.readFileSync(filePath); // 读取文件内容
            res.setHeader('Content-Type', mime.getType(filePath)); // 设置相应头，告诉浏览器此文件的内容
            res.send(content); // 内容发送给浏览器
          }
        }catch(error){
          return res.sendStatus(404);
        } 
      }
    }
  }
  setupHooks () {
    let { compiler } = this;
    compiler.hooks.done.tap('webpack-dev-server', (stats) => {
      // stats是一个描述对象，包含打包后的hash、chunkHash、contentHash 代码块 模块等
      console.log('[hash]', stats.hash);
      this.currentHash = stats.hash;
      // 编译成功，向所有的客户端广播
      this.clientSocketList.forEach(socket => {
        socket.emit('hash', this.currentHash); // 新的hash发送给客户端
        socket.emit('ok'); // 给客户端发送一个确认
      })
    })
  }
  setupApp () {
    // 执行express函数得到this.app  http应用对象
    this.app = express();
  }
}

module.exports = Server;