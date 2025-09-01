// Unit conversion utilities
export interface UnitConversion {
  unit: string;
  quantity: number;
  display: string;
}

export const getUnitDisplay = (quantity: number, productName?: string, category?: string): UnitConversion[] => {
  const conversions: UnitConversion[] = [];
  
  // For paper category, use rim as base unit
  if (category === 'Kertas') {
    conversions.push({
      unit: 'rim',
      quantity,
      display: `${quantity} rim (${quantity * 500} lembar)`
    });

    // Karton conversion for paper (5 rim = 1 karton)
    if (quantity >= 5) {
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
  } else {
    // Always show the base quantity for non-paper items
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
  }

  return conversions;
};

export const getUnitMultiplier = (unit: string, category?: string): number => {
  switch (unit) {
    case 'lusin':
      return 12;
    case 'kodi':
      return 20;
    case 'gros':
      return 144;
    case 'karton':
      return category === 'Kertas' ? 5 : 1; // For paper, 5 rim = 1 karton
    case 'rim':
      return 1; // Base unit for paper
    default:
      return 1;
  }
};

export const getUnitOptions = (productName?: string, category?: string) => {
  // For paper category, only show rim and karton
  if (category === 'Kertas') {
    return [
      { value: 'rim', label: 'Rim (500 lembar)', multiplier: 1 },
      { value: 'karton', label: 'Karton (5 rim)', multiplier: 5 }
    ];
  }

  // Standard units for other products
  return [
    { value: 'pcs', label: 'Pcs', multiplier: 1 },
    { value: 'lusin', label: 'Lusin (12 pcs)', multiplier: 12 },
    { value: 'kodi', label: 'Kodi (20 pcs)', multiplier: 20 },
    { value: 'gros', label: 'Gros (144 pcs)', multiplier: 144 }
  ];
};