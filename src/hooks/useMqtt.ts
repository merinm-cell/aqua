import { useEffect, useState, useCallback } from 'react';
import mqtt from 'mqtt';
import { WaterQualityReading } from '../types';
import { supabase } from '../lib/supabase';

interface UseMqttReturn {
  isConnected: boolean;
  latestReading: WaterQualityReading | null;
  error: string | null;
}

export function useMqtt(): UseMqttReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [latestReading, setLatestReading] = useState<WaterQualityReading | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveToDatabase = useCallback(async (reading: WaterQualityReading) => {
    try {
      const { error: insertError } = await supabase
        .from('water_quality_readings')
        .insert([reading]);

      if (insertError) {
        console.error('DB error:', insertError);
      }
    } catch (err) {
      console.error('DB failure:', err);
    }
  }, []);

  useEffect(() => {
    const brokerUrl = import.meta.env.VITE_MQTT_BROKER_URL;
    const username = import.meta.env.VITE_MQTT_USERNAME;
    const password = import.meta.env.VITE_MQTT_PASSWORD;
    const topic = import.meta.env.VITE_MQTT_TOPIC;

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
          console.log(`📡 Subscribed to ${topic}`);
        }
      });
    });

    client.on('message', (topic, message) => {
      const raw = message.toString();
      console.log("📥 RAW:", raw);

      try {
        // ✅ Try JSON first (in case ESP gets fixed later)
        const payload = JSON.parse(raw);

        const reading: WaterQualityReading = {
          temperature: payload.temperature ?? payload.temp ?? 0,
          ph: payload.ph ?? payload.pH ?? 0,
          turbidity: payload.turbidity ?? payload.turb ?? 0,
          message_number: payload.msg_num ?? payload.message_number ?? 0,
          timestamp: payload.timestamp || new Date().toISOString(),
        };

        console.log("✅ Parsed JSON:", reading);
        setLatestReading(reading);
        saveToDatabase(reading);

      } catch {
        console.warn("⚠️ Not JSON, parsing custom ESP format...");

        try {
          // 🔥 CUSTOM FORMAT: H-30.4,P-0.0,T-41.18
          const parts = raw.split(",");

          let temperature = 0;
          let ph = 0;
          let turbidity = 0;

          parts.forEach(part => {
            if (part.startsWith("H-")) {
              temperature = parseFloat(part.replace("H-", ""));
            }
            if (part.startsWith("P-")) {
              ph = parseFloat(part.replace("P-", ""));
            }
            if (part.startsWith("T-")) {
              turbidity = parseFloat(part.replace("T-", ""));
            }
          });

          const reading: WaterQualityReading = {
            temperature,
            ph,
            turbidity,
            message_number: 0,
            timestamp: new Date().toISOString(),
          };

          console.log("✅ Parsed CUSTOM:", reading);

          setLatestReading(reading);
          saveToDatabase(reading);

        } catch (e) {
          console.error("❌ Failed to parse:", raw);
          setError("Unsupported data format");
        }
      }
    });

    client.on('error', (err) => {
      console.error('MQTT error:', err);
      setError(err.message);
      setIsConnected(false);
    });

    client.on('offline', () => {
      console.log('🔴 Offline');
      setIsConnected(false);
    });

    client.on('reconnect', () => {
      console.log('🔄 Reconnecting...');
      setError('Reconnecting...');
    });

    return () => {
      client.end();
    };
  }, [saveToDatabase]);

  return { isConnected, latestReading, error };
}