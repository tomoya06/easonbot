module.exports = (env) => {

    return {
        webpack: {
            configure: {
                // See https://github.com/webpack/webpack/issues/6725
                module: {
                    rules: [{
                        test: /\.wasm$/,
                        type: 'javascript/auto',
                    }]
                },

                output: {
                    publicPath: '/easonbot/',
                }
            }
        }
    }
};