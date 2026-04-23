const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '.env.development'),
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const appJson = require('./app.json');

/** @type {import('@expo/config').ExpoConfig} */
module.exports = {
  ...appJson.expo,
  android: {
    ...appJson.expo.android,
    config: {
      googleMaps: {
        apiKey: process.env.ANDROID_MAPS_API_KEY ?? '',
      },
    },
  },
};
