import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const prisma = new PrismaClient();

async function runBackup() {
  console.log("=== MEMULAI BACKUP DATABASE BANTUIN ===");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.resolve(process.cwd(), "backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFile = path.join(backupDir, `backup_bantuin_${timestamp}.json`);

  try {
    const backupData = {
      timestamp: new Date().toISOString(),
      models: {},
    };

    // Export tabel-tabel utama
    const tables = [
      "profile",
      "user",
      "helpRequest",
      "rentalUnit",
      "serviceCatalog",
      "chatRoom",
      "orderRoom",
      "review",
      "auditLog",
    ];

    for (const table of tables) {
      if (prisma[table]) {
        try {
          const records = await prisma[table].findMany();
          backupData.models[table] = records;
          console.log(`✅ Berhasil mengekspor tabel: ${table} (${records.length} baris)`);
        } catch (err) {
          console.warn(`⚠️ Lewati tabel ${table}:`, err.message);
        }
      }
    }

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), "utf8");
    console.log(`\n🎉 Backup berhasil disimpan ke:\n${backupFile}`);
  } catch (error) {
    console.error("❌ Gagal melakukan backup database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runBackup();
