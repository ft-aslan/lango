import { writable } from "svelte/store";

import { GoogleTranslationRes } from "../API/google-translate";

export const targetWords = writable("");

export const currentTranslation = writable<GoogleTranslationRes | undefined>(undefined);

export const currentTab = writable("");

export const wordbook = createWordbook();

type Word = { text: string; numberOfUsage: number, creationDate: Date };

function createWordbook() {
    (window as any).api.receive("request-wordbook-json", (wordbook : Word[]) => {
        set(wordbook);
    });

    (window as any).api.send("request-wordbook-json");

    const { subscribe, set, update } = writable<Word[]>([]);

    const updateWordbookDB = (wordbook: Word[]) => {
        (window as any).api.send("set-wordbook-json", wordbook);
    };

    return {
        subscribe,
        addNewWord: (newWord: Word) => {
            update((n) => {
                n.push(newWord);
                updateWordbookDB(n);
                return n;
            });
        },
        removeWord: (targetWordText: string) => {
            update((n) => {
                n = n.filter((w) => w.text != targetWordText);
                updateWordbookDB(n);
                return n;
            });
        },
        increaseUsage: (target: Word) => {
            update((n) => {
                n.find((w) => w.text == target.text).numberOfUsage++;
                updateWordbookDB(n);
                return n;
            });
        },
    };
}
