import { Router } from 'express';
import multer from 'multer';

import { estimateDistance } from '../Controllers/UserControllers/deliveryEstimate.js';
import {
    fetchAddressDetails,
    updateAddressDetails,
} from '../Controllers/UserControllers/userAddress.js';
import {
    getActiveOrders,
    getUserOrders,
} from '../Controllers/UserControllers/userOrders.js';
import { fetchUserProducts } from '../Controllers/UserControllers/userProducts.js';
import { uploadImage } from '../Controllers/UserControllers/userProfileChange.js';
import {
    getTransactionReceipt,
    getWalletDashboard,
    getWalletTransactions,
    topUpWallet,
    walletTopUpStatus,
    walletWebhook,
} from '../Controllers/UserControllers/userWallet.js';
import asyncHandler from '../Middleware/asyncHandler.js';
import authenticate from '../Middleware/authenticate.js';

const upload = multer({ storage: multer.memoryStorage() });
export const userRoute: Router = Router();
userRoute.post(
    '/delivery/estimate',
    authenticate,
    asyncHandler(estimateDistance)
);
userRoute.get('/products', authenticate, asyncHandler(fetchUserProducts));
userRoute.post(
    '/upload-image',
    authenticate,
    upload.single('file'),
    asyncHandler(uploadImage)
);
userRoute.get(
    '/saved-addresses',
    authenticate,
    asyncHandler(fetchAddressDetails)
);
userRoute.post(
    '/edit-address/:id',
    authenticate,
    asyncHandler(updateAddressDetails)
);
userRoute.get('/orders/', authenticate, asyncHandler(getUserOrders));
userRoute.get('/orders/active/', authenticate, asyncHandler(getActiveOrders));
userRoute.get('/wallet', authenticate, asyncHandler(getWalletDashboard));
userRoute.post('/wallet/top-up', authenticate, asyncHandler(topUpWallet));
userRoute.get(
    '/wallet/top-up/status/:reference',
    authenticate,
    asyncHandler(walletTopUpStatus)
);
userRoute.post('/wallet/top-up/webhook', asyncHandler(walletWebhook));
userRoute.get(
    '/wallet/transactions',
    authenticate,
    asyncHandler(getWalletTransactions)
);
userRoute.get(
    '/wallet/transactions/:transactionId',
    authenticate,
    asyncHandler(getTransactionReceipt)
);
