export class ThermalPrinter {
  // This is now deprecated - use HybridThermalPrinter instead
  
  async connect(): Promise<boolean> {
    console.warn('ThermalPrinter is deprecated. Use HybridThermalPrinter instead.');
    return false;
  }

  async print(text: string): Promise<boolean> {
    console.warn('ThermalPrinter is deprecated. Use HybridThermalPrinter instead.');
    return false;
  }

  async disconnect(): Promise<void> {
    console.warn('ThermalPrinter is deprecated. Use HybridThermalPrinter instead.');
  }

  isConnected(): boolean {
    return false;
  }
}

export const thermalPrinter = new ThermalPrinter();