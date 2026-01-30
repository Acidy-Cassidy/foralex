import express, { Response } from 'express';
import { query, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { fileExists, deleteFile } from '../services/storage';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all media with filters
router.get(
  '/',
  [
    query('projectId').optional().isUUID(),
    query('fileType').optional().isIn(['photo', 'video']),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { projectId, fileType } = req.query;

      const where: any = {
        userId: req.userId!,
      };

      if (projectId) {
        where.projectId = projectId;
      }

      if (fileType) {
        where.fileType = fileType;
      }

      const media = await prisma.media.findMany({
        where,
        orderBy: { uploadedAt: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      res.json(media);
    } catch (error: any) {
      console.error('Error fetching media:', error);
      res.status(500).json({ error: 'Failed to fetch media' });
    }
  }
);

// Get single media item
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const media = await prisma.media.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
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

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    res.json(media);
  } catch (error: any) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// Serve media file
router.get('/:id/file', async (req: AuthRequest, res: Response) => {
  try {
    const media = await prisma.media.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },
    });

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    if (!(await fileExists(media.filePath))) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.sendFile(path.resolve(media.filePath));
  } catch (error: any) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

// Serve thumbnail
router.get('/:id/thumbnail', async (req: AuthRequest, res: Response) => {
  try {
    const media = await prisma.media.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },
    });

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    if (media.thumbnailPath && (await fileExists(media.thumbnailPath))) {
      return res.sendFile(path.resolve(media.thumbnailPath));
    }

    // Fallback to original file if no thumbnail
    if (await fileExists(media.filePath)) {
      return res.sendFile(path.resolve(media.filePath));
    }

    res.status(404).json({ error: 'Thumbnail not found' });
  } catch (error: any) {
    console.error('Error serving thumbnail:', error);
    res.status(500).json({ error: 'Failed to serve thumbnail' });
  }
});

// Delete media
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const media = await prisma.media.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },
    });

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Delete files
    await deleteFile(media.filePath);
    if (media.thumbnailPath) {
      await deleteFile(media.thumbnailPath);
    }

    // Delete database record
    await prisma.media.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Media deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

export default router;
