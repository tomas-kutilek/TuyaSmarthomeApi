'use client';

import { useEffect, useState } from 'react';

// Ikony
const IconPower = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>;
const IconCamera = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;

export default function Home() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      } finally {
        setLoading(false);
      }
    }

    fetchDevices();
    // Automatické obnavování dat každých 30 sekund
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Smart Home</h1>
        <p className="text-slate-400 text-sm mt-1">Everything is under control</p>
      </header>

      {loading && <div className="text-center text-slate-400 py-8">Načítám zařízení...</div>}
      {error && <div className="text-center text-red-400 py-8">Chyba: {error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          
          {/* KARTA KAJI: Kamera iCSee */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconCamera />
                  <h2 className="font-semibold text-lg">Kamera iCSee</h2>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  LIVE
                </span>
              </div>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
                {/* Zde zadejte IP adresu vaší iCSee kamery nebo snapshot URL */}
                <img 
                  src="http://192.168.1.100/snapshot.jpg" 
                  alt="Kamera iCSee"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Pokud odkaz nefunguje, zobrazí náhradní text
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <p className="text-xs text-slate-500 absolute">Stream kamery (Nastavte IP adresu)</p>
              </div>
            </div>
          </div>

          {/* KARTY ZAŘÍZENÍ Z TUYA API */}
          {devices.map((device) => (
            <div key={device.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-lg">{device.name}</h2>
                  <span className={`text-xs px-2 py-1 rounded ${device.online ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                    {device.online ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>

                {/* Zobrazení Teploty a Vlhkosti pokud zařízení naměřilo hodnota */}
                {device.temperature !== null && device.temperature !== undefined ? (
                  <div className="my-4">
                    <div className="text-3xl font-bold text-emerald-400">
                      {device.temperature} °C
                    </div>
                    {device.humidity !== null && (
                      <div className="text-sm text-slate-400 mt-1">
                        Vlhkost: {device.humidity} %
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 my-4">
                    {device.online ? 'Ready to Control' : 'Zařízení nedostupné'}
                  </p>
                )}
              </div>
            </div>
          ))}

        </div>
      )}
    </main>
  );
                        }
