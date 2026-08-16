import axios, { type AxiosInstance } from 'axios';
import crypto from 'node:crypto';

import AppError from '../Utils/appError.js';
import createLogger from '../Utils/logger.js';

const log = createLogger('paymentService.ts');
export interface InitialPaymentRequest {
    amount: number;
    phone_number: string;
    channel_id: string;
    provider: 'm-pesa';
    external_reference: string;
    customer_name?: string;
    callback_url?: string;
    credential_id?: string;
}
export interface InitialPaymentResponse {
    success: boolean;
    status: 'QUEUED' | 'PROCESSING' | 'FAILED';
    reference: string;
    CheckoutRequestID: string;
}
export interface TransactionStatusResponse {
    transaction_dat: string;
    provider: 'm-pesa';
    success: boolean;
    merchant: string;
    payment_reference: string;
    third_party_reference: string;
    status: 'QUEUED' | 'PROCESSING' | 'FAILED' | 'SUCCESS';
    CheckoutRequestId: string;
    provider_reference: string;
}
class PayheroService {
    private client: AxiosInstance;
    private baseUrl = 'https://backend.payhero.co.ke/api/v2';
    private channelId: string;
    private basicAuth: string;
    constructor() {
        const basicAuth = process.env.PAYHERO_BASIC_AUTH;
        const channelId = process.env.PAYHERO_CHANNEL_ID;
        //log.debug(`Channel id : ${channelId}, basic auth : ${basicAuth}`);
        if (!basicAuth) {
            throw new Error('PAYHERO_BASiC_AUTH environment variable missing');
        }
        if (!channelId) {
            throw new Error('CHANNEL_ID missing from environment variables');
        }
        this.channelId = channelId;
        this.basicAuth = basicAuth;
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Basic ${this.basicAuth}`,
            },
            timeout: 30000,
        });
    }
    async initiatePayment(
        params: Omit<InitialPaymentRequest, 'channel_id' | 'provider'>
    ): Promise<InitialPaymentResponse> {
        try {
            const response = await this.client.post('/payments', {
                amount: params.amount,
                phone_number: params.phone_number,
                channel_id: this.channelId,
                provider: 'm-pesa' as const,
                external_reference: params.external_reference,
                customer_name: params.customer_name,
                callback_url: params.callback_url,
                credential_id: params.credential_id,
            });
            log.debug('PayHero initiation response received', {
                context: 'InitiatePayment',
                data: response.data,
            });
            log.debug('PayHero initiation response received (full)', {
                data: { status: response.status, data: response.data },
            });

            return response.data;
        } catch (error: unknown) {
            let statusCode = 500;
            let message = 'Failed to initiate the payment';
            let errorData = undefined;

            if (axios.isAxiosError(error)) {
                statusCode = error?.response?.status || 500;
                message = error?.response?.data?.message || error?.message;
                errorData = error?.response?.data;
                const payheroError =
                    error?.response?.data?.error_message || error?.message;

                if (
                    payheroError?.toLowerCase().includes('insufficient balance')
                ) {
                    log.error(
                        'Payhero Merchant Account has low float balance',
                        { data: { payheroError } }
                    );

                    throw AppError.badRequest(
                        'Payment service is temporarily undergoing maintenance. Please try again shortly or contact support.'
                    );
                }
            } else if (error instanceof Error) {
                message = error.message;
            }
            log.error('Payhero initiation of payment failed', {
                data: { statusCode, message, errorData },
            });
            throw AppError.badRequest(`Failed to initiate payment ${message}`);
        }
    }
    async getTransactionStatus(
        reference: string
    ): Promise<TransactionStatusResponse> {
        try {
            const response = await this.client.get('/transaction-status', {
                params: { reference },
            });

            log.debug(
                `PayHero status for ${reference}: ${response.data.status}`,
                {
                    context: 'GetStatus',
                    data: response.data,
                }
            );
            log.debug('PayHero status raw response', {
                data: {
                    reference,
                    keys: Object.keys(response.data || {}),
                    data: response.data,
                },
            });

            return response.data;
        } catch (error: unknown) {
            let statusCode = 500;
            let message = 'Failed to fetch transaction status';
            let errorData = undefined;
            if (axios.isAxiosError(error)) {
                statusCode = error?.response?.status || 500;
                message = error?.response?.data?.message || error?.message;
                errorData = error?.response?.data;
            }
            log.error('Failed to fetch transaction status', {
                data: { statusCode, message, errorData },
            });

            throw AppError.badRequest('Failed to fetch payment status');
        }
    }
    verifyWebhookSignature(body: string, signature: string): boolean {
        try {
            const secret = process.env.PAYHERO_WEBHOOK_SECRET;
            if (!secret) {
                console.warn(
                    'PAYHERO_WEBHOOK_SECRET not set, skipping verification'
                );
                return true;
            }

            // PayHero uses HMAC-SHA256 for signature verification
            const expectedSignature = crypto
                .createHmac('sha256', secret)
                .update(body)
                .digest('hex');

            return expectedSignature === signature;
        } catch (error) {
            console.error('Webhook signature verification error:', error);
            return false;
        }
    }
}
export default new PayheroService();
