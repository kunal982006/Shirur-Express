import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import * as THREE from "three";
import { useThree, ThreeEvent } from "@react-three/fiber";

interface DraggableToppingProps {
    id: string;
    position: [number, number, number];
    meshType: "pearl" | "macaron" | "flower" | "foil" | "drip" | "acrylic";
    color?: string;
    cakeRadius: number;
    cakeTopY: number;
    selected: boolean;
    onSelect: (id: string) => void;
    onMove: (id: string, pos: [number, number, number]) => void;
}

function DraggableTopping({
    id, position, meshType, color, cakeRadius, cakeTopY,
    selected, onSelect, onMove,
}: DraggableToppingProps) {
    const meshRef = useRef<THREE.Group>(null!);
    const { camera, gl, raycaster } = useThree();
    const [isDragging, setIsDragging] = useState(false);
    const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -cakeTopY), [cakeTopY]);

    const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onSelect(id);
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        gl.domElement.style.cursor = "grabbing";
    }, [id, onSelect, gl]);

    const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
        if (!isDragging) return;
        e.stopPropagation();

        const mouse = new THREE.Vector2(
            (e.clientX / gl.domElement.clientWidth) * 2 - 1,
            -(e.clientY / gl.domElement.clientHeight) * 2 + 1
        );
        raycaster.setFromCamera(mouse, camera);

        const intersectPoint = new THREE.Vector3();
        raycaster.ray.intersectPlane(dragPlane, intersectPoint);

        if (intersectPoint) {
            // Constrain to cake surface
            const dist = Math.sqrt(intersectPoint.x ** 2 + intersectPoint.z ** 2);
            const maxR = cakeRadius * 0.9;
            if (dist > maxR) {
                intersectPoint.x = (intersectPoint.x / dist) * maxR;
                intersectPoint.z = (intersectPoint.z / dist) * maxR;
            }
            onMove(id, [intersectPoint.x, cakeTopY + 0.05, intersectPoint.z]);
        }
    }, [isDragging, camera, gl, raycaster, dragPlane, cakeRadius, cakeTopY, id, onMove]);

    const handlePointerUp = useCallback(() => {
        setIsDragging(false);
        gl.domElement.style.cursor = "default";
    }, [gl]);

    const baseColor = color || "#FFB6C1";

    return (
        <group
            ref={meshRef}
            position={position}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            {/* Selection ring */}
            {selected && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <ringGeometry args={[0.2, 0.25, 16]} />
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
                        <meshStandardMaterial color={baseColor} roughness={0.4} />
                    </mesh>
                    <mesh position={[0, 0.03, 0]}>
                        <cylinderGeometry args={[0.1, 0.1, 0.02, 16]} />
                        <meshStandardMaterial color="#FFF8DC" roughness={0.5} />
                    </mesh>
                    <mesh position={[0, 0, 0]} castShadow>
                        <cylinderGeometry args={[0.1, 0.1, 0.04, 16]} />
                        <meshStandardMaterial color={baseColor} roughness={0.4} />
                    </mesh>
                </group>
            )}

            {meshType === "flower" && (
                <group>
                    {[0, 1, 2, 3, 4].map(i => {
                        const a = (i / 5) * Math.PI * 2;
                        return (
                            <mesh key={i} position={[Math.cos(a) * 0.07, 0.02, Math.sin(a) * 0.07]}
                                rotation={[0, a, Math.PI / 6]} castShadow>
                                <sphereGeometry args={[0.04, 8, 8]} />
                                <meshStandardMaterial color={baseColor} roughness={0.5} />
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
                <mesh rotation={[-Math.PI / 2, 0, Math.random()]} castShadow>
                    <planeGeometry args={[0.08, 0.08]} />
                    <meshStandardMaterial color="#FFD700" metalness={0.95} roughness={0.05} side={THREE.DoubleSide} />
                </mesh>
            )}

            {meshType === "acrylic" && (
                <group>
                    {/* Stick */}
                    <mesh position={[0, 0.2, 0]}>
                        <cylinderGeometry args={[0.008, 0.008, 0.4, 8]} />
                        <meshStandardMaterial color="#D4AF37" metalness={0.7} roughness={0.2} />
                    </mesh>
                    {/* Topper plate */}
                    <mesh position={[0, 0.42, 0]}>
                        <boxGeometry args={[0.5, 0.22, 0.01]} />
                        <meshStandardMaterial color="#ffffff" transparent opacity={0.3} roughness={0.1} />
                    </mesh>
                </group>
            )}
        </group>
    );
}

export interface ToppingsProps {
    toppings: string[];
    cakeRadius: number;
    cakeTopY: number;
    selectedTopping: string | null;
    onSelectTopping: (id: string | null) => void;
    toppingPositions: Record<string, [number, number, number]>;
    onToppingMove: (id: string, pos: [number, number, number]) => void;
}

export function CakeToppings3D({
    toppings, cakeRadius, cakeTopY, selectedTopping,
    onSelectTopping, toppingPositions, onToppingMove,
}: ToppingsProps) {
    // Generate individual topping items from selection
    const toppingItems = useMemo(() => {
        const items: { id: string; type: DraggableToppingProps["meshType"]; color?: string }[] = [];

        if (toppings.includes("pearls")) {
            for (let i = 0; i < 8; i++) {
                items.push({ id: `pearl-${i}`, type: "pearl" });
            }
        }
        if (toppings.includes("macarons")) {
            items.push({ id: "macaron-0", type: "macaron", color: "#FFB6C1" });
            items.push({ id: "macaron-1", type: "macaron", color: "#B8E6C8" });
            items.push({ id: "macaron-2", type: "macaron", color: "#C8B8E6" });
        }
        if (toppings.includes("flowers")) {
            items.push({ id: "flower-0", type: "flower", color: "#FFB6C1" });
            items.push({ id: "flower-1", type: "flower", color: "#DDA0DD" });
            items.push({ id: "flower-2", type: "flower", color: "#FFDAB9" });
        }
        if (toppings.includes("foil")) {
            for (let i = 0; i < 5; i++) {
                items.push({ id: `foil-${i}`, type: "foil" });
            }
        }
        if (toppings.includes("acrylic")) {
            items.push({ id: "acrylic-0", type: "acrylic" });
        }
        return items;
    }, [toppings]);

    // Default positions spread on cake top
    const defaultPositions = useMemo(() => {
        const pos: Record<string, [number, number, number]> = {};
        toppingItems.forEach((item, i) => {
            if (!toppingPositions[item.id]) {
                const angle = (i / Math.max(toppingItems.length, 1)) * Math.PI * 2;
                const dist = cakeRadius * 0.5;
                pos[item.id] = [
                    Math.cos(angle) * dist,
                    cakeTopY + 0.05,
                    Math.sin(angle) * dist,
                ];
            }
        });
        return pos;
    }, [toppingItems, cakeRadius, cakeTopY, toppingPositions]);

    return (
        <group>
            {toppingItems.map(item => (
                <DraggableTopping
                    key={item.id}
                    id={item.id}
                    meshType={item.type}
                    color={item.color}
                    position={toppingPositions[item.id] || defaultPositions[item.id] || [0, cakeTopY, 0]}
                    cakeRadius={cakeRadius}
                    cakeTopY={cakeTopY}
                    selected={selectedTopping === item.id}
                    onSelect={onSelectTopping}
                    onMove={onToppingMove}
                />
            ))}
        </group>
    );
}
