document.addEventListener('DOMContentLoaded', function() {
  const profilePic = document.getElementById('profilePic');
  const profileName = document.getElementById('profileName');

  async function loadProfileData() {
    try {
      const response = await fetch('/api/user');
      const data = await response.json();
      
      if (data && data.username) {
        if (data.pfp) {
          profilePic.src = data.pfp;
        } else {
          profilePic.src = 'https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png';
        }

        profileName.textContent = data.username;
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      profilePic.src = 'https://izumiihd.github.io/pixelitcdn/assets/img/blooks/logo.png';
      profileName.textContent = 'User';
    }
  }

  loadProfileData();
});

function handleLogout(event) {
  event.preventDefault();

  try {
    document.cookie = "pixelit.sid=; Max-Age=0; path=/;";
  } catch (e) {
  }

  fetch('/api/logout', {
    method: 'POST',
    credentials: 'include'
  })
    .then((response) => {
      window.location.href = '/login';
    })
    .catch((error) => {
      console.error('Logout error:', error);
      window.location.href = '/login';
    });
}
