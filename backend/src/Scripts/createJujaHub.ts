import { prisma } from '../Config/DB.js';

// Run with: npx tsx src/Scripts/createJuja.ts
async function main() {
    // 1. Create or ensure Juja Hub exists
    const jujaHub = await prisma.hub.upsert({
        where: { slug: 'juja' },
        update: {},
        create: {
            name: 'Juja Hub',
            slug: 'juja',
            isActive: true,
            latitude: -1.100249284116291,
            longitude: 37.01580882602012,
        },
    });

    // 2. Define Juja Stores to seed
    const storesToSeed = [
        {
            name: 'Juja Open Market',
            slug: 'open_market',
            sourcingType: 'OPEN_MARKET',
            logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRAN0EqliZ1C9kgcvdh3lT-HkOLRcNeGHTxhKe4WNeeag&s',
            rating: 4.7,
            latitude: -1.100249284116291,
            longitude: 37.01580882602012,
        },
        {
            name: 'Citadel Supermarket Juja',
            slug: 'citadel',
            sourcingType: 'SUPERMARKET',
            logo: 'https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=aiIeJotZTGWTLflSz-_AUg&cb_client=search.gws-prod.grass&w=408&h=240&yaw=215.86107&pitch=0&thumbfov=100',
            rating: 4.6,
            latitude: -1.1066114495240684,
            longitude: 37.01485197727897,
        },
    ] as const;

    for (const storeData of storesToSeed) {
        await prisma.store.upsert({
            where: {
                hubId_slug: {
                    hubId: jujaHub.id,
                    slug: storeData.slug,
                },
            },
            update: {
                name: storeData.name,
                logo: storeData.logo,
                rating: storeData.rating,
                sourcingType: storeData.sourcingType,
                latitude: storeData.latitude,
                longitude: storeData.longitude,
            },
            create: {
                hubId: jujaHub.id,
                slug: storeData.slug,
                name: storeData.name,
                sourcingType: storeData.sourcingType,
                logo: storeData.logo,
                rating: storeData.rating,
                latitude: storeData.latitude,
                longitude: storeData.longitude,
            },
        });
    }

    console.log('Juja Hub and Stores successfully seeded.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
