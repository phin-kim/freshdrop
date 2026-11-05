import { MailWarning, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import useErrorStore from '../../Store/errorStore';
import { authClient } from '../../lib/auth-client';

export function VerifyEmailBanner() {
    const { data: session } = authClient.useSession();
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const setError = useErrorStore((state) => state.setError);
    const user = session?.user;

    // 1. Only show if user exists and emailVerified is explicitly false
    if (!user || user.emailVerified === true) {
        return null; // Hide only if they are definitely verified
    }

    const handleResend = async () => {
        setIsLoading(true);
        try {
            await authClient.emailOtp.sendVerificationOtp({
                email: user.email!,
                type: 'email-verification',
            });
            // Instead of an alert, maybe send them to the verify page!
            navigate('/auth/verify-otp');
        } catch {
            setError('Failed to send code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center gap-3 border-b border-amber-200 bg-amber-100 px-4 py-3 text-sm font-medium text-amber-900 sm:flex-row">
            <div className="flex items-center gap-2">
                <MailWarning size={18} />
                <span>
                    Your email is not verified. Please verify it to secure your
                    account.
                </span>
            </div>
            <button
                onClick={handleResend}
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-md bg-amber-200 px-3 py-1 transition-colors hover:bg-amber-300 disabled:opacity-50"
            >
                {isLoading ? (
                    <RefreshCw size={14} className="animate-spin" />
                ) : null}
                {isLoading ? 'Sending...' : 'Verify Now'}
            </button>
        </div>
    );
}
