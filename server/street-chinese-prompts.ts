// Indo-Chinese street stall dishes (Samarth, Rudra and similar pure-veg Chinese carts).
// Used by generate-restaurant-images.ts with --street. Patterns run against the normalised dish name
// (lowercase, "(Full)/(Half)" removed, "shejwan" → "schezwan").

const PLATE = 'served on a white plate at an Indian street food stall';
const BOWL = 'in a white bowl at an Indian street food stall';

const EXACT: [RegExp, string][] = [
  [/^(special )?triple rice$/, 'veg triple schezwan rice, a mound of red schezwan fried rice and noodles on one plate, topped with crispy fried noodles, with a bowl of red schezwan veg gravy and manchurian balls, ' + PLATE],
  [/^(special )?triple noodles$/, 'veg triple schezwan noodles, red schezwan noodles and fried rice on one plate topped with crispy fried noodles, with a bowl of veg manchurian gravy, ' + PLATE],
  [/^combination rice$/, 'veg combination rice, Indo-Chinese fried rice topped with a ladle of glossy dark veg manchurian gravy with manchurian balls, ' + PLATE],
  [/^special combo rice$/, 'special combo rice, a big plate of schezwan fried rice topped with veg manchurian balls in gravy and paneer chilli pieces, garnished with spring onion, ' + PLATE],
  [/^capsicum rice$/, 'capsicum fried rice, Indo-Chinese fried rice with lots of chopped green, red and yellow capsicum and spring onion, ' + PLATE],
  [/^green peas rice$/, 'green peas fried rice, white Indo-Chinese fried rice with lots of bright green peas and spring onion, ' + PLATE],
  [/^paneer hotpan$/, 'paneer hot pan, paneer cubes, capsicum and onion in thick spicy red Indo-Chinese gravy, served sizzling in a small black iron hot pan with steam rising'],
  [/^veg hotpan$/, 'veg hot pan, mixed vegetables and manchurian balls in thick spicy red Indo-Chinese gravy, served sizzling in a small black iron hot pan with steam rising'],
  [/^paneer 65$/, 'paneer 65, bite-sized deep-fried bright red spicy paneer cubes tossed with curry leaves and green chillies, ' + PLATE],
  [/^masala manchurian$/, 'masala manchurian, fried veg manchurian balls tossed in thick spicy red-brown masala with onion and capsicum, ' + PLATE],
  [/^soyabean chilli$/, 'soya chilli dry, fried soya chunks tossed with green capsicum, onion and soy chilli sauce, ' + PLATE],
  [/^special potato spring roll$/, 'potato spring rolls, golden crispy fried rolls cut diagonally showing a spiced mashed potato filling, with red chilli sauce, ' + PLATE],
  [/^peri peri cheese$/, 'peri peri cheese potato spring rolls, golden crispy fried rolls with mashed potato filling, dusted with red peri peri spice and topped with melted cheese sauce, ' + PLATE],
  [/^peri peri mayo$/, 'peri peri mayo potato spring rolls, golden crispy fried rolls with mashed potato filling, drizzled with white mayonnaise and dusted with red peri peri spice, ' + PLATE],
  [/^tandoori sauce$/, 'tandoori potato spring rolls, golden crispy fried rolls with mashed potato filling, drizzled with orange-red smoky tandoori sauce, ' + PLATE],
  [/^paneer manchow soup$/, 'paneer manchow soup, dark brown spicy soup with chopped vegetables and small paneer cubes, topped with crispy fried noodles, ' + BOWL],
];

export function describeStreetChinese(n: string): string | null {
  const exact = EXACT.find(([re]) => re.test(n));
  if (exact) return exact[1];

  const m = n.match(/^(.*?)\s*(noodles|rice)$/);
  if (!m || /chicken|egg|mutton|prawn|fish|steam|jeera|curd|biryani/.test(n)) return null;
  const words = m[1];
  const isRice = m[2] === 'rice';
  const base = isRice ? 'Indo-Chinese fried rice' : 'stir-fried hakka noodles';

  let style = isRice ? 'white fried rice with carrot, beans, cabbage and spring onion' : 'light brown noodles with cabbage, carrot, capsicum and spring onion';
  if (/schezwan/.test(words)) style = `spicy red-orange schezwan ${isRice ? 'fried rice' : 'noodles'} with capsicum, carrot and spring onion`;
  else if (/hong kong/.test(words)) style = `dark glossy ${isRice ? 'fried rice' : 'noodles'} tossed in soy, red chilli and garlic with sliced capsicum and spring onion`;
  else if (/singapore/.test(words)) style = `yellow curry-spiced ${isRice ? 'fried rice' : 'noodles'} with sliced capsicum, carrot and spring onion`;
  else if (/garlic/.test(words)) style = `${isRice ? 'fried rice' : 'noodles'} with lots of golden fried garlic, vegetables and spring onion`;

  const adds: string[] = [];
  if (/paneer/.test(words)) adds.push('soft paneer cubes');
  if (/soya chap/.test(words)) adds.push('light golden-beige round slices of vegetarian soya chap with a visible layered, rolled texture, clearly plant-based, not meat');
  if (/manchurian/.test(words)) adds.push('round veg manchurian balls in dark sauce on top');

  const label = `${words ? words + ' ' : 'veg '}${m[2]}`;
  return `${label}, ${base}: ${style}${adds.length ? ', with ' + adds.join(' and ') : ''}, ${PLATE}`;
}
