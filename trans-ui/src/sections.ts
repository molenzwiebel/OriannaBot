import { TranslationSectionDefinition } from "@/types";

const SECTIONS: TranslationSectionDefinition[] = [{
    title: "Common - Ranked Tiers",
    description: "The names of the 10 different ranked tiers, used in various places.",
    // <editor-fold defaultstate="collapsed" desc="Common - Ranked Tiers">
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
    // </editor-fold>
}, {
    title: "Common - Ranked Queues",
    description: "The names of the various ranked queues that Orianna has assigning capabilities for.",
    // <editor-fold defaultstate="collapsed" desc="Common - Ranked Queues">
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
    // </editor-fold>
}, {
    title: "Common - Time Ago",
    description: "How to describe something that happened a while ago.",
    // <editor-fold defaultstate="collapsed" desc="Common - Time Ago">
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
                    "<:Syndra:411977428227850241> ", { champion: "Syndra" }, " - **790k**\n<:Soraka:411977195506892802> ", { champion: "Soraka" }, " - **220k**\n<:Xayah:411977428718714900> ", { champion: "Xayah" }, " - **130k**"
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
                    "<:Amumu:411977195532189708> ", { champion: "Amumu" }, " - **",
                    {
                        "name": "time_ago_today",
                        "args": null
                    },
                    "**\n<:Diana:411977428311736340> ", { champion: "Diana" }, " - **",
                    {
                        "name": "time_ago_yesterday",
                        "args": null
                    },
                    "**\n<:Leona:411977323806720011> ", { champion: "Leona" }, " - **",
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
    // </editor-fold>
}, {
    title: "Common - Misc",
    description: "Miscellaneous strings that didn't really fit anywhere else.",
    // <editor-fold defaultstate="collapsed" desc="Common - Misc">
    keyGroups: [{
        keys: ["command_page_n_of_n"],
        embed: 0
    }, {
        keys: [
            "command_other_bot_title",
            "command_other_bot_description"
        ],
        embed: 1
    }],
    embeds: [{
        "header": "Example",
        "color": 4832538,
        "timestamp": "2019-12-15T14:31:10.377Z",
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                {
                    "name": "command_page_n_of_n",
                    "args": {
                        "n": 1,
                        "total": 10
                    }
                },
                " • molenzwiebel 👑"
            ]
        }
    }, {
        "header": "Example: User tries to assign Orianna role with a different bot.",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T15:11:49.928Z",
        "title": [
            {
                "name": "command_other_bot_title",
                "args": null
            }
        ],
        "description": [
            {
                "name": "command_other_bot_description",
                "args": {
                    "role": [
                        "Gold"
                    ]
                }
            }
        ]
    }]
    // </editor-fold>
}, {
    title: "Discord - Command Errors",
    description: "Various errors that can happen during command execution, such as a user forgetting to specify a champion or the command failing entirely.",
    // <editor-fold defaultstate="collapsed" desc="Discord - Command Errors">
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
    // </editor-fold>
}, {
    title: "Discord - Engagement",
    description: "The various messages that are sent when a user first interacts with Orianna. Note that there are multiple starting paragraphs based on how the user first interacted with Orianna.",
    // <editor-fold defaultstate="collapsed" desc="Discord - Engagement">
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
    // </editor-fold>
}, {
    title: "Discord - Updating",
    description: "The various messages that happen when Orianna updates the stats for a user. This is mostly people transferring or when they get promoted to a role.",
    // <editor-fold defaultstate="collapsed" desc="Discord - Updating">
    keyGroups: [{
        keys: [
            "transfer_title",
            "transfer_body"
        ],
        embed: 0
    }, {
        keys: [
            "promotion_title"
        ],
        embed: 1
    }],
    embeds: [{
        "header": "Example: Account Transfer",
        "color": 693982,
        "title": [
            {
                "name": "transfer_title",
                "args": null
            }
        ],
        "description": [
            {
                "name": "transfer_body",
                "args": {
                    "username": [
                        "Doublelift"
                    ],
                    "region": [
                        "NA"
                    ]
                }
            }
        ]
    }, {
        "header": "Example: User Promotion",
        "color": 4832538,
        "timestamp": "2019-12-15T14:31:10.377Z",
        "author": {
            "name": [
                {
                    "name": "promotion_title",
                    "args": {
                        "username": [
                            "molenzwiebel 👑"
                        ],
                        "role": [
                            "Archmage (700k)"
                        ]
                    }
                }
            ],
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif"
        },
        "image": {
            "url": "https://media.discordapp.net/attachments/186908309989752832/625086113157218304/promotion.gif?format=png&width=400&height=110",
            "width": 400,
            "height": 110
        }
    }]
    // </editor-fold>
}, {
    title: "Discord - Command - About",
    description: "All the strings used in the about command.",
    // <editor-fold defaultstate="collapsed" desc="Discord - Command - About">
    keyGroups: [{
        keys: [
            "command_about_title",
            "command_about_field_author",
            "command_about_field_version",
            "command_about_field_source",
            "command_about_field_servers",
            "command_about_field_channels",
            "command_about_field_users",
            "command_about_field_memory_usage",
            "command_about_field_support",
            "command_about_field_vote"
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
        "timestamp": "2019-12-15T14:46:30.233Z",
        "title": [
            {
                "name": "command_about_title",
                "args": null
            }
        ],
        "fields": [
            {
                "name": [
                    {
                        "name": "command_about_field_author",
                        "args": null
                    }
                ],
                "value": [
                    "molenzwiebel#2773 (EUW - Yahoo Answers)"
                ]
            },
            {
                "name": [
                    {
                        "name": "command_about_field_version",
                        "args": null
                    }
                ],
                "value": [
                    "[9b33707 - [trans] Lots of progress](https://github.com/molenzwiebel/OriannaBot/commit/9b33707887f31a3d62ac989a91f17af50118ad95)"
                ]
            },
            {
                "name": [
                    {
                        "name": "command_about_field_source",
                        "args": null
                    }
                ],
                "value": [
                    "[Orianna Bot on Github](https://github.com/molenzwiebel/oriannabot)"
                ]
            },
            {
                "name": [
                    {
                        "name": "command_about_field_servers",
                        "args": null
                    }
                ],
                "value": [
                    "9,999"
                ],
                "inline": true
            },
            {
                "name": [
                    {
                        "name": "command_about_field_channels",
                        "args": null
                    }
                ],
                "value": [
                    "231,703"
                ],
                "inline": true
            },
            {
                "name": [
                    {
                        "name": "command_about_field_users",
                        "args": null
                    }
                ],
                "value": [
                    "1,309,265"
                ],
                "inline": true
            },
            {
                "name": [
                    {
                        "name": "command_about_field_memory_usage",
                        "args": null
                    }
                ],
                "value": [
                    "1556.11 MB"
                ],
                "inline": true
            },
            {
                "name": [
                    {
                        "name": "command_about_field_support",
                        "args": null
                    }
                ],
                "value": [
                    "[discord.gg/bfxdsRC](https://discord.gg/bfxdsRC)"
                ],
                "inline": true
            },
            {
                "name": [
                    {
                        "name": "command_about_field_vote",
                        "args": null
                    }
                ],
                "value": [
                    "[discordbots.org](https://discordbots.org/bot/244234418007441408)"
                ],
                "inline": true
            }
        ]
    }]
    // </editor-fold>
}, {
    title: "Discord - Command - Edit",
    description: "All the strings used in the edit command.",
    // <editor-fold defaultstate="collapsed" desc="Discord - Command - Edit">
    keyGroups: [{
        keys: [
            "command_edit_small_description",
            "command_edit_description"
        ],
        embed: 0
    }, {
        keys: [
            "command_edit_server_title",
            "command_edit_server_description"
        ],
        embed: 1
    }, {
        keys: [
            "command_edit_dm_title",
            "command_edit_dm_description"
        ],
        embed: 2
    }, {
        keys: [
            "command_edit_dm_failed_title",
            "command_edit_dm_failed_description"
        ],
        embed: 3
    }],
    embeds: [{
        "header": "Example: Help Listing",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T14:52:28.712Z",
        "title": [
            {
                "name": "command_help_command_title",
                "args": {
                    "name": [
                        "Edit Profile"
                    ]
                }
            }
        ],
        "description": [
            {
                "name": "command_help_command_description",
                "args": {
                    "description": [
                        {
                            "name": "command_edit_description",
                            "args": null
                        }
                    ]
                }
            }
        ],
        "fields": [
            {
                "name": [
                    {
                        "name": "command_help_command_keywords",
                        "args": null
                    }
                ],
                "value": [
                    "`edit`, `config`, `configure`, `add`, `remove`"
                ]
            }
        ]
    }, {
        "header": "Example: Edit Server",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T14:53:10.607Z",
        "title": [
            {
                "name": "command_edit_server_title",
                "args": null
            }
        ],
        "description": [
            {
                "name": "command_edit_server_description",
                "args": null
            }
        ]
    }, {
        "header": "Example: DM with edit link",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T14:53:41.102Z",
        "title": [
            {
                "name": "command_edit_dm_title",
                "args": null
            }
        ],
        "description": [
            {
                "name": "command_edit_dm_description",
                "args": {
                    "link": [
                        "https://orianna.molenzwiebel.xyz/login/f337890fd339fd978ff1d2957f6b2095"
                    ]
                }
            }
        ]
    }, {
        "header": "Example: DM failed",
        "color": 16604252,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T14:54:51.837Z",
        "title": [
            {
                "name": "command_edit_dm_failed_title",
                "args": null
            }
        ],
        "description": [
            {
                "name": "command_edit_dm_failed_description",
                "args": null
            }
        ],
        "image": {
            "url": "https://i.imgur.com/qLgkXiv.png",
            "width": 400,
            "height": 109
        }
    }]
    // </editor-fold>
}, {
    title: "Discord - Command - Help",
    description: "All the strings used in the help command.",
    // <editor-fold defaultstate="collapsed" desc="Discord - Command - Help">
    keyGroups: [{
        keys: [
            "command_help_title",
            "command_help_description"
        ],
        embed: 0
    }, {
        keys: [
            "command_help_command_title",
            "command_help_command_description",
            "command_help_command_keywords"
        ],
        embed: 1
    }],
    embeds: [{
        "header": "Example: Help Overview",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T15:06:55.199Z",
        "title": [
            {
                "name": "command_help_title",
                "args": null
            }
        ],
        "description": [
            {
                "name": "command_help_description",
                "args": null
            }
        ],
        "fields": [
            {
                "name": [
                    "1 - Edit Profile"
                ],
                "value": [
                    {
                        "name": "command_edit_small_description",
                        "args": null
                    }
                ]
            },
            {
                "name": [
                    "2 - Refresh"
                ],
                "value": [
                    {
                        "name": "command_refresh_small_description",
                        "args": null
                    }
                ]
            }
        ]
    }, {
        "header": "Example: Help For Command",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T15:07:36.420Z",
        "title": [
            {
                "name": "command_help_command_title",
                "args": {
                    "name": [
                        "Edit Profile"
                    ]
                }
            }
        ],
        "description": [
            {
                "name": "command_help_command_description",
                "args": {
                    "description": [
                        {
                            "name": "command_edit_description",
                            "args": null
                        }
                    ]
                }
            }
        ],
        "fields": [
            {
                "name": [
                    {
                        "name": "command_help_command_keywords",
                        "args": null
                    }
                ],
                "value": [
                    "`edit`, `config`, `configure`, `add`, `remove`"
                ]
            }
        ]
    }]
    // </editor-fold>
}, {
    title: "Discord - Command - Invite",
    description: "All the strings used in the invite command.",
    // <editor-fold defaultstate="collapsed" desc="Discord - Command - Invite">
    keyGroups: [{
        keys: [
            "command_invite_title",
            "command_invite_message_description"
        ],
        embed: 0
    }],
    embeds: [{
        "header": "Example: DM with invite link",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T15:09:58.309Z",
        "title": [
            {
                "name": "command_invite_title",
                "args": null
            }
        ],
        "description": [
            {
                "name": "command_invite_message_description",
                "args": {
                    "link": [
                        "https://orianna.molenzwiebel.xyz/api/v1/discord-invite"
                    ]
                }
            }
        ]
    }]
    // </editor-fold>
}, {
    title: "Discord - Command - Points",
    description: "All the strings used in the points command.",
    // <editor-fold defaultstate="collapsed" desc="Discord - Command - Points">
    keyGroups: [{
        keys: [
            "command_points_small_description",
            "command_points_description"
        ],
        embed: 0
    }, {
        keys: [
            "command_points_message_title",
            "command_points_message_description"
        ],
        embed: 1
    }],
    embeds: [{
        "header": "Example: Help Listing",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T15:14:06.272Z",
        "title": [
            {
                "name": "command_help_command_title",
                "args": {
                    "name": [
                        "Show Mastery Points"
                    ]
                }
            }
        ],
        "description": [
            {
                "name": "command_help_command_description",
                "args": {
                    "description": [
                        {
                            "name": "command_points_description",
                            "args": null
                        }
                    ]
                }
            }
        ],
        "fields": [
            {
                "name": [
                    {
                        "name": "command_help_command_keywords",
                        "args": null
                    }
                ],
                "value": [
                    "`points`, `mastery`, `score`"
                ]
            }
        ]
    }, {
        "header": "Example: Command Response",
        "color": 4832538,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T15:14:42.158Z",
        "title": [
            {
                "name": "command_points_message_title",
                "args": null
            }
        ],
        "description": [
            {
                "name": "command_points_message_description",
                "args": {
                    "user": [
                        "<@!86540964021161984> <a:Bot_Owner:468045368517722153>"
                    ],
                    "points": [
                        "<:Level_7:411977489707958282> 787,562"
                    ],
                    "champion": [
                        "<:Syndra:411977428227850241> ", { champion: "Syndra" }
                    ]
                }
            }
        ]
    }]
    // </editor-fold>
}, {
    title: "Discord - Command - Profile",
    description: "All the strings used in the profile command.",
    // <editor-fold defaultstate="collapsed" desc="Discord - Command - Profile">
    keyGroups: [{
        keys: [
            "command_profile_small_description",
            "command_profile_description"
        ],
        embed: 0
    }, {
        keys: [
            "command_profile_title",
            "command_profile_top_champions",
            "command_profile_statistics",
            "command_profile_statistics_total_points",
            "command_profile_statistics_avg_champ",
            "command_profile_recently_played",
            "command_profile_ranked_tiers",
            "command_profile_account"
        ],
        embed: 1
    }, {
        keys: [
            "command_profile_recently_played_no_games",
            "command_profile_accounts"
        ],
        embed: 2
    }],
    embeds: [{
        "header": "Example: Help Listing",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T17:30:16.152Z",
        "title": [
            {
                "name": "command_help_command_title",
                "args": {
                    "name": [
                        "Show User Profile"
                    ]
                }
            }
        ],
        "description": [
            {
                "name": "command_help_command_description",
                "args": {
                    "description": [
                        {
                            "name": "command_profile_description",
                            "args": null
                        }
                    ]
                }
            }
        ],
        "fields": [
            {
                "name": [
                    {
                        "name": "command_help_command_keywords",
                        "args": null
                    }
                ],
                "value": [
                    "`list`, `accounts`, `name`, `show`, `profile`, `account`, `summoner`"
                ]
            }
        ]
    }, {
        "header": "Example: Profile with a single account and games played.",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T17:30:55.953Z",
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
                    "<:Syndra:411977428227850241> ", { champion: "Syndra" }, " - **790k**\n<:Soraka:411977195506892802> ", { champion: "Soraka" }, " - **220k**\n<:Xayah:411977428718714900> ", { champion: "Xayah" }, " - **130k**"
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
                    "<:Amumu:411977195532189708> ", { champion: "Amumu" }, " - **",
                    {
                        "name": "time_ago_today",
                        "args": null
                    },
                    "**\n<:Diana:411977428311736340> ", { champion: "Diana" }, " - **",
                    {
                        "name": "time_ago_yesterday",
                        "args": null
                    },
                    "**\n<:Leona:411977323806720011> ", { champion: "Leona" }, " - **",
                    {
                        "name": "time_ago_days_ago",
                        "args": {
                            "days": 2
                        }
                    },
                    "**"
                ],
                "inline": true
            },
            {
                "name": [
                    {
                        "name": "command_profile_ranked_tiers",
                        "args": null
                    }
                ],
                "value": [
                    {
                        "name": "queue_ranked_solo",
                        "args": null
                    },
                    ": **<:Platinum:519953533500391445> ",
                    {
                        "name": "ranked_tier_platinum",
                        "args": null
                    },
                    "**\n",
                    {
                        "name": "queue_ranked_flex",
                        "args": null
                    },
                    ": **<:Diamond:519953533769089044> ",
                    {
                        "name": "ranked_tier_diamond",
                        "args": null
                    },
                    "**\n",
                    {
                        "name": "queue_ranked_tft",
                        "args": null
                    },
                    ": **<:Iron:519953534356160532> ",
                    {
                        "name": "ranked_tier_iron",
                        "args": null
                    },
                    "**\n<:__:447420442819690506>"
                ],
                "inline": true
            },
            {
                "name": [
                    {
                        "name": "command_profile_account",
                        "args": null
                    }
                ],
                "value": [
                    "EUW - Yahoo Answers\n<:__:447420442819690506>"
                ],
                "inline": true
            }
        ]
    }, {
        "header": "Example: Multiple accounts, no recent games",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T17:33:02.744Z",
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
                    "<:Syndra:411977428227850241> ", { champion: "Syndra" }, " - **790k**\n<:Soraka:411977195506892802> ", { champion: "Soraka" }, " - **220k**\n<:Xayah:411977428718714900> ", { champion: "Xayah" }, " - **130k**"
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
                    "<:__:447420442819690506>\n<:__:447420442819690506>"
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
                    {
                        "name": "command_profile_recently_played_no_games",
                        "args": null
                    },
                    "\n<:__:447420442819690506>"
                ],
                "inline": true
            },
            {
                "name": [
                    {
                        "name": "command_profile_ranked_tiers",
                        "args": null
                    }
                ],
                "value": [
                    {
                        "name": "queue_ranked_solo",
                        "args": null
                    },
                    ": **<:Platinum:519953533500391445> ",
                    {
                        "name": "ranked_tier_platinum",
                        "args": null
                    },
                    "**\n",
                    {
                        "name": "queue_ranked_flex",
                        "args": null
                    },
                    ": **<:Diamond:519953533769089044> ",
                    {
                        "name": "ranked_tier_diamond",
                        "args": null
                    },
                    "**\n",
                    {
                        "name": "queue_ranked_tft",
                        "args": null
                    },
                    ": **<:Iron:519953534356160532> ",
                    {
                        "name": "ranked_tier_iron",
                        "args": null
                    },
                    "**\n<:__:447420442819690506>"
                ],
                "inline": false
            },
            {
                "name": [
                    {
                        "name": "command_profile_accounts",
                        "args": null
                    }
                ],
                "value": [
                    "EUW - Test\n<:__:447420442819690506>"
                ],
                "inline": true
            },
            {
                "name": [
                    "​"
                ],
                "value": [
                    "EUW - Yahoo Answers\n<:__:447420442819690506>"
                ],
                "inline": true
            }
        ]
    }]
    // </editor-fold>
}, {
    title: "Discord - Command - Refresh",
    description: "The help text for the refresh command.",
    // <editor-fold defaultstate="collapsed" desc="Discord - Command - Refresh">
    keyGroups: [{
        keys: [
            "command_refresh_small_description",
            "command_refresh_description"
        ],
        embed: 0
    }],
    embeds: [{
        "header": "Example: Help Listing",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T17:38:29.544Z",
        "title": [
            {
                "name": "command_help_command_title",
                "args": {
                    "name": [
                        "Refresh"
                    ]
                }
            }
        ],
        "description": [
            {
                "name": "command_help_command_description",
                "args": {
                    "description": [
                        {
                            "name": "command_refresh_description",
                            "args": null
                        }
                    ]
                }
            }
        ],
        "fields": [
            {
                "name": [
                    {
                        "name": "command_help_command_keywords",
                        "args": null
                    }
                ],
                "value": [
                    "`refresh`, `reload`, `update`, `recalculate`"
                ]
            }
        ]
    }]
    // </editor-fold>
}, {
    title: "Discord - Command - Roles",
    description: "All the strings used in the roles command.",
    // <editor-fold defaultstate="collapsed" desc="Discord - Command - Roles">
    keyGroups: [{
        keys: [
            "command_roles_small_description",
            "command_roles_description"
        ],
        embed: 0
    }, {
        keys: [
            "command_roles_no_server_title",
            "command_roles_no_server_description"
        ],
        embed: 1
    }, {
        keys: [
            "command_roles_no_roles_title",
            "command_roles_no_roles_description"
        ],
        embed: 2
    }, {
        keys: [
            "command_roles_at_least",
            "command_roles_at_most",
            "command_roles_exactly",
            "command_roles_between",
            "command_roles_ranked_tier_equal",
            "command_roles_ranked_tier_lower",
            "command_roles_ranked_tier_higher"
        ],
        embed: 3
    }, {
        keys: [
            "command_roles_mastery_level",
            "command_roles_total_mastery_level",
            "command_roles_mastery_score",
            "command_roles_total_mastery_score",
            "command_roles_ranked_tier",
            "command_roles_region"
        ],
        embed: 4
    }, {
        keys: [
            "command_roles_message_title",
            "command_roles_message_description",
            "command_roles_all_match",
            "command_roles_any_match",
            "command_roles_at_least_n",
            "command_roles_no_conditions",
            "command_roles_continued"
        ],
        embed: 5
    }],
    embeds: [{
        "header": "Example: Help Listing",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T17:45:29.535Z",
        "title": [
            {
                "name": "command_help_command_title",
                "args": {
                    "name": [
                        "Show Server Roles"
                    ]
                }
            }
        ],
        "description": [
            {
                "name": "command_help_command_description",
                "args": {
                    "description": [
                        {
                            "name": "command_roles_description",
                            "args": null
                        }
                    ]
                }
            }
        ],
        "fields": [
            {
                "name": [
                    {
                        "name": "command_help_command_keywords",
                        "args": null
                    }
                ],
                "value": [
                    "`roles`, `config`, `ranks`"
                ]
            }
        ]
    }, {
        "header": "Example: Command used in DMs.",
        "color": 16604252,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T17:47:30.618Z",
        "title": [
            {
                "name": "command_roles_no_server_title",
                "args": null
            }
        ],
        "description": [
            {
                "name": "command_roles_no_server_description",
                "args": null
            }
        ]
    }, {
        "header": "Example: Command used in a server without roles.",
        "color": 16604252,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T17:47:30.618Z",
        "title": [
            {
                "name": "command_roles_no_roles_title",
                "args": null
            }
        ],
        "description": [
            {
                "name": "command_roles_no_roles_description",
                "args": null
            }
        ]
    }, {
        "header": "Example: Ranges",
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
        "timestamp": "2019-12-15T18:04:48.011Z",
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
                        "name": "command_roles_total_mastery_score",
                        "args": {
                            "range": [
                                {
                                    "name": "command_roles_at_least",
                                    "args": {
                                        "value": 1
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
                        "name": "command_roles_total_mastery_score",
                        "args": {
                            "range": [
                                {
                                    "name": "command_roles_at_most",
                                    "args": {
                                        "value": 1000000
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
                        "name": "command_roles_total_mastery_score",
                        "args": {
                            "range": [
                                {
                                    "name": "command_roles_between",
                                    "args": {
                                        "min": 10000,
                                        "max": 25000
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
                        "name": "command_roles_total_mastery_score",
                        "args": {
                            "range": [
                                {
                                    "name": "command_roles_exactly",
                                    "args": {
                                        "value": 123456
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
                                    "name": "command_roles_ranked_tier_higher",
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
                                    "name": "command_roles_ranked_tier_lower",
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
    }, {
        "header": "Example: Conditions",
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
        "timestamp": "2019-12-15T18:12:39.736Z",
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
                        "name": "command_roles_mastery_level",
                        "args": {
                            "range": [
                                {
                                    "name": "command_roles_at_least",
                                    "args": {
                                        "value": 1
                                    }
                                }
                            ],
                            "champion": [
                                "<:Aatrox:469632168130379798> ", { champion: "Aatrox" }
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
                        "name": "command_roles_mastery_score",
                        "args": {
                            "range": [
                                {
                                    "name": "command_roles_at_least",
                                    "args": {
                                        "value": 1000000
                                    }
                                }
                            ],
                            "champion": [
                                "<:Aatrox:469632168130379798> ", { champion: "Aatrox" }
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
                        "name": "command_roles_total_mastery_level",
                        "args": {
                            "range": [
                                {
                                    "name": "command_roles_exactly",
                                    "args": {
                                        "value": 100
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
                        "name": "command_roles_total_mastery_score",
                        "args": {
                            "range": [
                                {
                                    "name": "command_roles_exactly",
                                    "args": {
                                        "value": 123456
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
            },
            {
                "name": [
                    "Gold"
                ],
                "value": [
                    "❌ ",
                    {
                        "name": "command_roles_region",
                        "args": {
                            "region": [
                                "EUW"
                            ]
                        }
                    }
                ]
            }
        ]
    }, {
        "header": "Example: Title and message formatting.",
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
        "timestamp": "2019-12-15T18:12:39.736Z",
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
                    "Gold ",
                    { "name": "command_roles_continued", "args": null }
                ],
                "value": [
                    { "name": "command_roles_all_match", "args": null },
                    "\n❌ ",
                    {
                        "name": "command_roles_mastery_level",
                        "args": {
                            "range": [
                                {
                                    "name": "command_roles_at_least",
                                    "args": {
                                        "value": 1
                                    }
                                }
                            ],
                            "champion": [
                                "<:Aatrox:469632168130379798> ", { champion: "Aatrox" }
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
                    { "name": "command_roles_any_match", "args": null },
                    "\n❌ ",
                    {
                        "name": "command_roles_mastery_level",
                        "args": {
                            "range": [
                                {
                                    "name": "command_roles_at_least",
                                    "args": {
                                        "value": 1
                                    }
                                }
                            ],
                            "champion": [
                                "<:Aatrox:469632168130379798> ", { champion: "Aatrox" }
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
                    { "name": "command_roles_at_least_n", "args": { "amount": 2 } },
                    "\n❌ ",
                    {
                        "name": "command_roles_mastery_level",
                        "args": {
                            "range": [
                                {
                                    "name": "command_roles_at_least",
                                    "args": {
                                        "value": 1
                                    }
                                }
                            ],
                            "champion": [
                                "<:Aatrox:469632168130379798> ", { champion: "Aatrox" }
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
                    { "name": "command_roles_no_conditions", "args": null }
                ]
            }
        ]
    }]
    // </editor-fold>
}, {
    title: "Discord - Command - Stats",
    description: "All the strings used in the stats command.",
    // <editor-fold defaultstate="collapsed" desc="Discord - Command - Stats">
    keyGroups: [{
        keys: [
            "command_stats_small_description",
            "command_stats_description"
        ],
        embed: 0
    }, {
        keys: [
            "command_stats_no_values_title",
            "command_stats_no_values_description"
        ],
        embed: 1
    }, {
        keys: [
            "command_stats_message_title",
            "command_stats_message_data",
            "command_stats_message_data_value",
            "command_stats_message_games",
            "command_stats_message_games_value"
        ],
        embed: 2
    }],
    embeds: [{
        "header": "Example: Help Listing",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T18:23:21.259Z",
        "title": [
            {
                "name": "command_help_command_title",
                "args": {
                    "name": [
                        "Show Stats"
                    ]
                }
            }
        ],
        "description": [
            {
                "name": "command_help_command_description",
                "args": {
                    "description": [
                        {
                            "name": "command_stats_description",
                            "args": null
                        }
                    ]
                }
            }
        ],
        "fields": [
            {
                "name": [
                    {
                        "name": "command_help_command_keywords",
                        "args": null
                    }
                ],
                "value": [
                    "`stats`, `graph`, `chart`, `progression`, `progress`"
                ]
            }
        ]
    }, {
        "header": "Example: No Stats Recorded",
        "color": 16604252,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-17T20:06:40.410Z",
        "title": [
            {
                "name": "command_stats_no_values_title",
                "args": null
            }
        ],
        "description": [
            {
                "name": "command_stats_no_values_description",
                "args": {
                    "user": [
                        "<@!86540964021161984> <a:Bot_Owner:468045368517722153>"
                    ],
                    "champion": [
                        { champion: "Syndra" }
                    ]
                }
            }
        ]
    }, {
        "header": "Example: Plenty of Stats",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-17T20:12:40.420Z",
        "title": [
            {
                "name": "command_stats_message_title",
                "args": {
                    "name": [
                        "molenzwiebel"
                    ],
                    "champion": [
                        { champion: "Velkoz" }
                    ]
                }
            }
        ],
        "fields": [
            {
                "name": [
                    {
                        "name": "command_stats_message_data",
                        "args": null
                    }
                ],
                "value": [
                    {
                        "name": "command_stats_message_data_value",
                        "args": {
                            "numGames": 150,
                            "firstGameDate": [
                                "2017-06-27"
                            ],
                            "lastGameDate": [
                                "2019-04-25"
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
                        "name": "command_stats_message_games",
                        "args": null
                    }
                ],
                "value": [
                    {
                        "name": "command_stats_message_games_value",
                        "args": {
                            "win": 74,
                            "loss": 76,
                            "winrate": [
                                "49.33"
                            ]
                        }
                    },
                    "<:__:447420442819690506>"
                ],
                "inline": true
            }
        ],
        "thumbnail": {
            "url": "https://ddragon.leagueoflegends.com/cdn/9.24.2/img/champion/Velkoz.png"
        },
        "image": {
            "url": "https://cdn.discordapp.com/attachments/460933300769259521/656604703265652736/chart.png",
            "width": 399,
            "height": 250
        }
    }]
    // </editor-fold>
}, {
    title: "Discord - Command - Leaderboard",
    description: "All the strings used in the leaderboard command.",
    // <editor-fold defaultstate="collapsed" desc="Discord - Command - Leaderboard">
    keyGroups: [{
        keys: [
            "command_top_small_description",
            "command_top_description"
        ],
        embed: 0
    }, {
        keys: [
            "command_top_no_server_title",
            "command_top_no_server_description"
        ],
        embed: 1
    }, {
        keys: [
            "command_top_points",
            "command_top_personal_title"
        ],
        embed: 2
    }, {
        keys: [
            "command_top_title",
            "command_top_server_title",
            "command_top_global_title",
            "command_top_global_server_title",
            "command_top_graphic_name",
            "command_top_graphic_score",
            "command_top_rank"
        ],
        embed: 3
    }],
    embeds: [{
        "header": "Example: Help Listing",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-15T18:23:21.259Z",
        "title": [
            {
                "name": "command_help_command_title",
                "args": {
                    "name": [
                        "Show Leaderboards"
                    ]
                }
            }
        ],
        "description": [
            {
                "name": "command_help_command_description",
                "args": {
                    "description": [
                        {
                            "name": "command_top_description",
                            "args": null
                        }
                    ]
                }
            }
        ],
        "fields": [
            {
                "name": [
                    {
                        "name": "command_help_command_keywords",
                        "args": null
                    }
                ],
                "value": [
                    "`top`, `leaderboard`, `leaderboards`, `most`, `highest`"
                ]
            }
        ]
    }, {
        "header": "Example: 'Server' Supplied in DMs",
        "color": 16604252,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                "molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-17T21:23:03.058Z",
        "title": [
            {
                "name": "command_top_no_server_title",
                "args": null
            }
        ],
        "description": [
            {
                "name": "command_top_no_server_description",
                "args": null
            }
        ]
    }, {
        "header": "Example: Personal Top Champions",
        "color": 693982,
        "footer": {
            "icon_url": "https://cdn.discordapp.com/avatars/86540964021161984/a_d53161375302810ca80c12eef8dee291.gif?size=128",
            "text": [
                {
                    "name": "command_page_n_of_n",
                    "args": {
                        "n": 1,
                        "total": 12
                    }
                },
                " • molenzwiebel 👑"
            ]
        },
        "timestamp": "2019-12-17T21:23:42.942Z",
        "title": [
            {
                "name": "command_top_personal_title",
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
                    "**<:Syndra:411977428227850241>  1 - ", { champion: "Syndra" }, "**"
                ],
                "value": [
                    "<:Level_7:411977489707958282> 787,562 ",
                    {
                        "name": "command_top_points",
                        "args": null
                    }
                ],
                "inline": true
            },
            {
                "name": [
                    "**<:Soraka:411977195506892802>  2 - ", { champion: "Soraka" }, "**"
                ],
                "value": [
                    "<:Level_7:411977489707958282> 219,149 ",
                    {
                        "name": "command_top_points",
                        "args": null
                    }
                ],
                "inline": true
            },
            {
                "name": [
                    "**<:Xayah:411977428718714900>  3 - ", { champion: "Xayah" }, "**"
                ],
                "value": [
                    "<:Level_7:411977489707958282> 133,159 ",
                    {
                        "name": "command_top_points",
                        "args": null
                    }
                ],
                "inline": true
            },
            {
                "name": [
                    "**<:Orianna:411977322510680067>  4 - ", { champion: "Orianna" }, "**"
                ],
                "value": [
                    "<:Level_7:411977489707958282> 85,468 ",
                    {
                        "name": "command_top_points",
                        "args": null
                    }
                ],
                "inline": true
            },
            {
                "name": [
                    "**<:Ashe:411977196606062602>  5 - ", { champion: "Ashe" }, "**"
                ],
                "value": [
                    "<:Level_6:411977489351704587> 76,798 ",
                    {
                        "name": "command_top_points",
                        "args": null
                    }
                ],
                "inline": true
            },
            {
                "name": [
                    "**<:Lucian:411977427989037058>  6 - ", { champion: "Lucian" }, "**"
                ],
                "value": [
                    "<:Level_6:411977489351704587> 66,328 ",
                    {
                        "name": "command_top_points",
                        "args": null
                    }
                ],
                "inline": true
            },
            {
                "name": [
                    "**<:Janna:411977195792105484>  7 - ", { champion: "Janna" }, "**"
                ],
                "value": [
                    "<:Level_7:411977489707958282> 56,379 ",
                    {
                        "name": "command_top_points",
                        "args": null
                    }
                ],
                "inline": true
            },
            {
                "name": [
                    "**<:Thresh:411977428291026968>  8 - ", { champion: "Thresh" }, "**"
                ],
                "value": [
                    "<:Level_6:411977489351704587> 48,841 ",
                    {
                        "name": "command_top_points",
                        "args": null
                    }
                ],
                "inline": true
            },
            {
                "name": [
                    "**<:Irelia:469632305699487755>  9 - ", { champion: "Irelia" }, "**"
                ],
                "value": [
                    "<:Level_6:411977489351704587> 44,741 ",
                    {
                        "name": "command_top_points",
                        "args": null
                    }
                ],
                "inline": true
            },
            {
                "name": [
                    "**<:Lulu:411977323529895936>  10 - ", { champion: "Lulu" }, "**"
                ],
                "value": [
                    "<:Level_6:411977489351704587> 44,152 ",
                    {
                        "name": "command_top_points",
                        "args": null
                    }
                ],
                "inline": true
            },
            {
                "name": [
                    "**<:Zyra:411977428378976286>  11 - ", { champion: "Zyra" }, "**"
                ],
                "value": [
                    "<:Level_5:411977803144364032> 41,927 ",
                    {
                        "name": "command_top_points",
                        "args": null
                    }
                ],
                "inline": true
            },
            {
                "name": [
                    "**<:Karma:411977195297439745>  12 - ", { champion: "Karma" }, "**"
                ],
                "value": [
                    "<:Level_5:411977803144364032> 37,420 ",
                    {
                        "name": "command_top_points",
                        "args": null
                    }
                ],
                "inline": true
            }
        ]
    }, {
        "header": "Example: Other Strings",
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
        "description": [
            "Since this is a generated image, I unfortunately cannot display a live preview. Here's some examples of the strings being used though:\n\n",
            {
                "name": "command_top_title",
                "args": {
                    "champ": [
                        { champion: "Syndra" }
                    ]
                }
            },
            "\n",
            {
                "name": "command_top_server_title",
                "args": {
                    "champ": [
                        { champion: "Syndra" }
                    ]
                }
            },
            "\n",
            {
                "name": "command_top_global_title",
                "args": null
            },
            "\n",
            {
                "name": "command_top_global_server_title",
                "args": null
            },
            "\n\nThe following strings are used in the generated image (as column headers):\n",
            {
                "name": "command_top_graphic_name",
                "args": null
            },
            "\n",
            {
                "name": "command_top_graphic_score",
                "args": null
            },
            "\n\nThe following strings are used in the footer:\n",
            {
                "name": "command_top_rank",
                "args": null
            }
        ],
        "timestamp": "2019-12-17T21:24:58.460Z"
    }]
    // </editor-fold>
}];

export default SECTIONS;