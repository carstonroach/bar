'use strict';
const categories = [['beer', 'Beer'], ['wine', 'Wine'], ['liquor', 'Liquor'], ['non-alcoholic', 'Non-alcoholic']];
let previous = '';
let loading = false;
function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function validate(data) {
  if (!data || !Array.isArray(data.drinks)) throw new Error('Invalid inventory');
  if (data.catalogNote !== undefined && typeof data.catalogNote !== 'string') throw new Error('Invalid catalog note');
  if (data.updatedAt !== null && (typeof data.updatedAt !== 'string' || Number.isNaN(Date.parse(data.updatedAt)))) throw new Error('Invalid date');
  const ids = new Set();
  for (const drink of data.drinks) {
    if (!drink || typeof drink.id !== 'string' || !drink.id.trim() || ids.has(drink.id) || typeof drink.name !== 'string' || !drink.name.trim() || !categories.some(([id]) => id === drink.type) || typeof drink.class !== 'string' || !drink.class.trim() || typeof drink.available !== 'boolean') throw new Error('Invalid drink');
    ids.add(drink.id);
    for (const key of ['producer', 'origin', 'notes', 'description', 'confirmation']) if (drink[key] !== undefined && typeof drink[key] !== 'string') throw new Error('Invalid text');
    if (drink.abv !== undefined && (typeof drink.abv !== 'number' || !Number.isFinite(drink.abv) || drink.abv < 0 || drink.abv > 100)) throw new Error('Invalid ABV');
    if (drink.abvUnconfirmed !== undefined && typeof drink.abvUnconfirmed !== 'boolean') throw new Error('Invalid ABV status');
    if (drink.sources !== undefined) {
      if (!Array.isArray(drink.sources)) throw new Error('Invalid sources');
      for (const source of drink.sources) {
        if (!source || typeof source.label !== 'string' || !source.label.trim() || typeof source.url !== 'string' || new URL(source.url).protocol !== 'https:') throw new Error('Invalid source');
      }
    }
  }
  return data;
}
function render(data) {
  const menu = document.createDocumentFragment();
  if (data.catalogNote) menu.append(node('p', data.catalogNote, 'catalog-note'));
  for (const [id, title] of categories) {
    const section = node('section'); section.id = id;
    const drinks = data.drinks.filter(d => d.type === id && d.available);
    const heading = node('div', undefined, 'section-heading');
    heading.append(node('h2', title), node('span', `${drinks.length} available`, 'count')); section.append(heading);
    const classes = [...new Set(drinks.map(d => d.class))].sort((a, b) => a.localeCompare(b));
    for (const spiritClass of classes) {
      section.append(node('h3', spiritClass));
      const list = node('ul');
      for (const d of drinks.filter(d => d.class === spiritClass).sort((a, b) => a.name.localeCompare(b.name))) {
        const item = node('li'); item.append(node('h4', d.name));
        const strength = d.abv !== undefined ? `${d.abv}% ABV${d.abvUnconfirmed ? ' (label check pending)' : ''}` : 'ABV awaiting label confirmation';
        const details = [d.producer, d.origin, strength].filter(Boolean).join(' · ');
        if (details) item.append(node('p', details, 'details'));
        if (d.notes) item.append(node('p', d.notes, 'notes'));
        if (d.confirmation) item.append(node('p', d.confirmation, 'confirmation'));
        if (d.description || d.sources?.length) {
          const more = node('details', undefined, 'bottle-info');
          more.append(node('summary', 'Bottle details & sources'));
          if (d.description) more.append(node('p', d.description));
          for (const source of d.sources || []) {
            const link = node('a', `${source.label} (${new URL(source.url).hostname.replace(/^www\./, '')})`);
            link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
            more.append(link);
          }
          item.append(more);
        }
        list.append(item);
      }
      section.append(list);
    }
    if (!drinks.length) section.append(node('p', data.updatedAt ? 'None currently listed.' : 'The collection is being added. Please ask your host.', 'empty'));
    menu.append(section);
  }
  document.getElementById('menu').replaceChildren(menu);
  document.getElementById('updated').textContent = data.updatedAt ? `Collection updated ${new Intl.DateTimeFormat('en', {dateStyle:'medium', timeZone:'UTC'}).format(new Date(data.updatedAt))}` : 'Collection coming soon';
}
async function refresh() {
  if (loading) return;
  loading = true;
  try {
    const response = await fetch('inventory.json', {cache:'no-store'});
    if (!response.ok) throw new Error('Unable to load inventory');
    const data = validate(await response.json());
    const serialized = JSON.stringify(data);
    if (serialized !== previous) { render(data); previous = serialized; }
    document.getElementById('status').replaceChildren();
  } catch {
    const status = document.getElementById('status');
    status.textContent = previous ? 'We could not check for updates. The list below may be out of date.' : 'The collection could not load. Please try again or ask your host.';
    if (!previous) document.getElementById('updated').textContent = 'Collection unavailable';
    const retry = node('button', 'Try again'); retry.type = 'button'; retry.addEventListener('click', refresh); status.append(retry);
  } finally { loading = false; }
}
refresh();
setInterval(() => { if (!document.hidden) refresh(); }, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
