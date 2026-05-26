const backButton = document.querySelector(".backButton");

// Add the Font Awesome reply icon inside the button
backButton.innerHTML = `<i class="fa-solid fa-reply"></i>`;

// Initial Desktop Styles
backButton.style.cssText = `
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 6px;
  background: #6f057a;
  color: white;
  font-size: 18px;
  font-family: 'Pixelify Sans', sans-serif;
  cursor: pointer;
  box-shadow: inset 0 -3px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, background 0.2s ease, box-shadow 0.2s ease;
`;

// Hover In
backButton.onmouseenter = () => {
  backButton.style.transform = "translateY(-3px)";
  backButton.style.background = "#7c068d";
  backButton.style.boxShadow = "inset 0 -4px rgba(0, 0, 0, 0.2), 0 6px 12px rgba(0, 0, 0, 0.25)";
};

// Hover Out
backButton.onmouseleave = () => {
  backButton.style.transform = "translateY(0px)";
  backButton.style.background = "#6f057a";
  backButton.style.boxShadow = "inset 0 -3px rgba(0, 0, 0, 0.2)";
};

// Mouse Click Down
backButton.onmousedown = () => {
  backButton.style.transform = "translateY(1px) scale(0.97)";
  backButton.style.boxShadow = "inset 0 -1px rgba(0, 0, 0, 0.2)";
};

// Mouse Release
backButton.onmouseup = () => {
  backButton.style.transform = "translateY(-3px) scale(1)";
  backButton.style.boxShadow = "inset 0 -4px rgba(0, 0, 0, 0.2), 0 6px 12px rgba(0, 0, 0, 0.25)";
};