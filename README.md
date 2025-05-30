# Stream-Line Backend

This is the backend WebSocket server for the **Stream-Line** chat application. It handles real-time communication between clients in group and direct chat rooms.

## 🛠️ Tech Stack

- Node.js
- WebSocket (`ws` library)
- Firestore for message persistence and room management (front-end manages this)

## 🚀 Features

- Real-time messaging in rooms and DMs
- User join/leave and presence tracking
- Typing indicators
- Supports system messages (e.g., "User left the group")
- Clean socket connection lifecycle

## 📦 Running Locally

```bash
# Install dependencies
npm install

# Start the server
node server.js
```

The server listens on port 8080 by default.

🌍 Deployment

This server can be deployed to platforms like Render or Fly.io.

📄 License

MIT
