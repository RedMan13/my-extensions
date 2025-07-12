const path = require('path');
const fs = require('fs');
const { BannerPlugin } = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const extensions = require('./extensions/index.json');
const jsxLoader = require.resolve('./util/javascript-xml.js');
const styleLoader = require.resolve('./util/style-loader.js');
global.nostd = false;

module.exports = {
    mode: 'development',
    devtool: 'inline-cheap-source-map',
    entry: {
        ...Object.fromEntries(
            extensions.map(ext => [ext.id, path.resolve('./extensions', ext.id, 'index.js')])
        )
    },
    output: {
        filename: '[name].js',
        path: path.resolve('./built-extensions'),
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: [['@babel/preset-env']]
                        }
                    },
                    jsxLoader
                ]
            },
            {
                test: /\.css$/,
                loader: styleLoader
            },
            {
                test: /\.(png|jpe?g|gif|apng|webp|svg|avif)$/i,
                type: 'asset/inline'
            },
        ]
    },
    plugins: [
        new BannerPlugin({
            banner: fs.readFileSync('./util/embeded-helpers.js', 'utf8'),
            raw: true
        }),
        new BannerPlugin({
            banner: 'This file is built from github.com/RedMan13/my-extensions, and is a composite of many different files'
        }),
        new CopyPlugin({
            patterns: extensions.map(ext => ({
                from: path.resolve('./extensions', ext.id, 'icon.svg'),
                to: path.resolve('./built-extensions/icons', `${ext.id}.svg`)
            }))
        }),
        new CopyPlugin({
            patterns: [{
                from: path.resolve('./extensions/index.json'),
                to: path.resolve('./built-extensions/index.json')
            }]
        })
    ]
}