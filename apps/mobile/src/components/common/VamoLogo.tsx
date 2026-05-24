/**
 * VamoLogo — marca oficial da VAMO (avião + texto).
 *
 * Asset oficial:
 *   apps/mobile/assets/images/logo_transparent.png  (PNG branco transparente)
 *
 * Sem fundo próprio — exibe direto sobre qualquer superfície.
 */

import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

type Size = 'sm' | 'md' | 'lg';

interface VamoLogoProps {
    size?: Size | number;
    style?: StyleProp<ImageStyle>;
}

const SIZE_WIDTHS: Record<Size, number> = {
    sm: 100,
    md: 160,
    lg: 200,
};

export default function VamoLogo({ size = 'md', style }: VamoLogoProps) {
    const width = typeof size === 'number' ? size : SIZE_WIDTHS[size];
    return (
        <Image
            source={require('../../../assets/images/logo_transparent.png')}
            style={[{ width, height: width * 0.32 }, style]}
            resizeMode="contain"
            accessibilityLabel="VAMO"
        />
    );
}
