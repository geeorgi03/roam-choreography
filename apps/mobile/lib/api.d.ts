/** Current API base URL. Changes when setApiBaseOverride is called. */
export declare let API_BASE: string;
/** Override the API URL at runtime (persisted in MMKV). Pass null to clear. */
export declare function setApiBaseOverride(url: string | null): void;
/** Get the current override (null if using default). */
export declare function getApiBaseOverride(): string | null;
//# sourceMappingURL=api.d.ts.map