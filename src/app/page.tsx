"use client";

import { useEffect, useState } from "react";

interface Device {
  id: string;
  name: string;
  temperature: number | null;
  humidity: number | null;
  online: boolean;
}

export default function Home() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [timeStr, setTimeStr] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>("");

  // Hodiny a datum
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("cs-CZ", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );

      const formattedDate = now.toLocaleDateString("cs-CZ", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      setDateStr(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1));
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Načítání a filtrování zařízení
  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices", { cache: "no-store" });
      if (res.ok) {
        const data: Device[] = await res.json();
        if (Array.isArray(data)) {
          // Vyfiltrujeme pouze 3 teploměry (Obývák, Venku, Dílna) podle jejich názvu
          const allowedKeywords = ["obývák", "obyvak", "venku", "dílna", "dilna"];
          const filtered = data.filter((dev) => {
            const nameLower = (dev.name || "").toLowerCase();
            return allowedKeywords.some((key) => nameLower.includes(key));
          });

          // Seřadíme tak, aby byly v pořadí: Obývák, Venku, Dílna (případně použije všechna 3 nalezená)
          const sorted = filtered.sort((a, b) => {
            const getOrder = (name: string) => {
              const n = name.toLowerCase();
              if (n.includes("obý") || n.includes("obyv")) return 1;
              if (n.includes("venk")) return 2;
              if (n.includes("díl") || n.includes("diln")) return 3;
              return 4;
            };
            return getOrder(a.name) - getOrder(b.name);
          });

          setDevices(sorted.length > 0 ? sorted : data.slice(0, 3));
        }
      }
    } catch (err) {
      console.error("Chyba při načítání zařízení:", err);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000);
    return () => clearInterval(interval);
  }, []);

  // Formátování teploty (dělení 10 u celých čísel nad 80 + čárka)
  const formatTemperature = (rawTemp: number | null) => {
    if (rawTemp === null || rawTemp === undefined) return "--,-";

    let temp = rawTemp;
    if (Math.abs(temp) > 80 && Number.isInteger(temp)) {
      temp = temp / 10;
    }

    return temp.toFixed(1).replace(".", ",");
  };

  // Barva teploty (Modrá < 0, Červená > 30, Bílá ostatní)
  const getTemperatureColorClass = (rawTemp: number | null) => {
    if (rawTemp === null || rawTemp === undefined) return "text-white";

    let temp = rawTemp;
    if (Math.abs(temp) > 80 && Number.isInteger(temp)) {
      temp = temp / 10;
    }

    if (temp < 0) return "text-blue-500";
    if (temp > 30) return "text-red-500";
    return "text-white";
  };

  // Vyvolání asistenta v Fully Kiosk / Android
  const handleAssistantClick = () => {
    if (typeof window !== "undefined" && (window as any).fully) {
      // Vyvolá systémové okno Google Asistenta v Kiosk módu
      (window as any).fully.startApplication("com.google.android.googlequicksearchbox");
    } else {
      // Fallback pro standardní prohlížeč
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        alert("Spouštím mikrofon asistenta...");
      } else {
        alert("Asistent je připraven pro Fully Kiosk Kiosk Mode.");
      }
    }
  };

  return (
    <main className="h-screen w-screen bg-black text-white flex flex-col justify-between p-6 select-none overflow-hidden">
      {/* Horní lišta: Hodiny a Datum na jednom řádku */}
      <header className="flex items-baseline justify-center gap-6 border-b border-neutral-800 pb-3">
        <h1 className="text-6xl font-black tracking-tight leading-none text-white">
          {timeStr || "00:00"}
        </h1>
        <p className="text-2xl font-semibold text-gray-400">
          {dateStr}
        </p>
      </header>

      {/* Prostřední část: 3 velké dlaždice vedle sebe přes většinu obrazovky */}
      <section className="grid grid-cols-3 gap-6 my-auto items-stretch h-[68vh]">
        {devices.map((dev) => (
          <div
            key={dev.id}
            className="bg-neutral-900/90 border-2 border-neutral-800 rounded-3xl p-6 relative shadow-2xl flex flex-col justify-between items-center text-center"
          >
            {/* Online zelená tečka */}
            <div className="absolute top-5 right-5 flex items-center gap-2">
              <span
                className={`w-4 h-4 rounded-full ${
                  dev.online ? "bg-green-500 shadow-[0_0_12px_#22c55e]" : "bg-red-500"
                }`}
              />
            </div>

            {/* Název místnosti */}
            <h2 className="text-xl font-extrabold tracking-widest uppercase text-gray-300 mt-2">
              {dev.name}
            </h2>

            {/* Velká čísla teploty */}
            <div className="flex items-baseline justify-center gap-1 my-auto">
              <span className={`text-8xl font-black tracking-tighter ${getTemperatureColorClass(dev.temperature)}`}>
                {formatTemperature(dev.temperature)}
              </span>
              <span className="text-4xl font-bold text-gray-400">°C</span>
            </div>

            {/* Vlhkost dole na dlaždici */}
            <div className="text-xl font-semibold text-gray-400 mb-2">
              Vlhkost: <span className="text-white font-bold">{dev.humidity ?? "--"} %</span>
            </div>
          </div>
        ))}
      </section>

      {/* Spodní část: Tlačítko Hlasového Asistenta */}
      <footer className="flex justify-center pt-2">
        <button
          onClick={handleAssistantClick}
          className="flex items-center gap-3 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-white font-bold px-8 py-3 rounded-full border border-neutral-700 transition shadow-lg text-lg"
        >
          <svg
            className="w-6 h-6 text-blue-400 fill-current"
            viewBox="0 0 24 24"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
          <span>Hlasový asistent</span>
        </button>
      </footer>
    </main>
  );
}
