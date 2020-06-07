<script>
  import TopNav from "./Components/TopNav.svelte";

  import TranslationView from "./Views/TranslationView.svelte";
  import DefinitionView from "./Views/DefinitionView.svelte";
  import SlangView from "./Views/SlangView.svelte";

  let currentTab = "Slang";

  var targetWords = "api";

</script>

<style lang="scss">
  main {
    display: grid;
    row-gap: 5px;
    padding: 5px;
  }
</style>

<main>
  <TopNav defaultTab={currentTab} on:tabChange={(e) => currentTab = e.detail.value} />
  {#if currentTab == "translation"}
     <TranslationView bind:targetWords={targetWords} />
  {:else if  currentTab == "definition"}
     <DefinitionView bind:targetWords={targetWords}/>
  {:else}
     <SlangView bind:targetWords={targetWords}/>
  {/if}
  
</main>
