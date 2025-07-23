const express = require('express'); 
const session = require('cookie-session');
const { PORT, SERVER_SESSION_SECRET } = require('./config.js');
const path = require('path');

const app = express();

// 🔧 Enable large JSON and URL-encoded payloads (needed for base64 file uploads)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// 🍪 Secure cookie-based session
app.use(session({
    secret: SERVER_SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,  // 1 day
        secure: true,                 // Only over HTTPS
        sameSite: 'None'             // For cross-site cookies
    }
}));

// 🗂 Serve static files (like index.html, js, css)
app.use(express.static(path.join(__dirname, 'public')));

// 🌐 Import API routes
app.use(require('./routes/auth.js'));
app.use(require('./routes/hubs.js'));

// 📄 Fallback to index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ❌ Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// ▶️ Start server
app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));
