import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
    dsn: process.env.SENTRY_DSN, // Add this to your .env
    integrations: [nodeProfilingIntegration()],
    // Tracing
    //tracesSampleRate: 1.0, //  Capture 100% of the transactions
    environment: process.env.NODE_ENV || 'development',
    // Set sampling rate for profiling - this is evaluated only once per SDK.init call
    profileSessionSampleRate: 0.1,
    // Trace lifecycle automatically enables profiling during active traces
    profileLifecycle: 'trace',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% of transactions in prod
});
