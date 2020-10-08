<script lang="ts">
  let isActive : boolean;
  export let placeholder : string;
  export let items : string[];

  export let justifySelfRight: boolean;
</script>

<style lang="scss">
  .dropdown {
    width: max-content;
  }
</style>

<div
  class="dropdown"
  style="justify-self:{justifySelfRight ? 'right' : 'left'}"  
  on:click={() => (isActive = !isActive)}
  class:is-active={isActive}>
  <div class="dropdown-trigger">
    <button
      class="button is-dark"
      aria-haspopup="true"
      aria-controls="dropdown-menu">
      <span>{placeholder}</span>
      <span class="icon is-small">
        <i class="fas fa-angle-down" aria-hidden="true" />
      </span>
    </button>
  </div>
  <div class="dropdown-menu" id="dropdown-menu" role="menu">
    <div class="dropdown-content">
      {#each items as item}
        <a href="/" class="dropdown-item">{item}</a>
      {/each}
    </div>
  </div>
</div>
