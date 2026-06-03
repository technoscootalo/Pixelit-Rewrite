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

        const roleColors = {
          Owner: "#020202",
          Veteran: "#969a5c",
          Verified: "#5ab65b",
          Plus: "#5657d3",
          Tester: "#80a1d3",
          Helper: "#4b69c3",
          Moderator: "#ab53c4",
          Admin: "#dc6dc1",
          "Community Manager": "#69c95d",
          Developer: "#6a76c7",
          Artist: "#ca964c",
        };

        if (data.role && roleColors[data.role]) {
          profileName.style.color = roleColors[data.role];
        }
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
  
  fetch('/api/logout', { 
    method: 'POST', 
    credentials: 'include' 
  })
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    window.location.href = '/login'; 
  })
  .catch((error) => { 
    console.error('Logout error:', error); 
    window.location.href = '/login'; 
  });
}
