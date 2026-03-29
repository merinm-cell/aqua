import { useEffect, useState } from 'react';
import { WaterQualityReading } from '../types';
import { supabase } from '../lib/supabase';

interface LineChartProps {
  latestReading: WaterQualityReading | null;
}

export function LineChart({ latestReading }: LineChartProps) {
  const [readings, setReadings] = useState<WaterQualityReading[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'temperature' | 'ph' | 'turbidity'>('temperature');

  useEffect(() => {
    fetchRecentReadings();
    const interval = setInterval(fetchRecentReadings, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (latestReading) {
      setReadings((prev) => {
        const updated = [...prev, latestReading];
        return updated.slice(-50);
      });
    }
  }, [latestReading]);

  async function fetchRecentReadings() {
    const { data, error } = await supabase
      .from('water_quality_readings')
      .select('*')
      .order('timestamp', { ascending: true })
      .limit(50);

    if (data && !error) {
      setReadings(data);
    }
  }

  if (readings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Trend Chart</h2>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Waiting for data...
        </div>
      </div>
    );
  }

  const width = 800;
  const height = 300;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const values = readings.map((r) => r[selectedMetric]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  const points = readings.map((reading, index) => {
    const x = padding + (index / (readings.length - 1 || 1)) * chartWidth;
    const y = padding + chartHeight - ((reading[selectedMetric] - minValue) / valueRange) * chartHeight;
    return { x, y, value: reading[selectedMetric] };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const metricLabels = {
    temperature: { label: 'Temperature', unit: '°C', color: '#3b82f6' },
    ph: { label: 'pH Level', unit: '', color: '#10b981' },
    turbidity: { label: 'Turbidity', unit: 'NTU', color: '#f59e0b' },
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Trend Chart</h2>
        <div className="flex gap-2">
          {Object.entries(metricLabels).map(([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => setSelectedMetric(key as typeof selectedMetric)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedMetric === key
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={
                selectedMetric === key
                  ? { backgroundColor: color }
                  : {}
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ maxHeight: '300px' }}
        >
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={metricLabels[selectedMetric].color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={metricLabels[selectedMetric].color} stopOpacity="0" />
            </linearGradient>
          </defs>

          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#e5e7eb"
            strokeWidth="2"
          />

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + chartHeight - ratio * chartHeight;
            const value = (minValue + ratio * valueRange).toFixed(1);
            return (
              <g key={ratio}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
                <text
                  x={padding - 10}
                  y={y}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  className="text-xs fill-gray-500"
                >
                  {value}
                </text>
              </g>
            );
          })}

          <path
            d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`}
            fill="url(#lineGradient)"
          />

          <path
            d={pathData}
            fill="none"
            stroke={metricLabels[selectedMetric].color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="white"
              stroke={metricLabels[selectedMetric].color}
              strokeWidth="2"
            />
          ))}

          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            Recent Readings ({readings.length} points)
          </text>
        </svg>
      </div>
    </div>
  );
}
