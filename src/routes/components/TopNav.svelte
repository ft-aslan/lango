<script lang="ts">
  import { currentTab } from "$lib/stores/stores";

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  function tabChanged(tab) {
    dispatch("tabChange", {
      value: tab,
    });
  }

  function selectTab(tabName) {
    currentTab.set(tabName);

    tabChanged(tabName);
  }
</script>

<nav>
  <nav-top>
    <div class="field has-addons">
      <p class="control">
        <a href="/translation">
          <button
            class="button is-dark"
            onclick={() => selectTab("translation")}
            class:is-warning={$currentTab == "translation"}
            class:is-selected={$currentTab == "translation"}
          >
            <span class="icon is-small">
              <i class="fas fa-language"></i>
            </span>
            <span>Translation</span>
          </button>
        </a>
      </p>
      <p class="control">
        <a href="/definition">
          <button
            class="button is-dark"
            onclick={() => selectTab("definition")}
            class:is-warning={$currentTab == "definition"}
            class:is-selected={$currentTab == "definition"}
          >
            <span class="icon is-small">
              <i class="fas fa-book" />
            </span>
            <span>Definition</span>
          </button>
        </a>
      </p>
      <p class="control">
        <a href="/slang">
          <button
            class="button is-dark"
            onclick={() => selectTab("slang")}
            class:is-warning={$currentTab == "slang"}
            class:is-selected={$currentTab == "slang"}
          >
            <span class="icon is-small">
              <i class="fab fa-stripe-s" />
            </span>
            <span>Slang</span>
          </button>
        </a>
      </p>
      <p class="control">
        <a href="/wordbook">
          <button
            class="button is-dark"
            onclick={() => selectTab("wordbook")}
            class:is-warning={$currentTab == "wordbook"}
            class:is-selected={$currentTab == "wordbook"}
          >
            <span>Wordbook</span>
          </button>
        </a>
      </p>
    </div>
  </nav-top>
</nav>

<style lang="scss">
  nav {
    display: grid;
    row-gap: 10px;
  }
  nav-top {
    justify-self: center;
  }
</style>
