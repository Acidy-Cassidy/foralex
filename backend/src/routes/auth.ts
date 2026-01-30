import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import prisma from '../utils/db';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';

const router = express.Router();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').optional().trim(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, name } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: name || null,
        },
      });

      // Generate tokens
      const tokenPayload = { userId: user.id, email: user.email };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        accessToken,
        refreshToken,
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate tokens
      const tokenPayload = { userId: user.id, email: user.email };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        accessToken,
        refreshToken,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }
);

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

      const { verifyRefreshToken } = await import('../utils/jwt');
      const payload = verifyRefreshToken(refreshToken);

    const newAccessToken = generateAccessToken(payload);

    res.json({ accessToken: newAccessToken });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
