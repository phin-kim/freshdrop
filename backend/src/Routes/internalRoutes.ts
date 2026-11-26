import { Router } from 'express';

import { handleScrapperPriceSync } from '../Controllers/scraperController';
import { verifyScrapperRequest } from '../Middleware/scraperAuth';

export const scraperRouter: Router = Router();
scraperRouter.post(
    '/scraper/prices',
    verifyScrapperRequest,
    handleScrapperPriceSync
);
