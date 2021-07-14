let input = document.createElement('input');
document.body.appendChild(input);

let div = document.createElement('div');
document.body.appendChild(div);

let render = () => {
  let title = require('./title.js');
  div.innerHTML = title;
}
render();
if(module.hot){
  module.hot.accept(['./title.js'],render);
}