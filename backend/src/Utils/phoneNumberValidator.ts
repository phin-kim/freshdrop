/**
 * Phone number validation for Kenyan mobile numbers
 * Supports formats:
 * - 254xxxxxxxxx (12 digits with country code)
 * - 07xxxxxxxxx (10 digits with 07 prefix)
 * - 01xxxxxxxxx (10 digits with 01 prefix)
 */

export interface PhoneValidationResult {
    isValid: boolean;
    normalizedNumber: string;
    error?: string;
}

/**
 * Validates a Kenyan phone number and normalizes it
 * @param phoneNumber Raw phone number string
 * @returns Validation result with normalized number
 */
export function validateKenyanPhoneNumber(
    phoneNumber: string
): PhoneValidationResult {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        return {
            isValid: false,
            normalizedNumber: '',
            error: 'Phone number must be a non-empty string',
        };
    }

    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // Check if it's 254 format (country code format)
    if (cleaned.startsWith('254')) {
        if (cleaned.length !== 12) {
            return {
                isValid: false,
                normalizedNumber: '',
                error: `Phone number with 254 prefix must be exactly 12 digits, got ${cleaned.length}`,
            };
        }
        // Validate that it's a known Kenyan network prefix after country code
        const operator = cleaned.substring(3, 5);
        if (!isValidKenyanOperator(operator)) {
            return {
                isValid: false,
                normalizedNumber: '',
                error: `Invalid Kenyan operator code: ${operator}`,
            };
        }
        return {
            isValid: true,
            normalizedNumber: cleaned,
        };
    }

    // Check if it's 07 or 01 format
    if (cleaned.startsWith('07') || cleaned.startsWith('01')) {
        if (cleaned.length !== 10) {
            return {
                isValid: false,
                normalizedNumber: '',
                error: `Phone number with 07/01 prefix must be exactly 10 digits, got ${cleaned.length}`,
            };
        }
        const operator = cleaned.substring(0, 2);
        if (!isValidKenyanOperator(operator)) {
            return {
                isValid: false,
                normalizedNumber: '',
                error: `Invalid operator prefix: ${operator}`,
            };
        }
        // Convert to 254 format for PayHero
        const normalizedNumber = '254' + cleaned.substring(1);
        return {
            isValid: true,
            normalizedNumber,
        };
    }

    return {
        isValid: false,
        normalizedNumber: '',
        error: 'Phone number must start with 254, 07, or 01',
    };
}

/**
 * Validates if the operator code is a known Kenyan mobile network
 * Known operators: 07/01 (Safaricom), 072/073 (Airtel), 070 (shared)
 */
function isValidKenyanOperator(prefix: string): boolean {
    // Valid prefixes for Kenyan mobile networks
    const validPrefixes = [
        '07', // Generic 07 prefix
        '01', // Generic 01 prefix
        '71', // Safaricom (254 + 71)
        '72', // Safaricom (254 + 72)
        '73', // Airtel (254 + 73)
        '74', // Airtel (254 + 74)
        '75', // Airtel (254 + 75)
        '76', // Airtel (254 + 76)
        '77', // Airtel (254 + 77)
        '78', // Airtel (254 + 78)
        '68', // Telkom (254 + 68)
        '69', // Telkom (254 + 69)
    ];

    return validPrefixes.includes(prefix);
}

/**
 * Format a phone number for display (Kenyan format)
 * @param phoneNumber Phone number in any valid format
 * @returns Formatted phone number (e.g., "0712 345 678")
 */
export function formatPhoneNumber(phoneNumber: string): string {
    const validation = validateKenyanPhoneNumber(phoneNumber);
    if (!validation.isValid) {
        return phoneNumber;
    }

    // Convert to 07 format for display
    const normalized = validation.normalizedNumber;
    const withoutCountry = '0' + normalized.substring(3);

    // Format as 07XX XXX XXX
    return (
        withoutCountry.substring(0, 4) +
        ' ' +
        withoutCountry.substring(4, 7) +
        ' ' +
        withoutCountry.substring(7)
    );
}

/**
 * Get the network operator name from phone number
 */
export function getOperatorName(phoneNumber: string): string {
    const validation = validateKenyanPhoneNumber(phoneNumber);
    if (!validation.isValid) {
        return 'Unknown';
    }

    const normalized = validation.normalizedNumber;
    const operator = normalized.substring(3, 5);

    const operatorMap: Record<string, string> = {
        '71': 'Safaricom',
        '72': 'Safaricom',
        '73': 'Airtel',
        '74': 'Airtel',
        '75': 'Airtel',
        '76': 'Airtel',
        '77': 'Airtel',
        '78': 'Airtel',
        '68': 'Telkom',
        '69': 'Telkom',
        '07': 'Unknown (07)',
        '01': 'Unknown (01)',
    };

    return operatorMap[operator] || 'Unknown';
}
