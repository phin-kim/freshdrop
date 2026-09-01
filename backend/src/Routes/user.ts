import { Router } from 'express';
import multer from 'multer';

import { estimateDistance } from '../Controllers/UserControllers/deliveryEstimate';
import {
    fetchAddressDetails,
    updateAddressDetails,
} from '../Controllers/UserControllers/userAddress';
import {
    getActiveOrders,
    getUserOrders,
} from '../Controllers/UserControllers/userOrders';
import { fetchUserProducts } from '../Controllers/UserControllers/userProducts';
import { uploadImage } from '../Controllers/UserControllers/userProfileChange';
import {
    getTransactionReceipt,
    getWalletDashboard,
    getWalletTransactions,
} from '../Controllers/UserControllers/userWallet';
import asyncHandler from '../Middleware/asyncHandler';
import authenticate from '../Middleware/authenticate';

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
