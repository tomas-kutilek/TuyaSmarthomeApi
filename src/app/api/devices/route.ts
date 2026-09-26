import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const devicesList = [
      {
        id: 'bf524b00e3661af2bd7yjp',
        name: 'Teploměr dílna',
        status: [
          { code: 'va_temperature', value: 215 }, // 21.5 °C
          { code: 'va_humidity', value: 48 }     // 48 %
        ]
      },
      {
        id: 'bf66c0ae13f3dbf851tc1z',
        name: 'Teploměr obývák',
        status: [
          { code: 'va_temperature', value: 232 }, // 23.2 °C
          { code: 'va_humidity', value: 45 }     // 45 %
        ]
      },
      {
        id: 'bfa1b8eb8bda1a3781kddf',
        name: 'Teplota venku',
        status: [
          { code: 'va_temperature', value: 148 }, // 14.8 °C
          { code: 'va_humidity', value: 72 }     // 72 %
        ]
      }
    ];

    // Poskytneme data pro všechny možné struktury, které frontend může číst (.devices i .result)
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
