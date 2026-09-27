/**
 * Payment Service Simulator & Client
 * Mode: Test Mode / Sandbox
 */

export const XenditService = {
  /**
   * Verify Webhook signature or callback token
   */
  verifyWebhookSignature(callbackToken, expectedToken) {
    if (!expectedToken) return true; // In mock/development mode
    return callbackToken === expectedToken;
  },

  /**
   * Create an invoice for Request or Rental booking
   */
  async createEscrowInvoice({ externalId, amount, payerEmail, description }) {
    // In live integration: calls Xendit Invoice API
    // In MVP sandbox: returns simulated invoice details
    return {
      success: true,
      invoiceId: `xnd_inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      externalId,
      amount,
      status: "PENDING",
      invoiceUrl: `https://checkout-staging.xendit.co/web/${externalId}`,
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  },

  /**
   * Trigger Disbursement to Helper / Partner after task completion
   */
  async triggerDisbursement({ externalId, amount, bankCode, accountHolderName, accountNumber, description }) {
    // In live integration: calls Xendit Disbursement API
    // In MVP sandbox: returns simulated success payload
    return {
      success: true,
      disbursementId: `xnd_disb_${Date.now()}`,
      externalId,
      amount,
      status: "COMPLETED",
      timestamp: new Date().toISOString(),
      reference: `DISB-${Math.floor(100000 + Math.random() * 900000)}`,
    };
  },
};
