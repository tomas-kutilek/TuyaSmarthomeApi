import { NextResponse } from 'next/server';
import crypto from 'crypto';

const CLIENT_ID = process.env.TUYA_CLIENT_ID || 'pasjsrhrnvpfk73mrqrn';
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET || '1398c1d5b62842aeb3502abee069af89';
const BASE_URL = process.env.TUYA_ENDPOINT || 'https://openapi.tuyaeu.com';

function generateSign(
  clientId: string,
  secret: string,
  timestamp: string,
  accessToken: string = '',
  nonce: string = '',
  httpMethod: string = 'GET',
  urlPath: string = ''
) {
  const contentHash = crypto.createHash('sha256').update('').digest('hex');
  const stringToSign = [httpMethod, contentHash, '', urlPath].join('\n');
  const signStr = clientId + accessToken + timestamp + nonce + stringToSign;
  
  return crypto
    .createHmac('sha256', secret)
    .update(signStr)
    .digest('hex')
    .toUpperCase();
}

async function getAccessToken() {
  const timestamp = Date.now().toString();
  const path = '/v1.0/token?grant_type=1';
  const sign = generateSign(CLIENT_ID, CLIENT_SECRET, timestamp, '', '', 'GET', path);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: {
      client_id: CLIENT_ID,
      sign: sign,
      t: timestamp,
      sign_method: 'HMAC-SHA256',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Tuya HTTP Error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(`Tuya Token Error (${data.code}): ${data.msg || 'Failed to get token'}`);
  }
  return data.result.access_token;
}

export async function GET() {
  try {
    const token = await getAccessToken();
    const timestamp = Date.now().toString();

    // 1. Zkusíme získat seznam domovů propojeného uživatele (Smart Home PaaS struktura)
    // Zjistíme UID podle spárované aplikace nebo vyzkoušíme standardní endpoint pro zařízení přes user ID
    // Nejspolehlivější cesta pro PaaS: Najít zařízení přes /v1.0/m/smart/home/devices nebo ekvivalent
    
    // Zkusíme přímý endpoint pro cloudové zařízení spárované s projektem
    const path = '/v1.0/devices?page_no=1&page_size=50';
    let sign = generateSign(CLIENT_ID, CLIENT_SECRET, timestamp, token, '', 'GET', path);

    let res = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        client_id: CLIENT_ID,
        access_token: token,
        sign: sign,
        t: timestamp,
        sign_method: 'HMAC-SHA256',
      },
      cache: 'no-store',
    });

    let data = await res.json();

    // Pokud by tento endpoint vracel prázdno, zkusíme alternativní endpoint pro Smart Home zařízení
    if (!data.success || !data.result || (Array.isArray(data.result) && data.result.length === 0) || (data.result.devices && data.result.devices.length === 0)) {
      
      // Alternativní endpoint pro IoT / PaaS vazby
      const altPath = '/v2.0/cloud/thing/device';
      const altSign = generateSign(CLIENT_ID, CLIENT_SECRET, timestamp, token, '', 'GET', altPath);
      
      const altRes = await fetch(`${BASE_URL}${altPath}`, {
        method: 'GET',
        headers: {
          client_id: CLIENT_ID,
          access_token: token,
          sign: altSign,
          t: timestamp,
          sign_method: 'HMAC-SHA256',
        },
        cache: 'no-store',
      });
      
      const altData = await altRes.json();
      if (altData.success && altData.result) {
        const list = altData.result.list || altData.result;
        if (Array.isArray(list) && list.length > 0) {
          return NextResponse.json({ success: true, devices: list });
        }
      }

      // Pokud selže i to, vrátíme natvrdo vaše 3 zařízení s jejich ID, abychom ověřili jejich statusy
      const manualIds = [
        'bf524b00e3661af2bd7yjp',
        'bf66c0ae13f3dbf851tc1z',
        'bfa1b8eb8bda1a3781kddf'
      ];

      const manualDevices = [];
      for (const id of manualIds) {
        const devPath = `/v1.0/iot-03/devices/${id}`;
        const devSign = generateSign(CLIENT_ID, CLIENT_SECRET, timestamp, token, '', 'GET', devPath);
        const devRes = await fetch(`${BASE_URL}${devPath}`, {
          method: 'GET',
          headers: {
            client_id: CLIENT_ID,
            access_token: token,
            sign: devSign,
            t: timestamp,
            sign_method: 'HMAC-SHA256',
          },
          cache: 'no-store',
        });
        const devData = await devRes.json();
        if (devData.success && devData.result) {
          manualDevices.push(devData.result);
        }
      }

      if (manualDevices.length > 0) {
        return NextResponse.json({ success: true, devices: manualDevices });
      }
    }

    const devicesList = data.result?.devices || data.result?.list || data.result || [];

    return NextResponse.json({
      success: true,
      devices: devicesList,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
