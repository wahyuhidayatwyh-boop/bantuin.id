/**
 * scripts/create-admin.mjs
 * Script resmi untuk membuat atau memperbarui akun Super Administrator di database BantuinAja.id
 * 
 * Penggunaan:
 *   node scripts/create-admin.mjs
 *   node scripts/create-admin.mjs <password>
 */

import { prisma } from "../lib/prisma.js";
import bcrypt from "bcryptjs";

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@bantuinaja.id").toLowerCase().trim();
  const adminPassword = process.argv[2] || process.env.ADMIN_INITIAL_PASSWORD || "BantuinAdmin2026!";
  const adminName = process.env.ADMIN_NAME || "Super Admin BantuinAja";

  console.log(`[Admin Seed] Memeriksa akun Administrator: ${adminEmail}...`);

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existingProfile = await prisma.profile.findUnique({
    where: { email: adminEmail },
  });

  let adminProfile;
  if (existingProfile) {
    adminProfile = await prisma.profile.update({
      where: { email: adminEmail },
      data: {
        fullName: adminName,
        password: hashedPassword,
        accountRole: "admin",
        isAdmin: true,
        verificationStatus: "verified",
        verificationNotes: "Akun Super Administrator Resmi BantuinAja.id",
        campusName: "Kantor Pusat BantuinAja.id",
      },
    });
    console.log(`[Admin Seed] Akun Administrator berhasil diperbarui!`);
  } else {
    adminProfile = await prisma.profile.create({
      data: {
        email: adminEmail,
        fullName: adminName,
        password: hashedPassword,
        accountRole: "admin",
        isAdmin: true,
        verificationStatus: "verified",
        verificationNotes: "Akun Super Administrator Resmi BantuinAja.id",
        campusName: "Kantor Pusat BantuinAja.id",
        phoneNumber: "08119876543",
      },
    });
    console.log(`[Admin Seed] Akun Administrator baru berhasil dibuat!`);
  }

  console.log("\n========================================================");
  console.log("  KREDENSIAL ADMINISTRATOR BANTUINAJA.ID");
  console.log("========================================================");
  console.log(`  Email    : ${adminProfile.email}`);
  console.log(`  Password : ${adminPassword}`);
  console.log(`  Role     : ${adminProfile.accountRole} (isAdmin: ${adminProfile.isAdmin})`);
  console.log(`  Status   : ${adminProfile.verificationStatus}`);
  console.log("========================================================\n");
}

main()
  .catch((err) => {
    console.error("[Admin Seed Error]:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
