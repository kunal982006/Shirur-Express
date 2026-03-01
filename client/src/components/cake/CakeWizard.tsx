import { useState, useRef, useMemo } from "react";
import { CakeViewport3D } from "@/components/cake/CakeViewport3D";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, ArrowRight, Image as ImageIcon, Wand2, Plus, Minus,
    Type, Heart, Sparkles, Check, Palette, X, Gift, Truck, CalendarDays,
    Clock, Camera, ChevronRight
} from "lucide-react";
import { useCartStore } from "@/hooks/use-cart-store";
import { useToast } from "@/hooks/use-toast";

type WizardStep = 1 | 2 | 3 | 4 | 5;

const CUSTOM_CAKE_SHOP_ID = "custom-cake-studio";

// ── DATA ──────────────────────────────────────────────────
const DIETS = [
    { id: "veg", label: "100% Veg (Eggless)", emoji: "🥬", price: 0 },
    { id: "vegan", label: "Vegan", emoji: "🌱", price: 100 },
    { id: "gf", label: "Gluten-Free", emoji: "🌾", price: 150 },
    { id: "regular", label: "Regular (With Egg)", emoji: "🥚", price: 0 }
];

const WEIGHTS = [
    { id: "0.5kg", label: "0.5 kg", desc: "Serves 4-6", price: 599 },
    { id: "1kg", label: "1.0 kg", desc: "Serves 10-12", price: 1099 },
    { id: "2kg", label: "2.0 kg", desc: "Serves 20-24", price: 1999 },
    { id: "custom", label: "Tiered", desc: "Weddings / Events", price: 3499 }
];

const SHAPES = [
    { id: "round", label: "Round", emoji: "⭕" },
    { id: "square", label: "Square", emoji: "⬜" },
    { id: "heart", label: "Heart", emoji: "💖" },
    { id: "tall", label: "Tall Cylinder", emoji: "🗼" },
    { id: "number", label: "Number/Letter", emoji: "🔢" }
];

const SPONGES = [
    { id: "vanilla", label: "Vanilla", color: "#FFF8DC" },
    { id: "chocolate", label: "Chocolate", color: "#3E2723" },
    { id: "redvelvet", label: "Red Velvet", color: "#B71C1C" },
    { id: "funfetti", label: "Funfetti", color: "#E1BEE7" },
    { id: "coffee", label: "Coffee", color: "#5D4037" }
];

const FILLINGS = [
    { id: "none", label: "Standard Buttercream", price: 0, emoji: "🧈" },
    { id: "berry", label: "Mixed Berry Compote", price: 99, emoji: "🫐" },
    { id: "caramel", label: "Salted Caramel", price: 79, emoji: "🍯" },
    { id: "ganache", label: "Dark Choco Ganache", price: 129, emoji: "🍫" },
    { id: "hazelnut", label: "Hazelnut Praline", price: 149, emoji: "🌰" },
    { id: "fruit", label: "Fresh Fruit Chunks", price: 109, emoji: "🍓" }
];

const FROSTING_MATERIALS = [
    { id: "whipped", label: "Whipped Cream", desc: "Light & airy", price: 0 },
    { id: "buttercream", label: "Buttercream", desc: "Sturdy & classic", price: 50 },
    { id: "fondant", label: "Fondant", desc: "Smooth sculpted", price: 399 },
    { id: "cream_cheese", label: "Cream Cheese", desc: "Tangy & rich", price: 149 }
];

const TEXTURES = [
    { id: "smooth", label: "Smooth Finish" },
    { id: "rustic", label: "Rustic / Textured" },
    { id: "semi", label: "Semi-Naked" },
    { id: "naked", label: "Fully Naked" },
    { id: "ruffles", label: "Ruffles" }
];

const TOPPINGS = [
    { id: "drip", label: "Chocolate / Caramel Drip", price: 49, emoji: "🍫" },
    { id: "foil", label: "Edible Gold / Silver Foil", price: 199, emoji: "✨" },
    { id: "pearls", label: "Sugar Pearls", price: 29, emoji: "🫧" },
    { id: "macarons", label: "Macarons (3 pcs)", price: 149, emoji: "🍪" },
    { id: "flowers", label: "Fresh Non-Toxic Flowers", price: 249, emoji: "🌸" },
    { id: "acrylic", label: "Acrylic \"Happy Birthday\" Topper", price: 99, emoji: "🎉" }
];

const PRESETS = [
    { id: "bento", label: "Korean Bento", icon: Heart, gradient: "from-rose-400 to-pink-500" },
    { id: "vintage", label: "Vintage Lambeth", icon: Sparkles, gradient: "from-amber-400 to-orange-500" },
    { id: "minimal", label: "Minimalist", icon: Minus, gradient: "from-gray-400 to-gray-600" },
    { id: "comic", label: "Comic / 2D", icon: Palette, gradient: "from-blue-400 to-indigo-500" }
];

const PASTEL_COLORS = [
    "#FFB6C1", "#FFDAB9", "#FFFACD", "#98FB98",
    "#ADD8E6", "#DDA0DD", "#F5DEB3", "#FFFFFF",
    "#1a1a1a", "#C71585", "#FF6347", "#4169E1"
];

const TIME_SLOTS = [
    { id: "10-12", label: "10:00 AM – 12:00 PM" },
    { id: "12-14", label: "12:00 PM – 2:00 PM" },
    { id: "14-16", label: "2:00 PM – 4:00 PM" },
    { id: "16-18", label: "4:00 PM – 6:00 PM" },
    { id: "18-20", label: "6:00 PM – 8:00 PM" },
    { id: "20-22", label: "8:00 PM – 10:00 PM" }
];

// ── STEP LABELS ──────────────────────────────────────────
const STEP_INFO: Record<WizardStep, { title: string; subtitle: string; icon: string }> = {
    1: { title: "The Foundation", subtitle: "Size · Diet · Shape", icon: "🏗️" },
    2: { title: "The Inside Story", subtitle: "Sponge · Fillings", icon: "🧁" },
    3: { title: "Picasso Mode", subtitle: "Design · Colors · Toppings", icon: "🎨" },
    4: { title: "Personal Touch", subtitle: "Message · Font · Card", icon: "✍️" },
    5: { title: "Logistics", subtitle: "Delivery · Checkout", icon: "🚚" }
};

// ── ANIMATION VARIANTS ───────────────────────────────────
const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -80 : 80, opacity: 0 })
};

// ── COMPONENT ────────────────────────────────────────────
export function CakeWizard({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { addItem } = useCartStore();
    const { toast } = useToast();

    const [step, setStep] = useState<WizardStep>(1);
    const [direction, setDirection] = useState(1);

    // Step 1
    const [diet, setDiet] = useState("veg");
    const [weight, setWeight] = useState("1kg");
    const [shape, setShape] = useState("round");

    // Step 2
    const [sponge, setSponge] = useState("chocolate");
    const [filling, setFilling] = useState("none");

    // Step 3
    const [frostingMat, setFrostingMat] = useState("whipped");
    const [texture, setTexture] = useState("smooth");
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [primaryColor, setPrimaryColor] = useState("#FFB6C1");
    const [secondaryColor, setSecondaryColor] = useState("#FFFFFF");
    const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
    const [preset, setPreset] = useState<string | null>(null);

    // Step 4
    const [message, setMessage] = useState("");
    const [font, setFont] = useState("cursive");
    const [greetingCard, setGreetingCard] = useState(false);
    const [greetingMessage, setGreetingMessage] = useState("");

    // Step 5
    const [surprise, setSurprise] = useState(false);
    const [date, setDate] = useState("");
    const [timeSlot, setTimeSlot] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── PRICE CALCULATOR (correct logic) ──
    const currentTotal = useMemo(() => {
        let total = 0;
        total += DIETS.find(d => d.id === diet)?.price || 0;
        total += WEIGHTS.find(w => w.id === weight)?.price || 0;
        total += FILLINGS.find(f => f.id === filling)?.price || 0;
        total += FROSTING_MATERIALS.find(m => m.id === frostingMat)?.price || 0;
        if (photoUrl) total += 199;
        // Fixed: iterate selectedToppings, not TOPPINGS array
        selectedToppings.forEach(tId => {
            total += TOPPINGS.find(t => t.id === tId)?.price || 0;
        });
        if (greetingCard) total += 75;
        return total;
    }, [diet, weight, filling, frostingMat, photoUrl, selectedToppings, greetingCard]);

    // ── PRICE BREAKDOWN ──
    const priceBreakdown = useMemo(() => {
        const items: { label: string; amount: number }[] = [];
        const wt = WEIGHTS.find(w => w.id === weight);
        if (wt) items.push({ label: `Base (${wt.label})`, amount: wt.price });
        const dt = DIETS.find(d => d.id === diet);
        if (dt && dt.price > 0) items.push({ label: dt.label, amount: dt.price });
        const fl = FILLINGS.find(f => f.id === filling);
        if (fl && fl.price > 0) items.push({ label: fl.label, amount: fl.price });
        const fr = FROSTING_MATERIALS.find(m => m.id === frostingMat);
        if (fr && fr.price > 0) items.push({ label: fr.label, amount: fr.price });
        if (photoUrl) items.push({ label: "Photo Cake", amount: 199 });
        selectedToppings.forEach(tId => {
            const t = TOPPINGS.find(t => t.id === tId);
            if (t) items.push({ label: t.label, amount: t.price });
        });
        if (greetingCard) items.push({ label: "Greeting Card", amount: 75 });
        return items;
    }, [diet, weight, filling, frostingMat, photoUrl, selectedToppings, greetingCard]);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPhotoUrl(url);
        if (file.size < 500000) {
            toast({ title: "⚠️ Low Resolution Image", description: "The print might be blurry on the cake.", variant: "destructive" });
        } else {
            toast({ title: "📸 Image uploaded successfully!" });
        }
    };

    const toggleTopping = (id: string) => {
        setSelectedToppings(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
    };

    const handleComplete = () => {
        if (!date || !timeSlot) {
            toast({ title: "📅 Select Delivery Time", description: "Please pick a date and time slot first.", variant: "destructive" });
            return;
        }

        const shapeName = SHAPES.find(s => s.id === shape)?.label || shape;
        const weightName = WEIGHTS.find(w => w.id === weight)?.label || weight;
        const spongeLabel = SPONGES.find(s => s.id === sponge)?.label || sponge;

        addItem({
            id: `custom-cake-${Date.now()}`,
            name: `Custom ${shapeName} Cake (${weightName})`,
            price: currentTotal,
            imageUrl: photoUrl || "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=500&auto=format&fit=crop",
            providerId: CUSTOM_CAKE_SHOP_ID,
            itemType: "cake"
        });

        toast({ title: "✨ Masterpiece Added to Cart!", description: `${spongeLabel} ${shapeName} cake — ₹${currentTotal}` });
        resetWizard();
        onClose();
    };

    const resetWizard = () => {
        setStep(1); setDirection(1);
        setDiet("veg"); setWeight("1kg"); setShape("round");
        setSponge("chocolate"); setFilling("none");
        setFrostingMat("whipped"); setTexture("smooth");
        setPhotoUrl(null); setPrimaryColor("#FFB6C1"); setSecondaryColor("#FFFFFF");
        setSelectedToppings([]); setPreset(null);
        setMessage(""); setFont("cursive"); setGreetingCard(false); setGreetingMessage("");
        setSurprise(false); setDate(""); setTimeSlot("");
    };

    const nextStep = () => { setDirection(1); setStep(s => Math.min(5, s + 1) as WizardStep); };
    const prevStep = () => { setDirection(-1); setStep(s => Math.max(1, s - 1) as WizardStep); };

    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 1);
    const minDateStr = minDate.toISOString().split('T')[0];

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={() => { resetWizard(); onClose(); }}
                style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            />
            {/* Modal Container */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 51,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '16px', pointerEvents: 'none'
            }}>
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        pointerEvents: 'auto',
                        width: '100%', maxWidth: '960px',
                        height: '92vh', maxHeight: '92vh',
                        display: 'flex', flexDirection: 'row',
                        borderRadius: '20px', overflow: 'hidden',
                        background: '#f9fafb',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}
                >

                    {/* ── LIVE 3D PREVIEW PANEL (Desktop: left sidebar) ── */}
                    <div
                        className="hidden md:flex"
                        style={{
                            width: '42%', minWidth: '320px',
                            background: 'linear-gradient(180deg, #0f0f11 0%, #1a1a2e 100%)',
                            flexDirection: 'column', alignItems: 'center',
                            padding: '0',
                            borderRight: '1px solid #2d2d3d',
                            position: 'relative', overflow: 'hidden'
                        }}
                    >
                        <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a78bfa', padding: '10px 0 0 0', margin: 0, zIndex: 2 }}>3D Live Preview</p>
                        <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                            <CakeViewport3D
                                shape={shape} sponge={sponge}
                                primaryColor={primaryColor} secondaryColor={secondaryColor}
                                frostingMat={frostingMat} texture={texture}
                                toppings={selectedToppings} message={message}
                                font={font} photoUrl={photoUrl} weight={weight}
                            />
                        </div>
                        <div style={{
                            padding: '6px 14px 10px', borderRadius: '9999px',
                            background: 'rgba(139,92,246,0.15)', fontSize: '11px',
                            fontWeight: 700, color: '#a78bfa', marginBottom: 8, zIndex: 2
                        }}>
                            {SHAPES.find(s => s.id === shape)?.emoji} {SHAPES.find(s => s.id === shape)?.label} · {SPONGES.find(s => s.id === sponge)?.label} · {WEIGHTS.find(w => w.id === weight)?.label}
                        </div>
                    </div>

                    {/* ── RIGHT SIDE: Header + Steps + Footer ── */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

                        {/* ── HEADER ── */}
                        <div style={{
                            position: 'relative', background: '#fff', padding: '14px 20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderBottom: '1px solid #e5e7eb', flexShrink: 0, zIndex: 10
                        }}>
                            {/* Progress bar track */}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', width: '100%', background: '#f3f4f6' }} />
                            {/* Progress bar fill */}
                            <motion.div
                                style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', borderRadius: '0 4px 4px 0', background: 'linear-gradient(90deg, #ec4899, #9333ea, #6366f1)' }}
                                animate={{ width: `${(step / 5) * 100}%` }}
                                transition={{ type: "spring", stiffness: 200, damping: 30 }}
                            />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    height: '44px', width: '44px', borderRadius: '14px', fontSize: '22px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'linear-gradient(135deg, #fce7f3, #ede9fe)'
                                }}>
                                    {STEP_INFO[step].icon}
                                </div>
                                <div>
                                    <h2 style={{ fontWeight: 800, fontSize: '16px', color: '#111827', lineHeight: 1.2, margin: 0 }}>{STEP_INFO[step].title}</h2>
                                    <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.03em', margin: 0 }}>{STEP_INFO[step].subtitle}</p>
                                </div>
                            </div>

                            {/* Step dots + Close */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {[1, 2, 3, 4, 5].map(s => (
                                        <div key={s} style={{
                                            height: '8px', borderRadius: '4px',
                                            width: s === step ? '20px' : '8px',
                                            background: s === step ? 'linear-gradient(90deg, #ec4899, #9333ea)' : s < step ? '#f9a8d4' : '#e5e7eb',
                                            transition: 'all 0.3s ease'
                                        }} />
                                    ))}
                                </div>
                                <button
                                    onClick={() => { resetWizard(); onClose(); }}
                                    style={{
                                        height: '36px', width: '36px', borderRadius: '50%', border: 'none',
                                        background: '#f3f4f6', cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    <X className="h-4 w-4" style={{ color: '#6b7280' }} />
                                </button>
                            </div>
                        </div>

                        {/* ── MOBILE 3D PREVIEW ── */}
                        <div
                            className="flex md:hidden"
                            style={{
                                background: 'linear-gradient(135deg, #0f0f11, #1a1a2e)',
                                flexDirection: 'column',
                                alignItems: 'center', borderBottom: '1px solid #2d2d3d',
                                flexShrink: 0, height: '220px'
                            }}
                        >
                            <div style={{ width: '100%', height: '100%' }}>
                                <CakeViewport3D
                                    shape={shape} sponge={sponge}
                                    primaryColor={primaryColor} secondaryColor={secondaryColor}
                                    frostingMat={frostingMat} texture={texture}
                                    toppings={selectedToppings} message={message}
                                    font={font} photoUrl={photoUrl} weight={weight}
                                />
                            </div>
                        </div>

                        {/* ── SCROLLABLE BODY ── */}
                        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                            <AnimatePresence mode="wait" custom={direction}>

                                {/* STEP 1: Foundation */}
                                {step === 1 && (
                                    <motion.div key="s1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="p-5 md:p-8 space-y-7">

                                        <SectionLabel>Dietary Preference</SectionLabel>
                                        <div className="grid grid-cols-2 gap-3">
                                            {DIETS.map(d => (
                                                <SelectCard key={d.id} active={diet === d.id} onClick={() => setDiet(d.id)} activeColor="pink">
                                                    <span className="text-xl">{d.emoji}</span>
                                                    <div className="text-left">
                                                        <p className="font-bold text-sm">{d.label}</p>
                                                        {d.price > 0 && <p className="text-xs opacity-60">+₹{d.price}</p>}
                                                    </div>
                                                </SelectCard>
                                            ))}
                                        </div>

                                        <SectionLabel>Weight & Servings</SectionLabel>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {WEIGHTS.map(w => (
                                                <SelectCard key={w.id} active={weight === w.id} onClick={() => setWeight(w.id)} activeColor="purple" className="flex-col text-center">
                                                    <span className="font-black text-xl">{w.label}</span>
                                                    <span className="text-[11px] font-medium opacity-70">{w.desc}</span>
                                                    <span className="text-sm font-bold mt-1 text-purple-600">₹{w.price}</span>
                                                </SelectCard>
                                            ))}
                                        </div>

                                        <SectionLabel>Cake Shape</SectionLabel>
                                        <div className="flex flex-wrap gap-2.5">
                                            {SHAPES.map(s => (
                                                <button key={s.id} onClick={() => setShape(s.id)}
                                                    className={`px-4 py-2.5 rounded-full border-2 text-sm font-bold transition-all flex items-center gap-1.5
                        ${shape === s.id ? 'border-gray-900 bg-gray-900 text-white shadow-lg scale-105' : 'border-gray-200 bg-white hover:border-gray-300 text-gray-600'}`}>
                                                    <span>{s.emoji}</span> {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 2: Inside Story */}
                                {step === 2 && (
                                    <motion.div key="s2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="p-5 md:p-8 space-y-7">

                                        <SectionLabel>Sponge Flavor</SectionLabel>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {SPONGES.map(s => (
                                                <button key={s.id} onClick={() => setSponge(s.id)}
                                                    className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all flex items-center gap-3
                        ${sponge === s.id ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm ring-2 ring-pink-200' : 'border-gray-200 bg-white hover:border-pink-200 text-gray-700'}`}>
                                                    <div className="h-8 w-8 rounded-full border-2 border-white shadow-md shrink-0" style={{ backgroundColor: s.color }} />
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>

                                        <SectionLabel badge="Premium">Gourmet Fillings</SectionLabel>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {FILLINGS.map(f => (
                                                <button key={f.id} onClick={() => setFilling(f.id)}
                                                    className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all
                        ${filling === f.id ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm ring-2 ring-amber-200' : 'border-gray-200 bg-white hover:border-amber-200 text-gray-700'}`}>
                                                    <span className="text-xl">{f.emoji}</span>
                                                    <div className="flex-1 text-left">
                                                        <p className="font-bold text-sm">{f.label}</p>
                                                    </div>
                                                    <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${filling === f.id ? 'bg-amber-200 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
                                                        {f.price === 0 ? 'Free' : `+₹${f.price}`}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 3: Picasso Mode */}
                                {step === 3 && (
                                    <motion.div key="s3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="p-5 md:p-8 space-y-7">

                                        {/* Quick Presets */}
                                        <SectionLabel>Quick Aesthetic Presets</SectionLabel>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {PRESETS.map(p => (
                                                <button key={p.id} onClick={() => setPreset(p.id)}
                                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all
                        ${preset === p.id ? 'border-purple-500 bg-purple-50 shadow-md scale-105' : 'border-gray-200 bg-white hover:border-purple-200'}`}>
                                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${p.gradient} text-white shadow-sm`}>
                                                        <p.icon className="h-5 w-5" />
                                                    </div>
                                                    <span className="text-[11px] font-extrabold text-center leading-tight text-gray-700">{p.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* Frosting */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <SectionLabel>Frosting Type</SectionLabel>
                                                <div className="space-y-2">
                                                    {FROSTING_MATERIALS.map(m => (
                                                        <button key={m.id} onClick={() => setFrostingMat(m.id)}
                                                            className={`w-full p-3 rounded-xl border-2 flex items-center justify-between transition-all text-left
                            ${frostingMat === m.id ? 'border-pink-500 bg-pink-50 ring-1 ring-pink-200' : 'border-gray-200 bg-white hover:border-pink-100'}`}>
                                                            <div>
                                                                <p className="font-bold text-sm">{m.label}</p>
                                                                <p className="text-[11px] text-gray-400">{m.desc}</p>
                                                            </div>
                                                            {m.price > 0 && <span className="text-xs font-bold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-md">+₹{m.price}</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <SectionLabel>Finish Texture</SectionLabel>
                                                <div className="space-y-2">
                                                    {TEXTURES.map(t => (
                                                        <button key={t.id} onClick={() => setTexture(t.id)}
                                                            className={`w-full p-3 rounded-xl border-2 font-semibold text-sm transition-all text-left
                            ${texture === t.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                                                            {t.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Color Palette */}
                                        <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                                            <SectionLabel>Color Palette</SectionLabel>
                                            <div className="flex flex-col sm:flex-row gap-6">
                                                <div className="space-y-2">
                                                    <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Base Color</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {PASTEL_COLORS.map(c => (
                                                            <button key={c + '-p'} onClick={() => setPrimaryColor(c)}
                                                                className={`h-9 w-9 rounded-full border-2 transition-all shadow-sm hover:scale-110 ${primaryColor === c ? 'border-gray-900 ring-2 ring-gray-400 scale-110' : 'border-gray-200'}`}
                                                                style={{ backgroundColor: c }} />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Accent Color</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {PASTEL_COLORS.map(c => (
                                                            <button key={c + '-s'} onClick={() => setSecondaryColor(c)}
                                                                className={`h-9 w-9 rounded-full border-2 transition-all shadow-sm hover:scale-110 ${secondaryColor === c ? 'border-gray-900 ring-2 ring-gray-400 scale-110' : 'border-gray-200'}`}
                                                                style={{ backgroundColor: c }} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Photo Cake */}
                                        <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <Camera className="h-4 w-4 text-blue-600" />
                                                    <SectionLabel className="!mb-0">Photo Cake (+₹199)</SectionLabel>
                                                </div>
                                                {photoUrl && <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:bg-red-50" onClick={() => setPhotoUrl(null)}>Remove</Button>}
                                            </div>
                                            {!photoUrl ? (
                                                <div className="border-2 border-dashed border-blue-200 rounded-xl h-20 flex items-center justify-center bg-white/80 cursor-pointer hover:bg-blue-50 transition-colors"
                                                    onClick={() => fileInputRef.current?.click()}>
                                                    <span className="text-sm font-bold text-blue-600 flex items-center gap-2"><Plus className="h-4 w-4" /> Upload Photo</span>
                                                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                                                </div>
                                            ) : (
                                                <div className="flex gap-3 items-center bg-white p-3 rounded-xl border border-blue-100">
                                                    <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 border shadow-sm">
                                                        <img src={photoUrl} alt="Cake Photo" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">✅ Image Ready</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">We'll print it on edible paper for you.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Toppings */}
                                        <SectionLabel>Toppings & Garnishes</SectionLabel>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {TOPPINGS.map(t => {
                                                const on = selectedToppings.includes(t.id);
                                                return (
                                                    <button key={t.id} onClick={() => toggleTopping(t.id)}
                                                        className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all text-left
                          ${on ? 'border-pink-500 bg-pink-50 shadow-sm' : 'border-gray-200 bg-white hover:border-pink-100'}`}>
                                                        <Checkbox checked={on} className={on ? 'data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500' : ''} />
                                                        <span className="text-lg">{t.emoji}</span>
                                                        <div className="flex-1">
                                                            <span className={`text-sm font-semibold ${on ? 'text-pink-900' : 'text-gray-700'}`}>{t.label}</span>
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-400">+₹{t.price}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 4: Personal Touch */}
                                {step === 4 && (
                                    <motion.div key="s4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="p-5 md:p-8 space-y-7">

                                        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-5">
                                            <div>
                                                <SectionLabel>What should we write on the cake?</SectionLabel>
                                                <Input placeholder="e.g. Happy Birthday Sarah!" className="h-14 text-lg bg-gray-50 border-gray-200 rounded-xl focus-visible:ring-purple-500 mt-2"
                                                    maxLength={30} value={message} onChange={(e) => setMessage(e.target.value)} />
                                                <div className="flex justify-between mt-2">
                                                    <span className="text-xs text-gray-400">Keep it short & sweet.</span>
                                                    <span className={`text-xs font-bold ${message.length >= 28 ? 'text-red-500' : 'text-gray-400'}`}>{message.length}/30</span>
                                                </div>
                                            </div>

                                            <div>
                                                <SectionLabel>Icing Font Style</SectionLabel>
                                                <div className="grid grid-cols-3 gap-3 mt-2">
                                                    {[
                                                        { id: "cursive", label: "Cursive", styles: "italic font-serif" },
                                                        { id: "block", label: "Block", styles: "font-black uppercase tracking-widest" },
                                                        { id: "messy", label: "Fun", styles: "font-medium tracking-tighter" }
                                                    ].map(f => (
                                                        <button key={f.id} onClick={() => setFont(f.id)}
                                                            className={`p-4 rounded-xl border-2 text-lg transition-all ${f.styles}
                            ${font === f.id ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-200' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                                                            {f.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Preview */}
                                            {message && (
                                                <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 text-center">
                                                    <p className="text-xs text-gray-400 mb-2 uppercase font-bold tracking-wider">Preview</p>
                                                    <p className={`text-2xl ${font === 'cursive' ? 'italic font-serif' : font === 'block' ? 'font-black uppercase tracking-wider' : 'font-medium'}`}
                                                        style={{ color: primaryColor === '#FFFFFF' ? '#333' : primaryColor }}>
                                                        "{message}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Greeting Card */}
                                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex gap-3">
                                                    <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                                                        <Gift className="h-5 w-5 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-amber-900 text-sm">Premium Greeting Card</p>
                                                        <p className="text-xs text-amber-700/70 mt-0.5">Physical card in a sealed envelope (+₹75)</p>
                                                    </div>
                                                </div>
                                                <Switch checked={greetingCard} onCheckedChange={setGreetingCard} className="data-[state=checked]:bg-amber-500" />
                                            </div>
                                            <AnimatePresence>
                                                {greetingCard && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                        <textarea placeholder="Write your beautiful message here..." className="w-full mt-4 p-4 rounded-xl border border-amber-200 bg-white/70 focus:bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none min-h-[90px] text-sm resize-none" value={greetingMessage} onChange={(e) => setGreetingMessage(e.target.value)} />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </motion.div>
                                )}

                                {/* STEP 5: Logistics */}
                                {step === 5 && (
                                    <motion.div key="s5" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="p-5 md:p-8 space-y-7 pb-40">

                                        {/* Surprise */}
                                        <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 flex items-start gap-3">
                                            <Checkbox id="surprise" checked={surprise} onCheckedChange={(c) => setSurprise(!!c)} className="mt-1 h-5 w-5 rounded data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500" />
                                            <div>
                                                <label htmlFor="surprise" className="text-sm font-bold text-pink-900 cursor-pointer">This is a Surprise! 🤫</label>
                                                <p className="text-xs text-pink-700/70 mt-1 leading-relaxed">Delivery partner will call <strong>you</strong>, not the recipient.</p>
                                            </div>
                                        </div>

                                        {/* Date & Time */}
                                        <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-5">
                                            <h4 className="font-extrabold text-gray-900 flex items-center gap-2"><Truck className="h-5 w-5 text-gray-400" /> Schedule Delivery</h4>

                                            <div>
                                                <Label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Delivery Date</Label>
                                                <Input type="date" className="h-12 bg-gray-50 border-gray-200 rounded-xl cursor-pointer" min={minDateStr} value={date} onChange={(e) => setDate(e.target.value)} />
                                                <p className="text-[11px] text-amber-600 mt-1.5 font-semibold">⏱️ Min 24hrs preparation time required</p>
                                            </div>

                                            <div>
                                                <Label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Time Slot</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {TIME_SLOTS.map(ts => (
                                                        <button key={ts.id} onClick={() => setTimeSlot(ts.id)}
                                                            className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all text-left
                            ${timeSlot === ts.id ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'}`}>
                                                            {ts.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price Breakdown */}
                                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-5 rounded-2xl shadow-xl space-y-3">
                                            <h4 className="font-extrabold text-sm uppercase tracking-wider text-gray-300">Order Summary</h4>
                                            <div className="space-y-2">
                                                {priceBreakdown.map((item, i) => (
                                                    <div key={i} className="flex justify-between text-sm">
                                                        <span className="text-gray-300">{item.label}</span>
                                                        <span className="font-bold">₹{item.amount}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="border-t border-gray-700 pt-3 mt-3 flex justify-between items-center">
                                                <span className="font-extrabold text-lg">Total</span>
                                                <span className="font-black text-2xl text-green-400">₹{currentTotal}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </div>

                        {/* ── FOOTER ── */}
                        <div style={{
                            background: '#fff', borderTop: '1px solid #e5e7eb',
                            padding: '12px 16px', display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between', flexShrink: 0,
                            boxShadow: '0 -4px 24px rgba(0,0,0,0.06)'
                        }}>
                            {step > 1 ? (
                                <Button variant="outline" onClick={prevStep} className="h-11 rounded-xl px-5 border-gray-300 text-gray-700">
                                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                                </Button>
                            ) : <div style={{ width: '80px' }} />}

                            <div style={{
                                background: '#111827', color: '#fff',
                                padding: '8px 16px', borderRadius: '9999px',
                                display: 'flex', alignItems: 'center', gap: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}>
                                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af' }}>Total</span>
                                <span style={{ fontSize: '16px', fontWeight: 900 }}>₹{currentTotal}</span>
                            </div>

                            {step < 5 ? (
                                <button onClick={nextStep} style={{
                                    height: '44px', padding: '0 20px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #ec4899, #9333ea)',
                                    color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                    boxShadow: '0 4px 12px rgba(236,72,153,0.4)'
                                }}>
                                    Next <ChevronRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <button onClick={handleComplete} style={{
                                    height: '44px', padding: '0 24px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #22c55e, #059669)',
                                    color: '#fff', border: 'none', fontWeight: 700, fontSize: '14px',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                    boxShadow: '0 4px 12px rgba(34,197,94,0.4)'
                                }}>
                                    Add to Cart <Sparkles className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                    </div>{/* end right side */}
                </div>
            </div>
        </>
    );
}

// ── REUSABLE SUB-COMPONENTS ──────────────────────────────
function SectionLabel({ children, badge, className }: { children: React.ReactNode; badge?: string; className?: string }) {
    return (
        <div className={`flex items-center gap-2 mb-1 ${className || ''}`}>
            <span className="uppercase tracking-wider text-[11px] font-extrabold text-gray-400">{children}</span>
            {badge && <span className="text-[10px] font-extrabold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
    );
}

function SelectCard({ children, active, onClick, activeColor = "pink", className }: {
    children: React.ReactNode; active: boolean; onClick: () => void; activeColor?: "pink" | "purple"; className?: string;
}) {
    const colors = {
        pink: { active: "border-pink-500 bg-pink-50 text-pink-800 ring-2 ring-pink-200", hover: "hover:border-pink-200" },
        purple: { active: "border-purple-500 bg-purple-50 text-purple-800 ring-2 ring-purple-200", hover: "hover:border-purple-200" }
    };
    return (
        <button onClick={onClick}
            className={`p-3 rounded-xl border-2 font-semibold text-sm transition-all flex items-center gap-3
        ${active ? colors[activeColor].active : `border-gray-200 bg-white text-gray-700 ${colors[activeColor].hover}`}
        ${className || ''}`}>
            {children}
        </button>
    );
}
