import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { getUnitDisplay, getUnitOptions } from '@/lib/units';

interface QuantitySelectorProps {
  quantity: number;
  productName?: string;
  maxStock?: number;
  onQuantityChange: (quantity: number) => void;
  onRemove?: () => void;
  showUnitSelector?: boolean;
  allowBulkPricing?: boolean;
  currentPrice?: number;
  onPriceChange?: (price: number) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const QuantitySelector = ({
  quantity,
  productName,
  maxStock,
  onQuantityChange,
  onRemove,
  showUnitSelector = false,
  allowBulkPricing = false,
  currentPrice,
  onPriceChange,
  onKeyDown
}: QuantitySelectorProps) => {
  const [selectedUnit, setSelectedUnit] = useState('pcs');
  const [unitQuantity, setUnitQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<string>('');

  const unitOptions = getUnitOptions(productName);
  const unitDisplay = getUnitDisplay(quantity, productName);
  const canEditPrice = allowBulkPricing && quantity >= 12;

  useEffect(() => {
    if (currentPrice && canEditPrice) {
      setCustomPrice(currentPrice.toString());
    }
  }, [currentPrice, canEditPrice]);

  const handleUnitQuantityChange = (value: number) => {
    setUnitQuantity(value);
    const selectedUnitData = unitOptions.find(opt => opt.value === selectedUnit);
    const totalQuantity = value * (selectedUnitData?.multiplier || 1);
    onQuantityChange(totalQuantity);
  };

  const handleUnitChange = (unit: string) => {
    setSelectedUnit(unit);
    const selectedUnitData = unitOptions.find(opt => opt.value === unit);
    const totalQuantity = unitQuantity * (selectedUnitData?.multiplier || 1);
    onQuantityChange(totalQuantity);
  };

  const handlePriceChange = (value: string) => {
    setCustomPrice(value);
    const price = parseFloat(value);
    if (!isNaN(price) && onPriceChange) {
      onPriceChange(price);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  return (
    <div className="space-y-3 quantity-selector">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onQuantityChange(Math.max(0, quantity - 1))}
          disabled={quantity <= 0}
        >
          <Minus className="h-3 w-3" />
        </Button>
        
        <Input
          type="number"
          value={quantity || ''}
          onChange={(e) => onQuantityChange(parseInt(e.target.value) || 0)}
          onKeyDown={handleKeyDown}
          className="h-8 w-20 text-center text-sm"
          min="0"
          max={maxStock}
          placeholder="0"
        />
        
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onQuantityChange(quantity + 1)}
          disabled={maxStock !== undefined && quantity >= maxStock}
        >
          <Plus className="h-3 w-3" />
        </Button>

        {onRemove && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 ml-2 text-error hover:bg-error hover:text-error-foreground"
            onClick={onRemove}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {showUnitSelector && (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={unitQuantity}
            onChange={(e) => handleUnitQuantityChange(parseInt(e.target.value) || 1)}
            className="h-8 w-16 text-center text-sm"
            min="1"
          />
          <Select value={selectedUnit} onValueChange={handleUnitChange}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {unitOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Display unit conversions */}
      {unitDisplay.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {unitDisplay.slice(1).map((conversion, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {conversion.display}
            </Badge>
          ))}
        </div>
      )}

      {/* Bulk pricing editor */}
      {canEditPrice && onPriceChange && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">
            Harga khusus (≥1 lusin):
          </Label>
          <Input
            type="number"
            value={customPrice}
            onChange={(e) => handlePriceChange(e.target.value)}
            className="h-8 text-sm"
            placeholder="Harga per unit"
            min="0"
          />
        </div>
      )}
    </div>
  );
};