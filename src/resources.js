const RESOURCES = [
  // Краткость и темп
  { track: 'brevity', lang: 'ru', title: '4brain — Ораторское искусство: упражнения', url: 'https://4brain.ru/blog/ораторское-искусство-упражнения/', note: 'Упражнения на дикцию, темп и структуру речи.' },
  { track: 'brevity', lang: 'ru', title: 'RB.RU — 6 упражнений по ораторскому искусству', url: 'https://rb.ru/columns/rhetoric-exercises/', note: 'Практика, которая убирает лишнее из речи.' },
  { track: 'brevity', lang: 'en', title: 'The 3-2-1 Speaking Trick That Forces You To Stop Rambling', url: 'https://www.youtube.com/watch?v=5m-C5mwpmxU', note: 'Простая структура, чтобы перестать растекаться мыслью.' },

  // Словарный запас
  { track: 'vocabulary', lang: 'ru', title: 'Reforma.Lab — Как увеличить словарный запас', url: 'https://reforma-lab.com/kak-uvelichit-slovarniy-zapas', note: 'Методики активации пассивного словаря.' },
  { track: 'vocabulary', lang: 'ru', title: 'Лайфхакер — 12 способов расширить словарный запас', url: 'https://lifehacker.ru/kak-rasshirit-slovarnyj-zapas/', note: 'Избавление от слов-паразитов и практики.' },
  { track: 'vocabulary', lang: 'ru', title: 'Forbes Life — Как увеличить словарный запас', url: 'https://www.forbes.ru/forbeslife/500750-kak-uvelicit-slovarnyj-zapas-lucsie-metodiki-ot-filologov-i-lingvistov', note: 'Упражнения от филологов и лингвистов.' },

  // Теплота и юмор
  { track: 'warmth', lang: 'ru', title: 'Радислав Гандапас — «Камасутра для оратора»', url: 'https://www.litres.ru/search/?q=' + encodeURIComponent('Камасутра для оратора Гандапас'), note: 'Книга о харизме и подаче себя.' },
  { track: 'warmth', lang: 'ru', title: 'Сергей Шипунов — «Харизматичный оратор»', url: 'https://www.litres.ru/search/?q=' + encodeURIComponent('Харизматичный оратор Шипунов'), note: 'Книга об энергии и контакте с аудиторией.' },
  { track: 'warmth', lang: 'ru', title: 'КОРОЛЬ ГОВОРИТ! Школа ораторского искусства', url: 'https://www.youtube.com/channel/UCeSRnEiTVihLJjkjt21LOyQ', note: 'Канал: постановка голоса, речи, выступления.' },
  { track: 'warmth', lang: 'ru', title: 'Техника речи — Елена Ласкавая', url: 'https://www.youtube.com/watch?v=_nK53L4RkGY', note: 'Голос и подача.' },
  { track: 'warmth', lang: 'ru', title: 'Андрей Бурлуцкий — Курс по ораторскому мастерству', url: 'https://www.youtube.com/watch?v=ibjn37tySGI', note: 'Фундаментальный курс по технике речи.' }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RESOURCES };
}
