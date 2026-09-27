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

async function getTokenAndUid() {
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
  return {
    accessToken: data.result.access_token,
    uid: data.result.uid
  };
}

export async function GET() {
  try {
    const { accessToken, uid } = await getTokenAndUid();
    const timestamp = Date.now().toString();

    // Hromadný endpoint pro všechna zařízení uživatele (funguje spolehlivě i pro Zigbee brány)
    const path = `/v1.0/users/${uid}/devices`;
    const sign = generateSign(CLIENT_ID, CLIENT_SECRET, timestamp, accessToken, '', 'GET', path);

    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        client_id: CLIENT_ID,
        access_token: accessToken,
        sign: sign,
        t: timestamp,
        sign_method: 'HMAC-SHA256'
      },
      cache: 'no-store',
    });

    const data = await res.json();

    const targetDevicesMap: Record<string, string> = {
      'bf524b00e3661af2bd7yjp': 'Dílna',
      'bf66c0ae13f3dbf851tc1z': 'Obývák',
      'bfa1b8eb8bda1a3781kddf': 'Venku'
    };

    const results: any[] = [];

    if (data.success && Array.isArray(data.result)) {
      for (const dev of data.result) {
        if (targetDevicesMap[dev.id]) {
          let online = dev.online ?? false;
          let temp = 0.0;
          
          const statusList = dev.status || dev.properties || [];
          for (const item of statusList) {
            const code = item.code || '';
            if (code.includes('temp') || code.includes('temperature') || code === 'va_temperature') {
              let val = Number(item.value);
              if (!isNaN(val)) {
                temp = (val > 60 || val < -60) ? val / 10 : val;
              }
            }
          }

          results.push({
            id: dev.id,
            name: targetDevicesMap[dev.id],
            online: online,
            temperature: temp
          });
        }
      }
    }

    // Pojistka pro případ, že by některé zařízení v poli chybělo
    for (const [id, name] of Object.entries(targetDevicesMap)) {
      if (!results.some(d => d.id === id)) {
        results.push({
          id,
          name,
          online: false,
          temperature: 0.0
        });
      }
    }

    return NextResponse.json({ success: true, devices: results });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
