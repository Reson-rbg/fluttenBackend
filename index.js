const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');
const checkInRoutes = require('./routes/check_ins');
const focusSessionRoutes = require('./routes/focus_sessions');
const badgeRoutes = require('./routes/badges');
const templateRoutes = require('./routes/templates');
const plazaRoutes = require('./routes/plaza');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/check-ins', checkInRoutes);
app.use('/api/focus-sessions', focusSessionRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/plaza', plazaRoutes);

app.get('/', (req, res) => {
    res.send('Flutter Backend is running...');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
