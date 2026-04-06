interface OEmbedMetadata {
    title: string;
    thumbnail_url: string | null;
}
interface PendingShare {
    url: string;
    meta: OEmbedMetadata;
}
export declare function useShareIntent(): {
    pendingShareUrl: string | null;
    pendingShareMeta: OEmbedMetadata | null;
    clearPendingShare: () => void;
    getPendingShare: () => PendingShare | null;
    createRefClip: (sessionId: string, url: string, meta: OEmbedMetadata) => Promise<any>;
};
export {};
//# sourceMappingURL=useShareIntent.d.ts.map