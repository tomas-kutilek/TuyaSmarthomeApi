'use client';

import { useState, useEffect } from 'react';

interface Device {
  id: string;
  name: string;
  online: boolean;
  temperature: number;
}

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([
    { id: 'bf524b00e3661af2bd7yjp', name: 'Dílna', online: true, temperature: 0 },
    { id: 'bf66c0ae13f3dbf851tc1z', name: 'Obývák', online: true, temperature: 0 },
    { id: 'bfa1b8eb8bda1a3781kddf', name: 'Venku', online: true, temperature: 0 },
  ]);

  const fetchDevices = async () => {
    try {
      // Přidání časového razítka ?t=... zamezí cachování v prohlížeči i ve Fully Kiosku
      const res = await fetch('/api/devices?t=' + Date.now(), {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && data.devices) {
        setDevices(data.devices);
      }
    } catch (err) {
      console.error('Failed to fetch devices', err);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000); // Obnovení každých 30 sekund
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ padding: '20px', background: '#0f172a', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
        {devices.map((device) => {
          // Podmíněné barvy: modrá pro < 0°C, červená pro > 25°C
          let tempColor = '#fff';
          if (device.temperature < 0) tempColor = '#60a5fa'; 
          if (device.temperature > 25) tempColor = '#f87171'; 

          return (
            <div
              key={device.id}
              style={{
                background: '#1e293b',
                borderRadius: '16px',
                padding: '28px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid #334155',
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', letterSpacing: '1px' }}>
                  {device.name.toUpperCase()}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: device.online ? '#4ade80' : '#f87171',
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ fontSize: '14px', color: device.online ? '#4ade80' : '#f87171', fontWeight: '600' }}>
                    {device.online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '52px', fontWeight: 'bold', color: tempColor }}>
                {device.temperature.toFixed(1)} °C
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
