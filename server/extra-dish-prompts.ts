// Extra dish descriptions for AI menu images (Nikhara, Elite and similar menus): mandi, kebabs, fish/prawns,
// Indo-Chinese variants, soups, ice-creams, cones, grills, etc. Checked BEFORE the generic rules in
// generate-restaurant-images.ts. Patterns run against the normalised dish name (lowercase, sizes removed).

const bowl = 'served in a round steel serving bowl, garnished with fresh coriander';
const soupBowl = 'in a white ceramic soup bowl with a spoon';
const mandi = (meat: string) =>
  `Arabian mandi platter, a large round metal tray of long-grain yellow and white mandi rice with ${meat} on top, ` +
  'sprinkled with fried onions, cashews and raisins, small bowls of green chutney and tomato salsa on the side';
const scoop = (flavour: string) => `a scoop of ${flavour} ice-cream in a small glass bowl with a wafer`;
const cone = (flavour: string) => `a crisp waffle ice-cream cone topped with a swirl of ${flavour} ice-cream, held upright in a cone stand`;

export const EXTRA: [RegExp, string][] = [
  // ---------- Elite: fries, grills, sandwiches ----------
  [/special loaded fries/, 'loaded fries, crispy french fries topped with melted cheese sauce, mayo drizzle, chopped onion and jalapenos, in a basket'],
  [/chocolate cheese grill/, 'grilled sandwich triangles filled with molten chocolate and melted cheese, grill marks, on a plate'],
  [/^cheese sandwich/, 'cheese sandwich, white bread triangles with thick slices of yellow cheese and butter, on a plate'],
  [/club sandwich/, 'veg club sandwich, triple-decker toasted sandwich with lettuce, tomato, cucumber, cheese and mayo, cut in triangles with toothpicks, on a plate with fries'],
  [/fresh mango sundae/, 'fresh mango sundae in a tall glass, layers of vanilla ice-cream and fresh mango cubes with mango pulp on top'],
  [/fresh strawberry sundae/, 'fresh strawberry sundae in a tall glass, layers of vanilla ice-cream and fresh strawberry pieces with strawberry sauce on top'],
  [/crunchy finger/, 'crunchy veg fingers, golden breaded crispy finger-shaped veg sticks on a plate with ketchup'],
  [/cheese chilli grill/, 'grilled cheese chilli sandwich, toasted triangles with melted cheese and green chilli filling, grill marks, on a plate with ketchup'],
  [/nutella chocolate grill/, 'grilled sandwich triangles oozing Nutella chocolate spread, dusted with powdered sugar, on a plate'],
  [/paneer makhani grill/, 'grilled sandwich triangles filled with paneer in orange makhani sauce, grill marks, on a plate with ketchup'],
  [/mayo grill/, 'grilled veg mayonnaise sandwich triangles with creamy mayo and vegetable filling, grill marks, on a plate'],
  [/cheese grill/, 'grilled cheese sandwich triangles with melted cheese pulling out, grill marks, on a plate with ketchup'],
  [/bread butter/, 'two slices of soft white bread spread with butter, on a plate'],
  // ---------- Elite: ice-cream ----------
  [/american nuts ice cream/, scoop('american nuts, creamy vanilla with mixed nuts')],
  [/anjeer ice cream/, scoop('anjeer (fig), light pink with fig pieces')],
  [/black current ice cream/, scoop('black currant, purple with berry pieces')],
  [/butter scotch ice cream/, scoop('butterscotch, pale yellow with crunchy praline bits')],
  [/chocolate ice cream/, scoop('dark chocolate')],
  [/kesar pista ice cream/, scoop('kesar pista, saffron-yellow with chopped pistachios')],
  [/pista ice cream/, scoop('pista, pale green with chopped pistachios')],
  [/rajbhog ice cream/, scoop('rajbhog, saffron-yellow with dry fruits')],
  [/sitafal ice cream/, scoop('sitafal (custard apple), creamy white')],
  [/strawberry ice cream/, scoop('strawberry, pink')],
  [/vanilla ice cream/, scoop('vanilla, creamy white')],
  [/block buster candy/, 'a large chocolate-coated ice-cream candy bar on a stick with a bite taken, on a plate'],
  [/cassatta/, 'a slice of cassata ice-cream with layers of pink, green and white ice-cream and a sponge cake base, on a plate'],
  [/chocobar/, 'a chocolate-coated vanilla ice-cream bar on a wooden stick, on a plate'],
  [/malai kulfi/, 'malai kulfi, a creamy white kulfi on a stick garnished with chopped pistachios, on a plate'],
  [/matka kulfi/, 'matka kulfi, creamy kulfi set in a small clay pot topped with pistachios and saffron'],
  [/raspberry dolly/, 'a bright red raspberry ice lolly on a stick, on a plate'],
  [/mango dolly/, 'a bright orange mango ice lolly on a stick, on a plate'],
  [/zulu bar/, 'a chocolate-coated ice-cream bar on a stick, on a plate'],
  [/strawberry blast/, 'a tall glass of thick pink fresh strawberry shake topped with ice-cream and fresh strawberries'],
  [/mango blast/, 'a tall glass of thick orange fresh mango shake topped with mango ice-cream and mango cubes'],
  [/espresso/, 'a small cup of espresso coffee with crema on a saucer'],
  [/hot chocolate/, 'a mug of hot chocolate with a swirl of cream and cocoa dusting'],
  [/soft drink/, 'a glass of chilled dark cola with ice cubes and fizz'],
  [/water bottle/, 'a plain sealed clear plastic drinking water bottle with condensation, no label'],

  // ---------- Nikhara: mandi & kepsa ----------
  [/nikhara platter mandi|mix mandi/, mandi('a mix of tandoori chicken, fried chicken and juicy mutton pieces')],
  [/raan mandi/, mandi('a whole roasted leg of mutton (raan)')],
  [/al faham mandi/, mandi('charcoal-grilled golden Arabian al-faham chicken')],
  [/tandoori mandi/, mandi('red tandoori chicken pieces')],
  [/chicken fry mandi/, mandi('crispy golden fried chicken pieces')],
  [/mutton fry mandi/, mandi('dry-fried dark mutton pieces')],
  [/afghani mandi/, mandi('creamy white Afghani-style mutton pieces')],
  [/juicy mandi/, mandi('tender juicy steamed mutton pieces on the bone')],
  [/marag mandi/, mandi('mutton pieces with a bowl of clear mutton marag soup beside it')],
  [/mandi/, mandi('tender meat pieces')],
  [/kepsa rice chinese/, 'chicken kabsa rice with an Indo-Chinese twist, fried rice with chicken pieces, spring onion and soy, on a large plate'],
  [/kepsa/, 'chicken kabsa, Arabian spiced orange-tinted long-grain rice with chicken pieces, almonds and raisins, on a large plate'],
  [/raan/, 'a whole roasted leg of meat (raan) coated in dark red spicy masala, on a large platter with onion rings and lemon'],
  [/al faham|alfaham/, 'Arabian al-faham chicken, charcoal-grilled golden-brown chicken with char marks, on a plate with garlic dip and salad'],
  [/afghani leg piece/, 'one Afghani chicken leg piece, creamy white grilled chicken leg with char marks, on a plate with onion rings'],

  // ---------- Nikhara: kebabs & tandoori ----------
  [/afghani tandoori|afghani kebab/, 'Afghani chicken, creamy white marinated grilled chicken pieces with light char marks, on a plate with onion rings and lemon'],
  [/malai kebab|reshmi kebab/, 'chicken malai kebab, creamy pale white grilled boneless chicken pieces with light char marks, on a plate with onion rings and mint chutney'],
  [/barra/, 'chicken barra, large charred red-brown tandoori chicken pieces on the bone, on a plate with onion rings and lemon'],
  [/mumtaz tandoori/, 'tandoori chicken with a rich creamy masala coating, charred pieces on a plate with onion rings and lemon'],
  [/mix tandoori chicken platter/, 'large mixed tandoori platter with tandoori chicken, malai kebab, seekh kebab and tikka pieces, onion rings and lemon'],
  [/seekh kebab|seek kebab/, 'long grilled minced meat seekh kebabs with char marks, on a plate with onion rings, lemon and mint chutney'],
  [/banjara kebab/, 'banjara chicken kebab, spicy dark red-brown grilled boneless chicken pieces with char marks, on a plate with onion rings'],
  [/tikka kebab/, 'chicken tikka, charred orange-red boneless chicken tikka pieces, on a plate with onion rings, lemon and mint chutney'],
  [/(malaysian|singapuri) kebab/, 'grilled boneless chicken kebab pieces glazed in a sweet-spicy sauce with sesame, on a plate with onion rings'],
  [/dahi lasuni kebab/, 'chicken dahi lasuni kebab, creamy yogurt-garlic marinated grilled boneless chicken pieces with char marks, on a plate'],
  [/juicy kebab/, 'juicy mutton kebabs, grilled tender mutton pieces with char marks, on a plate with onion rings and lemon'],
  [/turki kebab/, 'Turkish-style grilled mutton kebabs, on a plate with onion rings, lemon and garlic dip'],
  [/kebab/, 'grilled meat kebab pieces with char marks, on a plate with onion rings, lemon and mint chutney'],

  // ---------- Nikhara: fish, prawns & Chinese starters ----------
  [/fish 65/, 'fish 65, bite-sized deep-fried red spicy boneless fish pieces with curry leaves, on a plate'],
  [/fish chilli/, 'chilli fish, Indo-Chinese crispy fish pieces tossed with green capsicum, onion and soy chilli sauce, on a plate'],
  [/fish dragon/, 'dragon fish, crispy fried fish strips tossed in red-hot sweet-spicy sauce with cashews and sesame, on a plate'],
  [/fish finger/, 'fish fingers, golden breaded crispy fish sticks on a plate with tartare dip and lemon'],
  [/fish fry/, 'fish fry, rava-coated pan-fried fish slices with red masala, on a plate with onion rings and lemon'],
  [/fish tikka/, 'fish tikka, charred orange tandoori boneless fish pieces, on a plate with onion rings and lemon'],
  [/prawns chilli/, 'chilli prawns, Indo-Chinese crispy prawns tossed with green capsicum, onion and soy chilli sauce, on a plate'],
  [/prawns garlic butter/, 'garlic butter prawns, juicy prawns in glossy garlic butter sauce with parsley, on a plate'],
  [/chicken 89/, 'chicken 89, deep-fried boneless chicken pieces tossed in spicy red-orange yogurt-chilli sauce, on a plate'],
  [/crystal/, 'crystal chicken, crispy boneless chicken tossed in a glossy translucent sweet-chilli sauce with spring onion, on a plate'],
  [/green lemon chilli/, 'green lemon chilli chicken, crispy boneless chicken tossed in green chilli lemon sauce with coriander, on a plate'],
  [/kantaki/, 'crispy fried chicken pieces with a crunchy golden-brown breaded coating, piled on a plate with ketchup'],
  [/kharda/, '__MEAT__ tossed in coarse green chilli-garlic kharda thecha, dry, on a plate with onion rings'],
  [/lollipop dry|masala lollipop/, 'chicken lollipops tossed in thick dry red masala with spring onion, bone handles visible, on a plate'],
  [/schezwan dry/, 'schezwan chicken dry, crispy boneless chicken tossed in spicy red schezwan sauce with capsicum and onion, on a plate'],
  [/teriyaki/, 'chicken teriyaki, glossy dark teriyaki-glazed boneless chicken pieces with sesame seeds and spring onion, on a plate'],
  [/crush pepper/, 'crushed pepper chicken, dry boneless chicken tossed with coarsely crushed black pepper and curry leaves, on a plate'],
  [/hot plate/, 'sizzling chicken on a hot iron sizzler plate with onions, capsicum and steam rising'],
  [/mutton dry/, 'mutton dry, dark spicy dry-roasted mutton pieces with onions and curry leaves, on a plate with lemon'],
  [/chicken dry/, 'chicken dry, Indo-Chinese crispy boneless chicken tossed in dark soy-chilli sauce with spring onion, on a plate'],

  // ---------- Nikhara: Chinese rice & noodles (non-veg) ----------
  [/egg schezwan fried rice/, 'egg schezwan fried rice, spicy red-orange fried rice with scrambled egg and spring onion, on a white plate'],
  [/egg fried rice/, 'egg fried rice, Indo-Chinese fried rice with scrambled egg bits, carrot, beans and spring onion, on a white plate'],
  [/prawns schezwan fried rice/, 'prawns schezwan fried rice, spicy red-orange fried rice with pink prawns and spring onion, on a white plate'],
  [/prawns fried rice/, 'prawns fried rice, Indo-Chinese fried rice with pink prawns, egg and spring onion, on a white plate'],
  [/mix fried rice/, 'mixed fried rice, Indo-Chinese fried rice with chicken, prawns, egg and spring onion, on a white plate'],
  [/chicken schezwan (fried|combination) rice/, 'chicken schezwan fried rice, spicy red-orange fried rice with chicken bits and spring onion, on a white plate'],
  [/chicken triple fried rice/, 'chicken triple schezwan rice, fried rice and noodles on one plate with a bowl of red schezwan gravy and crispy fried noodles on top'],
  [/chicken (singapuri|hong kong) fried rice/, 'chicken $1 fried rice, Indo-Chinese fried rice with chicken bits, vegetables and a spicy red tint, on a white plate'],
  [/chicken (chopper|combination) fried rice/, 'chicken combination fried rice, fried rice with chicken pieces in a little chilli gravy on top, on a white plate'],
  [/egg schezwan noodle/, 'egg schezwan noodles, spicy red-orange stir-fried noodles with scrambled egg and vegetables, on a white plate'],
  [/egg noodle/, 'egg hakka noodles, light brown stir-fried noodles with scrambled egg, cabbage and spring onion, on a white plate'],
  [/prawns schezwan noodle/, 'prawns schezwan noodles, spicy red-orange stir-fried noodles with pink prawns, on a white plate'],
  [/prawns noodle/, 'prawns hakka noodles, stir-fried noodles with pink prawns, cabbage and spring onion, on a white plate'],
  [/mix noodle/, 'mixed hakka noodles, stir-fried noodles with chicken, prawns, egg and vegetables, on a white plate'],
  [/chicken schezwan (combination )?noodle/, 'chicken schezwan noodles, spicy red-orange stir-fried noodles with shredded chicken and vegetables, on a white plate'],
  [/chicken (chopper|combination) noodle/, 'chicken combination noodles, stir-fried noodles with chicken pieces in a little chilli gravy on top, on a white plate'],
  [/chicken (singapuri|hong kong) noodle/, 'chicken $1 noodles, thin stir-fried noodles with chicken, vegetables and a spicy red tint, on a white plate'],
  [/chicken noodle/, 'chicken hakka noodles, light brown stir-fried noodles with shredded chicken, cabbage, carrot and spring onion, on a white plate'],

  // ---------- Soups ----------
  [/chicken clear soup/, `chicken clear soup, light clear broth with shredded chicken and vegetables, ${soupBowl}`],
  [/chicken hot and sour soup/, `chicken hot and sour soup, thick dark brown spicy soup with shredded chicken, ${soupBowl}`],
  [/chicken lemon coriander soup/, `chicken lemon coriander soup, clear soup with shredded chicken and coriander, lemon wedge, ${soupBowl}`],
  [/chicken manchow soup/, `chicken manchow soup, dark brown spicy soup with chicken, topped with crispy fried noodles, ${soupBowl}`],
  [/chicken sweetcorn soup|chicken sweet corn soup/, `chicken sweet corn soup, thick creamy pale yellow soup with corn and shredded chicken, ${soupBowl}`],
  [/chicken shorba/, `chicken shorba, thin spiced golden-brown Indian chicken broth with coriander, ${soupBowl}`],
  [/mutton shorba/, `mutton shorba, thin spiced brown mutton broth with coriander, ${soupBowl}`],
  [/veg clear soup/, `veg clear soup, light clear broth with chopped vegetables, ${soupBowl}`],

  // ---------- Nikhara: chicken / mutton / egg mains ----------
  [/chicken murg musallam/, 'murgh musallam, a whole roasted chicken sitting in rich thick brown-orange gravy, garnished with halved boiled eggs and coriander, in a large oval dish'],
  [/murg ra ra/, `chicken raara, chicken pieces in thick spicy gravy with minced chicken kheema, ${bowl}`],
  [/afghani/, `chicken Afghani, boneless chicken pieces in creamy white cashew gravy, ${bowl}`],
  [/lahori/, `chicken Lahori, boneless chicken in rich red-brown spicy Lahori gravy, ${bowl}`],
  [/(lajwab|laziz)/, `__MEAT__ in rich creamy brown gravy garnished with cream and cashews, ${bowl}`],
  [/maratha/, `__MEAT__ in fiery dark red Maharashtrian masala gravy, ${bowl}`],
  [/chicken stew/, 'chicken stew, chicken and vegetables in mild creamy white coconut milk stew, in a bowl'],
  [/tava/, `__MEAT__ cooked on a flat iron tawa in thick dark spicy masala, served on the tawa`],
  [/egg curry/, 'egg curry, halved boiled eggs in thin spicy red curry, in a steel bowl with coriander'],
  [/egg masala/, 'egg masala, boiled eggs in thick brown onion-tomato masala gravy, in a steel bowl with coriander'],
  [/bheja fry/, 'mutton bheja fry, soft scrambled goat brain cooked with onion, tomato and spices, on a plate with lemon'],
  [/bheja masala/, `mutton bheja masala, soft goat brain pieces in thick brown masala gravy, ${bowl}`],
  [/dabba gosht/, 'dabba gosht, baked mutton and macaroni in creamy egg-topped gravy, golden on top, in a steel dabba (round tin)'],
  [/mutton kheema fry/, 'mutton kheema fry, dry spicy minced mutton with green peas, garnished with coriander, in a steel bowl with lemon'],
  [/veg schezwan (combination )?noodle/, 'veg schezwan noodles, spicy red-orange stir-fried noodles with cabbage, carrot, capsicum and spring onion, on a white plate'],
  [/veg singapuri noodle/, 'veg singapuri noodles, thin stir-fried noodles with vegetables and a mild yellow curry tint, on a white plate'],
  [/mutton kheema/, 'mutton kheema, minced mutton in thick brown masala gravy with green peas, garnished with coriander, in a steel bowl'],
  [/paya/, 'mutton paya, goat trotters in thin spicy brown soupy gravy, in a bowl with coriander'],
  [/dalcha khana/, 'mutton dalcha with bagara rice, a bowl of yellowish-brown lentil and mutton stew beside a plate of spiced bagara rice'],
  [/hyderabadi dum biryani/, 'Hyderabadi chicken dum biryani, long-grain saffron and white basmati rice layered with chicken pieces, fried onions and mint, served on a plate with raita'],
  [/lucknowi dum biryani/, 'Lucknowi chicken dum biryani, mild fragrant white and pale saffron basmati rice with chicken pieces, served on a plate with raita'],

  // ---------- Rice, breads, desserts (veg, Nikhara) ----------
  [/biryani rice/, 'plain biryani rice, fragrant long-grain saffron and white basmati rice with fried onions and mint only, in a bowl'],
  [/bagara rice/, 'bagara rice, fragrant Hyderabadi basmati rice with whole spices, fried onions and mint, in a bowl'],
  [/indrayani rice/, 'plain steamed white short-grain Indrayani rice in a steel bowl'],
  [/bajari bhakari/, 'bajra bhakri, round grey-brown millet flatbreads stacked on a steel plate'],
  [/jwari bhakari/, 'jowar bhakri, round pale off-white sorghum flatbreads stacked on a steel plate'],
  [/chapati/, 'soft thin wheat chapatis stacked on a steel plate'],
  [/peri peri naan/, 'peri peri naan, soft leavened flatbread sprinkled with red peri peri spice and butter, in a basket'],
  [/rumali/, 'rumali roti, very thin large soft flatbread folded like a handkerchief on a plate'],
  [/caramel custard/, 'caramel custard, a wobbly flan topped with glossy brown caramel sauce, on a plate'],
  [/gulab jamun/, 'gulab jamun, soft dark brown dumplings soaked in sugar syrup, in a small bowl'],
  [/kaju curry/, `kaju curry, whole roasted cashew nuts in creamy orange-brown gravy, ${bowl}`],
  [/lasuni methi/, `lasooni methi, fenugreek leaves in green gravy topped with golden fried garlic, ${bowl}`],
  [/malai kofta/, `malai kofta, soft paneer-potato dumplings in smooth creamy pale yellow gravy with cream, ${bowl}`],
  [/methi chaman/, `methi chaman, paneer cubes in smooth green fenugreek and spinach gravy, ${bowl}`],
  [/milk methi/, `methi malai, fenugreek leaves in creamy white milk gravy, ${bowl}`],
  [/mix veg/, `mix veg, mixed vegetables (carrot, beans, peas, cauliflower, capsicum) in thick masala gravy, ${bowl}`],
  [/veg hariyali/, `veg hariyali, mixed vegetables in smooth green spinach-mint-coriander gravy, ${bowl}`],
];

// Ice-cream cones: "<flavour> Cone"
const CONE_FLAVOURS: Record<string, string> = {
  'block buster': 'chocolate and vanilla, dipped in chocolate with nuts',
  'butter scotch': 'butterscotch with praline bits',
  'chocolate': 'chocolate, dipped in chocolate',
  'dark chocolate': 'dark chocolate, dipped in dark chocolate',
  'raspberry': 'pink raspberry',
  'world': 'vanilla, dipped in chocolate with chopped nuts',
};

const MEAT_WORD = (n: string) =>
  n.includes('mutton') ? 'tender mutton pieces' : n.includes('fish') ? 'fish pieces' : n.includes('prawn') ? 'prawns' : 'boneless chicken pieces';

export function describeExtra(normName: string): string | null {
  const coneM = normName.match(/^(.*) cone$/);
  if (coneM && CONE_FLAVOURS[coneM[1]]) return cone(CONE_FLAVOURS[coneM[1]]);
  for (const [re, text] of EXTRA) {
    const m = normName.match(re);
    if (m) return text.replace('$1', m[1] ?? '').replace('__MEAT__', MEAT_WORD(normName));
  }
  return null;
}
