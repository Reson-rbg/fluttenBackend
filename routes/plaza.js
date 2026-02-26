const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

// Get plaza events (anonymous, paginated)
router.get('/', (req, res) => {
    const limit = parseInt(req.query.limit) || 30;
    const offset = parseInt(req.query.offset) || 0;

    const sql = `SELECT id, eventType, eventDescription, createdAt FROM plaza_events ORDER BY createdAt DESC LIMIT ? OFFSET ?`;
    db.all(sql, [limit, offset], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Anonymize: assign "用户X" labels based on row index
        const anonymized = rows.map((row, i) => ({
            ...row,
            anonymousName: `用户${String.fromCharCode(65 + (row.id.charCodeAt(0) % 26))}`
        }));
        res.json(anonymized);
    });
});

// Post plaza event (called internally when achievements are unlocked)
router.post('/', (req, res) => {
    const { userId, eventType, eventDescription } = req.body;
    if (!userId || !eventType) return res.status(400).json({ error: 'userId and eventType are required' });

    // Check user's plaza visibility setting
    db.get(`SELECT showOnPlaza FROM user_settings WHERE userId = ?`, [userId], (err, settings) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // Only publish if user opted in (showOnPlaza = 1)
        if (!settings || settings.showOnPlaza !== 1) {
            return res.json({ message: 'Event not published (plaza sharing disabled)' });
        }

        const id = uuidv4();
        const createdAt = new Date().toISOString();
        const sql = `INSERT INTO plaza_events (id, userId, eventType, eventDescription, createdAt) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [id, userId, eventType, eventDescription, createdAt], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id, eventType, eventDescription, createdAt });
        });
    });
});

// Get/Update user settings
router.get('/settings', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    db.get(`SELECT * FROM user_settings WHERE userId = ?`, [userId], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row || { userId, showOnPlaza: 0 });
    });
});

router.put('/settings', (req, res) => {
    const { userId, showOnPlaza } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const sql = `INSERT INTO user_settings (userId, showOnPlaza) VALUES (?, ?) ON CONFLICT(userId) DO UPDATE SET showOnPlaza = ?`;
    db.run(sql, [userId, showOnPlaza ? 1 : 0, showOnPlaza ? 1 : 0], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ userId, showOnPlaza: !!showOnPlaza });
    });
});

// Data export (all user data as JSON)
router.get('/export', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const data = {};
    db.all(`SELECT * FROM todos WHERE userId = ?`, [userId], (err, todos) => {
        if (err) return res.status(500).json({ error: err.message });
        data.todos = todos;

        db.all(`SELECT * FROM check_ins WHERE userId = ?`, [userId], (err, checkIns) => {
            if (err) return res.status(500).json({ error: err.message });
            data.checkIns = checkIns;

            db.all(`SELECT * FROM focus_sessions WHERE userId = ?`, [userId], (err, sessions) => {
                if (err) return res.status(500).json({ error: err.message });
                data.focusSessions = sessions;

                db.all(`SELECT * FROM user_badges WHERE userId = ?`, [userId], (err, badges) => {
                    if (err) return res.status(500).json({ error: err.message });
                    data.badges = badges;

                    db.all(`SELECT * FROM task_templates WHERE userId = ?`, [userId], (err, templates) => {
                        if (err) return res.status(500).json({ error: err.message });
                        data.templates = templates;

                        data.exportedAt = new Date().toISOString();
                        data.version = '2.0';
                        res.json(data);
                    });
                });
            });
        });
    });
});

module.exports = router;
