// /addtag command
// adds a roblox group role name to the tag list
// only wlowners can do this since it changes what everyone can use

const {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType
} = require('discord.js')

const { hasAccess } = require('../checks')
const { load, save } = require('../store')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addtag')
    .setDescription('Add a Roblox group role name to the tag list')
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
    .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel])
    .addStringOption(option =>
      option
        .setName('role_name')
        .setDescription('The exact Roblox group role name to add as a tag')
        .setRequired(true)
    ),

  async execute(interaction) {
    // this command is wlowner only
    if (!hasAccess(interaction, true)) {
      return interaction.reply({
        content: 'You do not have access to use this command.',
        ephemeral: true
      })
    }

    let roleName = interaction.options.getString('role_name')
    let data = load()

    // check if the tag already exists so we dont add duplicates
    if (data.tags.includes(roleName)) {
      return interaction.reply({
        content: roleName + ' is already in the tag list.',
        ephemeral: true
      })
    }

    // add it to the list and save
    data.tags.push(roleName)
    save(data)

    await interaction.reply({
      content: 'Added ' + roleName + ' to the tag list. It will now show up in /role.',
      ephemeral: true
    })
  }
}
