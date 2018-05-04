module.exports = [{
    entry: './multiSelectorHelper.ts',
    output: {
        filename: './multiSelectorHelper.js',
        libraryTarget: "this"
    },
    resolve: {
        extensions: ['.webpack.js', '.web.js', '.ts', '.js']
    },
    externals: {
        "jquery": "jQuery"
    },
    module: {
        rules: [
            {test: /\.ts$/, loader: 'ts-loader'}
        ]
    }
}];