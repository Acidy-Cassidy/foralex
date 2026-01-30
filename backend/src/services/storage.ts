import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

export const ensureUploadDir = async (userId: string, projectId: string): Promise<string> => {
  const userDir = path.join(UPLOAD_DIR, userId);
  const projectDir = path.join(userDir, projectId);
  
  await fs.mkdir(projectDir, { recursive: true });
  
  return projectDir;
};

export const saveFile = async (
  userId: string,
  projectId: string,
  filename: string,
  buffer: Buffer
): Promise<string> => {
  const projectDir = await ensureUploadDir(userId, projectId);
  const filePath = path.join(projectDir, filename);
  
  await fs.writeFile(filePath, buffer);
  
  return filePath;
};

export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    // File might not exist, ignore error
    console.error('Error deleting file:', error);
  }
};

export const getFileStream = async (filePath: string): Promise<fs.FileHandle> => {
  return await fs.open(filePath, 'r');
};

export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};
