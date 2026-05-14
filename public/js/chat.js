messages.innerHTML = "";

const sendButton = document.querySelector(".chat-form button");

sendButton.style.cssText = `
  width: 60px;
  border: none;
  border-radius: 6px;
  font-size: 20px;
  background: #6f057a;
  box-shadow: inset 0 -3px #0003;
  color: white;
  font-family: Pixelify Sans;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
`;

sendButton.onmouseenter = () => {
  sendButton.style.transform = "translateY(-2px)";
  sendButton.style.background = "#7c068d";
  sendButton.style.boxShadow =
    "inset 0 -3px #0005, 0 4px 10px rgba(0,0,0,0.2)";
};

sendButton.onmouseleave = () => {
  sendButton.style.transform = "translateY(0px)";
  sendButton.style.background = "#6f057a";
  sendButton.style.boxShadow = "inset 0 -3px #0003";
};

sendButton.onmousedown = () => {
  sendButton.style.transform = "translateY(1px) scale(0.98)";
};

sendButton.onmouseup = () => {
  sendButton.style.transform = "translateY(-2px) scale(1)";
};