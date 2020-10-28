<script lang="ts">
  //import {ipcRenderer} from "electron";
  
  import TopNav from "./Components/TopNav.svelte";

  import TranslationView from "./Views/TranslationView.svelte";
  import DefinitionView from "./Views/DefinitionView.svelte";
  import SlangView from "./Views/SlangView.svelte";

  let currentTab = "translation";

  var targetWords;

  // ipcRenderer.on("focusedToTheMainWindow", (event, message) => {
  //   targetWords = message;
  // });

  console.log(window);
  
</script>

<style lang="scss">
  main {
    display: grid;
    row-gap: 5px;
    padding: 5px;
  }
</style>

<main>
  <TopNav on:tabChange={(e) => (currentTab = e.detail.value)} />
  {#if currentTab == 'translation'}
    <TranslationView bind:targetWords />
  {:else if currentTab == 'definition'}
    <DefinitionView bind:targetWords />
  {:else}
    <SlangView bind:targetWords />
  {/if}

</main>
