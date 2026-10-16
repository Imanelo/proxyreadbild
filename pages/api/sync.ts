// pages/api/sync.ts
// Deploy this file to Vercel as a Next.js API route
// Set AIRTABLE_BASE_ID and AIRTABLE_API_KEY in your Vercel project settings

import type { NextApiRequest, NextApiResponse } from 'next';

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_TABLE = 'Idioms';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`;

  try {
    const allRecords: any[] = [];
    let offset: string | undefined;

    do {
      const fetchUrl = offset
        ? `${url}?offset=${encodeURIComponent(offset)}`
        : url;

      const response = await fetch(fetchUrl, {
        headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Airtable error' });
      }

      const data = await response.json();
      allRecords.push(...(data.records || []));
      offset = data.offset;
    } while (offset);

    const idioms = allRecords.map((r: any) => {
      const f = r.fields || {};
      return {
        id: parseInt(f.Id as string, 10) || 0,
        german: (f['German'] as string) || '',
        literalMeaning: (f['Literal Meaning'] as string) || '',
        figurativeMeaning: (f['Figurative Meaning'] as string) || '',
        germanExample: (f['German Example'] as string) || null,
        englishExample: (f['English Example'] as string) || null,
        puzzleEmoji: (f['Puzzle Emoji'] as string) || null,
        imageKey: (f['Image Key'] as string) || null,
        imageUrl: (f['Image URL'] as string) || null,
        airtable_record_id: r.id,
        updated_at: Date.now(),
        content_hash: JSON.stringify(f),
      };
    });

    return res.status(200).json({ idioms, synced: idioms.length });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
