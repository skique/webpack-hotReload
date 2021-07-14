let io = require('socket.io');
// 客户端记录当前的hash值
let currentHash;

class EventEmitter {
  constructor(){
    this.events = {};
  }
  on(eventName, fn){
    this.events[eventName] = fn;
  }
  emit(eventName, ...args) {
    this.events[eventName](...args);
  }
}
let hotEmitter = new EventEmitter()

// 1、连接websocket服务器
const socket = io('/');
socket.on('hash', (hash) => {
  currentHash = hash;
})

socket.on('ok', () => {
  console.log('[ok]');
  reloadApp();
})

function reloadApp () {
  hotEmitter.emit('webpackHotUpdate');
}
