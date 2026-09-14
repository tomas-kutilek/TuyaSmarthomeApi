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

  // Komponenta pro zobrazení jedné karty se snímačem
  const SensorCard = ({ title, dev }: { title: string; dev: any }) => {
    const isOnline = dev?.online ?? false;

    return (
      <div
        style={{
          flex: 1,
          backgroundColor: '#18181b',
          borderRadius: '20px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #27272a',
          position: 'relative',
        }}
      >
        {/* Indikátor stavu (online / offline) */}
        <div
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isOnline ? '#22c55e' : '#ef4444',
              boxShadow: isOnline ? '0 0 8px #22c55e' : '0 0 8px #ef4444',
            }}
          />
        </div>

        <div style={{ color: '#a1a1aa', fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {title}
        </div>
        <div style={{ fontSize: '64px', fontWeight: '900', margin: '4px 0', lineHeight: '1.1' }}>
          {formatTemp(dev)} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '18px' }}>
          Vlhkost: <strong style={{ color: '#ffffff' }}>{formatHum(dev)} %</strong>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        backgroundColor: '#000000',
        color: '#ffffff',
        height: '100vh',
        width: '100vw',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
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
        }}
      >
        <div style={{ fontSize: '42px', fontWeight: '900', lineHeight: '1' }}>
          {timeStr || '--:--'}
        </div>
        <div style={{ fontSize: '14px', color: '#a1a1aa', marginTop: '4px' }}>
          {dateStr}
        </div>
        {errorMsg && (
          <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: 'bold' }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Řada se 3 kartami vedle sebe (pro displej na šířku) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          width: '100%',
        }}
      >
        <SensorCard title="Obývák" dev={livingRoom} />
        <SensorCard title="Venku" dev={outdoor} />
        <SensorCard title="Dílna" dev={workshop} />
      </div>
    </div>
  );
}
