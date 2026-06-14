import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import dontenv from 'dotenv';
import 'dotenv/config';
import express from 'express';

import { userRoute } from './Routes/user';
import errorHandler from './Utils/errorHandler';
import createLogger from './Utils/logger';
import { auth } from './lib/auth';

dontenv.config();
const log = createLogger('Server.ts');

const server = express();
const PORT = process.env.PORT;
server.use(
    cors({
        origin: [
            'http://localhost:5173',
            'https://unparasitical-unsigned-lasonya.ngrok-free.dev',
        ],
        credentials: true,
    })
);

server.all('/api/auth/{*any}', toNodeHandler(auth));

server.use(express.json());

server.use('/api/user', userRoute);
server.get('/', (_req, res) => {
    console.log('We are live');
    res.status(200).send('We are live');
});
server.listen(PORT, async () => {
    log.info(`Server is running on port ${5100}`);
});
server.use(errorHandler);
