<script lang="ts">
  import { onMount } from "svelte";

  import { translate, GoogleTranslationRes } from "../API/google-translate";
  import DropdownMenu from "../Components/DropdownMenu.svelte";

  export let targetWords;

  onMount(async () => {
    if (targetWords) {
      await defineWords(null);
    }
  });

  let definitionResult : GoogleTranslationRes;

  async function defineWords(e) {
    let result = await translate(targetWords, { from: "en", to: "tr" }, true);
    
    if (result) {
      if (result.hasOwnProperty("definitions")) {
        definitionResult = result;
      }
    }
    console.log(definitionResult);
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
  }
  #definitions-of {
    color: white;
    background-color: rgb(41, 41, 41);
  }

  .definition-result-area {
    display: grid;
    row-gap: 10px;
    color: rgb(167, 167, 167);
    background-color: rgb(66, 66, 66);

    padding-bottom: 10px;

    .definition-result-area-header {
      color: rgb(255, 221, 87);
    }

    .definition-result-line {
      display: grid;
      grid-auto-flow: column;
      grid-template-columns: max-content 1fr;

      column-gap: 10px;

      .line-count {
        display: flex;
        justify-content: center;

        width: 25px;
        height: 25px;
        border: 1px solid rgb(111, 111, 111);
        border-radius: 100%;
      }

      .definition-word-of-line {
        padding: 10px;
        background-color: rgb(84, 84, 84);
        border-radius: 10px;
        color: white;
      }
    }
  }
</style>

<top-bar />

<textarea
  bind:value={targetWords}
  on:input={defineWords}
  class="textarea has-fixed-size"
  placeholder="Write a word"
  name="main-text-area"
  id="main-text-area"
  cols= {30}
  rows= {5} />
{#if definitionResult != null}
  <div id="definition-of">Definitions of {targetWords}</div>

  {#each definitionResult.definitions as definition}
    <div class="definition-result-area">
      <span class="definition-result-area-header">{definition.type}</span>
      {#each definition.content as line, i}
        <div class="definition-result-line">
          <div class="line-count">{i + 1}</div>
          <span class="definition-word-of-line">{line.phrase}</span>
        </div>
      {/each}
    </div>
  {/each}
{/if}
