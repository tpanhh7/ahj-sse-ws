import ChatAPI from "./api/ChatAPI";

export default class Chat {
  constructor(container) {
    this.container = container;
    this.api = new ChatAPI();
    this.currentUser = null;
    this.users = [];
    this.messages = [];
  }

  init() {
    this.bindToDOM();
    this.registerEvents();
    this.showNicknameModal();
  }

  bindToDOM() {
    this.container.innerHTML = `
      <div class="container">
        <h1 class="chat__header">Chat</h1>
        <div class="chat__container">
          <div class="chat__area">
            <div class="chat__messages-container" id="messages"></div>
            <div class="chat__messages-input">
              <form class="form" id="messageForm">
                <div class="form__group">
                  <input type="text" class="form__input" id="messageInput" placeholder="Type your message here">
                </div>
              </form>
            </div>
          </div>
          <div class="chat__userlist" id="userlist"></div>
        </div>
      </div>
      <div class="modal__form" id="nicknameModal">
        <div class="modal__background"></div>
        <div class="modal__content">
          <div class="modal__header">Enter your nickname</div>
          <div class="modal__body">
            <form id="nicknameForm">
              <div class="form__group">
                <input type="text" class="form__input" id="nicknameInput" required>
              </div>
              <div class="form__hint hidden" id="nicknameError"></div>
            </form>
          </div>
          <div class="modal__footer">
            <button type="button" class="modal__ok" id="submitNickname">Continue</button>
          </div>
        </div>
      </div>
    `;
  }

  registerEvents() {
    document
      .getElementById("submitNickname")
      .addEventListener("click", (e) => this.onEnterChatHandler(e));
    document
      .getElementById("messageForm")
      .addEventListener("submit", (e) => this.sendMessage(e));
  }

  showNicknameModal() {
    const modal = document.getElementById("nicknameModal");
    modal.classList.add("active");
  }

  hideNicknameModal() {
    const modal = document.getElementById("nicknameModal");
    modal.classList.remove("active");
  }

  async onEnterChatHandler(e) {
    e.preventDefault();
    const nickname = document.getElementById("nicknameInput").value.trim();
    if (!nickname) return;

    try {
      const response = await fetch("http://localhost:3000/new-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nickname }),
      });

      const data = await response.json();

      if (data.status === "ok") {
        this.currentUser = data.user;
        this.hideNicknameModal();
        this.connectToChat();
      } else {
        document.getElementById("nicknameError").textContent = data.message;
        document.getElementById("nicknameError").classList.remove("hidden");
      }
    } catch (err) {
      console.error("Error:", err);
    }
  }

  connectToChat() {
    this.api.connect(
      () => console.log("Connected to WebSocket"),
      (event) => this.handleIncomingMessage(event),
      () => console.log("Disconnected from WebSocket"),
      (error) => console.error("WebSocket error:", error)
    );
  }

  handleIncomingMessage(event) {
    const data = JSON.parse(event.data);

    if (Array.isArray(data)) {
      this.users = data;
      this.updateUserList();
    } else if (data.type === "send") {
      this.messages.push(data);
      this.renderMessage(data);
    }
  }

  updateUserList() {
    const userListContainer = document.getElementById("userlist");
    userListContainer.innerHTML = this.users
      .map((user) => `<div class="chat__user">${user.name}</div>`)
      .join("");
  }

  sendMessage(e) {
    e.preventDefault();
    const input = document.getElementById("messageInput");
    const message = input.value.trim();
    if (!message) return;

    this.api.sendMessage({
      type: "send",
      message,
      user: this.currentUser,
    });

    input.value = "";
  }

  renderMessage(message) {
    const messagesContainer = document.getElementById("messages");
    const isCurrentUser = message.user.name === this.currentUser.name;

    const messageElement = document.createElement("div");
    messageElement.className = `message__container ${
      isCurrentUser
        ? "message__container-yourself"
        : "message__container-interlocutor"
    }`;

    messageElement.innerHTML = `
      <div class="message__header">${
        isCurrentUser ? "You" : message.user.name
      }, ${new Date().toLocaleTimeString()}</div>
      <div class="message__text">${message.message}</div>
    `;

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}
