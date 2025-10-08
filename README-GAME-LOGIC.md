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
    # Game logic — specification

    Тук е чиста, точна и минимална спецификация на логиката за генериране и валидиране на клетки и предмети. Премахнат е примерният/описателен текст — оставям само формализирани правила и изисквания, разделени по сървър и клиент, както поискахте.

    1. Сървър

      1.1 Генериране на клетки

        Вход: `portal` (включително `layout`), `deviceType`, (по избор) `variantId`.
        Изход: масив `cells` (подходящи за клиента).

        Правила:
        - Сървърът отчита `variantSettings` (ако са налични) и/или дериватни стойности от layout-а за да определи `finalCellCount` (броя клетки за сесия).
        - Ако `variantSettings` липсват — derive default: минимум = max(1, floor(totalSlots/2)), максимум = min(totalSlots, min+2).
        - Всеки слот (cell) има следните полета: `id`, `position`, `index: string[]`, `strict?: boolean`.
        - Преди селекция server филтрира `slots` до `validSlots` — само тези слотове, за които има поне един наличен item, съвместим според правилата за съвместимост (виж 1.2).
        - От `validSlots` се избират `finalCellCount` слота. Подборът трябва да е рандомизиран, но да поддържа variety (балансиране по индекси) — цел: намаляване на повторенията между сесиите.

      1.2 Генериране на обекти

        Вход: пълен списък налични `gameItems`, избрани `cells`, `variantId`, `gameMode`.
        Изход: масив `items` (поредицата, която ще бъде изпратена на клиента) и опционално `solution` mapping (само за `t1`).

        Контракт/изисквания:
        - items.length MUST EQUAL cells.length. (Сървърът винаги подготвя толкова предмета, колкото са клетките.)
        - За всеки селектиран cell трябва да се намери exactly един item, който е съвместим със cell според правилата по-долу. Следователно броят selectedCorrectItems трябва да бъде равен на броя клетки; ако няма достатъчно подходящи item-и — сървърът трябва да попълни с joker-и или тестови placeholder-и.
        - За variant `t1`: сървърът връща и `solution` mapping (itemId -> cellId). Това е позволено само за `t1`; за останалите варианти mapping не се връща.

        Съвместимост между item и slot (server-side):
        - Ако `cell.strict === true` → позволено е само exact match: item.index === some cell.index value.
        - Ако `cell.strict !== true` → позволено е match по първа буква: item.index[0] === cellIndex[0].
          - Това е единият и единствен fallback при non-strict: първа буква. (Не използваме startsWith/префикс логика освен ако специфично не е зададено.)

        Алгоритъм (визия):
        1. Изчисли `finalCellCount`.
        2. Създай списък `validSlots` — тези слотове за които съществува поне един item, съвместим по горните правила.
        3. От `validSlots` избери `finalCellCount` слота (рандом + variety balancing).
        4. За всеки избран slot селектирай един неповтарящ се item, който отговаря на правилата (строг → exact, non-strict → first-letter).
        5. Ако липсват подходящи item-и за даден slot, използвай joker-и или тестови placeholder-и за да подсигуриш items.length === cells.length.

        Забележки за неполезни/опасни поведения:
        - Не трябва да се прилагат клиентски рестрикции (напр. специални k1 блокировки) на сървъра — сървърът е авторитетен и трябва да гарантира валидни, изпълними сесии.
        - Сървърът може да приложи lookahead/backtracking при селекция, ако риска от dead-end е реален.

    2. Клиент

      2.1 Разпределяне на обекти за `t1`

        Поведение и контракт:
        - За `t1` клиентът получава `cells`, `items` и `solution` mapping от сървъра.
        - Клиентът използва `solution` за автоматично поставяне/валидиране; когато `solution` е налично, client may rely on it for tutorial/autocomplete flows.
        - `isValidChoice` на клиента може да поддържа същите правила за валидация, но за `t1` основният източник на истината е `solution` (server-provided).

      2.2 Разпределяне/валидация за `k1`

        В обобщение: клиентът трябва да прилага същите правила както сървъра, иначе UX ще бъде несъгласуван.

        2.2.1 При `strict === true`
          - Поведение: slot позволява само exact match (item.index === slotIndex).
          - Клиентът трябва да отхвърли всички други предложения, включително префикс/first-letter.

        2.2.2 При `strict !== true` (без задължителност)
          - Поведение: allow if item.index[0] === slotIndex[0] (първа буква съвпада).
          - Никакви допълнителни блокировки за variant `k1` — няма dedicated-slot restriction. Клиентът не трябва да отказва multi-letter item в single-letter slot само защото има друг dedicated slot за този multi-letter index.
          - Клиентът може да предложи UX подсказки (напр. предпочитане на exact slots), но не бива да блокира действия, които сървърът счита за валидни.

        Забележка: ако реализирате client-side lookahead (prevent moves that create dead-ends), тя трябва да бъде само оптимистична и да не противоречи на сървърната дефиниция на съвместимост.

    3. Договор/контракт (кратко)

      - Входни данни: `portal.layout`, `gameItems`, `variantId`, `deviceType`.
      - Сървър -> Client: `cells[]` (length = N), `items[]` (length = N), `layout`, `solution?` (включено само за `t1`).
      - Сървър гарантира: items.length === cells.length и всеки item е съвместим с поне един от `cells` според описаните правила.
      - Клиентът валидира локално с `isValidChoice(slot, item, variantId, availableSlots?)`, но не нарушава server contract.

    4. Edge cases и препоръки

      - Ако за даден slot няма никакви налични предмети — сървърът не трябва да го избира в `selectedCells` или трябва да осигури joker/test предмет.
      - Не се използват различни правила на клиент и сървър — всяка специална клиентска рестрикция (особено за `k1`) трябва да бъде премахната или синхронизирана със сървъра.
      - Добавете unit тестове за `isValidChoice` (strict, non-strict first-letter) и за `generateGameSession` invariants (cells/items length, each item compatible).

    ---

    Ако искате, ще приложа още:
    - Добавяне на кратки unit тестове (`client/src/lib/game-logic.ts` → `tests/isValidChoice.test.ts`) за да застопорим правилата.
    - Актуализация на кода в `server/gameService.ts` да следва точно горните server-side правила (ако желаете да е изрично). 

    Казвайте коя стъпка да изпълня след това.
