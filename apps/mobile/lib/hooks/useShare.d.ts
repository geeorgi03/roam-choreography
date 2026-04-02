export declare function useShare(sessionId: string): {
    shareUrl: string | null;
    share: () => Promise<string | null>;
    revoke: () => Promise<boolean>;
    isShared: boolean;
    loading: boolean;
    error: string | null;
};
//# sourceMappingURL=useShare.d.ts.map