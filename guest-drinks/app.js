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
  if (data.cocktails !== undefined) {
    if (!Array.isArray(data.cocktails)) throw new Error('Invalid cocktails');
    for (const cocktail of data.cocktails) {
      if (!cocktail || ['name', 'venue', 'ingredients'].some(key => typeof cocktail[key] !== 'string' || !cocktail[key].trim())) throw new Error('Invalid cocktail');
    }
  }
  if (data.catalogNote !== undefined && typeof data.catalogNote !== 'string') throw new Error('Invalid catalog note');
  if (data.updatedAt !== null && (typeof data.updatedAt !== 'string' || Number.isNaN(Date.parse(data.updatedAt)))) throw new Error('Invalid date');
  const ids = new Set();
  for (const drink of data.drinks) {
    if (!drink || typeof drink.id !== 'string' || !drink.id.trim() || ids.has(drink.id) || typeof drink.name !== 'string' || !drink.name.trim() || !categories.some(([id]) => id === drink.type) || typeof drink.class !== 'string' || !drink.class.trim() || typeof drink.available !== 'boolean') throw new Error('Invalid drink');
    ids.add(drink.id);
    for (const key of ['producer', 'origin', 'notes', 'description', 'confirmation']) if (drink[key] !== undefined && typeof drink[key] !== 'string') throw new Error('Invalid text');
    if (drink.abv !== undefined && (typeof drink.abv !== 'number' || !Number.isFinite(drink.abv) || drink.abv < 0 || drink.abv > 100)) throw new Error('Invalid ABV');
    if (drink.assortment !== undefined && typeof drink.assortment !== 'boolean') throw new Error('Invalid assortment');
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
  if (data.cocktails?.length) {
    const section = node('section'); section.id = 'fall-cocktails';
    const heading = node('div', undefined, 'section-heading');
    heading.append(node('h2', 'Fall signature cocktails')); section.append(heading);
    const list = node('ul');
    for (const cocktail of data.cocktails) {
      const item = node('li');
      item.append(node('h4', cocktail.name), node('p', cocktail.venue, 'details'), node('p', cocktail.ingredients, 'notes'));
      list.append(item);
    }
    section.append(list); menu.append(section);
  }
  for (const [id, title] of categories) {
    const section = node('section'); section.id = id;
    const drinks = data.drinks.filter(d => d.type === id && d.available);
    const heading = node('div', undefined, 'section-heading');
    heading.append(node('h2', title), node('span', `${drinks.length} ${drinks.some(d => d.assortment) ? 'selections' : 'available'}`, 'count')); section.append(heading);
    const classes = [...new Set(drinks.map(d => d.class))].sort((a, b) => a.localeCompare(b));
    for (const spiritClass of classes) {
      section.append(node('h3', spiritClass));
      const list = node('ul');
      for (const d of drinks.filter(d => d.class === spiritClass).sort((a, b) => a.name.localeCompare(b.name))) {
        const item = node('li'); item.append(node('h4', d.name));
        const strength = d.abv !== undefined ? `${d.abv}% ABV${d.abvUnconfirmed ? ' (label check pending)' : ''}` : d.type === 'non-alcoholic' ? '' : d.assortment ? 'ABV varies by selection' : 'ABV awaiting label confirmation';
        const details = [d.producer, d.origin, strength].filter(Boolean).join(' · ');
        if (details) item.append(node('p', details, 'details'));
        if (d.notes) item.append(node('p', d.notes, 'notes'));
        if (d.confirmation) item.append(node('p', d.confirmation, 'confirmation'));
        list.append(item);
      }
      section.append(list);
    }
    if (!drinks.length) section.append(node('p', data.updatedAt ? 'None currently listed.' : 'The collection is being added. Please ask your host.', 'empty'));
    menu.append(section);
  }
  document.getElementById('menu').replaceChildren(menu);
  document.getElementById('updated').textContent = data.updatedAt ? `updated ${new Intl.DateTimeFormat('en', {dateStyle:'medium', timeZone:'UTC'}).format(new Date(data.updatedAt))}` : 'Collection coming soon';
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
