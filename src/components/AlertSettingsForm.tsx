import { useState } from 'react';
import { AlertTriangle, Check, X, AlertCircle } from 'lucide-react';

interface AlertSettingsFormProps {
  metricName: string;
  label: string;
  unit: string;
  minValue: number;
  maxValue: number;
  onSave: (min: number, max: number) => Promise<boolean>;
  icon: React.ReactNode;
  description: string;
}

export function AlertSettingsForm({
  metricName,
  label,
  unit,
  minValue,
  maxValue,
  onSave,
  icon,
  description,
}: AlertSettingsFormProps) {
  const [editMin, setEditMin] = useState(minValue);
  const [editMax, setEditMax] = useState(maxValue);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const hasChanges = editMin !== minValue || editMax !== maxValue;
  const isValid = editMin < editMax;

  const handleSave = async () => {
    if (!isValid) {
      setMessage({ type: 'error', text: 'Minimum must be less than maximum' });
      return;
    }

    setIsSaving(true);
    const success = await onSave(editMin, editMax);

    if (success) {
      setMessage({ type: 'success', text: 'Settings saved successfully' });
      setIsEditing(false);
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: 'Failed to save settings' });
      setTimeout(() => setMessage(null), 3000);
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    setEditMin(minValue);
    setEditMax(maxValue);
    setIsEditing(false);
    setMessage(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">{icon}</div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {isEditing ? 'View' : 'Edit'}
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">{description}</p>

          {!isEditing ? (
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Minimum Safe Value
                </label>
                <p className="text-2xl font-bold text-gray-900">
                  {minValue}
                  <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Maximum Safe Value
                </label>
                <p className="text-2xl font-bold text-gray-900">
                  {maxValue}
                  <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum {unit ? `(${unit})` : ''}
                  </label>
                  <input
                    type="number"
                    value={editMin}
                    onChange={(e) => setEditMin(parseFloat(e.target.value) || 0)}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum {unit ? `(${unit})` : ''}
                  </label>
                  <input
                    type="number"
                    value={editMax}
                    onChange={(e) => setEditMax(parseFloat(e.target.value) || 0)}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {!isValid && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-700">Minimum must be less than maximum</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || !isValid || isSaving}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </>
          )}

          {message && (
            <div
              className={`mt-3 flex items-center gap-2 p-3 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <>
                  <Check className={`w-4 h-4 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                  <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                    {message.text}
                  </p>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <p className="text-sm font-medium text-red-700">{message.text}</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
