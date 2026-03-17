import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching packages...');
    const packages = await prisma.package.findMany({
        take: 3,
        include: { departures: true }
    });

    if (packages.length === 0) {
        console.log('No packages found to create sales for.');
        return;
    }

    // Try to find a traveler, or create a mock one.
    let traveler = await prisma.traveler.findFirst();
    if (!traveler) {
        traveler = await prisma.traveler.create({
            data: {
                name: 'Viajante Teste',
                email: 'viajante@teste.com',
                passwordHash: 'dummy',
            }
        });
        console.log('Created mock traveler:', traveler.id);
    }

    console.log(`Creating mock sales for ${packages.length} packages...`);

    for (const pkg of packages) {
        let departureId = undefined;
        let price = pkg.priceMin ?? 5000;
        
        if (pkg.departures && pkg.departures.length > 0) {
            departureId = pkg.departures[0].id;
            price = pkg.departures[0].price;
        }

        await prisma.purchaseHistory.create({
            data: {
                travelerId: traveler.id,
                packageId: pkg.id,
                departureId: departureId,
                totalPrice: price * 2,
                travelers: 2,
                status: 'CONFIRMED',
                contactName: 'João Silva',
                contactEmail: 'joao.silva@example.com',
                adultsCount: 2,
                childrenCount: 0,
            }
        });
        console.log(`Created sale for package: ${pkg.title}`);
    }

    console.log('Mock sales created successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
