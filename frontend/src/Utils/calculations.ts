
// Service Charge Calculator Rule:
// "each item ordered is 10 shillings but as the items increase we increase charging by 50%"
export const calculateServiceCharge = (totalQuantity: number): { total: number; steps: { quantity: number; charge: number }[] } => {
  if (totalQuantity <= 0) return { total: 0, steps: [] };
  
  let total = 0;
  let currentCharge = 10; // Base is 10 shillings for the first item
  const steps: { quantity: number; charge: number }[] = [];

  for (let i = 1; i <= totalQuantity; i++) {
    steps.push({ quantity: i, charge: Number(currentCharge.toFixed(2)) });
    total += currentCharge;
    currentCharge = currentCharge * 1.5; // compounding by 50% for successive items
  }

  return {
    total: Number(total.toFixed(2)),
    steps
  };
};
