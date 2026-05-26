// /taglogset command
// sets the channel where tag logs get sent when someone uses /role or /strip
// only works in servers since you need to pick a channel

const {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType
} = require('discord.js')

const { hasAccess } = require('../checks')
const { load, save } = require('../store')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('taglogset')
    .setDescription('Set the channel where tag logs are sent')
    // taglogset only works in servers since channels are server specific
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
    .setContexts([InteractionContextType.Guild])
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The channel to send logs to')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!hasAccess(interaction)) {
      return interaction.reply({
        content: 'You do not have access to use this command.',
        ephemeral: true
      })
    }

    // this should never happen since we set Guild context only, but just in case
    if (!interaction.guildId) {
      return interaction.reply({
        content: 'This command only works in a server.',
        ephemeral: true
      })
    }

    let channel = interaction.options.getChannel('channel')
    let data = load()

    // save the channel id for this server
    data.tagLogChannels[interaction.guildId] = channel.id
    save(data)

    await interaction.reply({
      content: 'Tag logs will now be sent to ' + channel + '.',
      ephemeral: true
    })
  }
}
