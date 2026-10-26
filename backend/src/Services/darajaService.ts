import axios, { type AxiosResponse } from 'axios';
import 'dotenv/config';

import AppError from '../Utils/appError.js';
import createLogger from '../Utils/logger.js';

const log = createLogger('darajaService.ts');

interface DarajaConfig {
    consumerKey: string;
    consumerSecret: string;
    businessShortCode: string;
    passkey: string;
    callbackUrl: string;
    environment: 'sandbox' | 'production';
}
interface StkPushResponse {
    MerchantRequestId: string;
    CheckoutRequestId: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
}
// interface StkQueryResult {
//     ResponseCode: string;
//     REsponseDescription: string;
//     MerchantId: string;
//     CheckoutRequestId: string;
//     ResultCode: string;
//     ResultDesc: string;
// }
interface TokenResponse {
    access_token: string;
    expires_in: string;
}
export class DarajaService {
    private consumerKey: string;
    private consumerSecret: string;
    private businessShortCode: string;
    private passkey: string;
    private callbackUrl: string;
    private baseUrl: string;
    constructor(config: DarajaConfig) {
        this.consumerKey = config.consumerKey;
        this.consumerSecret = config.consumerSecret;
        this.businessShortCode = config.businessShortCode;
        this.passkey = config.passkey;
        this.callbackUrl = config.callbackUrl;
        this.baseUrl =
            config.environment === 'production'
                ? 'https://api.safaricom.co.ke'
                : 'https://sandbox.safaricom.co.ke';
    }
    public async generateAccessToken(): Promise<string> {
        const credentials = Buffer.from(
            `${this.consumerKey}:${this.consumerSecret}`
        ).toString('base64');
        try {
            const response: AxiosResponse<TokenResponse> = await axios.get(
                `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
                {
                    headers: {
                        Authorization: `Basic ${credentials}`,
                    },
                }
            );
            return response.data.access_token;
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Unknown error occurred';
            throw AppError.badRequest(
                `Failed to generate Daraja access token: ${errorMessage}`
            );
        }
    }
    private generatePassword(timestamp: string): string {
        const rawString = `${this.businessShortCode}${this.passkey}${timestamp}`;
        return Buffer.from(rawString).toString('base64');
    }
    /**
     * Generates timestamp strictly in East Africa Time (EAT / UTC+3)
     */
    private getTimestamp(): string {
        const date: Date = new Date();

        // Force formatting to East Africa Time regardless of local machine timezone
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Africa/Nairobi',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });

        const parts = formatter.formatToParts(date);
        const getPart = (type: string): string =>
            parts.find((p) => p.type === type)?.value || '00';

        const year: string = getPart('year');
        const month: string = getPart('month');
        const day: string = getPart('day');
        const hour: string = getPart('hour').padStart(2, '0');
        const minute: string = getPart('minute').padStart(2, '0');
        const second: string = getPart('second').padStart(2, '0');

        return `${year}${month}${day}${hour}${minute}${second}`;
    }
    //initiate the STK
    public async initiateStkPush(
        phone: string,
        amount: number,
        accountReference: string,
        transactionDesc: string
    ): Promise<StkPushResponse> {
        const accessToken = await this.generateAccessToken();
        const timestamp = this.getTimestamp();
        const password: string = this.generatePassword(timestamp);
        // Inside initiateStkPush, right before sending the axios post:
        log.debug('--- DARAJA DEBUG PAYLOAD ---');
        log.debug(`Shortcode: ${this.businessShortCode}`);
        log.debug(`Timestamp:${timestamp}`);
        log.debug(`Generated Password:${password}`);
        console.log('Access Token:', accessToken.substring(0, 10) + '...');
        console.log(
            'Sending STK Payload:',
            JSON.stringify(
                {
                    BusinessShortCode: this.businessShortCode,
                    Password: password,
                    Timestamp: timestamp,
                    PartyA: phone,
                    PartyB: this.businessShortCode,
                    AccountReference: accountReference,
                    TransactionType: 'CustomerPayBillOnline',
                    Amount: amount,
                    CallBackURL: this.callbackUrl,
                    TransactionDesc: transactionDesc,
                },
                null,
                2
            )
        );
        log.debug('----------------------------');
        try {
            const response: AxiosResponse<StkPushResponse> = await axios.post(
                `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
                {
                    BusinessShortCode: this.businessShortCode,
                    Password: password,
                    Timestamp: timestamp,
                    PartyA: phone,
                    PhoneNumber: phone,
                    PartyB: this.businessShortCode,
                    AccountReference: accountReference,
                    TransactionType: 'CustomerPayBillOnline',
                    Amount: amount,
                    CallBackURL: this.callbackUrl,
                    TransactionDesc: transactionDesc,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                log.error('Daraja API Error Response:', {
                    data: {
                        errorMessage: JSON.stringify(
                            error.response?.data,
                            null,
                            2
                        ),
                    },
                });
                return {
                    MerchantRequestId: '',
                    CheckoutRequestId: '',
                    ResponseCode: '',
                    ResponseDescription: '',
                    CustomerMessage: '',
                };
            } else {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred';
                log.error('Error running M-Pesa test:', {
                    data: { errorMessage },
                });
                //throw AppError.badRequest(errorMessage)

                return {
                    MerchantRequestId: '',
                    CheckoutRequestId: '',
                    ResponseCode: '',
                    ResponseDescription: '',
                    CustomerMessage: '',
                };
            }
        }
    }
}
