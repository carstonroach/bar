const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.textContent = ''; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; this.textContent = ''; }
  addEventListener() {}
}
const elements = Object.fromEntries(['menu', 'updated', 'status'].map(id => [id, new Element('div')]));
const inventory = JSON.parse(fs.readFileSync('guest-drinks/inventory.json', 'utf8'));
let response = inventory;
let fail = false;
const context = vm.createContext({
  URL, Intl, Date, Set, Number, JSON,
  document: {hidden: false, createElement: tag => new Element(tag), createDocumentFragment: () => new Element('fragment'), getElementById: id => elements[id], addEventListener() {}},
  fetch: async () => { if (fail) throw Error('offline'); return {ok: true, json: async () => response}; },
  setInterval() {},
});
vm.runInContext(fs.readFileSync('guest-drinks/app.js', 'utf8'), context);
const all = el => [el, ...el.children.flatMap(all)];
const clone = () => JSON.parse(JSON.stringify(inventory));
async function run() {
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(inventory.drinks.length, 39);
  assert.equal(inventory.drinks.filter(d => d.type === 'wine').length, 10);
  assert.equal(inventory.drinks.filter(d => d.type === 'liquor').length, 29);
  assert.equal(all(elements.menu).filter(el => el.tag === 'h4').length, 39);
  assert.equal(all(elements.menu).filter(el => el.tag === 'a').length, 39);
  assert.equal(all(elements.menu).filter(el => el.tag === 'details').length, 39);
  assert.equal(all(elements.menu).filter(el => el.className === 'confirmation').length, 8);
  assert(all(elements.menu).some(el => el.textContent === 'Thousand Lives Pinot Noir 2022'));
  assert(all(elements.menu).some(el => el.textContent.includes('ABV awaiting label confirmation')));
  for (const mutate of [d => d.drinks.push(d.drinks[0]), d => d.drinks[0].abv = 101, d => d.drinks[0].sources[0].url = 'javascript:alert(1)', d => d.drinks[0].confirmation = 4]) {
    context.input = clone(); mutate(context.input);
    assert.throws(() => vm.runInContext('validate(input)', context));
  }
  const old = elements.menu.children[0];
  fail = true; await vm.runInContext('refresh()', context);
  assert.equal(elements.menu.children[0], old);
  assert(elements.status.textContent.includes('may be out of date'));
  fail = false; response = clone(); response.drinks[0].available = false;
  await vm.runInContext('refresh()', context);
  assert.equal(all(elements.menu).filter(el => el.tag === 'h4').length, 38);
  assert.equal(elements.status.textContent, '');
  response = clone(); response.drinks[0].name = '<img src=x onerror=alert(1)>';
  await vm.runInContext('refresh()', context);
  assert(all(elements.menu).some(el => el.tag === 'h4' && el.textContent.startsWith('<img')));
  assert(!all(elements.menu).some(el => el.tag === 'img'));
  console.log('PASS: 39 entries, grouping, provenance, validation, offline preservation, availability and safe text rendering.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
