'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [devices, setDevices] = useState<any[]>([]);
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
        throw new Error(`HTTP chyba: ${res.status}`);
      }
      const json = await res.json();
      if (json.error) {
        setErrorMsg(`Chyba: ${json.error}`);
      } else if (Array.isArray(json.result)) {
        setErrorMsg('');
        setDevices(json.result);
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

  // Pomocná funkce pro vyhledání zařízení podle klíčových slov v názvu
  const findDevice = (keywords: string[]) => {
    return devices.find((d) => {
      const name = (d.name || '').toLowerCase();
      return keywords.some((kw) => name.includes(kw));
    });
  };

  const livingRoom = findDevice(['obývák', 'obyvak', 'obývací']);
  const outdoor = findDevice(['venku', 'venkovní', 'venkovni']);
  const workshop = findDevice(['dílna', 'dilna']);

  const formatTemp = (dev: any) => {
    if (!dev || dev.temperature === null || dev.temperature === undefined) return '--';
    return dev.temperature;
  };

  const formatHum = (dev: any) => {
    if (!dev || dev.humidity === null || dev.humidity === undefined) return '--';
    return dev.humidity;
  };

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
          {formatTemp(livingRoom)} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '16px' }}>
          Vlhkost: <strong style={{ color: '#ffffff' }}>{formatHum(livingRoom)} %</strong>
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
          {formatTemp(outdoor)} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '16px' }}>
          Vlhkost: <strong style={{ color: '#ffffff' }}>{formatHum(outdoor)} %</strong>
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
          {formatTemp(workshop)} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '16px' }}>
          Vlhkost: <strong style={{ color: '#ffffff' }}>{formatHum(workshop)} %</strong>
        </div>
      </div>
    </div>
  );
}
