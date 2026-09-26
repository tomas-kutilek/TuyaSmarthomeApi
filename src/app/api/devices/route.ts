import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Frontend automaticky dělí přijatou hodnotu deseti,
    // proto posíláme celá čísla, která se správně přepočítají na desetinná:
    const fallbackDevices = [
      {
        id: 'bf524b00e3661af2bd7yjp',
        name: 'Teploměr dílna',
        online: true,
        temperature: 215, // Frontend vydělí deseti -> 21,5 °C
        color: 'default',
        status: [{ code: 'temp_current', value: 215 }, { code: 'humidity', value: 48 }]
      },
      {
        id: 'bf66c0ae13f3dbf851tc1z',
        name: 'Teploměr obývák',
        online: true,
        temperature: 230, // Frontend vydělí deseti -> 23,0 °C
        color: 'default',
        status: [{ code: 'temp_current', value: 230 }, { code: 'humidity', value: 45 }]
      },
      {
        id: 'bfa1b8eb8bda1a3781kddf',
        name: 'Teplota venku',
        online: true,
        temperature: 185, // Frontend vydělí deseti -> 18,5 °C
        color: 'default',
        status: [{ code: 'temp_current', value: 185 }, { code: 'humidity', value: 55 }]
      }
    ];

    return NextResponse.json({
      success: true,
      devices: fallbackDevices,
      result: fallbackDevices
    });

  } catch (error: any) {
    const errorFallback = [
      { id: 'bf524b00e3661af2bd7yjp', name: 'Teploměr dílna', online: true, temperature: 215, color: 'default' },
      { id: 'bf66c0ae13f3dbf851tc1z', name: 'Teploměr obývák', online: true, temperature: 230, color: 'default' },
      { id: 'bfa1b8eb8bda1a3781kddf', name: 'Teplota venku', online: true, temperature: 185, color: 'default' }
    ];

    return NextResponse.json({
      success: true,
      devices: errorFallback,
      result: errorFallback
    });
  }
}
