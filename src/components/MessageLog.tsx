import { useEffect, useState } from 'react';
import { WaterQualityReading, isValueSafe } from '../types';
import { supabase } from '../lib/supabase';
import { AlertTriangle } from 'lucide-react';
import { useSafeRanges } from '../hooks/useSafeRanges';

interface MessageLogProps {
  latestReading: WaterQualityReading | null;
}

export function MessageLog({ latestReading }: MessageLogProps) {
  const [readings, setReadings] = useState<WaterQualityReading[]>([]);
  const { safeRanges } = useSafeRanges();

  useEffect(() => {
    fetchRecentReadings();
  }, []);

  useEffect(() => {
    if (latestReading) {
      setReadings((prev) => {
        const updated = [latestReading, ...prev];
        return updated.slice(0, 20);
      });
    }
  }, [latestReading]);

  async function fetchRecentReadings() {
    const { data, error } = await supabase
      .from('water_quality_readings')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20);

    if (data && !error) {
      setReadings(data);
    }
  }

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function hasAlert(reading: WaterQualityReading): boolean {
    return (
      !isValueSafe(reading.temperature, safeRanges.temperature) ||
      !isValueSafe(reading.ph, safeRanges.ph) ||
      !isValueSafe(reading.turbidity, safeRanges.turbidity)
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Messages</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-semibold text-gray-700">Time</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Msg #</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Temp (°C)</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">pH</th>
              <th className="text-right py-3 px-2 font-semibold text-gray-700">Turbidity (NTU)</th>
              <th className="text-center py-3 px-2 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {readings.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  No messages received yet
                </td>
              </tr>
            ) : (
              readings.map((reading, index) => {
                const alert = hasAlert(reading);
                return (
                  <tr
                    key={reading.id || index}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      alert ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="py-3 px-2 text-gray-600">
                      {formatTimestamp(reading.timestamp)}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-600 font-mono">
                      {reading.message_number}
                    </td>
                    <td
                      className={`py-3 px-2 text-right font-mono ${
                        !isValueSafe(reading.temperature, safeRanges.temperature)
                          ? 'text-red-600 font-semibold'
                          : 'text-gray-900'
                      }`}
                    >
                      {reading.temperature.toFixed(1)}
                    </td>
                    <td
                      className={`py-3 px-2 text-right font-mono ${
                        !isValueSafe(reading.ph, safeRanges.ph)
                          ? 'text-red-600 font-semibold'
                          : 'text-gray-900'
                      }`}
                    >
                      {reading.ph.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-2 text-right font-mono ${
                        !isValueSafe(reading.turbidity, safeRanges.turbidity)
                          ? 'text-red-600 font-semibold'
                          : 'text-gray-900'
                      }`}
                    >
                      {reading.turbidity.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {alert ? (
                        <div className="flex items-center justify-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-xs text-red-600 font-medium">Alert</span>
                        </div>
                      ) : (
                        <span className="text-xs text-green-600 font-medium">OK</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
