const WebSocket = require("ws");

/**
 * @typedef {Object} MessageData
 * @property {string} userId - The sender's unique ID
 * @property {string} username - The sender's username
 * @property {"stop_typing" | "message" | "typing" | "join" | "leave" | "disconnect"} type - The message type
 * @property {string} [text] - The message content (if applicable)
 * @property {string} roomId - The room where the message was sent
 * @property {string} [timestamp] - The time the message was sent
 */

/**
 * @param {string} rawMessage
 * @returns {MessageData}
 */
function parseMessage(rawMessage) {
  try {
    const message = JSON.parse(rawMessage);

    if (
      !message.userId ||
      !message.username ||
      !message.type ||
      !message.roomId
    ) {
      throw new Error("Invalid message format");
    }

    return message;
  } catch (err) {
    console.error("Error parsing message:", err);
    return null;
  }
}

const onlineUsers = new Map(); // Key: userId, Value: { socket, activeRoomId }
const rooms = new Map(); // Key: roomId, Value: Set of userIds

// Create a WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("New client connected");

  // Handle incoming messages from clients
  ws.on("message", (data) => {
    const message = parseMessage(data);

    const { type, roomId, userId } = message;

    switch (type) {
      case "join":
        handleJoinRoom(userId, roomId, ws);
        break;
      case "leave":
        handleLeaveRoom(userId);
        break;
      case "disconnect":
        removeUser(userId);
        break;
      case "message":
      case "stop_typing":
      case "typing":
        broadcastToRoom(userId, type, message);
        break;
      default:
        console.warn("Unknown type received: ", type);
    }
  });

  // Handle client disconnect
  ws.on("close", () => {
    for (const [userId, userData] of onlineUsers.entries()) {
      if (userData.socket === ws) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Handle User joing a room
function handleJoinRoom(userId, roomId, ws) {
  // Remove user from previous room
  handleLeaveRoom(userId);

  onlineUsers.set(userId, { socket: ws, activeRoomId: roomId });

  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }

  rooms.get(roomId).add(userId);

  console.log(`User ${userId} joined room ${roomId}`);
}

// Handle User Leaving a room
function handleLeaveRoom(userId) {
  if (onlineUsers.has(userId)) {
    const previousRoom = onlineUsers.get(userId).activeRoomId;
    if (previousRoom && rooms.has(previousRoom)) {
      rooms.get(previousRoom).delete(userId);

      if (rooms.get(previousRoom).size === 0) {
        rooms.delete(previousRoom);
      }
    }

    onlineUsers.set(userId, {
      socket: onlineUsers.get(userId).socket,
      activeRoomId: null,
    });
  }
}

// Send to all messages in a room
function broadcastToRoom(senderId, type, messageData) {
  const roomId = messageData.roomId;

  if (!roomId || !rooms.has(roomId)) return;

  console.log(`Broadcasting ${type} in room ${roomId}`);

  rooms.get(roomId).forEach((userId) => {
    console.log("Users in room", roomId, " are ", userId);

    const user = onlineUsers.get(userId);
    if (!user) return;

    const isTyping = type === "typing" || type === "stop_typing";
    const shouldSend = !isTyping || senderId !== userId;

    if (shouldSend)
      onlineUsers.get(userId).socket.send(JSON.stringify(messageData));
  });
}

// Handle User disconnect
function removeUser(userId) {
  if (onlineUsers.has(userId)) {
    handleLeaveRoom(userId);
    onlineUsers.delete(userId);
    console.log(`User ${userId} disconnected`);
  }
}

console.log("WebSocket server is running on ws://localhost:8080");
