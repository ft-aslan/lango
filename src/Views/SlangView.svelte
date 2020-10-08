<script lang="ts">
  import { onMount } from "svelte";

  import { translate } from "../API/google-translate";
  import DropdownMenu from "../Components/DropdownMenu.svelte";

  import {
    findSlangDefinition,
    SlangDefinitionRes,
  } from "../API/urban-dictionary";

  onMount(async () => {
    if (targetWords) {
      await translateWords(null);
    }
  });

  let languages = ["Turkish", "English"];

  export let targetWords;
  let slangDefinitionResult: SlangDefinitionRes[];

  let showSimilarWordsForTranslations = false;

  async function translateWords(e) {
    slangDefinitionResult = await findSlangDefinition(targetWords);
    console.log(slangDefinitionResult);
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
      grid-template-columns: max-content 1fr;

      .line-count {
        display: flex;
        justify-content: center;

        width: 25px;
        height: 25px;
        border: 1px solid rgb(111, 111, 111);
        border-radius: 50%;

        margin: 10px;
      }

      .translation-word-of-line {
        color: white;
      }
    }
  }
</style>

<textarea
  bind:value={targetWords}
  on:change={translateWords}
  class="textarea has-fixed-size"
  placeholder="Translate"
  name="main-text-area"
  id="main-text-area"
  cols={30}
  rows={5} />
{#if slangDefinitionResult != null}
  <div id="translations-of">Slang definitions of {targetWords}</div>
  {#each slangDefinitionResult as definition, i}
    {#if i == 0}
      <div class="translate-result-area">
        <span class="translate-result-area-header" style="font-weight: bold;">
          most common
        </span>
        <span style="font-weight: bold; color:white;">
          {definition.definition}
        </span>
      </div>
    {:else}
      <div class="translate-result-area">
        <div class="translate-result-line">
          <div class="line-count">{i + 1}</div>
          <span class="translation-word-of-line">{definition.definition}</span>
        </div>
      </div>
    {/if}
  {/each}
{/if}
