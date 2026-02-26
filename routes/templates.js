const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

// Get all templates for a user
router.get('/', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const sql = `SELECT * FROM task_templates WHERE userId = ? ORDER BY createdAt DESC`;
    db.all(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const templates = rows.map(row => ({
            ...row,
            isFocus: row.isFocus === 1,
            tags: row.tags ? row.tags.split(',').filter(t => t) : []
        }));
        res.json(templates);
    });
});

// Create a template
router.post('/', (req, res) => {
    const { userId, title, description, tags, isFocus } = req.body;
    if (!userId || !title) return res.status(400).json({ error: 'userId and title are required' });

    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const tagsStr = Array.isArray(tags) ? tags.join(',') : (tags || '');
    const isFocusInt = isFocus ? 1 : 0;

    const sql = `INSERT INTO task_templates (id, userId, title, description, tags, isFocus, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [id, userId, title, description || '', tagsStr, isFocusInt, createdAt], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id, userId, title, description, tags: tags || [], isFocus: !!isFocus, createdAt });
    });
});

// Delete a template
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM task_templates WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Template not found' });
        res.json({ message: 'Template deleted' });
    });
});

module.exports = router;
