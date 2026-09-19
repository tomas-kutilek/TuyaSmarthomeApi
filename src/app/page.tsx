"use client";

import { useEffect, useState } from "react";

interface DeviceData {
  id: string;
  name: string;
  temperature: number | null;
  humidity: number | null;
  online: boolean;
}

export default function Home() {
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Aktualizace hodin a data
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("cs-CZ", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      setDate(
        now.toLocaleDateString("cs-CZ", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Načítání dat z Tuya API
  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (error) {
      console.error("Chyba při načítání senzorů:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000); // Obnovení každých 30s
    return () => clearInterval(interval);
  }, []);

  // Pomocná funkce pro správné formátování teploty (vždy 1 desetinné místo)
  const formatTemp = (rawTemp: number | null) => {
    if (rawTemp === null || rawTemp === undefined || isNaN(rawTemp)) return "--.-";
    
    // Pokud Tuya posílá teplotu vynásobenou 10 (např. 216 pro 21.6°C nebo 100 pro 10.0°C)
    let temp = rawTemp;
    if (Math.abs(temp) > 60) {
      temp = temp / 10;
    }
    
    return temp.toFixed(1);
  };

  // Funkce pro určování barvy podle hodnoty teploty
  const getTempColorClass = (rawTemp: number | null) => {
    if (rawTemp === null || rawTemp === undefined || isNaN(rawTemp)) return "text-white";
    
    let temp = rawTemp;
    if (Math.abs(temp) > 60) {
      temp = temp / 10;
    }

    if (temp <= 0) {
      return "text-blue-500"; // Modrá při 0 °C a méně
    }
    if (temp > 30) {
      return "text-red-500"; // Červená při více než 30 °C
    }
    return "text-white"; // Bílá pro běžné teploty
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col justify-between p-6 select-none overflow-hidden">
      {/* Horní lišta s časem a datem */}
      <div className="text-center my-2">
        <h1 className="text-6xl font-extrabold tracking-tight">{time || "00:00"}</h1>
        <p className="text-lg text-gray-400 capitalize mt-1">{date}</p>
      </div>

      {/* Mřížka se senzory */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-auto max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="col-span-3 text-center text-gray-500 py-10">
            Načítání dat ze senzorů...
          </div>
        ) : (
          devices.map((device) => {
            const tempColor = getTempColorClass(device.temperature);
            const formattedTemp = formatTemp(device.temperature);

            return (
              <div
                key={device.id}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between items-center relative shadow-lg"
              >
                {/* Indikátor stavu (online/offline) */}
                <div
                  className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
                    device.online ? "bg-green-500" : "bg-red-500"
                  }`}
                  title={device.online ? "Online" : "Offline"}
                />

                {/* Název senzoru */}
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  {device.name}
                </h2>

                {/* Hodnota teploty s dynamickou barvou */}
                <div className="my-2 text-center">
                  <span className={`text-6xl font-bold tracking-tight transition-colors duration-300 ${tempColor}`}>
                    {formattedTemp}
                  </span>
                  <span className={`text-3xl font-medium ml-1 ${tempColor}`}>°C</span>
                </div>

                {/* Vlhkost vzduchu */}
                <div className="mt-4 text-gray-400 text-sm font-medium">
                  Vlhkost:{" "}
                  <span className="text-gray-200 font-semibold">
                    {device.humidity !== null ? `${device.humidity} %` : "-- %"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
