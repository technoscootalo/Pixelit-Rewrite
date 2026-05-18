let cooldown = false;
let isMessagesView = false;

document.addEventListener("DOMContentLoaded", () => {
  fetchLeaderboard();
});

async function fetchLeaderboard() {
  try {
    const url = isMessagesView ? "/api/messages" : "/api/leaderboard";

    const res = await fetch(url, {
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const users = await res.json();
    renderLeaderboard(users);

  } catch (err) {
    console.error(err);
    showError("Failed to load leaderboard");
  }
}

function renderLeaderboard(users) {
  const container = document.getElementById("leaderboardContainer");
  if (!container) return;

  container.innerHTML = "";

  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-bottom: 15px;
    padding: 0 10px;
  `;

  const title = document.createElement("div");
  title.innerHTML = isMessagesView
    ? `<i class="fa-solid fa-comments"></i> Messages`
    : `<i class="fa-solid fa-coins"></i> Tokens`;

  title.style.cssText = `
    font-size: 28px;
    font-weight: bold;
    color: white;
    font-family: Pixelify Sans;
    text-shadow: 0px 3px 8px rgba(0,0,0,0.6);
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  const button = document.createElement("button");
  button.innerHTML = isMessagesView
    ? `<i class="fa-solid fa-coins"></i> Tokens`
    : `<i class="fa-solid fa-comments"></i> Messages`;

  button.style.cssText = `
    padding: 8px 14px;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    background: #6f057a;
    box-shadow: inset 0 -3px #0003;
    color: white;
    font-family: Pixelify Sans;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  `;

  button.onmouseenter = () => {
    button.style.transform = "translateY(-2px)";
    button.style.background = "#7c068d";
    button.style.boxShadow = "inset 0 -3px #0005, 0 4px 10px rgba(0,0,0,0.2)";
  };

  button.onmouseleave = () => {
    button.style.transform = "translateY(0px)";
    button.style.background = "#6f057a";
    button.style.boxShadow = "inset 0 -3px #0003";
  };

  button.onmousedown = () => {
    button.style.transform = "translateY(1px) scale(0.98)";
  };

  button.onmouseup = () => {
    button.style.transform = "translateY(-2px) scale(1)";
  };

  button.onclick = () => {
    if (cooldown) return;
    cooldown = true;
    setTimeout(() => (cooldown = false), 0);

    isMessagesView = !isMessagesView;
    fetchLeaderboard();
  };

  header.appendChild(title);
  header.appendChild(button);
  container.appendChild(header);

  const colorMap = {
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

  users.forEach((user, index) => {
    const role = user.role || "Unknown";
    const roleColor = colorMap[role] || "white";

    const pfp =
      user.pfp ||
      "https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png";

    const rankColor =
      index === 0
        ? "gold"
        : index === 1
        ? "silver"
        : index === 2
        ? "#cd7f32"
        : "white";

const value = isMessagesView
      ? (user.sent ?? user.messages ?? 0)
      : user.tokens || 0;

    const valueColor = isMessagesView ? "#4fc3f7" : "gold";

    const div = document.createElement("div");
    div.className = "leaderboard-item";

    div.style.cssText = `
      width: calc(100% - 20px);
      height: 65px;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      margin: 5px auto;
      background: #6f057a;
      border-radius: 8px;
      color: white;
      font-family: Pixelify Sans;
      font-size: 15px;
      box-sizing: border-box;
      box-shadow: inset 0 -0.225vw #570066, 3px 3px 15px rgba(0,0,0,0.6);
    `;

    div.innerHTML = `
      <div style="
        width: 45px;
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        color: ${rankColor};
      ">
        #${index + 1}
      </div>

      <img src="${pfp}" style="
        width: 38px;
        height: 38px;
        border-radius: 6px;
        object-fit: cover;
      ">

      <div style="
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      ">
        <span style="color:${roleColor}">[${role}]</span>
        ${user.username || "Unknown"}
      </div>

      <div style="
        min-width: 120px;
        text-align: right;
        font-weight: bold;
        color: ${valueColor};
      ">
        ${value.toLocaleString()}
      </div>
    `;

    container.appendChild(div);
  });
}

function showError(message) {
  const container = document.getElementById("leaderboardContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="leaderboard-error">${message}</div>
  `;
}