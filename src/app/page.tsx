'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
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

  // Načítání dat z /api/devices
  async function fetchData() {
    try {
      const res = await fetch('/api/devices');
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
      setErrorMsg(`Chyba API: ${err.message || err}`);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Pomocné funkce pro vytažení hodnot
  const extractVal = (obj: any, keys: string[]) => {
    if (!obj) return '--';
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    if (Array.isArray(obj.status)) {
      const item = obj.status.find((s: any) => keys.includes(s.code));
      if (item) {
        return typeof item.value === 'number' && item.value > 100 && keys.includes('va_temperature')
          ? (item.value / 10).toFixed(1)
          : item.value;
      }
    }
    return '--';
  };

  const getSensorData = (keyName: string) => {
    if (!data) return null;
    if (Array.isArray(data)) {
      return data.find((d: any) => d.name?.toLowerCase().includes(keyName) || d.id === keyName) || null;
    }
    return data[keyName] || data.devices?.[keyName] || data.sensors?.[keyName] || null;
  };

  const livingRoom = getSensorData('livingRoom') || getSensorData('living_room') || getSensorData('obyvak') || getSensorData('obýváku');
  const outdoor = getSensorData('outdoor') || getSensorData('venku') || getSensorData('venkovni');
  const workshop = getSensorData('workshop') || getSensorData('dilna') || getSensorData('dílna');

  const tempKeys = ['temp', 'temperature', 'va_temperature', 'temp_current'];
  const humKeys = ['humidity', 'hum', 'va_humidity', 'humidity_value'];

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
        <div style={{ fontSize: '38px', fontWeight: '900', lineHeight: '1' }}>
          {timeStr || '--:--'}
        </div>
        <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '2px' }}>
          {dateStr}
        </div>
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
          {extractVal(livingRoom, tempKeys)} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '16px' }}>
          Vlhkost: <strong style={{ color: '#ffffff' }}>{extractVal(livingRoom, humKeys)} %</strong>
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
          {extractVal(outdoor, tempKeys)} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '16px' }}>
          Vlhkost: <strong style={{ color: '#ffffff' }}>{extractVal(outdoor, humKeys)} %</strong>
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
          {extractVal(workshop, tempKeys)} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '16px' }}>
          Vlhkost: <strong style={{ color: '#ffffff' }}>{extractVal(workshop, humKeys)} %</strong>
        </div>
      </div>
    </div>
  );
}
