import React from 'react';
type InboxCountContextValue = {
    count: number;
    refreshCount: () => Promise<void>;
};
export declare function InboxCountProvider({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export declare function useInboxCount(): InboxCountContextValue;
export {};
//# sourceMappingURL=InboxCountContext.d.ts.map