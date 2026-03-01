import { useRef, useMemo, useState, useCallback, Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

// ── Color Maps ──
const SPONGE_COLORS: Record<string, string> = {
    vanilla: "#FFF3D4", chocolate: "#5D3A1A", redvelvet: "#9B1B30",
    funfetti: "#F3E0F5", coffee: "#6F4E37",
};

const WEIGHT_HEIGHTS: Record<string, number> = {
    "0.5kg": 0.35, "1kg": 0.5, "2kg": 0.7, custom: 0.9,
};

// ── Props ──
export interface CakeViewport3DProps {
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

// ── Cake Body ──
function CakeBody({
    shape, sponge, primaryColor, secondaryColor, frostingMat, texture, cakeHeight,
}: {
    shape: string; sponge: string; primaryColor: string; secondaryColor: string;
    frostingMat: string; texture: string; cakeHeight: number;
}) {
    const spongeColor = SPONGE_COLORS[sponge] || "#FFF3D4";
    const cakeRadius = shape === "tall" ? 0.4 : 0.65;

    const frostingOpacity = useMemo(() => {
        switch (texture) {
            case "naked": return 0;
            case "semi": return 0.4;
            case "rustic": return 0.75;
            case "ruffles": return 0.88;
            default: return 1;
        }
    }, [texture]);

    const frostingRoughness = frostingMat === "fondant" ? 0.15 : frostingMat === "buttercream" ? 0.4 : 0.6;

    // Shape geometry
    const cakeGeometry = useMemo(() => {
        if (shape === "square") {
            return new THREE.BoxGeometry(cakeRadius * 2, cakeHeight, cakeRadius * 2);
        }
        if (shape === "heart") {
            const heartShape = new THREE.Shape();
            const s = cakeRadius * 0.85;
            heartShape.moveTo(0, s * 0.4);
            heartShape.bezierCurveTo(0, s * 0.7, -s, s * 0.7, -s, s * 0.3);
            heartShape.bezierCurveTo(-s, -s * 0.3, 0, -s * 0.5, 0, -s * 0.8);
            heartShape.bezierCurveTo(0, -s * 0.5, s, -s * 0.3, s, s * 0.3);
            heartShape.bezierCurveTo(s, s * 0.7, 0, s * 0.7, 0, s * 0.4);
            const geo = new THREE.ExtrudeGeometry(heartShape, {
                depth: cakeHeight, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 3,
            });
            geo.rotateX(-Math.PI / 2);
            geo.translate(0, cakeHeight / 2, 0);
            return geo;
        }
        return new THREE.CylinderGeometry(cakeRadius, cakeRadius, cakeHeight, 48, 1);
    }, [shape, cakeRadius, cakeHeight]);

    return (
        <group position={[0, cakeHeight / 2, 0]}>
            {/* Sponge */}
            <mesh geometry={cakeGeometry} castShadow receiveShadow>
                <meshStandardMaterial color={spongeColor} roughness={0.7} />
            </mesh>

            {/* Frosting */}
            {frostingOpacity > 0 && (
                <mesh geometry={cakeGeometry} castShadow>
                    <meshStandardMaterial
                        color={primaryColor}
                        roughness={frostingRoughness}
                        transparent opacity={frostingOpacity}
                    />
                </mesh>
            )}

            {/* Accent ring */}
            {secondaryColor !== primaryColor && frostingOpacity > 0.3 && (
                <mesh position={[0, -cakeHeight / 2 + 0.03, 0]}>
                    <torusGeometry args={[cakeRadius + 0.01, 0.015, 8, 48]} />
                    <meshStandardMaterial color={secondaryColor} roughness={0.3} />
                </mesh>
            )}

            {/* Ruffles */}
            {texture === "ruffles" && [0, 1, 2, 3].map(i => (
                <mesh key={i} position={[0, -cakeHeight / 2 + (cakeHeight / 4) * i + cakeHeight / 8, 0]}>
                    <torusGeometry args={[cakeRadius + 0.005, 0.01, 6, 48]} />
                    <meshStandardMaterial color={secondaryColor} roughness={0.4} transparent opacity={0.6} />
                </mesh>
            ))}
        </group>
    );
}

// ── Plate ──
function CakePlate({ radius }: { radius: number }) {
    return (
        <group position={[0, -0.02, 0]}>
            <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[radius + 0.15, 48]} />
                <meshStandardMaterial color="#F5F0EB" roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[radius + 0.1, radius + 0.15, 48]} />
                <meshStandardMaterial color="#E8E0D8" roughness={0.35} />
            </mesh>
        </group>
    );
}

// ── Individual draggable topping ──
function DraggableTopping({
    position, meshType, color, selected,
    onPointerDown,
}: {
    position: [number, number, number];
    meshType: string; color: string;
    selected: boolean;
    onPointerDown: (e: any) => void;
}) {
    return (
        <group position={position} onPointerDown={onPointerDown}>
            {selected && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <ringGeometry args={[0.18, 0.22, 16]} />
                    <meshBasicMaterial color="#fbbf24" transparent opacity={0.7} />
                </mesh>
            )}
            {meshType === "pearl" && (
                <mesh castShadow>
                    <sphereGeometry args={[0.05, 12, 12]} />
                    <meshStandardMaterial color="#FFFDE7" metalness={0.6} roughness={0.15} />
                </mesh>
            )}
            {meshType === "macaron" && (
                <group>
                    <mesh position={[0, 0.06, 0]} castShadow>
                        <cylinderGeometry args={[0.1, 0.1, 0.04, 16]} />
                        <meshStandardMaterial color={color} roughness={0.4} />
                    </mesh>
                    <mesh position={[0, 0.03, 0]}>
                        <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
                        <meshStandardMaterial color="#FFF8DC" roughness={0.5} />
                    </mesh>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.1, 0.1, 0.04, 16]} />
                        <meshStandardMaterial color={color} roughness={0.4} />
                    </mesh>
                </group>
            )}
            {meshType === "flower" && (
                <group>
                    {[0, 1, 2, 3, 4].map(i => {
                        const a = (i / 5) * Math.PI * 2;
                        return (
                            <mesh key={i} position={[Math.cos(a) * 0.07, 0.02, Math.sin(a) * 0.07]} castShadow>
                                <sphereGeometry args={[0.04, 8, 8]} />
                                <meshStandardMaterial color={color} roughness={0.5} />
                            </mesh>
                        );
                    })}
                    <mesh position={[0, 0.03, 0]}>
                        <sphereGeometry args={[0.025, 8, 8]} />
                        <meshStandardMaterial color="#FFEAA7" roughness={0.3} />
                    </mesh>
                </group>
            )}
            {meshType === "foil" && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} castShadow>
                    <planeGeometry args={[0.08, 0.08]} />
                    <meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.05} side={THREE.DoubleSide} />
                </mesh>
            )}
            {meshType === "acrylic" && (
                <group>
                    <mesh position={[0, 0.2, 0]}>
                        <cylinderGeometry args={[0.008, 0.008, 0.4, 8]} />
                        <meshStandardMaterial color="#D4AF37" metalness={0.7} roughness={0.2} />
                    </mesh>
                    <mesh position={[0, 0.42, 0]}>
                        <boxGeometry args={[0.5, 0.22, 0.01]} />
                        <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
                    </mesh>
                </group>
            )}
        </group>
    );
}

// ── Photo texture on cake top ──
function PhotoOnTop({
    photoUrl, cakeRadius, cakeTopY,
    imgOffset, imgRotation, imgScale,
}: {
    photoUrl: string | null;
    cakeRadius: number;
    cakeTopY: number;
    imgOffset: [number, number];
    imgRotation: number;
    imgScale: number;
}) {
    const texture = useMemo(() => {
        if (!photoUrl) return null;
        const tex = new THREE.TextureLoader().load(photoUrl);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }, [photoUrl]);

    if (!texture) return null;

    // Apply transforms
    texture.offset.set(imgOffset[0], imgOffset[1]);
    texture.rotation = imgRotation;
    texture.repeat.set(1 / imgScale, 1 / imgScale);
    texture.center.set(0.5, 0.5);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    return (
        <mesh position={[0, cakeTopY + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[cakeRadius * 0.85, 48]} />
            <meshStandardMaterial map={texture} transparent opacity={0.95} roughness={0.3} />
        </mesh>
    );
}

// ── Cake Scene ──
function CakeScene(props: CakeViewport3DProps & {
    selectedTopping: string | null;
    onSelectTopping: (id: string | null) => void;
    toppingPositions: Record<string, [number, number, number]>;
    onToppingMove: (id: string, pos: [number, number, number]) => void;
    imgOffset: [number, number]; imgRotation: number; imgScale: number;
}) {
    const cakeHeight = WEIGHT_HEIGHTS[props.weight] || 0.5;
    const cakeRadius = props.shape === "tall" ? 0.4 : 0.65;
    const cakeTopY = cakeHeight;
    const { camera, gl, raycaster } = useThree();

    // Generate topping items
    const toppingItems = useMemo(() => {
        const items: { id: string; type: string; color: string }[] = [];
        if (props.toppings.includes("pearls")) {
            for (let i = 0; i < 8; i++) items.push({ id: `pearl-${i}`, type: "pearl", color: "#FFFDE7" });
        }
        if (props.toppings.includes("macarons")) {
            items.push({ id: "mac-0", type: "macaron", color: "#FFB6C1" });
            items.push({ id: "mac-1", type: "macaron", color: "#B8E6C8" });
            items.push({ id: "mac-2", type: "macaron", color: "#C8B8E6" });
        }
        if (props.toppings.includes("flowers")) {
            items.push({ id: "flower-0", type: "flower", color: "#FFB6C1" });
            items.push({ id: "flower-1", type: "flower", color: "#DDA0DD" });
            items.push({ id: "flower-2", type: "flower", color: "#FFDAB9" });
        }
        if (props.toppings.includes("foil")) {
            for (let i = 0; i < 5; i++) items.push({ id: `foil-${i}`, type: "foil", color: "#FFD700" });
        }
        if (props.toppings.includes("acrylic")) {
            items.push({ id: "acrylic-0", type: "acrylic", color: "#D4AF37" });
        }
        return items;
    }, [props.toppings]);

    // Default positions
    const getPos = useCallback((id: string, idx: number): [number, number, number] => {
        if (props.toppingPositions[id]) return props.toppingPositions[id];
        const angle = (idx / Math.max(toppingItems.length, 1)) * Math.PI * 2;
        const dist = cakeRadius * 0.5;
        return [Math.cos(angle) * dist, cakeTopY + 0.05, Math.sin(angle) * dist];
    }, [props.toppingPositions, toppingItems.length, cakeRadius, cakeTopY]);

    // Text color
    const textColor = props.primaryColor === "#FFFFFF" || props.primaryColor === "#FFFACD" || props.primaryColor === "#F5DEB3"
        ? "#4A3728" : "#FFFFFF";
    const fontSize = props.message.length > 20 ? 0.06 : props.message.length > 14 ? 0.08 : 0.1;

    // Drag handler
    const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -cakeTopY), [cakeTopY]);
    const dragId = useRef<string | null>(null);

    const handlePointerDown = useCallback((id: string, e: any) => {
        e.stopPropagation();
        props.onSelectTopping(id);
        dragId.current = id;
    }, [props.onSelectTopping]);

    const handlePointerMove = useCallback((e: any) => {
        if (!dragId.current || !camera || !raycaster) return;
        const rect = gl.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        raycaster.setFromCamera(mouse, camera);
        const pt = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(dragPlane, pt)) {
            const dist = Math.sqrt(pt.x ** 2 + pt.z ** 2);
            const maxR = cakeRadius * 0.9;
            if (dist > maxR) { pt.x = (pt.x / dist) * maxR; pt.z = (pt.z / dist) * maxR; }
            props.onToppingMove(dragId.current, [pt.x, cakeTopY + 0.05, pt.z]);
        }
    }, [camera, gl, raycaster, dragPlane, cakeRadius, cakeTopY, props.onToppingMove]);

    const handlePointerUp = useCallback(() => { dragId.current = null; }, []);

    return (
        <group onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[3, 5, 3]} intensity={1.2} castShadow />
            <pointLight position={[-2, 3, -2]} intensity={0.4} color="#ffe4e6" />
            <pointLight position={[2, 1, 2]} intensity={0.3} color="#dbeafe" />

            {/* Controls */}
            <OrbitControls
                makeDefault
                enablePan={false}
                minDistance={1.2}
                maxDistance={4}
                minPolarAngle={0.2}
                maxPolarAngle={Math.PI / 2 - 0.05}
                target={[0, cakeHeight / 2, 0]}
            />

            {/* Plate */}
            <CakePlate radius={cakeRadius} />

            {/* Cake body */}
            <CakeBody
                shape={props.shape} sponge={props.sponge}
                primaryColor={props.primaryColor} secondaryColor={props.secondaryColor}
                frostingMat={props.frostingMat} texture={props.texture}
                cakeHeight={cakeHeight}
            />

            {/* Photo on top */}
            {props.photoUrl && (
                <PhotoOnTop
                    photoUrl={props.photoUrl}
                    cakeRadius={cakeRadius} cakeTopY={cakeTopY}
                    imgOffset={props.imgOffset} imgRotation={props.imgRotation} imgScale={props.imgScale}
                />
            )}

            {/* 3D Text */}
            {props.message && !props.photoUrl && (
                <group>
                    <Text
                        position={[0, cakeTopY - cakeHeight / 2, cakeRadius + 0.01]}
                        fontSize={fontSize}
                        color={textColor}
                        anchorX="center" anchorY="middle"
                        maxWidth={cakeRadius * 1.6}
                        outlineWidth={0.003}
                        outlineColor="rgba(0,0,0,0.3)"
                    >
                        {props.message}
                    </Text>
                    <Text
                        position={[0, cakeTopY + 0.03, 0]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        fontSize={fontSize * 0.9}
                        color={textColor}
                        anchorX="center" anchorY="middle"
                        maxWidth={cakeRadius * 1.4}
                        outlineWidth={0.002}
                        outlineColor="rgba(0,0,0,0.2)"
                    >
                        {props.message}
                    </Text>
                </group>
            )}

            {/* Toppings */}
            {toppingItems.map((item, idx) => (
                <DraggableTopping
                    key={item.id}
                    position={getPos(item.id, idx)}
                    meshType={item.type}
                    color={item.color}
                    selected={props.selectedTopping === item.id}
                    onPointerDown={(e: any) => handlePointerDown(item.id, e)}
                />
            ))}

            {/* Ground plane for shadows */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.03, 0]} receiveShadow>
                <planeGeometry args={[4, 4]} />
                <shadowMaterial transparent opacity={0.15} />
            </mesh>
        </group>
    );
}

// ── Main Component ──
export function CakeViewport3D(props: CakeViewport3DProps) {
    const [selectedTopping, setSelectedTopping] = useState<string | null>(null);
    const [toppingPositions, setToppingPositions] = useState<Record<string, [number, number, number]>>({});
    const [imgOffset, setImgOffset] = useState<[number, number]>([0, 0]);
    const [imgRotation, setImgRotation] = useState(0);
    const [imgScale, setImgScale] = useState(1);

    const handleToppingMove = useCallback((id: string, pos: [number, number, number]) => {
        setToppingPositions(prev => ({ ...prev, [id]: pos }));
    }, []);

    return (
        <div style={{ width: "100%", height: "100%", position: "relative", minHeight: 200 }}>
            <Canvas
                shadows
                camera={{ position: [1.5, 1.5, 1.5], fov: 40 }}
                style={{ width: "100%", height: "100%", borderRadius: 12 }}
                onPointerMissed={() => setSelectedTopping(null)}
            >
                <Suspense fallback={null}>
                    <CakeScene
                        {...props}
                        selectedTopping={selectedTopping}
                        onSelectTopping={setSelectedTopping}
                        toppingPositions={toppingPositions}
                        onToppingMove={handleToppingMove}
                        imgOffset={imgOffset}
                        imgRotation={imgRotation}
                        imgScale={imgScale}
                    />
                </Suspense>
            </Canvas>

            {/* HUD overlays */}
            <div style={{
                position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.6)", color: "#fff", padding: "4px 12px",
                borderRadius: 9999, fontSize: 10, fontWeight: 700, pointerEvents: "none",
            }}>
                🖱️ Drag to rotate · Scroll to zoom
            </div>

            {props.toppings.length > 0 && (
                <div style={{
                    position: "absolute", top: 8, right: 8,
                    background: "rgba(124,58,237,0.9)", color: "#fff", padding: "4px 10px",
                    borderRadius: 8, fontSize: 9, fontWeight: 700,
                }}>
                    ✨ Click + drag toppings
                </div>
            )}

            {/* Photo manipulation controls */}
            {props.photoUrl && (
                <div style={{ position: "absolute", top: 8, left: 8, zIndex: 10 }}>
                    <div style={{
                        background: "rgba(255,255,255,0.95)", borderRadius: 12,
                        padding: "10px 14px", boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
                        display: "flex", flexDirection: "column", gap: 8, fontSize: 11,
                    }}>
                        <p style={{ fontWeight: 800, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", margin: 0 }}>
                            📸 Adjust Photo
                        </p>
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 700, color: "#374151", width: 45, fontSize: 10 }}>X</span>
                            <input type="range" min={-0.5} max={0.5} step={0.01} value={imgOffset[0]}
                                onChange={e => setImgOffset([parseFloat(e.target.value), imgOffset[1]])}
                                style={{ flex: 1, accentColor: "#8b5cf6" }} />
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 700, color: "#374151", width: 45, fontSize: 10 }}>Y</span>
                            <input type="range" min={-0.5} max={0.5} step={0.01} value={imgOffset[1]}
                                onChange={e => setImgOffset([imgOffset[0], parseFloat(e.target.value)])}
                                style={{ flex: 1, accentColor: "#8b5cf6" }} />
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 700, color: "#374151", width: 45, fontSize: 10 }}>Rot</span>
                            <input type="range" min={0} max={6.28} step={0.05} value={imgRotation}
                                onChange={e => setImgRotation(parseFloat(e.target.value))}
                                style={{ flex: 1, accentColor: "#ec4899" }} />
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 700, color: "#374151", width: 45, fontSize: 10 }}>Zoom</span>
                            <input type="range" min={0.5} max={3} step={0.05} value={imgScale}
                                onChange={e => setImgScale(parseFloat(e.target.value))}
                                style={{ flex: 1, accentColor: "#22c55e" }} />
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}
