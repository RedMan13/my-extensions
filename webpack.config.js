const path = require('path');
const BannerPlugin = require('banner-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const extensions = require('./extensions/index.json');

module.exports = {
    mode: 'production',
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
        rules: [{
            test: /\.m?js$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
            options: {
                presets: [['@babel/preset-env']]
            }
        }]
    },
    plugins: [
        // new BannerPlugin('/** This file is built from github.com/RedMan13/my-extensions, and is a composite of many different files */'),
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