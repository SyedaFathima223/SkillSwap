// project/backend/server.js
// Use PRECISE contentFetchId

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// const bodyParser = require('body-parser'); // express.json() is preferred now
require('dotenv').config();

const app = express();

// --- Middleware ---
app.use(cors()); // Allows requests from your frontend domain
// app.use(bodyParser.json()); // Use express.json() instead
app.use(express.json()); // Parses incoming JSON requests (needed for req.body)
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data (optional, for form submissions)

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI, {
    // useNewUrlParser: true, // No longer needed in Mongoose 6+
    // useUnifiedTopology: true // No longer needed in Mongoose 6+
})
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1); // Exit if DB connection fails
    });

// --- Mongoose Schemas --- (Keep these as they were)

// User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true }, // Ensure unique usernames
    // password: { type: String, required: true }, // IMPORTANT: Store HASHED password, not plain text
    skills: [String],
    interests: [String],
    bio: { type: String, default: "" },
    location: { type: String, default: "" } // Added location
});

// *** SECURITY WARNING: Implement Password Hashing! ***
// You MUST hash passwords before saving them. Use a library like 'bcrypt'.
// Example (conceptual - install bcrypt: npm install bcrypt):
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
// userSchema.pre('save', async function(next) {
//   if (!this.isModified('password')) return next();
//   this.password = await bcrypt.hash(this.password, saltRounds);
//   next();
// });
// userSchema.methods.comparePassword = function(candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password);
// };
const User = mongoose.model('User', userSchema);


// Review schema
const reviewSchema = new mongoose.Schema({
    reviewer: { type: String, required: true },
    reviewedUser: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});
const Review = mongoose.model('Review', reviewSchema);

// Schedule schema
const scheduleSchema = new mongoose.Schema({
    skill: { type: String, required: true },
    teacher: { type: String, required: true },
    learner: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' }
});
const Schedule = mongoose.model('Schedule', scheduleSchema);

// Message schema
const messageSchema = new mongoose.Schema({
    sender: { type: String, required: true },
    recipient: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);


// --- API Routes ---

// Route to register a user (Improved)
app.post('/register', async (req, res) => {
    console.log('POST /register hit');
    try {
        const { username, skills, interests, bio, location , password  } = req.body;

        // Basic validation
        if (!username || !skills || !interests /* || !password */) {
            console.log('Registration failed: Missing required fields');
            return res.status(400).json({ message: 'Missing required fields (username, skills, interests).' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            console.log(`Registration failed: Username "${username}" already taken.`);
            return res.status(409).json({ message: 'Username already taken.' }); // 409 Conflict
        }

        // *** TODO: HASH THE PASSWORD HERE before creating the user ***
        // const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create a new user
        const user = new User({
            username,
            password: password, // Save the hashed password
            skills,
            interests,
            bio,
            location
        });

        // Save the user to the database
        await user.save();
        console.log(`User ${username} registered successfully.`);
        res.status(201).json({ message: 'User registered successfully' });

    } catch (err) {
        console.error("Error in /register:", err);
        res.status(500).json({ message: 'Server error during registration', error: err.message });
    }
});

// Route to login a user (NEW - Needs Password Hashing Implemented)
app.post('/login', async (req, res) => {
    console.log('POST /login hit');
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }

        const user = await User.findOne({ username: username });

        if (!user) {
            console.log(`Login failed: User "${username}" not found.`);
            return res.status(401).json({ message: 'Invalid credentials.' }); // Unauthorized
        }

        // *** TODO: COMPARE HASHED PASSWORD ***
        // const isMatch = await user.comparePassword(password); // Use the method defined in the schema
        const isMatch = true; // Placeholder - REMOVE THIS AND USE ACTUAL COMPARISON

        if (!isMatch) {
            console.log(`Login failed: Incorrect password for user "${username}".`);
            return res.status(401).json({ message: 'Invalid credentials.' }); // Unauthorized
        }

        console.log(`User ${username} logged in successfully.`);
        // Send back username to store in frontend localStorage
        res.status(200).json({ message: 'Login successful', username: user.username });

    } catch (err) {
        console.error("Error in /login:", err);
        res.status(500).json({ message: 'Server error during login', error: err.message });
    }
});


// Route to get all skills (or users offering skills) - Keep as is or refine if needed
app.get('/skills', async (req, res) => {
    console.log('GET /skills hit');
    try {
        // This currently returns a list of {username, skill} pairs.
        // Consider if just returning unique skills or users with skills is better.
        const users = await User.find({}, 'username skills'); // Fetch only username and skills
        const skillsList = [];
        users.forEach(user => {
            user.skills.forEach(skill => {
                if (skill) { // Ensure skill is not empty
                   skillsList.push({ username: user.username, skill });
                }
            });
        });
        res.status(200).json(skillsList);
    } catch (err) {
        console.error("Error in /skills:", err);
        res.status(500).json({ message: 'Error fetching skills', error: err.message });
    }
});

// Route to get all unique users (for messaging list) - NEW
app.get('/users', async (req, res) => {
    console.log('GET /users hit');
    try {
        const users = await User.find({}, 'username').sort({ username: 1 }); // Fetch only usernames, sorted
        res.status(200).json(users.map(u => u.username)); // Return array of usernames
    } catch (err) {
         console.error("Error in /users:", err);
         res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
});


// Route to get user profile by username (Keep as is)
app.get('/users/:username', async (req, res) => {
     const username = req.params.username;
     console.log(`GET /users/${username} hit`);
    try {
        // Exclude password from the result
        const user = await User.findOne({ username: username }, '-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error(`Error in /users/${username}:`, err);
        res.status(500).json({ message: 'Error fetching user profile', error: err.message });
    }
});

// Route to get details for a specific skill (Keep as is)
app.get('/skills/:skillName', async (req, res) => {
    const skillName = req.params.skillName;
    console.log(`GET /skills/${skillName} hit`);
    try {
        // Find users who have this skill, select only username and bio
        const usersWithSkill = await User.find({ skills: skillName }, 'username bio');

        if (usersWithSkill.length === 0) {
            return res.status(404).json({ message: 'No users found with that skill' });
        }

        const skillDetails = {
            skillName: skillName,
            users: usersWithSkill // users is already an array of {username, bio}
        };
        res.status(200).json(skillDetails);
    } catch (err) {
        console.error(`Error in /skills/${skillName}:`, err);
        res.status(500).json({ message: 'Error fetching skill details', error: err.message });
    }
});

// Route to search for users and skills (Keep as is)
app.get('/search', async (req, res) => {
    const { query } = req.query;
    console.log(`GET /search?query=${query} hit`);
    try {
        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        const regex = new RegExp(query, 'i'); // Case-insensitive regex

        // Find users matching username, exclude password
        const users = await User.find({ username: regex }, '-password');

        // Find unique skills matching the query across all users
        const distinctSkills = await User.distinct('skills', { skills: regex });

        res.status(200).json({ users, skills: distinctSkills });
    } catch (err) {
        console.error(`Error in /search?query=${query}:`, err);
        res.status(500).json({ message: 'Error searching', error: err.message });
    }
});

// --- Messaging Routes --- (Keep as is)
// Route to send a new message
app.post('/messages', async (req, res) => {
    console.log('POST /messages hit');
    try {
        const { sender, recipient, content } = req.body;
        if (!sender || !recipient || !content) {
             return res.status(400).json({ message: 'Sender, recipient, and content are required.' });
        }
        const newMessage = new Message({ sender, recipient, content });
        await newMessage.save();
        console.log(`Message sent from ${sender} to ${recipient}`);
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (err) {
        console.error("Error in POST /messages:", err);
        res.status(500).json({ message: 'Error sending message', error: err.message });
    }
});

// Route to get messages between two users
app.get('/messages/:user1/:user2', async (req, res) => {
    const { user1, user2 } = req.params;
    console.log(`GET /messages/${user1}/${user2} hit`);
    try {
        const messages = await Message.find({
            $or: [
                { sender: user1, recipient: user2 },
                { sender: user2, recipient: user1 }
            ]
        }).sort({ timestamp: 1 }); // Sort by time ascending (oldest first)
        res.status(200).json(messages);
    } catch (err) {
        console.error(`Error in GET /messages/${user1}/${user2}:`, err);
        res.status(500).json({ message: 'Error fetching messages', error: err.message });
    }
});

// --- Scheduling Routes --- (Keep as is)
// Route to create a new schedule/booking
app.post('/schedules', async (req, res) => {
     console.log('POST /schedules hit');
    try {
        const { skill, teacher, learner, startTime, endTime } = req.body;
         if (!skill || !teacher || !learner || !startTime || !endTime) {
             return res.status(400).json({ message: 'All schedule fields are required.' });
        }
        // Optional: Add validation for start/end times
        const newSchedule = new Schedule({ skill, teacher, learner, startTime, endTime });
        await newSchedule.save();
         console.log(`Schedule created for skill ${skill} between ${teacher} and ${learner}`);
        res.status(201).json({ message: 'Schedule created successfully', schedule: newSchedule });
    } catch (err) {
        console.error("Error in POST /schedules:", err);
        res.status(500).json({ message: 'Error creating schedule', error: err.message });
    }
});

// Route to get schedules for a specific user (as teacher or learner)
app.get('/schedules/:username', async (req, res) => {
    const { username } = req.params;
    console.log(`GET /schedules/${username} hit`);
    try {
        const schedules = await Schedule.find({
            $or: [{ teacher: username }, { learner: username }]
        }).sort({ startTime: 1 }); // Sort by start time ascending
        res.status(200).json(schedules);
    } catch (err) {
        console.error(`Error in GET /schedules/${username}:`, err);
        res.status(500).json({ message: 'Error fetching schedules', error: err.message });
    }
});


// --- Review Routes --- (Keep as is)
// Route to create a new review
app.post('/reviews', async (req, res) => {
    console.log('POST /reviews hit');
    try {
        const { reviewer, reviewedUser, rating, comment } = req.body;
        if (!reviewer || !reviewedUser || !rating || !comment) {
             return res.status(400).json({ message: 'Reviewer, reviewed user, rating, and comment are required.' });
        }
        const newReview = new Review({ reviewer, reviewedUser, rating, comment });
        await newReview.save();
        console.log(`Review created by ${reviewer} for ${reviewedUser}`);
        res.status(201).json({ message: 'Review created successfully' });
    } catch (err) {
        console.error("Error in POST /reviews:", err);
        res.status(500).json({ message: 'Error creating review', error: err.message });
    }
});

// Route to get reviews for a specific user
app.get('/reviews/:reviewedUser', async (req, res) => {
    const { reviewedUser } = req.params;
    console.log(`GET /reviews/${reviewedUser} hit`);
    try {
        const reviews = await Review.find({ reviewedUser: reviewedUser })
                                    .sort({ timestamp: -1 }); // Sort newest first
        res.status(200).json(reviews);
    } catch (err) {
        console.error(`Error in GET /reviews/${reviewedUser}:`, err);
        res.status(500).json({ message: 'Error fetching reviews', error: err.message });
    }
});

// --- Dashboard Data Route (NEW) ---
app.get('/dashboard-data/:username', async (req, res) => {
    const { username } = req.params;
    console.log(`GET /dashboard-data/${username} hit`);
    try {
        // 1. Get User's own skills and interests
        const user = await User.findOne({ username: username }, 'skills interests');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 2. Get Upcoming Schedules (modify logic as needed)
        const now = new Date();
        const upcomingSchedules = await Schedule.find({
            $or: [{ teacher: username }, { learner: username }],
            startTime: { $gte: now }, // Start time is in the future
            status: { $in: ['pending', 'confirmed'] } // Only pending or confirmed
        }).sort({ startTime: 1 }).limit(5); // Limit to 5 upcoming

        // 3. Get Recent Messages (e.g., count of unread, or latest conversations)
        // This is simplified - real unread count needs more logic (e.g., 'read' flag in schema)
        const recentMessages = await Message.find({
             $or: [{ sender: username }, { recipient: username }]
         }).sort({ timestamp: -1 }).limit(10); // Get 10 most recent messages involving the user

        // 4. Recommended Skills (Placeholder Logic)
        // Simple example: Find skills taught by others that match the user's interests
        let recommendedSkills = [];
        if (user.interests && user.interests.length > 0) {
             recommendedSkills = await User.aggregate([
                 { $match: { username: { $ne: username }, skills: { $in: user.interests } } }, // Find others teaching what user wants to learn
                 { $unwind: "$skills" }, // Deconstruct the skills array
                 { $match: { skills: { $in: user.interests } } }, // Filter skills to match interests
                 { $group: { _id: "$skills" } }, // Group by skill name to get unique skills
                 { $limit: 5 } // Limit recommendations
             ]).then(results => results.map(r => r._id)); // Extract skill names
         }


        res.status(200).json({
            mySkills: user.skills || [],
            myInterests: user.interests || [],
            upcomingSchedules: upcomingSchedules,
            recentMessages: recentMessages, // Send recent messages for potential display
            recommendedSkills: recommendedSkills
        });

    } catch (err) {
        console.error(`Error in GET /dashboard-data/${username}:`, err);
        res.status(500).json({ message: 'Error fetching dashboard data', error: err.message });
    }
});


// --- Start the Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running successfully on http://localhost:${PORT}`);
});