import type { ConfigContext, ExpoConfig } from 'expo/config';
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'SAVR',
  slug: config.slug ?? 'SAVR',
  plugins: [
    ...(config.plugins ?? []),
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? '',
      },
    ],
  ],
  extra: {
    ...config.extra,
    androidMapsConfigured: !!process.env.GOOGLE_MAPS_ANDROID_API_KEY,
  },
});
