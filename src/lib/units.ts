// Unit conversion utilities
export interface UnitConversion {
  unit: string;
  quantity: number;
  display: string;
}

export const getUnitDisplay = (quantity: number, productName?: string): UnitConversion[] => {
  const conversions: UnitConversion[] = [];
  
  // Always show the base quantity
  conversions.push({
    unit: 'pcs',
    quantity,
    display: `${quantity} pcs`
  });

  // Standard conversions
  if (quantity >= 12) {
    const dozens = Math.floor(quantity / 12);
    const remainder = quantity % 12;
    if (dozens >= 1) {
      conversions.push({
        unit: 'lusin',
        quantity: dozens,
        display: remainder > 0 ? `${dozens} lusin + ${remainder} pcs` : `${dozens} lusin`
      });
    }
  }

  if (quantity >= 20) {
    const kodi = Math.floor(quantity / 20);
    const remainder = quantity % 20;
    if (kodi >= 1) {
      conversions.push({
        unit: 'kodi',
        quantity: kodi,
        display: remainder > 0 ? `${kodi} kodi + ${remainder} pcs` : `${kodi} kodi`
      });
    }
  }

  if (quantity >= 144) {
    const gross = Math.floor(quantity / 144);
    const remainder = quantity % 144;
    if (gross >= 1) {
      conversions.push({
        unit: 'gros',
        quantity: gross,
        display: remainder > 0 ? `${gross} gros + ${remainder} pcs` : `${gross} gros`
      });
    }
  }

  // Special conversion for HVS paper (5 rim = 5 karton)
  if (productName?.toLowerCase().includes('hvs') && quantity >= 5) {
    const karton = Math.floor(quantity / 5);
    const remainder = quantity % 5;
    if (karton >= 1) {
      conversions.push({
        unit: 'karton',
        quantity: karton,
        display: remainder > 0 ? `${karton} karton + ${remainder} rim` : `${karton} karton`
      });
    }
  }

  return conversions;
};

export const getUnitMultiplier = (unit: string): number => {
  switch (unit) {
    case 'lusin':
      return 12;
    case 'kodi':
      return 20;
    case 'gros':
      return 144;
    case 'karton':
      return 5; // For HVS paper
    default:
      return 1;
  }
};

export const getUnitOptions = (productName?: string) => {
  const options = [
    { value: 'pcs', label: 'Pcs', multiplier: 1 },
    { value: 'lusin', label: 'Lusin (12 pcs)', multiplier: 12 },
    { value: 'kodi', label: 'Kodi (20 pcs)', multiplier: 20 },
    { value: 'gros', label: 'Gros (144 pcs)', multiplier: 144 }
  ];

  // Add karton option for HVS
  if (productName?.toLowerCase().includes('hvs')) {
    options.push({ value: 'karton', label: 'Karton (5 rim)', multiplier: 5 });
  }

  return options;
};