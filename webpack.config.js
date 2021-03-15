const { resolve } = require("path");
const webpack = require("webpack");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const { name, version } = require(resolve(__dirname, "package.json"));
const [, baseName] = name.split("/");

module.exports = {
  entry: resolve(__dirname, "src/index.ts"),
  output: {
    path: resolve(__dirname, "dist"),
    filename: `${baseName}.min.js`,
    library: name,
    libraryTarget: "umd",
  },
  externals: {
    "opentype.js": {
      commonjs: "opentype.js",
      commonjs2: "opentype.js",
      amd: "opentype.js",
      root: "opentype",
    },
  },
  module: {
    rules: [{ test: /\.(ts|js)x?$/, loader: 'babel-loader', exclude: /node_modules/ }],
  },
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new webpack.BannerPlugin({
      banner: `${name} ${version} ${new Date().toString()}`,
    }),
  ],
};