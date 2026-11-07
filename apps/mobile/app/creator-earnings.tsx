import React, { useState } from 'react';
import EarningsScreen from '../src/features/creator/earnings/EarningsScreen';
import { nativeReturnUrlFromWeb } from '../src/utils/nativeAppReturn';
import { ReturnToAppScreen } from '../src/components/common/ReturnToAppScreen';

export default function CreatorEarningsRoute() {
    // Cadastro de recebimentos começou no app Android/iOS: o site só devolve a
    // pessoa para o app (ver utils/nativeAppReturn).
    const [appUrl] = useState(nativeReturnUrlFromWeb);
    if (appUrl) return <ReturnToAppScreen appUrl={appUrl} />;
    return <EarningsScreen />;
}
