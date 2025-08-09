const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for .wasm and .mjs files
config.resolver.sourceExts.push('mjs', 'wasm');
config.resolver.assetExts.push('wasm');

// Optimize for production builds
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Enable hermes for better performance
config.transformer.hermesCommand = 'hermes';

module.exports = config;