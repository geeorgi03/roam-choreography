export declare function useClipShare(clipId: string | null): {
    shareUrl: string | null;
    share: () => Promise<string | null>;
    revoke: () => Promise<boolean>;
    isShared: boolean;
    loading: boolean;
    error: string | null;
};
//# sourceMappingURL=useClipShare.d.ts.map