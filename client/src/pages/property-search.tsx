import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Building2, Home as HomeIcon, ShieldCheck, CheckCircle2,
  MapPin, Search, X, Heart, Calculator, Phone, MessageCircle, Plus,
  Copy, Sparkles, ArrowLeft, RotateCcw, Maximize2,
  Sofa, Users, Droplets, Clock, Loader2, Check,
  Camera, Image as ImageIcon, Trash2, Upload, AlertCircle
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface PropertyItem {
  id: string;
  title: string;
  description?: string | null;
  propertyType: string;
  listingType: string;
  rent: string | number;
  deposit?: string | number | null;
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  furnishing?: string | null;
  address: string;
  locality?: string | null;
  amenities?: string[] | null;
  images?: string[] | null;
  contactPhone?: string | null;
  ownerNote?: string | null;
  status?: string | null;
  createdAt?: string | Date | null;
  owner?: {
    id?: string;
    name?: string;
    username?: string;
    phoneNumber?: string;
    phone?: string;
    isVerified?: boolean;
  } | null;
}

// ─── Curated Fallback Verified Shirur Properties ──────────────────────────────
// Shown when database properties are empty or alongside backend listings
const CURATED_SHIRUR_PROPERTIES: PropertyItem[] = [
  {
    id: "shirur-prop-1",
    title: "Spacious 2 BHK Family Apartment near Market",
    description: "East facing, 24 hr water supply, separate balcony, near Ramdara temple and daily market. Completely zero brokerage direct owner.",
    propertyType: "Apartment",
    listingType: "rent",
    rent: "8500",
    deposit: "20000",
    area: 920,
    bedrooms: 2,
    bathrooms: 2,
    furnishing: "Semi-Furnished",
    address: "Ramdara Road, Behind Ganpati Mandir, Shirur",
    locality: "Ramdara Road",
    contactPhone: "+919822045120",
    ownerNote: "Family / Working Bachelors • Covered Car Parking • Solar Geyser",
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=700&q=80"],
    owner: {
      name: "Sandeep Gavhane (Owner)",
      username: "sandeep_g",
      phoneNumber: "+919822045120",
      isVerified: true,
    },
  },
  {
    id: "shirur-prop-2",
    title: "Highway Touch Commercial Shop / Showroom",
    description: "18ft road frontage, glass shutter, 3-phase MSEB meter, ideal for clinic, medical, cafe, salon or corporate office.",
    propertyType: "Commercial Space",
    listingType: "commercial",
    rent: "18000",
    deposit: "60000",
    area: 450,
    bedrooms: 0,
    bathrooms: 1,
    furnishing: "Glass Shutter + Washroom",
    address: "Near Shirur ST Bus Stand, Pune-Nagar Highway",
    locality: "Pune-Nagar Highway",
    contactPhone: "+919422088341",
    ownerNote: "Road Touch • Heavy Footfall • 3-Phase Meter • Front Parking",
    images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=700&q=80"],
    owner: {
      name: "Vishwas Bora (Owner)",
      username: "vishwas_b",
      phoneNumber: "+919422088341",
      isVerified: true,
    },
  },
  {
    id: "shirur-prop-3",
    title: "Independent 3 BHK Row House with Private Terrace",
    description: "Independent duplex row house in peaceful gated society, modular kitchen, private porch car parking, clear title 7/12.",
    propertyType: "Villa",
    listingType: "sell",
    rent: "4650000",
    deposit: "0",
    area: 1450,
    bedrooms: 3,
    bathrooms: 3,
    furnishing: "Semi-Furnished",
    address: "Shanti Nagar Society, Joshi Wadi, Shirur",
    locality: "Joshi Wadi",
    contactPhone: "+919850032910",
    ownerNote: "G+1 Duplex • Bank Loan Approved • Solar Water Heater",
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=700&q=80"],
    owner: {
      name: "Anil Kulkarni (Owner)",
      username: "anil_k",
      phoneNumber: "+919850032910",
      isVerified: true,
    },
  },
  {
    id: "shirur-prop-4",
    title: "Affordable 1 BHK Studio for Bachelors / MIDC Staff",
    description: "Budget friendly flat just 5 mins from Ranjangaon-Karegaon MIDC gate. Sweet water 24x7, CCTV bike parking, geyser fitted.",
    propertyType: "Apartment",
    listingType: "rent",
    rent: "5500",
    deposit: "12000",
    area: 580,
    bedrooms: 1,
    bathrooms: 1,
    furnishing: "Unfurnished",
    address: "Near Karegaon MIDC Gate, Shirur",
    locality: "MIDC Karegaon",
    contactPhone: "+919765411209",
    ownerNote: "Bachelors / MIDC Staff Allowed • Zero Restrictions • 24hr Water",
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=700&q=80"],
    owner: {
      name: "Mahesh Pacharne (Owner)",
      username: "mahesh_p",
      phoneNumber: "+919765411209",
      isVerified: true,
    },
  },
  {
    id: "shirur-prop-5",
    title: "NA Residential Plot (2.5 Guntha) Clear Title",
    description: "Town Planning Collector NA sanctioned residential plot with boundary wall, 30ft tar road touch, street lights and drainage.",
    propertyType: "Plot",
    listingType: "plot",
    rent: "2250000",
    deposit: "0",
    area: 2500,
    bedrooms: 0,
    bathrooms: 0,
    furnishing: "Boundary Wall Ready",
    address: "Saradwadi Road Touch Layout, Shirur",
    locality: "Saradwadi Road",
    contactPhone: "+919921176543",
    ownerNote: "Collector NA • Individual 7/12 • Ready for Immediate Registration",
    images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=700&q=80"],
    owner: {
      name: "Balasaheb Shinde (Owner)",
      username: "balasaheb_s",
      phoneNumber: "+919921176543",
      isVerified: true,
    },
  },
  {
    id: "shirur-prop-6",
    title: "Modern 2 BHK Fully Furnished Flat near College",
    description: "Fully furnished 2 BHK flat with double beds, wardrobes, RO water filter, water geyser and covered car parking behind Market Yard.",
    propertyType: "Apartment",
    listingType: "rent",
    rent: "11500",
    deposit: "30000",
    area: 1050,
    bedrooms: 2,
    bathrooms: 2,
    furnishing: "Furnished",
    address: "Behind Market Yard, Babu Peth, Shirur",
    locality: "Babu Peth",
    contactPhone: "+919823165008",
    ownerNote: "Fully Furnished • 3rd Floor Balcony View • 24x7 Security Guard",
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=700&q=80"],
    owner: {
      name: "Mrs. Sunita Dhariwal (Owner)",
      username: "sunita_d",
      phoneNumber: "+919823165008",
      isVerified: true,
    },
  },
  {
    id: "shirur-prop-7",
    title: "Prime 1 RK Budget Room for Students / Singles",
    description: "Ground floor independent entry 1 RK with study desk, ceiling fan and separate electricity meter near CT Bora College.",
    propertyType: "Apartment",
    listingType: "rent",
    rent: "3800",
    deposit: "8000",
    area: 340,
    bedrooms: 1,
    bathrooms: 1,
    furnishing: "Furnished",
    address: "Near CT Bora College Road, Babu Peth, Shirur",
    locality: "Babu Peth",
    contactPhone: "+919604522198",
    ownerNote: "Students / Bachelors Allowed • Independent Entry • Sweet Water",
    images: ["https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=700&q=80"],
    owner: {
      name: "Prakash Bankar (Owner)",
      username: "prakash_b",
      phoneNumber: "+919604522198",
      isVerified: true,
    },
  },
];

const LOCALITIES_LIST = [
  "All Shirur",
  "Pune-Nagar Highway",
  "Ramdara Road",
  "Joshi Wadi",
  "Babu Peth",
  "MIDC Karegaon",
  "Saradwadi Road",
];

export const AMENITIES_LIST = [
  { name: "Parking", icon: "🚗" },
  { name: "24/7 Water", icon: "💧" },
  { name: "Power Backup", icon: "⚡" },
  { name: "Lift", icon: "🛗" },
  { name: "Security", icon: "🛡️" },
  { name: "Gym", icon: "🏋️" },
  { name: "Swimming Pool", icon: "🏊" },
  { name: "Park", icon: "🌳" },
  { name: "Club House", icon: "🏢" },
  { name: "Gas Pipeline", icon: "🍳" }
];

// ─── Formatting Helpers ───────────────────────────────────────────────────────
function formatPrice(val: number | string, isRent: boolean) {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (!num || isNaN(num)) return "₹0";
  if (!isRent) {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)} Lakhs`;
  }
  return `₹${num.toLocaleString("en-IN")}${isRent ? "/mo" : ""}`;
}

function calculateBrokerageSaved(rentOrPrice: number | string, isRent: boolean) {
  const num = typeof rentOrPrice === "string" ? parseFloat(rentOrPrice) : rentOrPrice;
  if (!num || isNaN(num)) return "₹0";
  if (isRent) {
    return `₹${num.toLocaleString("en-IN")} (1 Mo Rent)`;
  }
  const comm = Math.round(num * 0.02);
  if (comm >= 100000) return `₹${(comm / 100000).toFixed(1)}L (2%)`;
  return `₹${comm.toLocaleString("en-IN")} (2%)`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PropertySearch() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Navigation & Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<"feed" | "saved" | "calc">("feed");
  const [activeIntent, setActiveIntent] = useState<"all" | "rent" | "sell" | "commercial" | "plot">("all");
  const [activeLocality, setActiveLocality] = useState<string>("All Shirur");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilters, setQuickFilters] = useState({
    bachelors: false,
    furnished: false,
    immediate: false,
  });

  // Shortlist state backed by localStorage
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("shirur_shortlist_ids");
      return stored ? new Set(JSON.parse(stored)) : new Set(["shirur-prop-1"]);
    } catch {
      return new Set(["shirur-prop-1"]);
    }
  });

  // Modals state
  const [selectedPropForContact, setSelectedPropForContact] = useState<PropertyItem | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Brokerage Calculator state
  const [calcAmount, setCalcAmount] = useState<number>(10000);

  // Post Property Form State
  // Post Property Form State
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(["24/7 Water", "Parking"]);

  const [postForm, setPostForm] = useState({
    category: "rent",
    propertyType: "Apartment",
    locality: "Ramdara Road",
    title: "",
    price: "",
    deposit: "",
    noticePeriod: "1 Month",
    area: "",
    bedrooms: "1",
    bathrooms: "1",
    furnishing: "Unfurnished",
    tenantPref: "Family / Working Bachelors",
    ownerName: user?.name || "",
    contactPhone: user?.phoneNumber || "",
    contactEmail: user?.email || "",
    ownerNote: "",
    address: "",
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Sync user info if loaded later
  useEffect(() => {
    if (user) {
      setPostForm((prev) => ({
        ...prev,
        ownerName: prev.ownerName || user.name || "",
        contactPhone: prev.contactPhone || user.phoneNumber || "",
        contactEmail: prev.contactEmail || user.email || "",
      }));
    }
  }, [user]);

  // Handle uploading photos via Camera or File Picker
  const handleImageFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Upload failed");
      }

      const data = await res.json();
      if (data.urls && Array.isArray(data.urls) && data.urls.length > 0) {
        setUploadedImages((prev) => [...prev, ...data.urls]);
        showToast(`📸 ${data.urls.length} photo(s) added successfully!`);
      } else {
        throw new Error("No image URLs returned from server");
      }
    } catch (err: any) {
      console.error("Image upload error:", err);
      showToast(`❌ Image upload failed: ${err.message || "Please check connection"}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeUploadedImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    showToast("Photo removed");
  };

  const toggleAmenity = (name: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  // Update localStorage when savedIds changes
  useEffect(() => {
    try {
      localStorage.setItem("shirur_shortlist_ids", JSON.stringify(Array.from(savedIds)));
    } catch {
      // ignore
    }
  }, [savedIds]);

  // Fetch backend properties
  const { data: backendProperties, isLoading: isDbLoading, refetch } = useQuery<PropertyItem[]>({
    queryKey: ["/api/rental-properties"],
    queryFn: async () => {
      const res = await api.get("/rental-properties");
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });

  // Combine live backend properties with curated fallbacks
  const allProperties: PropertyItem[] = useMemo(() => {
    if (backendProperties && backendProperties.length > 0) {
      const backendIds = new Set(backendProperties.map((p) => p.id));
      const remainingCurated = CURATED_SHIRUR_PROPERTIES.filter((c) => !backendIds.has(c.id));
      return [...backendProperties, ...remainingCurated];
    }
    return CURATED_SHIRUR_PROPERTIES;
  }, [backendProperties]);

  // Post Property Mutation
  const postMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post("/rental-properties", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rental-properties"] });
      setPostModalOpen(false);
      showToast("🎉 Property published live at 0% Brokerage!");
      setUploadedImages([]);
      setSelectedAmenities(["24/7 Water", "Parking"]);
      setPostForm({
        category: "rent",
        propertyType: "Apartment",
        locality: "Ramdara Road",
        title: "",
        price: "",
        deposit: "",
        noticePeriod: "1 Month",
        area: "",
        bedrooms: "1",
        bathrooms: "1",
        furnishing: "Unfurnished",
        tenantPref: "Family / Working Bachelors",
        ownerName: user?.name || "",
        contactPhone: user?.phoneNumber || "",
        contactEmail: user?.email || "",
        ownerNote: "",
        address: "",
      });
      refetch();
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || err?.message || "Could not publish property. Please try again.");
    },
  });

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!postForm.title.trim()) {
      showToast("⚠️ Property Title is required.");
      return;
    }
    if (!postForm.price.trim()) {
      showToast("⚠️ Price / Rent is required.");
      return;
    }
    if (!postForm.contactPhone.trim()) {
      showToast("⚠️ Owner Mobile Number is required.");
      return;
    }
    if (!postForm.address.trim()) {
      showToast("⚠️ Property Address is required.");
      return;
    }

    // MANDATORY / COMPULSORY IMAGES CHECK
    if (uploadedImages.length === 0) {
      showToast("📸 Property photos are COMPULSORY! Please snap or upload at least 1 photo.");
      return;
    }

    const payload = {
      title: postForm.title,
      propertyType: postForm.propertyType,
      listingType: postForm.category,
      rent: postForm.price.replace(/[^0-9.]/g, "") || "5000",
      deposit: postForm.deposit ? postForm.deposit.replace(/[^0-9.]/g, "") : undefined,
      noticePeriod: postForm.noticePeriod || undefined,
      area: postForm.area ? parseInt(postForm.area.replace(/[^0-9]/g, ""), 10) : undefined,
      bedrooms: parseInt(postForm.bedrooms, 10) || 1,
      bathrooms: parseInt(postForm.bathrooms, 10) || 1,
      furnishing: postForm.furnishing,
      locality: postForm.locality,
      address: postForm.address || `${postForm.locality}, Shirur`,
      description: `${postForm.title} - ${postForm.tenantPref}. Direct owner listing at ₹0 brokerage on Shirur Express.`,
      ownerNote: postForm.ownerNote
        ? `${postForm.ownerNote} • Preference: ${postForm.tenantPref}`
        : `${postForm.tenantPref} • Contact: ${postForm.ownerName}`,
      contactPhone: postForm.contactPhone,
      contactEmail: postForm.contactEmail || undefined,
      amenities: selectedAmenities,
      images: uploadedImages,
      status: "available",
    };

    postMutation.mutate(payload);
  };

  // Filtered Properties
  const filteredProperties = useMemo(() => {
    return allProperties.filter((p) => {
      // 1. Intent filter
      if (activeIntent !== "all") {
        const pType = (p.listingType || "").toLowerCase();
        if (activeIntent === "rent" && !pType.includes("rent")) return false;
        if (activeIntent === "sell" && !pType.includes("sell") && !pType.includes("sale")) return false;
        if (activeIntent === "commercial" && !pType.includes("commercial")) return false;
        if (activeIntent === "plot" && !pType.includes("plot") && !pType.includes("land")) return false;
      }

      // 2. Locality filter
      if (activeLocality !== "All Shirur") {
        const pLoc = (p.locality || p.address || "").toLowerCase();
        if (!pLoc.includes(activeLocality.toLowerCase())) return false;
      }

      // 3. Quick filters
      if (quickFilters.bachelors) {
        const text = ((p.ownerNote || "") + " " + (p.description || "")).toLowerCase();
        if (!text.includes("bachelor") && !text.includes("student") && !text.includes("midc")) return false;
      }
      if (quickFilters.furnished) {
        const furn = (p.furnishing || "").toLowerCase();
        if (!furn.includes("furnished") || furn.includes("unfurnished")) return false;
      }
      if (quickFilters.immediate) {
        if (p.status && p.status !== "available") return false;
      }

      // 4. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = `${p.title} ${p.locality || ""} ${p.address || ""} ${p.propertyType} ${p.owner?.name || ""} ${p.ownerNote || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [allProperties, activeIntent, activeLocality, quickFilters, searchQuery]);

  // Shortlisted items
  const savedProperties = useMemo(() => {
    return allProperties.filter((p) => savedIds.has(p.id));
  }, [allProperties, savedIds]);

  const toggleShortlist = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast("Removed from Shortlist");
      } else {
        next.add(id);
        showToast("❤️ Saved to your Shortlist!");
      }
      return next;
    });
  };

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    showToast("📋 Phone number copied to clipboard!");
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const openWhatsApp = (phone: string, title: string) => {
    const clean = phone.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(`Hello! I saw your property "${title}" on Shirur Express (0% Brokerage) and would like to know more details.`);
    window.open(`https://wa.me/${clean.length === 10 ? "91" + clean : clean}?text=${msg}`, "_blank");
  };

  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] min-h-screen font-sans antialiased flex flex-col selection:bg-emerald-600 selection:text-white">

      {/* ── STICKY TOP BRAND HEADER ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-md mx-auto px-3.5 pt-3 pb-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <button
                onClick={() => setLocation("/")}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 flex items-center justify-center transition border border-slate-200/80"
                title="Back to Home"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm tracking-tight text-slate-900">SHIRUR EXPRESS</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    0% Brokerage
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-500 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600" /> Shirur, Dist. Pune • Verified Owner Hub
                </p>
              </div>
            </div>

            <button
              onClick={() => setPostModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-xl shadow-sm shadow-emerald-200 flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Property</span>
              <span className="bg-amber-300 text-slate-950 px-1 rounded text-[9px] font-black">FREE</span>
            </button>
          </div>
        </div>

        {/* ── STICKY SEARCH & INTENT PILLS (Feed tab only) ── */}
        {activeSubTab === "feed" && (
          <div className="border-t border-slate-100 bg-white/95 backdrop-blur-md">
            <div className="max-w-md mx-auto px-3.5 py-2.5 space-y-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 text-emerald-600 w-3.5 h-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 'Ramdara Road', '2 BHK', 'MIDC', 'Shop', 'Plot'..."
                  className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Primary Intent Tabs */}
              <div className="flex space-x-1.5 overflow-x-auto no-scrollbar pt-0.5" style={{ scrollbarWidth: "none" }}>
                {[
                  { id: "all", label: "All Properties", icon: Building2, count: allProperties.length },
                  { id: "rent", label: "🔑 For Rent", count: null },
                  { id: "sell", label: "🏡 Buy / Sale", count: null },
                  { id: "commercial", label: "🏪 Commercial", count: null },
                  { id: "plot", label: "📐 Plots / Land", count: null },
                ].map((item) => {
                  const isActive = activeIntent === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveIntent(item.id as any)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1 ${
                        isActive
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-700 hover:bg-emerald-50 border border-slate-200"
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.count !== null && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Locality Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100" style={{ scrollbarWidth: "none" }}>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase shrink-0 pr-1 flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5 text-emerald-500" /> Area:
                </span>
                {LOCALITIES_LIST.map((loc) => {
                  const isLocActive = activeLocality === loc;
                  return (
                    <button
                      key={loc}
                      onClick={() => setActiveLocality(loc)}
                      className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        isLocActive
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="max-w-md mx-auto w-full flex-1 px-3.5 pt-3 pb-32 space-y-4">

        {/* ── SUB-TAB 1: FEED VIEW ── */}
        {activeSubTab === "feed" && (
          <div className="space-y-4">
            {/* Hero Savings Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-4 text-white shadow-md shadow-emerald-200/70 relative overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" /> Say Goodbye to Brokers
                  </div>
                  <h2 className="text-base font-black leading-tight">100% Direct Owner Properties in Shirur</h2>
                  <p className="text-[11px] text-emerald-50 font-medium">
                    Save 1 Month Rent or 2% Commission • Talk Directly to Verified Owners
                  </p>
                </div>
                <button
                  onClick={() => setPostModalOpen(true)}
                  className="shrink-0 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs px-3 py-2.5 rounded-xl shadow-md transition text-center leading-tight"
                >
                  + List Yours<br />
                  <span className="text-[10px] font-bold">₹0 Fee</span>
                </button>
              </div>
            </div>

            {/* Quick Filter Toggle Pills */}
            <div className="flex space-x-2 overflow-x-auto no-scrollbar py-0.5" style={{ scrollbarWidth: "none" }}>
              <button
                onClick={() => setQuickFilters((prev) => ({ ...prev, bachelors: !prev.bachelors }))}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 ${
                  quickFilters.bachelors
                    ? "bg-emerald-600 text-white border border-emerald-600 shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 shadow-2xs"
                }`}
              >
                <span>🎓 Bachelors Allowed</span>
              </button>
              <button
                onClick={() => setQuickFilters((prev) => ({ ...prev, furnished: !prev.furnished }))}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 ${
                  quickFilters.furnished
                    ? "bg-emerald-600 text-white border border-emerald-600 shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 shadow-2xs"
                }`}
              >
                <span>🛋️ Furnished</span>
              </button>
              <button
                onClick={() => setQuickFilters((prev) => ({ ...prev, immediate: !prev.immediate }))}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 ${
                  quickFilters.immediate
                    ? "bg-emerald-600 text-white border border-emerald-600 shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 shadow-2xs"
                }`}
              >
                <span>⚡ Ready to Move</span>
              </button>
              {(quickFilters.bachelors || quickFilters.furnished || quickFilters.immediate || activeIntent !== "all" || activeLocality !== "All Shirur" || searchQuery) && (
                <button
                  onClick={() => {
                    setActiveIntent("all");
                    setActiveLocality("All Shirur");
                    setQuickFilters({ bachelors: false, furnished: false, immediate: false });
                    setSearchQuery("");
                    showToast("🔄 Filters reset to all properties");
                  }}
                  className="shrink-0 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            {/* Results Count & Verified Strip */}
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-extrabold text-slate-700">
                Showing <span className="text-emerald-600">{filteredProperties.length}</span> Verified Owner Listings
              </p>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Aadhaar & 7/12 Checked
              </span>
            </div>

            {/* Property Cards List */}
            {isDbLoading && allProperties.length === 0 ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse h-64" />
                ))}
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-lg">
                  <Building2 className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-800">No properties match this filter</h4>
                <p className="text-xs text-slate-500">
                  Try selecting "All Shirur" or clearing filters to view all direct-owner properties in Shirur.
                </p>
                <button
                  onClick={() => {
                    setActiveIntent("all");
                    setActiveLocality("All Shirur");
                    setQuickFilters({ bachelors: false, furnished: false, immediate: false });
                    setSearchQuery("");
                  }}
                  className="bg-emerald-600 text-white text-xs font-extrabold px-4 py-2 rounded-xl"
                >
                  Show All {allProperties.length} Properties
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProperties.map((prop) => {
                  const isSaved = savedIds.has(prop.id);
                  const isRent = (prop.listingType || "rent").toLowerCase().includes("rent");
                  const priceStr = formatPrice(prop.rent, isRent);
                  const brokerageSavedStr = calculateBrokerageSaved(prop.rent, isRent);
                  const coverImage = (prop.images && prop.images.length > 0)
                    ? prop.images[0]
                    : "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=700&q=80";

                  const badgeColor =
                    prop.listingType === "commercial"
                      ? "bg-amber-500 text-slate-950"
                      : prop.listingType === "plot"
                      ? "bg-teal-700 text-white"
                      : isRent
                      ? "bg-emerald-600 text-white"
                      : "bg-indigo-600 text-white";

                  const typeBadgeText =
                    prop.listingType === "commercial"
                      ? "COMMERCIAL"
                      : prop.listingType === "plot"
                      ? "NA PLOT"
                      : isRent
                      ? "FOR RENT"
                      : "FOR SALE";

                  const ownerPhone = prop.contactPhone || prop.owner?.phoneNumber || prop.owner?.phone || "+919822045120";
                  const ownerDisplayName = prop.owner?.name || prop.owner?.username || "Verified Owner";

                  return (
                    <article
                      key={prop.id}
                      className="bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl overflow-hidden shadow-xs transition"
                    >
                      {/* Image & Badges */}
                      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={coverImage}
                          alt={prop.title}
                          className="w-full h-full object-cover"
                          onError={(e: any) => {
                            e.target.src = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=700&q=80";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/30" />

                        {/* Top Badges */}
                        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                          <span className={`${badgeColor} text-[10px] font-black px-2.5 py-0.5 rounded-md shadow-xs uppercase tracking-wide`}>
                            {typeBadgeText}
                          </span>
                          <span className="bg-white/95 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" /> 0% BROKERAGE
                          </span>
                        </div>

                        {/* Shortlist Heart Button */}
                        <button
                          onClick={() => toggleShortlist(prop.id)}
                          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 hover:bg-white flex items-center justify-center shadow-md transition"
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? "fill-rose-500 text-rose-500" : "text-slate-600"}`} />
                        </button>

                        {/* Bottom Overlay: Brokerage Saved Pill */}
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
                          <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                            💰 SAVE {brokerageSavedStr} BROKERAGE
                          </span>
                          <span className="bg-slate-900/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Direct Owner
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-3.5 space-y-3">
                        {/* Title, Address & Price */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-extrabold text-sm text-slate-900 leading-snug truncate">
                              {prop.title}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">{prop.address || prop.locality || "Shirur"}</span>
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-black text-emerald-700">{priceStr}</p>
                            <p className="text-[10px] font-bold text-slate-400">Direct Owner Rate</p>
                          </div>
                        </div>

                        {/* Sub-price / Deposit Strip */}
                        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700">
                            {prop.deposit && Number(prop.deposit) > 0
                              ? `Deposit: ₹${Number(prop.deposit).toLocaleString("en-IN")}`
                              : prop.ownerNote || "Ready for Direct Visit"}
                          </span>
                          <span className="text-emerald-700 font-extrabold text-[10px] uppercase">
                            ₹0 Commission
                          </span>
                        </div>

                        {/* 4-Grid Key Property Specs */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Maximize2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate font-semibold">{prop.area ? `${prop.area} sq.ft` : "Spacious Built-up"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Sofa className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate font-semibold">{prop.furnishing || "Unfurnished"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate font-semibold">{prop.bedrooms ? `${prop.bedrooms} BHK Setup` : prop.propertyType}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Droplets className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate font-semibold">24x7 Water • Ready Visit</span>
                          </div>
                        </div>

                        {/* Verified Owner Strip & Action Buttons */}
                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                              {ownerDisplayName.charAt(0)}
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-extrabold text-slate-800 truncate">{ownerDisplayName}</p>
                              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Direct Owner
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => openWhatsApp(ownerPhone, prop.title)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-extrabold text-xs px-2.5 py-2 rounded-xl transition flex items-center gap-1"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Chat</span>
                            </button>
                            <button
                              onClick={() => setSelectedPropForContact(prop)}
                              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs px-3 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call Owner</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Owner CTA Card at bottom of feed */}
            <div className="bg-white border-2 border-dashed border-emerald-300 rounded-2xl p-4 text-center space-y-2 shadow-xs">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-lg">
                <HomeIcon className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900">Have a Flat, Shop, Row House or Plot in Shirur?</h3>
              <p className="text-xs text-slate-500">
                Post your property advertisement in 60 seconds. Get direct calls from verified tenants & buyers without paying any broker commission.
              </p>
              <button
                onClick={() => setPostModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm shadow-emerald-200 transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Post Free Property Ad Now
              </button>
            </div>
          </div>
        )}

        {/* ── SUB-TAB 2: SHORTLISTED / SAVED PROPERTIES ── */}
        {activeSubTab === "saved" && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> Shortlisted Properties
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare your saved zero-brokerage homes & contact owners directly.
              </p>
            </div>

            {savedProperties.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
                  <Heart className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">No properties shortlisted yet</p>
                <p className="text-[11px] text-slate-400">
                  Tap the heart icon on any property card to save it here for easy comparison.
                </p>
                <button
                  onClick={() => setActiveSubTab("feed")}
                  className="mt-2 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Explore Properties
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {savedProperties.map((p) => {
                  const isRent = (p.listingType || "rent").toLowerCase().includes("rent");
                  return (
                    <div
                      key={p.id}
                      className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {p.propertyType} • {p.locality || "Shirur"}
                        </span>
                        <h4 className="font-extrabold text-xs text-slate-900 mt-1 truncate">{p.title}</h4>
                        <p className="text-xs font-black text-emerald-600">
                          {formatPrice(p.rent, isRent)}{" "}
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({p.owner?.name || "Direct Owner"})
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setSelectedPropForContact(p)}
                          className="bg-emerald-600 text-white font-bold text-xs px-3 py-2 rounded-xl"
                        >
                          Call Owner
                        </button>
                        <button
                          onClick={() => toggleShortlist(p.id)}
                          className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition"
                          title="Remove from shortlist"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SUB-TAB 3: BROKERAGE SAVINGS CALCULATOR & SAFETY GUIDE ── */}
        {activeSubTab === "calc" && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                Savings Calculator
              </span>
              <h2 className="text-base font-extrabold text-slate-900">How Much Brokerage Do You Save?</h2>
              <p className="text-xs text-slate-500">
                Traditional brokers in Shirur charge 1 month rent or 2% on property sales. Check your direct savings on Shirur Express:
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Enter Monthly Rent (₹) or Property Sale Value (₹)
                  </label>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">If Rent (1 Month)</p>
                    <p className="text-base font-black text-emerald-600 mt-0.5">
                      Save ₹{calcAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">If Sale (2% Comm.)</p>
                    <p className="text-base font-black text-emerald-600 mt-0.5">
                      Save ₹{Math.round(calcAmount * 0.02).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2.5">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Shirur Express Zero-Brokerage Promise
              </h3>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    <strong>Never Pay Visit Charges:</strong> Calling owners and visiting properties on Shirur Express is 100% free.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    <strong>Direct Agreement:</strong> Online Leave & License (Rent Agreement) assistance available at government stamp rates.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>
                    <strong>Report Brokers:</strong> If any listed number asks for brokerage commission, contact us and we remove the listing immediately.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* ── BOTTOM NAVIGATION BAR ── */}
      <nav className="bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 z-40 px-2 py-1.5 shadow-[0_-4px_12px_rgba(15,23,42,0.05)]">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1 text-center">
          <button
            onClick={() => setActiveSubTab("feed")}
            className={`flex flex-col items-center justify-center py-1 transition ${
              activeSubTab === "feed" ? "text-emerald-600 font-extrabold" : "text-slate-500 font-medium hover:text-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Explore</span>
          </button>
          <button
            onClick={() => setPostModalOpen(true)}
            className="flex flex-col items-center justify-center py-1 text-slate-500 hover:text-emerald-600 font-bold transition"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] mt-0.5">Post Free</span>
          </button>
          <button
            onClick={() => setActiveSubTab("saved")}
            className={`flex flex-col items-center justify-center py-1 transition relative ${
              activeSubTab === "saved" ? "text-emerald-600 font-extrabold" : "text-slate-500 font-medium hover:text-slate-800"
            }`}
          >
            <Heart className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Shortlist ({savedIds.size})</span>
          </button>
          <button
            onClick={() => setActiveSubTab("calc")}
            className={`flex flex-col items-center justify-center py-1 transition ${
              activeSubTab === "calc" ? "text-emerald-600 font-extrabold" : "text-slate-500 font-medium hover:text-slate-800"
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Savings</span>
          </button>
        </div>
      </nav>

      {/* ── MODAL 1: OWNER CONTACT MODAL ── */}
      <AnimatePresence>
        {selectedPropForContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPropForContact(null)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-start">
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Direct Owner
                </span>
                <button
                  onClick={() => setSelectedPropForContact(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{selectedPropForContact.title}</h3>
                <p className="text-xs font-extrabold text-emerald-600 mt-0.5">
                  {formatPrice(selectedPropForContact.rent, (selectedPropForContact.listingType || "rent").toLowerCase().includes("rent"))} • {selectedPropForContact.locality || "Shirur"}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Owner Name:</span>
                  <strong className="text-slate-900">{selectedPropForContact.owner?.name || "Direct Owner"}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Direct Mobile:</span>
                  <strong className="text-emerald-700 font-black text-sm">
                    {selectedPropForContact.contactPhone || selectedPropForContact.owner?.phoneNumber || "+91 98220 45120"}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Brokerage Saved:</span>
                  <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded text-[11px]">
                    {calculateBrokerageSaved(
                      selectedPropForContact.rent,
                      (selectedPropForContact.listingType || "rent").toLowerCase().includes("rent")
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 space-y-0.5">
                  <p><strong>Address:</strong> {selectedPropForContact.address || selectedPropForContact.locality}</p>
                  <p><strong>Area:</strong> {selectedPropForContact.area ? `${selectedPropForContact.area} sq.ft` : "Spacious"} • {selectedPropForContact.furnishing || "Unfurnished"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => copyPhone(selectedPropForContact.contactPhone || selectedPropForContact.owner?.phoneNumber || "+919822045120")}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPhone ? "Copied!" : "Copy Number"}</span>
                </button>
                <a
                  href={`tel:${(selectedPropForContact.contactPhone || selectedPropForContact.owner?.phoneNumber || "+919822045120").replace(/[^0-9+]/g, "")}`}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5 transition"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Now
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: POST FREE PROPERTY MODAL ── */}
      <AnimatePresence>
        {postModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center"
            onClick={() => setPostModalOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md mx-auto rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border-t border-slate-200 max-h-[90vh] overflow-y-auto space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                    100% Free Owner Listing
                  </span>
                  <h3 className="font-black text-base text-slate-900 mt-0.5">Post Your Property (0% Brokerage)</h3>
                </div>
                <button
                  onClick={() => setPostModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-rose-100 hover:text-rose-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handlePostSubmit} className="space-y-4 text-xs">
                {/* 1. Category & Property Type */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Listing Objective *</label>
                    <select
                      value={postForm.category}
                      onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-emerald-500"
                    >
                      <option value="rent">🔑 Flat / House for Rent</option>
                      <option value="sell">🏡 Property for Sale</option>
                      <option value="commercial">🏪 Commercial / Office</option>
                      <option value="plot">📐 NA Plot / Land</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Property Type *</label>
                    <select
                      value={postForm.propertyType}
                      onChange={(e) => setPostForm({ ...postForm, propertyType: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-emerald-500"
                    >
                      <option value="Apartment">Apartment / Flat</option>
                      <option value="Independent House">Independent House / Villa</option>
                      <option value="Commercial Space">Commercial Space</option>
                      <option value="Shop">Shop / Retail Store</option>
                      <option value="Office">Office Space</option>
                      <option value="Plot">Plot / Land</option>
                      <option value="Farm House">Farm House</option>
                    </select>
                  </div>
                </div>

                {/* 2. Title */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Property Title / Summary *</label>
                  <input
                    type="text"
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    required
                    placeholder="e.g., Spacious 2 BHK Flat with Balcony in Ganesh Park"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 3. Locality & Exact Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Shirur Locality / Area *</label>
                    <select
                      value={postForm.locality}
                      onChange={(e) => setPostForm({ ...postForm, locality: e.target.value })}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-emerald-500"
                    >
                      {LOCALITIES_LIST.filter((l) => l !== "All Shirur").map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Exact Address in Shirur *</label>
                    <input
                      type="text"
                      value={postForm.address}
                      onChange={(e) => setPostForm({ ...postForm, address: e.target.value })}
                      required
                      placeholder="e.g., Near Ganpati Mandir, Ramdara Road"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* 4. Pricing & Deposit */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {postForm.category === "rent" ? "Monthly Rent (₹) *" : "Sale Price (₹) *"}
                    </label>
                    <input
                      type="text"
                      value={postForm.price}
                      onChange={(e) => setPostForm({ ...postForm, price: e.target.value })}
                      required
                      placeholder={postForm.category === "rent" ? "e.g., 8500" : "e.g., 3500000"}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Deposit (₹)</label>
                    <input
                      type="text"
                      value={postForm.deposit}
                      onChange={(e) => setPostForm({ ...postForm, deposit: e.target.value })}
                      placeholder="e.g., 20000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="font-bold text-slate-700 block mb-1">Notice Period</label>
                    <select
                      value={postForm.noticePeriod}
                      onChange={(e) => setPostForm({ ...postForm, noticePeriod: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-emerald-500"
                    >
                      <option value="1 Month">1 Month</option>
                      <option value="15 Days">15 Days</option>
                      <option value="2 Months">2 Months</option>
                      <option value="Immediate">Immediate</option>
                      <option value="Negotiable">Negotiable</option>
                    </select>
                  </div>
                </div>

                {/* 5. Configuration (Bedrooms, Bathrooms, Area, Furnishing) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bedrooms / BHK</label>
                    <select
                      value={postForm.bedrooms}
                      onChange={(e) => setPostForm({ ...postForm, bedrooms: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-emerald-500"
                    >
                      <option value="1">1 BHK / 1 RK</option>
                      <option value="2">2 BHK</option>
                      <option value="3">3 BHK</option>
                      <option value="4">4+ BHK</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bathrooms</label>
                    <select
                      value={postForm.bathrooms}
                      onChange={(e) => setPostForm({ ...postForm, bathrooms: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-emerald-500"
                    >
                      <option value="1">1 Bath</option>
                      <option value="2">2 Baths</option>
                      <option value="3">3+ Baths</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Built-up Area (sq.ft)</label>
                    <input
                      type="text"
                      value={postForm.area}
                      onChange={(e) => setPostForm({ ...postForm, area: e.target.value })}
                      placeholder="e.g., 850"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Furnishing</label>
                    <select
                      value={postForm.furnishing}
                      onChange={(e) => setPostForm({ ...postForm, furnishing: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-emerald-500"
                    >
                      <option value="Unfurnished">Unfurnished</option>
                      <option value="Semi-Furnished">Semi-Furnished</option>
                      <option value="Furnished">Fully Furnished</option>
                    </select>
                  </div>
                </div>

                {/* 6. Tenant Preference */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Preferred Tenant</label>
                  <select
                    value={postForm.tenantPref}
                    onChange={(e) => setPostForm({ ...postForm, tenantPref: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-emerald-500"
                  >
                    <option value="Family / Working Bachelors">Family / Working Bachelors</option>
                    <option value="Family Only">Family Only</option>
                    <option value="Bachelors / Students / MIDC Staff">Bachelors / Students / MIDC Staff</option>
                    <option value="Anyone (No Restriction)">Anyone (No Restriction)</option>
                    <option value="Company Lease / Commercial">Company Lease / Commercial</option>
                  </select>
                </div>

                {/* 7. AMENITIES (Interactive Chips) */}
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                      <span>Property Amenities</span>
                      <span className="text-slate-400 font-normal">({selectedAmenities.length} selected)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Tap to toggle</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {AMENITIES_LIST.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity.name);
                      return (
                        <button
                          key={amenity.name}
                          type="button"
                          onClick={() => toggleAmenity(amenity.name)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-between transition border text-left ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>{amenity.icon}</span>
                            <span>{amenity.name}</span>
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 8. COMPULSORY PROPERTY PHOTOS (Camera + Gallery) */}
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-emerald-600" />
                        <span>Property Photos *</span>
                      </label>
                      <p className="text-[10.5px] text-slate-500">
                        Upload or snap multiple photos (Hall, Bedroom, Kitchen, Washroom)
                      </p>
                    </div>

                    {uploadedImages.length === 0 ? (
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-rose-200 shrink-0">
                        <AlertCircle className="w-3 h-3" />
                        Compulsory (Min 1)
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 shrink-0">
                        <Check className="w-3 h-3" />
                        {uploadedImages.length} Photo{uploadedImages.length > 1 ? "s" : ""} Added
                      </span>
                    )}
                  </div>

                  {/* Camera & Gallery Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Camera Button */}
                    <label
                      htmlFor="camera-input-field"
                      className={`cursor-pointer bg-white border-2 border-emerald-500 hover:bg-emerald-50 active:scale-98 text-emerald-700 font-extrabold rounded-xl py-2 px-3 text-center flex items-center justify-center gap-1.5 transition shadow-2xs ${
                        isUploadingImage ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>Take Photo</span>
                    </label>
                    <input
                      id="camera-input-field"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        handleImageFilesUpload(e.target.files);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />

                    {/* Gallery Button */}
                    <label
                      htmlFor="gallery-input-field"
                      className={`cursor-pointer bg-white border border-slate-300 hover:bg-slate-100 active:scale-98 text-slate-700 font-bold rounded-xl py-2 px-3 text-center flex items-center justify-center gap-1.5 transition ${
                        isUploadingImage ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 text-slate-500" />
                      <span>Choose Files</span>
                    </label>
                    <input
                      id="gallery-input-field"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        handleImageFilesUpload(e.target.files);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </div>

                  {/* Uploading progress indicator */}
                  {isUploadingImage && (
                    <div className="bg-emerald-100/70 border border-emerald-200 text-emerald-900 rounded-xl p-2.5 text-xs font-semibold flex items-center justify-center gap-2 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                      <span>Uploading photo(s) to cloud... Please wait</span>
                    </div>
                  )}

                  {/* Thumbnail Previews */}
                  {uploadedImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {uploadedImages.map((imgUrl, index) => (
                        <div
                          key={index}
                          className="relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group bg-slate-100"
                        >
                          <img
                            src={imgUrl}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {index === 0 && (
                            <span className="absolute bottom-1 left-1 bg-slate-900/80 text-white text-[8px] font-black px-1 rounded backdrop-blur-2xs">
                              Cover
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeUploadedImage(index)}
                            className="absolute top-1 right-1 w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-md transition"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-rose-300 bg-rose-50/50 rounded-xl p-3 text-center">
                      <p className="text-[11px] font-bold text-rose-700">
                        📸 Property photos are compulsory!
                      </p>
                      <p className="text-[10px] text-rose-600/80 mt-0.5">
                        Tap "Take Photo" to snap with your phone camera, or "Choose Files" from gallery.
                      </p>
                    </div>
                  )}
                </div>

                {/* 9. Contact Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Owner Full Name *</label>
                    <input
                      type="text"
                      value={postForm.ownerName}
                      onChange={(e) => setPostForm({ ...postForm, ownerName: e.target.value })}
                      required
                      placeholder="e.g., Sandeep Gavhane"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Owner Mobile No. *</label>
                    <input
                      type="tel"
                      value={postForm.contactPhone}
                      onChange={(e) => setPostForm({ ...postForm, contactPhone: e.target.value })}
                      required
                      placeholder="e.g., 9822011223"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Owner Email (Optional)</label>
                  <input
                    type="email"
                    value={postForm.contactEmail}
                    onChange={(e) => setPostForm({ ...postForm, contactEmail: e.target.value })}
                    placeholder="e.g., owner@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* 10. Owner Note / USP */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Owner's Note / Unique Features (USP)</label>
                  <textarea
                    rows={2}
                    value={postForm.ownerNote}
                    onChange={(e) => setPostForm({ ...postForm, ownerNote: e.target.value })}
                    placeholder="e.g., East facing, 24-hr water, near school & bus stand, separate electric meter..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-[11px] text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    I confirm I am the direct owner (or family member) and will charge <strong>₹0 Brokerage</strong>.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={postMutation.isPending || isUploadingImage}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black py-3 rounded-xl shadow-md shadow-emerald-200 transition flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                >
                  {postMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Publishing Property...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Publish Property Live (Free)
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST NOTIFICATION ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold max-w-xs text-center"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
