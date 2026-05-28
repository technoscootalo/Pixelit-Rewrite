import { renderChatContentWithEmoji } from "./chatEmoji.js";
import { SLUR_BLOCKLIST } from "./blocklist.js";

const messagesEl = document.getElementById("chatMessages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const sendButton = document.querySelector(".chat-form button");
const emojiButton = document.querySelector(".emojiContainer");
const socket = io();

const ROLE_COLOR_MAP = {
  Owner: "#020202",
  "Community Manager": "#69c95d",
  Admin: "#dc6dc1",
  Moderator: "#ab53c4",
  Tester: "#80a1d3",
  Helper: "#4b69c3",
  Developer: "#6a76c7",
  Artist: "#ca964c",
  Verified: "#5ab65b",
  Veteran: "#969a5c",
  Plus: "#5657d3"
};

let currentClientUsername = "";
let currentClientUserId = "";
let activeReplyTarget = null;
let lastMsgUsername = null;
let lastMsgTime = null;

let emojiPopupEl = document.querySelector(".chat-emoji-popup");
let gridContainer = null;

if (!emojiPopupEl) {
  emojiPopupEl = document.createElement("div");
  emojiPopupEl.className = "chat-emoji-popup";
  
  emojiPopupEl.style.cssText = `
    position: absolute;
    bottom: 85px;
    right: 20px;
    width: 340px;
    height: 350px;
    background-color: #55145c;
    box-shadow: inset 0 -0.265vw #410b47, 3px 3px 15px rgba(0, 0, 0, 0.5);
    border-radius: 12px;
    display: none;
    flex-direction: column;
    overflow: hidden;
    z-index: 1000;
    font-family: "Pixelify Sans", sans-serif;
  `;

  const headerBar = document.createElement("div");
  headerBar.textContent = "Pixelit Emoji's";
  headerBar.style.cssText = `
    background-color: #6f057a;
    color: white;
    font-weight: bold;
    font-size: 22px;
    padding: 10px;
    text-align: center;
    border-bottom: 3px solid rgba(255, 255, 255, 0.05);
    letter-spacing: 0.5px;
  `;
  emojiPopupEl.appendChild(headerBar);

  gridContainer = document.createElement("div");
  gridContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    padding: 12px;
    border-radius: 10px;
    max-height: 200px;
    overflow-y: auto;
    overflow-x: hidden;
  `;
  emojiPopupEl.appendChild(gridContainer);

  if (chatForm && chatForm.parentNode) {
    chatForm.parentNode.appendChild(emojiPopupEl);
  }
} else {
  gridContainer = emojiPopupEl.querySelector("div:nth-child(2)");
  if (gridContainer) {
    gridContainer.style.maxHeight = "200px";
    gridContainer.style.overflowY = "auto";
    gridContainer.style.overflowX = "hidden";
  }
}

socket.on("emotesList", (emotesCollection) => {
  if (!gridContainer || !Array.isArray(emotesCollection)) return;
  
  gridContainer.innerHTML = "";

  emotesCollection.forEach(emote => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.title = emote.name;
    btn.style.cssText = `
      border-radius: 10px;
      border: none;
      padding: 2px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      width: 50px;
      height: 50px;
      transition: background 0.15s ease, transform 0.1s ease, border-color 0.1s ease;
    `;

    const img = document.createElement("img");
    img.src = emote.imageUrl;
    img.alt = emote.name;
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
    `;
    btn.appendChild(img);
    
    btn.onmouseenter = () => { 
      btn.style.transform = "scale(1.08)"; 
    };
    btn.onmouseleave = () => { 
      btn.style.transform = "scale(1)"; 
    };
    
    btn.addEventListener("click", () => {
      const start = chatInput.selectionStart;
      const end = chatInput.selectionEnd;
      const text = chatInput.value;
      const formattedEmote = `:${emote.name}:`;
      
      chatInput.value = text.substring(0, start) + formattedEmote + text.substring(end);
      chatInput.focus();
      chatInput.selectionStart = chatInput.selectionEnd = start + formattedEmote.length;
      emojiPopupEl.style.display = "none";
    });
    
    gridContainer.appendChild(btn);
  });
});

if (emojiButton) {
  emojiButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = emojiPopupEl.style.display === "none" || emojiPopupEl.style.display === "";
    emojiPopupEl.style.display = isHidden ? "flex" : "none";
  });
}

document.addEventListener("click", (e) => {
  if (emojiPopupEl && !emojiPopupEl.contains(e.target) && e.target !== emojiButton && !emojiButton.contains(e.target)) {
    emojiPopupEl.style.display = "none";
  }
});

let replyBarEl = document.querySelector(".chat-active-reply-bar");
if (!replyBarEl) {
  replyBarEl = document.createElement("div");
  replyBarEl.className = "chat-active-reply-bar";
  
  const replyInfoText = document.createElement("span");
  replyInfoText.className = "reply-bar-info-text";
  
  const closeReplyBtn = document.createElement("button");
  closeReplyBtn.className = "close-reply-bar-btn";
  closeReplyBtn.innerHTML = "<i class='fa-solid fa-xmark'></i>";
  closeReplyBtn.addEventListener("click", cancelActiveReplyState);

  replyBarEl.appendChild(replyInfoText);
  replyBarEl.appendChild(closeReplyBtn);
  chatForm.parentNode.insertBefore(replyBarEl, chatForm);
}

let overlayModal = document.querySelector(".media-overlay-modal");
let overlayImg = document.querySelector(".media-overlay-content");
let overlayCloseBtn = document.querySelector(".media-overlay-close");

if (!overlayModal) {
  overlayModal = document.createElement("div");
  overlayModal.className = "media-overlay-modal";
  
  overlayCloseBtn = document.createElement("button");
  overlayCloseBtn.className = "media-overlay-close";
  overlayCloseBtn.textContent = "X";
  
  overlayImg = document.createElement("img");
  overlayImg.className = "media-overlay-content";
  overlayImg.alt = "Fullscreen Previewed Image";
  
  overlayModal.appendChild(overlayCloseBtn);
  overlayModal.appendChild(overlayImg);
  document.body.appendChild(overlayModal);

  overlayCloseBtn.addEventListener("click", closeImageModal);
  overlayModal.addEventListener("click", (e) => {
    if (e.target === overlayModal) closeImageModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlayModal.classList.contains("active")) {
      closeImageModal();
    }
  });
}

function openImageModal(src) {
  overlayImg.src = src;
  overlayModal.classList.add("active");
}

function closeImageModal() {
  overlayModal.classList.remove("active");
}

function showWarningToast(message) {
  const toast = document.createElement("div");
  toast.className = "chat-toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 50);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  };

  const formattedDate = date.toLocaleString(undefined, options).replace(',', '');

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (date.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return formattedDate;
  }
}

function parseMentions(htmlContent, parentRow) {
  const isDirectReplyToMe = parentRow.hasAttribute("data-reply-to-user") && 
    parentRow.getAttribute("data-reply-to-user").toLowerCase() === currentClientUsername.toLowerCase();

  if (isDirectReplyToMe) {
    parentRow.classList.add("mention-highlight");
  }

  const mentionRegex = /@([a-zA-Z0-9\-_]+)/g;
  
  return htmlContent.replace(mentionRegex, (match, username) => {
    const isMe = currentClientUsername && username.toLowerCase() === currentClientUsername.toLowerCase();
    
    if (isMe) {
      parentRow.classList.add("mention-highlight");
      return `<span class="user-mention-tag">@${username}</span>`;
    }
    
    return match;
  });
}

function parseBodyText(bodyElement, text, isEdited, parentRow) {
  bodyElement.innerHTML = "";
  
  const imageRegex = /https?:\/\/[^\s]+?\.(apng|avif|gif|jpg|jpeg|jfif|pjpeg|pjpg|png|svg|webp)(\?[^\s]*)?/i;
  const generalUrlRegex = /(blob:)?https?:\/\/[^\s]+/i;

  if (imageRegex.test(text)) {
    const imageUrl = text.match(imageRegex)[0];
    
    const textNode = document.createElement("div");
    let baseTextHtml = renderChatContentWithEmoji(text.replace(imageUrl, '').trim());
    textNode.innerHTML = parseMentions(baseTextHtml, parentRow);
    
    if (textNode.innerHTML.trim() !== "") {
        bodyElement.appendChild(textNode);
    }

    const mediaImg = document.createElement("img");
    mediaImg.className = "chat-attached-media";
    mediaImg.src = imageUrl;
    mediaImg.alt = "Shared Media Image";
    
    mediaImg.onload = () => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    };
    
    mediaImg.onerror = () => {
      const fallbackLink = document.createElement("a");
      fallbackLink.href = imageUrl;
      fallbackLink.target = "_blank";
      fallbackLink.style.cssText = "color: #ffd6ff; text-decoration: underline; font-size: 18px; word-break: break-all;";
      fallbackLink.textContent = imageUrl;
      bodyElement.appendChild(fallbackLink);
    };
    
    mediaImg.addEventListener("click", () => {
      openImageModal(imageUrl);
    });

    bodyElement.appendChild(mediaImg);
  } else if (generalUrlRegex.test(text)) {
    const matchedUrl = text.match(generalUrlRegex)[0];
    bodyElement.innerHTML = `<a href="${matchedUrl}" target="_blank" style="color: #ffd6ff; text-decoration: underline; font-size: 18px; word-break: break-all;">${matchedUrl}</a>`;
  } else {
    let baseTextHtml = renderChatContentWithEmoji(text);
    bodyElement.innerHTML = parseMentions(baseTextHtml, parentRow);
  }

  if (isEdited) {
    appendEditedTag(bodyElement);
  }
}

function appendEditedTag(element) {
  const editedSpan = document.createElement("span");
  editedSpan.className = "edited-tag";
  editedSpan.textContent = "(edited)";
  element.appendChild(editedSpan);
}

function openEditMessageModal(messageId, currentText) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background-color: #6f057a;
    box-shadow: inset 0 -0.365vw #61056b, 3px 3px 15px rgba(0, 0, 0, 0.6);
    padding: 20px;
    border-radius: 5px;
    text-align: center;
    font-size: 26px;
    width: 420px;
    color: white;
    font-family: "Pixelify Sans";
  `;

  const title = document.createElement('h2');
  title.style.margin = "0 0 20px 0";
  title.textContent = "Edit Message";
  modalContent.appendChild(title);
  
  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.value = currentText;
  editInput.placeholder = 'Update message...';
  editInput.style.cssText = `
    width: 90%;
    background: transparent;
    padding: 10px 14px;
    font-weight: bold;
    text-align: center;
    border-radius: 10px;
    border: 3px solid white;
    color: white;
    font-size: 20px;
    font-family: "Pixelify Sans";
    outline: none;
    margin-bottom: 20px;
  `;
  modalContent.appendChild(editInput);

  const buttonWrap = document.createElement("div");
  buttonWrap.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 20px;
  `;

  const saveButton = document.createElement('button');
  saveButton.type = 'button';
  saveButton.innerHTML = "Edit";
  saveButton.className = 'edit-msg-modal-btn edit-msg-modal-btn-primary';

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.innerHTML = "Cancel";
  cancelButton.className = 'edit-msg-modal-btn edit-msg-modal-btn-secondary';

  buttonWrap.appendChild(saveButton);
  buttonWrap.appendChild(cancelButton);
  modalContent.appendChild(buttonWrap);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  editInput.focus();

  saveButton.onclick = () => {
    const updatedText = editInput.value.trim();
    if (updatedText && updatedText !== currentText) {
      socket.emit("editMessage", { messageId, content: updatedText });
    }
    modal.remove();
  };

  cancelButton.onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

function initiateReplyContext(messageId, username, contextExcerpt) {
  activeReplyTarget = {
    messageId,
    username,
    content: contextExcerpt
  };
  
  const textContainer = replyBarEl.querySelector(".reply-bar-info-text");
  if (textContainer) {
    textContainer.innerHTML = `<i class="fa-solid fa-reply"></i> Replying to <span style="font-weight:bold; color:#fff275;">@${username}</span>: <span style="font-style:italic; opacity:0.8;">"${contextExcerpt}"</span>`;
  }
  replyBarEl.classList.add("active");
  chatInput.focus();
}

function cancelActiveReplyState() {
  activeReplyTarget = null;
  replyBarEl.classList.remove("active");
}

function handleUsernameShiftClick(username) {
  if (!username) return;
  const currentInput = chatInput.value;
  if (currentInput === "" || currentInput.endsWith(" ")) {
    chatInput.value = `${currentInput}@${username} `;
  } else {
    chatInput.value = `${currentInput} @${username} `;
  }
  chatInput.focus();
}

function renderMessage(message, grouped = false) {
  if (message.replyToId) {
    const replyHookRow = document.createElement("div");
    replyHookRow.className = "message-reply-preview-container";
    replyHookRow.setAttribute("data-references-reply", message.replyToId);
    
    const lineHook = document.createElement("div");
    lineHook.className = "reply-line-hook";
    
    const replyMeta = document.createElement("span");
    replyMeta.innerHTML = `<i class="fa-solid fa-reply" style="font-size:11px; margin-right:4px; opacity:0.6;"></i> <span class="reply-preview-user">@${message.replyToUser || "Unknown"}</span> <span class="reply-preview-text">${message.replyToContent || ""}</span>`;
    
    replyHookRow.appendChild(lineHook);
    replyHookRow.appendChild(replyMeta);
    messagesEl.appendChild(replyHookRow);
  }

  const messageRow = document.createElement("div");
  messageRow.className = "message";
  messageRow.setAttribute("data-id", message._id);
  messageRow.setAttribute("data-userId", message.userId || "");
  messageRow.setAttribute("data-username", message.username || "");
  messageRow.setAttribute("data-time", new Date(message.createdAt).getTime());
  messageRow.setAttribute("data-pfp", message.pfp || "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png");
  messageRow.setAttribute("data-rawtime", message.createdAt);
  
  if (message.replyToUser) {
    messageRow.setAttribute("data-reply-to-user", message.replyToUser);
  }
  
  if (grouped && !message.replyToId) {
    messageRow.classList.add("grouped");
  } else {
    messageRow.classList.add("ungrouped-break");
  }

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
  
  let resolvedUserColor = "#ffd6ff"; 
  if (Array.isArray(message.badges) && message.badges.length > 0) {
    for (const roleKey of Object.keys(ROLE_COLOR_MAP)) {
      if (message.badges.includes(roleKey)) {
        resolvedUserColor = ROLE_COLOR_MAP[roleKey];
        break; 
      }
    }
  }
  usernameEl.style.setProperty("color", resolvedUserColor, "important");
  
  usernameEl.addEventListener("click", (e) => {
    if (e.shiftKey && message.username) {
      e.preventDefault();
      handleUsernameShiftClick(message.username);
    }
  });

  header.appendChild(usernameEl);

  const timestampEl = document.createElement("small");
  timestampEl.className = "message-timestamp";
  timestampEl.textContent = formatTimestamp(message.createdAt);
  header.appendChild(timestampEl);

  const body = document.createElement("p");
  const rawContent = (message.content || "").trim();
  parseBodyText(body, rawContent, message.edited, messageRow);

  messageContent.appendChild(header);
  messageContent.appendChild(body);
  messageRow.appendChild(pfp);
  messageRow.appendChild(messageContent);

  const actionsDiv = document.createElement("div");
  actionsDiv.className = "message-actions";

  const replyBtn = document.createElement("button");
  replyBtn.className = "action-btn reply";
  replyBtn.innerHTML = "<i class='fa-solid fa-reply'></i>";
  replyBtn.title = "Reply to message";
  replyBtn.addEventListener("click", () => {
    initiateReplyContext(message._id, message.username, rawContent);
  });
  actionsDiv.appendChild(replyBtn);

  const isMessageOwner = (currentClientUserId && message.userId === currentClientUserId) || 
                         (currentClientUsername && message.username === currentClientUsername);

  if (isMessageOwner) {
    const editBtn = document.createElement("button");
    editBtn.className = "action-btn edit";
    editBtn.innerHTML = "<i class='fa-solid fa-pen-to-square'></i>";
    editBtn.addEventListener("click", () => {
      openEditMessageModal(message._id, message.content);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "action-btn delete";
    deleteBtn.innerHTML = "<i class='fa-solid fa-trash'></i>";
    deleteBtn.addEventListener("click", () => {
      socket.emit("deleteMessage", { messageId: message._id });
    });

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
  }

  messageRow.appendChild(actionsDiv);
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

socket.on("initClient", ({ username, userId }) => {
  if (username) currentClientUsername = username;
  if (userId) currentClientUserId = userId;
});

socket.on("chatHistory", (messages) => {
  messagesEl.innerHTML = "";

  if (!Array.isArray(messages) || messages.length === 0) {
    showEmptyState();
    return;
  }

  lastMsgUsername = null;
  lastMsgTime = null;

  messages.forEach((m) => {
    if (!m) return;
    
    const currentTimestamp = new Date(m.createdAt).getTime();
    const isWithinTenMinutes = lastMsgTime && (currentTimestamp - lastMsgTime < 600000);
    const grouped = m.username && m.username === lastMsgUsername && isWithinTenMinutes;
    
    renderMessage(m, grouped);
    
    lastMsgUsername = m.username ?? null;
    lastMsgTime = currentTimestamp;
  });

  if (window.twemoji) window.twemoji.parse(messagesEl, { folder: "svg", ext: ".svg" });
});

socket.on("chatMessage", (message) => {
  if (!message || !message.content) return;
  
  const currentTimestamp = message.createdAt ? new Date(message.createdAt).getTime() : Date.now();
  const isWithinTenMinutes = lastMsgTime && (currentTimestamp - lastMsgTime < 600000);
  const grouped = message.username && message.username === lastMsgUsername && isWithinTenMinutes;
  
  renderMessage(message, grouped);
  
  lastMsgUsername = message.username ?? null;
  lastMsgTime = currentTimestamp;
  
  if (window.twemoji) window.twemoji.parse(messagesEl, { folder: "svg", ext: ".svg" });
});

socket.on("messageEdited", ({ messageId, content }) => {
  const row = document.querySelector(`.message[data-id="${messageId}"]`);
  if (row) {
    const bodyText = row.querySelector(".message-content p");
    if (bodyText) {
      row.classList.remove("mention-highlight"); 
      parseBodyText(bodyText, content, true, row);
      if (window.twemoji) window.twemoji.parse(bodyText, { folder: "svg", ext: ".svg" });
    }
  }
});

socket.on("messageDeleted", ({ messageId }) => {
  const row = document.querySelector(`.message[data-id="${messageId}"]`);
  if (row) {
    const structuralQuoteNode = row.previousElementSibling;
    if (structuralQuoteNode && structuralQuoteNode.classList.contains("message-reply-preview-container")) {
      structuralQuoteNode.remove();
    }

    const nextRow = row.nextElementSibling;
    row.remove();

    if (nextRow && nextRow.classList.contains("grouped")) {
      nextRow.classList.remove("grouped");
      nextRow.classList.add("ungrouped-break");
    }

    const lastRow = messagesEl.lastElementChild;
    if (lastRow && lastRow.classList.contains("message") && lastRow.getAttribute("data-id")) {
      lastMsgUsername = lastRow.getAttribute("data-username") || null;
      lastMsgTime = parseInt(lastRow.getAttribute("data-time")) || null;
    } else {
      lastMsgUsername = null;
      lastMsgTime = null;
    }

    if (messagesEl.children.length === 0) {
      showEmptyState();
    }
  }
});

socket.on("connect_error", (error) => {
  console.error("Chat socket connect error:", error);
});

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const content = chatInput.value.trim();
  if (!content) return;

  const leetMap = {
    '0': 'o', '1': 'i', 'l': 'i', '3': 'e', '4': 'a', 
    '5': 's', '7': 't', '8': 'b', '$': 's', '@': 'a', 
    'v': 'u', 'x': 'ck'
  };
  
  let simpleClean = content.toLowerCase().replace(/[\s\W_]/g, '');
  let normalized = content.toLowerCase().split('').map(char => leetMap[char] || char).join('').replace(/[\s\W_]/g, '');
  let compressed = normalized.replace(/(.)\1+/g, '$1');

  const containsSlur = SLUR_BLOCKLIST.some(slur => {
    const target = slur.toLowerCase();
    return simpleClean.includes(target) || normalized.includes(target) || compressed.includes(target);
  });

  if (containsSlur) {
    showWarningToast("You cannot say that word.");
    chatInput.value = "";
    chatInput.focus();
    return; 
  }

  const payload = { content };
  if (activeReplyTarget) {
    payload.replyToId = activeReplyTarget.messageId;
    payload.replyToUser = activeReplyTarget.username;
    payload.replyToContent = activeReplyTarget.content;
  }

  socket.emit("chatMessage", payload);
  
  cancelActiveReplyState();
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
  sendButton.style.boxShadow = "inset 0 -3px #0005, 0 4px 10px rgba(0,0,0,0.2)";
};

sendButton.onmouseleave = () => {
  sendButton.style.transform = "translateY(0px)";
  sendButton.style.background = "#6f057a";
  sendButton.style.boxShadow = "inset 0 -3px #0003";
};

sendButton.onmousedown = () => {
  sendButton.style.transform = "translateY(1px) scale(0.98)";
};