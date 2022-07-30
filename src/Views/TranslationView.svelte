<script lang="ts">
    import { onMount, onDestroy } from "svelte";

    import { langs } from "../API/languages";

    import { targetWords, currentTab, currentTranslation, wordbook } from "../Stores/stores";

    import { translate } from "../API/google-translate";
    import DropdownMenu from "../Components/DropdownMenu.svelte";
    import DefinitionView from "./DefinitionView.svelte";
    import LoadingSpinner from "../Components/LoadingSpinner.svelte";

    let translationFrom = { code: "en", language: "English" };
    let translationTo = { code: "tr", language: "Turkish" };

    let isFetching: boolean;

    onDestroy(async () => {
        unsubscribeTargetWords();
    });

    const unsubscribeTargetWords = targetWords.subscribe((value) => {
        translateWords();
    });

    let showSimilarWordsForTranslations = false;

    async function translateWords(e?: Event) {
        let value = e ? (e.target as HTMLInputElement).value : $targetWords;
        if (value != null && value.trim() != "") {
            isFetching = true;
            let result = await translate(value.trim(), {
                from: translationFrom.code,
                to: translationTo.code,
            });
            isFetching = false;

            let foundWord = $wordbook.find((w) => w.text == value);
            if (foundWord) {
                wordbook.increaseUsage(foundWord);
            }

            if (result) {
                if (result.hasOwnProperty("translations") || result.hasOwnProperty("translation")) {
                    $currentTranslation = result;
                }
            }
        } else {
        }
    }
</script>

<top-bar>
    <DropdownMenu
        allLanguages={langs}
        selectedLanguage={translationFrom}
        on:langChange={(e) => {
            translationFrom = e.detail.selectedLanguage;
            translateWords();
        }}
    />
    <button
        class="button is-link"
        class:is-invisible={$currentTab == "definition"}
        on:click={() => {
            let holder = translationTo;
            translationTo = translationFrom;
            translationFrom = holder;
            translateWords();
        }}
    >
        <span class="icon is-medium"><i class="fas fa-exchange-alt" /></span>
    </button>
    <DropdownMenu
        isInvisible={$currentTab == "definition"}
        justifySelfRight={true}
        allLanguages={langs}
        selectedLanguage={translationTo}
        on:langChange={(e) => {
            translationTo = e.detail.selectedLanguage;
            translateWords();
        }}
    />
</top-bar>

<textarea
    bind:value={$targetWords}
    on:change={translateWords}
    class="textarea has-fixed-size"
    placeholder="Translate"
    name="main-text-area"
    id="main-text-area"
    cols={30}
    rows={5}
/>
{#if $currentTab == "translation"}
    {#if $targetWords != ""}
        <div class="translation-header">
            <div class="text">
                Translations of {$targetWords}
            </div>
            <button
                class="button is-dark"
                style="margin-left: auto; margin-right: 10px;"
                on:click={() => {
                    let foundWord = $wordbook.find((w) => w.text == $targetWords);
                    if (!foundWord) {
                        wordbook.addNewWord({ text: $targetWords, numberOfUsage: 1, creationDate: new Date() });
                    }
                }}
            >
                <span class="icon is-medium">
                    <i class="fas fa-plus" />
                </span>
            </button>
        </div>
    {/if}
    {#if $currentTranslation != null}
        <div class="translate-result-area">
            <span class="translate-result-area-header" style="font-weight: bold;">most common</span>
            <span style="font-weight: bold; color:white;">
                {$currentTranslation.translation}
            </span>
        </div>
        {#if isFetching}
            <LoadingSpinner />
        {:else if $currentTranslation.translations}
            {#each $currentTranslation.translations as translation}
                <div class="translate-result-area">
                    <span class="translate-result-area-header">{translation.type}</span>
                    {#each translation.content as line}
                        <div class="translate-result-line">
                            <div>
                                <div class="frequency-bar" />
                                <span class="translation-word-of-line">{line.meaning}</span>
                            </div>
                            {#if showSimilarWordsForTranslations}
                                <div>{line.words.join(", ")}</div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/each}
        {/if}
    {/if}
{:else if $currentTab == "definition"}
    {#if $currentTranslation != null && $currentTranslation.definitions && $currentTranslation.definitions.length}
        <DefinitionView />
    {/if}
{/if}

<style lang="scss">
    textarea {
        color: white;
        background-color: rgb(51, 51, 51);
        border: none;

        &::placeholder {
            color: rgb(167, 167, 167);
        }
    }

    top-bar {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: 1fr;
        button {
            justify-self: center;
            width: max-content;
        }
    }

    .translate-from {
        justify-self: right;
    }

    .translation-header {
        color: white;
        padding: 5px;
        background-color: rgb(41, 41, 41);
        border-radius: 5px;

        display: flex;
    }

    .translate-result-area {
        display: grid;
        row-gap: 5px;
        grid-template-columns: max-content;
        color: rgb(167, 167, 167);
        background-color: rgb(66, 66, 66);

        padding-bottom: 6px;

        padding: 5px;
        border-radius: 5px;

        .translate-result-area-header {
            color: rgb(255, 221, 87);
        }

        .translate-result-line {
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: 1fr;

            padding: 3px;

            .translation-word-of-line {
                color: white;
            }
        }
    }
</style>
