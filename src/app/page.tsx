'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' }));
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchDevices() {
      try {
        const res = await fetch('/api/devices');
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch devices');
        }

        const deviceList = Array.isArray(data.result) ? data.result : [];
        setDevices(deviceList);
        setError('');
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Chyba načítání dat');
      } finally {
        setLoading(false);
      }
    }

    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#ffffff',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxSizing: 'border-box'
    }}>
      {/* Hlavička s časem a datem */}
      <header style={{
        textAlign: 'center',
        paddingBottom: '15px',
        borderBottom: '2px solid #1e293b',
        marginBottom: '25px'
      }}>
        <div style={{ fontSize: '52px', fontWeight: '900', letterSpacing: '-1px' }}>
          {time || '16:59'}
        </div>
        <div style={{ fontSize: '20px', color: '#94a3b8', textTransform: 'capitalize', marginTop: '4px' }}>
          {date || 'neděle 13. září'}
        </div>
      </header>

      {loading && <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '20px', paddingTop: '40px' }}>Načítám...</div>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        
        {/* 1. Kamera */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '2px solid #334155',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          minHeight: '180px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '22px', fontWeight: 'bold' }}>📷 Kamera</span>
            <span style={{
              fontSize: '12px',
              backgroundColor: '#065f46',
              color: '#34d399',
              padding: '3px 10px',
              borderRadius: '12px',
              fontWeight: 'bold'
            }}>LIVE</span>
          </div>
          <div style={{
            backgroundColor: '#000000',
            borderRadius: '10px',
            height: '110px',
            marginTop: '15px',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            border: '1px solid #475569',
            color: '#64748b'
          }}>
            [Kamera iCSee]
          </div>
        </div>

        {/* Chybové hlášení přímo v sekci zařízení (pokud API selže) */}
        {error && (
          <div style={{
            gridColumn: 'span 2',
            backgroundColor: '#451a03',
            border: '1px solid #78350f',
            color: '#fde68a',
            padding: '15px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            ⚠️ Tuya API: {error} (Probíhá automatický pokus o obnovení...)
          </div>
        )}

        {/* 2., 3., 4. Teploměry */}
        {!loading && devices.map((device) => (
          <div key={device.id} style={{
            backgroundColor: '#1e293b',
            border: '2px solid #334155',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justify: 'space-between',
            minHeight: '180px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '22px', fontWeight: 'bold', textTransform: 'capitalize' }}>
                {device.name}
              </span>
              <span style={{
                fontSize: '12px',
                backgroundColor: device.online ? '#065f46' : '#881337',
                color: device.online ? '#34d399' : '#f87171',
                padding: '3px 10px',
                borderRadius: '12px',
                fontWeight: 'bold'
              }}>
                {device.online ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            {device.temperature !== null && device.temperature !== undefined ? (
              <div style={{ marginTop: '15px' }}>
                <div style={{ fontSize: '46px', fontWeight: '900', color: '#10b981' }}>
                  {device.temperature} °C
                </div>
                {device.humidity !== null && (
                  <div style={{ fontSize: '18px', color: '#94a3b8', marginTop: '5px' }}>
                    Vlhkost: <strong style={{ color: '#f1f5f9' }}>{device.humidity} %</strong>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '16px', marginTop: '20px' }}>Teplota nedostupná</div>
            )}
          </div>
        ))}

      </div>
    </main>
  );
}
