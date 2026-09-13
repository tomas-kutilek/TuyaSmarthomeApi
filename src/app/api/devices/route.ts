import { NextResponse } from 'next/server';
import { getTuyaContext } from '@/lib/tuya';

// Zařízení, která chcete mít na dashboardu
const ALLOWED_DEVICES = [
  'teploměr obývák',
  'teplota venku',
  'Audio',
  'Dílna vrata'
];

export async function GET() {
  try {
    const tuya = getTuyaContext();
    const response = await tuya.request({
      path: '/v1.0/users/' + process.env.TUYA_USER_ID + '/devices',
      method: 'GET',
    });

    if (!response.success) {
      return NextResponse.json({ error: response.msg }, { status: 400 });
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
