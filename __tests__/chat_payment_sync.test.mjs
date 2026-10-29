import assert from "node:assert/strict";
import crypto from "node:crypto";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register(
  pathToFileURL(
    "C:/Users/asuss/.gemini/antigravity/brain/bd0a9413-f0b4-4df8-9848-271747688a84/scratch/nextjs-loader.mjs"
  ).href
);

await import("dotenv/config");
const { prisma } = await import("file:///d:/APLIKASI/Bantuin/lib/prisma.js");
const { generateTokens } = await import("file:///d:/APLIKASI/Bantuin/lib/auth/jwt.js");
const chatRoomsRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/chat/rooms/route.js");

function makeReq(url, { method = "GET", token = null, body = undefined, headers = {} } = {}) {
  const initHeaders = new Headers(headers);
  if (token) initHeaders.set("authorization", `Bearer ${token}`);
  let initBody = body;
  if (body !== undefined && !(body instanceof FormData) && typeof body !== "string") {
    initHeaders.set("content-type", "application/json");
    initBody = JSON.stringify(body);
  }
  return new Request(url, {
    method,
    headers: initHeaders,
    body: initBody,
  });
}

async function runTests() {
  console.log("=== RUNNING CHAT PAYMENT SYNCHRONIZATION TESTS ===");

  // TEST 1: Direct Room Creation -> UNPAID & inquiry -> Spoofing rejected with 403 (SEC-03)
  {
    const clientId = crypto.randomUUID();
    const helperId = crypto.randomUUID();

    const client = await prisma.profile.create({
      data: {
        id: clientId,
        email: `jasa_client_${Date.now()}@test.ui.ac.id`,
        fullName: "Jasa Client",
        accountRole: "user",
        isAdmin: false,
        verificationStatus: "verified",
      },
    });

    const helper = await prisma.profile.create({
      data: {
        id: helperId,
        email: `jasa_helper_${Date.now()}@test.ui.ac.id`,
        fullName: "Jasa Helper",
        accountRole: "provider",
        isAdmin: false,
        verificationStatus: "verified",
      },
    });

    const clientTokens = generateTokens(client);

    // Create room via partnerId
    const createRes = await chatRoomsRoute.POST(
      makeReq("http://localhost:3000/api/chat/rooms", {
        method: "POST",
        token: clientTokens.accessToken,
        body: {
          partnerId: helper.id,
          initialMessage: "Halo, saya tertarik dengan jasa Anda",
        },
      })
    );
    assert.equal(createRes.status, 200);
    const createData = await createRes.json();
    const roomId = createData.data?.id;
    assert.ok(roomId, "Room ID created");

    // Verify initial status via GET
    const getRes = await chatRoomsRoute.GET(
      makeReq(`http://localhost:3000/api/chat/rooms?roomId=${roomId}`, {
        method: "GET",
        token: clientTokens.accessToken,
      })
    );
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    const room = getData.data?.find((r) => r.id === roomId) || getData.data?.[0];
    assert.equal(room.paymentStatus, "UNPAID");
    assert.equal(room.orderStatus, "inquiry");
    assert.equal(room.stage, "inquiry");

    // SEC-03: Attempt to spoof paymentStatus to PAID without proof
    const spoofRes = await chatRoomsRoute.PATCH(
      makeReq("http://localhost:3000/api/chat/rooms", {
        method: "PATCH",
        token: clientTokens.accessToken,
        body: {
          orderRoomId: roomId,
          status: "paid_escrow",
          paymentStatus: "PAID",
        },
      })
    );
    assert.equal(spoofRes.status, 403, "Client cannot arbitrarily set PAID without proof");
    console.log("✅ [PASS] Jasa room: starts UNPAID/inquiry & client spoofing is rejected with 403");

    // Clean up
    await prisma.chatMessage.deleteMany({ where: { orderRoomId: roomId } });
    await prisma.orderRoom.deleteMany({ where: { id: roomId } });
    await prisma.request.deleteMany({ where: { requesterId: client.id } });
    await prisma.profile.deleteMany({ where: { id: { in: [client.id, helper.id] } } });
  }

  // TEST 2: Sewa room auto-synchronization & self-healing from RentalBooking
  {
    const renterId = crypto.randomUUID();
    const ownerId = crypto.randomUUID();

    const renter = await prisma.profile.create({
      data: {
        id: renterId,
        email: `renter_${Date.now()}@test.ui.ac.id`,
        fullName: "Renter User",
        accountRole: "user",
        isAdmin: false,
        verificationStatus: "verified",
      },
    });

    const owner = await prisma.profile.create({
      data: {
        id: ownerId,
        email: `owner_${Date.now()}@test.ui.ac.id`,
        fullName: "Owner User",
        accountRole: "partner",
        isAdmin: false,
        verificationStatus: "verified",
      },
    });

    const rental = await prisma.rental.create({
      data: {
        ownerId: owner.id,
        title: "Kamera Sony A7III Sync Test",
        description: "Rental kamera untuk testing",
        category: "Kamera",
        dailyPrice: 250000,
        depositAmount: 500000,
        pickupLocation: "Kampus UI Depok",
        isAvailable: true,
      },
    });

    const booking = await prisma.rentalBooking.create({
      data: {
        rental: { connect: { id: rental.id } },
        renter: { connect: { id: renter.id } },
        owner: { connect: { id: owner.id } },
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        totalDays: 1,
        rentalFee: 250000,
        depositFee: 500000,
        totalAmount: 750000,
        paymentStatus: "PAID",
        bookingStatus: "confirmed_by_owner",
        midtransOrderId: `RENTAL-SYNC-${Date.now()}`,
      },
    });

    // Create a dummy Request container for the order room
    const requestContainer = await prisma.request.create({
      data: {
        requesterId: renter.id,
        category: "Sewa Barang",
        title: "Sewa Kamera Sony",
        description: `Booking #${booking.id} [RENTAL_ID:${rental.id}] [BOOKING_ID:${booking.id}]`,
        mode: "offline",
        locationName: "Kampus UI Depok",
        deadline: new Date(Date.now() + 86400000),
        rewardAmount: 750000,
        status: "in_progress",
      },
    });

    // OrderRoom has stale UNPAID/PENDING status
    const room = await prisma.orderRoom.create({
      data: {
        requestId: requestContainer.id,
        requesterId: renter.id,
        helperId: owner.id,
        lockedAmount: 750000,
        platformFee: 0,
        helperPayoutAmount: 750000,
        xenditPaymentStatus: "PENDING",
        orderStatus: "room_created",
      },
    });

    const renterTokens = generateTokens(renter);

    // Query GET /api/chat/rooms — Should detect booking.paymentStatus === 'PAID' via description metadata and self-heal
    const getRes = await chatRoomsRoute.GET(
      makeReq(`http://localhost:3000/api/chat/rooms?roomId=${room.id}`, {
        method: "GET",
        token: renterTokens.accessToken,
      })
    );
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    const resolvedRoom = getData.data?.find((r) => r.id === room.id) || getData.data?.[0];

    assert.equal(resolvedRoom.paymentStatus, "PAID");
    assert.equal(resolvedRoom.orderStatus, "paid_escrow");
    assert.equal(resolvedRoom.stage, "active");

    // Verify DB self-healing (give async fire-and-forget 300ms to persist)
    await new Promise((r) => setTimeout(r, 300));
    const healedDbRoom = await prisma.orderRoom.findUnique({ where: { id: room.id } });
    assert.equal(healedDbRoom.paymentStatus, "PAID");
    assert.equal(healedDbRoom.xenditPaymentStatus, "PAID");
    console.log("✅ [PASS] Sewa room: auto-syncs to PAID/paid_escrow from linked RentalBooking and self-heals DB");

    // Clean up
    await prisma.orderRoom.deleteMany({ where: { id: room.id } });
    await prisma.request.deleteMany({ where: { id: requestContainer.id } });
    await prisma.rentalBooking.deleteMany({ where: { id: booking.id } });
    await prisma.rental.deleteMany({ where: { id: rental.id } });
    await prisma.profile.deleteMany({ where: { id: { in: [renter.id, owner.id] } } });
  }

  // TEST 3: Bantuan room auto-synchronization from Request status = in_progress
  {
    const requesterId = crypto.randomUUID();
    const helperId = crypto.randomUUID();

    const requester = await prisma.profile.create({
      data: {
        id: requesterId,
        email: `req_${Date.now()}@test.ui.ac.id`,
        fullName: "Requester User",
        accountRole: "user",
        isAdmin: false,
        verificationStatus: "verified",
      },
    });

    const helper = await prisma.profile.create({
      data: {
        id: helperId,
        email: `help_${Date.now()}@test.ui.ac.id`,
        fullName: "Helper User",
        accountRole: "user",
        isAdmin: false,
        verificationStatus: "verified",
      },
    });

    const request = await prisma.request.create({
      data: {
        requesterId: requester.id,
        title: "Bantu Beli Buku di Salemba",
        category: "Akademik",
        description: "Bantu beli buku di toko buku Salemba",
        mode: "offline",
        locationName: "Salemba",
        deadline: new Date(Date.now() + 86400000),
        rewardAmount: 50000,
        status: "in_progress",
        selectedHelperId: helper.id,
      },
    });

    const room = await prisma.orderRoom.create({
      data: {
        requestId: request.id,
        requesterId: requester.id,
        helperId: helper.id,
        lockedAmount: 50000,
        platformFee: 0,
        helperPayoutAmount: 50000,
        xenditPaymentStatus: "UNPAID",
        orderStatus: "room_created",
      },
    });

    const requesterTokens = generateTokens(requester);

    const getRes = await chatRoomsRoute.GET(
      makeReq(`http://localhost:3000/api/chat/rooms?roomId=${room.id}`, {
        method: "GET",
        token: requesterTokens.accessToken,
      })
    );
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    const resolvedRoom = getData.data?.find((r) => r.id === room.id) || getData.data?.[0];

    assert.equal(resolvedRoom.paymentStatus, "PAID");
    assert.equal(resolvedRoom.orderStatus, "paid_escrow");
    assert.equal(resolvedRoom.stage, "active");
    console.log("✅ [PASS] Bantuan room: auto-syncs to PAID/paid_escrow when request is in_progress");

    // Clean up
    await prisma.orderRoom.deleteMany({ where: { id: room.id } });
    await prisma.request.deleteMany({ where: { id: request.id } });
    await prisma.profile.deleteMany({ where: { id: { in: [requester.id, helper.id] } } });
  }

  console.log("🎉 ALL CHAT PAYMENT SYNCHRONIZATION TESTS PASSED!");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
