import express, { Response } from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { saveFile } from '../services/storage';
import { generateThumbnail } from '../services/imageProcessing';
import path from 'path';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = (process.env.ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/webp').split(',');
    const allowedVideoTypes = (process.env.ALLOWED_VIDEO_TYPES || 'video/mp4,video/webm').split(',');
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Upload media
router.post(
  '/',
  upload.single('file'),
  [
    body('projectId').isUUID(),
    body('latitude').optional().isFloat(),
    body('longitude').optional().isFloat(),
    body('capturedAt').optional().isISO8601(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { projectId, latitude, longitude, capturedAt } = req.body;

      // Verify project exists and belongs to user
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: req.userId!,
        },
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Determine file type
      const isImage = req.file.mimetype.startsWith('image/');
      const fileType = isImage ? 'photo' : 'video';

      // Generate filename
      const timestamp = Date.now();
      const ext = path.extname(req.file.originalname);
      const filename = `${timestamp}-${req.file.originalname}`;

      // Save file
      const filePath = await saveFile(req.userId!, projectId, filename, req.file.buffer);

      // Generate thumbnail for images
      let thumbnailPath: string | null = null;
      if (isImage) {
        try {
          thumbnailPath = await generateThumbnail(
            req.file.buffer,
            req.userId!,
            projectId,
            filename
          );
        } catch (error) {
          console.error('Error generating thumbnail:', error);
          // Continue without thumbnail
        }
      }

      // Create media record
      const media = await prisma.media.create({
        data: {
          projectId,
          userId: req.userId!,
          filePath,
          fileType,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          capturedAt: capturedAt ? new Date(capturedAt) : new Date(),
          thumbnailPath,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.status(201).json(media);
    } catch (error: any) {
      console.error('Error uploading media:', error);
      res.status(500).json({ error: error.message || 'Failed to upload media' });
    }
  }
);

export default router;
