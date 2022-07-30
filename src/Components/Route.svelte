<script lang="ts">
    import type { SvelteComponent } from "svelte";
    export let path: string;
    export let component: SvelteComponent;
</script>

<svelte:component this={component}/>
