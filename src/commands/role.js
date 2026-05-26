// /role command
// lets whitelisted users set a roblox users rank in the group
// the tag shows up as an autocomplete dropdown pulled from the tag list

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ApplicationIntegrationType,
  InteractionContextType
} = require('discord.js')

const { hasAccess } = require('../checks')
const { load } = require('../store')
const { getIdFromUsername, setGroupRank, getAvatarUrl } = require('../roblox')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Set a Roblox users rank in the group')
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
    .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel])
    .addStringOption(option =>
      option
        .setName('roblox_username')
        .setDescription('The Roblox username of the person')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('tag')
        .setDescription('The tag to give them')
        .setRequired(true)
        .setAutocomplete(true) // this makes it show a dropdown menu
    ),

  // this runs when someone starts typing in the tag field
  // shows the available tags as a dropdown
  async autocomplete(interaction) {
    let data = load()
    let typed = interaction.options.getFocused().toLowerCase()

    // filter the tag list to match what they typed
    let matches = data.tags.filter(tag => tag.toLowerCase().includes(typed))

    await interaction.respond(
      matches.slice(0, 25).map(tag => ({ name: tag, value: tag }))
    )
  },

  // this runs when someone actually submits the command
  async execute(interaction) {
    // check if they are allowed to use this
    if (!hasAccess(interaction)) {
      return interaction.reply({
        content: 'You do not have access to use this command.',
        ephemeral: true
      })
    }

    let username = interaction.options.getString('roblox_username')
    let tag = interaction.options.getString('tag')
    let data = load()

    // make sure the tag they picked actually exists
    if (!data.tags.includes(tag)) {
      return interaction.reply({
        content: tag + ' is not a valid tag. Use /addtag to add it first.',
        ephemeral: true
      })
    }

    // defer the reply since the roblox api can take a second
    await interaction.deferReply({ ephemeral: true })

    // try to find the roblox user
    let userId
    try {
      userId = await getIdFromUsername(username)
    } catch (err) {
      return interaction.editReply('Could not find a Roblox user with that username: ' + username)
    }

    // try to set their rank
    try {
      await setGroupRank(userId, tag)
    } catch (err) {
      return interaction.editReply(
        'Failed to set the rank for ' + username + '. Make sure the tag name matches a rank in the group exactly.\nError: ' + err.message
      )
    }

    // grab their avatar for the log embed
    let avatarUrl = await getAvatarUrl(userId)

    // tell the person who ran the command it worked
    await interaction.editReply('Done. Set ' + username + ' to ' + tag + '.')

    // send a log if a log channel is configured for this server
    let guildId = interaction.guildId
    if (guildId && data.tagLogChannels[guildId]) {
      try {
        let channel = await interaction.client.channels.fetch(data.tagLogChannels[guildId])
        let embed = makeTagEmbed(username, tag, interaction.user, avatarUrl)
        await channel.send({ embeds: [embed] })
      } catch (err) {
        console.error('Could not send tag log:', err.message)
      }
    }
  }
}

// builds the white embed that gets sent to the log channel
function makeTagEmbed(robloxUsername, tag, tagger, avatarUrl) {
  let embed = new EmbedBuilder()
    .setColor(0xFFFFFF)
    .setTitle('Tag Assigned')
    .addFields(
      { name: 'Roblox User', value: robloxUsername, inline: true },
      { name: 'Tag Assigned', value: tag, inline: true },
      { name: 'Given By', value: (tagger.tag || tagger.username) + ' (' + tagger.id + ')', inline: false }
    )
    .setTimestamp()

  // add their roblox avatar to the top right of the embed
  if (avatarUrl) {
    embed.setThumbnail(avatarUrl)
  }

  return embed
}
