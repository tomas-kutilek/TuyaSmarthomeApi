'use client';

import { useEffect, useState } from 'react';

interface SensorData {
  temp: string | number;
  humidity: string | number;
}

export default function Dashboard() {
  const [livingRoom, setLivingRoom] = useState<SensorData>({ temp: '--', humidity: '--' });
  const [outdoor, setOutdoor] = useState<SensorData>({ temp: '--', humidity: '--' });
  const [workshop, setWorkshop] = useState<SensorData>({ temp: '--', humidity: '--' });

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/tuya');
        const data = await res.json();
        if (data.livingRoom) setLivingRoom(data.livingRoom);
        if (data.outdoor) setOutdoor(data.outdoor);
        if (data.workshop) setWorkshop(data.workshop);
      } catch (err) {
        console.error('Chyba při načítání dat:', err);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000); // obnova každých 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-4 flex flex-col justify-between gap-4">
      {/* Obývák */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center items-center shadow-lg">
        <h2 className="text-xl md:text-2xl font-medium tracking-wide text-zinc-400 uppercase mb-2">
          Obývák
        </h2>
        <div className="text-6xl md:text-8xl font-extrabold tracking-tight my-2">
          {livingRoom.temp}°C
        </div>
        <div className="text-lg md:text-2xl text-zinc-400 font-light">
          Vlhkost: <span className="text-white font-normal">{livingRoom.humidity}%</span>
        </div>
      </div>

      {/* Venku */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center items-center shadow-lg">
        <h2 className="text-xl md:text-2xl font-medium tracking-wide text-zinc-400 uppercase mb-2">
          Venku
        </h2>
        <div className="text-6xl md:text-8xl font-extrabold tracking-tight my-2">
          {outdoor.temp}°C
        </div>
        <div className="text-lg md:text-2xl text-zinc-400 font-light">
          Vlhkost: <span className="text-white font-normal">{outdoor.humidity}%</span>
        </div>
      </div>

      {/* Dílna */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center items-center shadow-lg">
        <h2 className="text-xl md:text-2xl font-medium tracking-wide text-zinc-400 uppercase mb-2">
          Dílna
        </h2>
        <div className="text-6xl md:text-8xl font-extrabold tracking-tight my-2">
          {workshop.temp}°C
        </div>
        <div className="text-lg md:text-2xl text-zinc-400 font-light">
          Vlhkost: <span className="text-white font-normal">{workshop.humidity}%</span>
        </div>
      </div>
    </main>
  );
}
