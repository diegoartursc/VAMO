import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fetching all packages...');
    const packages = await prisma.package.findMany();
    
    console.log(`Found ${packages.length} packages. Creating departures...`);
    
    let totalCreated = 0;
    
    for (const pkg of packages) {
        // Create 3 departures for each package in the next 3 months
        const basePrice = pkg.priceMin || 5000;
        
        for (let i = 1; i <= 3; i++) {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() + i);
            startDate.setDate(15 + Math.floor(Math.random() * 10)); // random day 15-24
            
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + (pkg.duration || 7));
            
            await prisma.packageDeparture.create({
                data: {
                    packageId: pkg.id,
                    startDate: startDate,
                    price: basePrice + (i * 200),
                    capacityTotal: 20,
                    capacityVamo: 10,
                    capacityVamoAvailable: 10,
                    status: 'ABERTA',
                }
            });
            totalCreated++;
        }
    }
    
    console.log(`Successfully created ${totalCreated} departures!`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
