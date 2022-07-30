<script lang="ts">
    import { targetWords, currentTab } from "./Stores/stores";

    import TopNav from "./Components/TopNav.svelte";

    import TranslationView from "./Views/TranslationView.svelte";
    import DefinitionView from "./Views/DefinitionView.svelte";
    import SlangView from "./Views/SlangView.svelte";
    import Routes from "./Components/Routes.svelte";
    import Route from "./Components/Route.svelte";
    import WordbookView from "./Views/WordBookView.svelte";

    currentTab.set("translation");

    (window as any).api.receive("focusedToTheMainWindow", (args) => {
        $targetWords = args;
    });
</script>

<main>
    <TopNav on:tabChange={(e) => ($currentTab = e.detail.value)} />
    {#if $currentTab == "translation" || $currentTab == "definition"}
        <TranslationView />
    {:else if $currentTab == "slang"}
        <SlangView />
    {:else if $currentTab == "wordbook"}
        <WordbookView />
    {/if}
    <!-- <Routes>
        <Route path="/transition" component={TranslationView}/>
        <Route path="/defination" component={TranslationView}/>
        <Route path="/slang" component={SlangView}/>
    </Routes> -->
</main>

<style lang="scss">
    main {
        display: grid;
        row-gap: 5px;
        padding: 5px;
    }
</style>
