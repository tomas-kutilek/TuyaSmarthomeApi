"use client";

import { useState } from "react";

export default function Home() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [responseMsg, setResponseMsg] = useState("");

  const handleAssistantClick = () => {
    // Ověření podpory rozpoznání řeči v prohlížeči
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Váš prohlížeč nepodporuje rozpoznání řeči (Web Speech API).");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "cs-CZ"; // Nastavení češtiny
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListening(true);
      setResponseMsg("");
    };

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setListening(false);

      // Odeslání rozpoznaného textu na backend /api/command
      try {
        const res = await fetch("/api/command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: text }),
        });

        const data = await res.json();
        if (data.success) {
          setResponseMsg(data.message);
        } else {
          setResponseMsg("Chyba: " + (data.error || "Neznámá chyba"));
        }
      } catch (err) {
        console.error("Chyba při komunikaci se serverem:", err);
        setResponseMsg("Chyba připojení k serveru.");
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Chyba rozpoznání řeči:", event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-900 text-white font-sans">
      <h1 className="text-3xl font-bold mb-8">Tuya Dashboard</h1>

      <button
        onClick={handleAssistantClick}
        className={`px-8 py-4 rounded-full text-xl font-semibold shadow-lg transition-all ${
          listening
            ? "bg-red-500 animate-pulse"
            : "bg-blue-600 hover:bg-blue-500"
        }`}
      >
        {listening ? "Poslouchám..." : "Spustit hlasového asistenta"}
      </button>

      {transcript && (
        <div className="mt-6 p-4 bg-slate-800 rounded-lg max-w-md w-full text-center">
          <p className="text-sm text-slate-400">Řekli jste:</p>
          <p className="text-lg font-medium">{transcript}</p>
        </div>
      )}

      {responseMsg && (
        <div className="mt-4 p-4 bg-emerald-900/50 border border-emerald-500 rounded-lg max-w-md w-full text-center">
          <p className="text-sm text-emerald-300">Odpověď backendu:</p>
          <p className="text-lg font-medium text-emerald-200">{responseMsg}</p>
        </div>
      )}
    </main>
  );
}
