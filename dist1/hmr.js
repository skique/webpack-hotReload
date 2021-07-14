
// 客户端记录当前的hash值
let currentHash;
let lastHash; // 上一次的hash值

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
let hotEmitter = new EventEmitter();

(function(modules){
  // 模块缓存
  var installedModules = {};
  function hotCheck () {
    // {"h":"e4113d05239b9e227b26","c":{"main":true}}
    hotDownloadManifest().then(update => {
      let chunkIds = Object.keys(update.c);
      chunkIds.forEach(chunkId => {
        hotDownloadUpdateChunk(chunkId);
      })
      lastHash = currentHash;
    }).catch(() => {
      window.location.reload();
    })
  }
  function hotDownloadUpdateChunk (chunkId) {
    let script = document.createElement('script');
    script.src = `${chunkId}.${lastHash}.hot-update.js`;
    document.head.appendChild(script);
  }
  window.webpackHotUpdate = (chunkId, moreModules) => {
    hotAddUpdateChunk(chunkId, moreModules);
  }
  let hotUpdate = {};
  function hotAddUpdateChunk (chunkId, moreModules) {
    for(let moduleId in moreModules){
      modules[moduleId] = hotUpdate[moduleId] = moreModules[moduleId];
    }
    hotApply();
  }
  function hotApply () {
    for(let moduleId in hotUpdate){
      let oldModule = installedModules[moduleId]; // 旧的模块
      delete installedModules[moduleId]; // 删掉缓存中的旧的模块
      // 循环所有的父模块，取出父模块的回调callback，有则执行
      oldModule.parents.forEach(parentModule => {
        let cb = parentModule.hot._acceptDependencies[moduleId];
        cb&&cb();
      })
    }
  }
  function hotDownloadManifest () {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      let url = `${lastHash}.hot-update.json`;
      xhr.open('get', url);
      xhr.responseType = 'json';
      xhr.onload = function () {
        resolve(xhr.response)
      }
      xhr.send();
    })
  }
  function hotCreateModule () {
    let hot = {
      _acceptDependencies: {},
      accept (deps, callback) {
        deps.forEach((dep) => {
          hot._acceptDependencies[dep] = callback;
        })
      },
      check: hotCheck
    }
    return hot;
  }
  // 维护父子关系
  function hotCreateRequire (parentModuleId) {
    // 加载子模块的时候，父模块肯定以及加载过，可以从缓存中加载父模块
    let parentModule = installedModules[parentModuleId];
    // 如果缓存中没有parentModule，说明子模块是顶级模块
    if (!parentModule) return __webpack_require__;
    let hotRequire = function (childModuleId) {
      __webpack_require__(childModuleId); // require过的模块，会放在缓存中
      let childModule = installedModules[childModuleId]; // 取出缓存中的子模块
      childModule.parents.push(parentModule);
      // console.log('[childModule]', childModule);
      parentModule.children.push(childModule);
      return childModule.exports;
    }
    return hotRequire;
  }
  function __webpack_require__(moduleId){
    // 缓存命中，直接返回
    if(installedModules[moduleId]){
      return installedModules[moduleId]
    }
    // 创建一个新的模块对象并缓存入缓存区
    let module = installedModules[moduleId] = {
      i: moduleId, // 模块ID
      l: false, // 是否已经加载
      exports: {}, // 导出对象
      parents: [], // 当前模块的父模块
      children: [], // 当前模块的子模块
      hot: hotCreateModule(),
    }
    modules[moduleId].call(module.exports, module, module.exports, hotCreateRequire(moduleId));
    module.l = true; // 模块已完成加载
    return module.exports;
  }
  return hotCreateRequire("./src/index.js")("./src/index.js")
  // return __webpack_require__("./src/index.js")
})({
  "./src/index.js": function (module, exports, __webpack_require__) {
    // 监听webpackHotUpdate消息
    __webpack_require__("webpack/hot/dev-server.js");
    // 连接websocket服务器，服务器发送给hash，就保存到currentHash，如果服务器发送ok，就发送webpackHotUpdate事件
    __webpack_require__("webpack-dev-server/client/index.js");
    let input = document.createElement('input');
    document.body.appendChild(input);

    let div = document.createElement('div');
    document.body.appendChild(div);

    let render = () => {
      let title = __webpack_require__('./src/title.js');
      div.innerHTML = title;
    }
    render();
    if(module.hot){
      module.hot.accept(['./src/title.js'],render);
    }
  },
  "./src/title.js": function(module, exports){
    module.exports = "title"
  },
  "webpack-dev-server/client/index.js": function(module, exports){
    // 1、连接websocket服务器
    const socket = window.io('/');
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
  },
  "webpack/hot/dev-server.js": function(module, exports){
    hotEmitter.on('webpackHotUpdate', () => {
      // 第一次渲染
      if (!lastHash) {
        lastHash = currentHash
        return;
      }
      // 调用hot.check方法向服务器检查更新，并拉取最新的代码
      module.hot.check();
    });
  }
})