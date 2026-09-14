'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);

  async function fetchData() {
    try {
      const res = await fetch('/api/tuya');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Chyba API:', err);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const getTemp = (sensor: any) => sensor?.temp ?? sensor?.temperature ?? '--';
  const getHum = (sensor: any) => sensor?.humidity ?? sensor?.hum ?? '--';

  return (
    <div style={{ backgroundColor: '#000000', color: '#ffffff', height: '100vh', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', boxSizing: 'border-box' }}>
      
      {/* Obývák */}
      <div style={{ flex: 1, backgroundColor: '#18181b', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #27272a' }}>
        <div style={{ color: '#a1a1aa', fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Obývák
        </div>
        <div style={{ fontSize: '72px', fontWeight: '900', margin: '4px 0' }}>
          {getTemp(data?.livingRoom)} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '20px' }}>
          Vlhkost: <strong style={{ color: '#ffffff' }}>{getHum(data?.livingRoom)} %</strong>
        </div>
      </div>

      {/* Venku */}
      <div style={{ flex: 1, backgroundColor: '#18181b', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #27272a' }}>
        <div style={{ color: '#a1a1aa', fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Venku
        </div>
        <div style={{ fontSize: '72px', fontWeight: '900', margin: '4px 0' }}>
          {getTemp(data?.outdoor)} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '20px' }}>
          Vlhkost: <strong style={{ color: '#ffffff' }}>{getHum(data?.outdoor)} %</strong>
        </div>
      </div>

      {/* Dílna */}
      <div style={{ flex: 1, backgroundColor: '#18181b', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #27272a' }}>
        <div style={{ color: '#a1a1aa', fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Dílna
        </div>
        <div style={{ fontSize: '72px', fontWeight: '900', margin: '4px 0' }}>
          {getTemp(data?.workshop)} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '20px' }}>
          Vlhkost: <strong style={{ color: '#ffffff' }}>{getHum(data?.workshop)} %</strong>
        </div>
      </div>

    </div>
  );
}
