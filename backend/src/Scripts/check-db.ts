import { prisma } from '../Config/DB';

// Point this to your db.ts file

async function check() {
    try {
        // This command lists all tables the database knows about
        const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
        console.log('Tables found in database:', tables);
    } catch (err) {
        console.error('Connection failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

check();
