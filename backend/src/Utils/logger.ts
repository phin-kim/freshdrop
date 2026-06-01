import chalk from 'chalk';
import crypto from 'node:crypto';

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'highlight';

interface LogOptions {
    requestId?: string;
    context?: string;
    data?: Record<string, unknown>;
}

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
        },
        warn: (message: string, options?: LogOptions) => {
            console.warn(formatArgs('warn', message, options));
        },
        error: (message: string | Error, options?: LogOptions) => {
            if (message instanceof Error) {
                console.error(
                    formatArgs('error', message.message, {
                        ...options,
                        data: { stack: message.stack, ...options?.data },
                    })
                );
            } else {
                console.error(formatArgs('error', message, options));
            }
        },
        highlight: (message: string, options?: LogOptions) => {
            console.log(formatArgs('highlight', message, options));
        },
        debug: (message: string, options?: LogOptions) => {
            if (process.env.DEBUG === 'true') {
                console.log(formatArgs('debug', message, options));
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
        },
    };

    return logger;
}

export default createLogger;
