const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.static('public'));
app.use(express.json());

// In-memory storage for users, messages, and chat history
const connectedUsers = new Map();
const chatHistory = new Map(); // userId -> messages array
const randomUsers = [];
const randomImages = [];

// Fetch random users and images on server start
async function initializeData() {
  try {
    // Fetch random users
    const usersResponse = await axios.get('https://randomuser.me/api/?results=10', {
      timeout: 10000
    });
    randomUsers.push(...usersResponse.data.results);
    console.log('Fetched random users:', randomUsers.length);

    // Fetch random images with retry logic
    await fetchRandomImages();
  } catch (error) {
    console.error('Error fetching users:', error.message);
    // Continue with server startup even if users fail
  }
}

async function fetchRandomImages() {
  const imageUrls = [
    'https://picsum.photos/v2/list?page=1&limit=50',
    'https://picsum.photos/v2/list?page=2&limit=50'
  ];

  for (const url of imageUrls) {
    try {
      console.log(`Trying to fetch images from: ${url}`);
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      randomImages.push(...response.data);
      console.log(`Fetched ${response.data.length} images from ${url}`);
      console.log('Total random images:', randomImages.length);
      break; // Successfully fetched, exit loop
    } catch (error) {
      console.error(`Failed to fetch from ${url}:`, error.message);
      continue; // Try next URL
    }
  }

  // If all APIs fail, create fallback images
  if (randomImages.length === 0) {
    console.log('All image APIs failed, creating fallback images...');
    createFallbackImages();
  }
}

function createFallbackImages() {
  // Create fallback images using Picsum Photos direct URLs and other reliable sources
  const fallbackImages = [];
  
  // Generate a mix of different image sizes and IDs from Picsum
  const imageIds = [
    237, 433, 593, 659, 718, 783, 790, 837, 984, 1025,
    1035, 1043, 1074, 1084, 112, 119, 146, 157, 180, 206,
    225, 250, 292, 306, 334, 349, 367, 381, 420, 449,
    500, 548, 564, 585, 628, 683, 691, 730, 774, 798,
    823, 870, 901, 922, 943, 967, 1003, 1015, 1044, 1069
  ];
  
  imageIds.forEach((id, index) => {
    const width = 400 + (index % 3) * 100; // 400, 500, or 600
    const height = 300 + (index % 3) * 100; // 300, 400, or 500
    
    fallbackImages.push({
      id: id.toString(),
      author: 'Picsum Photos',
      width: width,
      height: height,
      url: `https://picsum.photos/id/${id}/${width}/${height}`,
      download_url: `https://picsum.photos/id/${id}/${width}/${height}`
    });
  });
  
  // Add some Unsplash source images as additional fallback
  const categories = ['nature', 'city', 'technology', 'food', 'animals'];
  categories.forEach((category, index) => {
    for (let i = 1; i <= 10; i++) {
      const size = 400 + (i % 3) * 100;
      fallbackImages.push({
        id: `unsplash_${category}_${i}`,
        author: 'Unsplash',
        width: size,
        height: size,
        url: `https://source.unsplash.com/${size}x${size}/?${category}`,
        download_url: `https://source.unsplash.com/${size}x${size}/?${category}`
      });
    }
  });
  
  randomImages.push(...fallbackImages);
  console.log('Created fallback images:', fallbackImages.length);
}

// API Routes
app.get('/api/users', (req, res) => {
  res.json(randomUsers);
});

app.get('/api/images', (req, res) => {
  console.log(`Serving ${randomImages.length} images`);
  res.json(randomImages);
});

app.get('/api/refresh-images', async (req, res) => {
  console.log('Manual refresh of images requested');
  randomImages.length = 0; // Clear existing images
  await fetchRandomImages();
  res.json({ 
    success: true, 
    count: randomImages.length,
    message: `Refreshed with ${randomImages.length} images`
  });
});

app.get('/api/chat-history/:userId', (req, res) => {
  const userId = req.params.userId;
  const history = chatHistory.get(userId) || [];
  res.json(history);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle user login
  socket.on('user_login', (userData) => {
    const userId = userData.id || uuidv4();
    const user = {
      id: userId,
      socketId: socket.id,
      name: userData.name,
      avatar: userData.avatar,
      loginTime: new Date()
    };

    connectedUsers.set(socket.id, user);
    
    // Initialize chat history for new user
    if (!chatHistory.has(userId)) {
      chatHistory.set(userId, []);
    }

    // Send user info back to client
    socket.emit('login_success', user);

    // Broadcast updated user list to all clients
    const userList = Array.from(connectedUsers.values());
    io.emit('users_update', userList);

    // Send chat history to the user
    socket.emit('chat_history', chatHistory.get(userId));

    console.log(`User ${user.name} logged in with ID: ${userId}`);
  });

  // Handle sending messages
  socket.on('send_message', (messageData) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const message = {
      id: uuidv4(),
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      content: messageData.content,
      type: messageData.type || 'text', // text, image
      timestamp: new Date(),
      recipients: messageData.recipients || [] // for direct messages
    };

    // Store message in chat history for sender
    const senderHistory = chatHistory.get(user.id) || [];
    senderHistory.push(message);
    chatHistory.set(user.id, senderHistory);

    // If it's a broadcast message (no specific recipients)
    if (!messageData.recipients || messageData.recipients.length === 0) {
      // Store in all users' chat history
      connectedUsers.forEach((connectedUser) => {
        if (connectedUser.id !== user.id) {
          const userHistory = chatHistory.get(connectedUser.id) || [];
          userHistory.push(message);
          chatHistory.set(connectedUser.id, userHistory);
        }
      });

      // Broadcast to all connected clients
      io.emit('new_message', message);
    } else {
      // Direct message to specific users
      messageData.recipients.forEach(recipientId => {
        // Store in recipient's chat history
        const recipientHistory = chatHistory.get(recipientId) || [];
        recipientHistory.push(message);
        chatHistory.set(recipientId, recipientHistory);

        // Send to recipient if they're online
        const recipientSocket = Array.from(connectedUsers.entries())
          .find(([_, user]) => user.id === recipientId);
        
        if (recipientSocket) {
          io.to(recipientSocket[0]).emit('new_message', message);
        }
      });

      // Send back to sender
      socket.emit('new_message', message);
    }

    console.log(`Message from ${user.name}: ${message.content}`);
  });

  // Handle typing indicators
  socket.on('typing_start', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      socket.broadcast.emit('user_typing', { userId: user.id, userName: user.name });
    }
  });

  socket.on('typing_stop', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      socket.broadcast.emit('user_stop_typing', { userId: user.id });
    }
  });

  // Handle file sharing (images)
  socket.on('share_image', (imageData) => {
    const user = connectedUsers.get(socket.id);
    if (!user) return;

    const message = {
      id: uuidv4(),
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      content: imageData.url,
      type: 'image',
      timestamp: new Date(),
      caption: imageData.caption || ''
    };

    // Store in all users' chat history
    connectedUsers.forEach((connectedUser) => {
      const userHistory = chatHistory.get(connectedUser.id) || [];
      userHistory.push(message);
      chatHistory.set(connectedUser.id, userHistory);
    });

    // Broadcast to all clients
    io.emit('new_message', message);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`User ${user.name} disconnected`);
      connectedUsers.delete(socket.id);
      
      // Broadcast updated user list
      const userList = Array.from(connectedUsers.values());
      io.emit('users_update', userList);
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Allow external connections

// Initialize data and start server
initializeData().then(() => {
  server.listen(PORT, HOST, () => {
    console.log(`Chat server running on http://localhost:${PORT}`);
    console.log(`Network access: http://10.101.191.173:${PORT}`);
    console.log(`Server listening on ${HOST}:${PORT}`);
    console.log('Socket.IO server is ready for connections');
    console.log('\n📱 Share this with your coworkers:');
    console.log(`🔗 Local: http://localhost:${PORT}`);
    console.log(`🌐 Network: http://10.101.191.173:${PORT}`);
  });
}).catch(error => {
  console.error('Failed to initialize server:', error);
  process.exit(1);
});