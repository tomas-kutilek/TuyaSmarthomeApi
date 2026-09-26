'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [devices, setDevices] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/devices', { cache: 'no-store' });
      const data = await res.json();
      
      if (data.success) {
        setDevices(data.devices || data.result || []);
        setError(null);
      } else {
        setError(data.error || 'Neznámá chyba při načítání zařízení.');
      }
    } catch (err: any) {
      setError(err.message || 'Chyba připojení k serveru.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Okamžité načtení při spuštění
    fetchDevices();

    // Automatická aktualizace každých 30 sekund
    const interval = setInterval(() => {
      fetchDevices();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="p-6 max-w-4xl mx-auto text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Smart Home Dashboard</h1>
        <div className="text-sm text-gray-400">
          {new Date().toLocaleDateString('cs-CZ')} {new Date().toLocaleTimeString('cs-CZ')}
        </div>
      </div>

      {error && (
        <div className="bg-red-600/80 border border-red-500 p-4 rounded-xl mb-6 text-white">
          ⚠️ Detail chyby: {error}
        </div>
      )}

      {loading && devices.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Načítání zařízení...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {devices.map((device) => {
            // Určení barvy podle požadavku (< 0 modrá, > 25 červená)
            let tempColor = 'text-white';
            if (device.temperature < 0) {
              tempColor = 'text-blue-400';
            } else if (device.temperature > 25) {
              tempColor = 'text-red-400';
            }

            return (
              <div key={device.id} className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-gray-300 uppercase text-sm tracking-wider">{device.name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${device.online ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                      {device.online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                
                <div className="text-center my-4">
                  <div className={`text-5xl font-extrabold ${tempColor}`}>
                    {device.temperature !== undefined ? `${device.temperature.toFixed(1)} °C` : '-- °C'}
                  </div>
                </div>

                <div className="text-xs text-gray-400 text-right">
                  {device.status?.find((s: any) => s.code === 'humidity')?.value !== undefined && (
                    <span>Vlhkost: {device.status.find((s: any) => s.code === 'humidity').value} %</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
