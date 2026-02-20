const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require auth
router.use(auth);

// GET /api/projects?search=
router.get('/', (req, res) => {
  const { search } = req.query;
  let rows;
  if (search) {
    rows = db
      .prepare(`SELECT * FROM projects WHERE user_id = ? AND name LIKE ? ORDER BY updated_at DESC`)
      .all(req.user.id, `%${search}%`);
  } else {
    rows = db
      .prepare(`SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC`)
      .all(req.user.id);
  }
  res.json(rows);
});

// POST /api/projects
router.post('/', (req, res) => {
  const { name, description, lat, lng } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Project name is required' });
  }
  const result = db
    .prepare(`INSERT INTO projects (user_id, name, description, lat, lng) VALUES (?, ?, ?, ?, ?)`)
    .run(req.user.id, name.trim(), description || null, lat ?? null, lng ?? null);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(project);
});

// GET /api/projects/:id
router.get('/:id', (req, res) => {
  const project = db
    .prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// PATCH /api/projects/:id
router.patch('/:id', (req, res) => {
  const project = db
    .prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const { name, description, lat, lng } = req.body;
  const updated = db
    .prepare(`
      UPDATE projects
      SET name = ?, description = ?, lat = ?, lng = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `)
    .run(
      name !== undefined ? name.trim() : project.name,
      description !== undefined ? description : project.description,
      lat !== undefined ? lat : project.lat,
      lng !== undefined ? lng : project.lng,
      req.params.id,
      req.user.id
    );

  const result = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json(result);
});

// DELETE /api/projects/:id
router.delete('/:id', (req, res) => {
  const project = db
    .prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.user.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;
