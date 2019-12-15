import { TranslationSectionDefinition } from "@/types";

const SECTIONS: TranslationSectionDefinition[] = [{
    title: "Common - Ranked Tiers",
    description: "The names of the 10 different ranked tiers, used in various places.",
    keyGroups: [{
        keys: [
            "ranked_tier_unranked",
            "ranked_tier_iron",
            "ranked_tier_bronze",
            "ranked_tier_silver",
            "ranked_tier_gold",
            "ranked_tier_platinum",
            "ranked_tier_diamond",
            "ranked_tier_master",
            "ranked_tier_grandmaster",
            "ranked_tier_challenger"
        ],
        embed: 0
    }],
    embeds: [{
        "header": "Example",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                {
                    "name": "command_page_n_of_n",
                    "args": {
                        "n": 1,
                        "total": 1
                    }
                },
                " • molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T13:09:42.238Z",
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
            },
            {
                "name": [
                    "Silver"
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
                                                "name": "ranked_tier_silver",
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
                    "Bronze"
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
                                                "name": "ranked_tier_bronze",
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
                    "Iron"
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
                                                "name": "ranked_tier_iron",
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
                    "Unranked"
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
                                                "name": "ranked_tier_unranked",
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
    }]
}, {
    title: "Common - Ranked Queues",
    description: "The names of the various ranked queues that Orianna has assigning capabilities for.",
    keyGroups: [{
        keys: [
            "queue_ranked_solo",
            "queue_ranked_flex",
            "queue_ranked_tft",
            "queue_ranked_any",
            "queue_ranked_highest",
            "queue_ranked_highest_tft"
        ],
        embed: 0
    }],
    embeds: [{
        "header": "Example",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                {
                    "name": "command_page_n_of_n",
                    "args": {
                        "n": 1,
                        "total": 1
                    }
                },
                " • molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T13:27:21.452Z",
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
                                                "name": "queue_ranked_highest_tft",
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
                                                "name": "queue_ranked_highest",
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
                                                "name": "queue_ranked_tft",
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
                                                "name": "queue_ranked_flex",
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
                                                "name": "queue_ranked_solo",
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
    }]
}, {
    title: "Common - Time Ago",
    description: "How to describe something that happened a while ago.",
    keyGroups: [{
        keys: [
            "time_ago_today",
            "time_ago_yesterday",
            "time_ago_days_ago"
        ],
        embed: 0
    }],
    embeds: [{
        "header": "Example",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T13:33:57.786Z",
        "title": [
            {
                "name": "command_profile_title",
                "args": {
                    "name": [
                        "molenzwiebel <a:Bot_Owner:468045368517722153>"
                    ]
                }
            }
        ],
        "fields": [
            {
                "name": [
                    {
                        "name": "command_profile_top_champions",
                        "args": null
                    }
                ],
                "value": [
                    "<:Syndra:411977428227850241> Syndra - **790k**\n<:Soraka:411977195506892802> Soraka - **220k**\n<:Xayah:411977428718714900> Xayah - **130k**"
                ],
                "inline": true
            },
            {
                "name": [
                    {
                        "name": "command_profile_statistics",
                        "args": null
                    }
                ],
                "value": [
                    "5x<:Level_7:411977489707958282> 6x<:Level_6:411977489351704587> 16x<:Level_5:411977803144364032><:__:447420442819690506>\n",
                    {
                        "name": "command_profile_statistics_total_points",
                        "args": {
                            "amount": 2790473
                        }
                    },
                    "<:__:447420442819690506>\n",
                    {
                        "name": "command_profile_statistics_avg_champ",
                        "args": {
                            "amount": [
                                "20,368.42"
                            ]
                        }
                    },
                    "<:__:447420442819690506>"
                ],
                "inline": true
            },
            {
                "name": [
                    {
                        "name": "command_profile_recently_played",
                        "args": null
                    }
                ],
                "value": [
                    "<:Amumu:411977195532189708> Amumu - **",
                    {
                        "name": "time_ago_today",
                        "args": null
                    },
                    "**\n<:Diana:411977428311736340> Diana - **",
                    {
                        "name": "time_ago_yesterday",
                        "args": null
                    },
                    "**\n<:Leona:411977323806720011> Leona - **",
                    {
                        "name": "time_ago_days_ago",
                        "args": {
                            "days": 2
                        }
                    },
                    "**"
                ],
                "inline": true
            }
        ]
    }]
}, {
    title: "Discord - Command Errors",
    description: "Various errors that can happen during command execution, such as a user forgetting to specify a champion or the command failing entirely.",
    keyGroups: [{
        keys: [
            "command_error_title",
            "command_error_description"
        ],
        embed: 0
    }, {
        keys: [
            "command_error_no_accounts",
            "command_error_no_accounts_description",
        ],
        embed: 1,
    }, {
        keys: [
            "command_error_no_permissions",
            "command_error_no_permissions_description",
        ],
        embed: 2,
    }, {
        keys: [
            "command_error_no_champion",
            "command_error_no_champion_description",
        ],
        embed: 3,
    }, {
        keys: ["command_muted_preamble"]
    }],
    embeds: [{
        "header": "Example: Generic Error",
        "color": 16604252,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T14:05:14.053Z",
        "title": [
            {
                "name": "command_error_title",
                "args": null
            }
        ],
        "description": [
            {
                "name": "command_error_description",
                "args": null
            }
        ]
    }, {
        "header": "Example: No Accounts",
        "color": 16604252,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T14:05:14.053Z",
        "title": [
            {
                "name": "command_error_no_accounts",
                "args": {
                    "user": [
                        "molenzwiebel <a:Bot_Owner:468045368517722153>"
                    ]
                }
            }
        ],
        "description": [
            {
                "name": "command_error_no_accounts_description",
                "args": null
            }
        ]
    }, {
        "header": "Example: No Permissions",
        "color": 16604252,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T14:05:14.053Z",
        "title": [
            {
                "name": "command_error_no_permissions",
                "args": null
            }
        ],
        "description": [
            {
                "name": "command_error_no_permissions_description",
                "args": null
            }
        ]
    }, {
        "header": "Example: No Champion",
        "color": 16604252,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T14:05:14.053Z",
        "title": [
            {
                "name": "command_error_no_champion",
                "args": null
            }
        ],
        "description": [
            {
                "name": "command_error_no_champion_description",
                "args": null
            }
        ]
    }]
}, {
    title: "Discord - Engagement",
    description: "The various messages that are sent when a user first interacts with Orianna. Note that there are multiple starting paragraphs based on how the user first interacted with Orianna.",
    keyGroups: [{
        keys: [
            "first_use_title",
            "first_use_intro_on_command",
            "first_use_message"
        ],
        embed: 0
    }, {
        keys: [
            "first_use_intro_on_join",
        ],
        embed: 1,
    }, {
        keys: [
            "first_use_intro_on_react",
        ],
        embed: 2
    }],
    embeds: [{
        "header": "Example: Full Message",
        "color": 4832538,
        "footer": {
            "text": [
                "Orianna Bot v2"
            ]
        },
        "timestamp": "2019-12-15T13:39:38.637Z",
        "title": [
            {
                "name": "first_use_title",
                "args": {
                    "username": [
                        "molenzwiebel"
                    ]
                }
            }
        ],
        "description": [
            {
                "name": "first_use_message",
                "args": {
                    "intro": [
                        {
                            "name": "first_use_intro_on_command",
                            "args": null
                        }
                    ],
                    "link": [
                        "https://orianna.molenzwiebel.xyz/login/fc5bb491e0cca00713403311ba1f5e0a"
                    ]
                }
            }
        ],
        "thumbnail": {
            "url": "https://ddragon.leagueoflegends.com/cdn/7.7.1/img/champion/Orianna.png"
        }
    }, {
        "header": "Example: On Join Message",
        "color": 4832538,
        "footer": {
            "text": [
                "Orianna Bot v2"
            ]
        },
        "timestamp": "2019-12-15T13:39:38.637Z",
        "title": [
            {
                "name": "first_use_title",
                "args": {
                    "username": [
                        "molenzwiebel"
                    ]
                }
            }
        ],
        "description": [
            {
                "name": "first_use_intro_on_join",
                "args": {
                    "server": [
                        "Orianna Mains"
                    ]
                }
            },
            "\n\n_..._"
        ],
        "thumbnail": {
            "url": "https://ddragon.leagueoflegends.com/cdn/7.7.1/img/champion/Orianna.png"
        }
    }, {
        "header": "Example: On React Message",
        "color": 4832538,
        "footer": {
            "text": [
                "Orianna Bot v2"
            ]
        },
        "timestamp": "2019-12-15T13:39:38.637Z",
        "title": [
            {
                "name": "first_use_title",
                "args": {
                    "username": [
                        "molenzwiebel"
                    ]
                }
            }
        ],
        "description": [
            {
                "name": "first_use_intro_on_react",
                "args": {
                    "server": [
                        "Orianna Mains"
                    ]
                }
            },
            "\n\n_..._"
        ],
        "thumbnail": {
            "url": "https://ddragon.leagueoflegends.com/cdn/7.7.1/img/champion/Orianna.png"
        }
    }]
}];

export default SECTIONS;