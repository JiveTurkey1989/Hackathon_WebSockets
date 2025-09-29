// Initialize Socket.IO connection
const socket = io();

// Global variables
let currentUser = null;
let randomUsers = [];
let randomImages = [];
let typingTimeout = null;
let isTyping = false;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const userProfiles = document.getElementById('userProfiles');
const customName = document.getElementById('customName');
const customAvatar = document.getElementById('customAvatar');
const customLoginBtn = document.getElementById('customLoginBtn');
const currentUserAvatar = document.getElementById('currentUserAvatar');
const currentUserName = document.getElementById('currentUserName');
const usersList = document.getElementById('usersList');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const typingUser = document.getElementById('typingUser');
const logoutBtn = document.getElementById('logoutBtn');
const imageGalleryBtn = document.getElementById('imageGalleryBtn');
const imageBtn = document.getElementById('imageBtn');
const emojiBtn = document.getElementById('emojiBtn');
const imageGalleryModal = document.getElementById('imageGalleryModal');
const imagePreviewModal = document.getElementById('imagePreviewModal');
const imageGallery = document.getElementById('imageGallery');
const previewImage = document.getElementById('previewImage');
const imageCaption = document.getElementById('imageCaption');
const sendImageBtn = document.getElementById('sendImageBtn');
const closeGalleryBtn = document.getElementById('closeGalleryBtn');
const closePreviewBtn = document.getElementById('closePreviewBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

// Emoji list for quick access
const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '😊', '👍', '👏', '❤️', '🔥', '✨', '🎉', '💯'];

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    showLoading();
    await loadRandomUsers();
    await loadRandomImages();
    hideLoading();
});

// Show/Hide loading overlay
function showLoading() {
    loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Load random users from API
async function loadRandomUsers() {
    try {
        const response = await fetch('/api/users');
        randomUsers = await response.json();
        displayUserProfiles();
    } catch (error) {
        console.error('Error loading random users:', error);
        // Fallback to manual login only
        userProfiles.innerHTML = '<p>Unable to load random users. Please use manual login below.</p>';
    }
}

// Load random images from API
async function loadRandomImages() {
    try {
        const response = await fetch('/api/images');
        randomImages = await response.json();
    } catch (error) {
        console.error('Error loading random images:', error);
        randomImages = []; // Fallback to empty array
    }
}

// Display user profiles for selection
function displayUserProfiles() {
    userProfiles.innerHTML = '';
    
    randomUsers.forEach((user, index) => {
        const profileDiv = document.createElement('div');
        profileDiv.className = 'user-profile';
        profileDiv.dataset.index = index;
        
        const name = `${user.name.first} ${user.name.last}`;
        const avatar = user.picture.medium;
        
        profileDiv.innerHTML = `
            <img src="${avatar}" alt="${name}" onerror="this.src='https://via.placeholder.com/60x60/667eea/white?text=${name.charAt(0)}'">
            <div class="name">${name}</div>
        `;
        
        profileDiv.addEventListener('click', () => {
            selectUserProfile(profileDiv, { name, avatar, id: `user_${index}_${Date.now()}` });
        });
        
        userProfiles.appendChild(profileDiv);
    });
}

// Select a user profile
function selectUserProfile(profileElement, userData) {
    // Remove previous selection
    document.querySelectorAll('.user-profile').forEach(profile => {
        profile.classList.remove('selected');
    });
    
    // Select current profile
    profileElement.classList.add('selected');
    
    // Enable login and set up the login button
    const existingLoginBtn = document.querySelector('.user-profile .login-btn');
    if (existingLoginBtn) {
        existingLoginBtn.remove();
    }
    
    const loginBtn = document.createElement('button');
    loginBtn.className = 'login-btn';
    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Join as ' + userData.name.split(' ')[0];
    loginBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        loginUser(userData);
    });
    
    profileElement.appendChild(loginBtn);
}

// Custom login functionality
customLoginBtn.addEventListener('click', () => {
    const name = customName.value.trim();
    if (!name) {
        alert('Please enter your name');
        return;
    }
    
    const avatar = customAvatar.value.trim() || `https://via.placeholder.com/60x60/667eea/white?text=${name.charAt(0)}`;
    const userData = {
        name,
        avatar,
        id: `custom_${Date.now()}`
    };
    
    loginUser(userData);
});

// Handle Enter key in custom name input
customName.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        customLoginBtn.click();
    }
});

// Login user and switch to chat screen
function loginUser(userData) {
    showLoading();
    currentUser = userData;
    
    // Send login event to server
    socket.emit('user_login', userData);
}

// Socket event listeners
socket.on('login_success', (user) => {
    currentUser = user;
    currentUserAvatar.src = user.avatar;
    currentUserName.textContent = user.name;
    
    // Switch to chat screen
    loginScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
    hideLoading();
    
    // Focus on message input
    messageInput.focus();
});

socket.on('users_update', (users) => {
    updateUsersList(users);
});

socket.on('new_message', (message) => {
    displayMessage(message);
    scrollToBottom();
});

socket.on('chat_history', (messages) => {
    // Clear existing messages
    messagesContainer.innerHTML = '';
    
    // Display all historical messages
    messages.forEach(message => {
        displayMessage(message);
    });
    
    scrollToBottom();
});

socket.on('user_typing', (data) => {
    showTypingIndicator(data.userName);
});

socket.on('user_stop_typing', () => {
    hideTypingIndicator();
});

// Update users list in sidebar
function updateUsersList(users) {
    usersList.innerHTML = '';
    
    users.forEach(user => {
        if (user.id === currentUser.id) return; // Skip current user
        
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        userDiv.innerHTML = `
            <img src="${user.avatar}" alt="${user.name}" onerror="this.src='https://via.placeholder.com/30x30/667eea/white?text=${user.name.charAt(0)}'">
            <span class="name">${user.name}</span>
            <div class="status"></div>
        `;
        
        usersList.appendChild(userDiv);
    });
}

// Display a message in the chat
function displayMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.senderId === currentUser.id ? 'own' : ''}`;
    
    const timestamp = new Date(message.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    let messageContent = '';
    
    if (message.type === 'image') {
        messageContent = `
            <img src="${message.content}" alt="Shared image" class="message-image" onclick="openImagePreview('${message.content}')">
            ${message.caption ? `<div class="image-caption">${escapeHtml(message.caption)}</div>` : ''}
        `;
    } else {
        messageContent = `<div class="message-text">${escapeHtml(message.content)}</div>`;
    }
    
    messageDiv.innerHTML = `
        <img src="${message.senderAvatar}" alt="${message.senderName}" class="avatar" onerror="this.src='https://via.placeholder.com/35x35/667eea/white?text=${message.senderName.charAt(0)}'">
        <div class="message-content">
            <div class="message-header">
                <span class="sender-name">${escapeHtml(message.senderName)}</span>
                <span class="timestamp">${timestamp}</span>
            </div>
            ${messageContent}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
}

// Open image preview modal
function openImagePreview(imageUrl) {
    const img = new Image();
    img.onload = function() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 90%; max-height: 90%;">
                <div class="modal-header">
                    <h3>Image Preview</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" style="text-align: center;">
                    <img src="${imageUrl}" style="max-width: 100%; max-height: 70vh; border-radius: 10px;">
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    };
    img.src = imageUrl;
}

// Scroll to bottom of messages
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Show typing indicator
function showTypingIndicator(userName) {
    typingUser.textContent = userName;
    typingIndicator.style.display = 'block';
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// Message input handling
messageInput.addEventListener('input', () => {
    if (!isTyping) {
        isTyping = true;
        socket.emit('typing_start');
    }
    
    // Clear existing timeout
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }
    
    // Set new timeout
    typingTimeout = setTimeout(() => {
        isTyping = false;
        socket.emit('typing_stop');
    }, 1000);
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

// Send message function
function sendMessage() {
    const content = messageInput.value.trim();
    if (!content) return;
    
    const messageData = {
        content: content,
        type: 'text'
    };
    
    socket.emit('send_message', messageData);
    messageInput.value = '';
    
    // Stop typing indicator
    if (isTyping) {
        isTyping = false;
        socket.emit('typing_stop');
    }
}

// Image gallery functionality
imageGalleryBtn.addEventListener('click', () => {
    displayImageGallery();
    imageGalleryModal.style.display = 'flex';
});

imageBtn.addEventListener('click', () => {
    displayImageGallery();
    imageGalleryModal.style.display = 'flex';
});

closeGalleryBtn.addEventListener('click', () => {
    imageGalleryModal.style.display = 'none';
});

closePreviewBtn.addEventListener('click', () => {
    imagePreviewModal.style.display = 'none';
});

// Display image gallery
function displayImageGallery() {
    imageGallery.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading images...</div>';
    
    if (randomImages.length === 0) {
        imageGallery.innerHTML = '<div style="text-align: center; padding: 20px;"><p>Loading images from server...</p><button onclick="refreshImages()" style="margin-top: 10px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Refresh Gallery</button></div>';
        return;
    }
    
    imageGallery.innerHTML = '';
    
    randomImages.forEach((image, index) => {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'gallery-image';
        
        const img = document.createElement('img');
        img.src = image.download_url;
        img.alt = `Gallery image ${index + 1}`;
        img.loading = 'lazy';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        
        // Add error handling for broken images
        img.onerror = function() {
            // Try alternative URL formats if available
            if (image.url && image.url !== image.download_url) {
                img.src = image.url;
            } else {
                // Show placeholder if image fails to load
                imageDiv.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f0f0f0; color: #666; font-size: 12px; text-align: center;">
                        <div>
                            <i class="fas fa-image" style="font-size: 20px; margin-bottom: 5px;"></i><br>
                            Image unavailable
                        </div>
                    </div>
                `;
                imageDiv.onclick = null; // Remove click handler for broken images
            }
        };
        
        img.onload = function() {
            // Image loaded successfully, add click handler
            imageDiv.addEventListener('click', () => {
                selectImageToSend(image.download_url);
            });
        };
        
        imageDiv.appendChild(img);
        imageGallery.appendChild(imageDiv);
    });
}

// Function to refresh images
function refreshImages() {
    fetch('/api/refresh-images')
        .then(response => response.json())
        .then(data => {
            console.log('Images refreshed:', data);
            // Reload images
            loadRandomImages();
        })
        .catch(error => {
            console.error('Error refreshing images:', error);
            alert('Failed to refresh images. Please try again.');
        });
}

// Select image to send
function selectImageToSend(imageUrl) {
    previewImage.src = imageUrl;
    imageCaption.value = '';
    imageGalleryModal.style.display = 'none';
    imagePreviewModal.style.display = 'flex';
}

// Send selected image
sendImageBtn.addEventListener('click', () => {
    const imageUrl = previewImage.src;
    const caption = imageCaption.value.trim();
    
    const imageData = {
        url: imageUrl,
        caption: caption
    };
    
    socket.emit('share_image', imageData);
    imagePreviewModal.style.display = 'none';
});

// Emoji button functionality
emojiBtn.addEventListener('click', () => {
    showEmojiPicker();
});

// Show emoji picker
function showEmojiPicker() {
    // Create emoji picker
    const emojiPicker = document.createElement('div');
    emojiPicker.className = 'emoji-picker';
    emojiPicker.style.cssText = `
        position: absolute;
        bottom: 70px;
        left: 20px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 10px;
        padding: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 5px;
        z-index: 1000;
    `;
    
    emojis.forEach(emoji => {
        const emojiBtn = document.createElement('button');
        emojiBtn.textContent = emoji;
        emojiBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 1.2em;
            padding: 5px;
            cursor: pointer;
            border-radius: 5px;
        `;
        
        emojiBtn.addEventListener('click', () => {
            messageInput.value += emoji;
            messageInput.focus();
            emojiPicker.remove();
        });
        
        emojiBtn.addEventListener('mouseenter', () => {
            emojiBtn.style.background = '#f0f0f0';
        });
        
        emojiBtn.addEventListener('mouseleave', () => {
            emojiBtn.style.background = 'none';
        });
        
        emojiPicker.appendChild(emojiBtn);
    });
    
    document.body.appendChild(emojiPicker);
    
    // Remove picker when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function removeEmojiPicker(e) {
            if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
                emojiPicker.remove();
                document.removeEventListener('click', removeEmojiPicker);
            }
        });
    }, 100);
}

// Logout functionality
logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        socket.disconnect();
        location.reload();
    }
});

// Close modals when clicking outside
imageGalleryModal.addEventListener('click', (e) => {
    if (e.target === imageGalleryModal) {
        imageGalleryModal.style.display = 'none';
    }
});

imagePreviewModal.addEventListener('click', (e) => {
    if (e.target === imagePreviewModal) {
        imagePreviewModal.style.display = 'none';
    }
});

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle connection errors
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    alert('Connection error. Please check your internet connection and try again.');
});

socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
    if (reason === 'io server disconnect') {
        // Server disconnected the client, try to reconnect
        socket.connect();
    }
});

// Auto-reconnect handling
socket.on('reconnect', (attemptNumber) => {
    console.log('Reconnected after', attemptNumber, 'attempts');
    if (currentUser) {
        socket.emit('user_login', currentUser);
    }
});

// Handle visibility change (tab focus/blur)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentUser) {
        // Tab became visible, ensure we're connected
        if (!socket.connected) {
            socket.connect();
        }
    }
});