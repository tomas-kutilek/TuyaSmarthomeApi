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

async function getAccessToken() {
  const timestamp = Date.now().toString();
  const path = '/v1.0/token?grant_type=1';
  const sign = generateSign(CLIENT_ID, CLIENT_SECRET, timestamp, '', '', 'GET', path);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: { client_id: CLIENT_ID, sign: sign, t: timestamp, sign_method: 'HMAC-SHA256' },
    cache: 'no-store',
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(`Token error: ${data.msg || JSON.stringify(data)}`);
  }
  return data.result.access_token;
}

export async function GET() {
  try {
    const token = await getAccessToken();
    const timestamp = Date.now().toString();

    const targetDevices = [
      { id: 'bf524b00e3661af2bd7yjp', name: 'Dílna' },
      { id: 'bf66c0ae13f3dbf851tc1z', name: 'Obývák' },
      { id: 'bfa1b8eb8bda1a3781kddf', name: 'Venku' }
    ];

    const results = await Promise.all(targetDevices.map(async (devInfo) => {
      try {
        // Správný endpoint pro aktuální stav stavových veličin (teplot apod.)
        const path = `/v1.0/devices/${devInfo.id}/status`;
        const sign = generateSign(CLIENT_ID, CLIENT_SECRET, timestamp, token, '', 'GET', path);

        const res = await fetch(`${BASE_URL}${path}`, {
          method: 'GET',
          headers: {
            client_id: CLIENT_ID,
            access_token: token,
            sign: sign,
            t: timestamp,
            sign_method: 'HMAC-SHA256'
          },
          cache: 'no-store',
        });

        const data = await res.json();

        let temp = 0.0;
        let online = false;

        if (data.success && Array.isArray(data.result)) {
          online = true;
          for (const item of data.result) {
            // Tuya vrací teploty pod kódy jako 'va_temperature', 'temp_current', 'temperature' atd.
            if (item.code && (item.code.includes('temp') || item.code.includes('temperature') || item.code === 'va_temperature')) {
              let val = Number(item.value);
              temp = val > 60 || val -60 ? val / 10 : val;
            }
          }
        }

        return {
          id: devInfo.id,
          name: devInfo.name,
          online: online,
          temperature: temp
        };
      } catch (err) {
        return {
          id: devInfo.id,
          name: devInfo.name,
          online: false,
          temperature: 0.0
        };
      }
    }));

    return NextResponse.json({ success: true, devices: results });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
