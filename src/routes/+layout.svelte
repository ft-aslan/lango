<script lang="ts">
  import { targetWords, currentTab } from "$lib/stores/stores";
  import { goto } from "$app/navigation";

  import TopNav from "./components/TopNav.svelte";
  import "../../node_modules/bulma/css/bulma.css";
  import "../app.css";

  (window as any).api.receive("focusedToTheMainWindow", (args) => {
    $targetWords = args;
  });
  currentTab.set("translation");
  goto("/" + $currentTab);
</script>

<main>
  <TopNav on:tabChange={(e) => ($currentTab = e.detail.value)} />
  <slot />
</main>

<style lang="scss">
  main {
    display: grid;
    row-gap: 5px;
    padding: 5px;
  }
</style>
