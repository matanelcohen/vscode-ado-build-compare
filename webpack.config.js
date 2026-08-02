const path = require('path');
const isProduction = process.argv.includes('production');

/** @type {import('webpack').Configuration} */
const config = {
  target: 'node',
  mode: isProduction ? 'production' : 'development',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    clean: true
  },
  externals: {
    vscode: 'commonjs vscode'
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              compilerOptions: {
                module: 'esnext',
                target: 'es2020'
              }
            }
          }
        ]
      }
    ]
  },
  devtool: isProduction ? false : 'nosources-source-map',
  infrastructureLogging: {
    level: "warn"
  },
  plugins: isProduction ? [
    new (require('webpack').optimize.ModuleConcatenationPlugin)()
  ] : [],
  optimization: {
    usedExports: true,
    sideEffects: false,
    minimize: isProduction
  },
  performance: {
    hints: isProduction ? 'warning' : false,
    maxAssetSize: 250000,
    maxEntrypointSize: 250000
  }
};

module.exports = config;
