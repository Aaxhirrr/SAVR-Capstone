import * as ImagePicker from 'expo-image-picker';
import { requireOptionalNativeModule } from 'expo';
export async function scanPhoto(
  source: 'camera' | 'library',
): Promise<string | null> {
  const extractor = requireOptionalNativeModule<{
    extractText: (uri: string) => Promise<string[]>;
  }>('SavrOcr');
  if (!extractor)
    throw new Error(
      'Photo scanning is unavailable in this version of the app. You can type your list below.',
    );
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted)
      throw new Error(
        'Camera access was denied. Choose a saved photo or enable camera access in Settings.',
      );
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 1,
    allowsEditing: false,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;
  const lines = await extractor.extractText(result.assets[0].uri);
  const text = lines.join(', ').trim();
  if (!text)
    throw new Error(
      'No readable text was found. Try a clearer photo of a recipe or list, or type what you need.',
    );
  return (
    'I scanned a photo and found these items or text: "' +
    text +
    '". Can you help me turn this into a grocery list or find deals on these items?'
  );
}
