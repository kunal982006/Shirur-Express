import { useMemo, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";

export interface CakePhotoTextureProps {
    photoUrl: string | null;
    cakeRadius: number;
    cakeTopY: number;
    // Manipulation state
    imgOffset: [number, number];
    imgRotation: number;
    imgScale: number;
    onImgOffsetChange: (offset: [number, number]) => void;
    onImgRotationChange: (rot: number) => void;
    onImgScaleChange: (scale: number) => void;
}

export function CakePhotoTexture({
    photoUrl, cakeRadius, cakeTopY,
    imgOffset, imgRotation, imgScale,
}: CakePhotoTextureProps) {
    const meshRef = useRef<THREE.Mesh>(null!);

    // Load texture
    const texture = useMemo(() => {
        if (!photoUrl) return null;
        const tex = new THREE.TextureLoader().load(photoUrl);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        return tex;
    }, [photoUrl]);

    // Apply manipulation transforms to texture
    useFrame(() => {
        if (!texture) return;
        texture.offset.set(imgOffset[0], imgOffset[1]);
        texture.rotation = imgRotation;
        texture.repeat.set(1 / imgScale, 1 / imgScale);
        texture.center.set(0.5, 0.5);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
    });

    if (!photoUrl || !texture) return null;

    return (
        <mesh
            ref={meshRef}
            position={[0, cakeTopY + 0.02, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
        >
            <circleGeometry args={[cakeRadius * 0.85, 48]} />
            <meshStandardMaterial
                map={texture}
                transparent
                opacity={0.95}
                roughness={0.3}
                metalness={0}
            />
        </mesh>
    );
}

// ── UI Controls (2D overlay) ──
export function PhotoManipulationControls({
    imgOffset, imgRotation, imgScale,
    onImgOffsetChange, onImgRotationChange, onImgScaleChange,
}: {
    imgOffset: [number, number];
    imgRotation: number;
    imgScale: number;
    onImgOffsetChange: (offset: [number, number]) => void;
    onImgRotationChange: (rot: number) => void;
    onImgScaleChange: (scale: number) => void;
}) {
    return (
        <div style={{
            background: "rgba(255,255,255,0.95)", borderRadius: 12,
            padding: "10px 14px", boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
            display: "flex", flexDirection: "column", gap: 8, fontSize: 11,
        }}>
            <p style={{ fontWeight: 800, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", margin: 0 }}>
                📸 Adjust Photo
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontWeight: 700, color: "#374151", width: 50 }}>Move X</label>
                <input type="range" min={-0.5} max={0.5} step={0.01} value={imgOffset[0]}
                    onChange={e => onImgOffsetChange([parseFloat(e.target.value), imgOffset[1]])}
                    style={{ flex: 1, accentColor: "#8b5cf6" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontWeight: 700, color: "#374151", width: 50 }}>Move Y</label>
                <input type="range" min={-0.5} max={0.5} step={0.01} value={imgOffset[1]}
                    onChange={e => onImgOffsetChange([imgOffset[0], parseFloat(e.target.value)])}
                    style={{ flex: 1, accentColor: "#8b5cf6" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontWeight: 700, color: "#374151", width: 50 }}>Rotate</label>
                <input type="range" min={0} max={6.28} step={0.05} value={imgRotation}
                    onChange={e => onImgRotationChange(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: "#ec4899" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontWeight: 700, color: "#374151", width: 50 }}>Zoom</label>
                <input type="range" min={0.5} max={3} step={0.05} value={imgScale}
                    onChange={e => onImgScaleChange(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: "#22c55e" }} />
            </div>
        </div>
    );
}
