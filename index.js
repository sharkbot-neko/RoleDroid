const { Client, Events, GatewayIntentBits, MessageFlags, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, Colors, SlashCommandBuilder, PermissionFlagsBits, REST, Routes, ButtonStyle } = require('discord.js');
const { token, clientid } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const create_command = new SlashCommandBuilder()
            .setName('create')
            .setDescription('ロールパネルを作成します。')
            .addStringOption(option=>
                option
                .setName("タイトル")
                .setDescription("タイトル")
                .setRequired(true))
            .addRoleOption(option=>
                option
                .setName("ロール1")
                .setDescription("ロール1")
                .setRequired(true))
            .addRoleOption(option=>
                option
                .setName("ロール2")
                .setDescription("ロール2"))
            .addRoleOption(option=>
                option
                .setName("ロール3")
                .setDescription("ロール3"))
            .addRoleOption(option=>
                option
                .setName("ロール4")
                .setDescription("ロール4"))
            .addRoleOption(option=>
                option
                .setName("ロール5")
                .setDescription("ロール5"));

client.on(Events.ClientReady, async () => {
    const data = [
        create_command.toJSON()
    ];

    const rest = new REST({ version: '10' }).setToken(token);

    await rest.put(
        Routes.applicationCommands(clientid),
        { body: data },
    );

    console.log('起動しました。')
})

client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isChatInputCommand()) {
        if (interaction.commandName == "create") {
            if (!interaction.channel) return;
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                await interaction.reply({flags: [MessageFlags.Ephemeral], content: "ロールの管理権限が必要です。"});
                return;
            }

            if (interaction.channel.type != ChannelType.GuildText) {
                await interaction.reply({flags: [MessageFlags.Ephemeral], content: "テキストチャンネルでのみ使用できます。"});
            };
            await interaction.deferReply({flags: [MessageFlags.Ephemeral]});
            try {
                const roles = [
                    interaction.options.getRole("ロール1"),
                    interaction.options.getRole("ロール2"),
                    interaction.options.getRole("ロール3"),
                    interaction.options.getRole("ロール4"),
                    interaction.options.getRole("ロール5")
                ].filter(role=>role!==null);

                let mentions = [];
                roles.map((r, i) => {
                    mentions.push(`<@&${r.id}>`)
                })

                let acl = new ActionRowBuilder();
                roles.map((r, i) => {
                    acl.addComponents(new ButtonBuilder({
                        label: r.name,
                        custom_id: `rp_${r.id}`,
                        style: ButtonStyle.Secondary
                    }));
                })

                const embed = new EmbedBuilder({
                    title: interaction.options.getString('タイトル', true),
                    fields: [
                        {
                            name: "ロール一覧",
                            value: mentions.join('\n'),
                            inline: false
                        }
                    ],
                    color: Colors.Green
                })
                await interaction.channel.send({
                    embeds: [embed],
                    components: [acl]
                })
            } catch (e) {
                await interaction.editReply({flags: [MessageFlags.Ephemeral], content: "エラーが発生しました"});
                console.log(e);
                return;
            };
            await interaction.editReply({flags: [MessageFlags.Ephemeral], content: "作成しました。"});
        }
    } else if (interaction.isButton()) {
        try {
            const customId = interaction.customId;
            if (!customId.startsWith('rp_')) return;

            await interaction.deferReply({flags: [MessageFlags.Ephemeral]});

            const r_id = customId.split('rp_')[1];

            const role = interaction.guild.roles.cache.get(r_id);

            if (!role) {
                await interaction.editReply({
                    flags: [MessageFlags.Ephemeral],
                    content: "ロールが見つかりません。"
                })
                return;
            };

            if (!role.editable) {
                await interaction.editReply({
                    flags: [MessageFlags.Ephemeral],
                    content: "そのロールは付与できません。"
                })
                return;
            };

            const member = interaction.guild.members.cache.get(interaction.user.id);
            const hasRole = member.roles.cache.some(role => role.id === r_id);

            if (hasRole) {
                await member.roles.remove(role);

                await interaction.editReply({
                    flags: [MessageFlags.Ephemeral],
                    content: "ロールを剥奪しました。"
                })
            } else {
                await member.roles.add(role);

                await interaction.editReply({
                    flags: [MessageFlags.Ephemeral],
                    content: "ロールを追加しました。"
                })
            }
        } catch (e) {
            await interaction.editReply({
                flags: [MessageFlags.Ephemeral],
                content: "エラーが発生しました"
            })
            console.log(e)
            return;
        }
    }
});

client.login(token);