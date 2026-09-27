const STORAGE_KEY = "bantuin_landing_content";
const EVENT_NAME = "bantuin_landing_content_updated";

const INITIAL_CONTENT = {
  reviews: [
    { id: "review-1", quote: "Bantuin lebih terjangkau dari segi harga. Freelancernya cepat tanggap dan hasilnya memuaskan.", name: "Peter", company: "Istana Bakmi", avatar: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=120&q=80" },
    { id: "review-2", quote: "Mudah diakses. Toko mitra dan layanannya profesional semua. Recommended.", name: "Daniel", company: "D'Clean", avatar: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=120&q=80" },
    { id: "review-3", quote: "Saya puas dengan pelayanan aplikasi maupun mitranya. Ekspektasinya terpenuhi.", name: "Alvan Prima", company: "Pas Steak", avatar: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=120&q=80" },
  ],
  partners: [
    { id: "partner-1", name: "citi", logoUrl: "", active: true },
    { id: "partner-2", name: "KOHLER.", logoUrl: "", active: true },
    { id: "partner-3", name: "Priceza", logoUrl: "", active: true },
    { id: "partner-4", name: "traveloka", logoUrl: "", active: true },
    { id: "partner-5", name: "Unilever", logoUrl: "", active: true },
  ],
};

const canUseStorage = () => typeof window !== "undefined";
const cloneInitial = () => JSON.parse(JSON.stringify(INITIAL_CONTENT));

const read = () => {
  if (!canUseStorage()) return cloneInitial();
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return stored && Array.isArray(stored.reviews) && Array.isArray(stored.partners) ? stored : cloneInitial();
  } catch { return cloneInitial(); }
};

const save = (content) => {
  if (!canUseStorage()) return content;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
  window.dispatchEvent(new Event(EVENT_NAME));
  return content;
};

export const landingContentService = {
  eventName: EVENT_NAME,
  getContentSync: read,
  saveContent: save,
  upsertReview(review) {
    const content = read();
    const item = { ...review, id: review.id || `review-${Date.now()}` };
    const exists = content.reviews.some((entry) => entry.id === item.id);
    return save({ ...content, reviews: exists ? content.reviews.map((entry) => entry.id === item.id ? item : entry) : [item, ...content.reviews] });
  },
  deleteReview(id) { const content = read(); return save({ ...content, reviews: content.reviews.filter((item) => item.id !== id) }); },
  upsertPartner(partner) {
    const content = read();
    const item = { active: true, ...partner, id: partner.id || `partner-${Date.now()}` };
    const exists = content.partners.some((entry) => entry.id === item.id);
    return save({ ...content, partners: exists ? content.partners.map((entry) => entry.id === item.id ? item : entry) : [...content.partners, item] });
  },
  deletePartner(id) { const content = read(); return save({ ...content, partners: content.partners.filter((item) => item.id !== id) }); },
};
