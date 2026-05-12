fetch("/api/loggedin", {
    credentials: "include"
})
.then(res => res.json())
.then(data => {
    if (!data.loggedIn) {
        window.location.href = "/login";
    }
})
.catch(() => {
    window.location.href = "/login";
});