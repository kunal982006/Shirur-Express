// Vegetarian dish descriptions for AI image prompts (used by generate-restaurant-images.ts --veg).
// Never maps to meat/egg: pure-veg restaurants must not get chicken images for "Fried Rice", "Tandoori", etc.

const bowl = 'served in a round steel serving bowl, garnished with fresh coriander';
const plate = 'on a white plate';

// First match wins. Patterns run against the lowercased name.
const VEG: [RegExp, string][] = [
  // ---------- Pav bhaji & street food ----------
  [/extra pav/, 'two soft square pav buns toasted golden with butter, on a steel plate'],
  [/bhurji pav/, 'paneer bhurji pav, scrambled spiced paneer bhurji with onion, tomato and coriander, with butter-toasted pav buns on a steel plate'],
  [/khada pavbhaji/, 'khada pav bhaji, chunky red-orange bhaji with visible pieces of capsicum, peas, potato and tomato, topped with butter, served with butter-toasted pav buns on a steel plate'],
  [/tadka pavbhaji/, 'tadka pav bhaji, red-orange mashed vegetable bhaji with a sizzling butter tadka of chilli and garlic on top, with butter-toasted pav buns on a steel plate'],
  [/pavbhaji|bhaji plate/, 'Mumbai pav bhaji, thick red-orange mashed vegetable bhaji topped with a cube of butter, chopped onion, coriander and a lemon wedge, served with butter-toasted pav buns on a steel plate'],
  [/masala pav gravy/, 'masala pav with gravy, butter-toasted pav buns coated in red pav bhaji masala with a bowl of red bhaji gravy, chopped onion and coriander'],
  [/masala pav/, 'masala pav, butter-toasted pav buns slit and stuffed with red spicy pav bhaji masala, chopped onion, tomato and coriander, on a steel plate'],
  [/aloo chaat/, 'aloo chaat, crispy fried potato cubes tossed with chaat masala, green and tamarind chutney, onion, coriander and sev, on a plate'],
  [/garlic chutney/, 'red spicy dry garlic chutney in a small steel bowl'],
  [/tava.*pulao/, 'Mumbai tava pulao, red-orange spiced rice with green peas, capsicum, onion and tomato, cooked on a tava, served on a plate with a small bowl of raita'],
  [/extra raita/, 'a small bowl of white curd raita with grated cucumber, onion and a pinch of red chilli powder'],
  [/schezwan chutney/, 'a small bowl of glossy spicy red schezwan chutney'],
  [/extra cheese/, 'a small bowl of freshly grated white cheese'],
  [/extra toppings/, 'small bowls of pizza toppings: grated cheese, sweet corn, black olives, broccoli, jalapenos and paneer cubes'],

  // ---------- Chaat ----------
  [/ragda pani puri/, 'ragda pani puri, small round crispy puris filled with hot white pea ragda, with a bowl of green spicy pani'],
  [/pani puri/, 'pani puri, small round hollow crispy puris filled with potato, with a glass of green mint pani and sweet tamarind water'],
  [/masala puri/, 'masala puri, crushed puris topped with hot pea masala gravy, onion, coriander and sev, on a plate'],
  [/suki bhel/, 'dry bhel, puffed rice mixed with sev, peanuts, onion, tomato and coriander, served in a paper cone'],
  [/dahi bhel/, 'dahi bhel puri, puffed rice bhel topped with white curd, tamarind chutney, sev and coriander, on a plate'],
  [/dil khush bhel/, 'special bhel, colourful puffed rice bhel with sev, pomegranate, raw mango, onion and chutneys, on a plate'],
  [/kurkure bhel/, 'kurkure bhel, crunchy orange kurkure snack mixed with onion, tomato, chutneys and sev, on a plate'],
  [/kachori bhel/, 'kachori bhel, crushed crispy kachori topped with bhel, chutneys, onion and sev, on a plate'],
  [/samosa bhel/, 'samosa bhel, crushed samosa mixed with bhel, chutneys, onion and sev, on a plate'],
  [/(?<!chinese )bhel/, 'bhel puri, puffed rice mixed with sev, onion, tomato, coriander and sweet and green chutneys, on a plate'],
  [/sev puri/, 'sev puri, flat crispy puris topped with potato, onion, chutneys and a heap of fine yellow sev, arranged on a plate'],
  [/dahi puri/, 'dahi puri, round crispy puris filled with potato and topped with sweet white curd, tamarind chutney, sev and coriander, on a plate'],
  [/ragda patties/, 'ragda pattice, golden fried potato patties covered in hot white pea ragda, chutneys, onion and sev, on a plate'],
  [/ragda puri/, 'ragda puri, crispy puris topped with hot white pea ragda, chutneys, onion and sev, on a plate'],
  [/ragda samosa/, 'ragda samosa, crushed samosas covered in hot white pea ragda, chutneys, onion and sev, on a plate'],
  [/dahi samosa/, 'dahi samosa chaat, samosas topped with sweet white curd, tamarind chutney, sev and coriander, on a plate'],
  [/samosa chat/, 'samosa chaat, crushed samosas topped with chole, curd, chutneys, onion and sev, on a plate'],
  [/kachori/, 'dahi kachori chaat, crispy kachori broken open and filled with curd, tamarind and green chutney, sev and pomegranate, on a plate'],
  [/papdi/, 'papdi chaat, crispy flat papdi topped with potato, chickpeas, white curd, tamarind and green chutney and sev, on a plate'],
  [/dahi vada/, 'dahi vada, soft lentil vadas soaked in creamy white curd, topped with tamarind chutney, red chilli powder and cumin, in a bowl'],
  [/tokri chat/, 'tokri chaat, an edible crispy fried potato basket filled with chaat, curd, chutneys, pomegranate and sev, on a plate'],

  // ---------- Soya chaap & tandoor ----------
  [/malai soya chaap/, 'malai soya chaap, creamy white marinated soya chaap pieces roasted in the tandoor with light char, on a plate with onion rings and mint chutney'],
  [/hariyali soya chaap/, 'hariyali soya chaap, green mint-coriander marinated soya chaap pieces roasted in the tandoor, on a plate with onion rings'],
  [/afghani soya chaap/, 'afghani soya chaap, creamy pale marinated soya chaap pieces with charred edges, on a plate with onion rings'],
  [/soya chaap/, 'tandoori soya chaap, red-orange spiced soya chaap pieces roasted in the tandoor with char marks, on a plate with onion rings, lemon and mint chutney'],
  [/^angara/, 'angara malai paneer tikka, smoky red-orange creamy marinated paneer cubes with charred edges, on a plate with onion rings'],
  [/malai tikka|reshmi tikka/, 'paneer malai tikka, creamy white marinated paneer cubes with capsicum and onion, roasted on skewers with light char, on a plate with mint chutney'],
  [/hariyali paneer tikka/, 'hariyali paneer tikka, green mint-coriander marinated paneer cubes with capsicum and onion, roasted with char marks, on a plate'],
  [/angara.*tikka/, 'angara paneer tikka, smoky fiery red marinated paneer cubes with charred edges, on a plate with onion rings'],
  [/lasuni tikka/, 'lasuni paneer tikka, garlic marinated orange paneer cubes roasted with char marks, topped with fried garlic, on a plate'],
  [/paneer.*tikka$/, 'paneer tikka, orange-red marinated paneer cubes with capsicum and onion pieces, roasted on skewers with char marks, on a plate with mint chutney and lemon'],

  // ---------- Soup ----------
  [/tomato soup/, 'tomato soup, smooth bright red tomato soup with a swirl of cream and croutons, in a white soup bowl'],
  [/mix veg soup/, 'mixed vegetable clear soup with carrot, beans and cabbage, in a white soup bowl'],
  [/manchow/, 'veg manchow soup, dark brown spicy soup with chopped vegetables, topped with crispy fried noodles, in a white soup bowl'],
  [/hot & sour|hot and sour/, 'hot and sour veg soup, thick dark brown soup with shredded vegetables, in a white soup bowl'],
  [/noodle soup/, 'veg noodle soup, clear broth with noodles and vegetables, in a white soup bowl'],
  [/lemon coriander/, 'lemon coriander soup, clear light soup with coriander leaves and vegetables, lemon wedge, in a white soup bowl'],
  [/manchurian soup/, 'veg manchurian soup, brown soup with small veg manchurian balls and spring onion, in a white soup bowl'],
  [/paneer soup/, 'paneer soup, light soup with small paneer cubes and vegetables, in a white soup bowl'],
  [/sweet corn soup/, 'veg sweet corn soup, thick creamy pale yellow soup with corn kernels, in a white soup bowl'],
  [/cream of mushroom/, 'cream of mushroom soup, thick creamy beige soup with mushroom slices, in a white soup bowl'],

  // ---------- Indo-Chinese starters ----------
  [/veg lollipop/, 'veg lollipop, deep-fried crispy vegetable lollipops on sticks, with schezwan sauce, on a plate'],
  [/chinese bhel/, 'Chinese bhel, crispy fried noodles tossed with cabbage, carrot, capsicum and red schezwan sauce, on a plate'],
  [/veg 65/, 'veg 65, deep-fried red spicy vegetable fritters tossed with curry leaves and green chillies, on a plate'],
  [/spring roll/, 'veg spring rolls, golden crispy fried rolls cut diagonally showing vegetable filling, with red chilli sauce, on a plate'],
  [/paneer chilli gravy/, `paneer chilli gravy, Indo-Chinese fried paneer cubes with capsicum and onion in glossy dark soy gravy, in a bowl`],
  [/paneer chilli/, `paneer chilli dry, Indo-Chinese fried paneer cubes tossed with green capsicum, onion and soy chilli sauce, ${plate}`],
  [/cheese ball manchurian/, 'cheese ball manchurian, golden fried cheese balls in glossy dark manchurian sauce with spring onion, in a bowl'],
  [/paneer manchurian gravy/, 'paneer manchurian gravy, fried paneer cubes in glossy dark brown manchurian gravy with spring onion, in a bowl'],
  [/paneer manchurian/, `paneer manchurian dry, fried paneer cubes tossed in dark manchurian sauce with spring onion, ${plate}`],
  [/mushroom manchurian gravy/, 'mushroom manchurian gravy, crispy mushrooms in glossy dark brown manchurian gravy with spring onion, in a bowl'],
  [/mushroom manchurian/, `mushroom manchurian dry, crispy fried mushrooms tossed in dark manchurian sauce with spring onion, ${plate}`],
  [/manchurian gravy/, 'veg manchurian gravy, fried vegetable balls in glossy dark brown manchurian gravy with spring onion, in a bowl'],
  [/manchurian dry/, `veg manchurian dry, fried vegetable balls tossed in dark manchurian sauce with spring onion and capsicum, ${plate}`],
  [/paneer crispy/, `crispy paneer, fried paneer strips tossed in sweet chilli sauce with sesame seeds and spring onion, ${plate}`],
  [/veg crispy/, `crispy veg, batter-fried mixed vegetables tossed in sweet chilli sauce with sesame seeds and spring onion, ${plate}`],
  [/hara bhara kabab/, 'hara bhara kabab, round green spinach and peas patties with a cashew on top, on a plate with mint chutney'],
  [/veg ball schezwan/, `veg balls schezwan dry, fried vegetable balls tossed in spicy red schezwan sauce, ${plate}`],
  [/cheese corn ball/, 'cheese corn balls, golden crispy fried balls broken open showing melted cheese and corn, on a plate with ketchup'],
  [/croquette/, 'cheese corn croquettes, golden crumb-fried cylinders filled with cheese and corn, on a plate with dip'],
  [/paneer satay/, 'paneer satay, grilled paneer cubes on bamboo skewers with peanut sauce, on a plate'],

  // ---------- Paneer gravies ----------
  [/palak paneer/, `palak paneer, white paneer cubes in smooth dark green spinach gravy with a swirl of cream, ${bowl}`],
  [/matar paneer/, `matar paneer, paneer cubes and green peas in red-orange tomato gravy, ${bowl}`],
  [/paneer cheese butter masala/, `paneer cheese butter masala, paneer cubes in creamy orange butter gravy topped with grated cheese, ${bowl}`],
  [/paneer butter masala/, `paneer butter masala, paneer cubes in smooth creamy orange gravy with a swirl of cream, ${bowl}`],
  [/paneer tikka masala/, `paneer tikka masala, charred tandoori paneer cubes with capsicum and onion in thick orange-red masala gravy, ${bowl}`],
  [/paneer bhurji/, `paneer bhurji, scrambled crumbled paneer cooked with onion, tomato and green chilli, ${bowl}`],
  [/shahi paneer/, `shahi paneer, paneer cubes in rich creamy pale yellow cashew gravy, ${bowl}`],
  [/paneer kofta/, `paneer kofta, soft fried paneer dumplings in creamy orange gravy, ${bowl}`],
  [/cheese kofta/, `cheese kofta, soft fried cheese dumplings in creamy orange gravy, ${bowl}`],
  [/veg kofta/, `veg kofta, fried mixed vegetable dumplings in creamy orange-brown gravy, ${bowl}`],
  [/paneer lacchedar/, `paneer lacchedar, thin strips of paneer in thick onion-tomato gravy, ${bowl}`],
  [/paneer pasanda/, `paneer pasanda, stuffed paneer sandwiches in rich creamy cashew gravy, ${bowl}`],
  [/paneer khurchand/, `paneer khurchan, shredded paneer cooked dry with capsicum, onion and tomato, ${bowl}`],
  [/paneer mushroom/, `paneer mushroom masala, paneer cubes and mushroom slices in thick brown masala gravy, ${bowl}`],
  [/paneer kaju/, `paneer kaju masala, paneer cubes and whole cashews in creamy orange-brown gravy, ${bowl}`],
  [/paneer cheese masala/, `paneer cheese masala, paneer cubes in red-orange masala gravy topped with grated cheese, ${bowl}`],
  [/paneer laung lata/, `paneer in rich brown gravy with whole cloves, ${bowl}`],
  [/paneer saoji/, `paneer saoji, paneer cubes in very spicy dark black-brown Nagpuri saoji gravy with oil on top, ${bowl}`],

  // ---------- Veg gravies & sabzi ----------
  [/methi matar malai/, `methi matar malai, green peas and fenugreek leaves in creamy white gravy, ${bowl}`],
  [/kaju (kari|masala)/, `kaju masala, whole cashew nuts in creamy orange-brown gravy, ${bowl}`],
  [/mix vegetable/, `mix vegetable, carrot, beans, peas, cauliflower and capsicum in thick masala gravy, ${bowl}`],
  [/aloo matar/, `aloo matar, potato cubes and green peas in thin red tomato gravy, ${bowl}`],
  [/aloo palak/, `aloo palak, potato cubes in dark green spinach gravy, ${bowl}`],
  [/aloo jeera/, `jeera aloo, dry potato cubes tossed with cumin seeds, turmeric and coriander, ${bowl}`],
  [/aloo gobi/, `aloo gobi, dry potato and cauliflower florets with turmeric and spices, ${bowl}`],
  [/plain palak/, `plain palak, smooth dark green spinach gravy with garlic tempering, ${bowl}`],
  [/lasuni palak/, `lasooni palak, dark green spinach gravy topped with golden fried garlic, ${bowl}`],
  [/green peas masala/, `green peas masala, green peas in thick onion-tomato masala gravy, ${bowl}`],
  [/green peas fry/, `green peas fry, dry sauteed green peas with onion and spices, ${bowl}`],
  [/baingan bharta/, `baingan bharta, smoky mashed roasted brinjal cooked with onion, tomato and green chilli, ${bowl}`],
  [/baingan masala/, `baingan masala, small brinjals in thick spicy masala gravy, ${bowl}`],
  [/dum aloo/, `dum aloo, whole baby potatoes in rich red spicy gravy, ${bowl}`],
  [/bhendi masala/, `bhindi masala, okra pieces in thick onion-tomato masala, ${bowl}`],
  [/bhendi fry|bhindi fry/, `bhindi fry, crispy dry fried okra slices with onion and spices, ${bowl}`],
  [/methi (fry|masala)/, `methi sabzi, fenugreek leaves cooked with potato and spices, ${bowl}`],
  [/shev bhaji/, 'shev bhaji, spicy red Maharashtrian curry topped with lots of crispy yellow sev, in a steel bowl'],
  [/shevga hundi/, `shevga handi, moringa drumstick vegetable pods in rich brown gravy, served in a clay handi pot`],
  [/shevga/, `shevga fry, moringa drumstick vegetable pods cooked in spicy dry masala, ${bowl}`],
  [/navratan korma/, `navratan korma, mixed vegetables, paneer and fruits in creamy white cashew gravy, ${bowl}`],
  [/mushroom butter masala/, `mushroom butter masala, mushroom slices in creamy orange butter gravy, ${bowl}`],
  [/mushroom masala/, `mushroom masala, mushroom slices in thick brown onion-tomato masala, ${bowl}`],
  [/kashmiri dum aloo/, `Kashmiri dum aloo, fried baby potatoes in deep red yogurt-based Kashmiri gravy, ${bowl}`],

  // ---------- Rice ----------
  [/sizzler/, 'veg sizzler rice, fried rice with vegetables, manchurian balls and sauce on a sizzling hot iron plate with steam'],
  [/green chilli pot rice/, 'green chilli pot rice, spicy green fried rice with vegetables served in a clay pot'],
  [/triple schezwan/, 'veg triple schezwan rice, fried rice and noodles on one plate with a bowl of red schezwan veg gravy and crispy fried noodles on top'],
  [/manchurian.*rice/, 'veg manchurian fried rice, fried rice with vegetables topped with manchurian balls in sauce, on a white plate'],
  [/paneer.*palak.*rice|palak.*rice/, 'palak fried rice, green spinach fried rice with vegetables, on a white plate'],
  [/paneer.*rice/, 'paneer fried rice, Indo-Chinese fried rice with paneer cubes, carrot, beans and spring onion, on a white plate'],
  [/schezwan.*rice|hongkong rice|singapore rice/, 'veg schezwan fried rice, spicy red-orange fried rice with carrot, beans, capsicum and spring onion, on a white plate'],
  [/garlic fried rice/, 'veg garlic fried rice, fried rice with golden fried garlic, vegetables and spring onion, on a white plate'],
  [/fried rice/, 'veg fried rice, Indo-Chinese white fried rice with carrot, beans, cabbage and spring onion, on a white plate'],
  [/steam rice/, 'plain steamed white basmati rice in a steel bowl'],
  [/jeera rice/, 'jeera rice, white basmati rice tempered with cumin seeds and coriander, in a steel bowl'],
  [/masala rice/, 'masala rice, spiced Maharashtrian rice with vegetables and peanuts, in a steel bowl'],
  [/khichdi|khichadi/, 'dal khichdi, soft yellow rice and lentil khichdi with ghee tempering, in a steel bowl with papad'],
  [/biryani/, 'veg matka biryani, long-grain basmati rice layered with vegetables, paneer, fried onions and mint, served in a clay pot (matka) with raita'],

  // ---------- Noodles ----------
  [/triple noodles/, 'veg triple noodles, noodles and fried rice together on a plate with schezwan veg gravy and crispy fried noodles on top'],
  [/manchurian.*noodles/, 'veg manchurian noodles, stir-fried noodles with vegetables topped with manchurian balls in sauce, on a white plate'],
  [/paneer.*noodles/, 'paneer noodles, stir-fried hakka noodles with paneer cubes and vegetables, on a white plate'],
  [/schezwan noodles|hongkong noodles|singapore noodles/, 'veg schezwan noodles, spicy red-orange stir-fried noodles with cabbage, carrot, capsicum and spring onion, on a white plate'],
  [/garlic noodles/, 'veg garlic noodles, stir-fried noodles with fried garlic and spring onion, on a white plate'],
  [/noodle/, 'veg hakka noodles, light brown stir-fried noodles with cabbage, carrot, capsicum and spring onion, on a white plate'],

  // ---------- Dal ----------
  [/kolhapuri dal/, 'Kolhapuri dal, spicy red lentil dal with oil and red chilli tempering, in a steel bowl'],
  [/dal tadka/, 'dal tadka, yellow lentil dal with red chilli, garlic and cumin tempering on top, in a steel bowl'],
  [/dal fry/, 'dal fry, thick yellow lentil dal with onion and tomato, garnished with coriander, in a steel bowl'],
  [/plain dal/, 'plain yellow toor dal in a steel bowl'],

  // ---------- Roti ----------
  [/butter roti/, 'tandoori rotis brushed with butter, stacked in a basket'],
  [/tandoor roti/, 'tandoori rotis with charred spots, stacked in a basket lined with cloth'],
  [/garlic naan/, 'garlic naan, soft leavened flatbread topped with chopped garlic, butter and coriander, in a basket'],
  [/butter naan/, 'butter naan, soft leavened flatbread glistening with butter and coriander, in a basket'],
  [/^naan/, 'plain naan, soft teardrop-shaped leavened flatbread with charred bubbles, in a basket'],
  [/aloo paratha/, 'aloo paratha, stuffed potato flatbread with butter on top, with curd and pickle, on a plate'],
  [/paneer paratha/, 'paneer paratha, stuffed paneer flatbread with butter on top, with curd and pickle, on a plate'],
  [/paratha/, 'tandoori paratha, layered flatbread with butter, on a plate'],
  [/stuff kulcha/, 'stuffed kulcha, soft leavened flatbread stuffed with spiced potato, brushed with butter, on a plate'],
  [/kulcha/, 'kulcha, soft round leavened flatbread with butter and coriander, in a basket'],

  // ---------- Papad / thali ----------
  [/masala papad/, 'masala papad, crispy papad topped with chopped onion, tomato, coriander and chaat masala, on a plate'],
  [/papad/, 'crispy round roasted papad on a plate'],
  [/thali/, 'Indian veg thali, large steel plate with paneer curry, aloo gobi, dal tadka, jeera rice, two laccha parathas, gulab jamun, raita, papad and salad in small bowls'],

  // ---------- Sandwich / burger / fries / pizza ----------
  [/bread butter jam/, 'white bread slices spread with butter and red fruit jam, on a plate'],
  [/chocolate grill sandwich/, 'chocolate grilled sandwich, golden grilled bread with molten chocolate filling, cut in triangles, on a plate'],
  [/jam grill sandwich/, 'jam grilled sandwich, golden grilled bread with red jam filling, cut in triangles, on a plate'],
  [/napoleon/, 'special triple-layer grilled sandwich loaded with vegetables, paneer and melted cheese, cut in triangles, on a plate'],
  [/paneer.*sandwich/, 'paneer cheese grilled sandwich, golden grilled bread with paneer and melted cheese filling, cut in triangles, on a plate'],
  [/corn.*sandwich/, 'cheese corn grilled sandwich, golden grilled bread with sweet corn and melted cheese, cut in triangles, on a plate'],
  [/grill.*sandwich/, 'veg cheese grilled sandwich, golden crisp grilled bread with vegetables and melted cheese, cut in triangles, on a plate with ketchup'],
  [/sandwich/, 'Bombay veg sandwich, white bread with green chutney, cucumber, tomato, onion and boiled potato slices, cut in triangles, on a plate'],
  [/tikki burger/, 'veg tikki burger, sesame bun with crispy potato tikki patty, lettuce, tomato, onion and sauce, on a plate'],
  [/peri peri.*fries/, 'peri peri french fries, crispy fries dusted with red peri peri spice, with a dip'],
  [/fries/, 'salted french fries, golden crispy fries in a basket with ketchup'],

  // ---------- Desserts ----------
  [/brownie/, 'sizzling brownie, warm chocolate brownie with a scoop of vanilla ice cream and hot chocolate sauce on a sizzling iron plate'],
  [/lava cake/, 'choco lava cake, warm chocolate cake cut open with molten chocolate flowing out, on a plate'],
  [/ice-?cream scoop/, 'scoops of vanilla ice cream in a glass bowl'],
  [/fruit salad with ice/, 'fruit salad with ice cream, chopped fresh fruits topped with a scoop of vanilla ice cream, in a glass bowl'],
  [/fruit salad/, 'fresh fruit salad, chopped apple, banana, grapes, pomegranate and papaya in a glass bowl'],
  [/sundae/, 'ice cream sundae in a tall glass, layered scoops of ice cream with chocolate sauce, nuts and a cherry on top'],

  // ---------- Drinks ----------
  [/ganga jamuna/, 'Ganga Jamuna juice, a tall glass of layered orange and mosambi juice'],
  [/maramari/, 'mixed fruit juice in a tall glass with fruit pieces'],
  [/mosambi/, 'a tall glass of fresh mosambi sweet lime juice with a lime slice'],
  [/orange juice/, 'a tall glass of fresh orange juice with an orange slice'],
  [/pineapple juice/, 'a tall glass of fresh pineapple juice with a pineapple slice'],
  [/pomegranate/, 'a tall glass of fresh deep red pomegranate juice with pomegranate seeds beside it'],
  [/mastani/, 'Pune style mastani, a tall glass of thick milkshake topped with a scoop of ice cream, chopped dry fruits and a cherry'],
  [/falooda/, 'falooda, tall glass layered with rose syrup, vermicelli, basil seeds, milk and a scoop of ice cream, topped with nuts'],
  [/oreo/, 'oreo milkshake, a tall glass of thick cookies-and-cream milkshake topped with crushed oreo cookies'],
  [/chocolate milkshake/, 'chocolate milkshake, a tall glass of thick chocolate milkshake with chocolate syrup drizzle'],
  [/lassi/, 'lassi, a tall glass of thick creamy lassi topped with a scoop of ice cream and dry fruits'],
  [/milkshake/, 'a tall glass of thick creamy milkshake with a straw'],
  [/mocktail/, 'a colourful mocktail in a tall glass with ice, fruit slices and a straw'],
  [/watermelon mojito/, 'watermelon mojito, a tall glass of pink watermelon mojito with mint leaves, lime and ice'],
  [/mojito/, 'virgin mojito, a tall glass of fizzy mint and lime mojito with ice'],
  [/cold coffee/, 'thick cold coffee, a tall glass of creamy cold coffee with chocolate drizzle and a straw'],
];

// Ingredient phrase for gravy-style dishes not matched above
function mainIngredient(n: string): string {
  if (n.includes('paneer')) return 'soft white paneer cubes';
  if (n.includes('mushroom')) return 'mushroom slices';
  return 'mixed vegetables (carrot, beans, peas, cauliflower, capsicum)';
}

const VEG_STYLES: [RegExp, (m: string) => string][] = [
  [/kolhapuri/, m => `${m} in fiery dark red spicy Kolhapuri gravy with red chilli oil on top, ${bowl}`],
  [/angara/, m => `${m} in smoky bright red spicy angara gravy, ${bowl}`],
  [/malvani/, m => `${m} in spicy brown Malvani coconut gravy, ${bowl}`],
  [/kadhai/, m => `${m} in thick semi-dry masala with chunks of green capsicum and onion, served in a small iron kadhai`],
  [/hundi|handi/, m => `${m} in rich brown gravy served in a clay handi pot, garnished with coriander`],
  [/hyderabadi/, m => `${m} in green-brown gravy made with mint, coriander and spinach, ${bowl}`],
  [/do pyaza/, m => `${m} in brown gravy with lots of large onion petals, ${bowl}`],
  [/lahori/, m => `${m} in rich red-brown Lahori gravy, ${bowl}`],
  [/bhuna/, m => `${m} coated in thick dark brown bhuna masala, ${bowl}`],
  [/maharaja|rajwadi|moghlai/, m => `${m} in rich creamy cashew gravy garnished with cream, cashews and dry fruits, in a large serving bowl`],
  [/patiyala/, m => `${m} in creamy brown gravy, wrapped in a thin paneer-filled crepe, ${bowl}`],
  [/jaipuri/, m => `${m} in rich orange Rajasthani gravy topped with crispy papad pieces, ${bowl}`],
  [/tadkawala|chatpata|chingari|chilimili/, m => `${m} in spicy red tangy masala gravy with a chilli tadka on top, ${bowl}`],
  [/lababdar|mumtaz|laziz|dilruba/, m => `${m} in rich creamy orange-red tomato cashew gravy with a swirl of cream, ${bowl}`],
  [/masala/, m => `${m} in thick reddish-brown onion-tomato masala gravy, ${bowl}`],
];

export function describeVeg(name: string, category: string, description: string | null): { text: string; fallback: boolean } {
  const clean = name.replace(/\(.*?\)/g, '').trim();
  const n = clean.toLowerCase();
  const cat = (category || '').toLowerCase();
  const cheese = /cheese/.test(n) && !/cheese (ball|corn|kofta|grill)|corn cheese|cheese pizza/.test(n) ? ', topped with lots of grated cheese' : '';
  const schez = /schezwan/.test(n) && !/rice|noodle|chutney/.test(n) ? ', made spicy with red schezwan sauce' : '';
  const paneer = /paneer/.test(n) && /pavbhaji|pulao/.test(n) ? ', with paneer cubes' : '';

  // Pizza, pasta, garlic bread, burgers: the menu description already lists the ingredients
  if (/pizza|pasta|garlic bread/.test(cat) || /pizza|pasta/.test(n)) {
    const extra = description ? `, ${description.replace(/\.$/, '').replace(/\(choice of.*?\)/i, '')}` : '';
    return { text: `${clean}, vegetarian ${!/pizza/.test(n) && /pasta/.test(n + cat) ? 'pasta in a white bowl' : /garlic bread|toast/.test(n) ? 'garlic bread' : 'pizza on a wooden board, sliced'}${extra}`, fallback: false };
  }
  if (cat === 'burger' && !/tikki/.test(n)) return { text: `${clean}, vegetarian burger with veg patty, ${description ?? ''}`, fallback: false };
  if (cat === 'french fries' && description) return { text: `${clean}, ${description}`, fallback: false };

  const hit = VEG.find(([re]) => re.test(n));
  if (hit) return { text: `${hit[1]}${cheese}${schez}${paneer}`, fallback: false };

  const style = VEG_STYLES.find(([re]) => re.test(n));
  if (style) return { text: `${clean}, ${style[1](mainIngredient(n))}${cheese}`, fallback: false };

  return { text: `${clean}, vegetarian Indian dish${description ? `, ${description}` : ''}, served on a plate`, fallback: true };
}
