import { ArrowLeft, Thermometer, Droplet, Activity, AlertCircle, Loader } from 'lucide-react';
import { useSafeRanges } from '../hooks/useSafeRanges';
import { AlertSettingsForm } from '../components/AlertSettingsForm';

interface AlertSettingsPageProps {
  onBack: () => void;
}

export function AlertSettingsPage({ onBack }: AlertSettingsPageProps) {
  const { safeRanges, loading, error, updateSafeRange } = useSafeRanges();

  const metrics = [
    {
      key: 'temperature',
      label: 'Temperature',
      unit: '°C',
      icon: <Thermometer className="w-6 h-6 text-blue-600" />,
      description: 'Set the safe temperature range for water quality monitoring',
    },
    {
      key: 'ph',
      label: 'pH Level',
      unit: '',
      icon: <Droplet className="w-6 h-6 text-green-600" />,
      description: 'Configure the acceptable pH level range (0-14 scale)',
    },
    {
      key: 'turbidity',
      label: 'Turbidity',
      unit: 'NTU',
      icon: <Activity className="w-6 h-6 text-amber-600" />,
      description: 'Define turbidity limits measured in Nephelometric Turbidity Units',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading alert settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Alert Settings</h1>
              <p className="text-sm text-gray-600">Customize safe ranges for water quality metrics</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error Loading Settings</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">How it works</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Define the minimum and maximum values for each metric. When sensor readings fall outside these ranges,
                  an alert will be displayed on the dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {metrics.map((metric) => (
              <AlertSettingsForm
                key={metric.key}
                metricName={metric.key}
                label={metric.label}
                unit={metric.unit}
                minValue={safeRanges[metric.key]?.min || 0}
                maxValue={safeRanges[metric.key]?.max || 100}
                icon={metric.icon}
                description={metric.description}
                onSave={(min, max) => updateSafeRange(metric.key, min, max)}
              />
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Alert settings are stored in the cloud and applied across all devices
          </p>
        </div>
      </footer>
    </div>
  );
}
