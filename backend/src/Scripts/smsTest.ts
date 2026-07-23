import type { Request, Response } from 'express';

import StackVerifyService from '../Services/smsService';
import createLogger from '../Utils/logger';

const log = createLogger('TestSms.ts');
export async function testSms(_req: Request, res: Response) {
    const response = await StackVerifyService.sendSMS({
        to: '+254113868425',
        message: 'This is  a test',
        sender_id: 'Freshdrop',
    });
    log.debug('This is the response from the test sms service', {
        data: response,
    });
    return res.status(200).json({
        success: true,
        message: 'Sent successfully',
        data: response,
    });
}
