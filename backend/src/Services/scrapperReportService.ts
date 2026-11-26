import emailService from './emailService.js';

const REPORT_TEMPLATE_ID = Number(process.env.BREVO_SCRAPER_REPORT_TEMPLATE_ID);

export async function sendScraperReport(payload: {
    storeName: string;
    runId: string;
    updates: Array<{
        productName: string;
        oldPrice: number;
        newPrice: number;
        oldIsOnOffer: boolean;
        newIsOnOffer: boolean;
    }>;
    unchanged: number;
    skipped: number;
}) {
    const to = process.env.REPORT_EMAIL_TO!;

    const rows = payload.updates.map((u) => {
        const priceChanged = Math.abs(u.oldPrice - u.newPrice) >= 0.01;
        const offerChanged = u.oldIsOnOffer !== u.newIsOnOffer;

        return {
            product: u.productName,
            oldPrice: u.oldPrice.toFixed(2),
            newPrice: u.newPrice.toFixed(2),
            deltaPct: priceChanged
                ? (((u.newPrice - u.oldPrice) / u.oldPrice) * 100).toFixed(1)
                : '0.0',
            isIncrease: u.newPrice > u.oldPrice,
            priceChanged: priceChanged,
            offerChanged: offerChanged,
            isOnOffer: u.newIsOnOffer,
        };
    });

    await emailService.sendEmail({
        to,
        templateId: REPORT_TEMPLATE_ID,
        params: {
            storeName: payload.storeName,
            runId: payload.runId,
            count: payload.updates.length,
            unchanged: payload.unchanged,
            skipped: payload.skipped,
            rows,
        },
    });
}
