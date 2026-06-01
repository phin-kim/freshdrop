import dotenv from 'dotenv';
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
};
