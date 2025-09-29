# WebSocket Chat Application

A real-time chat application built with Node.js, Socket.IO, and Express that allows users to communicate in real-time with support for text messages and image sharing.

## Features

✅ **Real-time messaging** using WebSockets (Socket.IO)  
✅ **Random user profiles** from https://randomuser.me/api/?results=10  
✅ **Image gallery** from https://picsum.photos/v2/list?page=2&limit=100  
✅ **Login screen** with random user selection or custom profile creation  
✅ **Live typing indicators**  
✅ **Image sharing** with captions  
✅ **Chat history** for each user  
✅ **Online users list**  
✅ **Responsive design**  
✅ **Emoji support**  
✅ **Modern UI** with gradients and animations  

## Requirements Met

1. ✅ Uses WebSockets (Socket.IO) for real-time communication
2. ✅ Integrates with random users API (https://randomuser.me/api/?results=10)
3. ✅ Uses Socket.IO for chat implementation
4. ✅ Integrates with random images API (https://picsum.photos/v2/list?page=2&limit=100)
5. ✅ Has index.html file in the public directory
6. ✅ Allows real-time message sending and receiving
7. ✅ Includes login screen for user authentication
8. ✅ Supports image sending and receiving
9. ✅ Maintains chat history for each user
10. ✅ Built with Node.js and WebSocket technology

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd "c:\Users\P1956593\source\repos\Hackathon_WebSockets"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Open your browser and navigate to:**
   ```
   http://localhost:3000
   ```

## Usage

### Login
1. **Random User Profiles:** Select from 10 randomly generated user profiles
2. **Custom Profile:** Create your own profile with a custom name and optional avatar URL

### Chat Features
- **Send Messages:** Type in the message input and press Enter or click the send button
- **Image Sharing:** Click the image button to browse and send images from the gallery
- **Emoji Support:** Click the emoji button for quick emoji insertion
- **Typing Indicators:** See when other users are typing
- **Online Users:** View all currently connected users in the sidebar

### Image Gallery
- Browse through 100+ random images
- Click on any image to send it to the chat
- Add optional captions to your images

## Project Structure

```
Hackathon_WebSockets/
├── package.json          # Project dependencies and scripts
├── server.js            # Main server file with Socket.IO implementation
├── README.md            # This file
├── public/              # Client-side files
│   ├── index.html       # Main HTML file with login and chat UI
│   ├── app.js          # Client-side JavaScript with Socket.IO client
│   └── style.css       # Comprehensive CSS styling
```

## Technical Implementation

### Server-Side (server.js)
- **Express.js** for serving static files and API endpoints
- **Socket.IO** for WebSocket communication
- **Axios** for fetching data from external APIs
- **In-memory storage** for users, messages, and chat history
- **API endpoints** for users, images, and chat history

### Client-Side (app.js)
- **Socket.IO client** for real-time communication
- **Modern JavaScript** with async/await
- **Event-driven architecture** for user interactions
- **Responsive design** with mobile support

### APIs Used
1. **Random Users API:** https://randomuser.me/api/?results=10
2. **Random Images API:** https://picsum.photos/v2/list?page=2&limit=100

## Socket Events

### Client to Server
- `user_login` - User authentication
- `send_message` - Send text message
- `share_image` - Send image with caption
- `typing_start` - User starts typing
- `typing_stop` - User stops typing

### Server to Client
- `login_success` - Successful authentication
- `users_update` - Updated list of online users
- `new_message` - New message received
- `chat_history` - Historical messages
- `user_typing` - Someone is typing
- `user_stop_typing` - Typing stopped

## Features in Detail

### Real-time Communication
- Instant message delivery using WebSocket connections
- Live typing indicators with automatic timeout
- Connection status handling and auto-reconnection

### User Management
- Random user profile selection from external API
- Custom profile creation with name and avatar
- Online users list with real-time updates
- Unique user identification and session management

### Message System
- Text message support with HTML escaping for security
- Image sharing with caption support
- Message timestamps and sender information
- Persistent chat history for each user

### Modern UI/UX
- Responsive design that works on desktop and mobile
- Beautiful gradient backgrounds and modern styling
- Smooth animations and transitions
- Emoji support and image preview modals

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development

To contribute or modify the application:

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **The server will automatically restart** when you make changes to server.js

3. **For client-side changes,** refresh the browser to see updates

## Security Considerations

- HTML content is escaped to prevent XSS attacks
- Input validation and length limits
- Secure WebSocket connections
- No sensitive data storage (in-memory only)

## Future Enhancements

- User authentication with persistent accounts
- Private messaging between users
- File upload support for custom images
- Message encryption
- Chat rooms/channels
- User roles and moderation
- Message search functionality
- Database integration for persistent storage

## Troubleshooting

**Connection Issues:**
- Ensure the server is running on port 3000
- Check firewall settings
- Verify WebSocket support in browser

**Image Loading Issues:**
- Images are loaded from external APIs
- Check internet connection
- Some images may fail to load due to CORS or availability

## License

This project is open source and available under the MIT License.