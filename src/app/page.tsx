'use client';

import { useState, useEffect } from 'react';

interface Device {
  id: string;
  name: string;
  online: boolean;
  temperature: number;
}

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/devices', { cache: 'no-store' });
      const data = await res.json();
      
      if (data.success && Array.isArray(data.devices)) {
        setDevices(data.devices);
        setError(null);
      } else {
        setError(data.error || 'Chyba při načtení dat');
      }
    } catch (err: any) {
      setError(err.message || 'Síťová chyba');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Obnova každých 10 sekund
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold mb-8 tracking-wider">MĚŘENÍ TEPLOT</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm">
          Chyba: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {devices.map((dev) => (
          <div 
            key={dev.id} 
            className="bg-blue-950/40 border border-blue-900/60 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden backdrop-blur-sm h-72"
          >
            <div>
              <h2 className="text-2xl font-semibold tracking-wide text-blue-100">{dev.name}</h2>
              <div className="flex items-center mt-2 space-x-2">
                <span className={`w-3 h-3 rounded-full ${dev.online ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs uppercase tracking-wider text-slate-300">
                  {dev.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-6xl font-extrabold tracking-tighter text-white">
                {dev.temperature.toFixed(1)}
              </span>
              <span className="text-2xl font-medium text-blue-300 ml-1">°C</span>
            </div>
          </div>
        ))}

        {!loading && devices.length === 0 && !error && (
          <div className="text-slate-400 col-span-3 text-center">Žádná zařízení k zobrazení.</div>
        )}
      </div>
    </main>
  );
}
