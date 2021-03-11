const { resolve } = require("path");
const webpack = require("webpack");
const { name, version } = require(resolve(__dirname, "package.json"));
const [, baseName] = name.split("/");

module.exports = {
  entry: resolve(__dirname, "dist/build/index.js"),
  output: {
    path: resolve(__dirname, "dist"),
    filename: `${baseName}.min.js`,
    library: name,
    libraryTarget: "umd",
  },
  externals: [
    "opentype.js"
  ],
  module: {
    rules: [{
      test: /.js/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            [
              "@babel/preset-env",
              {
                useBuiltIns: "entry",
                corejs: 3,
                targets: {
                  "ie": "11"
                }
              }
            ],
          ],
          plugins: [
            "@babel/plugin-transform-runtime",
          ],
        },
      },
    }],
  },
  resolve: {
    extensions: [".js"],
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: `${name} ${version} ${new Date().toString()}`,
    }),
  ]
};