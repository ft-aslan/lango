<script>
  import { translate } from "../API/google-translate";
  import DropdownMenu from "../Components/DropdownMenu.svelte";

  let languages = ["Turkish", "English"];

  export let word = "test";
  export let targetWords;
  let translationResult;

  let showSimilarWordsForTranslations = false;

  async function translateWords(e) {
    targetWords = e.target.value;
    translationResult = await translate(targetWords, { from: "en", to: "tr" });
    console.log(translationResult);
  }
</script>

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

  #translations-of {
    color: white;
    background-color: rgb(41, 41, 41);
  }

  .translate-result-area {
    display: grid;
    color: rgb(167, 167, 167);
    background-color: rgb(66, 66, 66);

    .translate-result-area-header {
      color: rgb(255, 221, 87);
    }

    .translate-result-line {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: 1fr;

      .translation-word-of-line {
        color: white;
      }
    }
  }
</style>

<top-bar>
  <DropdownMenu placeholder="Translate To" items={languages} />
  <button class="button is-link">
    <span class="icon is-medium">
      <i class="fas fa-exchange-alt" />
    </span>
  </button>
  <DropdownMenu
    justifySelf="right"
    placeholder="Translate From"
    items={languages} />
</top-bar>

<textarea
  bind:value={targetWords}
  on:change={translateWords}
  class="textarea has-fixed-size"
  placeholder="Translate"
  name="main-text-area"
  id="main-text-area"
  cols="30"
  rows="5" />
{#if translationResult != null}
  {#if translationResult.target != null}
    <div id="translations-of">Translations of {targetWords}</div>
  {/if}
  <div class="translate-result-area">
    <span class="translate-result-area-header" style="font-weight: bold;">
      most common
    </span>
    <span style="font-weight: bold; color:white;">
      {translationResult.translation}
    </span>
  </div>
  {#each translationResult.translations as translation}
    <div class="translate-result-area">
      <span class="translate-result-area-header">{translation.type}</span>
      {#each translation.content as line}
        <div class="translate-result-line">
          <div>
            <div class="frequency-bar" />
            <span class="translation-word-of-line">{line.word}</span>
          </div>
          {#if showSimilarWordsForTranslations}
            <div>{line.meaning.join(', ')}</div>
          {/if}
        </div>
      {/each}
    </div>
  {/each}
{/if}
