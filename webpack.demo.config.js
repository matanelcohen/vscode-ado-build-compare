const path = require('path');
const isProduction = process.argv.includes('production');

/**
 * Builds the same webview UI as the extension, but wired to an in-browser mock
 * host so it can be published as a static GitHub Pages demo.
 * @type {import('webpack').Configuration}
 */
const demoConfig = {
  target: 'web',
  mode: isProduction ? 'production' : 'development',
  entry: './src/demo/webDemo.tsx',
  output: {
    path: path.resolve(__dirname, 'demo-dist'),
    filename: 'demo.js',
    clean: true
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
  devtool: isProduction ? false : 'nosources-source-map',
  optimization: {
    usedExports: true,
    sideEffects: false,
    minimize: isProduction,
    splitChunks: false
  },
  performance: {
    hints: false
  }
};

module.exports = demoConfig;
