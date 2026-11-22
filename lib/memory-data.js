import {ensureFeaturedMemory} from '../functions/_featured-memory.js';
import {readData} from '../functions/_secret-room.js';

export async function readMemory(env) {
  const data = await readData(env);
  if (!Array.isArray(data?.memory)) throw new Error('Memory unavailable');
  return ensureFeaturedMemory(data);
}

export function unavailable() {
  return new Response('Peripheral Memory is temporarily unavailable.', {
    status: 503,
    headers: {'cache-control': 'no-store', 'retry-after': '60'}
  });
}
