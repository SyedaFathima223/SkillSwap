// project/frontend/script.js

// --- Configuration ---
const API_BASE_URL = 'http://localhost:5000'; // Your backend URL

// --- Helper Functions ---
function getCurrentUser() {
    return localStorage.getItem('currentUser');
}

function checkLoginState() {
    // ... (keep this function exactly as in the previous step) ...
     const user = getCurrentUser();
    const logoutLink = document.getElementById('logout-link');
    const navLogin = document.getElementById('nav-login');
    const navRegister = document.getElementById('nav-register');
    const protectedNavItems = ['nav-dashboard', 'nav-profile', 'nav-messaging', 'nav-scheduling']; // IDs of nav items for logged-in users
    const publicNavItems = ['nav-login', 'nav-register']; // IDs for logged-out users

    if (user) {
        // Logged in
        if (logoutLink) logoutLink.style.display = 'inline';
        publicNavItems.forEach(id => {
             const item = document.getElementById(id);
             if (item) item.style.display = 'none';
         });
        protectedNavItems.forEach(id => {
            const item = document.getElementById(id);
            if (item) item.style.display = 'inline';
        });
         // Update profile link text if possible
         const profileLink = document.getElementById('nav-profile');
         if (profileLink) profileLink.textContent = `${user}'s Profile`;

    } else {
        // Logged out
        if (logoutLink) logoutLink.style.display = 'none';
         publicNavItems.forEach(id => {
             const item = document.getElementById(id);
             if (item) item.style.display = 'inline';
         });
        protectedNavItems.forEach(id => {
            const item = document.getElementById(id);
            if (item) item.style.display = 'none';
        });
         const profileLink = document.getElementById('nav-profile');
         if (profileLink) profileLink.textContent = `My Profile`; // Reset text
    }
}

function handleLogout() {
    // ... (keep this function exactly as in the previous step) ...
    localStorage.removeItem('currentUser');
    alert('You have been logged out.');
    window.location.href = 'login.html'; // Redirect to login page
}

function displayLoading(elementId, message = "Loading...") {
    // ... (keep this function exactly as in the previous step) ...
     const element = document.getElementById(elementId);
    if (element) {
        // Make loading more generic - might not always be a list
        element.innerHTML = `<p>${message}</p>`;
    }
}

function displayError(elementId, message = "An error occurred.") {
    // ... (keep this function exactly as in the previous step) ...
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<p style="color: red;">${message}</p>`;
    }
}

// Function to get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// --- API Call Functions ---

// Registration (Keep as is)
async function handleRegistration(event) {
    // ... (keep this function exactly as in the previous step) ...
     event.preventDefault(); // Stop the form from submitting the default way

    // Get form data
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value; // Get password
    const location = document.getElementById('location').value; // Assuming you might want to save this later
    const bio = document.getElementById('bio').value;
    // Split skills/interests by newline and trim whitespace, filter empty lines
    const skills = document.getElementById('skills').value.split('\n').map(s => s.trim()).filter(s => s);
    const interests = document.getElementById('interests').value.split('\n').map(i => i.trim()).filter(i => i);

    // Basic validation (you might want more)
    if (!username || !password || skills.length === 0 || interests.length === 0) {
        alert('Please fill in required fields (Username, Password, Skills, Interests).');
        return;
    }

    const userData = {
        username,
        password, // Send password to backend (for hashing)
        skills,
        interests,
        bio,
        location
    };

    try {
        const response = await fetch(`${API_BASE_URL}/register`, { // Ensure backend is running on port 5000
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const result = await response.json(); // Get response body even for errors

        if (response.ok && response.status === 201) { // 201 Created is typical for successful POST
            alert('Registration successful! Please log in.');
            // Redirect to the login page
            window.location.href = 'login.html';
        } else {
            // Display error message from backend if available, otherwise a generic one
            alert(`Registration failed: ${result.message || 'Please try again.'}`);
        }
    } catch (error) {
        console.error('Error during registration fetch:', error);
        alert('An error occurred during registration. Please check your connection and try again.');
    }
}

// Login (Keep as is)
async function handleLogin(event) {
    // ... (keep this function exactly as in the previous step) ...
     event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const result = await response.json();
        if (response.ok) {
            localStorage.setItem('currentUser', result.username); // Store username
            alert('Login successful!');
            window.location.href = 'dashboard.html'; // Redirect to dashboard
        } else {
            alert(`Login failed: ${result.message || 'Invalid credentials.'}`);
            document.getElementById('password').value = ''; // Clear password field
        }
    } catch (error) {
        console.error('Login fetch error:', error);
        alert('An error occurred during login. Please check connection or console.');
    }
}

// Fetch and Display Dashboard Data (Keep as is)
async function fetchAndDisplayDashboardData() {
    // ... (keep this function exactly as in the previous step) ...
    const currentUser = getCurrentUser();
    if (!currentUser) return; // Should be handled by page load check

    const loadingMsg = document.getElementById('dashboard-loading-msg');
    const usernameSpan = document.getElementById('dashboard-username');
    if (usernameSpan) usernameSpan.textContent = currentUser;

    displayLoading('dashboard-schedule-list', 'Loading schedules...');
    displayLoading('dashboard-message-summary', 'Loading messages...');
    displayLoading('dashboard-my-skills', 'Loading your skills...');
    displayLoading('dashboard-recommended-skills', 'Loading recommendations...');


    try {
        const response = await fetch(`${API_BASE_URL}/dashboard-data/${currentUser}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (loadingMsg) loadingMsg.style.display = 'none'; // Hide loading message

        // Populate Upcoming Schedules
        const scheduleList = document.getElementById('dashboard-schedule-list');
        if (scheduleList) {
            scheduleList.innerHTML = ''; // Clear loading/previous
            if (data.upcomingSchedules && data.upcomingSchedules.length > 0) {
                data.upcomingSchedules.forEach(sch => {
                    const li = document.createElement('li');
                    const otherUser = sch.teacher === currentUser ? sch.learner : sch.teacher;
                    const startTime = new Date(sch.startTime);
                    li.innerHTML = `<strong>${sch.skill}</strong> with ${otherUser} on ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()} (${sch.status})`;
                    scheduleList.appendChild(li);
                });
            } else {
                scheduleList.innerHTML = '<li>No upcoming sessions.</li>';
            }
        }

        // Populate Recent Messages Summary
        const messageSummary = document.getElementById('dashboard-message-summary');
         if (messageSummary) {
             messageSummary.innerHTML = ''; // Clear loading/previous
             if (data.recentMessages && data.recentMessages.length > 0) {
                 // Example: Just show a count or generic message
                 messageSummary.innerHTML = `<p>You have ${data.recentMessages.length} recent message(s) in your conversations.</p>`;
             } else {
                 messageSummary.innerHTML = '<p>No recent message activity.</p>';
             }
         }

        // Populate My Skills
        const mySkillsList = document.getElementById('dashboard-my-skills');
        if (mySkillsList) {
            mySkillsList.innerHTML = ''; // Clear loading/previous
            if (data.mySkills && data.mySkills.length > 0) {
                data.mySkills.forEach(skill => {
                    const li = document.createElement('li');
                    li.textContent = skill;
                    mySkillsList.appendChild(li);
                });
            } else {
                mySkillsList.innerHTML = '<li>You haven\'t listed any skills yet.</li>';
            }
        }

        // Populate Recommended Skills
        const recommendedSkillsList = document.getElementById('dashboard-recommended-skills');
        if (recommendedSkillsList) {
            recommendedSkillsList.innerHTML = ''; // Clear loading/previous
            if (data.recommendedSkills && data.recommendedSkills.length > 0) {
                data.recommendedSkills.forEach(skill => {
                    const li = document.createElement('li');
                    li.innerHTML = `<a href="search.html?query=${encodeURIComponent(skill)}">${skill}</a>`; // Link to search
                    recommendedSkillsList.appendChild(li);
                });
            } else {
                recommendedSkillsList.innerHTML = '<li>No specific recommendations currently. Add interests to your profile!</li>';
            }
        }

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
         if (loadingMsg) loadingMsg.textContent = ''; // Clear loading message on error too
        displayError('dashboard-schedule-list', 'Could not load schedules.');
        displayError('dashboard-message-summary', 'Could not load message summary.');
        displayError('dashboard-my-skills', 'Could not load your skills.');
        displayError('dashboard-recommended-skills', 'Could not load recommendations.');
    }
}

// Messaging Functions (Keep as is)
let chatWithUser = null;
async function populateUserList() { /* ... keep ... */
 const usersList = document.getElementById('users-list');
    const currentUser = getCurrentUser();
     displayLoading('users-list');

    try {
        const response = await fetch(`${API_BASE_URL}/users`); // Use new /users endpoint
        if (!response.ok) throw new Error('Failed to fetch users');
        const usernames = await response.json();

        usersList.innerHTML = ''; // Clear loading/previous
        if (usernames.length <= 1) { // Only self showing
            usersList.innerHTML = '<li>No other users found.</li>';
            return;
        }
        usernames.forEach(username => {
            if (username !== currentUser) { // Don't list self
                const userItem = document.createElement('li');
                userItem.textContent = username;
                userItem.dataset.username = username; // Store username for selection
                userItem.addEventListener('click', () => selectUser(username));
                usersList.appendChild(userItem);
            }
        });
    } catch (error) {
        console.error('Error fetching user list:', error);
        displayError('users-list', 'Error loading users.');
    }
}
async function selectUser(username) { /* ... keep ... */
    chatWithUser = username;
    const chatContainer = document.getElementById('chat-container');
    const chatUsernameSpan = document.getElementById('chat-with-username');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');

     // Highlight selected user in list
     document.querySelectorAll('#users-list li').forEach(li => {
         if (li.dataset.username === username) {
             li.style.backgroundColor = '#e9ecef'; // Highlight color
             li.style.fontWeight = 'bold';
         } else {
             li.style.backgroundColor = ''; // Remove highlight
             li.style.fontWeight = 'normal';
         }
     });

    if (chatContainer) chatContainer.style.display = 'flex'; // Use flex for panel layout
    if (chatUsernameSpan) chatUsernameSpan.textContent = chatWithUser;
    if (messageInput) messageInput.disabled = false;
    if (sendButton) sendButton.disabled = false;

    await fetchAndDisplayMessages();
}
async function fetchAndDisplayMessages() { /* ... keep ... */
 const messageArea = document.getElementById('message-area');
    const currentUser = getCurrentUser();
    if (!chatWithUser || !currentUser || !messageArea) return;

     messageArea.innerHTML = '<p>Loading messages...</p>'; // Loading state

    try {
        const response = await fetch(`${API_BASE_URL}/messages/${currentUser}/${chatWithUser}`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const messages = await response.json();

        messageArea.innerHTML = ''; // Clear loading/previous
        if (messages.length === 0) {
             messageArea.innerHTML = '<p>No messages yet. Start the conversation!</p>';
        } else {
            messages.forEach(message => {
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message');
                messageDiv.classList.add(message.sender === currentUser ? 'sent' : 'received');
                 // Basic text sanitization (replace < and >) to prevent HTML injection
                 messageDiv.textContent = message.content; //.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                 messageArea.appendChild(messageDiv);
            });
            // Scroll to bottom
            messageArea.scrollTop = messageArea.scrollHeight;
        }
    } catch (error) {
        console.error('Error fetching messages:', error);
         messageArea.innerHTML = '<p style="color: red;">Error loading messages.</p>';
    }
}
async function sendMessage() { /* ... keep ... */
 const messageInput = document.getElementById('message-input');
    const currentUser = getCurrentUser();
    const sendButton = document.getElementById('send-button');
    if (!messageInput || !chatWithUser || !currentUser || !sendButton) return;

    const content = messageInput.value.trim();
    if (!content) return;

    try {
         messageInput.disabled = true; // Disable while sending
         sendButton.disabled = true;
         sendButton.textContent = 'Sending...';


        const response = await fetch(`${API_BASE_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender: currentUser, recipient: chatWithUser, content: content })
        });

        if (response.ok) {
            messageInput.value = ''; // Clear input on success
            fetchAndDisplayMessages(); // Refresh messages
        } else {
             const result = await response.json();
             console.error('Error sending message:', result.message);
             alert(`Failed to send message: ${result.message || 'Server error'}`);
        }
    } catch (error) {
        console.error('Error sending message fetch:', error);
         alert('An error occurred while sending the message.');
    } finally {
         // Re-enable input/button regardless of success/failure
         if(messageInput) messageInput.disabled = false;
         if(sendButton) {
             sendButton.disabled = false;
             sendButton.textContent = 'Send';
         }
         if(messageInput) messageInput.focus(); // Focus input again
    }
}

// Scheduling Functions (Keep as is)
async function fetchAndDisplaySchedules() { /* ... keep ... */
 const scheduleList = document.getElementById('schedule-list');
    const currentUser = getCurrentUser();
    if (!currentUser || !scheduleList) return;

    displayLoading('schedule-list');

    try {
        const response = await fetch(`${API_BASE_URL}/schedules/${currentUser}`);
         if (!response.ok) throw new Error('Failed to fetch schedules');
        const schedules = await response.json();

        scheduleList.innerHTML = ''; // Clear loading/previous
        if (schedules.length === 0) {
            scheduleList.innerHTML = '<li>No schedules found.</li>';
            return;
        }

        schedules.forEach(schedule => {
            const li = document.createElement('li');
             li.classList.add('schedule-item'); // Add class for styling
             const startTime = new Date(schedule.startTime);
             const endTime = new Date(schedule.endTime);
             li.innerHTML = `
                <p><strong>Skill:</strong> ${schedule.skill}</p>
                <p><strong>Teacher:</strong> ${schedule.teacher}</p>
                <p><strong>Learner:</strong> ${schedule.learner}</p>
                <p><strong>Start:</strong> ${startTime.toLocaleString()}</p>
                <p><strong>End:</strong> ${endTime.toLocaleString()}</p>
                <p><strong>Status:</strong> ${schedule.status}</p>
                `;
            scheduleList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching schedules:', error);
         displayError('schedule-list', 'Error loading schedules.');
    }
}
async function createBooking(event) { /* ... keep ... */
 event.preventDefault();
    const currentUser = getCurrentUser();
    if (!currentUser) {
         alert("Please log in to create a booking.");
         return;
     }

    const skillInput = document.getElementById('skill');
    const teacherInput = document.getElementById('teacher');
    const learnerInput = document.getElementById('learner'); // Hidden input now
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');

    const skill = skillInput.value;
    const teacher = teacherInput.value;
    const learner = currentUser; // Learner is always the current user
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;


     if (!skill || !teacher || !startTime || !endTime) {
         alert("Please fill in all booking details.");
         return;
     }
      if (teacher === currentUser) {
         alert("You cannot book a session with yourself as the teacher.");
         return;
     }
      // Basic date validation
     if (new Date(startTime) >= new Date(endTime)) {
         alert("End time must be after start time.");
         return;
     }
     if (new Date(startTime) < new Date()) {
         alert("Start time cannot be in the past.");
         return;
     }


    const bookingData = { skill, teacher, learner, startTime, endTime };

    const submitButton = event.target.querySelector('button[type="submit"]');
    try {
         if(submitButton) {
             submitButton.disabled = true; // Disable button
             submitButton.textContent = 'Requesting...';
         }

        const response = await fetch(`${API_BASE_URL}/schedules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingData)
        });
         const result = await response.json(); // Read body for success/error

        if (response.ok && response.status === 201) {
            alert('Booking request sent successfully! Status is pending.');
            document.getElementById('schedule-form').reset(); // Clear form
             // Re-set learner hidden field after reset
             if(learnerInput && currentUser) learnerInput.value = currentUser;
             document.getElementById('current-learner-username').textContent = currentUser;

            fetchAndDisplaySchedules(); // Refresh the schedule list
        } else {
            alert(`Error creating booking: ${result.message || 'Server error'}`);
        }
    } catch (error) {
        console.error('Error creating booking fetch:', error);
         alert('An error occurred while creating the booking.');
    } finally {
         if(submitButton) {
             submitButton.disabled = false; // Re-enable button
             submitButton.textContent = 'Request Booking';
         }
    }
}


// --- NEW Profile & Review Functions ---
async function loadProfilePage() {
    const currentUser = getCurrentUser();
    const profileUsername = getUrlParameter('user') || currentUser; // Get username from URL or default to logged-in user

    if (!profileUsername) {
        // If not logged in and no user specified in URL, redirect
        if (!currentUser) {
            alert("Please log in or specify a user profile to view.");
            window.location.href = 'login.html';
            return;
        }
        // Otherwise (if logged in but no URL param), they are viewing their own profile
    }

    // Update page title and heading
    document.title = `${profileUsername}'s Profile - SkillSwap`;
    const heading = document.getElementById('profile-heading');
    if (heading) heading.textContent = `${profileUsername}'s Profile`;
    const reviewsUserSpan = document.getElementById('reviews-for-username');
    if (reviewsUserSpan) reviewsUserSpan.textContent = profileUsername;

    await fetchUserProfile(profileUsername);
    await fetchAndDisplayReviews(profileUsername);

    // Show/Hide Edit link and Review form
    const editLinkContainer = document.getElementById('edit-profile-link-container');
    const reviewSection = document.getElementById('leave-review-section');
    const reviewedUsernameInput = document.getElementById('reviewed-username-input');

    if (profileUsername === currentUser) {
        // Viewing own profile
        if (editLinkContainer) editLinkContainer.style.display = 'block';
        if (reviewSection) reviewSection.style.display = 'none'; // Hide review form for self
         // Set nav link active
         const profileNav = document.getElementById('nav-profile');
         if (profileNav) profileNav.classList.add('active');
    } else {
        // Viewing someone else's profile
        if (editLinkContainer) editLinkContainer.style.display = 'none';
        if (reviewSection) reviewSection.style.display = 'block'; // Show review form
        if (reviewedUsernameInput) reviewedUsernameInput.value = profileUsername; // Set hidden input for submission
         // Deactivate nav link if active
          const profileNav = document.getElementById('nav-profile');
         if (profileNav) profileNav.classList.remove('active');
    }
}

async function fetchUserProfile(username) {
    const profileDetailsDiv = document.getElementById('profile-details');
    displayLoading('profile-details');

    try {
        const response = await fetch(`${API_BASE_URL}/users/${username}`);
        if (!response.ok) {
            if (response.status === 404) throw new Error('User not found.');
            throw new Error('Failed to fetch profile.');
        }
        const user = await response.json();

        profileDetailsDiv.innerHTML = `
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Bio:</strong> ${user.bio || '<em>No bio provided.</em>'}</p>
            <p><strong>Location:</strong> ${user.location || '<em>Not specified.</em>'}</p>
            <p><strong>Skills (Teaching):</strong></p>
            <ul>${user.skills && user.skills.length > 0 ? user.skills.map(s => `<li>${s}</li>`).join('') : '<li><em>No skills listed.</em></li>'}</ul>
            <p><strong>Interests (Learning):</strong></p>
            <ul>${user.interests && user.interests.length > 0 ? user.interests.map(i => `<li>${i}</li>`).join('') : '<li><em>No interests listed.</em></li>'}</ul>
            `;
    } catch (error) {
        console.error(`Error fetching profile for ${username}:`, error);
        displayError('profile-details', `Error loading profile: ${error.message}`);
    }
}

async function fetchAndDisplayReviews(username) {
    const reviewsContainer = document.getElementById('reviews-container');
    if (!reviewsContainer) {
        console.error('Error: reviews-container element not found in the DOM.');
        return;
    }

    displayLoading('reviews-container');

    try {
        const response = await fetch(`${API_BASE_URL}/reviews/${username}`);

        if (!response.ok) {
            let errorMessage = `Failed to fetch reviews. Status: ${response.status}`;
            try {
                const errorBody = await response.json();
                if (errorBody && errorBody.message) {
                    errorMessage += ` - ${errorBody.message}`;
                }
            } catch (jsonError) {
                console.error('Failed to parse error JSON:', jsonError);
            }
            throw new Error(errorMessage);
        }

        const reviews = await response.json();
        console.log('Raw reviews data received:', reviews); // Inspect the data

        reviewsContainer.innerHTML = ''; // Clear loading

        if (reviews && reviews.length > 0) {
            reviews.forEach(review => {
                console.log('Processing review:', review); // Inspect each review object
                const reviewDiv = document.createElement('div');
                reviewDiv.classList.add('review');

                // --- ADJUST THESE LINES BASED ON YOUR ACTUAL REVIEW OBJECT STRUCTURE ---
                const reviewerName = review.reviewer;
                const ratingValue = review.rating;
                const commentText = review.comment;
                const timestampValue = review.timestamp; // Ensure this is a valid date format

                const reviewDate = new Date(timestampValue);
                const stars = '⭐'.repeat(ratingValue) + '☆'.repeat(5 - ratingValue);

                reviewDiv.innerHTML = `
                    <p><strong>${reviewerName}</strong> rated ${stars} (${ratingValue}/5)</p>
                    <p>${commentText ? commentText.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '<em>No comment provided.</em>'}</p>
                    <p><small>${reviewDate.toLocaleDateString()}</small></p>
                `;
                reviewsContainer.appendChild(reviewDiv);
            });
        } else {
            reviewsContainer.innerHTML = '<p>No reviews yet.</p>';
        }

    } catch (error) {
        console.error(`Error fetching and displaying reviews for ${username}:`, error);
        displayError('reviews-container', `Could not load reviews: ${error.message}`);
    }
}
async function submitReview(event) {
    event.preventDefault();
    const currentUser = getCurrentUser();
    const reviewedUser = document.getElementById('reviewed-username-input').value;
    const rating = document.getElementById('rating').value;
    const comment = document.getElementById('comment').value;

    if (!currentUser) {
        alert("You must be logged in to leave a review.");
        return;
    }
    if (!reviewedUser || !rating || !comment) {
        alert("Please provide a rating and a comment.");
        return;
    }

    const reviewData = { reviewer: currentUser, reviewedUser, rating, comment };

    try {
        const submitButton = event.target.querySelector('button[type="submit"]');
        if(submitButton) submitButton.disabled = true;

        const response = await fetch(`${API_BASE_URL}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reviewData)
        });
         const result = await response.json();

        if (response.ok && response.status === 201) {
            alert('Review submitted successfully!');
            document.getElementById('review-form').reset();
            fetchAndDisplayReviews(reviewedUser); // Refresh reviews list
        } else {
            alert(`Error submitting review: ${result.message || 'Server error'}`);
        }
    } catch (error) {
        console.error('Error submitting review fetch:', error);
        alert('An error occurred while submitting the review.');
    } finally {
         const submitButton = event.target.querySelector('button[type="submit"]');
         if(submitButton) submitButton.disabled = false;
    }
}

// --- NEW Edit Profile Functions ---
async function populateEditProfileForm() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        // Should be caught by page protection, but double-check
        alert("Login required to edit profile.");
        window.location.href = 'login.html';
        return;
    }

    // Get references to form elements
    const usernameInput = document.getElementById('edit-username');
    const locationInput = document.getElementById('edit-location');
    const bioInput = document.getElementById('edit-bio');
    const skillsInput = document.getElementById('edit-skills');
    const interestsInput = document.getElementById('edit-interests');

    // Set username (non-editable)
    if (usernameInput) usernameInput.value = currentUser;

    // Fetch current profile data
    try {
        const response = await fetch(`${API_BASE_URL}/users/${currentUser}`);
        if (!response.ok) throw new Error('Failed to fetch profile data.');
        const user = await response.json();

        // Populate form fields
        if (locationInput) locationInput.value = user.location || '';
        if (bioInput) bioInput.value = user.bio || '';
        if (skillsInput) skillsInput.value = user.skills ? user.skills.join('\n') : '';
        if (interestsInput) interestsInput.value = user.interests ? user.interests.join('\n') : '';

    } catch (error) {
        console.error("Error fetching data for edit profile:", error);
        alert("Could not load your current profile data. Please try refreshing.");
        // Optionally disable the form or show an error message within it
    }
}

async function handleUpdateProfile(event) {
    event.preventDefault();
    const currentUser = getCurrentUser();
    if (!currentUser) {
        alert("Authentication error. Please log in again.");
        return;
    }

    // Get updated data from form
    const location = document.getElementById('edit-location').value;
    const bio = document.getElementById('edit-bio').value;
    const skills = document.getElementById('edit-skills').value.split('\n').map(s => s.trim()).filter(s => s);
    const interests = document.getElementById('edit-interests').value.split('\n').map(i => i.trim()).filter(i => i);

    const updatedData = { location, bio, skills, interests };

    try {
        const submitButton = event.target.querySelector('button[type="submit"]');
        if(submitButton) submitButton.disabled = true;

        // *** IMPORTANT: Need a backend route for this! ***
        // Assuming PUT /users/:username
        const response = await fetch(`${API_BASE_URL}/users/${currentUser}`, {
            method: 'PUT', // Use PUT for updates
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
         const result = await response.json();

        if (response.ok) {
            alert('Profile updated successfully!');
            window.location.href = 'profile.html'; // Redirect back to profile view
        } else {
            alert(`Error updating profile: ${result.message || 'Server error'}`);
        }
    } catch (error) {
        console.error('Error updating profile fetch:', error);
        alert('An error occurred while updating the profile.');
    } finally {
         const submitButton = event.target.querySelector('button[type="submit"]');
         if(submitButton) submitButton.disabled = false;
    }
}

// --- NEW Search Functions ---
async function handleSearch() {
    const query = document.getElementById('searchInput').value.trim();
    const resultsDiv = document.getElementById('searchResults');

    if (!query) {
        resultsDiv.innerHTML = '<p>Please enter a search term.</p>';
        return;
    }

    displayLoading('searchResults', `Searching for "${query}"...`);

    try {
        const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search request failed.');
        const results = await response.json();

        displaySearchResults(results);

    } catch (error) {
        console.error('Error during search:', error);
        displayError('searchResults', 'Search failed. Please try again.');
    }
}

function displaySearchResults(results) {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = ''; // Clear previous results/loading

    let html = '';

    // Display User Results
    if (results.users && results.users.length > 0) {
        html += '<h4>Users Found:</h4><div class="users-grid">'; // Use grid layout
        results.users.forEach(user => {
            html += `
                <div class="user-card">
                    <h3><a href="profile.html?user=${encodeURIComponent(user.username)}">${user.username}</a></h3>
                    <p>${user.bio || '<em>No bio available.</em>'}</p>
                    </div>`;
        });
         html += '</div>';
    } else {
        html += '<p>No users found matching your query.</p>';
    }

     html += '<hr style="margin: 20px 0;">'; // Separator

    // Display Skill Results
    if (results.skills && results.skills.length > 0) {
        html += '<h4>Skills Found:</h4><ul style="list-style: disc; padding-left: 20px;">'; // Simple list for skills
        results.skills.forEach(skill => {
            html += `<li><a href="skill-details.html?skill=${encodeURIComponent(skill)}">${skill}</a></li>`;
        });
         html += '</ul>';
    } else {
        html += '<p>No skills found matching your query.</p>';
    }

    resultsDiv.innerHTML = html;
}

// --- NEW Skill Details Functions ---
async function fetchAndDisplaySkillDetails() {
    const skillName = getUrlParameter('skill');
    const heading = document.getElementById('skill-details-heading');
    const usersDiv = document.getElementById('skill-details-users');

    if (!skillName) {
        if (heading) heading.textContent = 'Skill Not Specified';
        displayError('skill-details-users', 'No skill specified in the URL.');
        return;
    }

    document.title = `Skill: ${skillName} - SkillSwap`;
    if (heading) heading.textContent = `Skill: ${skillName}`;
    displayLoading('skill-details-users', `Loading users who teach ${skillName}...`);

    try {
        const response = await fetch(`${API_BASE_URL}/skills/${encodeURIComponent(skillName)}`);

        if (!response.ok) {
             if (response.status === 404) throw new Error(`No users found teaching "${skillName}".`);
             throw new Error('Failed to fetch skill details.');
        }
        const skillDetails = await response.json();

        usersDiv.innerHTML = ''; // Clear loading
        if (skillDetails.users && skillDetails.users.length > 0) {
             skillDetails.users.forEach(user => {
                 const card = document.createElement('div');
                 card.classList.add('user-card'); // Reuse user card style
                 card.innerHTML = `
                    <h3><a href="profile.html?user=${encodeURIComponent(user.username)}">${user.username}</a></h3>
                    <p>${user.bio || '<em>No bio available.</em>'}</p>
                     <a href="scheduling.html?teacher=${encodeURIComponent(user.username)}&skill=${encodeURIComponent(skillName)}" class="button" style="margin-top: 10px; width: auto; font-size: 0.9rem;">Book Session</a>
                 `;
                 usersDiv.appendChild(card);
             });
         } else {
             // This case should ideally be caught by 404, but handle defensively
             usersDiv.innerHTML = `<p>No users found teaching "${skillName}".</p>`;
         }

    } catch (error) {
        console.error(`Error fetching details for skill ${skillName}:`, error);
        displayError('skill-details-users', `Error loading details: ${error.message}`);
    }
}

// --- NEW Homepage Skills Function ---
async function fetchAndDisplayHomepageSkills() {
     const skillsDisplay = document.getElementById('skillsDisplay');
     if (!skillsDisplay) return;

     displayLoading('skillsDisplay', 'Loading available skills...');

     try {
         const response = await fetch(`${API_BASE_URL}/skills`); // Fetch skill/user pairs
         if (!response.ok) throw new Error('Failed to fetch skills list.');
         const skillsList = await response.json();

         skillsDisplay.innerHTML = ''; // Clear loading

         if (skillsList.length === 0) {
             skillsDisplay.innerHTML = '<p>No skills available yet. Be the first to register!</p>';
             return;
         }

         // Process to get unique skills and maybe one teacher example
         const uniqueSkills = {};
         skillsList.forEach(item => {
             if (!uniqueSkills[item.skill]) {
                 uniqueSkills[item.skill] = item.username; // Store first teacher found for the skill
             }
         });

         // Limit the number displayed on homepage
         const skillsToDisplay = Object.entries(uniqueSkills).slice(0, 6); // Show max 6

         if (skillsToDisplay.length === 0) {
              skillsDisplay.innerHTML = '<p>No skills listed yet.</p>';
              return;
          }

         skillsToDisplay.forEach(([skill, teacher]) => {
             const card = document.createElement('div');
             card.classList.add('skill-card');
             card.innerHTML = `
                <h3><a href="skill-details.html?skill=${encodeURIComponent(skill)}">${skill}</a></h3>
                <p>Taught by users like <a href="profile.html?user=${encodeURIComponent(teacher)}">${teacher}</a> and others.</p>
                <a href="skill-details.html?skill=${encodeURIComponent(skill)}" class="button" style="margin-top: 10px; width: auto; font-size: 0.9rem;">View Details</a>
            `;
            skillsDisplay.appendChild(card);
        });

    } catch(error) {
        console.error("Error fetching homepage skills:", error);
        displayError('skillsDisplay', 'Could not load skills list.');
    }
}


// --- Event Listeners Setup ---
window.addEventListener('load', () => {
    console.log("Window loaded.");

    // Set current year in footer
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // Always check login state to update nav/logout link
    checkLoginState();
    const currentUser = getCurrentUser();

    // Attach logout handler
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    // --- Page Specific Initialisation ---
    const currentPagePath = window.location.pathname;

    // Redirect if trying to access protected page while logged out
    const protectedPages = ['dashboard.html', 'profile.html', 'messaging.html', 'scheduling.html', 'edit-profile.html'];
    const onProtectedPage = protectedPages.some(page => currentPagePath.includes(page));

    if (onProtectedPage && !currentUser) {
        console.log("Not logged in, redirecting to login.");
        alert('Please log in to access this page.');
        window.location.href = 'login.html';
        return; // Stop further execution for this page
    }

    // Login Page
    if (currentPagePath.includes('login.html') && document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
    }

    // Register Page
    if (currentPagePath.includes('Register.html') && document.getElementById('userForm')) {
        document.getElementById('userForm').addEventListener('submit', handleRegistration);
    }

    // Dashboard Page
    if (currentPagePath.includes('dashboard.html') && document.querySelector('.dashboard')) {
        fetchAndDisplayDashboardData();
    }

    // Messaging Page
    if (currentPagePath.includes('messaging.html') && document.getElementById('users-list')) {
        populateUserList();
        const sendButton = document.getElementById('send-button');
        const messageInput = document.getElementById('message-input');
        if(sendButton) sendButton.addEventListener('click', sendMessage);
        if(messageInput) messageInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    // Scheduling Page
    if (currentPagePath.includes('scheduling.html') && document.getElementById('schedule-form')) {
        const learnerUsernameSpan = document.getElementById('current-learner-username');
        const learnerInput = document.getElementById('learner'); // Hidden input
        if(learnerUsernameSpan && currentUser) learnerUsernameSpan.textContent = currentUser;
        if(learnerInput && currentUser) learnerInput.value = currentUser;

        fetchAndDisplaySchedules();
        document.getElementById('schedule-form').addEventListener('submit', createBooking);
    }

    // Home Page
    if (currentPagePath.includes('index.html') && document.getElementById('skillsDisplay')) {
         fetchAndDisplayHomepageSkills(); // Fetch skills for homepage
    }

    // Profile Page
     if (currentPagePath.includes('profile.html') && document.getElementById('profile-details')) {
         loadProfilePage(); // Combined function to load profile, reviews, and setup form listener

         // Add listener only if the form exists (i.e., viewing other's profile)
         const reviewForm = document.getElementById('review-form');
         if (reviewForm && document.getElementById('leave-review-section').style.display !== 'none') {
              reviewForm.addEventListener('submit', submitReview);
         }
     }

     // Edit Profile Page
     if (currentPagePath.includes('edit-profile.html') && document.getElementById('editProfileForm')) {
         populateEditProfileForm(); // Fill form with current data
         document.getElementById('editProfileForm').addEventListener('submit', handleUpdateProfile);
     }

      // Search Page
      if (currentPagePath.includes('search.html') && document.getElementById('searchButton')) {
          document.getElementById('searchButton').addEventListener('click', handleSearch);
          document.getElementById('searchInput').addEventListener('keypress', (event) => {
              if (event.key === 'Enter') {
                  handleSearch();
              }
          });
           // Optional: Trigger search if query parameter exists on load
           const initialQuery = getUrlParameter('query');
           if (initialQuery) {
               document.getElementById('searchInput').value = initialQuery;
               handleSearch();
           }
      }
      if (window.location.pathname.includes('register.html') && document.getElementById('userForm')) {
        document.getElementById('userForm').addEventListener('submit', handleRegistration);
        console.log("Registration form submit listener attached."); // Add this for verification
    }

      // Skill Details Page
      if (currentPagePath.includes('skill-details.html') && document.getElementById('skill-details-users')) {
           fetchAndDisplaySkillDetails();
      }


    console.log("Event listeners attached.");
});