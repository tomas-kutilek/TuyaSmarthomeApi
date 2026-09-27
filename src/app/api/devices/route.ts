import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    devices: [
      { id: '1', name: 'Dílna', online: true, temperature: 21.5 },
      { id: '2', name: 'Obývák', online: true, temperature: 23.0 },
      { id: '3', name: 'Venku', online: true, temperature: 15.2 }
    ]
  });
}
