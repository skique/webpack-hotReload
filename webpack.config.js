const path = require('path');
const webapck = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool:'source-map',
  entry: {
    
    main: './src/index.js',
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  devServer: {
    hot: true,
    writeToDisk: true
  },
  plugins: [
    new HtmlWebpackPlugin(),
    new webapck.HotModuleReplacementPlugin()
  ]
}