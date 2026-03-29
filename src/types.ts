export interface WaterQualityReading {
  id?: string;
  temperature: number;
  ph: number;
  turbidity: number;
  message_number: number;
  timestamp: string;
  created_at?: string;
}

export interface WaterQualitySafeRanges {
  temperature: { min: number; max: number };
  ph: { min: number; max: number };
  turbidity: { min: number; max: number };
}

export const SAFE_RANGES: WaterQualitySafeRanges = {
  temperature: { min: 0, max: 30 },
  ph: { min: 6.5, max: 8.5 },
  turbidity: { min: 0, max: 5 },
};

export function isValueSafe(
  value: number,
  range: { min: number; max: number }
): boolean {
  return value >= range.min && value <= range.max;
}
