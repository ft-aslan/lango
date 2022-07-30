<script lang="ts">
    import { currentTab, targetWords, wordbook } from "../Stores/stores";
</script>

<div class="view-container">
    <div class="page-header">Wordbook</div>
    <ul class="word-list">
        {#each $wordbook as word}
            <li>
                <div class="word-info" />
                <div class="word">
                    {word.text}
                </div>
                <div class="actions">
                    <div class="left">
                        <button
                            class="button is-dark"
                            on:click={() => {
                                $targetWords = word.text;
                                $currentTab = "translation";
                            }}
                        >
                            <span class="icon is-small">
                                <i class="fas fa-language" />
                            </span>
                        </button>
                        <button
                            class="button is-dark"
                            on:click={() => {
                                $targetWords = word.text;
                                $currentTab = "definition";
                            }}
                        >
                            <span class="icon is-small">
                                <i class="fas fa-book" />
                            </span>
                        </button>
                        <button
                            class="button is-dark"
                            on:click={() => {
                                $targetWords = word.text;
                                $currentTab = "slang";
                            }}
                        >
                            <span class="icon is-small">
                                <i class="fab fa-stripe-s" />
                            </span>
                        </button>
                        <a target="_blank" href={"https://www.google.com/search?q=" + word.text}>
                            <button class="button is-dark">
                                <span class="icon is-small">
                                    <i class="fab fa-google" />
                                </span>
                            </button>
                        </a>
                    </div>
                    <div class="right">
                        <div class="usage">
                            Usage {word.numberOfUsage}
                        </div>
                        <button
                            class="button is-dark"
                            on:click={() => wordbook.removeWord(word.text)}
                        >
                            <span class="icon is-small">
                                <i class="fas fa-trash" />
                            </span>
                        </button>
                    </div>
                </div>
            </li>
        {/each}
    </ul>
</div>

<style lang="scss">
    .view-container {
        margin-top: 20px;
        padding: 10px;
    }
    .page-header {
        color: #ffdd57;
        font-weight: bold;
        font-size: 18px;
    }
    .word-list {
        margin-top: 10px;
        li {
            color: white;
            padding: 10px;
            border-radius: 10px;
            background-color: #363636;

            margin-top: 10px;

            &:hover {
                .word-info {
                    display: block;
                }
                .actions {
                    margin-top: 10px;

                    max-height: 100px;
                }
            }
        }
    }

    .word-info {
        display: none;
        color: #727272;
        margin-left: auto;
        width: max-content;
    }

    .actions {
        display: flex;
        background-color: #363636;

        max-height: 0px;
        overflow: hidden;

        transition: all 0.2s ease;

        .right {
            display: flex;
            align-items: center;
            margin-left: auto;

            .usage {
                margin-right: 10px;
            }
        }
    }
</style>
