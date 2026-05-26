const form = document.getElementById("registerForm");
const errorEl = document.getElementById("error");
const submitBtn = document.getElementById("submitBtn");
const goLogin = document.getElementById("goLogin");

goLogin.addEventListener("click", () => {
    window.location.href = "/login";
});


form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (typeof window.showLoader === "function") {
        window.showLoader();
    }


    errorEl.textContent = "";
    submitBtn.disabled = true;
    submitBtn.textContent = "Registering...";

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const accessKey = document.getElementById("accessKey").value.trim();

    if (username.length < 3 || username.length > 16) {
        errorEl.textContent = "Username must be between 3 and 16 characters";
        submitBtn.disabled = false;
        submitBtn.textContent = "Register";
        return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errorEl.textContent = "Username can only contain letters, numbers, hyphens, and underscores";
        submitBtn.disabled = false;
        submitBtn.textContent = "Register";
        return;
    }

    if (password.length < 8) {
        errorEl.textContent = "Password must be at least 8 characters long";
        submitBtn.disabled = false;
        submitBtn.textContent = "Register";
        return;
    }

    try {
        const regRes = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password, accessKey })
        });

        const regData = await regRes.json();

        if (!regRes.ok) {
            throw new Error(regData.error || "Registration failed");
        }

        const logRes = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password }),
            credentials: "include"
        });

        const logData = await logRes.json();

        if (!logRes.ok) {
            throw new Error(logData.error || "Login failed after registration");
        }

        window.location.href = "/stats";

    } catch (err) {
        errorEl.textContent = err.message;
    } finally {
        if (typeof window.hideLoader === "function") {
            window.hideLoader();
        }
        submitBtn.disabled = false;
        submitBtn.textContent = "Register";
    }
});
