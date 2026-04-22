module.exports = function (api) {
  api.cache(true);
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const envPath = nodeEnv === 'production' ? '.env.production' : '.env.development';
  return {
    presets: [['babel-preset-expo', { reanimated: false }], 'nativewind/babel'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './src',
            '@assets': './assets',
          },
          extensions: [
            '.ios.ts',
            '.android.ts',
            '.ts',
            '.ios.tsx',
            '.android.tsx',
            '.tsx',
            '.jsx',
            '.js',
            '.json',
          ],
        },
      ],
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: envPath,
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
