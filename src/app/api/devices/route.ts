import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const devicesList = [
      {
        id: 'bf524b00e3661af2bd7yjp',
        name: 'Teploměr dílna',
        online: true,
        status: [
          { code: 'temp_current', value: 215 },
          { code: 'humidity', value: 48 }
        ]
      },
      {
        id: 'bf66c0ae13f3dbf851tc1z',
        name: 'Teploměr obývák',
        online: true,
        status: [
          { code: 'temp_current', value: 232 },
          { code: 'humidity', value: 45 }
        ]
      },
      {
        id: 'bfa1b8eb8bda1a3781kddf',
        name: 'Teplota venku',
        online: true,
        status: [
          { code: 'temp_current', value: 148 },
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
