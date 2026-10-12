export function generateProductSku(
    name: string,
    storeSlug: string,
    quantityText: string
): string {
    const cleanName = name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_');

    const cleanLocation = storeSlug
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_');

    const cleanQuantity = quantityText
        ? quantityText
              .trim()
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, '_')
              .replace(/_+/g, '_')
        : '';

    if (!cleanName || !cleanLocation) return '';

    // Includes quantity in the SKU if provided (e.g., NAIVAS_SWEETCORN_1KG_FARM_FRESH)
    return cleanQuantity
        ? `${cleanLocation}_${cleanName}_${cleanQuantity}`
        : `${cleanLocation}_${cleanName}`;
}
export const capitalizeName = (name: string | undefined) => {
    if (!name) return;
    return name
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
