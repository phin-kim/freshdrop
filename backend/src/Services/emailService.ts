import axios, { type AxiosInstance } from 'axios';

import AppError from '../Utils/appError';
import createLogger from '../Utils/logger';

const log = createLogger('emailService.ts');
interface EmailRequest {
    to: string;
    templateId: number;
    params: unknown;
}
class BrevoEmailSend {
    private client: AxiosInstance;
    private baseUrl = 'https://api.brevo.com/v3/smtp/email';
    private apiKey: string;
    constructor() {
        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey) {
            throw AppError.badRequest(
                'Unable to process request at the moment'
            );
        }
        this.apiKey = apiKey;
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'api-key': this.apiKey,
                'Content-Type': 'application/json',
            },
        });
    }
    async sendEmail({ to, params, templateId }: EmailRequest) {
        try {
            const response = await this.client.post('', {
                to: [{ email: to }],
                templateId: templateId,
                params,
            });
            log.highlight('Brevo response');
            log.debug('Response', {
                data: { status: response.status, data: response.data },
            });
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
            log.error('Brevo error detected', {
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
export default new BrevoEmailSend();
