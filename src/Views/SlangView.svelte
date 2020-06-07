<script>
  import { onMount } from "svelte";
  import { findSlangDefinition } from "../API/urban-dictionary.js";
  import moment from "moment";

  export let targetWords;
  let slangResult;

  onMount(async () => {
    if (targetWords) {
      await findSlangDefinitionOfWords();
    }
  });

  async function findSlangDefinitionOfWords(e) {
    if (targetWords != "") {
      slangResult = await findSlangDefinition(targetWords);
      console.log(slangResult);
    }
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

  #slang-of {
    color: white;
    padding: 5px;
    background-color: rgb(41, 41, 41);
  }

  .slang-result-area {
    display: grid;
    color: rgb(167, 167, 167);
    background-color: rgb(66, 66, 66);

    .slang-result-container {
      display: grid;

      .slang-result-target-word {
        color: rgb(255, 221, 87);
      }

      .slang-result-content {
        display: grid;

        font-size: small;

        .slang-result-definition {
          color: white;
        }
        .slang-result-example {
          color: white;
          font-style: italic;
        }
        .slang-votes {
          display: flex;
          .slang-vote {
            padding: 10px;
          }
        }
      }
    }
  }
</style>

<textarea
  bind:value={targetWords}
  on:input={findSlangDefinitionOfWords}
  class="textarea has-fixed-size"
  placeholder="Translate"
  name="main-text-area"
  id="main-text-area"
  cols="30"
  rows="5" />
{#if slangResult != null}
  <div id="slang-of">Slang result of {targetWords}</div>
  {#each slangResult as slang}
    <div class="slang-result-area">
      <div class="slang-result-container">
        <div class="slang-result-target-word">
          <span>{slang.word}</span>
        </div>
        <div class="slang-result-content">
          <p class="slang-result-definition">{slang.definition}</p>
          <span>e.g.</span>
          <p class="slang-result-example">{slang.example}</p>
          <span class="slang-autor">
            by {slang.author} {moment(slang.written_on).format('MMM DD, YYYY')}
          </span>
          <div class="slang-votes">
            <div class="slang-vote">
              <span class="icon is-small">
                <i class="fas fa-thumbs-up" />
              </span>
              <span>{slang.thumbs_up}</span>
            </div>
            <div class="slang-vote">
              <span class="icon is-small">
                <i class="fas fa-thumbs-down" />
              </span>
              <span>{slang.thumbs_down}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/each}
{/if}
