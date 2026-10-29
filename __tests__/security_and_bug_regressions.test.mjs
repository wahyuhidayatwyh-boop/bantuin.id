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
const {
  generateTokens,
  generateActionToken,
  verifyAccessToken,
} = await import("file:///d:/APLIKASI/Bantuin/lib/auth/jwt.js");

// Import Route Handlers
const googleAuthRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/auth/google/route.js");
const registerRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/auth/register/route.js");
const verifyEmailRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/auth/verify-email/route.js");
const userProfileRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/user/profile/route.js");
const profileUpdateRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/profile/update/route.js");
const adminOrdersRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/admin/orders/route.js");
const disbursementsExecuteRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/disbursements/execute/route.js");
const chatMessagesRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/chat/messages/route.js");
const chatRoomsRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/chat/rooms/route.js");
const uploadRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/upload/route.js");
const walletRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/profile/wallet/route.js");
const walletTxRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/wallet/transactions/route.js");
const withdrawalReqRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/withdrawals/request/route.js");
const promoOrderRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/promotions/order/route.js");
const rentalBookRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/rentals/[id]/book/route.js");
const rentalStatusRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/rentals/bookings/[id]/status/route.js");
const serviceOrderRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/services/[id]/order/route.js");
const orderDetailRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/orders/[id]/route.js");
const midtransWebhookRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/webhooks/midtrans/route.js");
const bantuinAjukanRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/bantuin/[id]/ajukan/route.js");
const requestOffersRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/requests/[id]/offers/route.js");
const loginRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/auth/login/route.js");
const requestsRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/requests/route.js");
const requestDetailRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/requests/[id]/route.js");
const userActivitiesRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/user/activities/route.js");
const reviewsRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/reviews/route.js");
const voucherValidateRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/vouchers/validate/route.js");
const submitProofRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/orders/[id]/submit-proof/route.js");
const confirmCompletionRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/orders/[id]/confirm-completion/route.js");
const paymentCancelRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/payments/cancel/route.js");
const profileKycRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/profile/kyc/route.js");
const publicProfileRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/profile/[id]/route.js");
const refundDepositRoute = await import("file:///d:/APLIKASI/Bantuin/app/api/rentals/bookings/[id]/refund-deposit/route.js");
const storageHelper = await import("file:///d:/APLIKASI/Bantuin/lib/supabase/storage.js");

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
    body: method === "GET" || method === "HEAD" ? undefined : initBody,
  });
}

const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: "PASS" });
    console.log(`✅ [PASS] ${name}`);
  } catch (err) {
    results.push({ name, status: "FAIL", error: err.message });
    console.error(`❌ [FAIL] ${name}:`, err);
  }
}

// Create isolated temporary test fixtures in DB and clean them up in finally{}
const testRunId = Date.now().toString().slice(-6);
const userAId = crypto.randomUUID();
const userBId = crypto.randomUUID();
const userCId = crypto.randomUUID();
const userAEmail = `sec_test_a_${testRunId}@bantuin.test`;
const userBEmail = `sec_test_b_${testRunId}@bantuin.test`;
const userCEmail = `sec_test_c_${testRunId}@bantuin.test`;

let testRequestId = null;
let testOrderRoomId = null;
let testMsgAId = null;
let testServiceId = null;
let testRentalId = null;
let testBookingId = null;
let testPromoId = null;
let testCompletedWithdrawalId = null;

try {
  // Seed 3 temporary test profiles (User A: requester, User B: verified partner/helper, User C: third-party outsider)
  await prisma.profile.createMany({
    data: [
      {
        id: userAId,
        email: userAEmail,
        fullName: "Test User A",
        accountRole: "user",
        isAdmin: false,
        verificationStatus: "unverified",
        idNumber: "3201012345670001",
      },
      {
        id: userBId,
        email: userBEmail,
        fullName: "Test Partner B",
        accountRole: "partner",
        isPartner: true,
        isAdmin: false,
        verificationStatus: "verified",
        payoutBank: "BCA",
        payoutAccountNumber: "1234567890",
        payoutAccountHolder: "Test Partner B",
      },
      {
        id: userCId,
        email: userCEmail,
        fullName: "Test Outsider C",
        accountRole: "user",
        isAdmin: false,
        verificationStatus: "unverified",
      },
    ],
  });

  const tokenA = generateTokens({ id: userAId, email: userAEmail, role: "user" }).accessToken;
  const tokenB = generateTokens({ id: userBId, email: userBEmail, role: "partner" }).accessToken;
  const tokenC = generateTokens({ id: userCId, email: userCEmail, role: "user" }).accessToken;

  // ---------------------------------------------------------------------------
  // 1. SEC-01: OAuth Account Takeover Prevention
  // ---------------------------------------------------------------------------
  await test("SEC-01: POST /api/auth/google menolak login email mentah tanpa token OAuth valid (401)", async () => {
    const req = makeReq("http://localhost:3000/api/auth/google", {
      method: "POST",
      body: { email: userBEmail, name: "Attacker" },
    });
    const res = await googleAuthRoute.POST(req);
    assert.equal(res.status, 401);
  });

  await test("SEC-01: POST /api/auth/register menolak klaim authProvider='google' tanpa token OAuth valid (401)", async () => {
    const req = makeReq("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: { email: userBEmail, fullName: "Attacker", authProvider: "google" },
    });
    const res = await registerRoute.POST(req);
    assert.equal(res.status, 401);
  });

  // ---------------------------------------------------------------------------
  // 2. SEC-02: Privilege Escalation, Self-KYC, Admin Guard & PII Masking
  // ---------------------------------------------------------------------------
  await test("SEC-02: PATCH /api/user/profile menolak eskalasi accountRole='admin' (403)", async () => {
    const req = makeReq("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      token: tokenA,
      body: { accountRole: "admin" },
    });
    const res = await userProfileRoute.PATCH(req);
    assert.equal(res.status, 403);
  });

  await test("SEC-02: PATCH /api/user/profile menolak manipulasi verificationStatus='verified' (403)", async () => {
    const req = makeReq("http://localhost:3000/api/user/profile", {
      method: "PATCH",
      token: tokenA,
      body: { verificationStatus: "verified" },
    });
    const res = await userProfileRoute.PATCH(req);
    assert.equal(res.status, 403);
  });

  await test("SEC-02: PATCH /api/profile/update menolak eskalasi accountRole='superadmin' (403)", async () => {
    const req = makeReq("http://localhost:3000/api/profile/update", {
      method: "PATCH",
      token: tokenA,
      body: { accountRole: "superadmin" },
    });
    const res = await profileUpdateRoute.PATCH(req);
    assert.equal(res.status, 403);
  });

  await test("SEC-02: GET /api/user/profile menyamarkan (masking) NIK idNumber", async () => {
    const req = makeReq("http://localhost:3000/api/user/profile", {
      method: "GET",
      token: tokenA,
    });
    const res = await userProfileRoute.GET(req);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.notEqual(json.data.idNumber, "3201012345670001");
    assert.ok(json.data.idNumber.includes("*"));
  });

  await test("SEC-02: GET /api/admin/orders & POST /api/disbursements/execute menolak non-admin (403)", async () => {
    const req1 = makeReq("http://localhost:3000/api/admin/orders", {
      method: "GET",
      token: tokenB,
    });
    const res1 = await adminOrdersRoute.GET(req1);
    assert.equal(res1.status, 403);

    const req2 = makeReq("http://localhost:3000/api/disbursements/execute", {
      method: "POST",
      token: tokenB,
      body: { withdrawalId: crypto.randomUUID() },
    });
    const res2 = await disbursementsExecuteRoute.POST(req2);
    assert.equal(res2.status, 403);
  });

  // ---------------------------------------------------------------------------
  // 3. SEC-08: Email Verification Token & Separation from KYC
  // ---------------------------------------------------------------------------
  await test("SEC-08: POST /api/auth/verify-email menolak request tanpa token dan tidak mengubah KYC", async () => {
    const reqNoToken = makeReq("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      body: { email: userAEmail },
    });
    const resNoToken = await verifyEmailRoute.POST(reqNoToken);
    assert.ok(resNoToken.status === 401 || resNoToken.status === 400);

    const validEmailToken = generateActionToken({ email: userAEmail }, "verify_email", "15m");
    // Action token must not be accepted as an access token
    assert.equal(verifyAccessToken(validEmailToken), null);

    const reqValid = makeReq("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      body: { email: userAEmail, token: validEmailToken },
    });
    const resValid = await verifyEmailRoute.POST(reqValid);
    assert.equal(resValid.status, 200);

    const refreshedA = await prisma.profile.findUnique({ where: { id: userAId } });
    assert.equal(refreshedA.verificationStatus, "unverified");
  });

  // ---------------------------------------------------------------------------
  // 4. SEC-05, SEC-03, BUG-01, BUG-03: Bantuan Offers, Chat Auth/IDOR & Escrow Status
  // ---------------------------------------------------------------------------
  const createdReq = await prisma.request.create({
    data: {
      requesterId: userAId,
      category: "Bantuan Harian",
      title: "Test Tugas Keamanan",
      description: "Deskripsi tugas pengujian regresi",
      mode: "online",
      locationName: "Online",
      deadline: new Date(Date.now() + 86400000),
      rewardAmount: 50000,
      status: "published",
    },
  });
  testRequestId = createdReq.id;

  await test("BUG-03: POST & GET /api/bantuin/[id]/ajukan dan GET /api/requests/[id]/offers berjalan tanpa error Prisma/ReferenceError", async () => {
    const postOfferReq = makeReq(`http://localhost:3000/api/bantuin/${testRequestId}/ajukan`, {
      method: "POST",
      token: tokenB,
      body: { pitchMessage: "Saya siap membantu!", proposedPrice: 50000 },
    });
    const postOfferRes = await bantuinAjukanRoute.POST(postOfferReq, {
      params: Promise.resolve({ id: testRequestId }),
    });
    assert.equal(postOfferRes.status, 200);

    const getAjukanReq = makeReq(`http://localhost:3000/api/bantuin/${testRequestId}/ajukan`, {
      method: "GET",
      token: tokenA,
    });
    const getAjukanRes = await bantuinAjukanRoute.GET(getAjukanReq, {
      params: Promise.resolve({ id: testRequestId }),
    });
    assert.equal(getAjukanRes.status, 200);

    const getOffersReq = makeReq(`http://localhost:3000/api/requests/${testRequestId}/offers`, {
      method: "GET",
      token: tokenA,
    });
    const getOffersRes = await requestOffersRoute.GET(getOffersReq, {
      params: Promise.resolve({ id: testRequestId }),
    });
    assert.equal(getOffersRes.status, 200);
    const offersJson = await getOffersRes.json();
    assert.equal(offersJson.data[0].helper.isKycVerified, true);
  });

  await test("SEC-03: POST /api/chat/rooms mengabaikan klaim isPaid=true dari klien dan membuat room UNPAID", async () => {
    const createRoomReq = makeReq("http://localhost:3000/api/chat/rooms", {
      method: "POST",
      token: tokenA,
      body: {
        requestId: testRequestId,
        helperId: userBId,
        isPaid: true,
        paymentStatus: "PAID",
      },
    });
    const createRoomRes = await chatRoomsRoute.POST(createRoomReq);
    assert.equal(createRoomRes.status, 200);
    const roomJson = await createRoomRes.json();
    testOrderRoomId = roomJson.data.id;
    assert.equal(roomJson.data.paymentStatus, "UNPAID");
  });

  await test("SEC-03: PATCH /api/chat/rooms menolak penetapan sepihak paymentStatus='PAID' atau status='completed' sebelum lunas", async () => {
    const fakePaidReq = makeReq("http://localhost:3000/api/chat/rooms", {
      method: "PATCH",
      token: tokenA,
      body: { orderRoomId: testOrderRoomId, paymentStatus: "PAID", status: "paid_escrow" },
    });
    const fakePaidRes = await chatRoomsRoute.PATCH(fakePaidReq);
    assert.equal(fakePaidRes.status, 403);

    const fakeCompleteReq = makeReq("http://localhost:3000/api/chat/rooms", {
      method: "PATCH",
      token: tokenA,
      body: { orderRoomId: testOrderRoomId, status: "completed" },
    });
    const fakeCompleteRes = await chatRoomsRoute.PATCH(fakeCompleteReq);
    assert.equal(fakeCompleteRes.status, 400);
  });

  await test("SEC-05: /api/chat/messages memblokir anonim (401), pihak luar (403), dan edit/hapus pesan orang lain (403)", async () => {
    // Anonim baca chat -> 401
    const anonGet = makeReq(`http://localhost:3000/api/chat/messages?roomId=${testOrderRoomId}`);
    const anonGetRes = await chatMessagesRoute.GET(anonGet);
    assert.equal(anonGetRes.status, 401);

    // Outsider C baca chat -> 403
    const outsiderGet = makeReq(`http://localhost:3000/api/chat/messages?roomId=${testOrderRoomId}`, {
      token: tokenC,
    });
    const outsiderGetRes = await chatMessagesRoute.GET(outsiderGet);
    assert.equal(outsiderGetRes.status, 403);

    // User A kirim pesan -> 200
    const sendAReq = makeReq("http://localhost:3000/api/chat/messages", {
      method: "POST",
      token: tokenA,
      body: { orderRoomId: testOrderRoomId, message: "Halo Partner B!" },
    });
    const sendARes = await chatMessagesRoute.POST(sendAReq);
    assert.equal(sendARes.status, 200);
    const sendAJson = await sendARes.json();
    testMsgAId = sendAJson.data.id;

    // Partner B mencoba mengedit pesan milik User A -> 403
    const editByBReq = makeReq("http://localhost:3000/api/chat/messages", {
      method: "PATCH",
      token: tokenB,
      body: { messageId: testMsgAId, message: "Pesan dibajak" },
    });
    const editByBRes = await chatMessagesRoute.PATCH(editByBReq);
    assert.equal(editByBRes.status, 403);

    // Partner B mencoba menghapus pesan milik User A -> 403
    const delByBReq = makeReq(`http://localhost:3000/api/chat/messages?messageId=${testMsgAId}`, {
      method: "DELETE",
      token: tokenB,
    });
    const delByBRes = await chatMessagesRoute.DELETE(delByBReq);
    assert.equal(delByBRes.status, 403);
  });

  // ---------------------------------------------------------------------------
  // 5. NV-02 & BUG-01: Midtrans Webhook Signature & Settlement without paid_escrow crash
  // ---------------------------------------------------------------------------
  await test("NV-02 & BUG-01: POST /api/webhooks/midtrans menolak signature palsu (403) dan menerima settlement valid tanpa error paid_escrow (200)", async () => {
    const customMidtransId = `ORDER-TEST-${testRunId}`;
    await prisma.orderRoom.update({
      where: { id: testOrderRoomId },
      data: { midtransOrderId: customMidtransId, lockedAmount: 50000 },
    });

    // Signature palsu -> 403
    const badWebhookReq = makeReq("http://localhost:3000/api/webhooks/midtrans", {
      method: "POST",
      body: {
        order_id: customMidtransId,
        status_code: "200",
        gross_amount: "50000.00",
        transaction_status: "settlement",
        signature_key: "deadbeef",
      },
    });
    const badWebhookRes = await midtransWebhookRoute.POST(badWebhookReq);
    assert.equal(badWebhookRes.status, 403);

    // Signature valid -> 200 & paymentStatus = PAID
    const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
    if (serverKey && serverKey.length >= 12) {
      const validSig = crypto
        .createHash("sha512")
        .update(`${customMidtransId}20050000.00${serverKey}`)
        .digest("hex");
      const goodWebhookReq = makeReq("http://localhost:3000/api/webhooks/midtrans", {
        method: "POST",
        body: {
          order_id: customMidtransId,
          status_code: "200",
          gross_amount: "50000.00",
          transaction_status: "settlement",
          fraud_status: "accept",
          payment_type: "qris",
          transaction_id: `tx-${testRunId}`,
          signature_key: validSig,
        },
      });
      const goodWebhookRes = await midtransWebhookRoute.POST(goodWebhookReq);
      assert.equal(goodWebhookRes.status, 200);
      const updatedRoom = await prisma.orderRoom.findUnique({ where: { id: testOrderRoomId } });
      assert.equal(updatedRoom.paymentStatus, "PAID");
      assert.equal(updatedRoom.orderStatus, "room_created");
    }
  });

  // ---------------------------------------------------------------------------
  // 6. SEC-06: Upload Authentication & Bucket Allowlist
  // ---------------------------------------------------------------------------
  await test("SEC-06: POST /api/upload menolak anonim (401) dan menolak bucket di luar allowlist (400)", async () => {
    const anonForm = new FormData();
    anonForm.append("bucket", "avatars");
    const anonUploadReq = makeReq("http://localhost:3000/api/upload", {
      method: "POST",
      body: anonForm,
    });
    const anonUploadRes = await uploadRoute.POST(anonUploadReq);
    assert.equal(anonUploadRes.status, 401);

    const badBucketForm = new FormData();
    badBucketForm.append("bucket", "arbitrary_untrusted_bucket");
    badBucketForm.append(
      "file",
      new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" }),
      "test.jpg"
    );
    const badBucketReq = makeReq("http://localhost:3000/api/upload", {
      method: "POST",
      token: tokenA,
      body: badBucketForm,
    });
    const badBucketRes = await uploadRoute.POST(badBucketReq);
    assert.equal(badBucketRes.status, 400);
  });

  // ---------------------------------------------------------------------------
  // 7. SEC-03, SEC-07, BUG-02, BUG-05: Service Order, Rental Booking, Promotions & IDOR
  // ---------------------------------------------------------------------------
  const createdService = await prisma.service.create({
    data: {
      providerId: userBId,
      category: "Jasa Desain",
      title: "Jasa Desain Uji Regresi",
      description: "Layanan uji regresi",
      startingPrice: 75000,
      completedOrders: 0,
    },
  });
  testServiceId = createdService.id;

  await test("SEC-03 & BUG-05: POST /api/services/[id]/order menolak klaim isPaid=true dan tidak menaikkan completedOrders sebelum selesai", async () => {
    const orderServiceReq = makeReq(`http://localhost:3000/api/services/${testServiceId}/order`, {
      method: "POST",
      token: tokenA,
      body: { isPaid: true, paymentStatus: "PAID", customPrice: 1000, notes: "Order uji" },
    });
    const orderServiceRes = await serviceOrderRoute.POST(orderServiceReq, {
      params: Promise.resolve({ id: testServiceId }),
    });
    assert.equal(orderServiceRes.status, 201);
    const orderServiceJson = await orderServiceRes.json();
    assert.equal(orderServiceJson.data.orderRoom.paymentStatus, "UNPAID");
    assert.equal(Number(orderServiceJson.data.orderRoom.lockedAmount), 75000);

    const svcAfterCreate = await prisma.service.findUnique({ where: { id: testServiceId } });
    assert.equal(svcAfterCreate.completedOrders, 0);

    // Cleanup service order room & request
    await prisma.chatMessage.deleteMany({ where: { orderRoomId: orderServiceJson.data.orderRoom.id } });
    await prisma.orderRoom.delete({ where: { id: orderServiceJson.data.orderRoom.id } });
    await prisma.request.delete({ where: { id: orderServiceJson.data.request.id } });
  });

  const createdRental = await prisma.rental.create({
    data: {
      ownerId: userBId,
      category: "Kamera",
      title: "Kamera Sony Uji Regresi",
      description: "Unit sewa uji regresi",
      dailyPrice: 100000,
      depositAmount: 50000,
      pickupLocation: "Kampus UI Depok",
      isAvailable: true,
    },
  });
  testRentalId = createdRental.id;

  await test("BUG-05: POST /api/rentals/[id]/book menolak ID barang tidak valid dengan 404 (tidak memilih barang mitra lain secara acak)", async () => {
    const fakeRentalId = crypto.randomUUID();
    const badBookReq = makeReq(`http://localhost:3000/api/rentals/${fakeRentalId}/book`, {
      method: "POST",
      token: tokenA,
      body: {},
    });
    const badBookRes = await rentalBookRoute.POST(badBookReq, {
      params: Promise.resolve({ id: fakeRentalId }),
    });
    assert.equal(badBookRes.status, 404);
  });

  await test("SEC-03, SEC-07 & BUG-02: POST /api/rentals/[id]/book menegakkan harga server, UNPAID, dan tidak menduplikasi midtransOrderId ke OrderRoom", async () => {
    const today = new Date().toISOString().split("T")[0];
    const bookReq = makeReq(`http://localhost:3000/api/rentals/${testRentalId}/book`, {
      method: "POST",
      token: tokenA,
      body: {
        startDate: today,
        endDate: today,
        isPaid: true,
        rentalFee: 1,
        depositFee: 0,
        totalAmount: 1,
      },
    });
    const bookRes = await rentalBookRoute.POST(bookReq, {
      params: Promise.resolve({ id: testRentalId }),
    });
    assert.equal(bookRes.status, 201);
    const bookJson = await bookRes.json();
    testBookingId = bookJson.data.booking.id;
    assert.equal(bookJson.data.booking.paymentStatus, "UNPAID");
    assert.equal(bookJson.data.booking.bookingStatus, "temp_locked");
    assert.equal(Number(bookJson.data.booking.rentalFee), 100000);
    assert.equal(Number(bookJson.data.booking.depositFee), 50000);
    assert.equal(Number(bookJson.data.booking.totalAmount), 150000);

    if (bookJson.data.orderRoomId) {
      const companionRoom = await prisma.orderRoom.findUnique({
        where: { id: bookJson.data.orderRoomId },
      });
      assert.equal(companionRoom.midtransOrderId, null);
    }
  });

  await test("BUG-05 & SEC-07: PATCH /api/rentals/bookings/[id]/status menolak penyelesaian sebelum PAID & handover, serta menolak pihak luar (403)", async () => {
    // Outsider C mencoba mengakses/mengubah status booking -> 403
    const outsiderStatusReq = makeReq(
      `http://localhost:3000/api/rentals/bookings/${testBookingId}/status`,
      {
        method: "PATCH",
        token: tokenC,
        body: { status: "confirmed_by_owner" },
      }
    );
    const outsiderStatusRes = await rentalStatusRoute.PATCH(outsiderStatusReq, {
      params: Promise.resolve({ id: testBookingId }),
    });
    assert.equal(outsiderStatusRes.status, 403);

    // Outsider C mencoba mengintip detail OrderRoom milik A & B -> 403
    const outsiderOrderReq = makeReq(`http://localhost:3000/api/orders/${testOrderRoomId}`, {
      method: "GET",
      token: tokenC,
    });
    const outsiderOrderRes = await orderDetailRoute.GET(outsiderOrderReq, {
      params: Promise.resolve({ id: testOrderRoomId }),
    });
    assert.equal(outsiderOrderRes.status, 403);

    // Owner B mencoba langsung verified_settled sebelum PAID & handover -> 400
    const prematureSettleReq = makeReq(
      `http://localhost:3000/api/rentals/bookings/${testBookingId}/status`,
      {
        method: "PATCH",
        token: tokenB,
        body: { status: "verified_settled" },
      }
    );
    const prematureSettleRes = await rentalStatusRoute.PATCH(prematureSettleReq, {
      params: Promise.resolve({ id: testBookingId }),
    });
    assert.equal(prematureSettleRes.status, 400);
  });

  await test("SEC-07: POST & PATCH /api/promotions/order menolak manipulasi isPaid=true, non-owner (403), dan aktivasi tanpa pembayaran (403)", async () => {
    const createPromoReq = makeReq("http://localhost:3000/api/promotions/order", {
      method: "POST",
      token: tokenB,
      body: {
        targetType: "service",
        serviceId: testServiceId,
        isPaid: true,
        amount: 1,
      },
    });
    const createPromoRes = await promoOrderRoute.POST(createPromoReq);
    assert.equal(createPromoRes.status, 201);
    const createPromoJson = await createPromoRes.json();
    testPromoId = createPromoJson.data.id;
    assert.equal(createPromoJson.data.paymentStatus, "PENDING");
    assert.equal(createPromoJson.data.status, "draft");
    assert.ok(createPromoJson.data.amount >= 1000);

    // Outsider C mencoba mengaktifkan promosi milik B -> 403
    const outsiderPatchPromo = makeReq("http://localhost:3000/api/promotions/order", {
      method: "PATCH",
      token: tokenC,
      body: { promotionId: testPromoId },
    });
    const outsiderPatchRes = await promoOrderRoute.PATCH(outsiderPatchPromo);
    assert.equal(outsiderPatchRes.status, 403);

    // Owner B mencoba mengaktifkan promosi yang belum dibayar -> 403
    const unpaidPatchPromo = makeReq("http://localhost:3000/api/promotions/order", {
      method: "PATCH",
      token: tokenB,
      body: { promotionId: testPromoId },
    });
    const unpaidPatchRes = await promoOrderRoute.PATCH(unpaidPatchPromo);
    assert.equal(unpaidPatchRes.status, 403);
  });

  // ---------------------------------------------------------------------------
  // 8. SEC-04, BUG-02, BUG-04: Wallet Balance Single-Counting, Withdrawal Gate & Ledger Protection
  // ---------------------------------------------------------------------------
  await test("BUG-02 & SEC-04: Saldo sewa hanya dihitung 1x, penarikan melebihi saldo ditolak (400), dan penghapusan penarikan selesai ditolak (403)", async () => {
    // Simulasikan booking sewa selesai & companion room juga completed
    await prisma.rentalBooking.update({
      where: { id: testBookingId },
      data: { paymentStatus: "PAID", bookingStatus: "verified_settled", paidAt: new Date() },
    });
    const companionReq = await prisma.request.findFirst({
      where: { description: { contains: `[BOOKING_ID:${testBookingId}]` } },
    });
    if (companionReq) {
      await prisma.request.update({
        where: { id: companionReq.id },
        data: { status: "completed" },
      });
      await prisma.orderRoom.updateMany({
        where: { requestId: companionReq.id },
        data: { paymentStatus: "PAID", orderStatus: "completed", completedAt: new Date() },
      });
    }

    // Periksa GET /api/profile/wallet -> totalEarned harus tepat 100.000 (bukan 200.000!)
    const getWalletReq = makeReq("http://localhost:3000/api/profile/wallet", {
      method: "GET",
      token: tokenB,
    });
    const getWalletRes = await walletRoute.GET(getWalletReq);
    assert.equal(getWalletRes.status, 200);
    const walletJson = await getWalletRes.json();
    assert.equal(walletJson.data.totalEarned, 100000);
    assert.equal(walletJson.data.availableBalance, 100000);

    // Periksa GET /api/wallet/transactions -> totalEarned harus tepat 100.000
    const getTxReq = makeReq("http://localhost:3000/api/wallet/transactions", {
      method: "GET",
      token: tokenB,
    });
    const getTxRes = await walletTxRoute.GET(getTxReq);
    assert.equal(getTxRes.status, 200);
    const txJson = await getTxRes.json();
    assert.equal(txJson.data.summary.totalEarned, 100000);

    // Penarikan melebihi saldo (Rp 500.000 > Rp 100.000) via POST /api/profile/wallet -> 400
    const overWithdraw1 = makeReq("http://localhost:3000/api/profile/wallet", {
      method: "POST",
      token: tokenB,
      body: { amount: 500000, ownerType: "partner" },
    });
    const overRes1 = await walletRoute.POST(overWithdraw1);
    assert.equal(overRes1.status, 400);

    // Penarikan melebihi saldo via POST /api/withdrawals/request -> 400
    const overWithdraw2 = makeReq("http://localhost:3000/api/withdrawals/request", {
      method: "POST",
      token: tokenB,
      body: { amount: 500000, ownerType: "partner" },
    });
    const overRes2 = await withdrawalReqRoute.POST(overWithdraw2);
    assert.equal(overRes2.status, 400);

    // Buat 1 penarikan completed sebesar Rp 60.000
    const completedW = await prisma.withdrawal.create({
      data: {
        ownerId: userBId,
        ownerName: "Test Partner B",
        ownerType: "partner",
        amount: 60000,
        destinationType: "BCA",
        destinationAccount: "1234567890",
        destinationHolder: "Test Partner B",
        status: "completed",
      },
    });
    testCompletedWithdrawalId = completedW.id;

    // Mencoba menghapus penarikan yang sudah completed untuk memulihkan saldo -> 403
    const delCompletedReq = makeReq(
      `http://localhost:3000/api/profile/wallet?id=${testCompletedWithdrawalId}`,
      {
        method: "DELETE",
        token: tokenB,
      }
    );
    const delCompletedRes = await walletRoute.DELETE(delCompletedReq);
    assert.equal(delCompletedRes.status, 403);

    // Mencoba allCompleted=true -> 200 (tidak crash enum 'rejected' dan TIDAK menghapus penarikan completed!)
    const delAllReq = makeReq("http://localhost:3000/api/profile/wallet?allCompleted=true", {
      method: "DELETE",
      token: tokenB,
    });
    const delAllRes = await walletRoute.DELETE(delAllReq);
    assert.equal(delAllRes.status, 200);

    const stillExists = await prisma.withdrawal.findUnique({
      where: { id: testCompletedWithdrawalId },
    });
    assert.ok(stillExists, "Completed withdrawal must remain in ledger");
  });

  // ---------------------------------------------------------------------------
  // 9. FINAL VERIFICATION HARDENING: Alternative Endpoints, Idempotency & Concurrency
  // ---------------------------------------------------------------------------
  await test("SEC-01 (Hardening): POST /api/auth/login menolak login dengan password sembarang pada akun Google OAuth (password: null) (401)", async () => {
    // User A memiliki password: null (seperti akun yang baru mendaftar via Google OAuth)
    const loginReq = makeReq("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: { email: userAEmail, password: "AnyRandomPassword123!" },
    });
    const loginRes = await loginRoute.POST(loginReq);
    assert.equal(loginRes.status, 401);
  });

  await test("SEC-02 & SEC-03 (Hardening): /api/requests & /api/requests/[id] mewajibkan autentikasi, menolak outsider (403), dan tidak memalsukan paymentStatus=PAID", async () => {
    // Unauthenticated POST /api/requests -> 401
    const unauthPost = makeReq("http://localhost:3000/api/requests", {
      method: "POST",
      body: { title: "Tugas Tanpa Login", description: "Tes unauth" },
    });
    const unauthRes = await requestsRoute.POST(unauthPost);
    assert.equal(unauthRes.status, 401);

    // Outsider C mencoba PATCH /api/requests/[id] milik A -> 403
    const outsiderPatch = makeReq(`http://localhost:3000/api/requests/${testRequestId}`, {
      method: "PATCH",
      token: tokenC,
      body: { status: "in_progress", selectedHelperId: userCId },
    });
    const outsiderPatchRes = await requestDetailRoute.PATCH(outsiderPatch, {
      params: Promise.resolve({ id: testRequestId }),
    });
    assert.equal(outsiderPatchRes.status, 403);

    // Outsider C mencoba DELETE /api/requests/[id] milik A -> 403
    const outsiderDel = makeReq(`http://localhost:3000/api/requests/${testRequestId}`, {
      method: "DELETE",
      token: tokenC,
    });
    const outsiderDelRes = await requestDetailRoute.DELETE(outsiderDel, {
      params: Promise.resolve({ id: testRequestId }),
    });
    assert.equal(outsiderDelRes.status, 403);

    // Requester A mencoba menandai request berbayar (yang belum punya OrderRoom PAID) sebagai completed -> 400
    const prematureComplete = makeReq(`http://localhost:3000/api/requests/${testRequestId}`, {
      method: "PATCH",
      token: tokenA,
      body: { status: "completed" },
    });
    const prematureCompleteRes = await requestDetailRoute.PATCH(prematureComplete, {
      params: Promise.resolve({ id: testRequestId }),
    });
    assert.equal(prematureCompleteRes.status, 400);
  });

  await test("BUG-01 & BUG-02 (Idempotency): Notifikasi webhook settlement Midtrans yang sama 2x berturut-turut bersifat idempoten dan tidak menggandakan pendapatan", async () => {
    const orderRoomBefore = await prisma.orderRoom.findUnique({
      where: { id: testOrderRoomId },
    });
    const midtransOrderId = orderRoomBefore.midtransOrderId;
    const grossAmount = `${Number(orderRoomBefore.lockedAmount)}.00`;
    const statusCode = "200";
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const validSig = crypto
      .createHash("sha512")
      .update(`${midtransOrderId}${statusCode}${grossAmount}${serverKey}`)
      .digest("hex");

    // Kirim ulang notifikasi settlement yang persis sama
    const duplicateWebhookReq = makeReq("http://localhost:3000/api/webhooks/midtrans", {
      method: "POST",
      body: {
        order_id: midtransOrderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        transaction_status: "settlement",
        fraud_status: "accept",
        signature_key: validSig,
      },
    });
    const duplicateWebhookRes = await midtransWebhookRoute.POST(duplicateWebhookReq);
    assert.equal(duplicateWebhookRes.status, 200);

    const orderRoomsCount = await prisma.orderRoom.count({
      where: { midtransOrderId },
    });
    assert.equal(orderRoomsCount, 1);
  });

  await test("SEC-04 (Concurrency & Ledger): Penarikan bersamaan (Promise.all) tidak dapat menguras saldo yang sama 2x, dan DELETE /api/user/activities menolak hapus transaksi selesai (403)", async () => {
    // Saat ini totalEarned Partner B = 100.000, completedWithdrawal = 60.000 -> sisa saldo tersedia = 40.000
    // Luncurkan 2 permintaan penarikan Rp 40.000 secara bersamaan (concurrent race condition test)
    const [res1, res2] = await Promise.all([
      withdrawalReqRoute.POST(
        makeReq("http://localhost:3000/api/withdrawals/request", {
          method: "POST",
          token: tokenB,
          body: { amount: 40000, ownerType: "partner" },
        })
      ),
      withdrawalReqRoute.POST(
        makeReq("http://localhost:3000/api/withdrawals/request", {
          method: "POST",
          token: tokenB,
          body: { amount: 40000, ownerType: "partner" },
        })
      ),
    ]);

    const statuses = [res1.status, res2.status].sort();
    // Hanya tepat 1 yang boleh berhasil (201), sedangkan yang kedua harus ditolak (400 atau 500 karena serialization conflict)
    const successCount = statuses.filter((s) => s === 200 || s === 201).length;
    assert.equal(successCount, 1, `Expected exactly 1 concurrent withdrawal to succeed, got statuses: ${statuses.join(", ")}`);

    // Bersihkan penarikan pending dari tes konkurensi
    await prisma.withdrawal.deleteMany({
      where: { ownerId: userBId, status: "pending" },
    });

    // Coba hapus aktivitas sewa yang sudah verified_settled melalui DELETE /api/user/activities -> 403
    const delSettledActivity = makeReq(
      `http://localhost:3000/api/user/activities?id=${testBookingId}`,
      {
        method: "DELETE",
        token: tokenB,
      }
    );
    const delSettledRes = await userActivitiesRoute.DELETE(delSettledActivity);
    assert.equal(delSettledRes.status, 403);
  });

  await test("BUG-05 (Hardening): POST /api/reviews menolak ulasan sebelum pesanan completed (400) & POST /api/vouchers/validate menolak redeem tanpa login (401)", async () => {
    // testOrderRoomId masih berstatus paid_escrow (belum completed) -> POST /api/reviews harus menolak dengan 400
    const prematureReview = makeReq("http://localhost:3000/api/reviews", {
      method: "POST",
      token: tokenA,
      body: {
        transactionId: testOrderRoomId,
        transactionType: "service",
        revieweeId: userBId,
        rating: 5,
        comment: "Coba review sebelum selesai",
      },
    });
    const prematureReviewRes = await reviewsRoute.POST(prematureReview);
    assert.equal(prematureReviewRes.status, 400);

    // Unauthenticated voucher redeem -> 401
    const unauthRedeem = makeReq("http://localhost:3000/api/vouchers/validate", {
      method: "POST",
      body: {
        code: "BANTUINHEMAT",
        orderAmount: 50000,
        action: "redeem",
      },
    });
    const unauthRedeemRes = await voucherValidateRoute.POST(unauthRedeem);
    assert.equal(unauthRedeemRes.status, 401);
  });

  // ---------------------------------------------------------------------------
  // 10. TAHAP 1 & 2 & 4 PRE-DEPLOYMENT DEEP VERIFICATION:
  //     Private Bucket KYC Refs, Paid Cancellation Block, Pending Withdrawal Block,
  //     Concurrent Webhooks, Concurrent Order Completion, Concurrent Reviews,
  //     and End-to-End Jasa vs Sewa Wallet Separation
  // ---------------------------------------------------------------------------
  await test("TAHAP 1 (Storage KYC Private Compatibility): normalizeToStorageRef & parseStorageRef menangani storage:// dan legacy public URL, serta menyembunyikan dokumen KYC dari publik", async () => {
    const legacyKycUrl =
      "https://example.supabase.co/storage/v1/object/public/bantuin-kyc/kyc-documents/1700000-ktp.jpg";
    const normalized = storageHelper.normalizeToStorageRef(legacyKycUrl);
    assert.equal(normalized, "storage://bantuin-kyc/kyc-documents/1700000-ktp.jpg");

    const parsed = storageHelper.parseStorageRef(legacyKycUrl);
    assert.deepEqual(parsed, {
      bucket: "bantuin-kyc",
      key: "kyc-documents/1700000-ktp.jpg",
    });

    // Submit KYC via POST /api/profile/kyc menggunakan URL legacy -> DB harus menyimpan format kanonik storage://bantuin-kyc/...
    const kycReq = makeReq("http://localhost:3000/api/profile/kyc", {
      method: "POST",
      token: tokenA,
      body: {
        idNumber: "3201019999990001",
        idCardUrl: legacyKycUrl,
      },
    });
    const kycRes = await profileKycRoute.POST(kycReq);
    assert.equal(kycRes.status, 200);

    const dbUserA = await prisma.profile.findUnique({ where: { id: userAId } });
    assert.equal(dbUserA.idCardUrl, "storage://bantuin-kyc/kyc-documents/1700000-ktp.jpg");
    assert.equal(dbUserA.verificationStatus, "pending_review");

    // GET /api/profile/[id] (public profile endpoint) TIDAK BOLEH membocorkan idCardUrl atau idNumber
    const pubReq = makeReq(`http://localhost:3000/api/profile/${userAId}`);
    const pubRes = await publicProfileRoute.GET(pubReq, {
      params: Promise.resolve({ id: userAId }),
    });
    assert.equal(pubRes.status, 200);
    const pubJson = await pubRes.json();
    const pubProfile = pubJson.profile || pubJson.data || {};
    assert.equal(pubProfile.idCardUrl, undefined);
    assert.equal(pubProfile.idNumber, undefined);
  });

  await test("TAHAP 2 (Paid Transaction Cancellation Guard): Menolak pembatalan transaksi yang sudah PAID di seluruh endpoint (400 ALREADY_PAID)", async () => {
    // 1. POST /api/payments/cancel pada OrderRoom yang sudah PAID -> 400
    const cancelPayOrder = makeReq("http://localhost:3000/api/payments/cancel", {
      method: "POST",
      token: tokenA,
      body: { entityId: testOrderRoomId, entityType: "order" },
    });
    const cancelPayOrderRes = await paymentCancelRoute.POST(cancelPayOrder);
    assert.equal(cancelPayOrderRes.status, 400);

    // 2. PATCH /api/chat/rooms dengan status='cancelled' pada OrderRoom yang sudah PAID -> 400
    const cancelChatRoom = makeReq("http://localhost:3000/api/chat/rooms", {
      method: "PATCH",
      token: tokenA,
      body: { orderRoomId: testOrderRoomId, status: "cancelled" },
    });
    const cancelChatRoomRes = await chatRoomsRoute.PATCH(cancelChatRoom);
    assert.equal(cancelChatRoomRes.status, 400);

    // 3. PATCH /api/requests/[id] dengan status='cancelled' pada Request yang punya OrderRoom PAID -> 400
    const cancelRequest = makeReq(`http://localhost:3000/api/requests/${testRequestId}`, {
      method: "PATCH",
      token: tokenA,
      body: { status: "cancelled" },
    });
    const cancelRequestRes = await requestDetailRoute.PATCH(cancelRequest, {
      params: Promise.resolve({ id: testRequestId }),
    });
    assert.equal(cancelRequestRes.status, 400);

    // 4. PATCH /api/rentals/bookings/[id]/status dengan status='cancelled' pada Booking yang sudah PAID -> 400
    const cancelBooking = makeReq(
      `http://localhost:3000/api/rentals/bookings/${testBookingId}/status`,
      {
        method: "PATCH",
        token: tokenA,
        body: { status: "cancelled" },
      }
    );
    const cancelBookingRes = await rentalStatusRoute.PATCH(cancelBooking, {
      params: Promise.resolve({ id: testBookingId }),
    });
    assert.equal(cancelBookingRes.status, 400);
  });

  await test("TAHAP 2 (Pending Withdrawal Guard): Menolak pengajuan penarikan baru ketika masih ada penarikan berstatus pending (400)", async () => {
    // Buat 1 penarikan Rp 20.000 (berhasil -> status: pending)
    const firstWRes = await withdrawalReqRoute.POST(
      makeReq("http://localhost:3000/api/withdrawals/request", {
        method: "POST",
        token: tokenB,
        body: { amount: 20000, ownerType: "partner" },
      })
    );
    assert.ok(firstWRes.status === 200 || firstWRes.status === 201);

    // Saat penarikan pertama masih pending, ajukan penarikan kedua Rp 15.000 (meski saldo masih cukup Rp 20.000) -> harus ditolak 400!
    const secondWRes = await withdrawalReqRoute.POST(
      makeReq("http://localhost:3000/api/withdrawals/request", {
        method: "POST",
        token: tokenB,
        body: { amount: 15000, ownerType: "partner" },
      })
    );
    assert.equal(secondWRes.status, 400);

    // Via POST /api/profile/wallet juga harus ditolak 400!
    const thirdWRes = await walletRoute.POST(
      makeReq("http://localhost:3000/api/profile/wallet", {
        method: "POST",
        token: tokenB,
        body: { amount: 15000, ownerType: "partner" },
      })
    );
    assert.equal(thirdWRes.status, 400);

    // Bersihkan penarikan pending
    await prisma.withdrawal.deleteMany({
      where: { ownerId: userBId, status: "pending" },
    });
  });

  await test("TAHAP 2 (Concurrent Settlement Webhooks Promise.all): Dua webhook settlement paralel hanya memproses transisi & audit log tepat 1x", async () => {
    // Buat pesanan Jasa baru yang UNPAID untuk menguji 2 webhook settlement paralel secara murni
    const svcOrderRes = await serviceOrderRoute.POST(
      makeReq(`http://localhost:3000/api/services/${testServiceId}/order`, {
        method: "POST",
        token: tokenA,
        body: { notes: "Order Jasa Uji Konkurensi Webhook & Penyelesaian" },
      }),
      { params: Promise.resolve({ id: testServiceId }) }
    );
    assert.equal(svcOrderRes.status, 201);
    const svcOrderJson = await svcOrderRes.json();
    const svcRoomId = svcOrderJson.data.orderRoom.id;
    const svcReqId = svcOrderJson.data.request.id;
    const svcMidtransId = svcOrderJson.data.orderRoom.midtransOrderId;
    const grossStr = "75000.00";
    const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
    const validSig = crypto
      .createHash("sha512")
      .update(`${svcMidtransId}200${grossStr}${serverKey}`)
      .digest("hex");

    const buildWebhookReq = () =>
      makeReq("http://localhost:3000/api/webhooks/midtrans", {
        method: "POST",
        body: {
          order_id: svcMidtransId,
          status_code: "200",
          gross_amount: grossStr,
          transaction_status: "settlement",
          fraud_status: "accept",
          payment_type: "qris",
          transaction_id: `tx-conc-${testRunId}`,
          signature_key: validSig,
        },
      });

    // Eksekusi 2 webhook settlement secara paralel (Promise.all)
    const [wh1, wh2] = await Promise.all([
      midtransWebhookRoute.POST(buildWebhookReq()),
      midtransWebhookRoute.POST(buildWebhookReq()),
    ]);
    assert.equal(wh1.status, 200);
    assert.equal(wh2.status, 200);

    // Pastikan audit_logs untuk payment.midtrans_paid pada svcRoomId hanya tercatat tepat 1 kali!
    const paidAuditCount = await prisma.auditLog.count({
      where: {
        targetId: svcRoomId,
        action: "payment.midtrans_paid",
      },
    });
    assert.equal(paidAuditCount, 1, `Expected 1 payment.midtrans_paid audit log, got ${paidAuditCount}`);

    // -------------------------------------------------------------------------
    // TAHAP 2 (Concurrent Order Completion Promise.all):
    // Helper submit proof -> lalu 2 request confirm-completion paralel (Promise.all)
    // -------------------------------------------------------------------------
    const proofRes = await submitProofRoute.POST(
      makeReq(`http://localhost:3000/api/orders/${svcRoomId}/submit-proof`, {
        method: "POST",
        token: tokenB,
        body: {
          proofPhotoUrls: ["https://example.supabase.co/storage/v1/object/public/bantuin-proofs/proof1.jpg"],
          proofNotes: "Desain selesai dikerjakan",
        },
      }),
      { params: Promise.resolve({ id: svcRoomId }) }
    );
    assert.equal(proofRes.status, 200);

    const helperBefore = await prisma.profile.findUnique({ where: { id: userBId } });
    const serviceBefore = await prisma.service.findUnique({ where: { id: testServiceId } });

    const [comp1, comp2] = await Promise.all([
      confirmCompletionRoute.POST(
        makeReq(`http://localhost:3000/api/orders/${svcRoomId}/confirm-completion`, {
          method: "POST",
          token: tokenA,
        }),
        { params: Promise.resolve({ id: svcRoomId }) }
      ),
      confirmCompletionRoute.POST(
        makeReq(`http://localhost:3000/api/orders/${svcRoomId}/confirm-completion`, {
          method: "POST",
          token: tokenA,
        }),
        { params: Promise.resolve({ id: svcRoomId }) }
      ),
    ]);
    assert.equal(comp1.status, 200);
    assert.equal(comp2.status, 200);

    const helperAfter = await prisma.profile.findUnique({ where: { id: userBId } });
    const serviceAfter = await prisma.service.findUnique({ where: { id: testServiceId } });
    const releaseAuditCount = await prisma.auditLog.count({
      where: {
        targetId: svcRoomId,
        action: "order.escrow_released",
      },
    });

    assert.equal(
      helperAfter.completedHelpsCount - helperBefore.completedHelpsCount,
      1,
      "completedHelpsCount must increment by exactly 1 under concurrent completion"
    );
    assert.equal(
      serviceAfter.completedOrders - serviceBefore.completedOrders,
      1,
      "service.completedOrders must increment by exactly 1 under concurrent completion"
    );
    assert.equal(releaseAuditCount, 1, "order.escrow_released audit log must be created exactly once");

    // -------------------------------------------------------------------------
    // TAHAP 2 (Concurrent Reviews Promise.all):
    // Dua permintaan POST /api/reviews paralel untuk transaksi svcRoomId yang sama
    // -------------------------------------------------------------------------
    const buildReviewReq = () =>
      makeReq("http://localhost:3000/api/reviews", {
        method: "POST",
        token: tokenA,
        body: {
          transactionId: svcRoomId,
          transactionType: "service",
          revieweeId: userBId,
          rating: 5,
          comment: "Hasil desain sangat memuaskan!",
        },
      });

    const [rev1, rev2] = await Promise.all([
      reviewsRoute.POST(buildReviewReq()),
      reviewsRoute.POST(buildReviewReq()),
    ]);
    const revStatuses = [rev1.status, rev2.status].sort();
    assert.deepEqual(
      revStatuses,
      [201, 409],
      `Expected one 201 and one 409 for concurrent reviews, got ${revStatuses.join(", ")}`
    );

    const reviewCountInDb = await prisma.review.count({
      where: { transactionId: svcRoomId, reviewerId: userAId },
    });
    assert.equal(reviewCountInDb, 1, "Database must contain exactly 1 review for the transaction");

    // -------------------------------------------------------------------------
    // TAHAP 4 (End-to-End Jasa vs Sewa Earnings Separation):
    // Partner B memiliki Rp 100.000 dari Sewa (ownerType='partner') dan Rp 75.000 dari Jasa (ownerType='provider').
    // Penarikan sebagai 'provider' sebesar Rp 80.000 harus ditolak (400), sedangkan Rp 75.000 diizinkan!
    // -------------------------------------------------------------------------
    const overProviderWithdraw = await withdrawalReqRoute.POST(
      makeReq("http://localhost:3000/api/withdrawals/request", {
        method: "POST",
        token: tokenB,
        body: { amount: 80000, ownerType: "provider" },
      })
    );
    assert.equal(overProviderWithdraw.status, 400);

    const validProviderWithdraw = await withdrawalReqRoute.POST(
      makeReq("http://localhost:3000/api/withdrawals/request", {
        method: "POST",
        token: tokenB,
        body: { amount: 75000, ownerType: "provider" },
      })
    );
    assert.ok(validProviderWithdraw.status === 200 || validProviderWithdraw.status === 201);

    // Cleanup service order test artifacts
    await prisma.withdrawal.deleteMany({ where: { ownerId: userBId, status: "pending" } });
    await prisma.review.deleteMany({ where: { transactionId: svcRoomId } });
    await prisma.auditLog.deleteMany({ where: { targetId: svcRoomId } });
    await prisma.chatMessage.deleteMany({ where: { orderRoomId: svcRoomId } });
    await prisma.orderRoom.deleteMany({ where: { id: svcRoomId } });
    await prisma.request.deleteMany({ where: { id: svcReqId } });
  });

  await test("TAHAP 4 (End-to-End Rental Deposit Refund & Handover Flow): Pengembalian deposit memvalidasi batas depositFee dan mencatat audit log", async () => {
    // Set booking status ke 'returned' agar siap refund deposit
    await prisma.rentalBooking.update({
      where: { id: testBookingId },
      data: { bookingStatus: "returned", paymentStatus: "PAID" },
    });

    // Mencoba refund melebihi depositFee (Rp 999.000 > Rp 50.000) -> 400
    const overRefundRes = await refundDepositRoute.POST(
      makeReq(`http://localhost:3000/api/rentals/bookings/${testBookingId}/refund-deposit`, {
        method: "POST",
        token: tokenB,
        body: { isFullRefund: false, refundAmount: 999000, deductionReason: "Salah hitung" },
      }),
      { params: Promise.resolve({ id: testBookingId }) }
    );
    assert.equal(overRefundRes.status, 400);

    // Mencoba potongan deposit tanpa alasan (deductionReason kosong) -> 400
    const noReasonRefundRes = await refundDepositRoute.POST(
      makeReq(`http://localhost:3000/api/rentals/bookings/${testBookingId}/refund-deposit`, {
        method: "POST",
        token: tokenB,
        body: { isFullRefund: false, refundAmount: 30000 },
      }),
      { params: Promise.resolve({ id: testBookingId }) }
    );
    assert.equal(noReasonRefundRes.status, 400);

    // Refund deposit sah dengan potongan Rp 10.000 (refund Rp 40.000) + alasan -> 200 & status verified_settled
    const validRefundRes = await refundDepositRoute.POST(
      makeReq(`http://localhost:3000/api/rentals/bookings/${testBookingId}/refund-deposit`, {
        method: "POST",
        token: tokenB,
        body: {
          isFullRefund: false,
          refundAmount: 40000,
          deductionReason: "Tutup lensa lecet ringan",
        },
      }),
      { params: Promise.resolve({ id: testBookingId }) }
    );
    assert.equal(validRefundRes.status, 200);
    const refundJson = await validRefundRes.json();
    assert.equal(refundJson.data.bookingStatus, "verified_settled");
    assert.equal(Number(refundJson.data.depositRefundAmount), 40000);
    await prisma.auditLog.deleteMany({ where: { targetId: testBookingId } });
  });
} finally {
  // Clean up all temporary test data
  await prisma.withdrawal.deleteMany({ where: { ownerId: userBId } }).catch(() => {});
  if (testPromoId) {
    await prisma.promotion.deleteMany({ where: { id: testPromoId } }).catch(() => {});
  }
  if (testBookingId) {
    const companionReqs = await prisma.request.findMany({
      where: { description: { contains: `[BOOKING_ID:${testBookingId}]` } },
      select: { id: true },
    });
    for (const r of companionReqs) {
      await prisma.chatMessage.deleteMany({ where: { orderRoom: { requestId: r.id } } }).catch(() => {});
      await prisma.orderRoom.deleteMany({ where: { requestId: r.id } }).catch(() => {});
      await prisma.request.deleteMany({ where: { id: r.id } }).catch(() => {});
    }
    await prisma.rentalBooking.deleteMany({ where: { id: testBookingId } }).catch(() => {});
  }
  if (testRentalId) {
    await prisma.rental.deleteMany({ where: { id: testRentalId } }).catch(() => {});
  }
  if (testServiceId) {
    await prisma.service.deleteMany({ where: { id: testServiceId } }).catch(() => {});
  }
  if (testOrderRoomId) {
    await prisma.auditLog.deleteMany({ where: { targetId: testOrderRoomId } }).catch(() => {});
    await prisma.chatMessage.deleteMany({ where: { orderRoomId: testOrderRoomId } }).catch(() => {});
    await prisma.orderRoom.deleteMany({ where: { id: testOrderRoomId } }).catch(() => {});
  }
  if (testRequestId) {
    await prisma.offer.deleteMany({ where: { requestId: testRequestId } }).catch(() => {});
    await prisma.request.deleteMany({ where: { id: testRequestId } }).catch(() => {});
  }
  // Clean up any leftover sec_test_* profiles and their dependent rows
  const leftoverProfiles = await prisma.profile
    .findMany({
      where: { email: { startsWith: "sec_test_" } },
      select: { id: true },
    })
    .catch(() => []);
  const cleanupUserIds = Array.from(
    new Set([userAId, userBId, userCId, ...leftoverProfiles.map((p) => p.id)])
  );
  const cleanupRooms = await prisma.orderRoom
    .findMany({
      where: {
        OR: [{ requesterId: { in: cleanupUserIds } }, { helperId: { in: cleanupUserIds } }],
      },
      select: { id: true },
    })
    .catch(() => []);
  const cleanupRoomIds = cleanupRooms.map((r) => r.id);
  if (cleanupRoomIds.length > 0) {
    await prisma.review.deleteMany({ where: { transactionId: { in: cleanupRoomIds } } }).catch(() => {});
    await prisma.auditLog.deleteMany({ where: { targetId: { in: cleanupRoomIds } } }).catch(() => {});
    await prisma.chatMessage.deleteMany({ where: { orderRoomId: { in: cleanupRoomIds } } }).catch(() => {});
    await prisma.orderRoom.deleteMany({ where: { id: { in: cleanupRoomIds } } }).catch(() => {});
  }
  await prisma.review
    .deleteMany({
      where: { OR: [{ reviewerId: { in: cleanupUserIds } }, { revieweeId: { in: cleanupUserIds } }] },
    })
    .catch(() => {});
  await prisma.withdrawal.deleteMany({ where: { ownerId: { in: cleanupUserIds } } }).catch(() => {});
  await prisma.promotion.deleteMany({ where: { ownerId: { in: cleanupUserIds } } }).catch(() => {});
  await prisma.rentalBooking
    .deleteMany({
      where: { OR: [{ renterId: { in: cleanupUserIds } }, { ownerId: { in: cleanupUserIds } }] },
    })
    .catch(() => {});
  await prisma.rental.deleteMany({ where: { ownerId: { in: cleanupUserIds } } }).catch(() => {});
  await prisma.service.deleteMany({ where: { providerId: { in: cleanupUserIds } } }).catch(() => {});
  await prisma.offer.deleteMany({ where: { helperId: { in: cleanupUserIds } } }).catch(() => {});
  await prisma.request.deleteMany({ where: { requesterId: { in: cleanupUserIds } } }).catch(() => {});
  await prisma.auditLog.deleteMany({ where: { actorId: { in: cleanupUserIds } } }).catch(() => {});
  await prisma.notification
    .deleteMany({ where: { userId: { in: cleanupUserIds } } })
    .catch(() => {});
  await prisma.user
    .deleteMany({ where: { email: { startsWith: "sec_test_" } } })
    .catch(() => {});
  await prisma.profile
    .deleteMany({ where: { id: { in: cleanupUserIds } } })
    .catch(() => {});
  await prisma.$disconnect();
}

const failed = results.filter((r) => r.status === "FAIL");
console.log(`\n=====================================================================`);
console.log(` REGRESSION TEST SUMMARY: ${results.length - failed.length}/${results.length} PASSED`);
console.log(`=====================================================================`);
if (failed.length > 0) {
  process.exit(1);
}
process.exit(0);
