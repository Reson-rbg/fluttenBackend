const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

// Get all todos for a user
router.get('/', (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    const sql = `SELECT * FROM todos WHERE userId = ? ORDER BY createdAt DESC`;
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        // Convert fields
        const todos = rows.map(row => ({
            ...row,
            isCompleted: row.isCompleted === 1,
            isFocus: row.isFocus === 1,
            tags: row.tags ? JSON.parse(row.tags) : [],
            subtasks: row.subtasks ? JSON.parse(row.subtasks) : []
        }));
        res.json(todos);
    });
});

// Create Todo
router.post('/', (req, res) => {
    const { userId, title, description, reminderTime, tags, isFocus, subtasks } = req.body;
    
    if (!userId || !title) {
        return res.status(400).json({ error: 'userId and title are required' });
    }

    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const isCompleted = 0; // False
    const tagsStr = tags ? JSON.stringify(tags) : '[]';
    const subtasksStr = subtasks ? JSON.stringify(subtasks) : '[]';
    const isFocusInt = isFocus ? 1 : 0;

    const sql = `INSERT INTO todos (id, userId, title, description, isCompleted, createdAt, reminderTime, tags, isFocus, subtasks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [id, userId, title, description || '', isCompleted, createdAt, reminderTime || null, tagsStr, isFocusInt, subtasksStr], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
            id, userId, title, description, isCompleted: false, createdAt, reminderTime, 
            tags: tags || [], isFocus: !!isFocus, subtasks: subtasks || []
        });
    });
});

// Update Todo
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, isCompleted, reminderTime, tags, isFocus, subtasks } = req.body;

    // Build dynamic update query
    let updates = [];
    let params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (isCompleted !== undefined) { updates.push('isCompleted = ?'); params.push(isCompleted ? 1 : 0); }
    if (reminderTime !== undefined) { updates.push('reminderTime = ?'); params.push(reminderTime); }
    if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }
    if (isFocus !== undefined) { updates.push('isFocus = ?'); params.push(isFocus ? 1 : 0); }
    if (subtasks !== undefined) { updates.push('subtasks = ?'); params.push(JSON.stringify(subtasks)); }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const sql = `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`;

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        res.json({ message: 'Todo updated successfully' });
    });
});

// Delete Todo
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM todos WHERE id = ?`;
    
    db.run(sql, [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        res.json({ message: 'Todo deleted successfully' });
    });
});

module.exports = router;
