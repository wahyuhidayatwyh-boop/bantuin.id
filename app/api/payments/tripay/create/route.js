import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * app/api/payments/tripay/create/route.js
 * Server-Side Tripay Payment Transaction Dispatcher
 * Complies with Section 11 & 12 of requirements.
 *
 * Mengapa wajib via Server API Route (BFF)?
 * 1. Menghindari CORS: API Tripay memblokir request langsung dari browser.
 * 2. Keamanan Private Key: Pembuatan signature HMAC-SHA256 WAJIB di server,
 *    TRIPAY_PRIVATE_KEY tidak boleh terekspos ke bundle JavaScript frontend.
 * 3. Fallback Cerdas: Jika kredensial belum diisi di .env.local, sistem otomatis
 *    mengembalikan payload simulasi sandbox realistis sehingga flow tidak macet.
 */

// Mapping kode channel Tripay resmi
const TRIPAY_CHANNELS = {
  qris: "QRIS",
  bca_va: "BCAVA",
  mandiri_va: "MANDIRIVA",
  bni_va: "BNIVA",
  bri_va: "BRIVA",
  gopay: "QRIS",
  ovo: "OVO",
  shopeepay: "SHOPEEPAY",
};

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      orderId,
      amount,
      paymentMethod = "qris",
      customerName = "Pengguna Bantuin",
      customerEmail = "customer@bantuin.id",
      customerPhone = "081298765432",
      itemName = "Layanan Platform Bantuin",
    } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { success: false, message: "ID Pesanan dan Nominal wajib disertakan" },
        { status: 400 }
      );
    }

    const API_KEY = process.env.TRIPAY_API_KEY;
    const PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY;
    const MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE;
    const IS_PROD = process.env.TRIPAY_ENV === "production";
    const BASE_URL = IS_PROD
      ? "https://tripay.co.id/api"
      : "https://tripay.co.id/api-sandbox";

    const merchantRef = `BTN-${orderId}-${Date.now().toString().slice(-4)}`;
    const tripayMethod = TRIPAY_CHANNELS[paymentMethod] || "QRIS";

    // ──────────────────────────────────────────────────────────────────────────
    // KASUS A: Kredensial Tripay Resmi Tersedia di Server
    // ──────────────────────────────────────────────────────────────────────────
    if (API_KEY && PRIVATE_KEY && MERCHANT_CODE) {
      const signature = crypto
        .createHmac("sha256", PRIVATE_KEY)
        .update(MERCHANT_CODE + merchantRef + amount)
        .digest("hex");

      const expiry = Math.floor(Date.now() / 1000) + 24 * 3600; // 24 jam

      const payload = {
        method: tripayMethod,
        merchant_ref: merchantRef,
        amount: Number(amount),
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        order_items: [
          {
            sku: `SKU-${orderId}`,
            name: itemName,
            price: Number(amount),
            quantity: 1,
          },
        ],
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/activity`,
        expired_time: expiry,
        signature: signature,
      };

      const response = await fetch(`${BASE_URL}/transaction/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        console.warn("[Tripay API Warning]:", result);
        return NextResponse.json(
          {
            success: false,
            message: result.message || "Gagal membuat transaksi di Tripay",
            errors: result,
          },
          { status: response.status }
        );
      }

      return NextResponse.json({
        success: true,
        is_live: IS_PROD,
        data: result.data,
      });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // KASUS B: Mode Simulasi Sandbox (Kredensial Belum Terkonfigurasi di .env)
    // Menghasilkan payload transaksi dengan format resmi Tripay tanpa memblokir UI
    // ──────────────────────────────────────────────────────────────────────────
    const now = Math.floor(Date.now() / 1000);
    const expiredTimestamp = now + 24 * 3600;

    // Nomor Virtual Account simulasi realistis per bank
    const vaMap = {
      bca_va: `827708${Math.floor(10000000 + Math.random() * 90000000)}`,
      mandiri_va: `88708${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      bni_va: `988708${Math.floor(10000000 + Math.random() * 90000000)}`,
      bri_va: `12808${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    };

    const simulatedPayCode = vaMap[paymentMethod] || (paymentMethod === "qris" ? null : `8990${Date.now().toString().slice(-8)}`);
    const simulatedReference = `DEV-TP-${Date.now().toString().slice(-6)}`;

    return NextResponse.json({
      success: true,
      message: "Transaksi simulasi sandbox berhasil dibuat (Menunggu Pembayaran)",
      is_simulator: true,
      data: {
        reference: simulatedReference,
        merchant_ref: merchantRef,
        payment_method: tripayMethod,
        payment_name: paymentMethod.toUpperCase().replace("_", " "),
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        amount: Number(amount),
        fee_merchant: 0,
        fee_customer: paymentMethod === "qris" ? 750 : 2500,
        total_amount: Number(amount) + (paymentMethod === "qris" ? 750 : 2500),
        pay_code: simulatedPayCode,
        qr_string: paymentMethod === "qris" ? `00020101021226680016ID.CO.TRIPAY.WWW011893600998${Date.now()}51440014ID.LINKAJA.WWW0215202609051029835204581253033605802ID5910BANTUIN ID6010JAKARTA61051294062070703A0163048991` : null,
        qr_url: paymentMethod === "qris" ? "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80" : null,
        checkout_url: `https://tripay.co.id/checkout/${simulatedReference}`,
        status: "UNPAID",
        expired_time: expiredTimestamp,
        instructions: [
          {
            title: "Pembayaran via Mobile Banking / E-Wallet",
            steps: [
              `Buka aplikasi ${paymentMethod.includes("va") ? "Mobile Banking Anda" : "E-Wallet (GoPay, OVO, Dana, BCA)"}`,
              paymentMethod === "qris" ? "Pilih menu QRIS dan pindai kode QR di layar" : `Pilih menu Transfer Virtual Account dan masukkan nomor: ${simulatedPayCode}`,
              `Pastikan nama penerima tertulis 'Bantuin - ${customerName}' dan nominal sebesar Rp ${Number(amount).toLocaleString('id-ID')}`,
              "Konfirmasi pembayaran dengan memasukkan PIN transaksi Anda",
              "Sistem Bantuin akan otomatis mendeteksi konfirmasi pembayaran gateway"
            ]
          }
        ]
      },
    });
  } catch (error) {
    console.error("[Tripay Create Error]:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
