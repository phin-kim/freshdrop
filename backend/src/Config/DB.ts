import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import { Pool } from 'pg';

//import createLogger from '../Utils/logger';
import { PrismaClient } from '../generated/prisma/client';

//const log = createLogger('DB.ts');

dotenv.config();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
export { prisma };
/**
 * in the event that we add more endpoints that deal with fetching or doing something abut products this is the solution 
 * // Extend the client to automatically handle soft deletes on reads
const basePrisma = new PrismaClient();
export const prisma = basePrisma.$extends({
  query: {
    product: {
      async findMany({ args, query }) {
        // Automatically inject isDeleted: false if not explicitly overwritten
        args.where = { isDeleted: false, ...args.where };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { isDeleted: false, ...args.where };
        return query(args);
      },
      // You can add findUnique, count, etc. here as well
    },
  },
});
 */
/*import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    //safely drop connection that sit idle for too long
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
//a quick helper function for running raw sql scripts safely
export const db = {
    query: <T extends Record<string, unknown>>(
        text: string,
        params?: unknown[]
    ) => {
        return pool.query<T>(text, params);
    },
};*/
