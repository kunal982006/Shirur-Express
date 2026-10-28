import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

// ─── Static Menu Data (matches salon menu with our price & market price) ─────
interface Variant { label: string; marketPrice: number | null; ourPrice: number; }
interface MenuItem {
  id: string;
  name: string;
  marketPrice?: number | null;
  ourPrice?: number;
  time: string;
  desc: string;
  tag?: string;
  startsFrom?: boolean;
  perStrip?: boolean;
  note?: string;
  variants?: Variant[];
  selectedVariantIdx?: number;
}
interface MenuSection {
  id: string;
  title: string;
  short: string; // label on the category pill
  subtitle: string;
  icon: string;
  badgeColor: string;
  items: MenuItem[];
}

const INITIAL_MENU: MenuSection[] = [
  {
    id: "sec-hair-styling",
    title: "Hair Care & Styling",
    short: "Haircuts",
    subtitle: "HAIR • All haircuts — women, kids & hair color",
    icon: "✂️",
    badgeColor: "bg-rose-100 text-rose-700",
    items: [
      { id: "hw-1", name: "Straight Cut", marketPrice: 129, ourPrice: 99, time: "20 mins", desc: "सरळ, स्वच्छ आणि क्लासिक हेअर कट." },
      { id: "hw-2", name: "U Cut", marketPrice: 189, ourPrice: 149, time: "25 mins", desc: "मागे हलकासा गोलाकार देऊन मिळणारा नॅचरल लूक." },
      { id: "hw-3", name: "V Cut", marketPrice: 189, ourPrice: 149, time: "25 mins", desc: "केसांना आकर्षक आणि शार्प V-शेप देणारा स्टायलिश कट." },
      { id: "hw-4", name: "Butterfly Cut", marketPrice: 349, ourPrice: 299, time: "40 mins", desc: "केसांना भरपूर बाऊन्स आणि ट्रेन्डी व्हॉल्युम देणारा लेअर्ड कट.", tag: "Advanced" },
      { id: "hw-5", name: "Layer Cut", marketPrice: 279, ourPrice: 249, time: "35 mins", desc: "केस दाट आणि मोकळे दिसण्यासाठी परफेक्ट स्टेप्स." },
      { id: "hw-6", name: "Feather Cut", marketPrice: 279, ourPrice: 249, time: "35 mins", desc: "हलके, मोकळे आणि चेहऱ्याला फ्रेश लूक देणारे लेअर्स." },
      { id: "hw-7", name: "Face Framing Cut", marketPrice: 349, ourPrice: 299, time: "35 mins", desc: "चेहऱ्याचा आकार उठून दिसण्यासाठी पुढच्या केसांची खास कटिंग.", tag: "Advanced" },
      { id: "hw-8", name: "Curtain Bangs with Layers", marketPrice: 399, ourPrice: 350, time: "45 mins", desc: "स्टायलिश फ्रंट फ्लिक्स आणि सुंदर बॅक लेअर्सचा कॉम्बो.", tag: "Advanced" },
      { id: "hw-9", name: "Blunt Cut / Long Bob", marketPrice: 179, ourPrice: 149, time: "30 mins", desc: "खांद्यापर्यंतचा मॉडर्न, शार्प आणि सोबर स्ट्रेट कट." },
      { id: "hw-10", name: "Soft Layer Cut", marketPrice: 399, ourPrice: 349, time: "40 mins", desc: "रोजच्या वापरासाठी एकदम नॅचरल आणि हलके लेअर्स." },
      { id: "hw-11", name: "Multi Step Cut", marketPrice: 319, ourPrice: 279, time: "40 mins", desc: "जास्त स्टेप्स आणि केसांमध्ये एक्स्ट्रा बाऊन्स हवा असल्यास." },
      { id: "hw-12", name: "90-Degree Step Cut", marketPrice: 219, ourPrice: 179, time: "35 mins", desc: "केस जाड आणि भरगच्च दिसण्यासाठी योग्य कट." },
      { id: "hw-13", name: "Voluminous Feather Cut", marketPrice: 389, ourPrice: 349, time: "45 mins", desc: "बारीक किंवा विरळ केसांसाठी हेवी व्हॉल्युम देणारा कट.", tag: "Advanced" },
      { id: "hw-14", name: "Long Hair Step Cut", marketPrice: 389, ourPrice: 349, time: "45 mins", desc: "केसांची लांबी न कमी करता दिलेला स्टायलिश स्टेप लूक." },
      { id: "hw-15", name: "Long Layer Cut", marketPrice: 389, ourPrice: 349, time: "45 mins", desc: "लांब केसांसाठी स्मूथ आणि सुंदर फ्लो देणारे लेअर्स." },
      { id: "kh-1", name: "Little Round Cut", marketPrice: 149, ourPrice: 99, time: "20 mins", desc: "लहान मुलांसाठी क्यूट, सोपा आणि नीटनेटका कट." },
      { id: "kh-2", name: "Apple Cut", marketPrice: 189, ourPrice: 149, time: "25 mins", desc: "गोड चेहऱ्यावर उठून दिसणारा गोल बाऊन्सी कट." },
      { id: "kh-3", name: "Mushroom Cut", marketPrice: 199, ourPrice: 149, time: "25 mins", desc: "मुलांसाठी सांभाळायला सोपा आणि क्लासिक मशरूम शेप." },
      { id: "kh-4", name: "Baby Bob Cut", marketPrice: 199, ourPrice: 149, time: "25 mins", desc: "लहान मुलींसाठी एकदम गोड आणि मॉडर्न बॉब कट." },
      { id: "hc-1", name: "Root Touch-Up", marketPrice: 699, ourPrice: 499, time: "45 mins", desc: "पांढरे केस आणि मुळांमधील वाढ लपवण्यासाठी झटपट कलर." },
      { id: "hc-2", name: "Full Hair Color (Global)", marketPrice: null, ourPrice: 799, startsFrom: true, time: "90 mins", desc: "मुळांपासून टोकापर्यंत एकसारखा, रिच आणि चमकदार रंग.", tag: "Advanced", note: "Starting from ₹799 • Final price depends upon hair length" },
      { id: "hc-3", name: "Hair Highlights", marketPrice: null, ourPrice: 199, perStrip: true, time: "30 mins", desc: "केसांना मॉडर्न आणि फॅशनेबल लूक देण्यासाठी हायलाइट स्ट्रिप्स.", tag: "Advanced", note: "₹199 per strip • Depends upon customer requirement & highlight color type" },
    ],
  },
  {
    id: "sec-hair-treatments",
    title: "Hair Treatments & Texture",
    short: "Treatments",
    subtitle: "HAIR • Scalp care, Keratin, Botox, Smoothening & more",
    icon: "✨",
    badgeColor: "bg-pink-100 text-pink-700",
    items: [
      { id: "hcd-1", name: "Anti-Dandruff Treatment", marketPrice: 1299, ourPrice: 999, time: "60 mins", desc: "कोंड्याचा मुळापासून नायनाट आणि टाळूची (Scalp) खोलवर स्वच्छता." },
      { id: "hcd-2", name: "Hair Regrowth Therapy", marketPrice: 399, ourPrice: 299, time: "45 mins", desc: "केस गळती रोखण्यासाठी आणि मुळे मजबूत करण्यासाठी खास उपचार.", tag: "Advanced" },
      { id: "hs-1", name: "Hair Straightening", marketPrice: null, ourPrice: 3499, startsFrom: true, time: "2.5–3 hrs", desc: "कुरळे केस कायमस्वरूपी एकदम सरळ आणि स्लीक करण्यासाठी.", tag: "Advanced", note: "टीप: केसांची लांबी व घनतेनुसार अंतिम दर ठरवले जातील, ब्युटिशियन प्रत्यक्ष पाहणी करतील." },
      { id: "hs-2", name: "Hair Smoothening", marketPrice: null, ourPrice: 4599, startsFrom: true, time: "2.5–3 hrs", desc: "केसांचा कोरडेपणा घालवून मिळणारा मऊ, रेशमी आणि नॅचरल लूक.", tag: "Advanced", note: "टीप: केसांची लांबी व घनतेनुसार अंतिम दर ठरवले जातील, ब्युटिशियन प्रत्यक्ष पाहणी करतील." },
      { id: "hs-3", name: "Keratin Treatment", marketPrice: null, ourPrice: 3999, startsFrom: true, time: "2.5 hrs", desc: "केसांना आवश्यक प्रोटीन देऊन फ्रिझिनेस (रुखेपणा) घालवण्यासाठी.", tag: "Advanced", note: "टीप: केसांची लांबी व घनतेनुसार अंतिम दर ठरवले जातील, ब्युटिशियन प्रत्यक्ष पाहणी करतील." },
      { id: "hs-4", name: "Hair Botox", marketPrice: null, ourPrice: 4499, startsFrom: true, time: "2.5 hrs", desc: "खराब झालेल्या (डॅमेज) केसांना रिपेअर करून चमकदार बनवण्यासाठी.", tag: "Advanced", note: "टीप: केसांची लांबी व घनतेनुसार अंतिम दर ठरवले जातील, ब्युटिशियन प्रत्यक्ष पाहणी करतील." },
      { id: "hs-5", name: "Nanoplastia", marketPrice: null, ourPrice: 5999, startsFrom: true, time: "3 hrs", desc: "केमिकल-फ्री फॉर्म्युला, जो केसांना देईल काचेसारखी चमक आणि स्ट्रेट लूक.", tag: "Advanced", note: "टीप: केसांची लांबी व घनतेनुसार अंतिम दर ठरवले जातील, ब्युटिशियन प्रत्यक्ष पाहणी करतील." },
      { id: "hs-6", name: "Aqua Gold Treatment", marketPrice: null, ourPrice: 6499, startsFrom: true, time: "3 hrs", desc: "कोरड्या केसांना मऊ आणि तजेलदार बनवणारी सुपर लक्झरी ट्रीटमेंट.", tag: "Advanced", note: "टीप: केसांची लांबी व घनतेनुसार अंतिम दर ठरवले जातील, ब्युटिशियन प्रत्यक्ष पाहणी करतील." },
    ],
  },
  {
    id: "sec-facials",
    title: "Facials",
    short: "Facials",
    subtitle: "SKIN • Glow, cleanup & facial treatments",
    icon: "🧖‍♀️",
    badgeColor: "bg-emerald-100 text-emerald-800",
    items: [],
  },
  {
    id: "sec-wax",
    title: "Hair Removal (Wax)",
    short: "Wax",
    subtitle: "WAX • Face, hands & legs waxing",
    icon: "🍯",
    badgeColor: "bg-orange-100 text-orange-800",
    items: [
      { id: "fw-1", name: "Bean Wax (Full Face)", marketPrice: 499, ourPrice: 399, time: "25 mins", desc: "चेहऱ्यावरील बारीक लव आणि केस त्रास न होता सहज काढण्यासाठी पेनलेस वॅक्स.", tag: "Advanced" },
      { id: "fw-2", name: "Brazilian Face Wax", marketPrice: 399, ourPrice: 299, time: "20 mins", desc: "अतिशय नाजूक त्वचेसाठी सौम्य, सुरक्षित आणि विना-पट्टीची (Stripless) वॅक्स.", tag: "Advanced" },
      { id: "fw-3", name: "Microwave Face Wax", marketPrice: 549, ourPrice: 449, time: "25 mins", desc: "सेन्सिटिव्ह त्वचेसाठी झटपट वितळणारी, मऊ आणि सुरक्षित वॅक्स.", tag: "Advanced" },
      { id: "fw-4", name: "Paraffin Face Wax", marketPrice: 499, ourPrice: 399, time: "30 mins", desc: "टॅनिंग काढून चेहऱ्यावर नैसर्गिक ओलावा आणि चमक टिकवणारी वॅक्स.", tag: "Advanced" },
      {
        id: "bw-1", name: "Regular Gel Wax", time: "25–40 mins",
        desc: "कमी खर्चात रोजच्या देखभालीसाठी सोपी आणि जलद जेल वॅक्सिंग.",
        selectedVariantIdx: 0,
        variants: [
          { label: "Hands", marketPrice: 199, ourPrice: 149 },
          { label: "Legs", marketPrice: 299, ourPrice: 249 },
        ],
      },
      {
        id: "bw-2", name: "Rica Italian Wax", time: "30–45 mins",
        desc: "कमी वेदना आणि मऊ त्वचेसाठी खास केमिकल-फ्री इटालियन वॅक्स.",
        tag: "Advanced",
        selectedVariantIdx: 0,
        variants: [
          { label: "Hands", marketPrice: 499, ourPrice: 399 },
          { label: "Legs", marketPrice: 849, ourPrice: 699 },
        ],
      },
      {
        id: "bw-3", name: "Roll-On Cartridge Wax", time: "30–45 mins",
        desc: "स्वच्छ, वेगवान आणि अजिबात पसारा न होणारी 100% हायजिनिक वॅक्स.",
        tag: "Advanced",
        selectedVariantIdx: 0,
        variants: [
          { label: "Hands", marketPrice: 549, ourPrice: 449 },
          { label: "Legs", marketPrice: 1199, ourPrice: 999 },
        ],
      },
      {
        id: "bw-4", name: "Brazilian Body Wax", time: "20–45 mins",
        desc: "फक्त केसांना पकडणारी आणि त्वचेला अजिबात ताण न देणारी प्रीमियम वॅक्स.",
        tag: "Advanced",
        selectedVariantIdx: 0,
        variants: [
          { label: "Hands", marketPrice: 599, ourPrice: 499 },
          { label: "Legs", marketPrice: 1199, ourPrice: 999 },
        ],
      },
    ],
  },
  {
    id: "sec-makeup-studio",
    title: "Makeup & Studio Services",
    short: "Makeup",
    subtitle: "STUDIO • Makeup, manicure & pedicure",
    icon: "💄",
    badgeColor: "bg-purple-100 text-purple-800",
    items: [
      { id: "hf-1", name: "Basic Manicure", marketPrice: 349, ourPrice: 299, time: "35 mins", desc: "हातांची मूलभूत स्वच्छता, नखांचा शेप आणि हलका मसाज." },
      { id: "hf-2", name: "Spa Glow Manicure", marketPrice: 699, ourPrice: 599, time: "45 mins", desc: "टॅनिंग घालवणारा स्क्रब, पॅक आणि हातांना ग्लो देणारा डीप मसाज.", tag: "Advanced" },
      { id: "hf-3", name: "Basic Pedicure", marketPrice: 599, ourPrice: 499, time: "45 mins", desc: "पायांची स्वच्छता, टाचांची काळजी आणि रिलॅक्सिंग मसाज." },
      { id: "hf-4", name: "Spa Glow Pedicure", marketPrice: 899, ourPrice: 799, time: "60 mins", desc: "मृत त्वचा काढून भेगा भरण्यासाठी आणि पायांना मऊ करण्यासाठी खास स्पा.", tag: "Advanced" },
    ],
  },
];

// ─── Cart key helper ───────────────────────────────────────────────────────────
function getCartKey(item: MenuItem, variantIdx?: number): string {
  if (item.variants) {
    const idx = variantIdx !== undefined ? variantIdx : (item.selectedVariantIdx ?? 0);
    return item.id + "__" + item.variants[idx].label;
  }
  return item.id;
}

// ─── Cart entry ────────────────────────────────────────────────────────────────
interface CartEntry {
  key: string; sectionId: string; itemId: string;
  name: string; marketPrice: number; ourPrice: number; qty: number;
}
type CartMap = Record<string, CartEntry>;

type MainTab = "home" | "bookings";
interface BookingRecord { id: string; services: string; total: number; market: number; time: string; mode: string; }

// ─── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold max-w-xs text-center"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Makeup artist contact ─────────────────────────────────────────────────────
const ARTIST = { name: "Sujata Kale", phone: "9665763204", altPhone: "9130113956" };
const formatPhone = (p: string) => p.slice(0, 5) + " " + p.slice(5);

// ─── Call Modal ────────────────────────────────────────────────────────────────
function CallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white border border-rose-100 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto text-2xl">📞</div>
            <div>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">Beautician Online</span>
              <h3 className="font-extrabold text-base text-slate-800 mt-1">Direct Call Salon Specialist</h3>
              <p className="text-xs text-slate-500 mt-1">For Hair Straightening, Smoothening, Keratin, Botox, Nanoplastia, Aqua Gold or Global Color length consultation, our expert beautician will guide you immediately.</p>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 text-left text-xs space-y-1">
              <p className="font-bold text-slate-800">👩‍💼 Makeup Artist: {ARTIST.name}</p>
              <p className="text-slate-600">📞 Primary: <strong>{formatPhone(ARTIST.phone)}</strong></p>
              <p className="text-slate-600">📞 Alternate: <strong>{formatPhone(ARTIST.altPhone)}</strong></p>
              <p className="text-[11px] text-rose-600 font-medium">✨ Free consultation on hair length & highlight strips!</p>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs">Close</button>
              <a href={"tel:+91" + ARTIST.phone} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1">
                📞 Call Now
              </a>
            </div>
            <a href={"tel:+91" + ARTIST.altPhone} className="block text-[11px] text-rose-600 font-semibold underline">
              Not reachable? Call alternate number {formatPhone(ARTIST.altPhone)}
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Cart Drawer ───────────────────────────────────────────────────────────────
function CartDrawer({ open, onClose, cart, onModify, onConfirm }: {
  open: boolean; onClose: () => void; cart: CartMap;
  onModify: (key: string, delta: number) => void;
  onConfirm: (mode: string, time: string) => void;
}) {
  const [mode, setMode] = useState("Parlor Studio Visit");
  const [time, setTime] = useState("Today, Within 1 Hr");
  const items = Object.values(cart);
  const totalOur = items.reduce((s, i) => s + i.ourPrice * i.qty, 0);
  const totalMarket = items.reduce((s, i) => s + i.marketPrice * i.qty, 0);
  const savings = Math.max(0, totalMarket - totalOur);

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex flex-col justify-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-5 shadow-2xl border-t border-rose-100 max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-800">Your Parlor Service Bag</h3>
                <p className="text-[11px] text-slate-500">Transparent 'Our Price' billing • Pay after service</p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 text-sm">✕</button>
            </div>

            {/* Items */}
            <div className="overflow-y-auto py-3 space-y-2.5 flex-1">
              {items.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto text-lg">🛍️</div>
                  <p className="text-xs font-bold text-slate-700">Your service bag is empty</p>
                  <p className="text-[11px] text-slate-400">Tap '+ ADD' on any haircut, wax, or treatment from the menu.</p>
                </div>
              ) : items.map(item => (
                <div key={item.key} className="bg-slate-50 border border-rose-100 rounded-xl p-3 flex items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-xs text-slate-800">{item.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {item.marketPrice > item.ourPrice && (
                        <span className="text-[10px] text-slate-400 line-through">₹{item.marketPrice}</span>
                      )}
                      <span className="text-xs font-extrabold text-rose-600">₹{item.ourPrice}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-rose-200 rounded-lg overflow-hidden">
                      <button onClick={() => onModify(item.key, -1)} className="px-2.5 py-1 text-rose-600 font-bold text-xs hover:bg-rose-50">-</button>
                      <span className="px-2 text-xs font-extrabold text-slate-800">{item.qty}</span>
                      <button onClick={() => onModify(item.key, 1)} className="px-2.5 py-1 text-rose-600 font-bold text-xs hover:bg-rose-50">+</button>
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 w-14 text-right">₹{item.ourPrice * item.qty}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Slot Picker */}
            <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-3 my-2 space-y-2">
              <label className="text-[11px] font-extrabold text-slate-700 block">Select Preferred Visit Type & Time</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <select value={mode} onChange={e => setMode(e.target.value)} className="bg-white border border-rose-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 outline-none">
                  <option value="Parlor Studio Visit">🏪 Visit Parlor Studio</option>
                  <option value="Home Salon Service">🏠 Home Service (+₹50)</option>
                </select>
                <select value={time} onChange={e => setTime(e.target.value)} className="bg-white border border-rose-200 rounded-xl px-2.5 py-2 font-semibold text-slate-700 outline-none">
                  <option value="Today, Within 1 Hr">⚡ Express (In 60 mins)</option>
                  <option value="Today, 5:00 PM">🕔 Today, 5:00 PM</option>
                  <option value="Tomorrow, 11:00 AM">🕚 Tomorrow, 11:00 AM</option>
                  <option value="Tomorrow, 4:00 PM">🕓 Tomorrow, 4:00 PM</option>
                </select>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="border-t border-slate-100 pt-3 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Market Price Total</span>
                <span className="line-through">₹{totalMarket}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-xs font-bold text-emerald-600">
                  <span>Shirur Express Discount</span>
                  <span>- ₹{savings}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-800 pt-1">
                <span>Our Final Price</span>
                <span className="text-rose-600">₹{totalOur}</span>
              </div>
              <button
                onClick={() => onConfirm(mode, time)}
                className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-lg shadow-rose-200 transition flex items-center justify-center gap-2 mt-2"
              >
                ✅ Confirm Salon Booking
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Service Card ──────────────────────────────────────────────────────────────
function ServiceCard({ section, item, cart, onModify, onVariantChange, onCallModal }: {
  section: MenuSection;
  item: MenuItem;
  cart: CartMap;
  onModify: (sectionId: string, itemId: string, delta: number) => void;
  onVariantChange: (sectionId: string, itemId: string, idx: number) => void;
  onCallModal: () => void;
}) {
  const activeVarIdx = item.selectedVariantIdx ?? 0;
  const activeVar = item.variants ? item.variants[activeVarIdx] : null;

  const activeMarket = activeVar ? activeVar.marketPrice : (item.marketPrice ?? null);
  const activeOur = activeVar ? activeVar.ourPrice : (item.ourPrice ?? 0);
  const activeVarLabel = activeVar ? activeVar.label : null;

  const savings = (activeMarket && activeMarket > activeOur) ? activeMarket - activeOur : 0;
  const cartKey = getCartKey(item);
  const qtyInCart = cart[cartKey]?.qty ?? 0;

  return (
    <div className={"bg-white border rounded-2xl p-3.5 shadow-sm transition relative overflow-hidden " + (qtyInCart > 0 ? "border-rose-300" : "border-rose-100/90 hover:border-rose-300")}>
      <div className="flex justify-between items-start gap-3">
        {/* Left */}
        <div className="space-y-1 flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {savings > 0 && (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md">SAVE ₹{savings}</span>
            )}
            {item.tag && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md">★ {item.tag}</span>
            )}
            {item.startsFrom && (
              <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md">Starts From</span>
            )}
            {item.perStrip && (
              <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md">Per Strip</span>
            )}
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              🕐 {item.time}
            </span>
          </div>
          {/* Name */}
          <h4 className="font-extrabold text-sm text-slate-800 leading-snug">
            {item.name}{" "}
            {activeVarLabel && <span className="text-rose-600 font-bold text-xs">({activeVarLabel})</span>}
          </h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
        </div>

        {/* Right: price + action */}
        <div className="text-right flex flex-col items-end shrink-0">
          <div className="flex items-baseline gap-1.5">
            {activeMarket && activeMarket > activeOur && (
              <span className="text-xs text-slate-400 line-through font-semibold">₹{activeMarket}</span>
            )}
            <span className="text-base font-extrabold text-slate-900">₹{activeOur}</span>
          </div>
          <span className="text-[9px] uppercase tracking-wider font-extrabold text-rose-600 mb-2">Our Price</span>

          {/* ADD / Counter */}
          {qtyInCart === 0 ? (
            <button
              onClick={() => onModify(section.id, item.id, 1)}
              className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border-2 border-rose-500 font-extrabold text-xs px-4 py-1.5 rounded-xl active:scale-95 transition"
            >
              + ADD
            </button>
          ) : (
            <div className="flex items-center bg-rose-600 text-white rounded-xl shadow-sm overflow-hidden border border-rose-600">
              <button onClick={() => onModify(section.id, item.id, -1)} className="px-2.5 py-1.5 hover:bg-rose-700 font-extrabold text-xs">-</button>
              <span className="px-2 text-xs font-extrabold">{qtyInCart}</span>
              <button onClick={() => onModify(section.id, item.id, 1)} className="px-2.5 py-1.5 hover:bg-rose-700 font-extrabold text-xs">+</button>
            </div>
          )}
        </div>
      </div>

      {/* Variant Pills */}
      {item.variants && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Select Option:</p>
          <div className="flex flex-wrap gap-1.5">
            {item.variants.map((v, idx) => {
              const vKey = getCartKey(item, idx);
              const vQty = cart[vKey]?.qty ?? 0;
              const isSelected = idx === activeVarIdx;
              return (
                <button
                  key={v.label}
                  onClick={() => onVariantChange(section.id, item.id, idx)}
                  className={"flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-between gap-1 " + (isSelected
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                    : "bg-rose-50/60 text-slate-700 border-rose-200 hover:bg-rose-100/70"
                  )}
                >
                  <span>{v.label}</span>
                  <span className={"text-[11px] font-extrabold " + (isSelected ? "text-rose-100" : "text-rose-600")}>
                    ₹{v.ourPrice}{vQty > 0 ? " (" + vQty + ")" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Note Box */}
      {item.note && (
        <div className="mt-2.5 bg-amber-50/90 border border-amber-200/80 rounded-xl p-2.5 flex items-start justify-between gap-2">
          <div className="flex items-start gap-1.5 text-[11px] text-amber-900 leading-snug">
            <span className="text-amber-600 mt-0.5 shrink-0">ℹ️</span>
            <span>{item.note}</span>
          </div>
          <button onClick={onCallModal} className="shrink-0 bg-white hover:bg-amber-100 text-rose-600 border border-amber-300 px-2 py-1 rounded-lg text-[10px] font-extrabold">
            📞 Ask
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BeautyDetail() {
  const [, setLocation] = useLocation();

  // State
  const [menuData, setMenuData] = useState<MenuSection[]>(() =>
    INITIAL_MENU.map(sec => ({
      ...sec,
      items: sec.items.map(item => ({ ...item, selectedVariantIdx: item.variants ? 0 : undefined })),
    }))
  );
  const [activeTab, setActiveTab] = useState<MainTab>("home");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartMap>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, msg: "" });
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The partner parlor's name/address are deliberately not shown; customers see
  // the Shirur Express Salon brand.
  const info = { name: "Shirur Express Salon", address: "Home & Studio Parlor • Shirur" };

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToast({ visible: true, msg });
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast({ visible: false, msg: "" }), 2800);
  }, []);

  // Cart key helper using live menuData
  function getItemAndSection(sectionId: string, itemId: string) {
    const section = menuData.find(s => s.id === sectionId);
    const item = section?.items.find(i => i.id === itemId);
    return { section, item };
  }

  // Modify cart
  const modifyCart = useCallback((sectionId: string, itemId: string, delta: number) => {
    const { section, item } = getItemAndSection(sectionId, itemId);
    if (!section || !item) return;

    const cartKey = getCartKey(item);
    let displayName = item.name;
    let marketPr = item.marketPrice ?? item.ourPrice ?? 0;
    let ourPr = item.ourPrice ?? 0;

    if (item.variants) {
      const v = item.variants[item.selectedVariantIdx ?? 0];
      displayName = item.name + " (" + v.label + ")";
      marketPr = v.marketPrice ?? v.ourPrice;
      ourPr = v.ourPrice;
    }

    setCart(prev => {
      const existing = prev[cartKey];
      const newQty = (existing?.qty ?? 0) + delta;

      if (newQty <= 0) {
        const next = { ...prev };
        delete next[cartKey];
        showToast("Removed " + displayName + " from bag");
        return next;
      }

      if (!existing && delta > 0) showToast("✨ Added " + displayName + " (₹" + ourPr + ")");

      return {
        ...prev,
        [cartKey]: {
          key: cartKey, sectionId, itemId,
          name: displayName, marketPrice: marketPr, ourPrice: ourPr,
          qty: newQty,
        },
      };
    });
  }, [menuData, showToast]);

  // Modify cart by key (from drawer)
  const modifyCartByKey = useCallback((key: string, delta: number) => {
    setCart(prev => {
      const existing = prev[key];
      if (!existing) return prev;
      const newQty = existing.qty + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: { ...existing, qty: newQty } };
    });
  }, []);

  // Change variant
  const changeVariant = useCallback((sectionId: string, itemId: string, idx: number) => {
    setMenuData(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: sec.items.map(item => {
          if (item.id !== itemId) return item;
          return { ...item, selectedVariantIdx: idx };
        }),
      };
    }));
  }, []);

  // Confirm booking
  const confirmBooking = useCallback((mode: string, time: string) => {
    const items = Object.values(cart);
    if (items.length === 0) { showToast("⚠️ Please add at least one service!"); return; }

    const totalOur = items.reduce((s, i) => s + i.ourPrice * i.qty, 0);
    const totalMarket = items.reduce((s, i) => s + i.marketPrice * i.qty, 0);
    const namesSummary = items.map(i => i.name + (i.qty > 1 ? " x" + i.qty : "")).join(" + ");

    const newBooking: BookingRecord = {
      id: "SE-" + Math.floor(1000 + Math.random() * 9000),
      services: namesSummary, total: totalOur, market: totalMarket, time, mode,
    };
    setBookings(prev => [newBooking, ...prev]);
    setCart({});
    setCartOpen(false);
    setActiveTab("bookings");
    showToast("🎉 Booking Confirmed! Our beautician will attend you shortly.");
  }, [cart, showToast]);

  // Scroll to section
  function scrollToSection(id: string) {
    setSelectedCategory(id);
    if (id === "all") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Search filter
  const filteredSections = searchQuery.trim()
    ? menuData.map(sec => ({
        ...sec,
        items: sec.items.filter(item => {
          const q = searchQuery.toLowerCase();
          return item.name.toLowerCase().includes(q)
            || (item.desc || "").toLowerCase().includes(q)
            || sec.title.toLowerCase().includes(q)
            || (item.variants?.some(v => v.label.toLowerCase().includes(q)) ?? false);
        }),
      })).filter(sec => sec.items.length > 0)
    : menuData;

  // Cart summary
  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.ourPrice * i.qty, 0);
  const cartSavings = cartItems.reduce((s, i) => s + Math.max(0, i.marketPrice - i.ourPrice) * i.qty, 0);
  const totalItems = menuData.reduce((s, sec) => s + sec.items.length, 0);


  return (
    <div className="bg-[#FFF8FA] text-[#1E293B] min-h-screen font-sans antialiased flex flex-col">

      {/* ── STICKY HEADER ── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-rose-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-md mx-auto px-4 pt-3 pb-2.5">
          {/* Top Row */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2.5">
              <button onClick={() => setLocation("/")}
                className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 text-white flex items-center justify-center shadow-md shadow-rose-200 text-lg"
              >✨</button>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-base tracking-tight text-slate-800">{info.name}</h1>
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">Salon</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">📍 {info.address}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setCallOpen(true)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >📞 Help</button>
              <button onClick={() => setActiveTab(activeTab === "home" ? "bookings" : "home")}
                className="relative bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-sm"
              >
                {activeTab === "home" ? "📅 Bookings" : "✂️ Menu"}
                {activeTab === "home" && bookings.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 text-slate-900 font-extrabold rounded-full text-[9px] flex items-center justify-center border border-white">
                    {bookings.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search — home tab only */}
          {activeTab === "home" && (
            <div className="mt-3 relative">
              <span className="absolute left-3.5 top-2.5 text-rose-400 text-xs pointer-events-none">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search 'Butterfly cut', 'Rica wax', 'Keratin', 'Pedicure'..."
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-rose-100 focus:border-rose-400 rounded-xl pl-9 pr-8 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none transition shadow-inner"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs">✕</button>
              )}
            </div>
          )}
        </div>

        {/* Category Pills — home tab only */}
        {activeTab === "home" && (
          <div className="max-w-md mx-auto px-4 py-2 bg-white border-t border-rose-50 flex space-x-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <button
              onClick={() => scrollToSection("all")}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-sm ${
                selectedCategory === "all"
                  ? "bg-rose-600 text-white border border-rose-600 shadow-rose-200"
                  : "bg-rose-50/70 text-slate-700 hover:bg-rose-100 border border-rose-100"
              }`}
            >
              <span>All Menu</span>
              <span className={`text-[10px] font-extrabold px-1.5 rounded-full ${
                selectedCategory === "all" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
              }`}>
                ({totalItems})
              </span>
            </button>
            {menuData.map(sec => {
              const isSelected = selectedCategory === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                    isSelected
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-200"
                      : "bg-rose-50/70 text-slate-700 hover:bg-rose-100 border-rose-100"
                  }`}
                >
                  {sec.icon} {sec.short}
                  {sec.items.length > 0 && (
                    <span className={`text-[10px] font-bold ${isSelected ? "text-white/90" : "text-rose-600"}`}>
                      ({sec.items.length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* ── MAIN ── */}
      <main className="max-w-md mx-auto w-full flex-1 px-4 pt-3 pb-40">

        {/* ── HOME TAB ── */}
        {activeTab === "home" && (
          <div className="space-y-5">
            {/* Promo Banner */}
            <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 rounded-2xl p-4 text-white shadow-md shadow-rose-200/70 relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div className="space-y-1 max-w-[72%]">
                  <span className="bg-white/25 backdrop-blur-sm text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Flat Parlor Savings</span>
                  <h2 className="text-base font-extrabold leading-tight">Up to 35% OFF on Complete Salon Menu!</h2>
                  <p className="text-[11px] text-rose-50 font-medium">All categories open below • Zero hidden menus • Direct Add</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex flex-col items-center justify-center border border-white/30 shrink-0">
                  <span className="text-xs font-bold">STARTS</span>
                  <span className="text-lg font-extrabold">₹99</span>
                </div>
              </div>
            </div>

            {/* Trust Bar */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white border border-rose-100 rounded-xl p-2 shadow-sm">
                <p className="text-xs font-extrabold text-rose-600">🏷️ Our Price</p>
                <p className="text-[10px] text-slate-500">Lowest in Shirur</p>
              </div>
              <div className="bg-white border border-rose-100 rounded-xl p-2 shadow-sm">
                <p className="text-xs font-extrabold text-emerald-600">🛡️ 100% Hygienic</p>
                <p className="text-[10px] text-slate-500">Branded Kits</p>
              </div>
              <div className="bg-white border border-rose-100 rounded-xl p-2 shadow-sm">
                <p className="text-xs font-extrabold text-amber-600">👩‍💼 Expert Didi</p>
                <p className="text-[10px] text-slate-500">Certified Stylists</p>
              </div>
            </div>

            {/* Menu Sections */}
            <div id="menuSectionsWrapper" className="space-y-6">
              {filteredSections.length === 0 ? (
                <div className="bg-white border border-rose-100 rounded-2xl p-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto text-lg">🔍</div>
                  <h4 className="font-bold text-sm text-slate-800">No matching parlor service found</h4>
                  <p className="text-xs text-slate-500">Try "Cut", "Wax", "Keratin", or clear the search filter.</p>
                  <button onClick={() => setSearchQuery("")} className="mt-2 bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-xl">Show All Services</button>
                </div>
              ) : filteredSections.map(sec => (
                <section key={sec.id} id={sec.id} className="scroll-mt-32 space-y-3">
                  {/* Section Header */}
                  <div className="flex items-center justify-between bg-white border border-rose-100 rounded-2xl px-3.5 py-2.5 shadow-sm">
                    <div className="flex items-center space-x-2.5">
                      <span className={"w-9 h-9 rounded-xl " + sec.badgeColor + " flex items-center justify-center text-base"}>{sec.icon}</span>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-800">{sec.title}</h3>
                        <p className="text-[11px] text-slate-500 font-medium">{sec.subtitle}</p>
                      </div>
                    </div>
                    {sec.items.length > 0 && (
                      <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[11px] font-extrabold px-2.5 py-1 rounded-full">
                        {sec.items.length} {sec.items.length === 1 ? "Item" : "Items"}
                      </span>
                    )}
                  </div>

                  {/* Items */}
                  {sec.items.length === 0 && (
                    <div className="bg-white border border-dashed border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-600">Call {ARTIST.name} for {sec.title.toLowerCase()} options & prices.</p>
                      <button onClick={() => setCallOpen(true)} className="shrink-0 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3 py-2 rounded-xl">📞 Call</button>
                    </div>
                  )}
                  <div className="space-y-2.5">
                    {sec.items.map(item => (
                      <ServiceCard
                        key={item.id}
                        section={sec}
                        item={item}
                        cart={cart}
                        onModify={modifyCart}
                        onVariantChange={changeVariant}
                        onCallModal={() => setCallOpen(true)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Call Specialist Banner */}
            <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border-2 border-rose-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-start space-x-3">
                <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-200 mt-0.5 text-lg">🎧</div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-100 px-2 py-0.5 rounded-md">Direct Call Specialist</span>
                  <h4 className="text-xs font-extrabold text-slate-800 mt-1">Confused about Hair Length or Treatments?</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">Hume call karein! Our makeup artist Sujata Kale will guide you on Keratin, Straightening & Color prices.</p>
                </div>
              </div>
              <button onClick={() => setCallOpen(true)} className="shrink-0 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md shadow-rose-200 transition">
                📞 Call Now
              </button>
            </div>
          </div>
        )}

        {/* ── BOOKINGS TAB ── */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm">
              <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">📅 My Salon Bookings</h2>
              <p className="text-xs text-slate-500 mt-0.5">Track your upcoming parlor appointments and specialist visits.</p>
            </div>
            {bookings.length === 0 ? (
              <div className="bg-white border border-rose-100 rounded-2xl p-8 text-center space-y-2 shadow-sm">
                <div className="text-3xl">💆‍♀️</div>
                <h4 className="font-bold text-sm text-slate-700">No bookings yet</h4>
                <p className="text-xs text-slate-400">Add services from the Salon Menu and confirm a booking.</p>
                <button onClick={() => setActiveTab("home")} className="mt-2 bg-rose-600 text-white text-xs font-bold px-4 py-2 rounded-xl">Browse Services</button>
              </div>
            ) : bookings.map(b => (
              <div key={b.id} className="bg-white border border-rose-100 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                      NEW BOOKING • {b.mode.toUpperCase()}
                    </span>
                    <h3 className="font-bold text-sm text-slate-800 mt-1.5">{b.services}</h3>
                    <p className="text-[11px] text-slate-500">Booking ID: #{b.id}</p>
                  </div>
                  <div className="text-right">
                    {b.market > b.total && <span className="text-xs text-slate-400 line-through block">₹{b.market}</span>}
                    <p className="font-extrabold text-base text-rose-600">₹{b.total}</p>
                  </div>
                </div>
                <div className="text-xs text-slate-600 space-y-1.5 bg-rose-50/50 p-3 rounded-xl border border-rose-100/60">
                  <p className="flex items-center gap-2">🕐 <strong>{b.time}</strong></p>
                  <p className="flex items-center gap-2">✅ Beautician assigned & notified</p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setCallOpen(true)} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 rounded-xl text-xs border border-rose-200 transition">
                    📞 Call Stylist
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* ── FLOATING CART BAR (home only) ── */}
      {activeTab === "home" && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-4 left-0 right-0 z-40 px-4 max-w-md mx-auto pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md border-2 border-rose-200 rounded-2xl p-3 shadow-xl shadow-rose-200/60 flex items-center justify-between gap-2 pointer-events-auto">
            <div onClick={() => setCartOpen(true)} className="flex items-center space-x-3 cursor-pointer">
              <div className="w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-base relative shadow-md shadow-rose-200">
                🛍️
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 text-slate-900 font-extrabold rounded-full text-[10px] flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-slate-800">₹{cartTotal}</span>
                  {cartSavings > 0 && (
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">Save ₹{cartSavings}</span>
                  )}
                </div>
                <p className="text-[11px] text-rose-600 font-semibold">
                  {cartCount > 0 ? (cartCount + " service" + (cartCount > 1 ? "s" : "") + " added • Tap to checkout ↑") : "Tap to view selected services ↑"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setCartOpen(true)}
              className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 active:scale-95 text-white px-4 py-2.5 rounded-xl font-extrabold text-xs shadow-md shadow-rose-200 transition flex items-center gap-1.5"
            >
              Book Slot →
            </button>
          </div>
        </div>
      )}

      {/* ── MODALS & TOAST ── */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onModify={modifyCartByKey}
        onConfirm={confirmBooking}
      />
      <CallModal open={callOpen} onClose={() => setCallOpen(false)} />
      <Toast visible={toast.visible} message={toast.msg} />
    </div>
  );
}
