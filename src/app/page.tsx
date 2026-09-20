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

  // Načítání a striktní vyřazení nechtěných zařízení
  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices", { cache: "no-store" });
      if (res.ok) {
        const data: Device[] = await res.json();
        if (Array.isArray(data)) {
          // Natvrdo vyfiltrujeme POUZE 3 teploměry
          const filtered = data.filter((dev) => {
            const nameLower = (dev.name || "").toLowerCase();
            
            // Okamžitě vyřadit TV, Vrata, Audio, Gateway a cokoliv, co nemá být na displeji
            if (
              nameLower.includes("tv") ||
              nameLower.includes("vrata") ||
              nameLower.includes("audio") ||
              nameLower.includes("gateway") ||
              nameLower.includes("remote")
            ) {
              return false;
            }

            // Ponechat jen Obývák, Venku, Dílna
            return (
              nameLower.includes("obý") ||
              nameLower.includes("obyv") ||
              nameLower.includes("venk") ||
              nameLower.includes("díl") ||
              nameLower.includes("diln")
            );
          });

          // Seřazení v pořadí: 1. Obývák, 2. Venku, 3. Dílna
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

          setDevices(sorted);
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

  // Formátování teploty (dělení 10 u čísel nad 80 + čárka)
  const formatTemperature = (rawTemp: number | null) => {
    if (rawTemp === null || rawTemp === undefined) return "--,-";

    let temp = rawTemp;
    if (Math.abs(temp) > 80 && Number.isInteger(temp)) {
      temp = temp / 10;
    }

    return temp.toFixed(1).replace(".", ",");
  };

  // Barva teploty (Modrá < 0, Červená > 30, Bílá ostatní)
  const getTemperatureColor = (rawTemp: number | null) => {
    if (rawTemp === null || rawTemp === undefined) return "#ffffff";

    let temp = rawTemp;
    if (Math.abs(temp) > 80 && Number.isInteger(temp)) {
      temp = temp / 10;
    }

    if (temp < 0) return "#3b82f6"; // Modrá
    if (temp > 30) return "#ef4444"; // Červená
    return "#ffffff"; // Bílá
  };

  // Spuštění Hlasového Asistenta
  const handleAssistantClick = () => {
    if (typeof window !== "undefined" && (window as any).fully) {
      (window as any).fully.startApplication("com.google.android.googlequicksearchbox");
    } else {
      alert("Spouštím asistenta...");
    }
  };

  return (
    <div style={{
      backgroundColor: "#000000",
      color: "#ffffff",
      height: "100vh",
      width: "100vw",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "24px",
      boxSizing: "border-box",
      fontFamily: "system-ui, -apple-system, sans-serif",
      userSelect: "none",
      overflow: "hidden"
    }}>
      {/* Horní lišta: Hodiny a Datum na jednom řádku */}
      <header style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "center",
        gap: "24px",
        borderBottom: "1px solid #262626",
        paddingBottom: "12px",
        flexShrink: 0
      }}>
        <h1 style={{ fontSize: "64px", fontWeight: "900", margin: 0, lineHeight: 1 }}>
          {timeStr || "00:00"}
        </h1>
        <p style={{ fontSize: "28px", fontWeight: "600", color: "#a3a3a3", margin: 0 }}>
          {dateStr}
        </p>
      </header>

      {/* Prostřední část: Přesně 3 velké dlaždice vedle sebe */}
      <section style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        gap: "20px",
        height: "60vh",
        margin: "auto 0",
        alignItems: "stretch"
      }}>
        {devices.map((dev) => (
          <div
            key={dev.id}
            style={{
              flex: "1 1 0px",
              backgroundColor: "#171717",
              border: "2px solid #262626",
              borderRadius: "24px",
              padding: "24px",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              textAlign: "center",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
            }}
          >
            {/* Online zelená tečka vpravo nahoře */}
            <div style={{ position: "absolute", top: "20px", right: "20px" }}>
              <span style={{
                display: "block",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: dev.online ? "#22c55e" : "#ef4444",
                boxShadow: dev.online ? "0 0 12px #22c55e" : "none"
              }} />
            </div>

            {/* Název čidla */}
            <h2 style={{
              fontSize: "22px",
              fontWeight: "800",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#d4d4d4",
              marginTop: "8px"
            }}>
              {dev.name}
            </h2>

            {/* Teplota obřími číslicemi */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "6px", margin: "auto 0" }}>
              <span style={{
                fontSize: "84px",
                fontWeight: "900",
                letterSpacing: "-2px",
                color: getTemperatureColor(dev.temperature)
              }}>
                {formatTemperature(dev.temperature)}
              </span>
              <span style={{ fontSize: "38px", fontWeight: "700", color: "#a3a3a3" }}>°C</span>
            </div>

            {/* Vlhkost */}
            <div style={{ fontSize: "22px", fontWeight: "600", color: "#a3a3a3", marginBottom: "8px" }}>
              Vlhkost: <span style={{ color: "#ffffff", fontWeight: "700" }}>{dev.humidity ?? "--"} %</span>
            </div>
          </div>
        ))}
      </section>

      {/* Spodní část: Tlačítko Hlasového Asistenta */}
      <footer style={{ display: "flex", justify: "center", flexShrink: 0 }}>
        <button
          onClick={handleAssistantClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            backgroundColor: "#262626",
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "20px",
            padding: "14px 40px",
            borderRadius: "9999px",
            border: "1px solid #404040",
            cursor: "pointer",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
          }}
        >
          <svg style={{ width: "28px", height: "28px", fill: "#60a5fa" }} viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
          <span>Hlasový asistent</span>
        </button>
      </footer>
    </div>
  );
}
