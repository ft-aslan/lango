import { writable } from "svelte/store";

import { GoogleTranslationRes } from "../API/google-translate";

export const targetWords = writable("");

export const currentTranslation = writable<GoogleTranslationRes | undefined>(undefined);

export const currentTab = writable("");
