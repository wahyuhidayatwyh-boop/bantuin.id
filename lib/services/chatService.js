/**
 * chatService.js
 * In-App Chat & Messaging Service Abstraction
 * Complies with Section AI of requirements.
 */

const CHAT_STORAGE_KEY = "bantuin_chat_conversations";

const INITIAL_CONVERSATIONS = [
  {
    id: "conv-001",
    participantId: "fajar-ramadhan-desain",
    participantName: "Fajar Ramadhan, S.Ds",
    participantAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    participantRole: "Penyedia Jasa",
    lastMessage: "Halo mas, konsep desain logo draft 1 sudah siap ditinjau.",
    lastMessageTime: new Date(Date.now() - 15 * 60000).toISOString(),
    unreadCount: 1,
    messages: [
      {
        id: "msg-1",
        senderId: "fajar-ramadhan-desain",
        text: "Halo mas, konsep desain logo draft 1 sudah siap ditinjau.",
        time: new Date(Date.now() - 15 * 60000).toISOString(),
        attachment: null,
      },
    ],
  },
  {
    id: "conv-002",
    participantId: "mitra-kamera",
    participantName: "Focus Lens Studio",
    participantAvatar: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80",
    participantRole: "Mitra Sewa",
    lastMessage: "Unit Sony A7 III sudah dibersihkan dan siap diambil di studio.",
    lastMessageTime: new Date(Date.now() - 2 * 3600000).toISOString(),
    unreadCount: 0,
    messages: [
      {
        id: "msg-2",
        senderId: "mitra-kamera",
        text: "Unit Sony A7 III sudah dibersihkan dan siap diambil di studio.",
        time: new Date(Date.now() - 2 * 3600000).toISOString(),
        attachment: null,
      },
    ],
  },
];

function getStoredConversations() {
  if (typeof window === "undefined") return INITIAL_CONVERSATIONS;
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_CONVERSATIONS;
}

function saveConversations(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_chat_updated"));
  } catch {}
}

export const chatService = {
  /**
   * Mengambil daftar percakapan aktif pengguna
   */
  async getConversations(userId = "usr-001") {
    return getStoredConversations();
  },

  /**
   * Mengambil detail satu percakapan
   */
  async getConversationById(convId) {
    const all = getStoredConversations();
    return all.find((c) => c.id === convId) || null;
  },

  /**
   * Mengirim pesan dalam percakapan
   */
  async sendMessage({ conversationId, senderId, text, image = null }) {
    if (!text && !image) return null;

    const all = getStoredConversations();
    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: senderId || "usr-001",
      text: text || "",
      image: image || null,
      time: new Date().toISOString(),
    };

    let updatedConv = null;
    const nextList = all.map((c) => {
      if (c.id === conversationId) {
        updatedConv = {
          ...c,
          lastMessage: text || "📷 Lampiran Foto",
          lastMessageTime: new Date().toISOString(),
          messages: [...(c.messages || []), newMsg],
        };
        return updatedConv;
      }
      return c;
    });

    saveConversations(nextList);
    return newMsg;
  },

  /**
   * Menandai percakapan telah dibaca
   */
  async markAsRead(conversationId) {
    const all = getStoredConversations();
    const nextList = all.map((c) => {
      if (c.id === conversationId) {
        return { ...c, unreadCount: 0 };
      }
      return c;
    });
    saveConversations(nextList);
  },

  /**
   * Menghapus percakapan
   */
  async deleteConversation(conversationId) {
    const all = getStoredConversations();
    const nextList = all.filter((c) => c.id !== conversationId);
    saveConversations(nextList);
    return true;
  },

  /**
   * Menghapus pesan tertentu dalam percakapan
   */
  async deleteMessage(conversationId, messageId) {
    const all = getStoredConversations();
    const nextList = all.map((c) => {
      if (c.id === conversationId) {
        const msgs = (c.messages || []).filter((m) => m.id !== messageId);
        const last = msgs[msgs.length - 1];
        return {
          ...c,
          messages: msgs,
          lastMessage: last ? (last.text || "📷 Lampiran Foto") : "Percakapan kosong",
        };
      }
      return c;
    });
    saveConversations(nextList);
    return true;
  },
};
