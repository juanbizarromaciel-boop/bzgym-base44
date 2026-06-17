import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const decodeHtml = (text = '') => text
  .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ')
  .trim();

const pick = (block, tag) => {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return decodeHtml(match?.[1] || '');
};

const pickAttr = (block, tag, attr) => {
  const match = block.match(new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*>`, 'i'));
  return match?.[1] || '';
};

const hashFor = (title, url) => `${title || ''}|${url || ''}`.toLowerCase().replace(/\s+/g, ' ').slice(0, 500);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let payload = {};
    try { payload = await req.json(); } catch (_) {}
    const force = payload.force === true;
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    if (user && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const sources = await base44.asServiceRole.entities.NewsSource.list();
    const activeSources = sources.filter(s => s.active && s.url && s.name);
    const existing = await base44.asServiceRole.entities.SportsNews.list('-created_date', 500);
    const existingKeys = new Set(existing.map(n => n.import_hash || hashFor(n.title, n.original_url)));
    let imported = 0;
    const errors = [];

    for (const source of activeSources) {
      const frequencyMs = (source.update_frequency_minutes || 360) * 60 * 1000;
      if (!force && source.last_update_at && Date.now() - new Date(source.last_update_at).getTime() < frequencyMs) continue;
      try {
        const response = await fetch(source.url, { headers: { 'User-Agent': 'BZ-Gym-NewsBot/1.0' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const xml = await response.text();
        const blocks = [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map(m => m[0]);
        const entries = blocks.length ? blocks : [...xml.matchAll(/<entry[\s\S]*?<\/entry>/gi)].map(m => m[0]);

        for (const block of entries.slice(0, 20)) {
          const title = pick(block, 'title');
          const link = pick(block, 'link') || pickAttr(block, 'link', 'href');
          const summary = pick(block, 'description') || pick(block, 'summary') || pick(block, 'content') || pick(block, 'content:encoded');
          const published = pick(block, 'pubDate') || pick(block, 'published') || pick(block, 'updated') || new Date().toISOString();
          const parsedDate = new Date(published);
          const publishedAt = Number.isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
          const image = pickAttr(block, 'media:content', 'url') || pickAttr(block, 'media:thumbnail', 'url') || pickAttr(block, 'enclosure', 'url') || '';
          const importHash = hashFor(title, link);
          if (!title || !summary || !link || existingKeys.has(importHash)) continue;

          await base44.asServiceRole.entities.SportsNews.create({
            title,
            summary: summary.slice(0, 280),
            content: summary,
            image_url: image,
            source_name: source.name,
            source_url: source.url,
            original_url: link,
            category: source.default_category || 'fitness',
            published_at: publishedAt,
            status: 'ativo',
            is_featured: false,
            language: source.preferred_language || 'pt-BR',
            tags: [],
            import_hash: importHash,
            last_imported_at: new Date().toISOString()
          });
          existingKeys.add(importHash);
          imported++;
        }

        await base44.asServiceRole.entities.NewsSource.update(source.id, {
          last_update_at: new Date().toISOString(),
          last_update_status: 'sucesso',
          last_update_message: `${imported} notícia(s) importada(s) nesta execução`
        });
      } catch (error) {
        errors.push(`${source.name}: ${error.message}`);
        await base44.asServiceRole.entities.NewsSource.update(source.id, {
          last_update_at: new Date().toISOString(),
          last_update_status: 'erro',
          last_update_message: error.message
        });
      }
    }

    return Response.json({ success: true, sources: activeSources.length, imported, errors });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});