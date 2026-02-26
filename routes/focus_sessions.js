const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

// Get all focus sessions for a user
router.get('/', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const sql = `SELECT * FROM focus_sessions WHERE userId = ? ORDER BY startTime DESC`;
    db.all(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get focus sessions for a specific todo
router.get('/todo/:todoId', (req, res) => {
    const { todoId } = req.params;
    const sql = `SELECT * FROM focus_sessions WHERE todoId = ? ORDER BY startTime DESC`;
    db.all(sql, [todoId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get weekly stats
router.get('/weekly-stats', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    // Get sessions from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const sql = `SELECT * FROM focus_sessions WHERE userId = ? AND startTime >= ? ORDER BY startTime DESC`;
    db.all(sql, [userId, sevenDaysAgo], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const totalMinutes = rows.reduce((acc, r) => acc + (r.duration || 0), 0);
        const sessionCount = rows.length;

        // Group by todoId to find most focused task
        const byTodo = {};
        rows.forEach(r => {
            if (!byTodo[r.todoId]) byTodo[r.todoId] = 0;
            byTodo[r.todoId] += r.duration || 0;
        });

        let topTodoId = null;
        let topMinutes = 0;
        Object.entries(byTodo).forEach(([tid, mins]) => {
            if (mins > topMinutes) { topTodoId = tid; topMinutes = mins; }
        });

        res.json({ totalMinutes, sessionCount, topTodoId, topMinutes });
    });
});

// Create a focus session
router.post('/', (req, res) => {
    const { userId, todoId, startTime, endTime, duration } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const id = uuidv4();
    const sql = `INSERT INTO focus_sessions (id, userId, todoId, startTime, endTime, duration) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [id, userId, todoId || null, startTime, endTime, duration], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id, userId, todoId, startTime, endTime, duration });
    });
});

module.exports = router;
