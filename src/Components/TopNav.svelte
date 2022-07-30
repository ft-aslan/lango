<script lang="ts">
import { currentTab } from "../Stores/stores";

  import { createEventDispatcher } from "svelte";


  const dispatch = createEventDispatcher();

  function tabChanged(tab) {
    dispatch("tabChange", {
      value: tab
    });
  }

  function selectTab(tabName) {

    currentTab.set(tabName);

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
          class:is-warning={$currentTab == 'translation'}
          class:is-selected={$currentTab == 'translation'}>
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
          class:is-warning={$currentTab == 'definition'}
          class:is-selected={$currentTab == 'definition'}>
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
          class:is-warning={$currentTab == 'slang'}
          class:is-selected={$currentTab == 'slang'}>
          <span class="icon is-small">
            <i class="fab fa-stripe-s" />
          </span>
          <span>Slang</span>
        </button>
      </p>
      <p class="control">
        <button
          class="button is-dark"
          on:click={() => selectTab('wordbook')}
          class:is-warning={$currentTab == 'wordbook'}
          class:is-selected={$currentTab == 'wordbook'}>
          <span>Wordbook</span>
        </button>
      </p>
    </div>
  </nav-top>

</nav>
