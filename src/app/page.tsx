'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    try {
      const res = await fetch('/api/tuya');
      const json = await res.json();
      console.log('Data z API:', json);
      setData(json);
    } catch (err) {
      console.error('Chyba API:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Pomocné funkce pro vytažení hodnot podle toho, jak je vaše API vrací
  const getTemp = (sensor: any) => sensor?.temp ?? sensor?.temperature ?? '--';
  const getHum = (sensor: any) => sensor?.humidity ?? sensor?.hum ?? '--';

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
      
      {/* Obýváku */}
      <div style={{ flex: 1, backgroundColor: '#18181b', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyCenter: 'center', border: '1px solid #27272a' }}>
        <div style={{ color: '#a1a1aa', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
          Obývák
        </div>
        <div style={{ fontSize: '72px', fontWeight: '900', margin: '10px 0' }}>
          {getTemp(data?.livingRoom)} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '22px' }}>
          Vlhkost: <strong style={{ color: '#fff' }}>{getHum(data?.livingRoom)} %</strong>
        </div>
      </div>

      {/* Venku */}
      <div style={{ flex: 1, backgroundColor: '#18181b', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyCenter: 'center', border: '1px solid #27272a' }}>
        <div style={{ color: '#a1a1aa', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
          Venku
        </div>
        <div style={{ fontSize: '72px', fontWeight: '900', margin: '10px 0' }}>
          {getTemp(data?.outdoor)} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '22px' }}>
          Vlhkost: <strong style={{ color: '#fff' }}>{getHum(data?.outdoor)} %</strong>
        </div>
      </div>

      {/* Dílna */}
      <div style={{ flex: 1, backgroundColor: '#18181b', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyCenter: 'center', border: '1px solid #27272a' }}>
        <div style={{ color: '#a1a1aa', fontSize: '20px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
          Dílna
        </div>
        <div style={{ fontSize: '72px', fontWeight: '900', margin: '10px 0' }}>
          {getTemp(data?.workshop)} °C
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '22px' }}>
          Vlhkost: <strong style={{ color: '#fff' }}>{getHum(data?.workshop)} %</strong>
        </div>
      </div>

    </div>
  );
}
