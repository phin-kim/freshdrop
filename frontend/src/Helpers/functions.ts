/**
 * Generates a standardized SKU string for FreshDrop products based on name and category.
 * E.g., "Red Onions" & "Vegetables" -> "JUJA_MKT_RED_ONIONS_VEGETABLES"
 */
export function generateProductSku(name: string, category: string): string {
    const cleanName = name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_');

    const cleanCategory = category.toUpperCase();

    return cleanName ? `JUJA_MKT_${cleanName}_${cleanCategory}` : '';
}
export const capitalizeName = (name: string | undefined) => {
    if (!name) return;
    return name
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
