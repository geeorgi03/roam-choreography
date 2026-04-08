"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTranslation = void 0;
const expo_localization_1 = require("expo-localization");
const en_json_1 = __importDefault(require("./locales/en.json"));
const zh_json_1 = __importDefault(require("./locales/zh.json"));
const ko_json_1 = __importDefault(require("./locales/ko.json"));
const ja_json_1 = __importDefault(require("./locales/ja.json"));
const locales = {
    en: en_json_1.default,
    zh: zh_json_1.default,
    ko: ko_json_1.default,
    ja: ja_json_1.default,
};
function useTranslation() {
    const languageCode = (0, expo_localization_1.getLocales)()[0]?.languageCode;
    const resolvedLocale = typeof languageCode === 'string' && languageCode in locales ? languageCode : 'en';
    const t = (key) => {
        const localeValue = locales[resolvedLocale]?.[key];
        if (localeValue && localeValue.length > 0)
            return localeValue;
        const enValue = locales.en?.[key];
        if (enValue && enValue.length > 0)
            return enValue;
        return key;
    };
    return { t };
}
exports.useTranslation = useTranslation;
//# sourceMappingURL=index.js.map