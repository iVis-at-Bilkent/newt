const path = require('path');
const pkg = require('./package.json');
const camelcase = require('camelcase');
const process = require('process');
const webpack = require('webpack');
const env = process.env;
const NODE_ENV = env.NODE_ENV;
const MIN = env.MIN;
const PROD = NODE_ENV === 'production';

let configs = [
  {
    devtool: PROD ? false : 'inline-source-map',
    entry: './src/pose/pose.ts',
    output: {
      path: path.join(__dirname, 'src/pose'),
      filename: 'pose.js',
      library: 'pose',
      libraryTarget: 'umd'
    },
    module: {
      rules: [
          {
              test: /\.tsx?$/,
              use: 'ts-loader',
              exclude: /node_modules/,
          },
          /* {
            test: /\.tsx?$/,
            use: 'babel-loader',
            exclude: /node_modules/,
          } */
      ]
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ],
    },
    optimization: {
      minimize: MIN ? true : false
    }

  },
  {
    devtool: PROD ? false : 'inline-source-map',
    entry: './src/core/index.js',
    output: {
      path: path.join( __dirname ),
      filename: pkg.name + '.js',
      library: camelcase( pkg.name ),
      libraryTarget: 'umd'
    },
    module: {
      rules: [
        /* { test: /\.js$/, exclude: /node_modules/, use: 'babel-loader' } */
      ]
    },
    externals: PROD ? Object.keys( pkg.dependencies || {} ) : [],
    optimization: {
      minimize: MIN ? true : false
    }
  }
];

module.exports = configs;
