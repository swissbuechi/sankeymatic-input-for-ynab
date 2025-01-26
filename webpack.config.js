import * as path from "path";
import { VueLoaderPlugin } from "vue-loader";
import HtmlWebpackPlugin from "html-webpack-plugin"; // For generating index.html
import CopyWebpackPlugin from "copy-webpack-plugin"; // For copying static assets
import { fileURLToPath } from "url";
import webpack from "webpack";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: "./src/main.js",
  output: {
    filename: "build.js",
    publicPath: "/", // Serve from root
    path: path.resolve(__dirname, "./dist"),
    clean: true, // Clean the output directory before building
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, "./public"), // Serve static assets in development
    },
    compress: true,
    port: 8080,
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: ["vue-loader"],
      },
      {
        test: /\.css$/, // Add CSS handling if needed
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: "./public/index.html", // Use the HTML file in public as a template
      filename: "index.html", // Output to dist/index.html
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "./public"), // Copy everything in public
          to: path.resolve(__dirname, "./dist"), // Copy into dist
          globOptions: {
            ignore: ["**/index.html"], // Skip the HTML template file to avoid duplication
          },
        },
      ],
    }),
    new webpack.DefinePlugin({
      __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
    }),
  ],
};
