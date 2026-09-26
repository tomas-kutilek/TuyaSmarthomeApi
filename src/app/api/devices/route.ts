import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Trvalé přístupové údaje z projektu Domacnost-PaaS a evropský PaaS endpoint
const CLIENT_ID = process.env.TUYA_CLIENT_ID || 'pasjsrhrnvpfk73mrqrn';
const CLIENT_SECRET = process.env.TUYA_CLIENT_SECRET || '1398c1d5b62842aeb3502abee069af89';
const BASE_URL = process.env.TUYA_ENDPOINT || 'https://openapi.tuyaeurope.com';

// Pomocná funkce pro vygenerování HMAC-SHA256 podpisu
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

// Získání přístupového tokenu z Tuya API
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

  const data = await res.json();
  if (!data.success) {
    throw new Error(`Tuya Token Error: ${data.msg || 'Failed to get token'}`);
  }
  return data.result.access_token;
}

// GET endpoint pro načtení seznamu zařízení
export async function GET() {
  try {
    const token = await getAccessToken();
    const timestamp = Date.now().toString();
    
    // Univerzální endpoint pro načtení zařízení
    const path = '/v1.0/devices?page_no=1&page_size=100'; 
    const sign = generateSign(CLIENT_ID, CLIENT_SECRET, timestamp, token, '', 'GET', path);

    const res = await fetch(`${BASE_URL}${path}`, {
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

    const data = await res.json();

    if (!data.success) {
      return NextResponse.json({ error: data.msg }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      devices: data.result?.devices || data.result || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
