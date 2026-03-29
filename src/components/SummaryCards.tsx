import { Thermometer, Droplet, Activity, Hash } from 'lucide-react';
import { WaterQualityReading, SAFE_RANGES, isValueSafe } from '../types';

interface SummaryCardsProps {
  reading: WaterQualityReading | null;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  isAlert: boolean;
  range?: string;
}

function MetricCard({ icon, label, value, unit, isAlert, range }: MetricCardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 border-l-4 transition-all ${
        isAlert
          ? 'border-red-500 bg-red-50'
          : 'border-blue-500 hover:shadow-lg'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-lg ${
              isAlert ? 'bg-red-100' : 'bg-blue-100'
            }`}
          >
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p
              className={`text-2xl font-bold ${
                isAlert ? 'text-red-700' : 'text-gray-900'
              }`}
            >
              {value}
              <span className="text-sm font-normal text-gray-500 ml-1">
                {unit}
              </span>
            </p>
            {range && (
              <p className="text-xs text-gray-500 mt-1">Safe: {range}</p>
            )}
          </div>
        </div>
        {isAlert && (
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-red-600 font-medium mt-1">Alert</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function SummaryCards({ reading }: SummaryCardsProps) {
  if (!reading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-300 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                <div className="h-8 bg-gray-200 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const tempSafe = isValueSafe(reading.temperature, SAFE_RANGES.temperature);
  const phSafe = isValueSafe(reading.ph, SAFE_RANGES.ph);
  const turbiditySafe = isValueSafe(reading.turbidity, SAFE_RANGES.turbidity);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        icon={<Thermometer className={`w-6 h-6 ${tempSafe ? 'text-blue-600' : 'text-red-600'}`} />}
        label="Temperature"
        value={reading.temperature.toFixed(1)}
        unit="°C"
        isAlert={!tempSafe}
        range={`${SAFE_RANGES.temperature.min}-${SAFE_RANGES.temperature.max}°C`}
      />
      <MetricCard
        icon={<Droplet className={`w-6 h-6 ${phSafe ? 'text-blue-600' : 'text-red-600'}`} />}
        label="pH Level"
        value={reading.ph.toFixed(2)}
        unit=""
        isAlert={!phSafe}
        range={`${SAFE_RANGES.ph.min}-${SAFE_RANGES.ph.max}`}
      />
      <MetricCard
        icon={<Activity className={`w-6 h-6 ${turbiditySafe ? 'text-blue-600' : 'text-red-600'}`} />}
        label="Turbidity"
        value={reading.turbidity.toFixed(2)}
        unit="NTU"
        isAlert={!turbiditySafe}
        range={`${SAFE_RANGES.turbidity.min}-${SAFE_RANGES.turbidity.max} NTU`}
      />
      <MetricCard
        icon={<Hash className="w-6 h-6 text-blue-600" />}
        label="Message Count"
        value={reading.message_number.toString()}
        unit=""
        isAlert={false}
      />
    </div>
  );
}
