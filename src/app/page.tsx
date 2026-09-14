'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
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
      // První písmeno dne velké
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
      const json = await res.json();
      console.log('Tuya Data:', json);
      setData(json);
    } catch (err) {
      console.error('Chyba při načítání API:', err);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Obnova každých 15s
    return () => clearInterval(interval);
  }, []);

  // Bezpečné vytažení hodnot podle různých možných klíčů z Tuya API
  const parseVal = (sensor: any, keys: string[]) => {
    if (!sensor) return '--';
    for (const k of keys) {
      if (sensor[k] !== undefined && sensor[k] !== null) return sensor[k];
    }
    return '--';
  };

  // Získání objektu senzoru (podle klíče v API nebo pokud vrací pole/objekt)
  const getSensor = (name: string) => {
    if (!data) return null;
    if (data[name]) return data[name];
    if (Array.isArray(data)) {
      return data.find((s: any) => s.name?.toLowerCase().includes(name.toLowerCase()));
    }
    return null;
  };

  const livingRoom = getSensor('livingRoom') || data?.living_room || data?.obyvak;
  const outdoor = getSensor('outdoor') || data?.venku;
  const workshop = getSensor('workshop') || data?.dilna;

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
      }}
    >
      {/* Záhlaví s časem a datem */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px 0',
        }}
      >
        <div style={{ fontSize: '38px', fontWeight: '900', lineHeight: '1' }}>
          {timeStr || '--:--'}
        </div>
        <div style={{ fontSize: '14px', color: '#a1a1aa', marginTop: '2px' }}>
          {dateStr}
        </div>
      </div>

      {/* Obýváku */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#18181b',
          borderRadius: '16px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #27272a',
        }}
      >
        <div
          style={{
            color: '#a1a1aa',
            fontSize: '18px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Obývák
        </div>
        <div style={{ fontSize: '64px', fontWeight: '900', margin: '2px 0' }}>
          {parseVal(livingRoom, ['temp', 'temperature', 'va_temperature'])} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '18px' }}>
          Vlhkost:{' '}
          <strong style={{ color: '#ffffff' }}>
            {parseVal(livingRoom, ['humidity', 'hum', 'va_humidity'])} %
          </strong>
        </div>
      </div>

      {/* Venku */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#18181b',
          borderRadius: '16px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #27272a',
        }}
      >
        <div
          style={{
            color: '#a1a1aa',
            fontSize: '18px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Venku
        </div>
        <div style={{ fontSize: '64px', fontWeight: '900', margin: '2px 0' }}>
          {parseVal(outdoor, ['temp', 'temperature', 'va_temperature'])} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '18px' }}>
          Vlhkost:{' '}
          <strong style={{ color: '#ffffff' }}>
            {parseVal(outdoor, ['humidity', 'hum', 'va_humidity'])} %
          </strong>
        </div>
      </div>

      {/* Dílna */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#18181b',
          borderRadius: '16px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #27272a',
        }}
      >
        <div
          style={{
            color: '#a1a1aa',
            fontSize: '18px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          Dílna
        </div>
        <div style={{ fontSize: '64px', fontWeight: '900', margin: '2px 0' }}>
          {parseVal(workshop, ['temp', 'temperature', 'va_temperature'])} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '18px' }}>
          Vlhkost:{' '}
          <strong style={{ color: '#ffffff' }}>
            {parseVal(workshop, ['humidity', 'hum', 'va_humidity'])} %
          </strong>
        </div>
      </div>
    </div>
  );
}
