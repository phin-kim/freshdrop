import * as Sentry from '@sentry/node';
import chalk from 'chalk';
import crypto from 'node:crypto';
import winston from 'winston';
import 'winston-daily-rotate-file';

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'highlight';

interface LogOptions {
    requestId?: string;
    context?: string;
    data?: Record<string, unknown>;
}
//configuring winston for permanent file storage
const fileLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        //rotate logs daily , keep for 14 days max 200 mb per file
        new winston.transports.DailyRotateFile({
            filename: 'logs/application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
        }),
        new winston.transports.DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '30d',
        }),
    ],
});
function createLogger(_name: string) {
    const timestamp = () => {
        const date = new Date();
        return date
            .toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
            })
            .replace(',', '');
    };

    const formatArgs = (
        level: LogLevel,
        message: string,
        options?: LogOptions
    ) => {
        const rid = options?.requestId ?? crypto.randomUUID().slice(0, 8);
        const ctx = options?.context ? `[${options.context}]` : '';
        const colors = {
            error: chalk.redBright,
            warn: chalk.yellow,
            highlight: chalk.cyanBright,
            debug: chalk.blue, // Now setting debug to blue as requested
            info: chalk.white,
        };
        const colorFn = colors[level] || chalk.gray;
        return [
            chalk.gray(`[${timestamp()}]`), // Keep timestamps subtle
            chalk.gray(`[${rid}]`),
            chalk.magenta(ctx), // Context in a distinct color
            chalk.bold(level.toUpperCase()), // The Level Tag
            colorFn(message), // THE FIX: The message itself is now colored
            options?.data ? JSON.stringify(options.data, null, 2) : '',
        ]
            .filter(Boolean)
            .join(' ');
    };

    // ... rest of your logger code stays the same
    const logger = {
        info: (message: string, options?: LogOptions) => {
            console.log(formatArgs('info', message, options));
            fileLogger.info(message, options);
        },
        warn: (message: string, options?: LogOptions) => {
            console.warn(formatArgs('warn', message, options));
            fileLogger.warn(message, options);
        },
        error: (message: string | Error, options?: LogOptions) => {
            const errorMsg =
                message instanceof Error ? message.message : message;
            const errorData =
                message instanceof Error
                    ? { stack: message.stack, ...options?.data }
                    : options?.data;

            console.error(
                formatArgs('error', errorMsg, { ...options, data: errorData })
            );

            // Save to file
            fileLogger.error(errorMsg, { ...options, data: errorData });

            // 2. Report to Sentry!
            if (message instanceof Error) {
                Sentry.captureException(message, {
                    extra: options?.data,
                    tags: { context: options?.context },
                });
            } else {
                Sentry.captureMessage(message, {
                    level: 'error',
                    extra: options?.data,
                });
            }
        },
        highlight: (message: string, options?: LogOptions) => {
            console.log(formatArgs('highlight', message, options));
            fileLogger.info(message, { ...options, level: 'highlight' });
        },
        debug: (message: string, options?: LogOptions) => {
            if (process.env.DEBUG === 'true') {
                console.log(formatArgs('debug', message, options));
                fileLogger.debug(message, options);
            }
        },
        structured: (
            level: LogLevel,
            message: string,
            options?: LogOptions
        ) => {
            console.log({
                timestamp: timestamp(),
                requestId: options?.requestId,
                context: options?.context,
                level,
                message,
                data: options?.data,
            });
            fileLogger.log(level, message, options);
        },
    };

    return logger;
}

export default createLogger;
