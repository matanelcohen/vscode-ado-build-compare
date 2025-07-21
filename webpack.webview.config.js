const path = require('path');

/** @type {import('webpack').Configuration} */
const webviewConfig = {
  target: 'web',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'webview.js',
    clean: false // Don't clean since extension.js is also in out/
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              compilerOptions: {
                module: 'esnext',
                target: 'es2020',
                jsx: 'react-jsx'
              }
            }
          }
        ]
      }
    ]
  },
  devtool: process.env.NODE_ENV === 'production' ? false : 'nosources-source-map',
  optimization: {
    usedExports: true,
    sideEffects: false,
    minimize: process.env.NODE_ENV === 'production',
    splitChunks: false, // Keep everything in one file for simplicity
  },
  performance: {
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
    maxAssetSize: 2048000, // 2MB
    maxEntrypointSize: 2048000 // 2MB
  }
};

module.exports = webviewConfig;
