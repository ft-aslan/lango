<script>
  import { onMount } from "svelte";
  import { createEventDispatcher } from "svelte";

  export let defaultTab;

  onMount(async () => {
    if (defaultTab != null) {
      selectTab(defaultTab);
    }
  });

  let isTranslationSelected = true;
  let isDefinitionSelected;
  let isSlangSelected;

  const dispatch = createEventDispatcher();

  function tabChanged(tab) {
    dispatch("tabChange", {
      value: tab,
    });
  }

  function selectTab(tabName) {
    if (tabName == "translation") {
      isTranslationSelected = true;
      isDefinitionSelected = false;
      isSlangSelected = false;
    } else if (tabName == "definition") {
      isTranslationSelected = false;
      isDefinitionSelected = true;
      isSlangSelected = false;
    } else {
      isTranslationSelected = false;
      isDefinitionSelected = false;
      isSlangSelected = true;
    }

    tabChanged(tabName);
  }
</script>

<style lang="scss">
  nav {
    display: grid;
    row-gap: 10px;
  }
  nav-top {
    justify-self: center;
  }
</style>

<nav>
  <nav-top>
    <div class="field has-addons">
      <p class="control">
        <button
          class="button is-dark"
          on:click={() => selectTab('translation')}
          class:is-warning={isTranslationSelected}
          class:is-selected={isTranslationSelected}>
          <span class="icon is-small">
            <i class="fas fa-language" />
          </span>
          <span>Translation</span>
        </button>
      </p>
      <p class="control">
        <button
          class="button is-dark"
          on:click={() => selectTab('definition')}
          class:is-warning={isDefinitionSelected}
          class:is-selected={isDefinitionSelected}>
          <span class="icon is-small">
            <i class="fas fa-book" />
          </span>
          <span>Definition</span>
        </button>
      </p>
      <p class="control">
        <button
          class="button is-dark"
          on:click={() => selectTab('slang')}
          class:is-warning={isSlangSelected}
          class:is-selected={isSlangSelected}>
          <span class="icon is-small">
            <i class="fab fa-stripe-s" />
          </span>
          <span>Slang</span>
        </button>
      </p>
    </div>
  </nav-top>

</nav>
