const express = require('express');
const session = require('cookie-session');
const { PORT, SERVER_SESSION_SECRET } = require('./config.js');
const path = require('path');




let app = express();

// Setting cookies in your Express app
app.use(session({
    secret: SERVER_SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,  // 1 day
        secure: true,                 // Cookie will only be sent over HTTPS
        sameSite: 'None',             // Allow cookies in cross-origin iframes
    }
}));


// Serve static files from 'wwwroot' directory
app.use(express.static(path.join(__dirname, 'public')));


// Use session middleware
app.use(session({
    keys: [SERVER_SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// Serve index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



// Import custom routes
app.use(require('./routes/auth.js'));
app.use(require('./routes/hubs.js'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error
    res.status(500).send('Something went wrong!'); // Send a generic error message
});

// Start the server
app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));

