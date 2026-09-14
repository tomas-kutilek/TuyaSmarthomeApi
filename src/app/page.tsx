'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('Načítám data...');
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  // Hodiny a datum
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('cs-CZ', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      const dateFormatted = now.toLocaleDateString('cs-CZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      setDateStr(dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1));
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Načítání dat z Tuya API
  async function fetchData() {
    try {
      const res = await fetch('/api/tuya');
      if (!res.ok) {
        throw new Error(`HTTP chyba: ${res.status} ${res.statusText}`);
      }
      const json = await res.json();
      if (json.error) {
        setErrorMsg(`API Error: ${json.error}`);
      } else {
        setErrorMsg('');
        setData(json);
      }
    } catch (err: any) {
      setErrorMsg(`Chyba síti/API: ${err.message || err}`);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Pomocné funkce pro extrakci teploty a vlhkosti z jakékoliv hloubky
  const extractVal = (obj: any, keys: string[]) => {
    if (!obj) return '--';
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    // Prohledání status pole, pokud Tuya vrací [{code: 'va_temperature', value: 215}]
    if (Array.isArray(obj.status)) {
      const item = obj.status.find((s: any) => keys.includes(s.code));
      if (item) {
        // Tuya často posílá teplotu 215 = 21.5 °C
        return typeof item.value === 'number' && item.value > 100 && keys.includes('va_temperature')
          ? (item.value / 10).toFixed(1)
          : item.value;
      }
    }
    return '--';
  };

  const getSensorData = (keyName: string) => {
    if (!data) return null;
    return data[keyName] || data.devices?.[keyName] || data.sensors?.[keyName] || null;
  };

  const livingRoom = getSensorData('livingRoom') || getSensorData('living_room') || getSensorData('obyvak');
  const outdoor = getSensorData('outdoor') || getSensorData('venku');
  const workshop = getSensorData('workshop') || getSensorData('dilna');

  const keysToSearchTemp = ['temp', 'temperature', 'va_temperature', 'temp_current'];
  const keysToSearchHum = ['humidity', 'hum', 'va_humidity', 'humidity_value'];

  return (
    <div
      style={{
        backgroundColor: '#000000',
        color: '#ffffff',
        height: '100vh',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Záhlaví s časem a datem */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px 0',
        }}
      >
        <div style={{ fontSize: '36px', fontWeight: '900', lineHeight: '1' }}>
          {timeStr || '--:--'}
        </div>
        <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '2px' }}>
          {dateStr}
        </div>
        {/* Status / Chyba */}
        {errorMsg && (
          <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: 'bold' }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Obývák */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#18181b',
          borderRadius: '16px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #27272a',
        }}
      >
        <div style={{ color: '#a1a1aa', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
          Obývák
        </div>
        <div style={{ fontSize: '58px', fontWeight: '900', margin: '2px 0' }}>
          {extractVal(livingRoom, keysToSearchTemp)} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '16px' }}>
          Vlhkost: <strong style={{ color: '#ffffff' }}>{extractVal(livingRoom, keysToSearchHum)} %</strong>
        </div>
      </div>

      {/* Venku */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#18181b',
          borderRadius: '16px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #27272a',
        }}
      >
        <div style={{ color: '#a1a1aa', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
          Venku
        </div>
        <div style={{ fontSize: '58px', fontWeight: '900', margin: '2px 0' }}>
          {extractVal(outdoor, keysToSearchTemp)} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '16px' }}>
          Vlhkost: <strong style={{ color: '#ffffff' }}>{extractVal(outdoor, keysToSearchHum)} %</strong>
        </div>
      </div>

      {/* Dílna */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#18181b',
          borderRadius: '16px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #27272a',
        }}
      >
        <div style={{ color: '#a1a1aa', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
          Dílna
        </div>
        <div style={{ fontSize: '58px', fontWeight: '900', margin: '2px 0' }}>
          {extractVal(workshop, keysToSearchTemp)} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '16px' }}>
          Vlhkost: <strong style={{ color: '#ffffff' }}>{extractVal(workshop, keysToSearchHum)} %</strong>
        </div>
      </div>

      {/* Debug zobrazení přijatého JSONu na spodku displeje */}
      {data && (
        <div style={{ fontSize: '10px', color: '#71717a', maxHeight: '40px', overflow: 'hidden', opacity: 0.6 }}>
          JSON: {JSON.stringify(data)}
        </div>
      )}
    </div>
  );
}
