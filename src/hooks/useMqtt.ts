import { useEffect, useState, useCallback, useRef } from 'react';
import mqtt from 'mqtt';
import { WaterQualityReading } from '../types';
import { supabase } from '../lib/supabase';

// How long (ms) before stale reading is cleared from UI if no new data arrives
const STALE_TIMEOUT_MS = 10000;

interface UseMqttReturn {
  isConnected: boolean;
  latestReading: WaterQualityReading | null;
  error: string | null;
  clearReading: () => void; // call this from a Reset button if needed
}

/**
 * Validates sensor readings — rejects physically impossible values.
 * This is the main "flush out bad values" guard.
 */
function isValidReading(reading: WaterQualityReading): boolean {
  if (isNaN(reading.temperature) || reading.temperature < -10 || reading.temperature > 85) {
    console.warn('🚫 Rejected: temperature out of range:', reading.temperature);
    return false;
  }
  if (isNaN(reading.ph) || reading.ph < 0 || reading.ph > 14) {
    console.warn('🚫 Rejected: pH out of range:', reading.ph);
    return false;
  }
  if (isNaN(reading.turbidity) || reading.turbidity < 0 || reading.turbidity > 100) {
    console.warn('🚫 Rejected: turbidity/humidity out of range:', reading.turbidity);
    return false;
  }
  return true;
}

/**
 * Parses the custom ESP format: H-30.4,P-7.2,T-41.18
 * H = Humidity    → turbidity field
 * P = pH          → ph field
 * T = Temperature → temperature field
 */
function parseEspFormat(raw: string): WaterQualityReading | null {
  try {
    const parts = raw.split(',');

    let temperature = NaN;
    let ph = NaN;
    let humidity = NaN;

    for (const part of parts) {
      const trimmed = part.trim();

      if (trimmed.startsWith('T-')) {
        temperature = parseFloat(trimmed.slice(2));
      } else if (trimmed.startsWith('P-')) {
        ph = parseFloat(trimmed.slice(2));
      } else if (trimmed.startsWith('H-')) {
        humidity = parseFloat(trimmed.slice(2));
      }
    }

    const reading: WaterQualityReading = {
      temperature,
      ph,
      turbidity: humidity,
      message_number: 0,
      timestamp: new Date().toISOString(),
    };

    // Validate before returning — bad sensor values get dropped here
    if (!isValidReading(reading)) return null;

    return reading;
  } catch {
    return null;
  }
}

/**
 * Parses a JSON payload from the MQTT broker.
 */
function parseJsonFormat(raw: string): WaterQualityReading | null {
  try {
    const payload = JSON.parse(raw);

    const reading: WaterQualityReading = {
      temperature: payload.temperature ?? payload.temp ?? NaN,
      ph: payload.ph ?? payload.pH ?? NaN,
      turbidity: payload.turbidity ?? payload.turb ?? payload.humidity ?? NaN,
      message_number: payload.msg_num ?? payload.message_number ?? 0,
      timestamp: payload.timestamp || new Date().toISOString(),
    };

    // Validate before returning — bad sensor values get dropped here
    if (!isValidReading(reading)) return null;

    return reading;
  } catch {
    return null;
  }
}

export function useMqtt(): UseMqttReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [latestReading, setLatestReading] = useState<WaterQualityReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const staleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Manually clear the displayed reading (e.g. from a Reset button in UI)
  const clearReading = useCallback(() => {
    setLatestReading(null);
    console.log('🧹 Reading manually cleared');
  }, []);

  // Resets the stale-data timer every time a valid reading comes in.
  // If no new reading arrives within STALE_TIMEOUT_MS, UI is cleared.
  const updateReading = useCallback((reading: WaterQualityReading) => {
    setLatestReading(reading);

    if (staleTimer.current) clearTimeout(staleTimer.current);

    staleTimer.current = setTimeout(() => {
      console.warn('⏱️ No new data received — clearing stale reading from UI');
      setLatestReading(null);
    }, STALE_TIMEOUT_MS);
  }, []);

  const saveToDatabase = useCallback(async (reading: WaterQualityReading) => {
    try {
      const { error: insertError } = await supabase
        .from('water_quality_readings')
        .insert([reading]);

      if (insertError) {
        console.error('❌ DB error:', insertError);
      } else {
        console.log('✅ Saved to DB:', reading);
      }
    } catch (err) {
      console.error('❌ DB failure:', err);
    }
  }, []);

  useEffect(() => {
    const brokerUrl = import.meta.env.VITE_MQTT_BROKER_URL;
    const username  = import.meta.env.VITE_MQTT_USERNAME;
    const password  = import.meta.env.VITE_MQTT_PASSWORD;
    const topic     = import.meta.env.VITE_MQTT_TOPIC;

    if (!brokerUrl || !username || !password || !topic) {
      setError('MQTT config missing in .env');
      return;
    }

    const client = mqtt.connect(brokerUrl, {
      username,
      password,
      protocol: 'wss',
      clientId: `water_dashboard_${Math.random().toString(16).slice(2, 10)}`,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
    });

    client.on('connect', () => {
      console.log('✅ Connected to MQTT broker');
      setIsConnected(true);
      setError(null);

      client.subscribe(topic, (err) => {
        if (err) {
          console.error('❌ Subscription error:', err);
          setError('Subscription failed');
        } else {
          console.log(`📡 Subscribed to topic: ${topic}`);
        }
      });
    });

    client.on('message', (_topic, message) => {
      const raw = message.toString().trim();
      console.log('📥 RAW:', raw);

      // 1️⃣ Try JSON first
      const jsonReading = parseJsonFormat(raw);
      if (jsonReading) {
        console.log('✅ Parsed JSON:', jsonReading);
        updateReading(jsonReading);
        saveToDatabase(jsonReading);
        return;
      }

      // 2️⃣ Fall back to custom ESP format (H-xx,P-xx,T-xx)
      console.warn('⚠️ Not JSON, trying custom ESP format...');
      const espReading = parseEspFormat(raw);
      if (espReading) {
        console.log('✅ Parsed ESP format:', espReading);
        updateReading(espReading);
        saveToDatabase(espReading);
        return;
      }

      // 3️⃣ Both parsers rejected the message (bad/out-of-range values)
      console.error('❌ Message rejected (bad data or unknown format):', raw);
    });

    client.on('error', (err) => {
      console.error('❌ MQTT error:', err);
      setError(err.message);
      setIsConnected(false);
    });

    client.on('offline', () => {
      console.log('🔴 MQTT offline');
      setIsConnected(false);
    });

    client.on('reconnect', () => {
      console.log('🔄 Reconnecting to MQTT...');
      setError('Reconnecting...');
    });

    client.on('close', () => {
      console.log('🔌 MQTT connection closed');
      setIsConnected(false);
    });

    return () => {
      client.end();
      if (staleTimer.current) clearTimeout(staleTimer.current);
    };
  }, [saveToDatabase, updateReading]);
  
  return { isConnected, latestReading, error, clearReading };
}
