import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import prisma from '../utils/db';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all projects for user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { media: true },
        },
      },
    });

    res.json(projects);
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },
      include: {
        media: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error: any) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project
router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('description').optional().trim(),
    body('address').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, address } = req.body;

      const project = await prisma.project.create({
        data: {
          name,
          description: description || null,
          address: address || null,
          userId: req.userId!,
        },
      });

      res.status(201).json(project);
    } catch (error: any) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Failed to create project' });
    }
  }
);

// Update project
router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('address').optional().trim(),
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, address } = req.body;

      // Check if project exists and belongs to user
      const existingProject = await prisma.project.findFirst({
        where: {
          id: req.params.id,
          userId: req.userId!,
        },
      });

      if (!existingProject) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description: description || null }),
          ...(address !== undefined && { address: address || null }),
        },
      });

      res.json(project);
    } catch (error: any) {
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Failed to update project' });
    }
  }
);

// Delete project
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    // Check if project exists and belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await prisma.project.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
