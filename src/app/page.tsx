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

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDevices(data);
        }
      }
    } catch (error) {
      console.error("Chyba načítání:", error);
    }
  };

  useEffect(() => {
    fetchDevices();
    // Obnovování dat z API každých 5 sekund
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  const getParsedTemp = (val: any): number | null => {
    if (val === null || val === undefined) return null;
    const num = Number(val);
    if (isNaN(num)) return null;
    if (Math.abs(num) > 60) {
      return num / 10;
    }
    return num;
  };

  const formatTemp = (val: any): string => {
    const parsed = getParsedTemp(val);
    if (parsed === null) return "--.-";
    return parsed.toFixed(1);
  };

  const getTempColor = (val: any): string => {
    const parsed = getParsedTemp(val);
    if (parsed === null) return "#ffffff";
    if (parsed <= 0) return "#3b82f6";
    if (parsed > 30) return "#ef4444";
    return "#ffffff";
  };

  return (
    <main className="dashboard-main">
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          background-color: #000000 !important;
          color: #ffffff !important;
          font-family: system-ui, -apple-system, sans-serif !important;
        }
        .dashboard-main {
          min-height: 100vh;
          background-color: #000000;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 24px;
          box-sizing: border-box;
          user-select: none;
        }
        .header-section {
          text-align: center;
          margin: 8px 0 24px 0;
        }
        .clock-title {
          font-size: 64px;
          font-weight: 800;
          margin: 0;
          letter-spacing: -1px;
        }
        .date-subtitle {
          font-size: 20px;
          color: #a3a3a3;
          margin: 4px 0 0 0;
          text-transform: capitalize;
        }
        .grid-container {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          max-width: 1200px;
          width: 100%;
          margin: auto;
        }
        @media (max-width: 768px) {
          .grid-container {
            grid-template-columns: repeat(1, minmax(0, 1fr));
          }
        }
        .card {
          background-color: #171717;
          border: 1px solid #262626;
          border-radius: 20px;
          padding: 28px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          position: relative;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.8);
        }
        .online-dot {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .sensor-name {
          font-size: 15px;
          font-weight: 600;
          color: #a3a3a3;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin: 0 0 16px 0;
        }
        .temp-container {
          margin: 12px 0;
          text-align: center;
        }
        .temp-value {
          font-size: 64px;
          font-weight: 800;
          letter-spacing: -2px;
        }
        .temp-unit {
          font-size: 32px;
          font-weight: 600;
          margin-left: 4px;
        }
        .humidity-container {
          margin-top: 16px;
          color: #a3a3a3;
          font-size: 15px;
          font-weight: 500;
        }
        .humidity-value {
          color: #f5f5f5;
          font-weight: 700;
        }
      `}</style>

      <div className="header-section">
        <h1 className="clock-title">{time || "00:00"}</h1>
        <p className="date-subtitle">{date}</p>
      </div>

      <div className="grid-container">
        {devices.map((device, index) => {
          const formattedTemp = formatTemp(device.temperature);
          const tempColor = getTempColor(device.temperature);

          return (
            <div key={device.id || index} className="card">
              <div
                className="online-dot"
                style={{
                  backgroundColor: device.online ? "#22c55e" : "#ef4444",
                  boxShadow: device.online ? "0 0 10px #22c55e" : "none",
                }}
              />
              <h2 className="sensor-name">{device.name}</h2>
              <div className="temp-container">
                <span className="temp-value" style={{ color: tempColor }}>
                  {formattedTemp}
                </span>
                <span className="temp-unit" style={{ color: tempColor }}>
                  °C
                </span>
              </div>
              <div className="humidity-container">
                Vlhkost:{" "}
                <span className="humidity-value">
                  {device.humidity !== null && device.humidity !== undefined ? `${device.humidity} %` : "-- %"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
