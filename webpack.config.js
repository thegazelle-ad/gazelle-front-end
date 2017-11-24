/*********************************************
 * Development build for active development
 *********************************************/

// For excluding /node_modules/
var webpack = require("webpack");
var nodeExternals = require('webpack-node-externals');
var Fs = require('fs')
var nodeModules = {}
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var cssnext = require('postcss-cssnext');

Fs.readdirSync('node_modules').forEach(function (module) {
  if (module !== '.bin') {
    nodeModules[module] = true
  }
})

module.exports = [{
// Front end
  target: 'node',
  entry: './src/index.js',
  output: {
    path: __dirname,
    filename: "./build/server.js",
  },
  context: __dirname,
  node: {
    __dirname: true,
    __filename: true,
  },
  externals: [nodeExternals()],
  resolve: {
    root: __dirname,
    modulesDirectories: [
      'node_modules',
      './src/',
      '.',
    ],
    extensions: ['', '.js', '.jsx'],
  },

  plugins: [
    new webpack.OldWatchingPlugin(),
    new ExtractTextPlugin('./static/build/main.css', {
      allChunks: true,
    }),
  ],

  module: {
    preLoaders: [
      /*
       * Linting warnings and errors will be displayed in the console when
       * Webpack is compiled.
       */
      {
        test: /src\/.*\.jsx?$/,
        loaders: ['eslint'],
      },
    ],
    loaders: [
      {
        loader: 'babel-loader',
        test: /\.jsx?$/,
        exclude: /node_modules/,
        query: {
          plugins: ['lodash'],
          presets: ['es2015', 'react'],
        },
      },

      /*
       * Parse SCSS to minified CSS, then postprocess with postcss autoprefixer plugin
       */
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract('style', ['css?minimize', 'postcss', 'sass']),
      },

      /*
       * Load in files with CSS alone
       */
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=10000',
      },
    ],
  },
  postcss: function () {
    return [cssnext];
  },
  devtool: 'source-map',
}, {
  target: 'web',
  entry: './src/client-scripts/gazelle-client.js',
  output: {
    filename: "./static/build/client.js",
  },
  resolve: {
    root: __dirname,
    modulesDirectories: [
      'node_modules',
      './src/',
      '.',
    ],
    extensions: ['', '.js', '.jsx'],
  },

  plugins: [
    new webpack.OldWatchingPlugin(),
  ],

  module: {
    preLoaders: [
      /*
       * Linting warnings and errors will be displayed in the console when
       * Webpack is compiled.
       */
      {
        test: /src\/.*\.jsx?$/,
        loaders: ['eslint'],
      },
    ],
    loaders: [
      {
        loader: 'babel',
        test: /\.jsx?$/,
        exclude: /node_modules/,
        query: {
          plugins: ['lodash'],
          presets: ['es2015', 'react'],
        },
      },
      {
        test: /\.scss$/,
        loader: "null",
      },
    ],
  },
  devtool: 'source-map'
},
{
  target: 'web',
  entry: './src/client-scripts/admin-client.js',
  output: {
    filename: "./static/build/editor-client.js"
  },
  resolve: {
    root: __dirname,
    modulesDirectories: [
      'node_modules',
      './src/',
      '.',
    ],
    extensions: ['', '.js', '.jsx']
  },

  plugins: [
    new webpack.OldWatchingPlugin(),
  ],

  module: {
    preLoaders: [
      /*
       * Linting warnings and errors will be displayed in the console when
       * Webpack is compiled.
       */
      {
        test: /src\/.*\.jsx?$/,
        loaders: ['eslint'],
      },
    ],
    loaders: [
      {
        loader: 'babel',
        test: /\.jsx?$/,
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react'],
        },
      },
    ],
  },
  devtool: 'source-map'
}]
