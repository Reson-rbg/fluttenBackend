const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

// Get all unlocked badges for a user
router.get('/', (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const sql = `SELECT * FROM user_badges WHERE userId = ? ORDER BY unlockedAt DESC`;
    db.all(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Unlock a badge
router.post('/', (req, res) => {
    const { userId, badgeKey } = req.body;
    if (!userId || !badgeKey) return res.status(400).json({ error: 'userId and badgeKey are required' });

    // Check if already unlocked
    db.get(`SELECT * FROM user_badges WHERE userId = ? AND badgeKey = ?`, [userId, badgeKey], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) return res.json({ ...row, alreadyUnlocked: true });

        const id = uuidv4();
        const unlockedAt = new Date().toISOString();
        const sql = `INSERT INTO user_badges (id, userId, badgeKey, unlockedAt) VALUES (?, ?, ?, ?)`;
        db.run(sql, [id, userId, badgeKey, unlockedAt], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id, userId, badgeKey, unlockedAt });
        });
    });
});

module.exports = router;
