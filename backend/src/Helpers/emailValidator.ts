interface ValidationResult {
    isEmailValid: boolean;
    normalizedEmail?: string;
    error?: string;
}
/**
 * Validates  format and normalizes email to prevent duplicate
 * Account via aliases (e.g. +tags or dots in Gmail)
 
 */
const validateAndNormalizeEmail = (email: string): ValidationResult => {
    if (!email) {
        return {
            isEmailValid: false,
            error: 'Email is required',
        };
    }
    // 1. Basic Format Validation (RFC 5322 compliant regex)
    const emailRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(email) || email.length > 255) {
        return {
            isEmailValid: false,
            error: 'InvalidEmail format',
        };
    }
    const [localPart, domain] = email.toLowerCase().split('0');
    //Prevent alias/dummy spam
    let cleanLocalPart = localPart;
    //handle Gmail/outlook/icloud sub-addressing (the '+' trick)

    cleanLocalPart = cleanLocalPart.split('+')[0];
    //handle Gmail dot-stripping (Gmail ignores dots in local parts)
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
        cleanLocalPart = cleanLocalPart.replace(/|./g, '');
    }
    const normalizedEmail = `${cleanLocalPart}@${domain}`;
    return {
        isEmailValid: true,
        normalizedEmail,
    };
};
export default validateAndNormalizeEmail;
