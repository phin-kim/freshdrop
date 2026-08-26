import { prisma } from '../Config/DB.js';

//to run npx tsx src/Scripts/createHub.ts
async function main() {
    console.log('🌱 Starting database seeding for operational hubs...');

    // 1. Juja Market Hub (Open Market Hub)
    const marketHub = await prisma.hub.upsert({
        where: { slug: 'juja-market-hub' },
        update: {
            // If it exists, update it with the true coordinates we just added to the schema
            latitude: -1.1011262058791185,
            longitude: 37.01565883613961,
        },
        create: {
            name: 'Juja Market Hub',
            slug: 'juja-market-hub',
            isActive: true,
            latitude: -1.1011262058791185,
            longitude: 37.01565883613961,
        },
    });
    console.log('✅ Juja Market Hub verified/updated.');

    // 2. Juja Supermarket Hub (Supermarket Hub)
    const supermarketHub = await prisma.hub.upsert({
        where: { slug: 'juja-supermarket-hub' },
        update: {
            latitude: -1.1066205529617854,
            longitude: 37.01483390672615,
        },
        create: {
            name: 'Juja Supermarket Hub',
            slug: 'juja-supermarket-hub',
            isActive: true,
            latitude: -1.1066205529617854,
            longitude: 37.01483390672615,
        },
    });
    console.log('✅ Juja Supermarket Hub verified/created.');

    console.log('\n✨ All operational hubs successfully written to DB:');
    console.log('Market Hub:', {
        id: marketHub.id,
        lat: marketHub.latitude,
        lng: marketHub.longitude,
    });
    console.log('Supermarket Hub:', {
        id: supermarketHub.id,
        lat: supermarketHub.latitude,
        lng: supermarketHub.longitude,
    });
}

main()
    .catch((e) => {
        console.error('❌ Failed to seed operational hubs:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
