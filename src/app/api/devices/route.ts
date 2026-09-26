import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const devicesList = [
      {
        id: 'bf524b00e3661af2bd7yjp',
        name: 'Teploměr dílna',
        online: true,
        temperature: 21.5, // Standardní desetinné číslo
        color: 'default',   // Mezi 0 a 25 °C
        status: [
          { code: 'temp_current', value: 21.5 },
          { code: 'humidity', value: 48 }
        ]
      },
      {
        id: 'bf66c0ae13f3dbf851tc1z',
        name: 'Teploměr obývák',
        online: true,
        temperature: 26.5, // Nad 25 °C -> červená
        color: 'red',
        status: [
          { code: 'temp_current', value: 26.5 },
          { code: 'humidity', value: 45 }
        ]
      },
      {
        id: 'bfa1b8eb8bda1a3781kddf',
        name: 'Teplota venku',
        online: true,
        temperature: -2.5, // Pod 0 °C -> modrá
        color: 'blue',
        status: [
          { code: 'temp_current', value: -2.5 },
          { code: 'humidity', value: 72 }
        ]
      }
    ];

    return NextResponse.json({
      success: true,
      devices: devicesList,
      result: devicesList
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
