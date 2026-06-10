const form = document.getElementById("loginForm");
const errorEl = document.getElementById("error");
const redirectEl = document.getElementById("redirect");
const submitBtn = document.getElementById("submitBtn");

(async function autoLoginIfAlreadyLoggedIn() {
    try {
        const res = await fetch("/api/loggedin", { credentials: "include" });
        const data = await res.json();

        if (data?.loggedIn) {
            window.location.href = "/stats";
        }
    } catch {
    }
})();

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    errorEl.textContent = "";
    submitBtn.disabled = true;
    submitBtn.textContent = "Logging in...";
    redirectEl.style.display = "none";

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch("/api/login", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Login failed");
        }

        setTimeout(() => {
            window.location.href = "/stats";
        }, 0);

    } catch (err) {
        errorEl.textContent = err.message;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Login";
    }
});