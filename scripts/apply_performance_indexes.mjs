import { prisma } from '../lib/prisma.js';

const indexes = [
  // Chat Messages (Paling sering dibaca & ditulis dalam obrolan real-time)
  "CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created ON chat_messages(order_room_id, created_at ASC);",
  "CREATE INDEX IF NOT EXISTS idx_chat_messages_room_unread ON chat_messages(order_room_id, is_read);",
  "CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);",

  // Order Rooms (Bilik transaksi & obrolan)
  "CREATE INDEX IF NOT EXISTS idx_order_rooms_requester ON order_rooms(requester_id, order_status);",
  "CREATE INDEX IF NOT EXISTS idx_order_rooms_helper ON order_rooms(helper_id, order_status);",
  "CREATE INDEX IF NOT EXISTS idx_order_rooms_status ON order_rooms(order_status);",
  "CREATE INDEX IF NOT EXISTS idx_order_rooms_midtrans ON order_rooms(midtrans_order_id);",
  "CREATE INDEX IF NOT EXISTS idx_order_rooms_created ON order_rooms(created_at DESC);",

  // Requests (Bantuan & Errands)
  "CREATE INDEX IF NOT EXISTS idx_requests_status_cat ON requests(status, category);",
  "CREATE INDEX IF NOT EXISTS idx_requests_requester ON requests(requester_id);",
  "CREATE INDEX IF NOT EXISTS idx_requests_helper ON requests(selected_helper_id);",
  "CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at DESC);",

  // Offers (Bidding Bantuan)
  "CREATE INDEX IF NOT EXISTS idx_offers_request ON offers(request_id);",
  "CREATE INDEX IF NOT EXISTS idx_offers_helper ON offers(helper_id, status);",

  // Rentals (Sewa Alat)
  "CREATE INDEX IF NOT EXISTS idx_rentals_available_cat ON rentals(is_available, category);",
  "CREATE INDEX IF NOT EXISTS idx_rentals_owner ON rentals(owner_id);",
  "CREATE INDEX IF NOT EXISTS idx_rentals_created ON rentals(created_at DESC);",

  // Rental Bookings
  "CREATE INDEX IF NOT EXISTS idx_rental_bookings_rental ON rental_bookings(rental_id, booking_status);",
  "CREATE INDEX IF NOT EXISTS idx_rental_bookings_renter ON rental_bookings(renter_id, booking_status);",
  "CREATE INDEX IF NOT EXISTS idx_rental_bookings_owner ON rental_bookings(owner_id, booking_status);",
  "CREATE INDEX IF NOT EXISTS idx_rental_bookings_midtrans ON rental_bookings(midtrans_order_id);",

  // Services (Jasa Keahlian)
  "CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_id);",
  "CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);",
  "CREATE INDEX IF NOT EXISTS idx_services_created ON services(created_at DESC);",

  // Notifications (Polling & badge lonceng)
  "CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);",
  "CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);",

  // Promotions
  "CREATE INDEX IF NOT EXISTS idx_promotions_status_reach ON promotions(status, reach_type);",
  "CREATE INDEX IF NOT EXISTS idx_promotions_owner ON promotions(owner_id);",
  "CREATE INDEX IF NOT EXISTS idx_promotions_service ON promotions(service_id);",
  "CREATE INDEX IF NOT EXISTS idx_promotions_rental ON promotions(rental_id);",

  // Reviews
  "CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);",
  "CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);",
  "CREATE INDEX IF NOT EXISTS idx_reviews_transaction ON reviews(transaction_id, transaction_type);",

  // Profiles & Withdrawals
  "CREATE INDEX IF NOT EXISTS idx_withdrawals_owner ON withdrawals(owner_id, status);",
  "CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(account_role);",
  "CREATE INDEX IF NOT EXISTS idx_profiles_verification ON profiles(verification_status);"
];

async function run() {
  console.log(`Starting to apply ${indexes.length} performance indexes...`);
  let applied = 0;
  for (const sql of indexes) {
    try {
      await prisma.$executeRawUnsafe(sql);
      applied++;
      const indexName = sql.split(" ")[5];
      console.log(`✓ Applied index: ${indexName}`);
    } catch (err) {
      console.error(`✗ Error applying index [${sql}]:`, err.message);
    }
  }
  console.log(`\nAll done! Successfully applied/verified ${applied}/${indexes.length} indexes.`);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
