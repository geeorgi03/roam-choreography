import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';

/** Times (ms) for short marked clips — matches API Mux sample spacing. */
const SAMPLE_TIMES_MS = [400, 1200, 2000, 2800, 3600, 4400, 5200, 6000];

export async function thumbnailsBase64FromVideoUri(videoUri: string): Promise<string[]> {
  const out: string[] = [];
  for (const time of SAMPLE_TIMES_MS) {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time,
      quality: 0.65,
    });
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    out.push(b64);
  }
  return out;
}
