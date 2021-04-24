<script lang="ts">
    import { targetWords, currentTranslation } from "../Stores/stores";
</script>

<div id="definitions-of">Definitions of {$targetWords}</div>

{#each $currentTranslation.definitions as definition}
    <div class="definition-result-area">
        <span class="definition-result-area-header">{definition.type}</span>
        {#each definition.content as line, i}
            <div class="definition-result-line">
                <div class="line-count">{i + 1}</div>
                <span class="definition-word-of-line">{line.definition}</span>
            </div>
        {/each}
    </div>
{/each}

<style lang="scss">
    textarea {
        color: white;
        background-color: rgb(51, 51, 51);
        border: none;

        &::placeholder {
            color: rgb(167, 167, 167);
        }
    }

    #definitions-of {
        color: white;
        padding: 5px;
        background-color: rgb(41, 41, 41);
    }

    .definition-result-area {
        display: grid;
        row-gap: 10px;
        color: rgb(167, 167, 167);
        background-color: rgb(66, 66, 66);

        padding-bottom: 10px;

        .definition-result-area-header {
            color: rgb(255, 221, 87);
        }

        .definition-result-line {
            display: grid;
            grid-auto-flow: column;
            grid-template-columns: max-content 1fr;

            column-gap: 10px;

            .line-count {
                display: flex;
                justify-content: center;

                width: 25px;
                height: 25px;
                border: 1px solid rgb(111, 111, 111);
                border-radius: 100%;
            }

            .definition-word-of-line {
                padding: 10px;
                background-color: rgb(84, 84, 84);
                border-radius: 10px;
                color: white;
            }
        }
    }
</style>
