import { prisma } from '../Config/DB';

async function createMockSupplier() {
    try {
        const mockSupplier = await prisma.supplier.upsert({
            where: { name: 'Juja market' },
            update: {}, // If it already exists, do nothing
            create: {
                name: 'Juja market',
                phone: '+254700000000',
                // Pinned near JKUAT / Juja Stage area for realistic distance math
                latitude: -1.1011262058791185,
                longitude: 37.01565883613961,
                isActive: true,
            },
        });
        console.log('✅ Mock Supplier Ready:', mockSupplier);
        console.log(
            `👉 Copy this ID for your frontend test payload: ${mockSupplier.id}`
        );
    } catch (error) {
        console.error('❌ Error creating mock supplier:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createMockSupplier();
