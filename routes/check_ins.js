const express = require('express');
const router = express.Router();
const db = require('../database');
const { v4: uuidv4 } = require('uuid');

// Get all check-ins for a user
router.get('/', (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    const sql = `SELECT * FROM check_ins WHERE userId = ? ORDER BY checkInTime DESC`;
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Check if user checked in today
router.get('/today', (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    // Get start of today in ISO format (approximate for simplicity, or handle via JS Date)
    // Actually, storing ISO strings, we can query by string matching prefix 'YYYY-MM-DD'
    // but timezones can be tricky.
    // Let's list all check-ins and filter in JS for simplicity or use SQLite date functions.
    
    // SQLite: date(checkInTime)
    const sql = `SELECT * FROM check_ins WHERE userId = ? AND date(checkInTime) = date('now', 'localtime')`;
    
    // Better: let client handle "today"? Or simple 'like'.
    // Given the previous local memory implementation, let's select checkins for the user that match today's date string prefix.
    
    const now = new Date();
    // YYYY-MM-DD
    const todayPrefix = now.toISOString().split('T')[0];
    
    const sqlSearch = `SELECT * FROM check_ins WHERE userId = ? AND checkInTime LIKE ?`;
    
    db.get(sqlSearch, [userId, `${todayPrefix}%`], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ hasCheckedIn: !!row });
    });
});

// Create Check-in
router.post('/', (req, res) => {
    const { userId, note, mood } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    const id = uuidv4();
    const checkInTime = new Date().toISOString();
    const moodInt = mood !== undefined ? mood : null;

    const sql = `INSERT INTO check_ins (id, userId, checkInTime, note, mood) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [id, userId, checkInTime, note || '', moodInt], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id, userId, checkInTime, note, mood: moodInt });
    });
});

module.exports = router;
