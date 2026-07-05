import { prisma } from '../Config/DB.js';

async function main() {
    console.log('⚡ Attuning database migration history tables...');

    // Surgically delete the stuck history row from Prisma's internal ledger
    const deletedRows = await prisma.$executeRawUnsafe(
        `DELETE FROM "_prisma_migrations" WHERE "migration_name" = '20260705071514_updating_local_price_to'`
    );

    console.log(
        `✅ Successfully wiped ${deletedRows} stuck tracking record(s) from history.`
    );
}

main()
    .catch((error) => {
        console.error('❌ Failed to clear migration log row:', error);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
