import { DarajaService } from '../Services/darajaService.js';
import createLogger from '../Utils/logger.js';

const log = createLogger('DarajaTest.ts');

const mpesaService = new DarajaService({
    consumerKey: process.env.DARAJA_CONSUMER_KEY ?? '',
    consumerSecret: process.env.DARAJA_CONSUMER_SECRET ?? '',
    businessShortCode: '174379',
    passkey: process.env.DARAJA_PASSKEY ?? '',
    callbackUrl:
        'https://unparasitical-unsigned-lasonya.ngrok-free.dev/api/payments/callback',
    environment: 'sandbox',
});
async function runTest() {
    try {
        const response = await mpesaService.initiateStkPush(
            '254708374149',
            10,
            'ORDER-9090',
            'GroceryTest'
        );
        log.debug('STK push triggered', { data: { response } });
    } catch (error) {
        const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';
        console.error('Error running M-Pesa test:', errorMsg);
    }
}
runTest();
