function formatJoinDate(isoString) {
  if (!isoString) return 'Unknown';
  const date = new Date(isoString);
  const options = {
    year: "numeric",
    month: "long", 
    day: "numeric"
  };
  return date.toLocaleDateString("en-US", options);
}

async function fetchUserData() {
  try {
    const response = await fetch('/api/user');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const usernameElement = document.getElementById("username");
  const roleElement = document.getElementById("role");
  const idElement = document.getElementById("id");
  const accessKeyElement = document.getElementById("accessKey");
  const joinDateElement = document.getElementById("date");

  let revealed = false;
  let realKey = "";
  const hiddenKey = "••••••••••••••••••••";

  const userData = await fetchUserData();

  if (userData) {
    if (usernameElement) {
      usernameElement.textContent = `Username: ${userData.username}`;
    }

    if (roleElement) {
      roleElement.textContent = `Role: ${userData.role}`;
    }

    if (joinDateElement) {
      joinDateElement.textContent = `Joined: ${formatJoinDate(userData.joinDate)}`;
    }

    if (idElement) {
      idElement.textContent = `ID: ${userData.id || userData._id}`;
    }

    // ACCESS KEY
    realKey = userData.accessKey || "Unavailable";

    if (accessKeyElement) {
      accessKeyElement.textContent = `Access Key: ${hiddenKey}`;
      accessKeyElement.style.cursor = "pointer";

      accessKeyElement.addEventListener("click", () => {
        if (realKey === "Unavailable") return;

        revealed = !revealed;

        accessKeyElement.textContent = revealed
          ? `Access Key: ${realKey}`
          : `Access Key: ${hiddenKey}`;
      });
    }

  } else {
    if (usernameElement) usernameElement.textContent = "Username: Unavailable";
    if (roleElement) roleElement.textContent = "Role: Unavailable";
    if (joinDateElement) joinDateElement.textContent = "Joined: Unknown";
    if (idElement) idElement.textContent = "ID: Unavailable";
    if (accessKeyElement) accessKeyElement.textContent = "Access Key: Unavailable";
  }
});

/* 
document.getElementById('changePassword').addEventListener('click', function() {
    const modal = createPasswordChangeModal();
    document.body.appendChild(modal);
});
*/

function createPasswordChangeModal() {
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
    modalContent.className = 'password-change-modal-content';
    modalContent.style.cssText = `
        background-color: #6f057a;
        box-shadow: inset 0 -0.365vw #61056b, 3px 3px 15px rgba(0, 0, 0, 0.6);
        padding: 20px;
        border-radius: 5px;
        text-align: center;
        font-size: 26px;
        width: 420px;
    `
    const title = document.createElement('h2');
    title.textContent = "Change Password";
    modalContent.appendChild(title);
    
    const currentPasswordInput = document.createElement('input');
    currentPasswordInput.type = 'password';
    currentPasswordInput.placeholder = 'Old Password';
    currentPasswordInput.style.cssText = `
    width: 60%;
    height: 50px;
    margin-bottom: 10px;
    display: inline;
    font-family: 'pixelify sans';
    font-size: 28px;
    text-align: center;
    border: 3px solid #5e046e;
    border-radius: 4px;
    box-sizing: border-box;
    background-color: transparent;
    color: white;
    margin-right: 5px;
    appearance: textfield;
    -webkit-appearance: none;
    `;
    modalContent.appendChild(currentPasswordInput);
    
    const newPasswordInput = document.createElement('input');
    newPasswordInput.type = 'password';
    newPasswordInput.placeholder = 'New Password';
    newPasswordInput.style.cssText = `
    width: 60%;
    height: 50px;
    margin-bottom: 10px;
    display: inline;
    font-family: 'pixelify sans';
    font-size: 28px;
    text-align: center;
    border: 3px solid #5e046e;
    border-radius: 4px;
    box-sizing: border-box;
    background-color: transparent;
    color: white;
    margin-right: 5px;
    appearance: textfield;
    -webkit-appearance: none;
    `;
    modalContent.appendChild(newPasswordInput);

    const warningText = document.createElement('div');
    warningText.id = 'error-message';
    warningText.innerHTML = "If you change your username, someone else can snipe your old password.";
    warningText.style.cssText = `
        color: red;
        font-size: 16px;
        margin-bottom: 10px;
        font-weight: bold;
    `;
    modalContent.appendChild(warningText);

    const changeButton = document.createElement('button');
    changeButton.textContent = 'Change';
    changeButton.style.cssText = `
        background-color: green;
        box-shadow: inset 0 -0.365vw #006400, 3px 3px 15px rgba(0, 0, 0, 0.6);
        font-family: 'pixelify sans';
        color: white;
        padding: 10px 20px;
        margin: 10px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: box-shadow 0.3s ease;
        margin-left: 60px;
    `;

    changeButton.onmouseover = () => {
        changeButton.style.boxShadow = 'inset 0 -0.5vw #006400, 3px 3px 15px rgba(0, 0, 0, 0.6)';
    };

    changeButton.onmouseout = () => {
        changeButton.style.boxShadow = 'inset 0 -0.365vw #006400, 3px 3px 15px rgba(0, 0, 0, 0.6)';
    };
    modalContent.appendChild(changeButton);

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
        background-color: red;
        box-shadow: inset 0 -0.365vw #b30000, 3px 3px 15px rgba(0, 0, 0, 0.6);
        font-family: 'pixelify sans';
        color: white;
        padding: 10px 20px;
        margin: 10px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: box-shadow 0.3s ease;
        margin-right: 60px;
    `;

    cancelButton.onmouseover = () => {
        cancelButton.style.boxShadow = 'inset 0 -0.5vw #b30000, 3px 3px 15px rgba(0, 0, 0, 0.6)';
    };

    cancelButton.onmouseout = () => {
        cancelButton.style.boxShadow = 'inset 0 -0.365vw #b30000, 3px 3px 15px rgba(0, 0, 0, 0.6)';
    };

    cancelButton.onclick = () => {
        document.body.removeChild(modal);
    };

    modalContent.appendChild(cancelButton);
    
    changeButton.onclick = async () => {
        const currentPassword = currentPasswordInput.value.trim();
        const newPassword = newPasswordInput.value.trim();

        if (!currentPassword || !newPassword) {
            warningText.textContent = "Please fill in all fields.";
            setTimeout(() => {
                warningText.textContent = "If you change your username, someone else can snipe your old password.";
            }, 2000);
            return;
        }

        const forbiddenChars = /[^a-zA-Z0-9!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/;
        if (forbiddenChars.test(newPassword) || newPassword.length < 8 || newPassword.length > 32) {
            warningText.textContent = "New password must be 8-32 characters long and contain only letters, numbers, and common symbols.";
            setTimeout(() => {
                warningText.textContent = "If you change your username, someone else can snipe your old password.";
            }, 2000);
            return;
        }

        const response = await fetch('/changePassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (response.ok) {
            window.location.href = '../login';
        } else {
            const errorText = await response.text();
            document.getElementById('error-message').textContent = `Error: ${errorText}`; 
        }
    };

    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    modalContent.appendChild(changeButton);
    modal.appendChild(modalContent);
    return modal;
}

document.getElementById("changeUsername").addEventListener("click", function () {
    const modal = document.createElement("div");

    modal.style.cssText = `
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const modalContent = document.createElement("div");

    modalContent.style.cssText = `
        background-color: #6f057a;
        box-shadow: inset 0 -0.365vw #61056b,
                    3px 3px 15px rgba(0,0,0,0.6);
        padding: 20px;
        border-radius: 5px;
        text-align: center;
        width: 420px;
        font-family: 'Pixelify Sans', sans-serif;
        color: white;
    `;

    const title = document.createElement("h2");
    title.textContent = "Change Username";
    modalContent.appendChild(title);

    const usernameInput = document.createElement("input");
    usernameInput.type = "text";
    usernameInput.placeholder = "New Username";

    usernameInput.style.cssText = `
        width: 70%;
        height: 50px;
        margin-bottom: 10px;
        font-family: 'Pixelify Sans', sans-serif;
        font-size: 24px;
        text-align: center;
        border: 3px solid #5e046e;
        border-radius: 4px;
        background: transparent;
        color: white;
        outline: none;
    `;

    modalContent.appendChild(usernameInput);
    modalContent.appendChild(document.createElement("br"));

    const passwordInput = document.createElement("input");
    passwordInput.type = "password";
    passwordInput.placeholder = "Confirm Password";

    passwordInput.style.cssText = `
        width: 70%;
        height: 50px;
        margin-bottom: 10px;
        font-family: 'Pixelify Sans', sans-serif;
        font-size: 24px;
        text-align: center;
        border: 3px solid #5e046e;
        border-radius: 4px;
        background: transparent;
        color: white;
        outline: none;
    `;

    modalContent.appendChild(passwordInput);
    modalContent.appendChild(document.createElement("br"));

    const errorMessage = document.createElement("div");
    errorMessage.textContent =
        "If you change your username, someone else can claim your old one.";

    errorMessage.style.cssText = `
        color: red;
        font-size: 16px;
        margin-bottom: 15px;
        font-weight: bold;
    `;

    modalContent.appendChild(errorMessage);

    const buttonWrap = document.createElement("div");
    buttonWrap.style.cssText = `
        display: flex;
        justify-content: center;
        gap: 20px;
    `;

    function createButton(text, color, hoverColor) {
        const btn = document.createElement("button");
        btn.textContent = text;

        btn.style.cssText = `
            background: ${color};
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Pixelify Sans', sans-serif;
            box-shadow: inset 0 -3px #0003;
            transition: 0.15s ease;
        `;

        btn.onmouseenter = () => {
            btn.style.transform = "translateY(-2px)";
            btn.style.background = hoverColor;
        };

        btn.onmouseleave = () => {
            btn.style.transform = "translateY(0px)";
            btn.style.background = color;
        };

        btn.onmousedown = () => {
            btn.style.transform = "translateY(1px) scale(0.98)";
        };

        btn.onmouseup = () => {
            btn.style.transform = "translateY(-2px) scale(1)";
        };

        return btn;
    }

    const changeButton = createButton(
        "Change",
        "green",
        "#006400"
    );

    changeButton.onclick = async () => {
        const newUsername = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        const forbiddenChars = /[^a-zA-Z0-9_]/;

        if (!newUsername || !password) {
            errorMessage.textContent = "Please fill out all fields.";
            return;
        }

        if (
            forbiddenChars.test(newUsername) ||
            newUsername.length < 3 ||
            newUsername.length > 20
        ) {
            errorMessage.textContent =
                "Username must be 3-20 chars and only contain letters, numbers, and underscores.";
            return;
        }

        try {
            const response = await fetch("/api/changeUsername", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    newUsername,
                    password
                })
            });

            const text = await response.text();

            if (response.ok) {
                window.location.href = "/login";
            } else {
                errorMessage.textContent = text;
            }

        } catch (err) {
            console.error(err);
            errorMessage.textContent = "Server error.";
        }
    };

    const cancelButton = createButton(
        "Cancel",
        "red",
        "#b30000"
    );

    cancelButton.onclick = () => {
        modal.remove();
    };

    buttonWrap.appendChild(changeButton);
    buttonWrap.appendChild(cancelButton);

    modalContent.appendChild(buttonWrap);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
});

const today = new Date();
const dateOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
};
date.innerHTML = today.toLocaleDateString("en-US", dateOptions);

async function handleDeveloperVisibility() {
  try {
    const res = await fetch("/api/user", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) return;

    const user = await res.json();

    const allowedRoles = ["Owner", "Developer"];
    const devLink = document.getElementById("devLink");

    if (!allowedRoles.includes(user.role)) {
      devLink.style.display = "none";
    } else {
      devLink.style.display = "block";
    }

  } catch (err) {
    console.error("Failed to check role:", err);
  }
}

document.addEventListener("DOMContentLoaded", handleDeveloperVisibility);

function logout() {
  fetch('/logout', { method: 'POST' })
    .then(response => {
      if (response.ok) {
        sessionStorage.clear();
        localStorage.removeItem('loggedIn');
        window.location.href = '/';
      } else {
        console.error('Logout failed');
      }
    })
    .catch(error => console.error('Error:', error));
}