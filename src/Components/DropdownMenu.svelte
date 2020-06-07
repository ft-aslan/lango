<script>
  let isActive;
  export let placeholder;
  export let items;

  export let justifySelf;
</script>

<style>
  .dropdown {
    width: max-content;
  }
</style>

<div
  class="dropdown"
  style="justify-self:{justifySelf};"  
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
