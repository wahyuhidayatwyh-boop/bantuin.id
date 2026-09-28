import "dotenv/config";
import { prisma } from "../lib/prisma.js";

async function main() {
  console.log("Checking and syncing profiles in database...");

  // 1. Create or get Sarah
  const sarah = await prisma.profile.upsert({
    where: { email: "sarah.kusuma@ui.ac.id" },
    update: { fullName: "Sarah Kusuma", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80" },
    create: {
      email: "sarah.kusuma@ui.ac.id",
      fullName: "Sarah Kusuma",
      campusName: "Pasar Rebo, Jakarta Timur",
      accountRole: "user",
      ratingAvg: 4.95,
      ratingCount: 18,
      completedHelpsCount: 24,
      verificationStatus: "verified",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    },
  });

  // 2. Create or get Dimas
  const dimas = await prisma.profile.upsert({
    where: { email: "dimas.pratama@univ.ac.id" },
    update: { fullName: "Dimas Pratama", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" },
    create: {
      email: "dimas.pratama@univ.ac.id",
      fullName: "Dimas Pratama",
      campusName: "Rawamangun, Jakarta Timur",
      accountRole: "user",
      ratingAvg: 4.88,
      ratingCount: 12,
      completedHelpsCount: 15,
      verificationStatus: "verified",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    },
  });

  // 3. Create or get Linda
  const linda = await prisma.profile.upsert({
    where: { email: "linda.rahma@mail.com" },
    update: { fullName: "Linda Rahmawati", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" },
    create: {
      email: "linda.rahma@mail.com",
      fullName: "Linda Rahmawati",
      campusName: "Jatinegara, Jakarta Timur",
      accountRole: "user",
      ratingAvg: 5.0,
      ratingCount: 9,
      completedHelpsCount: 10,
      verificationStatus: "verified",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    },
  });

  // Update requests to assign them to distinct community members
  const req1 = await prisma.request.findFirst({ where: { title: { contains: "Akta Notaris" } } });
  if (req1) {
    await prisma.request.update({ where: { id: req1.id }, data: { requesterId: sarah.id } });
  }

  const req2 = await prisma.request.findFirst({ where: { title: { contains: "120 Halaman" } } });
  if (req2) {
    await prisma.request.update({ where: { id: req2.id }, data: { requesterId: dimas.id } });
  }

  const req3 = await prisma.request.findFirst({ where: { title: { contains: "Laundry Kilat" } } });
  if (req3) {
    await prisma.request.update({ where: { id: req3.id }, data: { requesterId: linda.id } });
  }

  console.log("Sync complete! Updated sample community requests to distinct authors.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
