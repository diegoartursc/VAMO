/**
 * VamoLogo — marca oficial da VAMO (avião + texto).
 *
 * Asset oficial:
 *   apps/site/public/images/logo_transparent.png  (PNG branco transparente)
 *
 * Sem fundo próprio — exibe direto sobre qualquer superfície.
 * Para fundos claros, use variant="dark" (aplica filtro CSS).
 */

import React from 'react';

type Size = 'sm' | 'md' | 'lg';
type Variant = 'white' | 'dark';

interface VamoLogoProps {
    size?: Size | number;
    variant?: Variant;
    className?: string;
    style?: React.CSSProperties;
}

const SIZE_WIDTHS: Record<Size, number> = {
    sm: 100,
    md: 160,
    lg: 200,
};

export default function VamoLogo({
    size = 'md',
    variant = 'white',
    className,
    style,
}: VamoLogoProps) {
    const width = typeof size === 'number' ? size : SIZE_WIDTHS[size];
    return (
        <img
            src="/images/logo_transparent.png"
            alt="VAMO"
            className={className}
            style={{
                width,
                height: 'auto',
                objectFit: 'contain',
                filter: variant === 'dark' ? 'brightness(0.18)' : undefined,
                ...style,
            }}
        />
    );
}
