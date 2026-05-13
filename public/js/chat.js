const chatMessages = document.getElementById('chatMessages');
const chatEmpty = document.getElementById('chatEmpty');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatError = document.getElementById('chatError');

let lastMessageId = null;
let replyingTo = null;

function formatTimestamp(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function sanitize(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function renderMessages(messages) {
  if (!messages || messages.length === 0) {
    chatMessages.innerHTML = '';
    chatEmpty.style.display = 'block';
    return;
  }

  chatEmpty.style.display = 'none';

  messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const groupedMessages = [];
  let currentGroup = null;
  const GROUP_TIME_WINDOW = 5 * 60 * 1000;


  for (const message of messages) {
    const messageTime = new Date(message.createdAt);

    if (currentGroup &&
        currentGroup.username === message.username &&
        (messageTime - new Date(currentGroup.lastMessageTime)) <= GROUP_TIME_WINDOW) {
      currentGroup.messages.push(message);
      currentGroup.lastMessageTime = message.createdAt;
    } else {
      if (currentGroup) {
        groupedMessages.push(currentGroup);
      }
      currentGroup = {
        username: message.username,
        pfp: message.pfp,
        badges: message.badges,
        messages: [message],
        lastMessageTime: message.createdAt
      };
    }
  }

  if (currentGroup) {
    groupedMessages.push(currentGroup);
  }

  chatMessages.innerHTML = groupedMessages
    .map((group) => {
      const badges = Array.isArray(group.badges)
        ? group.badges
            .slice(0, 4)
            .map((badge) => `<span class="chat-badge">${sanitize(badge)}</span>`)
            .join('')
        : '';

      const messageElements = group.messages
        .map((message) => {
          const replyElement = message.replyTo
            ? `<div class="chat-reply">
                <div class="chat-reply-line"></div>
                <div class="chat-reply-content">
                  <span class="chat-reply-text">${sanitize(message.replyTo.content)}</span>
                </div>
              </div>`
            : '';

          return `
            <div class="chat-message-item" data-message-id="${message._id || ''}" data-replied-to="${message.replyTo ? message.replyTo.messageId : ''}">
              ${replyElement}
              <div class="chat-text">${sanitize(message.content)}</div>
              <button class="chat-reply-btn" onclick="startReply('${message._id || ''}', '${sanitize(message.username)}', '${sanitize(message.content.substring(0, 50))}')" title="Reply">
                <i class="fas fa-reply"></i>
              </button>
            </div>`;
        })
        .join('');

      return `
        <article class="chat-card">
          <img src="${sanitize(
            group.pfp ||
              'https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png'
          )}" alt="${sanitize(group.username)} avatar" class="chat-avatar" />
          <div class="chat-body">
            <div class="chat-author-row">
              <div class="chat-username">${sanitize(group.username)}</div>
              <div class="chat-badges">${badges}</div>
              <div class="chat-time">${formatTimestamp(group.messages[0].createdAt)}</div>
            </div>
            <div class="chat-messages-group">
              ${messageElements}
            </div>
          </div>
        </article>`;
    })
    .join('');

  if (messages.length > 0) {
    lastMessageId = messages[messages.length - 1]._id || null;
  }

  highlightRepliedMessages();

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// i cant get ts working 
function highlightRepliedMessages() {
  document.querySelectorAll('.chat-message-item.highlighted').forEach(el => {
    el.classList.remove('highlighted');
  });

  document.querySelectorAll('.chat-username.replied-highlighted').forEach(el => {
    el.classList.remove('replied-highlighted');
  });

  document.querySelectorAll('.chat-message-item[data-replied-to]').forEach(item => {
    const repliedToId = item.getAttribute('data-replied-to');
    if (!repliedToId) return;

    const repliedToElement = document.querySelector(
      `.chat-message-item[data-message-id="${repliedToId}"]`
    );

    if (repliedToElement) {
      repliedToElement.classList.add('highlighted');

      const usernameEl = repliedToElement.querySelector('.chat-username');
      if (usernameEl) usernameEl.classList.add('replied-highlighted');
    }
  });
}

function startReply(messageId, username, content) {
  replyingTo = { messageId, username, content };



  const replyPreview = document.getElementById('replyPreview');
  if (!replyPreview) {
    const preview = document.createElement('div');
    preview.id = 'replyPreview';
    preview.className = 'chat-reply-preview';
    preview.innerHTML = `
      <div class="chat-reply-line"></div>
      <div class="chat-reply-content">
<span class="chat-reply-username">${sanitize(username)}</span>
        <span class="chat-reply-text">${sanitize(content)}${content.length > 50 ? '...' : ''}</span>
        <button class="chat-reply-cancel" onclick="cancelReply()" title="Cancel reply">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    chatForm.insertBefore(preview, chatForm.firstChild);
  }
  chatInput.focus();
}

function cancelReply() {
  replyingTo = null;
  const replyPreview = document.getElementById('replyPreview');
  if (replyPreview) {
    replyPreview.remove();
  }

  document.querySelectorAll('.chat-username.replied-highlighted').forEach(el => {
    el.classList.remove('replied-highlighted');
  });
}



async function fetchNewMessages() {
  try {
    const url = lastMessageId ? `/api/chat/messages?after=${lastMessageId}` : '/api/chat/messages';
    const response = await fetch(url, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Could not load new messages');
    }

    const newMessages = await response.json();
    if (newMessages.length > 0) {
      await fetchMessages();
    }
  } catch (error) {
    console.error('Real-time fetch error:', error);
  }
}

async function fetchMessages() {
  try {
    const response = await fetch('/api/chat/messages', {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Could not load chat messages');
    }

    const messages = await response.json();
    renderMessages(messages);
  } catch (error) {
    console.error('Chat load error:', error);
  }
}

async function sendMessage() {
  const content = chatInput.value.trim();
  if (!content) {
    chatError.textContent = 'Please type a message before sending.';
    chatInput.classList.add('chat-input-error');
    return;
  }

  chatError.textContent = '';
  chatInput.classList.remove('chat-input-error');

  try {
    const messageData = { content };
    if (replyingTo && replyingTo.messageId) {
      messageData.replyTo = { messageId: replyingTo.messageId };
    }

    const response = await fetch('/api/chat/messages', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      let errorMessage = 'Could not send message';
      try {
        const data = await response.json();
        errorMessage = data?.error || errorMessage;
      } catch {
      }
      chatError.textContent = errorMessage;
      chatInput.classList.add('chat-input-error');
      throw new Error(errorMessage);
    }

    chatInput.value = '';
    cancelReply();
    await fetchMessages();
  } catch (error) {
    console.error('Chat send error:', error);
  } finally {
    chatInput.focus();
  }
}

if (chatForm) {
  chatForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await sendMessage();
  });
}

if (chatInput) {
  chatInput.addEventListener('input', () => {
    chatInput.classList.remove('chat-input-error');
    chatError.textContent = '';
  });

  chatInput.addEventListener('keydown', async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await sendMessage();
    }
  });
}

fetchMessages();
setInterval(fetchNewMessages, 1000);
