// Node.js backend using Express with PostgreSQL (server.js)
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors=require('cors')

const app = express();
const PORT = 3000;

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'news_aggregator_db',
    password: '9843045567',
    port: 5432,
});
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//route register
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if the username or email already exists in the database
        const existingUser = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
        if (existingUser.rows.length > 0) {
            if (existingUser.rows[0].username === username) {
                return res.status(400).json({ error: 'Username already taken' });
            }
            if (existingUser.rows[0].email === email) {
                return res.status(400).json({ error: 'Email already registered' });
            }
        }

        // Insert new user into the database
        const newUser = await pool.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *', [username, email, password]);
        res.status(201).json(newUser.rows[0]); // Send back the newly created user
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

//route login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = $1';
    console.log("api login requested");

    try {
        const result = await pool.query(query, [username]);
        console.log("User query executed:", result.rows);

        if (result.rows.length === 1) {
            const user = result.rows[0];
            console.log("User found:", user);

            // Check if the provided password matches the user's password
            if (user.password === password) {
                console.log("Password matched for user:", user.username);

                // User credentials are valid, now check if the username is in user_profile table
                const profileQuery = 'SELECT * FROM user_profile WHERE username = $1';
                const profileResult = await pool.query(profileQuery, [username]);
                console.log("Profile query executed:", profileResult.rows);

                if (profileResult.rows.length === 1) {
                    // Username is present in user_profile table
                    console.log("User profile found for:", user.username);
                    res.status(200).json({ message: 'Login successful', user: user, responseNumber: 1 });
                } else {
                    // Username is not present in user_profile table
                    console.log("No user profile found for:", user.username);
                    res.status(200).json({ message: 'Login successful', user: user, responseNumber: 2 });
                }
            } else {
                console.log("Invalid password for user:", user.username);
                res.status(401).send('Invalid password');
            }
        } else {
            console.log("User not found with username:", username);
            res.status(401).send('Invalid username');
        }

    } catch (error) {
        console.error("Error occurred:", error);
        res.status(500).send('Error logging in');
    }
});




//route insert profile
app.post('/api/profile', async (req, res) => {
    const { username, full_name, birth_date, bio } = req.body;

    try {
        // Insert new user profile into the user_profile table
        const newUserProfile = await pool.query(
            'INSERT INTO user_profile (username, full_name, birth_date, bio) VALUES ($1, $2, $3, $4) RETURNING *',
            [username, full_name, birth_date, bio]
        );

        res.status(201).json(newUserProfile.rows[0]); // Send back the newly created user profile
    } catch (error) {
        console.error('Error creating user profile:', error);
        res.status(500).json({ error: 'Failed to create user profile' });
    }
});



// Route to check user
app.post('/api/checkuser', async (req, res) => {
    const { username } = req.body;

    try {
        // Query the users table to check if the username exists
        const userQuery = await pool.query('SELECT * FROM user_profile WHERE username = $1', [username]);

        // If the username exists, return the user profile
        if (userQuery.rows.length > 0) {
            res.status(200).json({ exists: true, userProfile: userQuery.rows[0] });
        } else {
            res.status(200).json({ exists: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error checking user:', error);
        res.status(500).json({ error: 'Failed to check user' });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});