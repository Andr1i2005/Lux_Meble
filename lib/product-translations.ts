// Per-locale overrides for product content (subtitle, category, description).
// Brand model names (e.g. "Nordvik Sofa") stay as-is across locales.
//
// The catalog resolver (lib/catalog.ts) overlays these onto the base English
// fields for the active locale. Products may also carry their own `translations`
// field (from Firebase); that takes precedence over this static overlay, so an
// admin can edit translations in the database later.

export interface ProductI18n {
  name?: string;
  subtitle?: string;
  description?: string;
  categoryLabel?: string;
}

export type ProductTranslations = Partial<Record<"pl" | "uk", ProductI18n>>;

export const productTranslations: Record<string, ProductTranslations> = {
  "nordvik-sofa": {
    pl: { subtitle: "Modułowa sofa skandynawska", categoryLabel: "Sofa", description: "Modułowa sofa w stylu skandynawskim dostępna jako 2- lub 3-osobowa oraz narożna w kształcie L, z głębokim, wygodnym siedziskiem." },
    uk: { subtitle: "Модульний скандинавський диван", categoryLabel: "Диван", description: "Модульний диван у скандинавському стилі — 2- чи 3-місний або кутовий L-подібний, з глибоким зручним сидінням." },
  },
  "classic-sofa": {
    pl: { subtitle: "Modułowa sofa tapicerowana", categoryLabel: "Sofa", description: "Modułowa sofa tapicerowana o czystych liniach i stożkowych nóżkach." },
    uk: { subtitle: "Модульний тканинний диван", categoryLabel: "Диван", description: "Модульний тканинний диван із чистими лініями та конічними ніжками." },
  },
  "oslo-armchair": {
    pl: { subtitle: "Skandynawski fotel", categoryLabel: "Fotel", description: "Skandynawski fotel z rzeźbioną, tapicerowaną skorupą i nóżkami z litego dębu." },
    uk: { subtitle: "Скандинавське крісло", categoryLabel: "Крісло", description: "Скандинавське крісло зі скульптурною м'якою основою та ніжками з масиву дуба." },
  },
  "rust-loft-sofa": {
    pl: { subtitle: "Trzyosobowa sofa tapicerowana", categoryLabel: "Sofa", description: "Ciepła, rdzawa trzyosobowa sofa z pełnymi poduszkami i smukłymi drewnianymi nóżkami — wyrazisty akcent w każdym wnętrzu." },
    uk: { subtitle: "Тримісний тканинний диван", categoryLabel: "Диван", description: "Теплий іржаво-рудий тримісний диван із пухкими подушками та тонкими дерев'яними ніжками — акцент для будь-якої кімнати." },
  },
  "brando-leather-sofa": {
    pl: { subtitle: "Sofa ze skóry pełnoziarnistej", categoryLabel: "Sofa", description: "Koniakowa skóra pełnoziarnista na drewnianej ramie, na stożkowych dębowych nóżkach. Pięknie się starzeje." },
    uk: { subtitle: "Диван зі повнозернистої шкіри", categoryLabel: "Диван", description: "Коньячна повнозерниста шкіра на дерев'яному каркасі, на конічних дубових ніжках. Гарно старіє з роками." },
  },
  "sunny-loveseat": {
    pl: { subtitle: "Kompaktowa dwuosobowa sofa", categoryLabel: "Sofa", description: "Pogodna, musztardowa sofa dwuosobowa, która mieści się w ciasnych przestrzeniach bez kompromisu w wygodzie." },
    uk: { subtitle: "Компактний двомісний диван", categoryLabel: "Диван", description: "Життєрадісний гірчичний двомісний диван, що вміщується в невеликих просторах без утрати комфорту." },
  },
  "pod-lounge-chair": {
    pl: { subtitle: "Formowany fotel", categoryLabel: "Fotel", description: "Rzeźbiarska, formowana skorupa na smukłych nóżkach — spokojny, nowoczesny akcent do kącika do czytania." },
    uk: { subtitle: "Формоване крісло", categoryLabel: "Крісло", description: "Скульптурна формована основа на тонких ніжках — спокійний сучасний акцент для куточка для читання." },
  },
  "margaux-accent-chair": {
    pl: { subtitle: "Pikowany fotel z weluru", categoryLabel: "Fotel", description: "Niewielki, pikowany fotel z weluru na toczonych nóżkach — klasyczny i figlarny zarazem." },
    uk: { subtitle: "Стьобане велюрове крісло", categoryLabel: "Крісло", description: "Невелике стьобане велюрове крісло на точених ніжках — водночас класичне й грайливе." },
  },
  "lumi-bed": {
    pl: { subtitle: "Tapicerowane łóżko King", categoryLabel: "Łóżko", description: "Miękko tapicerowany zagłówek i niska rama podestowa dla spokojnej sypialni o hotelowym standardzie." },
    uk: { subtitle: "М'яке ліжко King", categoryLabel: "Ліжко", description: "М'яко оббите узголів'я та низька платформа-рама для спокійної спальні готельного рівня." },
  },
  "birch-console": {
    pl: { subtitle: "Konsola z trzema szufladami", categoryLabel: "Stół", description: "Smukła brzozowa konsola z trzema szufladami i nóżkami hairpin — idealna do przedpokoi i korytarzy." },
    uk: { subtitle: "Консоль із трьома шухлядами", categoryLabel: "Стіл", description: "Тонка березова консоль із трьома шухлядами та ніжками-шпильками — ідеальна для передпокоїв і коридорів." },
  },
  "arc-floor-lamp": {
    pl: { subtitle: "Regulowana lampa do czytania", categoryLabel: "Oświetlenie", description: "Matowa, grafitowa lampa podłogowa z regulowaną głowicą — ukierunkowane światło do sof i kącików do czytania." },
    uk: { subtitle: "Регульована лампа для читання", categoryLabel: "Освітлення", description: "Матова графітова торшер-лампа з регульованою головою — спрямоване світло для диванів і куточків для читання." },
  },
};
