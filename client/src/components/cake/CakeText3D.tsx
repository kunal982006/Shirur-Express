import { useMemo } from "react";
import { Text } from "@react-three/drei";

export interface CakeText3DProps {
    message: string;
    font: string;
    primaryColor: string;
    cakeRadius: number;
    cakeTopY: number;
    cakeHeight: number;
}

export function CakeText3D({
    message, font, primaryColor, cakeRadius, cakeTopY, cakeHeight,
}: CakeText3DProps) {
    if (!message) return null;

    const fontFamily = useMemo(() => {
        switch (font) {
            case "cursive": return undefined; // drei Text default
            case "block": return undefined;
            case "messy": return undefined;
            default: return undefined;
        }
    }, [font]);

    const fontWeight = font === "block" ? "bold" : "normal";
    const fontStyle = font === "cursive" ? "italic" : "normal";

    // Text color — contrast against frosting
    const textColor = useMemo(() => {
        if (primaryColor === "#FFFFFF" || primaryColor === "#FFFACD" || primaryColor === "#F5DEB3" || primaryColor === "#98FB98") {
            return "#4A3728";
        }
        return "#FFFFFF";
    }, [primaryColor]);

    // Adaptive font size
    const fontSize = message.length > 20 ? 0.06 : message.length > 14 ? 0.08 : 0.1;

    // Calculate position on the cake front face
    const midY = cakeTopY - cakeHeight / 2;

    return (
        <group>
            {/* Text on the front face of the cake */}
            <Text
                position={[0, midY, cakeRadius + 0.01]}
                fontSize={fontSize}
                color={textColor}
                anchorX="center"
                anchorY="middle"
                maxWidth={cakeRadius * 1.6}
                fontWeight={fontWeight}
                fontStyle={fontStyle}
                outlineWidth={0.003}
                outlineColor="rgba(0,0,0,0.3)"
                castShadow
            >
                {message}
            </Text>

            {/* Text on the top surface (slightly above) */}
            <Text
                position={[0, cakeTopY + 0.03, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={fontSize * 0.9}
                color={textColor}
                anchorX="center"
                anchorY="middle"
                maxWidth={cakeRadius * 1.4}
                fontWeight={fontWeight}
                fontStyle={fontStyle}
                outlineWidth={0.002}
                outlineColor="rgba(0,0,0,0.2)"
            >
                {message}
            </Text>
        </group>
    );
}
