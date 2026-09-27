import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const CLIENT_ID = process.env.TUYA_CLIENT_ID || 'pasjsrhrnvpfk73mrqrn';
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET || '1398c1d5b62842aeb3502abee069af89';
const BASE_URL = process.env.TUYA_ENDPOINT || 'https://openapi.tuyaeu.com';

function generateSign(clientId: string, secret: string, timestamp: string, accessToken: string = '', nonce: string = '', httpMethod: string = 'GET', urlPath: string = '') {
  const contentHash = crypto.createHash('sha256').update('').digest('hex');
  const stringToSign = [httpMethod, contentHash, '', urlPath].join('\n');
  const signStr = clientId + accessToken + timestamp + nonce + stringToSign;
  return crypto.createHmac('sha256', secret).update(signStr).digest('hex').toUpperCase();
}

export async function GET() {
  try {
    const timestamp = Date.now().toString();
    const path = '/v1.0/token?grant_type=1';
    const sign = generateSign(CLIENT_ID, CLIENT_SECRET, timestamp, '', '', 'GET', path);

    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: { client_id: CLIENT_ID, sign: sign, t: timestamp, sign_method: 'HMAC-SHA256' },
      cache: 'no-store',
    });

    const data = await res.json();

    // Vracíme testovací data, abychom viděli, co Tuya Cloud odpoví na autorizaci
    return NextResponse.json({
      success: true,
      tokenResponse: data,
      devices: [
        { id: '1', name: 'Dílna (Test)', online: true, temperature: data.success ? 20.1 : 0 },
        { id: '2', name: 'Obývák (Test)', online: true, temperature: data.success ? 22.5 : 0 },
        { id: '3', name: 'Venku (Test)', online: true, temperature: data.success ? 15.0 : 0 }
      ]
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
