import Entity from "./Entity";

export default class ChatAPI extends Entity {
  constructor() {
    super("http://localhost:3000");
    this.ws = null;
    this.wsUrl = "ws://localhost:3000";
  }

  connect(onOpen, onMessage, onClose, onError) {
    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = onOpen;
    this.ws.onmessage = onMessage;
    this.ws.onclose = onClose;
    this.ws.onerror = onError;
  }

  sendMessage(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }

  async checkNickname(name) {
    return this.create({ url: "/new-user", data: { name } });
  }
}
