import axios, { type AxiosInstance } from 'axios';

import AppError from '../Utils/appError.js';
import createLogger from '../Utils/logger.js';

const log = createLogger('smsService.ts');
interface SmsRequest {
    to: string;
    message: string;
    sender_id: string; //sender name or phone number to display
}
class StackVerifyService {
    private client: AxiosInstance;
    private baseUrl = 'https://stackverify.site/api/v1';
    private apiKey: string;

    constructor() {
        const apiKey = process.env.STACK_VERIFY_API_KEY;
        if (!apiKey) {
            log.error('Missing api key');
            throw AppError.badRequest(
                'Unable to process your request at the moment.Try again later'
            );
        }
        this.apiKey = apiKey;
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            timeout: 30000,
        });
    }
    async sendSMS(params: SmsRequest) {
        try {
            const response = await this.client.post('/sms/send', {
                to: params.to,
                message: params.message,
                sender_id: params.sender_id,
            });
            log.highlight('STACK VERIFY RESPONSE');
            log.debug('Response', { data: { response } });
            return response.data;
        } catch (error) {
            let statusCode = 500;
            let message = 'Failed to send message';
            let errorData = undefined;
            if (axios.isAxiosError(error)) {
                statusCode = error?.response?.status || 500;
                message = error?.response?.data?.message || error?.message;
                errorData = error?.response?.data;
            } else if (error instanceof Error) {
                message = error.message;
            }
            log.error('Stack verify error detected', {
                data: {
                    statusCode,
                    message,
                    errorData,
                },
            });
            throw AppError.badRequest('Unable to send the message');
        }
    }
}
export default new StackVerifyService();
