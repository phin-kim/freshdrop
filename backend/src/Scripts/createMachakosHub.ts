import { prisma } from '../Config/DB.js';

//to run npx tsx src/Scripts/createHub.ts
async function main() {
    // 1. Create or ensure Machakos Hub exists
    const machakosHub = await prisma.hub.upsert({
        where: { slug: 'machakos' },
        update: {},
        create: {
            name: 'Machakos Hub',
            slug: 'machakos',
            isActive: true,
            latitude: -1.5177,
            longitude: 37.2634,
        },
    });

    // 2. Define Machakos Stores to seed
    const storesToSeed = [
        {
            name: 'Quickmart Machakos',
            slug: 'quickmart',
            sourcingType: 'SUPERMARKET',
            logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0i3GLqH23ClCnFk33b5y6DVBjChOLniznYlxAN0-L_A&s=10',
            rating: 4.8,
        },
        {
            name: 'Naivas Supermarket Machakos',
            slug: 'supermarket',
            sourcingType: 'SUPERMARKET',
            logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTv5nvrQwE0G8No_VQVOqzfR85sFHr8WJyQ4pkdWUqNGw&s=10',
            rating: 4.9,
        },
        {
            name: 'Machakos Open Market',
            slug: 'open_market',
            sourcingType: 'OPEN_MARKET',
            logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9ys0t-yA2GkurxH7hQVJot6HIVpFUrGzTI1WWXDQP2g&s=10',
            rating: 4.9,
        },
    ] as const;

    for (const storeData of storesToSeed) {
        await prisma.store.upsert({
            where: {
                hubId_slug: {
                    hubId: machakosHub.id,
                    slug: storeData.slug,
                },
            },
            update: {
                name: storeData.name,
                logo: storeData.logo,
                rating: storeData.rating,
                sourcingType: storeData.sourcingType,
            },
            create: {
                hubId: machakosHub.id,
                slug: storeData.slug,
                name: storeData.name,
                sourcingType: storeData.sourcingType,
                logo: storeData.logo,
                rating: storeData.rating,
            },
        });
    }

    console.log('Machakos Hub and Stores successfully seeded.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
