const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

function getProject(projectId, userId) {
  return db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(projectId, userId);
}

// GET /api/projects/:id/notes
router.get('/', auth, (req, res) => {
  const project = getProject(req.params.id, req.user.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const notes = db
    .prepare('SELECT * FROM notes WHERE project_id = ? ORDER BY created_at DESC')
    .all(req.params.id);
  res.json(notes);
});

// POST /api/projects/:id/notes
router.post('/', auth, (req, res) => {
  const project = getProject(req.params.id, req.user.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const { body } = req.body;
  if (!body || !body.trim()) {
    return res.status(400).json({ error: 'Note body is required' });
  }

  const result = db
    .prepare('INSERT INTO notes (project_id, body) VALUES (?, ?)')
    .run(req.params.id, body.trim());
  const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(note);
});

// DELETE /api/projects/:id/notes/:noteId
router.delete('/:noteId', auth, (req, res) => {
  const project = getProject(req.params.id, req.user.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const note = db
    .prepare('SELECT id FROM notes WHERE id = ? AND project_id = ?')
    .get(req.params.noteId, req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  db.prepare('DELETE FROM notes WHERE id = ?').run(note.id);
  res.status(204).send();
});

module.exports = router;
