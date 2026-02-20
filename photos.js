const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uuidv4() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Helper: verify project ownership
function getProject(projectId, userId) {
  return db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(projectId, userId);
}

// GET /api/projects/:id/photos
router.get('/', auth, (req, res) => {
  const project = getProject(req.params.id, req.user.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const photos = db
    .prepare('SELECT * FROM photos WHERE project_id = ? ORDER BY uploaded_at DESC')
    .all(req.params.id);
  res.json(photos);
});

// POST /api/projects/:id/photos
router.post('/', auth, upload.array('photos', 20), (req, res) => {
  const project = getProject(req.params.id, req.user.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const insert = db.prepare(
    'INSERT INTO photos (project_id, filename, original_name, mimetype, size) VALUES (?, ?, ?, ?, ?)'
  );

  const inserted = req.files.map((file) => {
    const result = insert.run(req.params.id, file.filename, file.originalname, file.mimetype, file.size);
    return db.prepare('SELECT * FROM photos WHERE id = ?').get(result.lastInsertRowid);
  });

  res.status(201).json(inserted);
});

// DELETE /api/projects/:id/photos/:photoId
router.delete('/:photoId', auth, (req, res) => {
  const project = getProject(req.params.id, req.user.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const photo = db
    .prepare('SELECT * FROM photos WHERE id = ? AND project_id = ?')
    .get(req.params.photoId, req.params.id);
  if (!photo) return res.status(404).json({ error: 'Photo not found' });

  // Delete file from disk
  const filePath = path.join(uploadsDir, photo.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.prepare('DELETE FROM photos WHERE id = ?').run(photo.id);
  res.status(204).send();
});

module.exports = router;
