import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando conclusão do teste E2E...');

  const itineraryId = 'cmnb6qwrk000z7a12l1g6j7ry';

  // 1. Aprovar a Itinerária
  const updatedItinerary = await prisma.itinerary.update({
    where: { id: itineraryId },
    data: { 
      status: 'APPROVED',
      approvedAt: new Date(),
    }
  });
  console.log(`✅ Itinerária "${updatedItinerary.title}" aprovada.`);

  // 2. Criar e Aprovar o Pacote
  const newPackage = await prisma.package.create({
    data: {
      id: 'pkg-lisboa-e2e',
      agencyId: 'cvc',
      title: 'Lisboa Autêntica – 7 dias de Imersão',
      destination: 'Lisboa',
      country: 'Portugal',
      continent: 'Europa',
      description: 'Descubra o melhor de Lisboa neste pacote exclusivo baseado no roteiro de Diego Artur.',
      duration: 7,
      priceMin: 4500,
      priceMax: 6500,
      importantInfo: ['Passaporte com validade mínima de 6 meses', 'Visto não necessário para brasileiros'],
      status: 'APPROVED',
      categories: ['cultural', 'romantic'],
      qualityScore: 95,
      rating: 5.0,
      reviewCount: 0,
      approvedAt: new Date(),
      images: {
        create: [
          { 
            url: 'https://images.unsplash.com/photo-1543783232-f79fbfcd82b6?w=1600',
            order: 0,
            alt: 'Lisboa Panorama'
          }
        ]
      },
      pricingWindows: {
        create: [
          {
            startDate: new Date('2026-10-01'),
            endDate: new Date('2026-10-08'),
            price: 4500,
            availableSlots: 20
          }
        ]
      }
    }
  });

  console.log(`✅ Pacote "${newPackage.title}" criado e aprovado para a agência CVC.`);
  console.log('🏁 Pipeline E2E concluído no banco de dados!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao completar E2E:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
