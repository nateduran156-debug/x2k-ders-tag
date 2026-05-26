// /strip command
// removes a roblox users current rank and sets them to Member
// logs what happened to the tag log channel just like /role does

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ApplicationIntegrationType,
  InteractionContextType
} = require('discord.js')

const { hasAccess } = require('../checks')
const { load } = require('../store')
const { getIdFromUsername, setGroupRank, getAvatarUrl, getCurrentRankName } = require('../roblox')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('strip')
    .setDescription('Remove a Roblox users rank and set them to Member')
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
    .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel])
    .addStringOption(option =>
      option
        .setName('roblox_username')
        .setDescription('The Roblox username of the person to strip')
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!hasAccess(interaction)) {
      return interaction.reply({
        content: 'You do not have access to use this command.',
        ephemeral: true
      })
    }

    let username = interaction.options.getString('roblox_username')

    // defer since the roblox api takes a moment
    await interaction.deferReply({ ephemeral: true })

    // find the roblox user
    let userId
    try {
      userId = await getIdFromUsername(username)
    } catch (err) {
      return interaction.editReply('Could not find a Roblox user with the username: ' + username)
    }

    // try to get their current rank before we remove it, for the log
    let previousRank = 'Unknown'
    try {
      previousRank = await getCurrentRankName(userId)
    } catch (err) {
      // not the end of the world if this fails, we still strip them
      console.log('Could not get current rank for', username)
    }

    // set them to Member
    try {
      await setGroupRank(userId, 'Member')
    } catch (err) {
      return interaction.editReply(
        'Failed to strip ' + username + '. Make sure there is a rank called "Member" in the group.\nError: ' + err.message
      )
    }

    // get their avatar for the embed
    let avatarUrl = await getAvatarUrl(userId)

    // confirm to whoever ran the command
    await interaction.editReply('Done. Stripped ' + username + ' and set them to Member.')

    // send a log to the tag log channel if one is set
    let data = load()
    let guildId = interaction.guildId
    if (guildId && data.tagLogChannels[guildId]) {
      try {
        let channel = await interaction.client.channels.fetch(data.tagLogChannels[guildId])
        let embed = makeStripEmbed(username, previousRank, interaction.user, avatarUrl)
        await channel.send({ embeds: [embed] })
      } catch (err) {
        console.error('Could not send strip log:', err.message)
      }
    }
  }
}

// builds the white embed for the strip log
function makeStripEmbed(robloxUsername, previousRank, strippedBy, avatarUrl) {
  let embed = new EmbedBuilder()
    .setColor(0xFFFFFF)
    .setTitle('Rank Stripped')
    .addFields(
      { name: 'Roblox User', value: robloxUsername, inline: true },
      { name: 'Previous Rank', value: previousRank, inline: true },
      { name: 'New Rank', value: 'Member', inline: true },
      { name: 'Stripped By', value: (strippedBy.tag || strippedBy.username) + ' (' + strippedBy.id + ')', inline: false }
    )
    .setTimestamp()

  // roblox avatar goes in the top right corner of the embed
  if (avatarUrl) {
    embed.setThumbnail(avatarUrl)
  }

  return embed
}
