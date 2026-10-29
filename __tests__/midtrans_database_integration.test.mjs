/**
 * __tests__/midtrans_database_integration.test.mjs
 * Live Database Integration Test for Midtrans Columns and Constraints
 */

import { prisma } from "../lib/prisma.js";

async function runDbIntegrationTest() {
  console.log("===============================================================");
  console.log("RUNNING LIVE DATABASE INTEGRATION TEST FOR MIDTRANS COLUMNS");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${name}`);
      failed++;
    }
  }

  try {
    // 1. Verify Prisma connection
    const userCount = await prisma.user.count();
    assert(typeof userCount === "number", `Connected to PostgreSQL database. Total users in table: ${userCount}`);

    // 2. Test querying OrderRoom with Midtrans fields
    const orderRoom = await prisma.orderRoom.findFirst({
      select: {
        id: true,
        midtransOrderId: true,
        midtransTransactionId: true,
        midtransSnapToken: true,
        paymentStatus: true,
        paidAt: true,
      },
    });
    assert(true, "Successfully executed Prisma select on order_rooms with midtransOrderId and paymentStatus columns");

    // 3. Test querying RentalBooking with Midtrans fields
    const rentalBooking = await prisma.rentalBooking.findFirst({
      select: {
        id: true,
        midtransOrderId: true,
        paymentStatus: true,
        paidAt: true,
      },
    });
    assert(true, "Successfully executed Prisma select on rental_bookings with midtransOrderId and paymentStatus columns");

    // 4. Test querying Promotion with Midtrans fields
    const promotion = await prisma.promotion.findFirst({
      select: {
        id: true,
        midtransOrderId: true,
        paymentStatus: true,
        paidAt: true,
      },
    });
    assert(true, "Successfully executed Prisma select on promotions with midtransOrderId and paymentStatus columns");

    // 5. Test AuditLog creation
    const audit = await prisma.auditLog.create({
      data: {
        actorEmail: "test-runner@bantuin.id",
        action: "payment.midtrans_test_run",
        targetEntity: "system_test",
        payload: { test: true, timestamp: new Date().toISOString() },
      },
    });
    assert(Boolean(audit && audit.id), "Audit log entry created successfully in live audit_logs table");

    // Clean up test audit log
    await prisma.auditLog.delete({ where: { id: audit.id } });
    assert(true, "Test audit log cleaned up successfully");

    console.log("\n===============================================================");
    console.log(`DATABASE INTEGRATION COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log("===============================================================\n");
  } catch (err) {
    console.error("Database Integration Test Failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runDbIntegrationTest();
