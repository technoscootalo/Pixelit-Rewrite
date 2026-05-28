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

const onlineUsersCounterEl = document.getElementById("onlineUsersCounter");
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
    width: 240px;
    background-color: #55145c;
    box-shadow: inset 0 -0.365vw #410b47, 3px 3px 15px rgba(0, 0, 0, 0.5);
    border-radius: 12px;
    display: none;
    flex-direction: column;
    overflow: hidden;
    z-index: 1000;
    font-family: "Pixelify Sans", sans-serif;
  `;

  const headerBar = document.createElement("div");
  headerBar.textContent = "Emojis";
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
    gap: 8px;
    padding: 12px;
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
      background: rgba(255, 255, 255, 0.08);
      border: 2px solid transparent;
      border-radius: 6px;
      padding: 2px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      transition: background 0.15s ease, transform 0.1s ease, border-color 0.1s ease;
    `;

    const img = document.createElement("img");
    img.src = emote.imageUrl;
    img.alt = `:${emote.name}:`;
    img.style.cssText = `
      width: 30px;
      height: 30px;
      object-fit: contain;
    `;
    btn.appendChild(img);
    
    btn.onmouseenter = () => { 
      btn.style.background = "rgba(255, 255, 255, 0.2)"; 
      btn.style.borderColor = "white";
      btn.style.transform = "scale(1.08)"; 
    };
    btn.onmouseleave = () => { 
      btn.style.background = "rgba(255, 255, 255, 0.08)"; 
      btn.style.borderColor = "transparent";
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

function safeEscapeText(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
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
      return `<span class="user-mention-tag">@${safeEscapeText(username)}</span>`;
    }
    
    return `<span class="chat-raw-mention">@${safeEscapeText(username)}</span>`;
  });
}

function parseBodyText(bodyElement, text, isEdited, parentRow) {
  bodyElement.innerHTML = "";
  const cleanText = text.trim();

  const imgRegex = /\.(apng|avif|gif|jpg|jpeg|jfif|pjpeg|pjpg|png|svg|webp)(\?[^\s]*)?$/i;
  const videoRegex = /\.(mp4|webm|ogg|m4v)(\?[^\s]*)?$/i;
  const audioRegex = /\.(mp3|wav|aac|m4a|ogg)(\?[^\s]*)?$/i;
  
  const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|shorts\/)?([a-zA-Z0-9_-]{11})/;
  const spotifyRegex = /https:\/\/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/;
  const scRegex = /https:\/\/soundcloud\.com\/[\w-]+\/[\w-]+/;

  const mediaStyle = "max-width: 100%; border-radius: 8px; margin-top: 5px; display: block;";

  if (ytRegex.test(cleanText)) {
    const videoId = cleanText.match(ytRegex)[1];
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.style.cssText = `${mediaStyle} width: 320px; height: 180px;`;
    bodyElement.appendChild(iframe);
  }
  else if (spotifyRegex.test(cleanText)) {
    const iframe = document.createElement("iframe");
    iframe.src = `https://open.spotify.com/embed/${cleanText.split('.com/')[1]}`;
    iframe.style.cssText = `${mediaStyle} width: 320px; height: 80px;`;
    bodyElement.appendChild(iframe);
  }
  else if (scRegex.test(cleanText)) {
    const iframe = document.createElement("iframe");
    iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(cleanText)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false`;
    iframe.style.cssText = `${mediaStyle} width: 320px; height: 160px;`;
    bodyElement.appendChild(iframe);
  }
  else if (imgRegex.test(cleanText)) {
    const img = document.createElement("img");
    img.src = cleanText;
    img.style.cssText = `${mediaStyle} max-height: 250px; cursor: pointer;`;
    img.addEventListener("click", () => openImageModal(cleanText));
    bodyElement.appendChild(img);
  }
  else if (videoRegex.test(cleanText) || audioRegex.test(cleanText)) {
    const type = videoRegex.test(cleanText) ? "video" : "audio";
    const media = document.createElement(type);
    media.src = cleanText;
    media.controls = true;
    media.style.cssText = `${mediaStyle} ${type === 'video' ? 'width: 320px;' : 'width: 280px;'}`;
    bodyElement.appendChild(media);
  }
  else {
    const emojiProcessed = renderChatContentWithEmoji(cleanText);
    bodyElement.innerHTML = parseMentions(emojiProcessed, parentRow);
}

  if (isEdited) appendEditedTag(bodyElement);
}

function appendEditedTag(element) {
  const editedSpan = document.createElement("span");
  editedSpan.className = "edited-tag";
  editedSpan.textContent = " (edited)";
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
    const cleanUser = safeEscapeText(username);
    const cleanExcerpt = safeEscapeText(contextExcerpt);
    textContainer.innerHTML = `<i class="fa-solid fa-reply"></i> Replying to <span style="font-weight:bold; color:#fff275;">@${cleanUser}</span>: <span style="font-style:italic; opacity:0.8;">"${cleanExcerpt}"</span>`;
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
    const safeReplyUser = safeEscapeText(message.replyToUser || "Unknown");
    const safeReplyContent = safeEscapeText(message.replyToContent || "");
    replyMeta.innerHTML = `<i class="fa-solid fa-reply" style="font-size:11px; margin-right:4px; opacity:0.6;"></i> <span class="reply-preview-user">@${safeReplyUser}</span> <span class="reply-preview-text">${safeReplyContent}</span>`;
    
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

function updateOnlineCounter({ onlineCount, source = "presence:update" } = {}) {
  if (!onlineUsersCounterEl) return;

  const safeCount = typeof onlineCount === "number" ? onlineCount : 0;
  const isOnlyMe = safeCount <= 1;

  if (!onlineUsersCounterEl.dataset.initialized) {
    onlineUsersCounterEl.innerHTML = "";

    const dot = document.createElement("span");
    dot.className = isOnlyMe ? "dot" : "dot green";

    const label = document.createElement("span");
    label.className = "online-users-counter-label";
    label.textContent = source === "loading" ? "Online Users : ..." : `Online Users  : ${safeCount}`;

    onlineUsersCounterEl.appendChild(dot);
    onlineUsersCounterEl.appendChild(label);

    onlineUsersCounterEl.dataset.initialized = "true";
    onlineUsersCounterEl.dataset.lastSource = source;
    return;
  }

  const dotEl = onlineUsersCounterEl.querySelector("span.dot, span.dot.green");
  const labelEl = onlineUsersCounterEl.querySelector(".online-users-counter-label");

  if (dotEl) {
    dotEl.className = isOnlyMe ? "dot" : "dot green";
  }
  if (labelEl) {
    labelEl.textContent = source === "loading" ? "Online Users : ..." : `Online Users  : ${safeCount}`;
  }

  onlineUsersCounterEl.dataset.lastSource = source;
}

let presenceLoadingTimeout = setTimeout(() => {
  if (!onlineUsersCounterEl) return;
  updateOnlineCounter({ onlineCount: 0, source: "loading" });
}, 1500);

socket.on("presence:update", ({ onlineCount } = {}) => {
  if (!onlineUsersCounterEl) return;
  clearTimeout(presenceLoadingTimeout);
  updateOnlineCounter({ onlineCount: onlineCount, source: "presence:update" });
});

if (onlineUsersCounterEl) {
  updateOnlineCounter({ onlineCount: 0, source: "loading" });
}



chatForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const content = chatInput.value.trim();
  if (!content) return;

  if (content.length > 256) {
    showWarningToast("Message is too long! (Max 256 characters)");
    return;
  }

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

sendButton.onmouseup = () => {
  sendButton.style.transform = "translateY(-2px) scale(1)";
};

emojiButton.style.cssText = `
  width: 60px; border: none; border-radius: 6px; font-size: 20px;
  background: #6f057a; box-shadow: inset 0 -3px #0003; color: white;
  font-family: 'Pixelify Sans', sans-serif; cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease;
  display: flex; align-items: center; justify-content: center;
`;

emojiButton.onmouseenter = () => {
  emojiButton.style.transform = "translateY(-2px)";
  emojiButton.style.background = "#7c068d";
  emojiButton.style.boxShadow = "inset 0 -3px #0005, 0 4px 10px rgba(0,0,0,0.2)";
};

emojiButton.onmouseleave = () => {
  emojiButton.style.transform = "translateY(0px)";
  emojiButton.style.background = "#6f057a";
  emojiButton.style.boxShadow = "inset 0 -3px #0003";
};

emojiButton.onmousedown = () => emojiButton.style.transform = "translateY(1px) scale(0.98)";
emojiButton.onmouseup = () => emojiButton.style.transform = "translateY(-2px) scale(1)";

if (window.twemoji) window.twemoji.parse(messagesEl, { folder: "svg", ext: ".svg" });