import { prisma } from '../Config/DB.js';

async function main() {
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

    const storesToSeed = [
        {
            name: 'Quickmart Machakos',
            slug: 'QUICKMART_MACHAKOS',
            sourcingType: 'SUPERMARKET',
            logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0i3GLqH23ClCnFk33b5y6DVBjChOLniznYlxAN0-L_A&s=10',
            rating: 4.8,
            latitude: -1.5208591240073022, // From screenshot
            longitude: 37.267424699347444, // From screenshot
        },
        {
            name: 'Naivas Supermarket Machakos',
            slug: 'NAIVAS_MACHAKOS',
            sourcingType: 'SUPERMARKET',
            logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTv5nvrQwE0G8No_VQVOqzfR85sFHr8WJyQ4pkdWUqNGw&s=10',
            rating: 4.9,
            latitude: -1.5201434368059046, // From screenshot
            longitude: 37.26913527133593, // From screenshot
        },
        {
            name: 'Machakos Open Market',
            slug: 'MACHAKOS_OPEN_MARKET',
            sourcingType: 'OPEN_MARKET',
            logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT9ys0t-yA2GkurxH7hQVJot6HIVpFUrGzTI1WWXDQP2g&s=10',
            rating: 4.9,
            latitude: -1.52015, // From screenshot (approx)
            longitude: 37.27167, // From screenshot (approx)
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
                latitude: storeData.latitude, // Added
                longitude: storeData.longitude, // Added
            },
            create: {
                hubId: machakosHub.id,
                slug: storeData.slug,
                name: storeData.name,
                sourcingType: storeData.sourcingType,
                logo: storeData.logo,
                rating: storeData.rating,
                latitude: storeData.latitude, // Added
                longitude: storeData.longitude, // Added
            },
        });
    }
    console.log(
        'Machakos Hub and Stores successfully seeded with coordinates.'
    );
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
