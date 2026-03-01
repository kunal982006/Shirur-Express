import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface CakePreviewProps {
    shape: string;
    sponge: string;
    primaryColor: string;
    secondaryColor: string;
    frostingMat: string;
    texture: string;
    toppings: string[];
    message: string;
    font: string;
    photoUrl: string | null;
    weight: string;
}

// ── Color Maps ──
const SPONGE_COLORS: Record<string, string> = {
    vanilla: "#FFF3D4",
    chocolate: "#5D3A1A",
    redvelvet: "#9B1B30",
    funfetti: "#F3E0F5",
    coffee: "#6F4E37",
};

const SPONGE_DARK: Record<string, string> = {
    vanilla: "#E8D8A8",
    chocolate: "#3E2723",
    redvelvet: "#7A1525",
    funfetti: "#D9C0E0",
    coffee: "#5A3D2B",
};

const WEIGHT_HEIGHTS: Record<string, number> = {
    "0.5kg": 70,
    "1kg": 90,
    "2kg": 115,
    custom: 140,
};

// ── FRONT VIEW SUB-COMPONENT ──
function CakeFrontView({
    shape, sponge, primaryColor, secondaryColor, frostingMat, texture,
    toppings, message, font, photoUrl, weight,
}: CakePreviewProps) {
    const spongeColor = SPONGE_COLORS[sponge] || "#FFF3D4";
    const spongeDark = SPONGE_DARK[sponge] || "#E8D8A8";
    const cakeH = WEIGHT_HEIGHTS[weight] || 90;

    const frostingOpacity = useMemo(() => {
        switch (texture) {
            case "naked": return 0;
            case "semi": return 0.35;
            case "rustic": return 0.75;
            case "ruffles": return 0.85;
            default: return 1;
        }
    }, [texture]);

    const frostingGloss = frostingMat === "fondant" ? 0.25 : frostingMat === "buttercream" ? 0.1 : 0;

    const fontFamily = useMemo(() => {
        switch (font) {
            case "cursive": return "'Georgia', 'Times New Roman', serif";
            case "block": return "'Impact', 'Arial Black', sans-serif";
            case "messy": return "'Comic Sans MS', 'Segoe UI', sans-serif";
            default: return "serif";
        }
    }, [font]);

    const fontStyle = font === "cursive" ? "italic" : "normal";
    const isTall = shape === "tall";

    const cx = 160;
    const plateY = 220;
    const cakeBottom = plateY - 6;
    const cakeTop = cakeBottom - cakeH;
    const cakeMiddle = (cakeTop + cakeBottom) / 2;
    const cakeW = shape === "tall" ? 80 : shape === "heart" ? 120 : 130;
    const topInset = isTall ? 0 : 8;

    const cakePath = useMemo(() => {
        const left = cx - cakeW;
        const right = cx + cakeW;
        const topLeft = cx - cakeW + topInset;
        const topRight = cx + cakeW - topInset;

        if (shape === "square") {
            return `M ${left},${cakeBottom} L ${left},${cakeTop} L ${right},${cakeTop} L ${right},${cakeBottom} Z`;
        }
        if (shape === "heart") {
            const midY = cakeTop + (cakeBottom - cakeTop) * 0.35;
            return `M ${cx},${cakeBottom}
              Q ${left - 20},${cakeBottom - 20} ${left},${midY}
              Q ${left - 5},${cakeTop - 10} ${cx},${cakeTop + 15}
              Q ${right + 5},${cakeTop - 10} ${right},${midY}
              Q ${right + 20},${cakeBottom - 20} ${cx},${cakeBottom} Z`;
        }
        if (shape === "number") {
            return `M ${left + 20},${cakeBottom}
              L ${left + 20},${cakeTop + 10}
              L ${left},${cakeTop + 10}
              L ${left},${cakeTop}
              L ${right},${cakeTop}
              L ${right},${cakeTop + 10}
              L ${cx + 10},${cakeTop + 10}
              L ${cx + 10},${cakeMiddle - 5}
              L ${right},${cakeMiddle - 5}
              L ${right},${cakeMiddle + 5}
              L ${cx + 10},${cakeMiddle + 5}
              L ${cx + 10},${cakeBottom}
              Z`;
        }
        const rad = shape === "tall" ? 6 : 14;
        return `M ${left + rad},${cakeBottom}
            Q ${left},${cakeBottom} ${left},${cakeBottom - rad}
            L ${topLeft},${cakeTop + rad}
            Q ${topLeft},${cakeTop} ${topLeft + rad},${cakeTop}
            L ${topRight - rad},${cakeTop}
            Q ${topRight},${cakeTop} ${topRight},${cakeTop + rad}
            L ${right},${cakeBottom - rad}
            Q ${right},${cakeBottom} ${right - rad},${cakeBottom}
            Z`;
    }, [shape, cx, cakeW, cakeTop, cakeBottom, cakeMiddle, topInset, isTall]);

    const dripPaths = useMemo(() => {
        if (!toppings.includes("drip")) return null;
        const baseLeft = cx - cakeW + topInset;
        const baseRight = cx + cakeW - topInset;
        const dripWidth = baseRight - baseLeft;
        const dripCount = 7;
        const drips: string[] = [];
        for (let i = 0; i < dripCount; i++) {
            const x = baseLeft + (dripWidth / (dripCount + 1)) * (i + 1);
            const dripLen = 12 + Math.sin(i * 2.5) * 10;
            drips.push(`M ${x},${cakeTop} Q ${x + 3},${cakeTop + dripLen} ${x},${cakeTop + dripLen + 4}`);
        }
        return drips;
    }, [toppings, cx, cakeW, topInset, cakeTop]);

    return (
        <svg viewBox="0 0 320 250" style={{ width: "100%", height: "auto" }} xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="fg-gloss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fff" stopOpacity={frostingGloss} />
                    <stop offset="50%" stopColor="#fff" stopOpacity={0} />
                    <stop offset="100%" stopColor="#000" stopOpacity={0.06} />
                </linearGradient>
                <radialGradient id="fg-shadow" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#000" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#000" stopOpacity={0} />
                </radialGradient>
                <linearGradient id="fg-gold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#FFF8DC" />
                    <stop offset="100%" stopColor="#DAA520" />
                </linearGradient>
                {sponge === "funfetti" && (
                    <pattern id="fg-funfetti" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="4" cy="4" r="2" fill="#FF6B9D" opacity={0.6} />
                        <circle cx="14" cy="8" r="1.5" fill="#45B7D1" opacity={0.6} />
                        <circle cx="8" cy="16" r="2" fill="#96CEB4" opacity={0.6} />
                        <circle cx="18" cy="14" r="1.5" fill="#FFEAA7" opacity={0.6} />
                    </pattern>
                )}
            </defs>

            {/* Plate shadow & plate */}
            <ellipse cx={cx} cy={plateY + 4} rx={cakeW + 20} ry={12} fill="url(#fg-shadow)" />
            <ellipse cx={cx} cy={plateY} rx={cakeW + 16} ry={8} fill="#E8E0D8" stroke="#D4C8BC" strokeWidth={1} />
            <ellipse cx={cx} cy={plateY - 2} rx={cakeW + 14} ry={7} fill="#F5F0EB" />

            {/* Sponge */}
            <path d={cakePath} fill={spongeColor} style={{ transition: "fill 0.4s ease" }} />
            {(texture === "naked" || texture === "semi") && (
                <line x1={cx - cakeW + 5} y1={cakeMiddle} x2={cx + cakeW - 5} y2={cakeMiddle}
                    stroke={spongeDark} strokeWidth={2} strokeDasharray="6 3" opacity={0.5} />
            )}
            {sponge === "funfetti" && frostingOpacity < 1 && (
                <path d={cakePath} fill="url(#fg-funfetti)" opacity={0.4} />
            )}

            {/* Frosting */}
            {frostingOpacity > 0 && (
                <>
                    <path d={cakePath} fill={primaryColor} opacity={frostingOpacity}
                        style={{ transition: "fill 0.4s ease, opacity 0.4s ease" }} />
                    <path d={cakePath} fill="url(#fg-gloss)" opacity={frostingOpacity} />
                </>
            )}

            {/* Ruffles */}
            {texture === "ruffles" && [0, 1, 2, 3, 4].map(i => {
                const y = cakeTop + ((cakeBottom - cakeTop) / 5) * i + 8;
                return (
                    <path key={`r-${i}`}
                        d={`M ${cx - cakeW + 5},${y} Q ${cx - cakeW / 2},${y - 5} ${cx},${y} Q ${cx + cakeW / 2},${y + 5} ${cx + cakeW - 5},${y}`}
                        fill="none" stroke={secondaryColor} strokeWidth={2.5} opacity={0.6}
                        style={{ transition: "stroke 0.4s ease" }} />
                );
            })}

            {/* Top ellipse */}
            <ellipse cx={cx} cy={cakeTop}
                rx={cakeW - topInset} ry={shape === "square" ? 4 : shape === "heart" ? 6 : 10}
                fill={frostingOpacity > 0 ? primaryColor : spongeColor}
                opacity={shape === "heart" || shape === "number" ? 0 : 1}
                style={{ transition: "fill 0.4s ease" }} />
            {frostingOpacity > 0 && shape !== "heart" && shape !== "number" && (
                <ellipse cx={cx} cy={cakeTop} rx={cakeW - topInset}
                    ry={shape === "square" ? 4 : 10} fill="url(#fg-gloss)" />
            )}

            {/* Drip */}
            {dripPaths?.map((d, i) => (
                <path key={`d-${i}`} d={d} fill="none"
                    stroke={sponge === "chocolate" || sponge === "coffee" ? "#3E2723" : "#8B4513"}
                    strokeWidth={4} strokeLinecap="round" opacity={0.85} />
            ))}

            {/* Photo */}
            {photoUrl && (
                <>
                    <defs><clipPath id="fg-photo"><circle cx={cx} cy={cakeMiddle} r={22} /></clipPath></defs>
                    <circle cx={cx} cy={cakeMiddle} r={24} fill="#fff" opacity={0.9} />
                    <image href={photoUrl} x={cx - 22} y={cakeMiddle - 22} width={44} height={44}
                        clipPath="url(#fg-photo)" preserveAspectRatio="xMidYMid slice" />
                    <circle cx={cx} cy={cakeMiddle} r={23} fill="none" stroke={primaryColor} strokeWidth={1.5} opacity={0.7} />
                </>
            )}

            {/* Toppings: foil */}
            {toppings.includes("foil") && [0, 1, 2, 3, 4].map(i => (
                <rect key={`f-${i}`} x={cx - 40 + i * 20} y={cakeTop - 3 + (i % 2) * 4}
                    width={6} height={6} rx={1} fill="url(#fg-gold)" opacity={0.8}
                    transform={`rotate(${i * 30}, ${cx - 40 + i * 20 + 3}, ${cakeTop + (i % 2) * 4})`} />
            ))}

            {/* Pearls */}
            {toppings.includes("pearls") && [...Array(10)].map((_, i) => {
                const a = (i / 10) * Math.PI * 2;
                return <circle key={`p-${i}`} cx={cx + Math.cos(a) * (cakeW - topInset - 12)}
                    cy={cakeTop + Math.sin(a) * 5} r={2.5} fill="#FFFDE7" stroke="#E0D5C0" strokeWidth={0.5} />;
            })}

            {/* Macarons */}
            {toppings.includes("macarons") && [
                { x: cx - 30, y: cakeTop - 8, c: "#FFB6C1" },
                { x: cx, y: cakeTop - 12, c: "#B8E6C8" },
                { x: cx + 30, y: cakeTop - 8, c: "#C8B8E6" },
            ].map((m, i) => (
                <g key={`m-${i}`}>
                    <ellipse cx={m.x} cy={m.y} rx={10} ry={7} fill={m.c} />
                    <ellipse cx={m.x} cy={m.y + 2} rx={10} ry={2} fill="#FFF8DC" opacity={0.7} />
                </g>
            ))}

            {/* Flowers */}
            {toppings.includes("flowers") && [
                { x: cx - 35, y: cakeTop - 5 },
                { x: cx + 5, y: cakeTop - 14 },
                { x: cx + 40, y: cakeTop - 5 },
            ].map((f, i) => (
                <g key={`fl-${i}`}>
                    {[0, 1, 2, 3, 4].map(p => {
                        const a = (p / 5) * Math.PI * 2;
                        return <ellipse key={p} cx={f.x + Math.cos(a) * 5} cy={f.y + Math.sin(a) * 5}
                            rx={4} ry={3} fill={i === 0 ? "#FFB6C1" : i === 1 ? "#DDA0DD" : "#FFDAB9"} opacity={0.85}
                            transform={`rotate(${p * 72}, ${f.x + Math.cos(a) * 5}, ${f.y + Math.sin(a) * 5})`} />;
                    })}
                    <circle cx={f.x} cy={f.y} r={3} fill="#FFEAA7" />
                </g>
            ))}

            {/* Acrylic topper */}
            {toppings.includes("acrylic") && (
                <>
                    <line x1={cx} y1={cakeTop - 2} x2={cx} y2={cakeTop - 34} stroke="#D4AF37" strokeWidth={1.5} />
                    <rect x={cx - 36} y={cakeTop - 52} width={72} height={22} rx={4} fill="none" stroke="#D4AF37" strokeWidth={1.5} />
                    <text x={cx} y={cakeTop - 37} textAnchor="middle" fill="#D4AF37" fontSize={9}
                        fontWeight={700} fontFamily="'Georgia', serif" fontStyle="italic">Happy Birthday</text>
                </>
            )}

            {/* Custom text */}
            {message && !photoUrl && (
                <text x={cx} y={cakeMiddle + 4} textAnchor="middle"
                    fontSize={message.length > 20 ? 10 : message.length > 14 ? 12 : 14}
                    fontFamily={fontFamily} fontStyle={fontStyle}
                    fontWeight={font === "block" ? 900 : 500}
                    letterSpacing={font === "block" ? 1.5 : 0}
                    fill={primaryColor === "#FFFFFF" || primaryColor === "#FFFACD" || primaryColor === "#F5DEB3" ? "#4A3728" : "#FFFFFF"}
                    stroke={primaryColor === "#FFFFFF" || primaryColor === "#FFFACD" ? "none" : "rgba(0,0,0,0.15)"}
                    strokeWidth={0.3}
                    style={{ transition: "fill 0.3s ease", filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))" }}>
                    {message}
                </text>
            )}
            {message && photoUrl && (
                <text x={cx} y={cakeMiddle + 34} textAnchor="middle"
                    fontSize={message.length > 20 ? 9 : 11}
                    fontFamily={fontFamily} fontStyle={fontStyle}
                    fontWeight={font === "block" ? 900 : 500}
                    fill={primaryColor === "#FFFFFF" || primaryColor === "#FFFACD" ? "#4A3728" : "#FFFFFF"}
                    style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))" }}>
                    {message}
                </text>
            )}

            {/* Accent border */}
            {secondaryColor !== primaryColor && frostingOpacity > 0.3 && (
                <line x1={cx - cakeW + 2} y1={cakeBottom - 1} x2={cx + cakeW - 2} y2={cakeBottom - 1}
                    stroke={secondaryColor} strokeWidth={3} strokeLinecap="round" opacity={0.7}
                    style={{ transition: "stroke 0.4s ease" }} />
            )}

            {/* Sparkles */}
            {[
                { x: cx - cakeW - 18, y: cakeTop - 10, delay: 0 },
                { x: cx + cakeW + 16, y: cakeTop + 20, delay: 0.8 },
                { x: cx + cakeW + 10, y: cakeTop - 20, delay: 1.6 },
            ].map((s, i) => (
                <g key={`sp-${i}`} opacity={0.5}>
                    <motion.line x1={s.x - 4} y1={s.y} x2={s.x + 4} y2={s.y}
                        stroke="#FFD700" strokeWidth={1.5} strokeLinecap="round"
                        animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 2, repeat: Infinity, delay: s.delay }} />
                    <motion.line x1={s.x} y1={s.y - 4} x2={s.x} y2={s.y + 4}
                        stroke="#FFD700" strokeWidth={1.5} strokeLinecap="round"
                        animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 2, repeat: Infinity, delay: s.delay }} />
                </g>
            ))}
        </svg>
    );
}

// ── TOP-DOWN VIEW SUB-COMPONENT ──
function CakeTopView({
    shape, sponge, primaryColor, secondaryColor, frostingMat, texture,
    toppings, message, font, photoUrl,
}: CakePreviewProps) {
    const spongeColor = SPONGE_COLORS[sponge] || "#FFF3D4";

    const frostingOpacity = useMemo(() => {
        switch (texture) {
            case "naked": return 0;
            case "semi": return 0.35;
            case "rustic": return 0.75;
            case "ruffles": return 0.85;
            default: return 1;
        }
    }, [texture]);

    const frostingGloss = frostingMat === "fondant" ? 0.3 : frostingMat === "buttercream" ? 0.12 : 0;

    const fontFamily = useMemo(() => {
        switch (font) {
            case "cursive": return "'Georgia', 'Times New Roman', serif";
            case "block": return "'Impact', 'Arial Black', sans-serif";
            case "messy": return "'Comic Sans MS', 'Segoe UI', sans-serif";
            default: return "serif";
        }
    }, [font]);
    const fontStyle = font === "cursive" ? "italic" : "normal";

    const cx = 130;
    const cy = 130;
    const r = shape === "tall" ? 55 : 90;

    // Shape path for the top-down view
    const topShape = useMemo(() => {
        if (shape === "square") {
            const half = r;
            return `M ${cx - half},${cy - half} L ${cx + half},${cy - half} L ${cx + half},${cy + half} L ${cx - half},${cy + half} Z`;
        }
        if (shape === "heart") {
            return `M ${cx},${cy + r * 0.75}
              C ${cx - r * 1.1},${cy + r * 0.3} ${cx - r * 1.1},${cy - r * 0.5} ${cx},${cy - r * 0.3}
              C ${cx + r * 1.1},${cy - r * 0.5} ${cx + r * 1.1},${cy + r * 0.3} ${cx},${cy + r * 0.75} Z`;
        }
        if (shape === "number") {
            const half = r * 0.85;
            return `M ${cx - half},${cy - half}
              L ${cx + half},${cy - half}
              L ${cx + half},${cy - half / 3}
              L ${cx},${cy - half / 3}
              L ${cx},${cy + half / 3}
              L ${cx + half},${cy + half / 3}
              L ${cx + half},${cy + half}
              L ${cx - half},${cy + half}
              L ${cx - half},${cy + half / 3}
              L ${cx - half / 2},${cy + half / 3}
              L ${cx - half / 2},${cy - half / 3}
              L ${cx - half},${cy - half / 3}
              Z`;
        }
        // round / tall — circle
        return "";
    }, [shape, cx, cy, r]);

    const isCircle = shape === "round" || shape === "tall";

    return (
        <svg viewBox="0 0 260 260" style={{ width: "100%", height: "auto" }} xmlns="http://www.w3.org/2000/svg">
            <defs>
                <radialGradient id="top-gloss" cx="40%" cy="35%">
                    <stop offset="0%" stopColor="#fff" stopOpacity={frostingGloss + 0.15} />
                    <stop offset="60%" stopColor="#fff" stopOpacity={frostingGloss * 0.3} />
                    <stop offset="100%" stopColor="#000" stopOpacity={0.04} />
                </radialGradient>
                <radialGradient id="top-shadow" cx="50%" cy="50%">
                    <stop offset="70%" stopColor="#000" stopOpacity={0} />
                    <stop offset="100%" stopColor="#000" stopOpacity={0.08} />
                </radialGradient>
                <linearGradient id="top-gold" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#FFF8DC" />
                    <stop offset="100%" stopColor="#DAA520" />
                </linearGradient>
                {sponge === "funfetti" && (
                    <pattern id="top-funfetti" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                        <circle cx="5" cy="5" r="2.5" fill="#FF6B9D" opacity={0.5} />
                        <circle cx="17" cy="9" r="2" fill="#45B7D1" opacity={0.5} />
                        <circle cx="10" cy="19" r="2.5" fill="#96CEB4" opacity={0.5} />
                        <circle cx="21" cy="17" r="2" fill="#FFEAA7" opacity={0.5} />
                    </pattern>
                )}
            </defs>

            {/* Outer shadow */}
            {isCircle ? (
                <circle cx={cx} cy={cy} r={r + 10} fill="url(#top-shadow)" />
            ) : (
                <path d={topShape} fill="url(#top-shadow)" transform={`translate(0, 3)`} opacity={0.3} />
            )}

            {/* Plate ring */}
            {isCircle ? (
                <>
                    <circle cx={cx} cy={cy} r={r + 6} fill="#E8E0D8" stroke="#D4C8BC" strokeWidth={1} />
                    <circle cx={cx} cy={cy} r={r + 4} fill="#F5F0EB" />
                </>
            ) : (
                <>
                    <path d={topShape} fill="#E8E0D8" stroke="#D4C8BC" strokeWidth={1} transform="scale(1.06)" style={{ transformOrigin: `${cx}px ${cy}px` }} />
                    <path d={topShape} fill="#F5F0EB" transform="scale(1.04)" style={{ transformOrigin: `${cx}px ${cy}px` }} />
                </>
            )}

            {/* Sponge base */}
            {isCircle ? (
                <circle cx={cx} cy={cy} r={r} fill={spongeColor} style={{ transition: "fill 0.4s ease" }} />
            ) : (
                <path d={topShape} fill={spongeColor} style={{ transition: "fill 0.4s ease" }} />
            )}

            {/* Funfetti */}
            {sponge === "funfetti" && frostingOpacity < 1 && (
                isCircle ? (
                    <circle cx={cx} cy={cy} r={r} fill="url(#top-funfetti)" opacity={0.5} />
                ) : (
                    <path d={topShape} fill="url(#top-funfetti)" opacity={0.5} />
                )
            )}

            {/* Frosting */}
            {frostingOpacity > 0 && (
                isCircle ? (
                    <>
                        <circle cx={cx} cy={cy} r={r} fill={primaryColor} opacity={frostingOpacity}
                            style={{ transition: "fill 0.4s ease, opacity 0.4s ease" }} />
                        <circle cx={cx} cy={cy} r={r} fill="url(#top-gloss)" opacity={frostingOpacity} />
                    </>
                ) : (
                    <>
                        <path d={topShape} fill={primaryColor} opacity={frostingOpacity}
                            style={{ transition: "fill 0.4s ease, opacity 0.4s ease" }} />
                        <path d={topShape} fill="url(#top-gloss)" opacity={frostingOpacity} />
                    </>
                )
            )}

            {/* Ruffles — concentric rings */}
            {texture === "ruffles" && isCircle && [0.9, 0.72, 0.54, 0.36].map((s, i) => (
                <circle key={`tr-${i}`} cx={cx} cy={cy} r={r * s} fill="none"
                    stroke={secondaryColor} strokeWidth={2} opacity={0.4} strokeDasharray="5 3"
                    style={{ transition: "stroke 0.4s ease" }} />
            ))}

            {/* Accent color — border ring */}
            {secondaryColor !== primaryColor && frostingOpacity > 0.3 && (
                isCircle ? (
                    <circle cx={cx} cy={cy} r={r - 3} fill="none" stroke={secondaryColor}
                        strokeWidth={3} opacity={0.5} style={{ transition: "stroke 0.4s ease" }} />
                ) : (
                    <path d={topShape} fill="none" stroke={secondaryColor}
                        strokeWidth={3} opacity={0.5} transform="scale(0.94)" style={{ transformOrigin: `${cx}px ${cy}px`, transition: "stroke 0.4s ease" }} />
                )
            )}

            {/* Drip splotches */}
            {toppings.includes("drip") && [...Array(8)].map((_, i) => {
                const a = (i / 8) * Math.PI * 2;
                const dr = r - 5;
                return (
                    <circle key={`td-${i}`} cx={cx + Math.cos(a) * dr} cy={cy + Math.sin(a) * dr}
                        r={4 + (i % 3)} fill={sponge === "chocolate" || sponge === "coffee" ? "#3E2723" : "#8B4513"}
                        opacity={0.7} />
                );
            })}

            {/* Gold foil */}
            {toppings.includes("foil") && [...Array(6)].map((_, i) => {
                const a = (i / 6) * Math.PI * 2 + 0.3;
                const d = r * 0.5;
                return <rect key={`tf-${i}`} x={cx + Math.cos(a) * d - 4} y={cy + Math.sin(a) * d - 4}
                    width={8} height={8} rx={1.5} fill="url(#top-gold)" opacity={0.8}
                    transform={`rotate(${i * 40}, ${cx + Math.cos(a) * d}, ${cy + Math.sin(a) * d})`} />;
            })}

            {/* Sugar pearls */}
            {toppings.includes("pearls") && [...Array(12)].map((_, i) => {
                const a = (i / 12) * Math.PI * 2;
                const pr = r - 10;
                return <circle key={`tp-${i}`} cx={cx + Math.cos(a) * pr} cy={cy + Math.sin(a) * pr}
                    r={3} fill="#FFFDE7" stroke="#E0D5C0" strokeWidth={0.5} />;
            })}

            {/* Macarons */}
            {toppings.includes("macarons") && [
                { a: -0.8, c: "#FFB6C1" }, { a: 0.6, c: "#B8E6C8" }, { a: 2.2, c: "#C8B8E6" },
            ].map((m, i) => (
                <ellipse key={`tm-${i}`} cx={cx + Math.cos(m.a) * r * 0.45} cy={cy + Math.sin(m.a) * r * 0.45}
                    rx={12} ry={9} fill={m.c} transform={`rotate(${m.a * 30}, ${cx + Math.cos(m.a) * r * 0.45}, ${cy + Math.sin(m.a) * r * 0.45})`} />
            ))}

            {/* Flowers */}
            {toppings.includes("flowers") && [
                { a: -1.2, col: "#FFB6C1" }, { a: 0.4, col: "#DDA0DD" }, { a: 2.0, col: "#FFDAB9" },
            ].map((f, i) => {
                const fx = cx + Math.cos(f.a) * r * 0.5;
                const fy = cy + Math.sin(f.a) * r * 0.5;
                return (
                    <g key={`tfl-${i}`}>
                        {[0, 1, 2, 3, 4].map(p => {
                            const pa = (p / 5) * Math.PI * 2;
                            return <ellipse key={p} cx={fx + Math.cos(pa) * 6} cy={fy + Math.sin(pa) * 6}
                                rx={5} ry={4} fill={f.col} opacity={0.8}
                                transform={`rotate(${p * 72}, ${fx + Math.cos(pa) * 6}, ${fy + Math.sin(pa) * 6})`} />;
                        })}
                        <circle cx={fx} cy={fy} r={4} fill="#FFEAA7" />
                    </g>
                );
            })}

            {/* Photo on top */}
            {photoUrl && (
                <>
                    <defs><clipPath id="top-photo"><circle cx={cx} cy={cy} r={28} /></clipPath></defs>
                    <circle cx={cx} cy={cy} r={30} fill="#fff" opacity={0.9} />
                    <image href={photoUrl} x={cx - 28} y={cy - 28} width={56} height={56}
                        clipPath="url(#top-photo)" preserveAspectRatio="xMidYMid slice" />
                    <circle cx={cx} cy={cy} r={29} fill="none" stroke={primaryColor} strokeWidth={2} opacity={0.6} />
                </>
            )}

            {/* Custom text centered on top */}
            {message && !photoUrl && (
                <text x={cx} y={cy + 4} textAnchor="middle"
                    fontSize={message.length > 20 ? 10 : message.length > 14 ? 13 : 16}
                    fontFamily={fontFamily} fontStyle={fontStyle}
                    fontWeight={font === "block" ? 900 : 600}
                    letterSpacing={font === "block" ? 1.5 : 0}
                    fill={primaryColor === "#FFFFFF" || primaryColor === "#FFFACD" || primaryColor === "#F5DEB3" ? "#4A3728" : "#FFFFFF"}
                    style={{ transition: "fill 0.3s ease", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))" }}>
                    {message}
                </text>
            )}
            {message && photoUrl && (
                <text x={cx} y={cy + 42} textAnchor="middle"
                    fontSize={message.length > 20 ? 9 : 11}
                    fontFamily={fontFamily} fontStyle={fontStyle}
                    fontWeight={font === "block" ? 900 : 500}
                    fill={primaryColor === "#FFFFFF" || primaryColor === "#FFFACD" ? "#4A3728" : "#FFFFFF"}
                    style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))" }}>
                    {message}
                </text>
            )}

            {/* Acrylic topper stick (seen as a dot) */}
            {toppings.includes("acrylic") && (
                <>
                    <circle cx={cx} cy={cy - r * 0.35} r={3} fill="#D4AF37" opacity={0.8} />
                    <text x={cx} y={cy - r * 0.35 - 8} textAnchor="middle" fill="#D4AF37" fontSize={7}
                        fontWeight={700} fontStyle="italic" fontFamily="'Georgia', serif" opacity={0.6}>🎂</text>
                </>
            )}
        </svg>
    );
}

// ── MAIN COMPONENT WITH VIEW TOGGLE ──
export function CakePreview(props: CakePreviewProps) {
    const [view, setView] = useState<"front" | "top">("front");

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
        >
            {/* View Toggle */}
            <div style={{
                display: "flex", gap: 4, background: "#f3f4f6", borderRadius: 9999,
                padding: 3, marginBottom: 2
            }}>
                <button
                    onClick={() => setView("front")}
                    style={{
                        padding: "4px 14px", borderRadius: 9999, border: "none", cursor: "pointer",
                        fontSize: 11, fontWeight: 700, transition: "all 0.2s",
                        background: view === "front" ? "#fff" : "transparent",
                        color: view === "front" ? "#7c3aed" : "#9ca3af",
                        boxShadow: view === "front" ? "0 1px 4px rgba(0,0,0,0.1)" : "none"
                    }}
                >
                    👁️ Front
                </button>
                <button
                    onClick={() => setView("top")}
                    style={{
                        padding: "4px 14px", borderRadius: 9999, border: "none", cursor: "pointer",
                        fontSize: 11, fontWeight: 700, transition: "all 0.2s",
                        background: view === "top" ? "#fff" : "transparent",
                        color: view === "top" ? "#7c3aed" : "#9ca3af",
                        boxShadow: view === "top" ? "0 1px 4px rgba(0,0,0,0.1)" : "none"
                    }}
                >
                    🔽 Top
                </button>
            </div>

            {/* Animated view switch */}
            <div style={{ width: "100%", maxWidth: 320, position: "relative" }}>
                <AnimatePresence mode="wait">
                    {view === "front" ? (
                        <motion.div
                            key="front-view"
                            initial={{ rotateY: 90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: -90, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <CakeFrontView {...props} />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="top-view"
                            initial={{ rotateX: -90, opacity: 0 }}
                            animate={{ rotateX: 0, opacity: 1 }}
                            exit={{ rotateX: 90, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <CakeTopView {...props} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
