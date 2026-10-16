export default async function handler(req, res) {
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_TABLE = 'Idioms';

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`;

  try {
    const allRecords = [];
    let offset;

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

    const idioms = allRecords.map((r) => {
      const f = r.fields || {};
      return {
        id: parseInt(f.Id, 10) || 0,
        german: f['German'] || '',
        literalMeaning: f['Literal Meaning'] || '',
        figurativeMeaning: f['Figurative Meaning'] || '',
        germanExample: f['German Example'] || null,
        englishExample: f['English Example'] || null,
        puzzleEmoji: f['Puzzle Emoji'] || null,
        imageKey: f['Image Key'] || null,
        imageUrl: f['Image URL'] || null,
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
