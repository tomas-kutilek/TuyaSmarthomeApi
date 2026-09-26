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
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ 
      margin: 0, 
      padding: '16px', 
      background: '#0f172a', 
      height: '100vh', 
      width: '100vw', 
      boxSizing: 'border-box', 
      color: '#fff', 
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '16px', 
        flex: 1,
        width: '100%',
        height: '100%'
      }}>
        {devices.map((device) => {
          let tempColor = '#fff';
          if (device.temperature < 0) tempColor = '#60a5fa'; 
          if (device.temperature > 25) tempColor = '#f87171'; 

          return (
            <div
              key={device.id}
              style={{
                background: '#1e293b',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                border: '1px solid #334155',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                height: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
              <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 'bold', letterSpacing: '1px' }}>
                {device.name.toUpperCase()}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
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
              <div style={{ 
                fontSize: 'clamp(42px, 7vw, 84px)', 
                fontWeight: 'bold', 
                color: tempColor,
                width: '100%',
                textAlign: 'center',
                margin: 'auto 0',
                lineHeight: 1
              }}>
                {device.temperature.toFixed(1)} <span style={{ fontSize: '0.5em', fontWeight: 'normal' }}>°C</span>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
