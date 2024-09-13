<script lang="ts">
  import { clickOutside } from "../tools";

  import { createEventDispatcher } from "svelte";

  let isActive: boolean;
  export let selectedLanguage: { code: string; language: string };

  export let placeholder: string;
  export let allLanguages: { [key: string]: string };

  export let isInvisible: boolean;

  $: {
    if (selectedLanguage) {
      placeholder = selectedLanguage.language;
    }
  }

  export let justifySelfRight: boolean;

  let searchText: string = "";

  $: currentViewedLangs = Object.entries(allLanguages).filter(([key, value]) =>
    searchText != ""
      ? value.toLowerCase().includes(searchText.toLowerCase())
      : true,
  );

  const dispatch = createEventDispatcher();

  function langChanged(code: string, language: string) {
    isActive = !isActive;

    selectedLanguage = { code, language };

    dispatch("langChange", {
      selectedLanguage,
    });
  }
</script>

<!-- <div class="outside-area" /> -->
<div
  class="dropdown"
  class:is-right={justifySelfRight}
  style="justify-self:{justifySelfRight ? 'right' : 'left'}"
  class:is-active={isActive}
  class:is-invisible={isInvisible}
>
  <div class="dropdown-trigger">
    <button
      class="button is-dark"
      aria-haspopup="true"
      aria-controls="dropdown-menu"
      onclick={() => (isActive = !isActive)}
    >
      <span>{placeholder}</span>
      <span class="icon is-small">
        <i class="fas fa-angle-down" aria-hidden="true" />
      </span>
    </button>
  </div>
  <div class="dropdown-menu" id="dropdown-menu" role="menu">
    <div class="dropdown-content">
      <input
        class="input is-dark"
        type="text"
        placeholder="Search a Language"
        bind:value={searchText}
      />
      {#each currentViewedLangs as [code, language]}
        <div class="dropdown-item" onclick={() => langChanged(code, language)}>
          {language}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  /* .outside-area {
        position: absolute;
        left: 0px;
        right: 0px;
        width: 100%;
        height: 100%;
    } */
  .dropdown {
    width: max-content;
  }
  .dropdown-item {
    cursor: pointer;
  }
  .dropdown-content {
    padding: 10px 5px;

    height: 300px;
    overflow-y: scroll;
  }

  .dropdown-content::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    background-color: #f5f5f5;
  }

  .dropdown-content::-webkit-scrollbar {
    width: 12px;
    background-color: #f5f5f5;
  }

  .dropdown-content::-webkit-scrollbar-thumb {
    border-radius: 10px;
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    background-color: #555;
  }
</style>
