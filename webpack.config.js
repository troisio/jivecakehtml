const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');

module.exports = function(env) {
  const sourceMap = typeof env !== 'undefined' && typeof env.sourceMap !== 'undefined';
  return {
    entry: [
      path.resolve(__dirname, 'app/src/index.js'),
      path.resolve(__dirname, 'app/assets/sass/index.scss')
    ],
    output: {
      path: path.resolve(__dirname, 'app/dist'),
      filename: 'bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ['babel-loader', 'eslint-loader']
        },
        {
          test: /\.scss$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: ['css-loader', 'sass-loader']
          }),
        }
      ]
    },
    plugins: [
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: sourceMap
      }),
      new ExtractTextPlugin('bundle.css'),
      new LiveReloadPlugin({
        ignore: /node_modules/
      })
    ]
  };
};