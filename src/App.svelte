<script lang="ts">
    import { targetWords, currentTab } from "./Stores/stores";

    import TopNav from "./Components/TopNav.svelte";

    import TranslationView from "./Views/TranslationView.svelte";
    import DefinitionView from "./Views/DefinitionView.svelte";
    import SlangView from "./Views/SlangView.svelte";

    currentTab.set("translation");


    (window as any).api.receive("focusedToTheMainWindow", (args) => {
        $targetWords = args;
    });
</script>

<style lang="scss">
    main {
        display: grid;
        row-gap: 5px;
        padding: 5px;
    }
</style>

<main>
    <TopNav on:tabChange={(e) => ($currentTab = e.detail.value)} />
    {#if $currentTab == 'translation' ||  $currentTab == 'definition'}
        <TranslationView />
    {:else}
        <SlangView />
    {/if}
</main>
