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
      setDateStr(dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1));
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Načítání dat z funkčního backendu
  async function fetchData() {
    try {
      const res = await fetch('/api/devices');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Chyba při načítání API:', err);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Extrakce teploty a vlhkosti z Tuya objektu
  const extractVal = (sensorObj: any, type: 'temp' | 'hum') => {
    if (!sensorObj) return '--';
    
    // Přímá vlastnost v objektu
    if (type === 'temp' && (sensorObj.temp !== undefined || sensorObj.temperature !== undefined)) {
      const val = sensorObj.temp ?? sensorObj.temperature;
      return typeof val === 'number' && val > 100 ? (val / 10).toFixed(1) : val;
    }
    if (type === 'hum' && (sensorObj.humidity !== undefined || sensorObj.hum !== undefined)) {
      return sensorObj.humidity ?? sensorObj.hum;
    }

    // Vytažení ze status pole Tuya
    if (Array.isArray(sensorObj.status)) {
      const targetCodes = type === 'temp' 
        ? ['va_temperature', 'temp_current', 'temperature'] 
        : ['va_humidity', 'humidity_value', 'humidity'];
      
      const item = sensorObj.status.find((s: any) => targetCodes.includes(s.code));
      if (item && item.value !== undefined) {
        if (type === 'temp' && typeof item.value === 'number' && item.value > 100) {
          return (item.value / 10).toFixed(1);
        }
        return item.value;
      }
    }

    return '--';
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
          {extractVal(data?.livingRoom, 'temp')} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '16px' }}>
          Vlhkost: <strong style={{ color: '#ffffff' }}>{extractVal(data?.livingRoom, 'hum')} %</strong>
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
          {extractVal(data?.outdoor, 'temp')} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '16px' }}>
          Vlhkost: <strong style={{ color: '#ffffff' }}>{extractVal(data?.outdoor, 'hum')} %</strong>
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
          {extractVal(data?.workshop, 'temp')} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '16px' }}>
          Vlhkost: <strong style={{ color: '#ffffff' }}>{extractVal(data?.workshop, 'hum')} %</strong>
        </div>
      </div>
    </div>
  );
}
