import emojiMap from "./emojiMap.js";

const TOKEN_REGEX = /:([a-z0-9_]+):/gi;

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "<")
    .replaceAll(">", ">")
}

export function renderChatContentWithEmoji(raw) {
  const text = String(raw ?? "");

  let out = "";
  let lastIndex = 0;

  for (const match of text.matchAll(TOKEN_REGEX)) {
    const full = match[0];
    const idx = match.index ?? 0;

    out += escapeHtml(text.slice(lastIndex, idx));

    const emojiChar = emojiMap[full];
    if (emojiChar) {
      out += `<span class="emoji" data-emoji="${escapeHtml(emojiChar)}">${escapeHtml(emojiChar)}</span>`;
    } else {
      out += escapeHtml(full);
    }

    lastIndex = idx + full.length;
  }

  out += escapeHtml(text.slice(lastIndex));
  return out;
}

