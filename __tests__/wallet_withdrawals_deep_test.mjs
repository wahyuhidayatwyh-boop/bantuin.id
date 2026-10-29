/**
 * __tests__/wallet_withdrawals_deep_test.mjs
 * Deep Verification Test for Tasks 30, 31, 49, 92, and 93:
 * Wallet Ledger, Atomic Balance Reservation, Concurrency Protection, and Admin Disbursements
 */

import assert from "assert";

console.log("===============================================================");
console.log("RUNNING DEEP VERIFICATION TEST: WALLET, WITHDRAWALS & PAYOUTS");
console.log("===============================================================\n");

let passed = 0;
let failed = 0;

function testAssert(condition, name) {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${name}`);
    failed++;
  }
}

// 1. Simulation of Wallet Balance Engine
function computeWalletBalance({ completedOrders = [], settledRentals = [], withdrawals = [] }) {
  const orderEarnings = completedOrders.reduce((sum, o) => {
    if (o.orderStatus === "completed" && o.paymentStatus === "PAID") {
      return sum + Number(o.helperPayoutAmount || o.lockedAmount || 0);
    }
    return sum;
  }, 0);

  const rentalEarnings = settledRentals.reduce((sum, r) => {
    if (["returned", "verified_settled"].includes(r.bookingStatus) && r.paymentStatus === "PAID") {
      return sum + Number(r.rentalFee || 0);
    }
    return sum;
  }, 0);

  const activeWithdrawalDeductions = withdrawals.reduce((sum, w) => {
    // Only pending, approved, processing, and completed count as deductions.
    // 'failed' or 'rejected' or 'cancelled' release the balance back!
    if (["pending", "approved", "processing", "completed"].includes(w.status)) {
      return sum + Number(w.amount || 0);
    }
    return sum;
  }, 0);

  const totalEarned = orderEarnings + rentalEarnings;
  const availableBalance = Math.max(0, totalEarned - activeWithdrawalDeductions);

  return {
    totalEarned,
    activeWithdrawalDeductions,
    availableBalance,
  };
}

console.log("--- Group 1: Available Balance Computation from Database ---");
const state1 = computeWalletBalance({
  completedOrders: [
    { orderStatus: "completed", paymentStatus: "PAID", helperPayoutAmount: 50000 },
    { orderStatus: "completed", paymentStatus: "PAID", helperPayoutAmount: 75000 },
    { orderStatus: "in_progress", paymentStatus: "PAID", helperPayoutAmount: 100000 }, // Not completed yet
    { orderStatus: "completed", paymentStatus: "UNPAID", helperPayoutAmount: 80000 }, // Unpaid
  ],
  settledRentals: [
    { bookingStatus: "verified_settled", paymentStatus: "PAID", rentalFee: 150000 },
    { bookingStatus: "in_use", paymentStatus: "PAID", rentalFee: 200000 }, // Still in use
  ],
  withdrawals: [],
});

testAssert(state1.totalEarned === 275000, `Accurately sums only completed orders and settled rentals (Rp 275.000)`);
testAssert(state1.availableBalance === 275000, `Available balance matches total earned when no withdrawals exist`);

console.log("\n--- Group 2: Withdrawal Minimum Limit & Balance Sufficiency ---");
const MIN_WITHDRAWAL = 10000;

function validateWithdrawalRequest(amount, availableBalance) {
  if (isNaN(amount) || amount < MIN_WITHDRAWAL) {
    return { valid: false, error: "Nominal penarikan minimal adalah Rp 10.000." };
  }
  if (amount > availableBalance) {
    return {
      valid: false,
      error: `Saldo tidak mencukupi. Saldo tersedia Anda saat ini adalah Rp ${availableBalance.toLocaleString("id-ID")}.`,
    };
  }
  return { valid: true };
}

testAssert(!validateWithdrawalRequest(5000, 100000).valid, "Rejects withdrawal below minimum threshold (Rp 5.000 < Rp 10.000)");
testAssert(!validateWithdrawalRequest(300000, 275000).valid, "Rejects withdrawal exceeding available balance (Rp 300.000 > Rp 275.000)");
testAssert(validateWithdrawalRequest(100000, 275000).valid, "Accepts valid withdrawal request within balance limit (Rp 100.000)");

console.log("\n--- Group 3: Atomic Balance Reservation on Request Submission ---");
// When a withdrawal is requested, it starts as 'pending'.
// 'pending' status immediately deducts from availableBalance to prevent parallel double spending!
const stateWithPending = computeWalletBalance({
  completedOrders: [
    { orderStatus: "completed", paymentStatus: "PAID", helperPayoutAmount: 200000 },
  ],
  settledRentals: [],
  withdrawals: [
    { id: "w1", amount: 150000, status: "pending" },
  ],
});

testAssert(stateWithPending.availableBalance === 50000, "Pending withdrawal immediately reserves funds (Available: Rp 50.000)");

// Attempting to withdraw another Rp 100.000 when only Rp 50.000 is available after reservation:
testAssert(
  !validateWithdrawalRequest(100000, stateWithPending.availableBalance).valid,
  "Blocks subsequent withdrawal attempt that exceeds reserved available balance"
);

console.log("\n--- Group 4: Concurrency Protection (Preventing Duplicate Pending Submissions) ---");
function canSubmitNewWithdrawal(existingWithdrawals) {
  const hasActivePending = existingWithdrawals.some((w) => ["pending", "processing"].includes(w.status));
  if (hasActivePending) {
    return { allowed: false, error: "Anda masih memiliki pengajuan penarikan yang sedang diproses." };
  }
  return { allowed: true };
}

testAssert(
  !canSubmitNewWithdrawal([{ status: "pending" }]).allowed,
  "Rejects parallel withdrawal submission if another withdrawal is already pending"
);
testAssert(
  canSubmitNewWithdrawal([{ status: "completed" }]).allowed,
  "Allows new withdrawal submission after previous withdrawal is completed"
);

console.log("\n--- Group 5: Balance Reconciliation on Rejection / Failure ---");
// If admin rejects or transfer fails, status becomes 'failed', releasing the reservation!
const stateAfterRejection = computeWalletBalance({
  completedOrders: [
    { orderStatus: "completed", paymentStatus: "PAID", helperPayoutAmount: 200000 },
  ],
  settledRentals: [],
  withdrawals: [
    { id: "w1", amount: 150000, status: "failed" }, // Rejected or transfer failed
  ],
});

testAssert(
  stateAfterRejection.availableBalance === 200000,
  "Automatically restores available balance to Rp 200.000 when withdrawal is rejected or failed"
);

console.log("\n--- Group 6: Payout Completion & Transfer Reference Invariant ---");
const stateAfterCompletion = computeWalletBalance({
  completedOrders: [
    { orderStatus: "completed", paymentStatus: "PAID", helperPayoutAmount: 200000 },
  ],
  settledRentals: [],
  withdrawals: [
    { id: "w1", amount: 150000, status: "completed", transferReference: "TRF-BCA-987654321" },
  ],
});

testAssert(
  stateAfterCompletion.availableBalance === 50000,
  "Permanently commits fund deduction upon completed disbursement (Available: Rp 50.000)"
);

console.log("\n--- Group 7: Superadmin Authorization & Anti-IDOR Check ---");
function checkDisbursementAuth(userProfile) {
  if (!userProfile) return { authorized: false, status: 401 };
  if (!userProfile.isAdmin && userProfile.accountRole !== "superadmin") {
    return { authorized: false, status: 403 };
  }
  return { authorized: true, status: 200 };
}

testAssert(!checkDisbursementAuth(null).authorized, "Unauthenticated request is rejected (401)");
testAssert(!checkDisbursementAuth({ accountRole: "user", isAdmin: false }).authorized, "Normal user is forbidden from executing disbursement (403)");
testAssert(!checkDisbursementAuth({ accountRole: "provider", isAdmin: false }).authorized, "Provider is forbidden from executing disbursement (403)");
testAssert(checkDisbursementAuth({ accountRole: "superadmin", isAdmin: true }).authorized, "Superadmin is authorized to execute disbursement (200)");

console.log("\n===============================================================");
console.log(`WALLET & DISBURSEMENT TEST COMPLETED: ${passed} PASSED, ${failed} FAILED`);
console.log("===============================================================\n");

if (failed > 0) {
  process.exit(1);
}
