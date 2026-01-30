import sharp from 'sharp';
import path from 'path';
import { saveFile } from './storage';

export const generateThumbnail = async (
  imageBuffer: Buffer,
  userId: string,
  projectId: string,
  originalFilename: string
): Promise<string> => {
  const thumbnailBuffer = await sharp(imageBuffer)
    .resize(300, 300, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toBuffer();

  const thumbnailFilename = `thumb_${path.basename(originalFilename, path.extname(originalFilename))}.jpg`;
  const thumbnailPath = await saveFile(userId, projectId, thumbnailFilename, thumbnailBuffer);

  return thumbnailPath;
};

export const compressImage = async (imageBuffer: Buffer): Promise<Buffer> => {
  return await sharp(imageBuffer)
    .jpeg({ quality: 85 })
    .toBuffer();
};
