import "dotenv/config";
import { prisma } from "../lib/prisma.js";

async function checkRooms() {
  const rooms = await prisma.orderRoom.findMany({
    include: {
      chatMessages: true,
    },
  });
  console.log(`Total Order Rooms di DB: ${rooms.length}`);
  rooms.forEach((r, idx) => {
    console.log(`[Room ${idx + 1}] ID: ${r.id}, Request: ${r.requestId}, Helper: ${r.helperId}, Requester: ${r.requesterId}, Total Messages: ${r.chatMessages.length}`);
  });
}

checkRooms().finally(() => prisma.$disconnect());
