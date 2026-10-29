import { GET as getPaymentStatus } from "../../status/route";

/**
 * GET /api/payments/[id]/status
 * Task 56: Polling status pelunasan transaksi secara real-time dari payment gateway (Midtrans)
 */
export async function GET(req, { params }) {
  const { id } = await params;
  const url = new URL(req.url);

  // Set orderId and entityId from dynamic route param if not already present
  if (!url.searchParams.get("orderId")) {
    url.searchParams.set("orderId", id);
  }
  if (!url.searchParams.get("entityId")) {
    url.searchParams.set("entityId", id);
  }

  // Create forwarded request with enriched searchParams
  const forwardedReq = new Request(url.toString(), {
    method: req.method,
    headers: req.headers,
  });

  return getPaymentStatus(forwardedReq);
}
