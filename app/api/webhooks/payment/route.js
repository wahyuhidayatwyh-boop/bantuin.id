import { POST as midtransWebhookPost } from "../midtrans/route";

/**
 * POST /api/webhooks/payment
 * Task 27: Webhook listener notifikasi status pelunasan pembayaran (Forwarded to Midtrans handler)
 */
export async function POST(req) {
  return midtransWebhookPost(req);
}
