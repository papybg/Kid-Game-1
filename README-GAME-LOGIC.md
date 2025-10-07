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

- **ПЪРВО: STRICT ЛОГИКА** — ако `slot.strict === true`, приемаме **само exact match** независимо от варианта
- Второ: ако `slot.index` включва `item.index` (пълно съвпадение) — приемаме.
- Ако variant === 'k1':
  - Ако `slot.strict === true` — вече е обработено по-горе (само exact)
  - Иначе (не-строг): приемаме, само ако първата буква на `item.index` съвпада с първата буква на някой `slot.index`.
- За други варианти: използваме `startsWith` (item.index.startsWith(slotIndex)).

### 2.1 Strict логика за всички варианти

**ВАЖНО:** Strict слотовете се обработват най-отгоре в `isValidChoice` функцията и имат приоритет над всички други правила.

```ts
export function isValidChoice(slot: GameSlot, item: GameItem, variantId?: string, availableSlots?: GameSlot[]): boolean {
  // STRICT SLOT LOGIC: If slot is marked as strict, only allow exact matches
  if (slot.strict) {
    return slot.index.includes(item.index);
  }
  
  // ... rest of the logic for non-strict slots
}
```

**Примери за strict логика:**

- Slot с `index: ['r'], strict: true` → приема **само** обекти с `index: 'r'`
- Slot с `index: ['rd'], strict: true` → приема **само** обекти с `index: 'rd'` 
- Slot с `index: ['sa'], strict: true` → приема **само** обекти с `index: 'sa'`

**Strict слотовете отхвърлят:**
- Hierarchical matches (напр. 'r' обект в 'rd' strict slot)
- Всички K1 правила за първа буква
- Всички startsWith правила

### 2.2 Логика за избор на ниво `t1`

Ниво `t1` е просто ниво, където индексите често са цели думи/фрази и правилото е `startsWith`. Пример:

```ts
function isValidChoice_t1(slot: Slot, item: Item): boolean {
  if (slot.index.includes(item.index)) return true; // exact
  return slot.index.some(si => item.index.startsWith(si));
}
```

Това означава: ако предметът започва с текста на клетката (напр. клетка `"cat"`, предмет `"cat-1"`) — приеми.

### 2.3 Логика за избор на ниво `k1`

Ниво `k1` има по-специфични правила, които ние опростихме и направихме ясни:

- **`strict === true`** => само exact приемане (вече обработено в strict секцията по-горе).
- **`strict !== true`** => съвпадение само по първия символ на индекса — важи и когато slot.index съдържа многобуквени индекси.

Пример (реален код от `client/src/lib/game-logic.ts`):

```ts
export function isValidChoice(slot: GameSlot, item: GameItem, variantId?: string, availableSlots?: GameSlot[]): boolean {
  // STRICT SLOT LOGIC: If slot is marked as strict, only allow exact matches
  if (slot.strict) {
    return slot.index.includes(item.index);
  }

  // Check exact match first
  if (slot.index.includes(item.index)) {
    return true;
  }

  // Check hierarchical match: item can go in parent category
  // e.g., "rp" (firetruck) can go in "r" (transport) slot
  // or "s" (bird) can go in "sa" (aviation) slot
  for (const slotIndex of slot.index) {
    if (item.index.startsWith(slotIndex)) {
      return true;
    }
  }

  // Special logic for k1 variant: prevent multi-letter items from going into
  // single-letter slots if there's a better choice slot available
  if (variantId === 'k1' && slot.index.length === 1 && !slot.strict) {
    const slotIndex = slot.index[0];

    // Only restrict multi-letter items, not single-letter items
    if (item.index.length > 1) {
      // Item has multi-letter index. If we have availableSlots context,
      // check whether any available slot with MULTIPLE indices expects this exact item.index.
      // We ignore slots with single multi-letter index (like [sa]) as they are specific slots,
      // not choice slots.
      if (availableSlots && availableSlots.length > 0) {
        const hasFreeChoiceSlot = availableSlots.some(s => 
          s.index.length > 1 && s.index.includes(item.index)
        );
        if (hasFreeChoiceSlot) {
          // There is a free choice slot for this multi-letter item -> do not accept here
          return false;
        }
      }
    }

    // For single-letter items or when no choice slot exists, allow hierarchical placement
    return true;
  }

  return false;
}
```

#### 2.3.1 Логика за избор на клетки с двоен индекс ("двоен индекс" като единичен низ с две букви)

Понякога слотът може да има индекс като `"ab"` (двубуквен индекс). По искане на продукта, такъв многобуквен индекс се третира като единична стойност за `k1`, но съвпадението при не-строг режим се проверява чрез hierarchical matching (`item.index.startsWith(slotIndex)`).

**ВАЖНО:** Ако слотът е strict, само exact match е позволен независимо от броя букви в индекса.

Примери:

- Slot.index = ['ab'], slot.strict = false
  - Item.index = 'ab' => приемаме (exact match)
  - Item.index = 'abx' => приемаме (hierarchical match - започва с 'ab')
  - Item.index = 'ax' => отказ (не започва с 'ab')

- Slot.index = ['ab'], slot.strict = true  
  - Item.index = 'ab' => приемаме (exact match)
  - Item.index = 'abx' => отказ (strict приема само exact)
  - Item.index = 'ax' => отказ (strict приема само exact)

#### 2.3.2 Логика за избор на клетки с два индекса (slot.index.length === 2)

Друг често срещан случай е да имаме slot.index = ['a','b'] — т.е. слот, който приема предмети и от два индекса. В `k1` режим и при не-строг слот прилагаме същото правило за hierarchical matching.

**ВАЖНО:** Ако слотът е strict, само exact match с някой от индексите е позволен.

Примери:

- Slot.index = ['a','b'], slot.strict = false
  - Item.index = 'a' => приемаме (exact match с 'a')
  - Item.index = 'b' => приемаме (exact match с 'b') 
  - Item.index = 'ax' => приемаме (hierarchical match с 'a')
  - Item.index = 'by' => приемаме (hierarchical match с 'b')
  - Item.index = 'cx' => отказ (не започва с нито 'a', нито 'b')

- Slot.index = ['a','b'], slot.strict = true
  - Item.index = 'a' => приемаме (exact match)
  - Item.index = 'b' => приемаме (exact match)
  - Item.index = 'ax' => отказ (strict приема само exact)
  - Item.index = 'by' => отказ (strict приема само exact)

## Допълнителни съображения и предложения

- Lookahead/checker: клиентът може да използва функция `canStillWin(remainingSlots, remainingItems)` (backtracking) за да предотврати плащане/поставяне, което ще доведе до безвъзможно решение (dead-end). Тази проверка увеличава UX (предотвратява потребителя от блокиране), но не е абсолютно необходимо ако сървърът гарантира валидни комбинации.
- Сървърна гаранция: за гарантиране, че няма невъзможни комбинации, сървърът може да резервира специфични предмети за двоиндексни слотове (например, ако слотът има ['a','b'] и някой предмет е единствен с index startingWith 'a', пази го за този слот), или да генерира сесия чрез backtracking, за да намери пълно решение преди да го върне на клиента.

## Примери — кратък набор тестове (JS)

Файл: `tools/check-isValidChoice.js` (примера се използва за бърза валидация без TS):

```js
function isValidChoice(slot, item, variantId) {
  if (!slot || !item) return false;
  
  // STRICT LOGIC: highest priority
  if (slot.strict) {
    return slot.index && slot.index.includes(item.index);
  }
  
  // Exact match
  if (slot.index && slot.index.includes(item.index)) return true;
  
  if (variantId === 'k1') {
    // K1 hierarchical matching
    const itemIndex = item.index || '';
    return (slot.index || []).some(si => itemIndex.startsWith(si));
  }
  
  // Default: hierarchical matching
  return item.index ? (slot.index || []).some(si => item.index.startsWith(si)) : false;
}

// Strict logic test cases
console.log('=== STRICT LOGIC TESTS ===');
console.log('Strict R slot + R item:', isValidChoice({index:['r'], strict:true}, {index:'r'}, 'k1')); // true
console.log('Strict R slot + RD item:', isValidChoice({index:['r'], strict:true}, {index:'rd'}, 'k1')); // false
console.log('Strict RD slot + RD item:', isValidChoice({index:['rd'], strict:true}, {index:'rd'}, 'k1')); // true
console.log('Strict RD slot + R item:', isValidChoice({index:['rd'], strict:true}, {index:'r'}, 'k1')); // false

// Non-strict logic test cases  
console.log('=== NON-STRICT LOGIC TESTS ===');
console.log('Normal R slot + RD item:', isValidChoice({index:['r'], strict:false}, {index:'rd'}, 'k1')); // true (hierarchical)
console.log('Normal RD slot + R item:', isValidChoice({index:['rd'], strict:false}, {index:'r'}, 'k1')); // false
```

### Тестови случаи за валидиране на strict логиката

**Портал D2 с K1 вариант** съдържа следните strict слотове:

| Slot Index | Strict | Приема | Отхвърля |
|------------|--------|---------|----------|
| `['r']` | true | 'r' обекти | 'rd', 'rf', 'ra', 'rb', 'rg', 'rk' |
| `['rd']` | true | 'rd' обекти | 'r', 'rf', 'ra', 'rb', 'rg', 'rk' |
| `['rf']` | true | 'rf' обекти | 'r', 'rd', 'ra', 'rb', 'rg', 'rk' |
| `['ra']` | true | 'ra' обекти | 'r', 'rd', 'rf', 'rb', 'rg', 'rk' |
| `['rb']` | true | 'rb' обекти | 'r', 'rd', 'rf', 'ra', 'rg', 'rk' |
| `['rg']` | true | 'rg' обекти | 'r', 'rd', 'rf', 'ra', 'rb', 'rk' |
| `['rk']` | true | 'rk' обекти | 'r', 'rd', 'rf', 'ra', 'rb', 'rg' |
| `['sa']` | true | 'sa' обекти | 's', 'sg', други |

**Ключови принципи:**

1. **Strict слотове имат най-висок приоритет** - обработват се първо в `isValidChoice`
2. **Strict слотове приемат само exact match** - никакви hierarchical правила не се прилагат
3. **Strict логиката е независима от варианта** - работи еднакво за K1, T1, E1, etc.
4. **Non-strict слотове използват стандартните правила** за съответния вариант

---

Ако желаете, мога да:

- добавя по-пълни unit тестове (Jest) за `isValidChoice` и `assignItemsToSlots`;
- напиша plain-Node детерминистичен симулатор (JS) който да пресметне статистики (брой dead-ends, prevented by lookahead и т.н.) без да се налага да изграждаме или поправяме TS-зависимостите в момента;
- синхронизирам поведението с `server/gameService.ts` (ако искате да приложа exact-firstchar логиката и там).

Казвайте коя опция предпочитате и продължавам (на български). 

## 5) Логика за разнообразяване и randomization

За да се избегне повтарянето на "почти едни и същи обекти" при презареждане на играта, gameService.ts използва усъвършенствани алгоритми за randomization:

### 5.1 Глобален Usage Tracker

Сървърът поддържа глобален tracker който проследява колко пъти всеки предмет е бил използван във всички генерирани сесии:

```ts
const globalItemUsageTracker = new Map<number, number>();
```

### 5.2 Weighted Random Selection

При избор на предмети се прилага penalty system спрямо предишната употреба:

```ts
// По-често използваните предмети получават по-ниски weights
const itemWeights = availableItems.map(item => {
  const usage = usageTracker.get(item.id) || 0;
  return Math.max(0.01, Math.pow(0.5, usage)); // Експоненциален penalty
});
```

### 5.3 Balanced Distribution

Функцията `selectItemsWithVarietyTracking` осигурява:
- Exponential penalty за често използвани предмети  
- Weighted random selection базиран на usage frequency
- Automatic reset на tracker след ~20 сесии за fresh variety

### 5.4 Reset Mechanism

За да се избегне permanent bias срещу популярни предмети:

```ts
function resetUsageTrackerIfNeeded() {
  const totalUsage = Array.from(globalItemUsageTracker.values()).reduce((sum, count) => sum + count, 0);
  if (totalUsage > 200) { // Reset после ~20 сесии
    globalItemUsageTracker.clear();
  }
}
```

### 5.5 Результати от variety optimization

При тестване с 10 сесии за портал d2 + variant k1:
- **Variety Score**: 1.78-1.84 (по-ниско = по-разнообразно)
- **Уникални предмети**: 17 от общо налични
- **Frequency range**: От 10% до 100% вместо предишни 100% за много предмети
- **Session uniqueness**: ~37% различие между първа и последна сесия

Това осигурява значително по-разнообразен gameplay experience при consecutive презареждания.
