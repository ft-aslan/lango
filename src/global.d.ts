/// <reference types="svelte" />
/// <reference types="vite/client" />


class Language {
    didYouMean: boolean = false;
    iso: string = "";
}
class AutoCorrectionText {
    autoCorrected: boolean = false;
    value: string = "";
    didYouMean: boolean = false;
}
class Correction {
    language: Language = new Language();
    text: AutoCorrectionText = new AutoCorrectionText();
}

class Translation {
    type: string = "";
    content: TranslationContent[];
}
class Definition {
    type: string = "";
    content: DefinitionContent[];
}

class TranslationContent {
    article?: string;
    words: string[];
    meaning: string;
    rating: number;
    bar: string;
}
class DefinitionContent {
    definition: string;
    example: string;
}

interface MyWindow extends Window {
    api: any;
}

declare var window: MyWindow;