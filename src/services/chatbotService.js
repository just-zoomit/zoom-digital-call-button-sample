import fetch from "node-fetch";
import { env } from "../config/env.js";
import { getChatbotToken } from "../utils/zoom-chatbot-auth.js";

export class ChatbotService {
  constructor() {
    this.channelId = env.zoomChannelId;
  }

  /**
   * Send a message into the configured Zoom channel.
   * In production you'd conform to Zoom's exact chat API schema.
   */
async sendNewRequestMessage({ request, store, item, promptLabel }) {
  const shortRequest = promptLabel || request.customQuestion || "N/A";
  const longRequest = request.customQuestion || shortRequest;

  const content = {
    settings: {},
    head: {
      text: "Zoom Digital Call Button",
      style: { bold: true }
    },
    body: [
      {
        type: "message",
        text: "🛒 New in-store help request",
        style: { bold: true },
        link: "https://zoom.us"
      },
      {
        type: "fields",
        items: [
          {
            key: "Store:",
            value: store.name,
            short: true
          },
          {
            key: "Location:",
            value: item.aisle,
            short: true
          },
          {
            key: "Item:",
            value: `${item.name} (${item.sku})`,
            short: true
          },
          {
            key: "Request ID:",
            value: request.id,
            short: true
          },
          {
            key: "Request (summary):",
            value: shortRequest || longRequest,
            short: true
          },
          
         
        ]
      },
      {
        type: "actions",
        items: [
          {
            text: "Claim",
            value: "claim-" + request.id,    
            style: "Default"
          },
          {
            text: "On the way",
            value: "on_the_way-" + request.id, 
            style: "Default"
          }
        ]
      }
    ]
  };

  console.log("[Chatbot] Would send to Zoom channel:", this.channelId);

  try {
    const botToken = await getChatbotToken();

    const res = await fetch("https://api.zoom.us/v2/im/chat/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${botToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        to_channel: this.channelId,
        robot_jid: "v1ol7btmypr8-a_jvfmvznxw@xmpp.zoom.us",
        to_jid: "vbdj8euxrduts0tan29tra@xmpp.zoom.us",
        user_jid: "vbdj8euxrduts0tan29tra@xmpp.zoom.us",
        content
      })
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Zoom chat API error:", res.status, body);
    }
  } catch (err) {
    console.error("Error calling Zoom chat API:", err.message);
  }
}
}