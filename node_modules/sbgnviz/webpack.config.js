const path = require('path');
const pkg = require('./package.json');
const SRC_DIR = './src';
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const NodeExternals = require('webpack-node-externals');

let config = {
  devtool: 'eval-source-map',

  // entry point - src/index.js
  entry: path.join(__dirname, SRC_DIR, 'index.js'),

  // webpack throws warning if not provided a default mode
  // use the 'build:dev' script if you want development mode with non-minified file
  // this mode is used in 'build' script
  mode: 'development',
  output: {
    path: path.join( __dirname ),
    filename: pkg.name + '.js',
    library: pkg.name,
    libraryTarget: 'umd'
  },
  // loader
  module: {
    rules: [
      { 
        test: /\.js$/, 
        exclude: /node_modules/, 
        use: 'babel-loader' 
      }
    ]
  },
  // minimize file if mode is production
  optimization: {
    minimize: false
  },
  plugins: [
    new NodePolyfillPlugin()
  ],
  externals: [NodeExternals()]
};

module.exports = config;
