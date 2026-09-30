export async function scanPhoto(
  _source: 'camera' | 'library',
): Promise<string | null> {
  throw new Error(
    'Photo scanning is available in the SAVR mobile app. You can type your list below.',
  );
}
