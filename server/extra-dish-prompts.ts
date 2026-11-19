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

// ---------- Dosa & uttapam (Abhiruchi Dosa and similar) ----------
const SIDES = 'on a plain smooth unmarked round steel plate with small plain steel bowls of white coconut chutney and orange sambar, nothing written or engraved anywhere';
function describeDosa(n: string): string | null {
  if (/uttapam|uthappa/.test(n)) {
    const tops: string[] = [];
    if (/jain/.test(n)) tops.push('chopped tomato, capsicum, cabbage and grated carrot (no onion)');
    else if (/special/.test(n)) tops.push('chopped onion, tomato, capsicum, carrot and coriander');
    else if (/masala/.test(n)) tops.push('spiced yellow potato masala and chopped onion');
    else {
      const t = [/onion/.test(n) && 'chopped onion', /tomato/.test(n) && 'chopped tomato'].filter(Boolean) as string[];
      tops.push(t.length ? t.join(' and ') + ' with green chilli and coriander' : 'chopped onion, tomato and coriander');
    }
    if (/cheese/.test(n)) tops.push('lots of melted grated cheese');
    if (/butter/.test(n)) tops.push('a melting cube of butter');
    return `uttapam, a thick soft round South Indian rice pancake with a golden underside, topped with ${tops.join(', ')}, ${SIDES}`;
  }
  if (!/dosa/.test(n)) return null;
  let shape = 'a large crisp golden-brown dosa folded in half';
  if (/jumbo/.test(n)) shape = 'an extremely long crisp golden paper dosa rolled into a tube stretching across a long rectangular steel platter';
  else if (/paper/.test(n)) shape = 'a very thin, very crisp golden paper dosa rolled into a long tube overhanging the plate';
  else if (/topi/.test(n)) shape = 'a crisp golden dosa shaped into a tall cone standing upright like a hat';
  else if (/set/.test(n)) shape = 'three small soft thick spongy set dosas stacked';
  else if (/sponge/.test(n)) shape = 'two soft thick spongy dosas full of tiny holes';
  else if (/roll/.test(n)) shape = 'a crisp dosa rolled tight and sliced into short round rolls standing on end';
  else if (/cut/.test(n)) shape = 'a crisp golden dosa cut into short pieces arranged in a row';
  else if (/loni/.test(n)) shape = 'a soft golden dosa topped with a big dollop of fresh white homemade butter';
  const fill: string[] = [];
  if (/mysore/.test(n)) fill.push('the inside spread with red spicy Mysore chutney');
  if (/schezwan/.test(n)) fill.push('the inside spread with red spicy schezwan sauce and chopped vegetables');
  if (/green/.test(n)) fill.push('the inside spread with bright green coriander-mint chutney');
  if (/chatani|chutney/.test(n)) fill.push('the inside spread with red and white chutney');
  if (/podi/.test(n)) fill.push('sprinkled with coarse reddish-brown podi gunpowder spice');
  if (/masala|mysore/.test(n)) fill.push('stuffed with yellow spiced potato masala');
  if (/cheese/.test(n)) fill.push('topped with lots of grated cheese');
  if (/butter/.test(n) && !/loni/.test(n)) fill.push('glistening with melting butter');
  if (/ghee/.test(n)) fill.push('glistening with ghee');
  const name = n.replace(/\s*\d+\s*(pes|pis|feet).*$/, '');
  return `${name}, ${shape}${fill.length ? ', ' + fill.join(', ') : ''}, ${SIDES}`;
}

export const EXTRA: [RegExp, string][] = [
  // ---------- South Indian breakfast, misal, tea stall (Abhiruchi Dosa) ----------
  [/^idli wada$/, 'idli wada, two soft white idlis and one crisp golden medu wada on a steel plate with bowls of sambar and coconut chutney'],
  [/^idli$/, 'idli, three soft fluffy white steamed rice idlis on a steel plate with bowls of sambar and coconut chutney'],
  [/^medu wada$/, 'medu wada, two crisp golden doughnut-shaped lentil vadas on a steel plate with bowls of sambar and coconut chutney'],
  [/^mataka misal$/, 'matka misal, spicy red sprouted moth bean curry topped with yellow farsan, chopped onion and coriander, served in a small clay pot with pav and a lemon wedge'],
  [/^dahi misal$/, 'dahi misal, spicy red sprouted moth bean curry topped with farsan, onion and a dollop of white curd, in a steel bowl with pav'],
  [/^butter misal$/, 'butter misal pav, spicy red sprouted moth bean curry topped with farsan, onion, coriander and a melting cube of butter, in a steel bowl with butter-toasted pav'],
  [/^misal$/, 'Puneri misal pav, spicy red sprouted moth bean curry with red oil on top, topped with yellow farsan, chopped onion and coriander, in a plain smooth unmarked steel bowl with two pav and a lemon wedge'],
  [/extra butter pav/, 'two soft square pav buns toasted golden with lots of butter, on a steel plate'],
  [/^tak$/, 'Maharashtrian taak, a steel glass of thin white spiced buttermilk with chopped coriander and a pinch of cumin on top'],
  [/^black tea$/, 'a small glass cup of hot black tea without milk, clear amber-brown, on a saucer'],
  [/^special tea$/, 'a small glass cup of hot creamy Indian masala chai, light brown with a thin froth, on a saucer'],
  [/^tea$/, 'a small glass cup of hot milky Indian chai, light brown, on a saucer'],
  [/^coffee$/, 'a plain white ceramic cup of hot milky Indian coffee with froth on top, on a plain white saucer, cup completely plain with no print or markings'],
  [/^(milk glass|plain milk)$/, 'a plain steel glass of hot white milk with a little froth'],
  [/^curd bowl$/, 'a small steel bowl of thick set white curd'],
  [/^(chocolate|mango|strawberry|vanilla) shake$/, '$1 milkshake, a tall glass of thick creamy $1 milkshake with a straw'],
  // ---------- Hotel Sangram ----------
  [/^poha$/, 'kanda poha, yellow flattened rice with onion, mustard seeds, curry leaves and peanuts, topped with sev, coriander and a lemon wedge, on a plate'],
  [/^sheera$/, 'sheera (sooji halwa), soft grainy golden-yellow semolina pudding cooked in ghee, topped with a few cashews and raisins, in a small steel bowl with a spoon'],
  [/^rosted papad$/, 'roasted papad, two thin crisp round light-yellow papads with brown blistered roasted spots, very thin and brittle, on a plate'],
  [/^upma$/, 'upma, soft savoury semolina with mustard seeds, curry leaves, onion and green chilli, garnished with coriander, on a plate'],
  [/^toast butter$/, 'crisp toasted bread slices spread with melting butter, on a plate'],
  [/^paneer lasuni$/, 'paneer lasuni, soft paneer cubes in brown garlic gravy topped with golden fried garlic, served in a round steel serving bowl'],
  [/^paneer ms$/, 'paneer masala, soft paneer cubes in thick reddish-brown onion-tomato masala gravy, served in a round steel serving bowl, garnished with coriander'],
  [/^paneer tikka ms$/, 'paneer tikka masala, charred tandoori paneer cubes with capsicum and onion in thick orange-red masala gravy, served in a round steel serving bowl'],
  [/^paneer tikka dry$/, 'paneer tikka, orange-red marinated paneer cubes with capsicum and onion pieces roasted with char marks, on a sizzling plate with mint chutney and onion rings'],
  [/^veg kholapuri$/, 'veg Kolhapuri, mixed vegetables in fiery dark red spicy Kolhapuri gravy with red chilli oil on top, served in a round steel serving bowl'],
  [/^butter wheat roti$/, 'soft wheat rotis brushed with melting butter, stacked on a steel plate'],
  [/^wheat roti$/, 'soft thin wheat rotis stacked on a steel plate'],
  [/^green salad$/, 'green salad, fresh sliced cucumber, tomato, onion rings, carrot and a lemon wedge arranged on a plate'],
  [/^mix raita$/, 'mix raita, white curd with chopped cucumber, onion and tomato, sprinkled with cumin and red chilli powder, in a small bowl'],
  [/^veg manchaow$/, 'veg manchow soup, dark brown spicy soup with chopped vegetables, topped with crispy fried noodles, in a white soup bowl'],
  [/^mushroom tikka dry$/, 'mushroom tikka, whole button mushrooms marinated in orange-red tandoori masala and roasted with capsicum and onion, char marks, on a plate with mint chutney'],
  [/^paneer banjara kebab$/, 'paneer banjara kebab, large cubes of soft white paneer with bright white insides visible, coated in orange-red rustic spice marinade with light char marks, with capsicum and onion pieces, on a plate with onion rings and mint chutney'],
  [/^paneer pahadi kebab$/, 'paneer pahadi kebab, paneer cubes in bright green mint-coriander marinade, roasted with char marks, on a plate with onion rings and lemon'],
  [/^veg sikh kebab$/, 'veg seekh kebab, long light green and orange kebabs made of mashed potato, green peas, carrot and coriander, with visible bits of vegetables, light char marks, on a plate with onion rings, lemon and mint chutney'],
  [/^veg sch fride rice$/, 'veg schezwan fried rice, spicy red-orange fried rice with carrot, beans and spring onion, on a white plate'],
  [/^veg fride rice$/, 'veg fried rice, Indo-Chinese white fried rice with carrot, beans, cabbage and spring onion, on a white plate'],
  [/^veg hakka noodls$/, 'veg hakka noodles, light brown stir-fried noodles with cabbage, carrot, capsicum and spring onion, on a white plate'],
  [/^ms kulcha$/, 'masala kulcha, round tandoori flatbread stuffed with spiced potato and onion, brushed with butter, cut in quarters on a plate'],
  [/^rosted ms papad$/, 'roasted masala papad, crisp roasted papad topped with chopped onion, tomato, coriander and chaat masala, on a plate'],
  [/^nachani rosted papad$/, 'roasted nachni papad, a crisp round dark brown finger millet papad, on a plate'],
  // ---------- Hotel Rassa Bhakri ----------
  [/^chicken biryani$/, 'chicken dum biryani, long-grain saffron and white basmati rice layered with chicken pieces, fried onions and mint, on a plate with raita'],
  [/^mutton biryani$/, 'mutton dum biryani, long-grain saffron and white basmati rice layered with dark mutton pieces, fried onions and mint, on a plate with raita'],
  [/^egg biryani$/, 'egg biryani, long-grain saffron and white basmati rice with halved boiled eggs in masala, fried onions and mint, on a plate with raita'],
  [/^chicken chilli$/, 'chilli chicken dry, Indo-Chinese crispy boneless chicken tossed with green capsicum, onion and soy chilli sauce, on a plate'],
  [/^chicken (malvani|malabari)$/, 'chicken Malvani, bone-in chicken pieces in reddish-brown coconut Malvani gravy, served in a round steel serving bowl, garnished with coriander'],
  [/^mutton (malvani|malabari)$/, 'mutton Malvani, dark mutton pieces on the bone in reddish-brown coconut Malvani gravy, served in a round steel serving bowl, garnished with coriander'],
  [/^boiled egg$/, 'two boiled eggs cut in halves, sprinkled with salt, black pepper and red chilli powder, on a plate with onion'],
  [/^egg fry$/, 'egg fry, halved boiled eggs shallow-fried in spicy red masala with onion and curry leaves, on a plate'],
  [/^egg thali$/, 'egg thali, steel plate with a bowl of red egg curry with halved boiled eggs, red rassa, jowar bhakri, rice, onion and lemon'],
  // ---------- Cafe items (Aroma Cafe) ----------
  [/anjeer mastani/, 'Pune style anjeer mastani, a tall glass of thick light pink fig milkshake topped with a big scoop of anjeer ice cream, chopped dry fruits and a cherry'],
  [/anjeer milk shake/, 'anjeer milkshake, a tall glass of thick creamy light pink fig milkshake with a straw'],
  [/butter scotch mastani/, 'Pune style butter scotch mastani, a tall glass of thick pale golden butterscotch with praline bits milkshake topped with a big scoop of butterscotch ice cream, chopped dry fruits and a cherry'],
  [/butter scotch milk shake/, 'butter scotch milkshake, a tall glass of thick creamy pale golden butterscotch with praline bits milkshake with a straw, close-up on a dark wooden table against a plain dark empty wall, nothing hanging on the wall'],
  [/chocolate mastani/, 'Pune style chocolate mastani, a tall glass of thick dark chocolate milkshake topped with a big scoop of chocolate ice cream, chopped dry fruits and a cherry'],
  [/chocolate milk shake/, 'chocolate milkshake, a tall glass of thick creamy dark chocolate milkshake with a straw'],
  [/gulkand mastani/, 'Pune style gulkand mastani, a tall glass of thick pale pink rose gulkand milkshake topped with a big scoop of rose ice cream, chopped dry fruits and a cherry'],
  [/gulkand milk shake/, 'gulkand milkshake, a tall glass of thick creamy pale pink rose gulkand milkshake with a straw'],
  [/mango mastani/, 'Pune style mango mastani, a tall glass of thick bright orange-yellow mango milkshake topped with a big scoop of mango ice cream, chopped dry fruits and a cherry'],
  [/mango milk shake/, 'mango milkshake, a tall glass of thick creamy bright orange-yellow mango milkshake with a straw'],
  [/pista mastani/, 'Pune style pista mastani, a tall glass of thick pale green pistachio milkshake topped with a big scoop of pista ice cream, chopped dry fruits and a cherry'],
  [/pista milk shake/, 'pista milkshake, a tall glass of thick creamy pale green pistachio milkshake with a straw'],
  [/strawberry mastani/, 'Pune style strawberry mastani, a tall glass of thick pink strawberry milkshake topped with a big scoop of strawberry ice cream, chopped dry fruits and a cherry'],
  [/strawberry milk shake/, 'strawberry milkshake, a tall glass of thick creamy pink strawberry milkshake with a straw'],
  [/fruit overload/, 'mixed fruit milkshake, a tall glass of thick creamy fruit shake topped with chopped fresh fruits'],
  [/^cad b$/, 'Cad B, a tall glass of thick cold chocolate shake with chocolate syrup streaks on the inside of the glass and chocolate shavings on top'],
  [/^cad m$/, 'Cad M, a tall glass of thick cold chocolate shake blended with chocolate bar pieces, topped with whipped cream and chocolate chunks'],
  [/cold chocolate with ice cream/, 'cold chocolate with ice cream, a tall glass of chilled chocolate milk topped with a scoop of vanilla ice cream'],
  [/cold chocolate with ch crush/, 'cold chocolate, a tall glass of chilled chocolate milk topped with crushed chocolate cookie crumbs'],
  [/cold chocolate/, 'cold chocolate, a tall glass of chilled thick chocolate milk with chocolate drizzle and a straw'],
  [/caramel cold coffee/, 'caramel cold coffee, a tall glass of creamy cold coffee with golden caramel drizzle on the inside of the glass and a straw'],
  [/irish cold coffee/, 'Irish cold coffee, a tall glass of creamy cold coffee topped with whipped cream and a light caramel drizzle'],
  [/mocha cold coffee/, 'mocha cold coffee, a tall glass of creamy chocolate cold coffee with chocolate drizzle and cocoa powder on top'],
  [/cold coffee with ice cream/, 'cold coffee with ice cream, a tall glass of creamy cold coffee topped with a scoop of vanilla ice cream'],
  [/cold coffee with ch crush/, 'cold coffee, a tall glass of creamy cold coffee topped with crushed chocolate cookie crumbs'],
  [/extra ice cream/, 'a single scoop of vanilla ice cream in a small glass bowl topped with chocolate crush'],
  [/^hot coffee$/, 'a cup of hot Indian milk coffee with frothy foam on a saucer'],
  [/ice tea/, 'iced tea, a tall glass of chilled amber lemon iced tea with ice cubes, lemon slice and mint'],
  [/lemon tea/, 'hot lemon tea, a clear glass cup of light amber tea with a lemon slice, on a saucer'],
  [/extra cheese slice/, 'veg cheese burger cut in half to show a thick golden-orange crumbed aloo tikki patty with green peas, orange carrot bits and yellow corn kernels clearly visible inside, an extra thick slice of melted cheese oozing over it, in a sesame bun, on a plate with a few fries'],
  [/herb chilli burger/, 'herb chilli burger, sesame bun with crispy veg patty, green chillies, herbs, lettuce and spicy sauce, on a plate with a few fries'],
  [/paneer burger/, 'paneer burger, sesame bun with a thick crispy fried paneer patty, lettuce, onion and mayo, on a plate with a few fries'],
  [/schezwan burger/, 'schezwan burger, sesame bun with crispy veg patty, red schezwan sauce, cabbage and onion, on a plate with a few fries'],
  [/veg cheese burger/, 'veg cheese burger cut in half to show a thick golden-orange crumbed aloo tikki patty with green peas, orange carrot bits and yellow corn kernels clearly visible inside, melted cheese slice, lettuce, tomato and onion in a sesame bun, on a plate with a few fries'],
  [/^veg burger$/, 'veg burger, sesame bun with crispy golden veg patty, lettuce, tomato, onion and mayo, on a plate with a few fries'],
  [/cheese dip/, 'creamy yellow cheese dip in a small round bowl beside a few crispy nachos'],
  [/chipotle dip/, 'smoky orange chipotle mayo dip in a small round bowl beside a few crispy nachos'],
  [/jelepeno dip|jalapeno dip/, 'creamy pale green jalapeno dip with chopped jalapenos in a small round bowl beside a few crispy nachos'],
  [/salsa dip/, 'chunky red tomato salsa dip with onion and coriander in a small round bowl beside a few crispy nachos'],
  [/tandoori dip/, 'creamy orange tandoori mayo dip in a small round bowl beside a few crispy nachos'],
  [/cheese triangles/, 'cheese triangles, golden crispy fried breaded triangle snacks with melted cheese inside, on a plate with ketchup'],
  [/oreo milk shake/, 'chocolate cookies and cream milkshake, a tall glass of thick grey-white milkshake with crushed dark chocolate cookie crumbs, chocolate syrup streaks and whipped cream, a few plain crumbled cookie pieces on the table, plain blurred background'],
  [/^peri peri fries$/, 'peri peri fries, crispy french fries dusted with red peri peri spice in a plain white paper-lined wire basket, a small bowl of dip on the side'],
  [/^extra masala$/, 'a small bowl of red peri peri masala seasoning powder beside a basket of french fries'],
  [/extra mayonnaise/, 'a small bowl of creamy white mayonnaise beside a basket of french fries'],
  [/veggie fingers/, 'veggie fingers, golden breaded crispy finger-shaped veg sticks on a plate with ketchup'],
  [/cheese corn momos/, 'cheese corn momos, deep-fried golden crispy momos on a plate with red momo chutney, one cut open showing cheese and sweet corn filling'],
  [/mix veg momos/, 'veg momos, deep-fried golden crispy momos on a plate with red momo chutney, one cut open showing mixed vegetable filling'],
  [/paneer momos/, 'paneer momos, deep-fried golden crispy momos on a plate with red momo chutney, one cut open showing paneer filling'],
  [/schezwan momos/, 'schezwan fried momos, crispy fried momos tossed in red schezwan sauce with spring onion, on a plate'],
  [/chocolate pizza/, 'chocolate dessert pizza, thin crust covered in melted chocolate, chocolate chips and powdered sugar, on a wooden board, sliced'],
  [/^extra cheese$/, 'cheese pizza with extra mozzarella, a slice being lifted with long stretchy cheese pull, on a wooden board, sliced'],
  [/garlic jelepeno pizza|garlic jalapeno pizza/, 'garlic jalapeno pizza, cheesy pizza topped with roasted garlic and green jalapeno slices, on a wooden board, sliced'],
  [/paneer tandoori pizza/, 'paneer tandoori pizza, cheesy pizza topped with orange tandoori paneer cubes, onion and capsicum, on a wooden board, sliced'],
  [/plain cheese pizza/, 'plain cheese pizza, golden bubbly mozzarella on tomato sauce, on a wooden board, sliced'],
  [/spl ex pizza/, 'special loaded veg pizza, thick cheese with paneer, corn, olives, jalapenos, capsicum, onion and tomato, on a wooden board, sliced'],
  [/veg cheese pizza/, 'veg cheese pizza, cheesy pizza topped with capsicum, onion, tomato and sweet corn, on a wooden board, sliced'],
  [/veg corn pizza/, 'corn pizza, cheesy pizza topped with lots of sweet corn kernels and capsicum, on a wooden board, sliced'],
  [/veg paneer pizza/, 'paneer pizza, cheesy pizza topped with paneer cubes, capsicum and onion, on a wooden board, sliced'],
  [/veg schezwan pizza/, 'schezwan pizza, cheesy pizza with spicy red schezwan sauce, capsicum, onion and spring onion, on a wooden board, sliced'],
  [/veg tandoori pizza/, 'tandoori veg pizza, cheesy pizza with orange tandoori sauce, capsicum, onion and paneer, on a wooden board, sliced'],
  [/any sandwich with cheese extra/, 'grilled veg sandwich loaded with extra grated cheese on top, grill marks, cut in triangles, on a plate with ketchup'],
  [/chocolate sandwich/, 'chocolate grilled sandwich, golden grilled bread with molten chocolate filling, cut in triangles, on a plate'],
  [/cutlet sandwich/, 'veg cutlet sandwich, grilled bread with a crispy veg cutlet patty, onion, tomato and green chutney, cut in triangles, on a plate with ketchup'],
  [/ghotala sandwich/, 'ghotala sandwich, loaded grilled sandwich with mixed veg, cheese and sauces spilling out, cut in triangles, on a plate with ketchup'],
  [/schezwan sandwich/, 'schezwan grilled sandwich, grilled bread with spicy red schezwan veg and cheese filling, cut in triangles, on a plate with ketchup'],
  [/tadka sandwich/, 'tadka sandwich, grilled sandwich with spicy masala veg filling and cheese, cut in triangles, on a plate with ketchup'],
  [/pizza sandwich/, 'triple-layer pizza sandwich, grilled bread layered with pizza sauce, melted cheese, capsicum, onion and corn, cut in triangles, on a plate with ketchup'],
  [/paneer sub/, 'paneer sub, a long toasted sub roll filled with paneer tikka, lettuce, onion, tomato and sauces, on a plate'],
  [/veg sub/, 'veg sub, a long toasted sub roll filled with sliced golden aloo tikki pieces with green peas and corn visible, lettuce, cucumber, tomato, onion and sauces, on a plate'],
  [/cheese chilli garlic/, 'cheese chilli garlic toast, toasted bread slices with melted cheese, garlic butter and green chilli, on a plate'],
  [/cheesy toast/, 'cheesy toast, golden toasted bread slices topped with bubbly melted cheese, on a plate'],
  [/garlic toast/, 'garlic toast, golden toasted bread slices with garlic butter and herbs, on a plate'],
  [/veg cheese toast/, 'veg cheese toast, toasted bread topped with chopped capsicum, onion, corn and melted cheese, on a plate'],

  // ---------- Ganga Grand ----------
  [/^roti$/, 'soft wheat rotis stacked on a steel plate'],
  [/dragon sp kaju/, 'Indo-Chinese dragon kaju, crispy fried cashew nuts tossed in fiery red sweet-spicy dragon sauce with capsicum and spring onion, on a white plate'],
  [/dragon sp paneer/, 'Indo-Chinese dragon paneer, crispy fried paneer strips tossed in fiery red sweet-spicy dragon sauce with cashews and capsicum, on a white plate'],
  [/dragon sp veg/, 'Indo-Chinese dragon veg, crispy fried vegetable strips tossed in fiery red sweet-spicy dragon sauce with cashews and spring onion, on a white plate'],
  [/gavran (malvani|malabari) handi/, 'gavran (country) chicken pieces on the bone in reddish-brown coconut Malvani gravy, served in a clay handi pot, garnished with coriander'],
  [/(malvani|malabari) handi/, '__MEAT__ in reddish-brown coconut Malvani gravy, served in a clay handi pot, garnished with coriander'],
  [/fish handi/, 'fish pieces in tangy red coconut fish curry, served in a clay handi pot, garnished with coriander'],
  [/kaju handi/, 'whole roasted cashew nuts in rich brown gravy, served in a clay handi pot, garnished with coriander'],
  [/kaju kadhai/, 'whole roasted cashew nuts with chunks of green capsicum and onion in thick semi-dry masala, served in a small iron kadhai'],
  [/paneer makhmali/, `paneer makhmali, soft paneer cubes in silky smooth white creamy cashew gravy with a swirl of cream, ${bowl}`],
  [/veg makhmali/, `veg makhmali, mixed vegetables in silky smooth white creamy cashew gravy with a swirl of cream, ${bowl}`],
  [/matki fry/, 'matki usal, dry sprouted moth beans cooked with onion, grated coconut and spices, in a steel bowl with lemon'],
  [/matki masala/, `matki masala, sprouted moth beans in thick spicy onion-tomato gravy, ${bowl}`],
  [/soyabean masala/, `soyabean masala, soya chunks in thick reddish-brown onion-tomato masala gravy, ${bowl}`],
  [/soyabean chilli gravy/, 'soya chilli gravy, Indo-Chinese fried soya chunks with capsicum and onion in glossy dark soy gravy, in a bowl'],
  [/soyabean chilli dry/, 'soya chilli dry, Indo-Chinese fried soya chunks tossed with green capsicum, onion and soy chilli sauce, on a white plate'],
  [/mushroom chilli gravy/, 'mushroom chilli gravy, Indo-Chinese fried mushrooms with capsicum and onion in glossy dark soy gravy, in a bowl'],
  [/mushroom chilli dry/, 'mushroom chilli dry, Indo-Chinese crispy mushrooms tossed with green capsicum, onion and soy chilli sauce, on a white plate'],
  [/lasuni palak/, `lasooni palak, dark green spinach gravy topped with golden fried garlic, ${bowl}`],
  [/veg maratha/, `veg maratha, mixed vegetables in fiery dark red Maharashtrian masala gravy, ${bowl}`],
  [/shev tamatar/, 'sev tamatar, tangy red tomato curry topped with lots of crispy yellow sev, in a steel bowl'],
  [/veg kasturi/, `veg kasturi, mixed vegetables in creamy light orange gravy flavoured with kasuri methi, ${bowl}`],
  [/kasturi/, `__MEAT__ in creamy light orange gravy flavoured with kasuri methi, ${bowl}`],
  [/paneer lapeta/, `paneer lapeta, paneer cubes coated in thick dry dark-red masala, ${bowl}`],
  [/lapeta/, `__MEAT__ coated in thick dry dark-red masala, ${bowl}`],
  [/lababdar/, `chicken lababdar, boneless chicken in rich creamy orange tomato gravy with cream and onion bits, ${bowl}`],
  [/hara dhaniya/, `chicken hara dhaniya, chicken pieces in green fresh-coriander gravy, ${bowl}`],
  [/veg patiyala/, `veg patiala, mixed vegetables in creamy brown gravy, wrapped in a thin paneer-filled crepe, ${bowl}`],
  [/veg bhuna/, `veg bhuna, white cauliflower florets, green peas, orange carrot cubes, potato and green capsicum coated in thick brown bhuna masala, ${bowl}`],
  [/veg tiranga/, 'tricolour veg curry, one dish with three stripes of vegetable gravy side by side: orange-red, creamy white and green'],
  [/hara bhara kebab/, 'hara bhara kebab, round green spinach and peas patties with a cashew on top, on a plate with mint chutney and onion rings'],
  [/chicken manchurian soup/, `chicken manchurian soup, brown soup with small chicken manchurian balls and spring onion, ${soupBowl}`],
  [/^chicken soup$/, `chicken soup, light golden-brown spiced chicken broth with shredded chicken and coriander, ${soupBowl}`],
  [/^mutton soup$/, `mutton soup, spiced brown mutton broth with small mutton pieces and coriander, ${soupBowl}`],
  [/angara kebab/, 'chicken angara kebab, smoky fiery-red charred boneless chicken kebab pieces, on a plate with onion rings and lemon'],
  [/hariyali kebab/, 'chicken hariyali kebab, green mint-coriander marinated grilled boneless chicken pieces with char marks, on a plate with onion rings'],
  [/boti kebab/, 'mutton boti kebab, charred spicy grilled mutton cubes on skewers, on a plate with onion rings, lemon and mint chutney'],
  [/^chicken lollipop$/, 'chicken lollipops, deep-fried crispy red chicken drumettes with bone handles, arranged on a plate with schezwan sauce'],
  [/mutton koliwada/, 'mutton koliwada, crispy deep-fried mutton pieces in spicy red batter, on a plate with onion rings and lemon'],
  [/paplet tawa/, 'whole pomfret fish rava fry, whole pomfret fish coated in red masala and semolina, pan-fried crisp on a tawa, on a plate with onion rings and lemon'],
  [/rohu fish tawa/, 'rohu fish steaks rava fry, rohu fish steaks coated in red masala and semolina, pan-fried crisp on a tawa, on a plate with onion rings and lemon'],
  [/surmai tawa/, 'surmai (kingfish) steaks rava fry, surmai (kingfish) steaks coated in red masala and semolina, pan-fried crisp on a tawa, on a plate with onion rings and lemon'],
  [/curd rice/, 'curd rice, white rice mixed with yogurt, tempered with mustard seeds, curry leaves and red chilli, in a steel bowl'],
  [/veg pulao/, 'veg pulao, fragrant white basmati rice with peas, carrot and beans and whole spices, in a steel bowl'],
  [/sadha rice/, 'plain steamed white rice in a steel bowl'],
  [/chicken platter/, 'large chicken starter platter with tandoori chicken, seekh kebab, chicken tikka and lollipops, onion rings, lemon and mint chutney'],
  [/pithal bhakari/, 'pithla bhakri, thick yellow besan pithla curry in a bowl with round jowar bhakris, raw onion, green chilli and thecha, on a steel plate'],
  [/special egg thali/, 'egg thali, steel plate with a bowl of egg curry with halved boiled eggs, egg bhurji, chapati, rice, onion and lemon'],
  [/chilapi thali/, 'Maharashtrian fish thali, large steel plate with two fried tilapia fish, a bowl of red fish curry, rice, chapati, pink sol kadhi, onion and lemon'],
  [/paplet thali/, 'Maharashtrian fish thali, large steel plate with a whole fried pomfret, a bowl of red fish curry, rice, chapati, pink sol kadhi, onion and lemon'],
  [/rohu fish thali/, 'Maharashtrian fish thali, large steel plate with fried rohu fish steaks, a bowl of red fish curry, rice, chapati, pink sol kadhi, onion and lemon'],
  [/surmai thali/, 'Maharashtrian fish thali, large steel plate with fried surmai (kingfish) steaks, a bowl of red fish curry, rice, chapati, pink sol kadhi, onion and lemon'],

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
  const dosa = describeDosa(normName);
  if (dosa) return dosa;
  const coneM = normName.match(/^(.*) cone$/);
  if (coneM && CONE_FLAVOURS[coneM[1]]) return cone(CONE_FLAVOURS[coneM[1]]);
  for (const [re, text] of EXTRA) {
    const m = normName.match(re);
    if (m) return text.replace('$1', m[1] ?? '').replace('__MEAT__', MEAT_WORD(normName));
  }
  return null;
}
