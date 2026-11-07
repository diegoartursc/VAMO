module.exports = function (api) {
    api.cache(true);
    // babel-preset-expo (SDK 54) já inclui o plugin de worklets do Reanimated 4.
    return {
        presets: ['babel-preset-expo'],
    };
};
