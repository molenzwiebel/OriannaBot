<template>
    <champion-picker v-model="champ"></champion-picker>
</template>

<script lang="ts">
    import ChampionPicker from "../champion-dropdown/champion-dropdown.vue";

    export default {
        components: { ChampionPicker },
        data() {
            return { champ: null }
        }
    };
</script>