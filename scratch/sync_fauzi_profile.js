import "dotenv/config";
import { prisma } from "../lib/prisma.js";

async function main() {
  let fauzi = await prisma.profile.findFirst({
    where: {
      OR: [
        { fullName: { contains: "Fauzi", mode: "insensitive" } },
        { email: { contains: "fauzi", mode: "insensitive" } },
      ],
    },
  });

  if (!fauzi) {
    fauzi = await prisma.profile.create({
      data: {
        email: "fauzi@bantuin.id",
        fullName: "Fauzi",
        campusName: "Pasar Rebo, Jakarta Timur",
        accountRole: "user",
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        ratingAvg: 5.0,
        ratingCount: 1,
        completedHelpsCount: 0,
        verificationStatus: "verified",
      },
    });
    console.log("Created Fauzi profile:", fauzi.fullName, fauzi.id);
  } else {
    console.log("Found existing Fauzi profile:", fauzi.fullName, fauzi.id);
  }

  // Update the latest request to point to Fauzi
  const latestRequest = await prisma.request.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (latestRequest) {
    console.log("Latest request:", latestRequest.id, latestRequest.title);
    const updated = await prisma.request.update({
      where: { id: latestRequest.id },
      data: { requesterId: fauzi.id },
      include: { requester: true },
    });
    console.log("Updated latest request requester to:", updated.requester?.fullName);
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
