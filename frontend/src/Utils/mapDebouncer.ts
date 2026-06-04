/**
 * A strictly-typed debounce utility that avoids the 'any' type.
 * @param func The function to debounce.
 * @param delay The delay in milliseconds.
 * @returns A debounced version of the provided function.
 */
function debounce<Args extends unknown[]>(
    func: (...args: Args) => void,
    delay: number
): (...args: Args) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Args): void => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
}

export default debounce;
