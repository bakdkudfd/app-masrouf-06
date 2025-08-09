const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .wasm and .mjs files
config.resolver.sourceExts.push('mjs', 'wasm');
config.resolver.assetExts.push('wasm');

module.exports = config;