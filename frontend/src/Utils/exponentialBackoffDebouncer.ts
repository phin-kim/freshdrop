export interface DebounceOptions {
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    maxAttempts?: number;
}

export interface DebounceState {
    isDebounced: boolean;
    remainingDelay: number;
    attemptCount: number;
    nextRetryTime: number | null;
}

export class ExponentialBackoffDebouncer {
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private attemptCount: number = 0;
    private initialDelay: number;
    private currentDelay: number;
    private maxDelay: number;
    private backoffMultiplier: number;
    private maxAttempts: number;
    private isExecuting: boolean = false;
    private isWaitingForRetry: boolean = false;
    private stateChangeCallback?: (state: DebounceState) => void;

    constructor(options: DebounceOptions = {}) {
        this.initialDelay = options.initialDelay ?? 500;
        this.currentDelay = this.initialDelay;
        this.maxDelay = options.maxDelay ?? 30000;
        this.backoffMultiplier = options.backoffMultiplier ?? 1.5;
        this.maxAttempts = options.maxAttempts ?? 5;
    }

    public getIsWaitingForRetry(): boolean {
        return this.isWaitingForRetry;
    }

    async execute<T>(
        fn: () => Promise<T>,
        onStateChange?: (state: DebounceState) => void
    ): Promise<T> {
        // If it's already running a real request or waiting for an active timer, prevent manual double submissions
        if (this.isExecuting && !this.debounceTimer) {
            throw new Error('Operation already in progress');
        }

        this.stateChangeCallback = onStateChange;
        this.isExecuting = true;

        if (this.attemptCount >= this.maxAttempts) {
            this.emitState(false, 0);
            this.isExecuting = false;
            this.isWaitingForRetry = false;
            throw new Error(
                `Maximum retry attempts (${this.maxAttempts}) exceeded`
            );
        }

        return new Promise<T>((resolve, reject) => {
            const executeWithBackoff = async () => {
                try {
                    this.isWaitingForRetry = false;
                    this.emitState(false, 0);

                    const result = await fn();
                    this.reset();
                    resolve(result);
                } catch (error: unknown) {
                    this.attemptCount++;

                    let status: number | undefined = undefined;
                    if (
                        error &&
                        typeof error === 'object' &&
                        'status' in error
                    ) {
                        const potentialStatus = (
                            error as Record<string, unknown>
                        ).status;
                        if (typeof potentialStatus === 'number') {
                            status = potentialStatus;
                        }
                    }

                    const isTransient =
                        status === undefined ||
                        (status >= 500 && status <= 599) ||
                        status === 429;

                    if (isTransient && this.attemptCount < this.maxAttempts) {
                        const nextDelay = Math.min(
                            this.initialDelay *
                                Math.pow(
                                    this.backoffMultiplier,
                                    this.attemptCount - 1
                                ),
                            this.maxDelay
                        );

                        this.currentDelay = nextDelay;
                        this.isWaitingForRetry = true;
                        this.emitState(true, nextDelay);

                        this.debounceTimer = setTimeout(() => {
                            this.debounceTimer = null;
                            void executeWithBackoff();
                        }, nextDelay);
                    } else {
                        this.isExecuting = false;
                        this.isWaitingForRetry = false;
                        this.emitState(false, 0);
                        reject(error);
                    }
                }
            };

            void executeWithBackoff();
        });
    }

    getState(): DebounceState {
        const isDebounced = this.debounceTimer !== null;
        return {
            isDebounced,
            remainingDelay: isDebounced ? this.currentDelay : 0,
            attemptCount: this.attemptCount,
            nextRetryTime: isDebounced ? Date.now() + this.currentDelay : null,
        };
    }

    reset(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        this.attemptCount = 0;
        this.currentDelay = this.initialDelay;
        this.isExecuting = false;
        this.isWaitingForRetry = false;
    }

    cancel(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        this.isExecuting = false;
        this.isWaitingForRetry = false;
        this.attemptCount = 0;
    }

    private emitState(isDebounced: boolean, remainingDelay: number): void {
        if (this.stateChangeCallback) {
            this.stateChangeCallback({
                isDebounced,
                remainingDelay,
                attemptCount: this.attemptCount,
                nextRetryTime: isDebounced ? Date.now() + remainingDelay : null,
            });
        }
    }
}
