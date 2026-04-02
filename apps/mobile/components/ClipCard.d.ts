import React from 'react';
import type { ClipRow } from '../lib/database';
export interface ClipCardProps {
    clip: ClipRow;
    onPress: () => void;
    onLongPress: () => void;
    onRetry?: () => void;
    commentCount?: number;
}
export declare function ClipCard({ clip, onPress, onLongPress, onRetry, commentCount }: ClipCardProps): React.JSX.Element;
//# sourceMappingURL=ClipCard.d.ts.map