const messagesEl = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const sendButton = document.querySelector(".chat-form button");
const socket = io();

function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createBadgeElement(label) {
  const badge = document.createElement("span");
  badge.className = "badge-pill";
  badge.textContent = label;
  return badge;
}

function renderMessage(message) {
  const messageRow = document.createElement("div");
  messageRow.className = "message";

  const pfp = document.createElement("img");
  pfp.className = "chat-pfp";
  pfp.src = message.pfp || "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png";
  pfp.alt = `${message.username || "User"} avatar`;

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";

  const header = document.createElement("div");
  header.className = "message-header";

  const usernameEl = document.createElement("strong");
  usernameEl.textContent = message.username || "Unknown";
  header.appendChild(usernameEl);

  const badgesEl = document.createElement("span");
  badgesEl.className = "badges";
  (message.badges || []).slice(0, 5).forEach((badge) => {
    badgesEl.appendChild(createBadgeElement(badge));
  });
  header.appendChild(badgesEl);

  const timestampEl = document.createElement("small");
  timestampEl.className = "message-timestamp";
  timestampEl.textContent = formatTimestamp(message.createdAt);
  header.appendChild(timestampEl);

  const body = document.createElement("p");
  body.textContent = message.content || "";

  messageContent.appendChild(header);
  messageContent.appendChild(body);

  messageRow.appendChild(pfp);
  messageRow.appendChild(messageContent);
  messagesEl.appendChild(messageRow);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showEmptyState() {
  messagesEl.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "message";

  const emptyContent = document.createElement("div");
  emptyContent.className = "message-content";

  const heading = document.createElement("strong");
  heading.textContent = "No messages yet.";

  const text = document.createElement("p");
  text.textContent = "Send the first message to start the public chat.";

  emptyContent.appendChild(heading);
  emptyContent.appendChild(text);
  empty.appendChild(emptyContent);
  messagesEl.appendChild(empty);
}

socket.on("connect", () => {
  console.log("Connected to chat socket");
});

socket.on("chatHistory", (messages) => {
  messagesEl.innerHTML = "";
  if (!Array.isArray(messages) || messages.length === 0) {
    showEmptyState();
    return;
  }

  messages.forEach(renderMessage);
});

socket.on("chatMessage", (message) => {
  if (!message || !message.content) return;
  renderMessage(message);
});

socket.on("connect_error", (error) => {
  console.error("Chat socket connect error:", error);
});

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const content = chatInput.value.trim();
  if (!content) {
    return;
  }

  socket.emit("chatMessage", { content });
  chatInput.value = "";
  chatInput.focus();
});

sendButton.style.cssText = `
  width: 60px;
  border: none;
  border-radius: 6px;
  font-size: 20px;
  background: #6f057a;
  box-shadow: inset 0 -3px #0003;
  color: white;
  font-family: Pixelify Sans;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
`;

sendButton.onmouseenter = () => {
  sendButton.style.transform = "translateY(-2px)";
  sendButton.style.background = "#7c068d";
  sendButton.style.boxShadow =
    "inset 0 -3px #0005, 0 4px 10px rgba(0,0,0,0.2)";
};

sendButton.onmouseleave = () => {
  sendButton.style.transform = "translateY(0px)";
  sendButton.style.background = "#6f057a";
  sendButton.style.boxShadow = "inset 0 -3px #0003";
};

sendButton.onmousedown = () => {
  sendButton.style.transform = "translateY(1px) scale(0.98)";
};

sendButton.onmouseup = () => {
  sendButton.style.transform = "translateY(-2px) scale(1)";
};

sendButton.style.cssText = `
  width: 60px;
  border: none;
  border-radius: 6px;
  font-size: 20px;
  background: #6f057a;
  box-shadow: inset 0 -3px #0003;
  color: white;
  font-family: Pixelify Sans;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
`;

sendButton.onmouseenter = () => {
  sendButton.style.transform = "translateY(-2px)";
  sendButton.style.background = "#7c068d";
  sendButton.style.boxShadow =
    "inset 0 -3px #0005, 0 4px 10px rgba(0,0,0,0.2)";
};

sendButton.onmouseleave = () => {
  sendButton.style.transform = "translateY(0px)";
  sendButton.style.background = "#6f057a";
  sendButton.style.boxShadow = "inset 0 -3px #0003";
};

sendButton.onmousedown = () => {
  sendButton.style.transform = "translateY(1px) scale(0.98)";
};

sendButton.onmouseup = () => {
  sendButton.style.transform = "translateY(-2px) scale(1)";
};