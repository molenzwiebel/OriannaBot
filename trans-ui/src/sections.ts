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
    // </editor-fold>
}, {
    title: "Common - Misc",
    description: "Miscellaneous strings that didn't really fit anywhere else.",
    // <editor-fold defaultstate="collapsed" desc="Common - Misc">
    keyGroups: [{
        keys: ["command_page_n_of_n"],
        embed: 0
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
}];

export default SECTIONS;