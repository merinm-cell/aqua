import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface SafeRange {
  metric_name: string;
  min_value: number;
  max_value: number;
  id?: string;
}

export interface SafeRangesState {
  [key: string]: { min: number; max: number };
}

export function useSafeRanges() {
  const [safeRanges, setSafeRanges] = useState<SafeRangesState>({
    temperature: { min: 0, max: 30 },
    ph: { min: 6.5, max: 8.5 },
    turbidity: { min: 0, max: 5 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSafeRanges();
    const channel = supabase
      .channel('alert_settings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alert_settings' }, () => {
        fetchSafeRanges();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchSafeRanges() {
    try {
      const { data, error: fetchError } = await supabase
        .from('alert_settings')
        .select('*');

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      if (data) {
        const ranges: SafeRangesState = {};
        data.forEach((item) => {
          ranges[item.metric_name] = {
            min: item.min_value,
            max: item.max_value,
          };
        });
        setSafeRanges(ranges);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch safe ranges');
    } finally {
      setLoading(false);
    }
  }

  async function updateSafeRange(metricName: string, minValue: number, maxValue: number) {
    try {
      const { error: updateError } = await supabase
        .from('alert_settings')
        .update({ min_value: minValue, max_value: maxValue, updated_at: new Date().toISOString() })
        .eq('metric_name', metricName);

      if (updateError) {
        setError(updateError.message);
        return false;
      }

      setSafeRanges((prev) => ({
        ...prev,
        [metricName]: { min: minValue, max: maxValue },
      }));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update safe range');
      return false;
    }
  }

  return { safeRanges, loading, error, updateSafeRange };
}
