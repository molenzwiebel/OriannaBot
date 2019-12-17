
type Language = {
    metadata: {
        name: string;
        code: string;
        ddragonLanguage: string;
    }
} & { [key: string]: string };

interface LanguageMapReference {
    languageMap: {
        variables: {
            [key: string]: { [key: string]: "" };
        };
        languages: {
            [key: string]: { [key: string]: string };
        };
    };
}

interface LanguageError {
    key: string;
    message: string;
}

export function buildVariableMap(filename: string, language: Language): LanguageMapReference;
export function verifyAndRegisterLanguage(reference: LanguageMapReference, filename: string, language: Language): LanguageError[];