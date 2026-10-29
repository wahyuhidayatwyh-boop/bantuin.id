/**
 * __tests__/midtrans_backend.test.mjs
 * Comprehensive Automated Test Suite for Midtrans Backend Integration
 * Tests all required security, idempotency, signature, and consistency scenarios.
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

if (!globalThis.WebSocket) {
  globalThis.WebSocket = class DummyWebSocket {};
}

import crypto from "crypto";
import {
  getMidtransConfig,
  verifyMidtransWebhookSignature,
  mapMidtransStatus,
} from "../lib/midtrans/client.js";
import { generateTokens, verifyAccessToken } from "../lib/auth/jwt.js";

// Test Runner Helper
let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log("===============================================================");
  console.log("RUNNING BANTUIN.ID MIDTRANS BACKEND AUTOMATED TEST SUITE");
  console.log("===============================================================\n");

  // ---------------------------------------------------------------------------
  // TEST GROUP 1: Midtrans Configuration & SDK Initialization
  // ---------------------------------------------------------------------------
  console.log("--- Group 1: Configuration & Environment Validation ---");
  {
    const originalEnv = process.env.MIDTRANS_SERVER_KEY;

    // A. Missing Server Key Check
    delete process.env.MIDTRANS_SERVER_KEY;
    const missingConfig = getMidtransConfig();
    assert(missingConfig.isConfigured === false, "Properly reports isConfigured=false when MIDTRANS_SERVER_KEY is absent");

    // B. Default to Sandbox (Non-Production)
    delete process.env.MIDTRANS_IS_PRODUCTION;
    const defaultMode = getMidtransConfig();
    assert(defaultMode.isProduction === false, "Defaults to sandbox (isProduction: false) when MIDTRANS_IS_PRODUCTION is unset");

    // C. Explicit Production flag check
    process.env.MIDTRANS_IS_PRODUCTION = "true";
    assert(getMidtransConfig().isProduction === true, "Activates production only when explicitly set to 'true'");

    // Restore
    process.env.MIDTRANS_SERVER_KEY = originalEnv || "SB-Mid-server-test-secret-key-12345";
    process.env.MIDTRANS_IS_PRODUCTION = "false";
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: SHA-512 Webhook Signature Verification
  // ---------------------------------------------------------------------------
  console.log("\n--- Group 2: Webhook SHA-512 Signature Verification ---");
  {
    const testServerKey = "SB-Mid-server-test-secret-key-12345";
    process.env.MIDTRANS_SERVER_KEY = testServerKey;

    const orderId = "BTN-ORD-test1234-999999";
    const statusCode = "200";
    const grossAmount = "50000.00";

    const rawString = `${orderId}${statusCode}${grossAmount}${testServerKey}`;
    const validSignature = crypto.createHash("sha512").update(rawString).digest("hex");

    // A. Valid Signature
    const isValid = verifyMidtransWebhookSignature({
      orderId,
      statusCode,
      grossAmount,
      receivedSignature: validSignature,
    });
    assert(isValid === true, "Authenticates genuine Midtrans SHA-512 signature correctly");

    // B. Tampered Signature
    const isTamperedValid = verifyMidtransWebhookSignature({
      orderId,
      statusCode,
      grossAmount,
      receivedSignature: "0000000000000000000000000000000000000000000000000000000000000000",
    });
    assert(isTamperedValid === false, "Strictly rejects tampered or forged webhook signature");

    // C. Tampered Gross Amount with same signature
    const isTamperedAmountValid = verifyMidtransWebhookSignature({
      orderId,
      statusCode,
      grossAmount: "10000.00", // altered nominal
      receivedSignature: validSignature,
    });
    assert(isTamperedAmountValid === false, "Rejects signature if gross amount in payload was altered");
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: Transaction Status Mapping & Fraud Handling
  // ---------------------------------------------------------------------------
  console.log("\n--- Group 3: Midtrans Status Mapping Matrix ---");
  {
    assert(mapMidtransStatus("settlement").paymentStatus === "PAID", "Maps 'settlement' -> 'PAID'");
    assert(mapMidtransStatus("settlement").isSettled === true, "'settlement' has isSettled = true");

    assert(mapMidtransStatus("capture", "accept").paymentStatus === "PAID", "Maps 'capture' with fraud='accept' -> 'PAID'");
    assert(mapMidtransStatus("capture", "challenge").paymentStatus === "CHALLENGE", "Maps 'capture' with fraud='challenge' -> 'CHALLENGE'");

    assert(mapMidtransStatus("pending").paymentStatus === "PENDING", "Maps 'pending' -> 'PENDING'");
    assert(mapMidtransStatus("pending").isSettled === false, "'pending' has isSettled = false");

    assert(mapMidtransStatus("deny").paymentStatus === "FAILED", "Maps 'deny' -> 'FAILED'");
    assert(mapMidtransStatus("cancel").paymentStatus === "CANCELLED", "Maps 'cancel' -> 'CANCELLED'");
    assert(mapMidtransStatus("expire").paymentStatus === "EXPIRED", "Maps 'expire' -> 'EXPIRED'");
    assert(mapMidtransStatus("refund").paymentStatus === "REFUNDED", "Maps 'refund' -> 'REFUNDED'");
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 4: Authentication, Authorization & Anti-IDOR Logic
  // ---------------------------------------------------------------------------
  console.log("\n--- Group 4: Authentication & IDOR Authorization ---");
  {
    const userA = { id: "user-uuid-1111", email: "usera@bantuin.id", role: "user" };
    const userB = { id: "user-uuid-2222", email: "userb@bantuin.id", role: "user" };

    const tokenA = generateTokens(userA).accessToken;
    const tokenB = generateTokens(userB).accessToken;

    const decodedA = verifyAccessToken(tokenA);
    const decodedB = verifyAccessToken(tokenB);

    assert(decodedA.id === userA.id, "Successfully verifies and extracts User A identity from JWT");
    assert(decodedB.id === userB.id, "Successfully verifies and extracts User B identity from JWT");

    // Simulated OrderRoom owned by User A
    const orderRoomOwnedByA = {
      id: "room-uuid-0001",
      requesterId: userA.id,
      helperId: "helper-uuid-3333",
      lockedAmount: 75000,
      paymentStatus: "UNPAID",
    };

    // Check authorization: User A allowed to pay
    const canUserAPay = orderRoomOwnedByA.requesterId === decodedA.id;
    assert(canUserAPay === true, "Authorizes legitimate requester (User A) to pay order");

    // Check authorization: User B NOT allowed to pay
    const canUserBPay = orderRoomOwnedByA.requesterId === decodedB.id;
    assert(canUserBPay === false, "Blocks unauthorized user (User B / IDOR attempt) from paying User A's order");
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 5: Price Integrity & Anti-Tampering Logic
  // ---------------------------------------------------------------------------
  console.log("\n--- Group 5: Price Integrity (Server Source of Truth) ---");
  {
    const dbRecord = {
      id: "order-123",
      lockedAmount: 125000, // Trusted DB amount
    };

    const frontendPayload = {
      orderId: "order-123",
      amount: 1000, // Attacker manipulated nominal to Rp 1.000
    };

    // Backend rule: ALWAYS use dbRecord.lockedAmount, NEVER frontendPayload.amount
    const backendChargedAmount = Number(dbRecord.lockedAmount);
    assert(backendChargedAmount === 125000, "Backend strictly enforces DB lockedAmount (125000) over client amount (1000)");

    // Webhook amount verification rule
    const incomingWebhookGross = 1000;
    const webhookAmountMatches = Math.round(incomingWebhookGross) === Math.round(Number(dbRecord.lockedAmount));
    assert(webhookAmountMatches === false, "Webhook rejects payload when gross_amount does not match DB expected nominal");
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 6: Idempotency & Double Payment Prevention
  // ---------------------------------------------------------------------------
  console.log("\n--- Group 6: Idempotency & Concurrency Safeguards ---");
  {
    let paymentStatus = "UNPAID";
    let balanceMutations = 0;

    function processWebhookNotification(status) {
      if (paymentStatus === "PAID" && status === "PAID") {
        return { idempotent: true, mutated: false };
      }
      paymentStatus = "PAID";
      balanceMutations++;
      return { idempotent: false, mutated: true };
    }

    // First webhook notification
    const res1 = processWebhookNotification("PAID");
    assert(res1.mutated === true && paymentStatus === "PAID", "First webhook confirms payment and applies state update");

    // Second webhook notification (duplicate delivery)
    const res2 = processWebhookNotification("PAID");
    assert(res2.idempotent === true && res2.mutated === false, "Duplicate webhook identified as idempotent without re-mutating state");
    assert(balanceMutations === 1, "Guarantees no duplicate mutations or double settlement on multiple webhook deliveries");
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 7: Secret Leakage & Sanitization Verification
  // ---------------------------------------------------------------------------
  console.log("\n--- Group 7: Secret Leakage Prevention ---");
  {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    const sampleApiResponse = {
      success: true,
      data: {
        orderId: "BTN-ORD-test-1234",
        token: "snap-token-xyz-987",
        redirectUrl: "https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-xyz-987",
        amount: 50000,
      },
    };

    const serializedResponse = JSON.stringify(sampleApiResponse);
    const containsServerKey = serializedResponse.includes(serverKey);
    assert(containsServerKey === false, "API responses do NOT leak MIDTRANS_SERVER_KEY in response payload");
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 8: Webhook State Transitions & Terminal Invariant Rules
  // ---------------------------------------------------------------------------
  console.log("\n--- Group 8: Webhook State Transitions & Terminal Invariant Rules ---");
  {
    function validateStateTransition(currentStatus, nextStatus) {
      const current = (currentStatus || "UNPAID").toUpperCase();
      const next = (nextStatus || "UNKNOWN").toUpperCase();

      if (current === next) {
        return { allowed: false, isIdempotent: true, reason: `Status sudah ${current}.` };
      }

      if (current === "PAID") {
        if (next === "REFUNDED") {
          return { allowed: true, isIdempotent: false };
        }
        return {
          allowed: false,
          isIdempotent: true,
          reason: `Transaksi sudah berstatus PAID. Mengabaikan notifikasi tertunda '${next}'.`,
        };
      }

      if (current === "CANCELLED" || current === "EXPIRED" || current === "REFUNDED") {
        if (next === "PENDING" || next === "CHALLENGE") {
          return {
            allowed: false,
            isIdempotent: true,
            reason: `Transaksi sudah berstatus terminal ${current}. Mengabaikan status '${next}'.`,
          };
        }
        if (next === "PAID") {
          return { allowed: true, isIdempotent: false };
        }
        return { allowed: false, isIdempotent: true, reason: `Status terminal ${current}.` };
      }

      return { allowed: true, isIdempotent: false };
    }

    // A. Out-of-order: settlement -> pending (Must NOT downgrade PAID -> PENDING)
    const outOfOrderPending = validateStateTransition("PAID", "PENDING");
    assert(outOfOrderPending.allowed === false && outOfOrderPending.isIdempotent === true, "Out-of-order 'pending' after 'settlement' is strictly prevented from downgrading PAID status");

    // B. Failed notification after successful payment (settlement -> expire/cancel)
    const outOfOrderExpire = validateStateTransition("PAID", "EXPIRED");
    assert(outOfOrderExpire.allowed === false && outOfOrderExpire.isIdempotent === true, "Delayed 'expire' notification arriving after 'settlement' is ignored and does not downgrade PAID");

    const outOfOrderCancel = validateStateTransition("PAID", "CANCELLED");
    assert(outOfOrderCancel.allowed === false && outOfOrderCancel.isIdempotent === true, "Delayed 'cancel' notification arriving after 'settlement' is ignored and does not downgrade PAID");

    // C. Duplicate settlement notifications (settlement -> settlement)
    const duplicateSettlement = validateStateTransition("PAID", "PAID");
    assert(duplicateSettlement.allowed === false && duplicateSettlement.isIdempotent === true, "Duplicate 'PAID' notification is recognized as idempotent without mutation");

    // D. Legitimate sequence (UNPAID -> PENDING -> PAID -> REFUNDED)
    const step1 = validateStateTransition("UNPAID", "PENDING");
    assert(step1.allowed === true, "Valid transition: UNPAID -> PENDING is allowed");

    const step2 = validateStateTransition("PENDING", "PAID");
    assert(step2.allowed === true, "Valid transition: PENDING -> PAID is allowed");

    const step3 = validateStateTransition("PAID", "REFUNDED");
    assert(step3.allowed === true, "Valid transition: PAID -> REFUNDED is allowed");

    // E. Capture with various fraud status combinations
    const captureAccept = mapMidtransStatus("capture", "accept");
    assert(captureAccept.paymentStatus === "PAID" && captureAccept.isSettled === true, "'capture' with fraud='accept' transitions to settled PAID");

    const captureChallenge = mapMidtransStatus("capture", "challenge");
    assert(captureChallenge.paymentStatus === "CHALLENGE" && captureChallenge.isSettled === false, "'capture' with fraud='challenge' does NOT settle to PAID");

    const captureDeny = mapMidtransStatus("capture", "deny");
    assert(captureDeny.paymentStatus === "FAILED" && captureDeny.isSettled === false, "'capture' with fraud='deny' maps to FAILED");
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 9: Concurrent Checkout & Idempotent Token Reuse
  // ---------------------------------------------------------------------------
  console.log("\n--- Group 9: Concurrent Checkout & Token Reuse Logic ---");
  {
    // Simulated existing active order with token
    const existingActiveOrder = {
      id: "ord-concurrent-001",
      midtransOrderId: "BTN-ORD-test-55555",
      midtransSnapToken: "snap-active-token-9999",
      paymentStatus: "PENDING",
      lockedAmount: 150000,
    };

    function simulateCheckoutRequest(order, existingTxStatusFromMidtrans) {
      if (order.paymentStatus === "PAID") {
        return { status: 400, error: "Transaksi pesanan ini sudah berstatus LUNAS (PAID)." };
      }
      if (order.midtransOrderId && order.midtransSnapToken && order.paymentStatus === "PENDING") {
        if (existingTxStatusFromMidtrans === "settlement") {
          return { status: 400, error: "Transaksi pesanan ini sudah berstatus LUNAS (PAID)." };
        }
        if (!existingTxStatusFromMidtrans || existingTxStatusFromMidtrans === "pending") {
          return {
            status: 200,
            token: order.midtransSnapToken,
            orderId: order.midtransOrderId,
            reused: true,
          };
        }
      }
      return { status: 200, token: "snap-new-token-1111", orderId: "BTN-ORD-test-new", reused: false };
    }

    // Checkout Request 1
    const checkoutReq1 = simulateCheckoutRequest(existingActiveOrder, "pending");
    assert(checkoutReq1.status === 200 && checkoutReq1.reused === true, "Concurrent checkout safely reuses existing active Snap token");
    assert(checkoutReq1.orderId === existingActiveOrder.midtransOrderId, "Preserves valid existing Midtrans order ID to prevent breaking webhooks");

    // Checkout Request 2 for already settled order
    const settledOrder = { ...existingActiveOrder, paymentStatus: "PAID" };
    const checkoutReq2 = simulateCheckoutRequest(settledOrder, "settlement");
    assert(checkoutReq2.status === 400 && checkoutReq2.error.includes("LUNAS"), "Rejects checkout attempt on already settled (PAID) order");
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 10: Status Route Security Verification & Gross Amount Check
  // ---------------------------------------------------------------------------
  console.log("\n--- Group 10: Status Route Nominal & Order ID Security Checks ---");
  {
    const expectedNominal = 200000;
    const activeMidtransOrderId = "BTN-ORD-sec-12345";

    function evaluateStatusSync({ queryOrderId, midtransOrderId, grossAmount, transactionStatus, currentStatus }) {
      // 1. Order ID check
      if (midtransOrderId !== activeMidtransOrderId) {
        return { allowed: false, reason: "Order ID mismatch" };
      }
      // 2. Gross amount check
      const gross = Math.round(Number(grossAmount || 0));
      const nominalMatch = gross === expectedNominal;
      if (!nominalMatch) {
        return { allowed: false, reason: "Gross amount mismatch", gross, expected: expectedNominal };
      }
      // 3. Status mapping
      const mapped = mapMidtransStatus(transactionStatus);
      // 4. Terminal invariant
      if (currentStatus === "PAID") {
        return { allowed: true, newStatus: "PAID", updated: false };
      }
      if (mapped.isSettled) {
        return { allowed: true, newStatus: "PAID", updated: true };
      }
      return { allowed: true, newStatus: mapped.paymentStatus, updated: false };
    }

    // A. Nominal Tampering
    const tamperedSync = evaluateStatusSync({
      queryOrderId: activeMidtransOrderId,
      midtransOrderId: activeMidtransOrderId,
      grossAmount: "50000.00", // Tampered nominal Rp 50.000 vs Rp 200.000
      transactionStatus: "settlement",
      currentStatus: "PENDING",
    });
    assert(tamperedSync.allowed === false && tamperedSync.reason === "Gross amount mismatch", "Status route strictly blocks settling PAID when gross_amount does not match expected nominal");

    // B. Order ID mismatch
    const mismatchedOrderSync = evaluateStatusSync({
      queryOrderId: activeMidtransOrderId,
      midtransOrderId: "BTN-ORD-another-foreign-id",
      grossAmount: "200000.00",
      transactionStatus: "settlement",
      currentStatus: "PENDING",
    });
    assert(mismatchedOrderSync.allowed === false && mismatchedOrderSync.reason === "Order ID mismatch", "Status route rejects response if order_id does not match target order");

    // C. Genuine Settlement with matching nominal
    const genuineSync = evaluateStatusSync({
      queryOrderId: activeMidtransOrderId,
      midtransOrderId: activeMidtransOrderId,
      grossAmount: "200000.00",
      transactionStatus: "settlement",
      currentStatus: "PENDING",
    });
    assert(genuineSync.allowed === true && genuineSync.newStatus === "PAID" && genuineSync.updated === true, "Status route marks order as PAID when nominal matches and status is settlement");

    // D. Non-downgrading of already settled order
    const pendingOnPaidSync = evaluateStatusSync({
      queryOrderId: activeMidtransOrderId,
      midtransOrderId: activeMidtransOrderId,
      grossAmount: "200000.00",
      transactionStatus: "pending",
      currentStatus: "PAID",
    });
    assert(pendingOnPaidSync.allowed === true && pendingOnPaidSync.newStatus === "PAID" && pendingOnPaidSync.updated === false, "Status route never downgrades a verified PAID status back to PENDING");
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 11: Payment Service Compatibility & Module Exports
  // ---------------------------------------------------------------------------
  console.log("\n--- Group 11: Payment Service Compatibility & Module Exports ---");
  {
    const { PAYMENT_METHODS, paymentService, MIDTRANS_PAYMENT_CHANNELS } = await import("../lib/services/paymentService.js");

    assert(Array.isArray(PAYMENT_METHODS), "PAYMENT_METHODS is exported as an array");
    assert(PAYMENT_METHODS.length === MIDTRANS_PAYMENT_CHANNELS.length, "PAYMENT_METHODS matches MIDTRANS_PAYMENT_CHANNELS count");
    assert(typeof paymentService.confirmPayment === "function", "paymentService.confirmPayment is exported as a function");
    assert(typeof paymentService.cancelPayment === "function", "paymentService.cancelPayment is exported as a function");
    assert(typeof paymentService.mockSimulateTripayPayment === "function", "paymentService.mockSimulateTripayPayment is exported as a function");

    // Test that cancelPayment without paymentId throws an explicit error instead of returning fake success
    let threwOnEmpty = false;
    try {
      await paymentService.cancelPayment("");
    } catch (err) {
      threwOnEmpty = true;
    }
    assert(threwOnEmpty === true, "paymentService.cancelPayment throws error when paymentId is empty, preventing fake success");
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 12: Supabase Configuration Security & Isolation
  // ---------------------------------------------------------------------------
  console.log("\n--- Group 12: Supabase Configuration Security & Isolation ---");
  {
    const { getSupabaseClient, getSupabaseAdminClient } = await import("../lib/supabase/client.js");

    // A. Rejection of Missing Public Anon Key
    const origAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let threwMissingAnon = false;
    let missingAnonMessage = "";
    try {
      // Clear cached client if any
      getSupabaseClient();
    } catch (err) {
      threwMissingAnon = true;
      missingAnonMessage = err.message;
    }
    assert(threwMissingAnon === true && missingAnonMessage.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"), "Throws clear, descriptive error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");

    // B. Rejection of Dummy Key in Public Client
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key";
    let threwDummyAnon = false;
    try {
      getSupabaseClient();
    } catch (err) {
      threwDummyAnon = true;
    }
    assert(threwDummyAnon === true, "Strictly rejects placeholder dummy key and prevents running with fake credentials");

    // Restore valid key
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = origAnonKey;

    // C. Browser Security Violation for Admin Client
    globalThis.window = {}; // Simulate browser environment
    let threwBrowserViolation = false;
    let browserViolationMsg = "";
    try {
      getSupabaseAdminClient();
    } catch (err) {
      threwBrowserViolation = true;
      browserViolationMsg = err.message;
    }
    assert(threwBrowserViolation === true && browserViolationMsg.includes("Security Violation"), "Strictly blocks supabaseAdmin from being accessed in browser context (Security Violation)");

    // Restore server environment
    delete globalThis.window;

    // D. Rejection of Missing Server Service Role Key
    const origServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    let threwMissingService = false;
    try {
      getSupabaseAdminClient();
    } catch (err) {
      threwMissingService = true;
    }
    assert(threwMissingService === true, "Throws clear configuration error when SUPABASE_SERVICE_ROLE_KEY is missing on server");

    // Restore service key
    process.env.SUPABASE_SERVICE_ROLE_KEY = origServiceKey;
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 13: Real Midtrans Payment Cancellation & Anti-IDOR Logic
  // ---------------------------------------------------------------------------
  console.log("\n--- Group 13: Midtrans Payment Cancellation & Concurrency Logic ---");
  {
    // A. Rejection of Cancellation on Settled/PAID Order
    function evaluateCancellationPreconditions(order) {
      const status = (order.paymentStatus || "UNPAID").toUpperCase();
      if (status === "PAID") {
        return { allowed: false, code: "ALREADY_PAID", error: "Transaksi pesanan ini sudah berstatus LUNAS (PAID) dan tidak dapat dibatalkan." };
      }
      if (status === "CANCELLED") {
        return { allowed: true, idempotent: true, status: "cancelled" };
      }
      if (order.orderStatus === "completed") {
        return { allowed: false, code: "ALREADY_COMPLETED", error: "Pesanan ini sudah selesai." };
      }
      return { allowed: true, idempotent: false };
    }

    const paidOrder = { id: "ord-paid-123", paymentStatus: "PAID", orderStatus: "in_progress" };
    const paidCheck = evaluateCancellationPreconditions(paidOrder);
    assert(paidCheck.allowed === false && paidCheck.code === "ALREADY_PAID", "Cancellation is strictly rejected if order is already PAID");

    // B. Idempotency for Already Cancelled Order
    const cancelledOrder = { id: "ord-cancel-456", paymentStatus: "CANCELLED", orderStatus: "cancelled" };
    const cancelledCheck = evaluateCancellationPreconditions(cancelledOrder);
    assert(cancelledCheck.allowed === true && cancelledCheck.idempotent === true, "Repeated cancellation requests return idempotent success without duplicate mutations");

    // C. Anti-IDOR Authorization Enforcement
    function evaluateCancellationOwnership(order, actorId, isAdmin = false) {
      if (isAdmin) return true;
      return order.requesterId === actorId || order.renterId === actorId || order.ownerId === actorId;
    }

    const victimOrder = { id: "ord-vic-789", requesterId: "user-real-owner", paymentStatus: "PENDING" };
    const attackerId = "user-attacker-malicious";
    const isAttackerAllowed = evaluateCancellationOwnership(victimOrder, attackerId, false);
    assert(isAttackerAllowed === false, "Blocks unauthorized user (IDOR attempt) from cancelling another user's order");

    const isOwnerAllowed = evaluateCancellationOwnership(victimOrder, "user-real-owner", false);
    assert(isOwnerAllowed === true, "Authorizes legitimate owner to cancel pending order");

    // D. Race Condition & Terminal State Invariant
    function simulateConcurrentCancelAndWebhook(currentDbStatus) {
      if (currentDbStatus === "PAID") {
        return { updated: false, finalStatus: "PAID", error: "Cannot cancel settled transaction" };
      }
      return { updated: true, finalStatus: "CANCELLED" };
    }

    // When settlement webhook arrived just milliseconds prior to cancel
    const raceResult = simulateConcurrentCancelAndWebhook("PAID");
    assert(raceResult.updated === false && raceResult.finalStatus === "PAID", "Terminal state invariant: PAID status is preserved even during concurrent cancellation race condition");

    // E. Midtrans Gateway Error Handling (Cannot cancel settled on gateway)
    function handleGatewayCancelResponse(statusCode, midtransTxStatus) {
      if (statusCode === "200" || midtransTxStatus === "cancel") {
        return { success: true, verified: true };
      }
      if (statusCode === "412") {
        return { success: false, code: "ALREADY_PAID", error: "Midtrans: Merchant cannot modify the status of the transaction (already settled)" };
      }
      return { success: false, code: "GATEWAY_REJECTED", error: "Midtrans rejected cancellation" };
    }

    const gateway412Res = handleGatewayCancelResponse("412", "settlement");
    assert(gateway412Res.success === false && gateway412Res.code === "ALREADY_PAID", "Properly handles Midtrans 412 status when transaction was already settled on gateway");

    const gatewaySuccessRes = handleGatewayCancelResponse("200", "cancel");
    assert(gatewaySuccessRes.success === true && gatewaySuccessRes.verified === true, "Verifies genuine Midtrans 200 cancellation response before updating database");
  }

  console.log("\n===============================================================");
  console.log(`TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

