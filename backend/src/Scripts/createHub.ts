import { prisma } from '../Config/DB.js';

async function main() {
    console.log('🌱 Starting database seeding for operational hubs...');

    // Create the target operational hub matching what your frontend sends
    const jujaHub = await prisma.hub.upsert({
        where: { slug: 'juja-market-hub' },
        update: {}, // If it already exists, don't change anything
        create: {
            name: 'Juja Market Hub',
            slug: 'juja-market-hub',
            isActive: true, // Matching the schema properties caught in the previous log
        },
    });

    console.log('✅ Operational Hub successfully verified or written to DB:');
    console.log(jujaHub);
}

main()
    .catch((e) => {
        console.error('❌ Failed to seed operational hub:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
