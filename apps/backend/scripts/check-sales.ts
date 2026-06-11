// Audita o estado atual: quantas ItinerarySale existem por roteiro vs
// o creator.totalSales (que é o que a API expõe como "salesCount").
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();
(async () => {
    const itins = await prisma.itinerary.findMany({
        include: {
            _count: { select: { sales: true } },
            creator: { select: { totalSales: true, traveler: { select: { name: true } } } },
        },
    });
    for (const it of itins) {
        console.log(`Itin "${it.title.slice(0, 40)}…"`);
        console.log(`  itineraryId: ${it.id}`);
        console.log(`  per-itinerary sales (real): ${it._count.sales}`);
        console.log(`  creator.totalSales (campo cached): ${it.creator.totalSales}`);
        console.log(`  creator: ${it.creator.traveler.name}`);
    }
    await prisma.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
