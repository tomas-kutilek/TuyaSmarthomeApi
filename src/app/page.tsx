'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [devices, setDevices] = useState<any[]>([
    { id: 'bf524b00e3661af2bd7yjp', name: 'Dílna', online: true, temperature: 21.5 },
    { id: 'bf66c0ae13f3dbf851tc1z', name: 'Obývák', online: true, temperature: 22.4 },
    { id: 'bfa1b8eb8bda1a3781kddf', name: 'Venku', online: true, temperature: 17.9 }
  ]);

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/devices', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.devices) {
        setDevices(data.devices);
      }
    } catch (err) {
      console.error('Chyba při načítání dat:', err);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      backgroundColor: '#0f172a',
      color: '#ffffff',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'sans-serif',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {devices.map((device) => {
        let tempColor = '#ffffff';
        if (device.temperature < 0) {
          tempColor = '#60a5fa'; // modrá pro mínusové teploty
        } else if (device.temperature > 25) {
          tempColor = '#f87171'; // červená pro teploty nad 25 °C
        }

        return (
          <div key={device.id} style={{
            backgroundColor: '#1e293b',
            border: '2px solid #334155',
            borderRadius: '24px',
            padding: '24px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            flex: 1,
            position: 'relative'
          }}>
            {/* Levá strana: Název místnosti a stav online/offline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: '#94a3b8'
              }}>
                {device.name}
              </div>
              <div>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  backgroundColor: device.online ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: device.online ? '#4ade80' : '#f87171',
                  border: `1px solid ${device.online ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                }}>
                  {device.online ? '● Online' : '● Offline'}
                </span>
              </div>
            </div>

            {/* Pravá strana: Velká hodnota teploty */}
            <div style={{
              fontSize: '56px',
              fontWeight: '900',
              color: tempColor
            }}>
              {device.temperature !== undefined ? `${device.temperature.toFixed(1)} °C` : '-- °C'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
