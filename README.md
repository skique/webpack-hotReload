# webpack热更新

## 启动
1. 安装依赖
`npm i`
2. 启动服务
`npm run dev`
开启一个webpack-dev-server的服务，此服务会打包出dist文件夹，以dist为路径资源文件夹启动一个http服务
3. 将dist1包中的hmr.html以及hrm.js移动到dist
`mv dist1/* dist/`
这一步是因为webpack代码注入客户端的热更新十分复杂，因此将主要流程事件写入到hrm.js，到时候直接访问访问这个文件，即可实现热更新
4. 打开浏览器，访问localhost9099/hmr.html
5. 改变src/title.js内容的title，观察到浏览器的输入内容自动发生了改变

此时服务端和客户端发生了如下的通信过程：
![](https://www.yuque.com/u448294/oozdck/uv3qct?inner=uHKEp)




1、为什么需要两个hash值
  lastHash/currentHash
  客户端里的代码和服务器是一致的 - hash1；
  服务器一旦重新编译；
  重新得到一个新的hash值 - hash2；
  还会创建一个hash1的补丁包，包里记录的是hash1到hash2，哪些代码块发生了变更，以及发生了哪些变更；
  hash1   9c22dc8be4385e4cc6ed
  hash2   0b337475157ad8b90578
  hash3   e4113d05239b9e227b26


2、实现热更新，需要维护父子关系
