import "dotenv/config";
import { prisma } from "../lib/prisma.js";

const UPLOADED_AVATAR = "https://lyyiogratxbijtapeilj.supabase.co/storage/v1/object/public/bantuin-avatars/1790622597415-v4nur0-avatar-1790622596234.jpg";

async function main() {
  const emails = ["2211102008@ittelkom-pwt.ac.id", "fauzi.ap.0413@gmail.com", "fauzi@bantuin.id"];

  for (const email of emails) {
    const profile = await prisma.profile.upsert({
      where: { email },
      update: {
        avatarUrl: UPLOADED_AVATAR,
        fullName: "Fauzi",
        verificationStatus: "unverified",
        campusName: "Pasar Rebo, Jakarta Timur",
      },
      create: {
        email,
        fullName: "Fauzi",
        campusName: "Pasar Rebo, Jakarta Timur",
        accountRole: "user",
        avatarUrl: UPLOADED_AVATAR,
        ratingAvg: 5.0,
        ratingCount: 0,
        completedHelpsCount: 0,
        verificationStatus: "unverified",
      },
    });

    await prisma.user.upsert({
      where: { email },
      update: {
        name: "Fauzi",
        verified: false,
      },
      create: {
        email,
        name: "Fauzi",
        verified: false,
      },
    });

    console.log("Upserted profile and user for:", email, "-> verificationStatus: unverified");
  }

  // Update any other Fauzi profiles to unverified
  const allFauzi = await prisma.profile.findMany({
    where: {
      OR: [
        { fullName: { contains: "Fauzi", mode: "insensitive" } },
        { email: { contains: "fauzi", mode: "insensitive" } },
      ],
    },
  });

  for (const p of allFauzi) {
    await prisma.profile.update({
      where: { id: p.id },
      data: {
        avatarUrl: UPLOADED_AVATAR,
        verificationStatus: "unverified",
      },
    });
    console.log("Updated avatar & unverified status for profile:", p.email, p.fullName);
  }

  console.log("All Fauzi profiles synced successfully with status 'unverified'.");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
