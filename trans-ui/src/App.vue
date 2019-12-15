<template>
    <div v-if="loading">
        Loading...
    </div>

    <LocalizedEmbed v-else :embed="embed" />
</template>

<script lang="ts">
    import { Component, Vue } from "vue-property-decorator";
    import store from "@/store";
    import LocalizedEmbed from "@/components/LocalizedEmbed.vue";

    const EMBED = {
        "color": 693982,
        "footer": {
            "icon_url": [
                "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128"
            ],
            "text": [
                {
                    "name": "command_page_n_of_n",
                    "args": {
                        "n": 1,
                        "total": 2
                    }
                },
                " • molenzwiebel 👑"
            ]
        },
        "timestamp": [
            "2019-12-14T13:21:48.545Z"
        ],
        "title": [
            {
                "name": "command_roles_message_title",
                "args": null
            }
        ],
        "description": [
            {
                "name": "command_roles_message_description",
                "args": null
            }
        ],
        "fields": [
            {
                "name": [
                    "Challenger"
                ],
                "value": [
                    "❌ ",
                    {
                        "name": "command_roles_ranked_tier",
                        "args": {
                            "ranked": [
                                {
                                    "name": "command_roles_ranked_tier_equal",
                                    "args": {
                                        "tier": [
                                            {
                                                "name": "ranked_tier_challenger",
                                                "args": null
                                            }
                                        ],
                                        "queue": [
                                            {
                                                "name": "queue_ranked_any",
                                                "args": null
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
            {
                "name": [
                    "Grandmaster"
                ],
                "value": [
                    "❌ ",
                    {
                        "name": "command_roles_ranked_tier",
                        "args": {
                            "ranked": [
                                {
                                    "name": "command_roles_ranked_tier_equal",
                                    "args": {
                                        "tier": [
                                            {
                                                "name": "ranked_tier_grandmaster",
                                                "args": null
                                            }
                                        ],
                                        "queue": [
                                            {
                                                "name": "queue_ranked_any",
                                                "args": null
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
            {
                "name": [
                    "Master"
                ],
                "value": [
                    "❌ ",
                    {
                        "name": "command_roles_ranked_tier",
                        "args": {
                            "ranked": [
                                {
                                    "name": "command_roles_ranked_tier_equal",
                                    "args": {
                                        "tier": [
                                            {
                                                "name": "ranked_tier_master",
                                                "args": null
                                            }
                                        ],
                                        "queue": [
                                            {
                                                "name": "queue_ranked_any",
                                                "args": null
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
            {
                "name": [
                    "Diamond"
                ],
                "value": [
                    "✅ ",
                    {
                        "name": "command_roles_ranked_tier",
                        "args": {
                            "ranked": [
                                {
                                    "name": "command_roles_ranked_tier_equal",
                                    "args": {
                                        "tier": [
                                            {
                                                "name": "ranked_tier_diamond",
                                                "args": null
                                            }
                                        ],
                                        "queue": [
                                            {
                                                "name": "queue_ranked_any",
                                                "args": null
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
            {
                "name": [
                    "Platinum"
                ],
                "value": [
                    "✅ ",
                    {
                        "name": "command_roles_ranked_tier",
                        "args": {
                            "ranked": [
                                {
                                    "name": "command_roles_ranked_tier_equal",
                                    "args": {
                                        "tier": [
                                            {
                                                "name": "ranked_tier_platinum",
                                                "args": null
                                            }
                                        ],
                                        "queue": [
                                            {
                                                "name": "queue_ranked_any",
                                                "args": null
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            },
            {
                "name": [
                    "Gold"
                ],
                "value": [
                    "❌ ",
                    {
                        "name": "command_roles_ranked_tier",
                        "args": {
                            "ranked": [
                                {
                                    "name": "command_roles_ranked_tier_equal",
                                    "args": {
                                        "tier": [
                                            {
                                                "name": "ranked_tier_gold",
                                                "args": null
                                            }
                                        ],
                                        "queue": [
                                            {
                                                "name": "queue_ranked_any",
                                                "args": null
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        ]
    };

    @Component({
        components: { LocalizedEmbed }
    })
    export default class App extends Vue {
        mounted() {
            store.load("https://raw.githubusercontent.com/molenzwiebel/OriannaBot/trans-ui/trans/languages/en.yaml");
        }

        get loading() {
            return store.loading;
        }

        get embed() {
            return EMBED;
        }
    }
</script>

<style lang="stylus">
    #app
        font-family "Avenir", Helvetica, Arial, sans-serif
        -webkit-font-smoothing antialiased
        -moz-osx-font-smoothing grayscale
        text-align center
        color #2c3e50
        margin-top 60px
</style>
