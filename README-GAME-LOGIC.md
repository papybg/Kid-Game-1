# Описание на игровата логика (кратко ръководство)

Това README описва логиката за генериране и валидиране на игрови клетки и предмети както на сървъра, така и на клиента. Всички описания са на български и включват примерен код и обяснения за нивата `t1` и `k1`.

## 1) Логика на избор — Сървър

Сървърната логика отговоря за подготовка на игровата сесия: генерира клетките (slots), избира/селектира предметите (items) и създава окончателното решение (mapping itemId -> cellId). Това гарантира конзистентност между клиенти и позволява валидация/автокорекция.

### 1.1 Генериране на игрови клетки

Сървърът получава конфигурация (layout) и produce-ва масив от клетки с полета като:

- `id` — уникален идентификатор
- `position` — { top, left }
- `index` — масив с индекси (например `['a']`, `['ab']`, `['a','b']`)
- `strict` — булев; ако `true`, слотът изисква пълно (exact) съвпадение на индекса при поставяне

Пример (псевдо-TS):

```ts
type Slot = {
  id: string;
  position: { top: number; left: number };
  index: string[]; // един или повече индекса
  strict?: boolean;
}

function generateSlots(layout): Slot[] {
  // Пример: map-нем дефинирани клетки от layout към Slot[]
  return layout.cells.map((c, i) => ({
    id: c.id || `slot-${i}`,
    position: c.position,
    index: c.index || [c.letter],
    strict: !!c.strict
  }));
}
```

### 1.2 Генериране на игрови обекти (items)

Обектите (items) имат поне `id`, `index` (стринг) и `name`. Сървърът избира набор от предмети и формира `solution` mapping — коя клетка е предназначена за кой предмет.

Примерен алгоритъм:

1. Групирай всички налични предмети по техния `index`.
2. За всеки слот опитай да намериш неповтарящ се предмет чиито `index` съвпада (exact) с някой от slot.index.
3. Ако за някой слот няма exact свободен предмет, използвай fallback (напр. най-близък по първа буква или произволен свободен предмет).

```ts
type Item = { id: number; index: string; name: string };

function assignItemsToSlots(slots: Slot[], items: Item[]): Record<number, string> {
  const byIndex = new Map<string, Item[]>();
  for (const it of items) {
    (byIndex.get(it.index) ?? byIndex.set(it.index, []).get(it.index)!).push(it);
  }

  const solution: Record<number, string> = {}; // itemId -> cellId
  const used = new Set<number>();

  for (const s of slots) {
    let chosen: Item | undefined;
    for (const idx of s.index) {
      const list = byIndex.get(idx) ?? [];
      chosen = list.find(i => !used.has(i.id));
      if (chosen) break;
    }
    if (!chosen) chosen = items.find(i => !used.has(i.id));
    if (chosen) { solution[chosen.id] = s.id; used.add(chosen.id); }
  }
  return solution;
}
```

Бележка: сървърът може да предпочете по-сложни правила (резервиране на предмети с определена първа буква за двоиндексни клетки и т.н.), за да намали невъзможни комбинации при клиента.

## 2) Логика на избор — Клиент

Клиентът отговаря за UX: показва предметите и клетките, приеме кликове/драг & дроп и валидира поставянето преди да го приложи. Клиентът използва `isValidChoice(slot, item, variantId)` за да реши дали дадено поставяне е позволено.

Общо правило, приложено в проекта (по изискване):

- Първо: ако `slot.index` включва `item.index` (пълно съвпадение) — приемаме.
- Ако variant === 'k1':
  - Ако `slot.strict === true` — отказваме (ако exact вече не е удовлетворено)
  - Иначе (не-строг): приемаме, само ако първата буква на `item.index` съвпада с първата буква на някой `slot.index`.
- За други варианти: използваме `startsWith` (item.index.startsWith(slotIndex)).

### 2.1 Логика за избор на ниво `t1`

Ниво `t1` е просто ниво, където индексите често са цели думи/фрази и правилото е `startsWith`. Пример:

```ts
function isValidChoice_t1(slot: Slot, item: Item): boolean {
  if (slot.index.includes(item.index)) return true; // exact
  return slot.index.some(si => item.index.startsWith(si));
}
```

Това означава: ако предметът започва с текста на клетката (напр. клетка `"cat"`, предмет `"cat-1"`) — приеми.

### 2.2 Логика за избор на ниво `k1`

Ниво `k1` има по-специфични правила, които ние опростихме и направихме ясни:

- `strict === true` => само exact приемане.
- `strict !== true` => съвпадение само по първия символ на индекса — важи и когато slot.index съдържа многобуквени индекси.

Пример (реален код от `client/src/lib/game-logic.ts`):

```ts
export function isValidChoice(slot: Slot, item: Item, variantId?: string): boolean {
  // Exact match always allowed
  if (slot.index.includes(item.index)) return true;

  if (variantId === 'k1') {
    // If strict: only exact match is allowed
    if (slot.strict) return false;

    // Non-strict: match by first character
    if (!item.index || item.index.length === 0) return false;
    const c = item.index[0];
    return slot.index.some(si => si && si.length > 0 && si[0] === c);
  }

  // Default: startsWith
  return item.index ? slot.index.some(si => si && item.index.startsWith(si)) : false;
}
```

#### 2.2.1 Логика за избор на клетки с двоен индекс ("двоен индекс" като единичен низ с две букви)

Понякога слотът може да има индекс като `"ab"` (двубуквен индекс). По искане на продукта, такъв многобуквен индекс се третира като единична стойност за `k1`, но съвпадението при не-строг режим се проверява само по първата буква. Тоест, слот с индекс `"ab"` в не-строг `k1` приема предмети чиито първи символ е `"a"`.

Примери:

- Slot.index = ['ab'], slot.strict = false
  - Item.index = 'ax' => приемаме (първа буква 'a')
  - Item.index = 'ab' => приемаме (exact)
  - Item.index = 'ba' => отказ (първа буква 'b')

#### 2.2.2 Логика за избор на клетки с два индекса (slot.index.length === 2)

Друг често срещан случай е да имаме slot.index = ['a','b'] — т.е. слот, който приема предмети и от два индекса. В `k1` режим и при не-строг слот прилагаме същото правило за първа буква: проверяваме дали първият символ на item.index съвпада с първата буква на някой от двата индекса.

Примери:

- Slot.index = ['a','b'], slot.strict = false
  - Item.index = 'ax' => приемаме (match 'a')
  - Item.index = 'by' => приемаме (match 'b')
  - Item.index = 'cx' => отказ

Бележка за приоритет/поведение: ако и двата индекса съдържат същата първа буква, това е еквивалентно — приемаме.

## Допълнителни съображения и предложения

- Lookahead/checker: клиентът може да използва функция `canStillWin(remainingSlots, remainingItems)` (backtracking) за да предотврати плащане/поставяне, което ще доведе до безвъзможно решение (dead-end). Тази проверка увеличава UX (предотвратява потребителя от блокиране), но не е абсолютно необходимо ако сървърът гарантира валидни комбинации.
- Сървърна гаранция: за гарантиране, че няма невъзможни комбинации, сървърът може да резервира специфични предмети за двоиндексни слотове (например, ако слотът има ['a','b'] и някой предмет е единствен с index startingWith 'a', пази го за този слот), или да генерира сесия чрез backtracking, за да намери пълно решение преди да го върне на клиента.

## Примери — кратък набор тестове (JS)

Файл: `tools/check-isValidChoice.js` (примера се използва за бърза валидация без TS):

```js
function isValidChoice(slot, item, variantId) {
  if (!slot || !item) return false;
  if (slot.index && slot.index.includes(item.index)) return true;
  if (variantId === 'k1') {
    if (slot.strict) return false;
    const c = item.index && item.index[0];
    return (slot.index || []).some(si => si && si[0] === c);
  }
  return item.index ? (slot.index || []).some(si => item.index.startsWith(si)) : false;
}

// run assertions...
```

---

Ако желаете, мога да:

- добавя по-пълни unit тестове (Jest) за `isValidChoice` и `assignItemsToSlots`;
- напиша plain-Node детерминистичен симулатор (JS) който да пресметне статистики (брой dead-ends, prevented by lookahead и т.н.) без да се налага да изграждаме или поправяме TS-зависимостите в момента;
- синхронизирам поведението с `server/gameService.ts` (ако искате да приложа exact-firstchar логиката и там).

Казвайте коя опция предпочитате и продължавам (на български). 
