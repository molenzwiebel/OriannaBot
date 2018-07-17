const path = require("path");
const webpack = require("webpack");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const GitRevisionPlugin = require("git-revision-webpack-plugin");
const gitRevision = new GitRevisionPlugin({ branch: true });

module.exports = env => ({
    entry: env === "prod" ? ["./src/index.ts"] : [
        "webpack-dev-server/client?http://0.0.0.0:8081",
        "webpack/hot/only-dev-server",
        "./src/index.ts"
    ],
    output: {
        filename: "bundle.js",
        publicPath: "/",
        path: path.resolve(__dirname, "dist")
    },
    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: "ts-loader",
            options: {appendTsSuffixTo: [/\.vue$/]}
        }, {
            test: /\.vue$/,
            loader: "vue-loader"
        }, {
            test: /\.styl$/,
            loader: "style-loader!css-loader!stylus-loader"
        }, {
            test: /\.css$/,
            loader: "style-loader!css-loader"
        }, {
            test: /\.(webm|jpg)$/,
            loader: "file-loader"
        }]
    },
    resolve: {
        extensions: [".js", ".json", ".ts", ".html", ".vue"]
    },
    devServer: {
        hot: true,
        contentBase: path.resolve(__dirname, "src"),
        publicPath: "/",
        port: 8081
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            GIT_BRANCH: JSON.stringify(gitRevision.branch()),
            GIT_COMMITHASH: JSON.stringify(gitRevision.commithash()),
            ENV: JSON.stringify(env)
        }),
        new HTMLWebpackPlugin({
            filename: "index.html",
            template: path.resolve(__dirname, "src/index.html"),
            inject: true,
            hash: true,
            minify: {
                removeComments: env === "prod",
                collapseWhitespace: env === "prod",
                removeAttributeQuotes: env === "prod"
            }
        })
    ]
});