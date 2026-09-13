'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [time, setTime] = useState<string>('');
  const [date, setDate] = useState<string>('');

  // Aktualizace hodin a data
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

  // Načítání zařízení
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
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } font-finally {
        setLoading(false);
      }
    }

    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-6 flex flex-col justify-between">
      {/* Hlavička s časem a datumem */}
      <header className="text-center py-2 border-b border-slate-800 mb-4">
        <div className="text-5xl md:text-6xl font-black tracking-tight text-white">
          {time || '16:29'}
        </div>
        <div className="text-slate-400 text-lg md:text-xl capitalize mt-1">
          {date || 'neděle 13. září'}
        </div>
      </header>

      {loading && <div className="text-center text-slate-400 py-12 text-xl">Načítám...</div>}
      {error && <div className="text-center text-red-400 py-12 text-xl">Chyba: {error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto w-full flex-1 items-stretch">
          
          {/* 1. Dlaždice - Kamera iCSee (Vlevo nahoře) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-lg md:text-xl text-slate-100 flex items-center gap-2">
                📷 Kamera
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                LIVE
              </span>
            </div>
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center my-auto">
              <img 
                src="http://192.168.1.100/snapshot.jpg" 
                alt="Kamera iCSee"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* 2., 3., 4. Dlaždice - Teploměry */}
          {devices.map((device) => (
            <div key={device.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-5 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-lg md:text-xl text-slate-200 capitalize">{device.name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${device.online ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {device.online ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              {device.temperature !== null && device.temperature !== undefined ? (
                <div className="my-auto py-2">
                  <div className="text-4xl md:text-5xl font-black text-emerald-400 tracking-tight">
                    {device.temperature} °C
                  </div>
                  {device.humidity !== null && (
                    <div className="text-sm md:text-base text-slate-400 mt-2 font-medium">
                      Vlhkost: <span className="text-slate-200">{device.humidity} %</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-500 text-base my-auto">Teplota nedostupná</div>
              )}
            </div>
          ))}

        </div>
      )}
    </main>
  );
}
