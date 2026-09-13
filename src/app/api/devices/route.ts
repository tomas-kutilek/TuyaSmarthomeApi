import { NextResponse } from 'next/server';
import context from '@/lib/tuya';

// Seznam zařízení, která CHCETE zobrazovat na dashboardu
const ALLOWED_DEVICES = [
  'teploměr obývák',
  'teplota venku',
  'Audio',
  'Dílna vrata'
];

// Helper to retry requests on network errors
async function requestWithRetry(config: any, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await context.request(config);
      return res;
    } catch (error: any) {
      const isRetryable = error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT';
      if (isRetryable && i < retries - 1) {
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
}

export async function GET() {
  try {
    const uid = (process.env.TUYA_UID || '').trim();
    if (!uid) {
      return NextResponse.json({ error: 'TUYA_UID is missing in environment variables' }, { status: 400 });
    }

    const response: any = await requestWithRetry({
      path: `/v1.0/users/${uid}/devices`,
      method: 'GET',
    });

    if (!response || !response.success) {
      return NextResponse.json({ error: response?.msg || 'Tuya API Request Failed' }, { status: 400 });
    }

    const rawDevices = response.result || [];

    // Filtrujeme pouze požadovaná zařízení
    const filteredDevices = rawDevices.filter((device: any) =>
      ALLOWED_DEVICES.includes(device.name)
    );

    const formattedDevices = filteredDevices.map((device: any) => {
      let temp = null;
      let humidity = null;

      if (Array.isArray(device.status)) {
        device.status.forEach((st: any) => {
          // Načtení teploty
          if (['va_temperature', 'temp_current', 'temp_indoor'].includes(st.code)) {
            temp = typeof st.value === 'number' && st.value > 100 ? st.value / 10 : st.value;
          }
          // Načtení vlhkosti
          if (['va_humidity', 'humidity_value'].includes(st.code)) {
            humidity = st.value;
          }
        });
      }

      return {
        id: device.id,
        name: device.name,
        online: device.online,
        category: device.category,
        temperature: temp,
        humidity: humidity,
        status: device.status,
      };
    });

    return NextResponse.json({ result: formattedDevices });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
