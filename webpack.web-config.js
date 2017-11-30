const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const LiveReloadPlugin = require('webpack-livereload-plugin');
const packageJson = require('./package.json');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = function(env) {
  const sourceMap = typeof env !== 'undefined' && typeof env.sourceMap !== 'undefined';
  return {
    entry: {
      bundle: path.resolve(__dirname, 'web/src/index.js'),
      worker: path.resolve(__dirname, 'web/src/worker.js'),
      index: path.resolve(__dirname, 'web/assets/sass/index.scss'),
      landingcss: path.resolve(__dirname, 'web/assets/sass/landing.scss'),
      landingjs: path.resolve(__dirname, 'web/src/landing.js')
    },
    output: {
      path: path.resolve(__dirname, 'web/dist'),
      filename: `[name]-${packageJson.version}.js`
    },
    module: {
      rules: [
        {
          test: /\.(html)$/,
          exclude: /(node_modules)|(web\/index-template\.html)/,
          use: [
            {
              loader: 'html-loader',
              options: {
                minimize: true
              }
            }
          ]
        },
        {
          test: /\.(js)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: ['es2015']
              }
            },
            {
              loader: 'eslint-loader',
              options: {
                rules: {
                  'no-console': 0
                },
                parserOptions: {
                  ecmaVersion: 7,
                  sourceType: 'module',
                  ecmaFeatures: {
                    modules: true,
                    classes: true
                  }
                },
                globals: [
                  '$',
                  'document',
                  'window',
                  'console',
                  'location',
                  'localStorage',
                  'fetch',
                  'Headers',
                  'Promise',
                  'URLSearchParams',
                  'Auth0Lock',
                  'Set',
                  'StripeCheckout',
                  'EventSource',
                  'Uint8Array',
                  'ArrayBuffer',
                  'atob',
                  'FileReader',
                  'ga',
                  'paypal'
                ],
                baseConfig: {
                  extends: ['eslint:recommended']
                }
              }
            }
          ]
        },
        {
          test: /\.scss$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: ['css-loader', 'sass-loader']
          })
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        version: packageJson.version,
        template: path.resolve(__dirname, 'web/index-template.html'),
        inject: false
      }),
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: sourceMap
      }),
      new ExtractTextPlugin(`[name]-${packageJson.version}.css`),
      new LiveReloadPlugin({
        ignore: /node_modules/
      })
    ]
  };
};