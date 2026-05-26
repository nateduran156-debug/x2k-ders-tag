// /cookie command
// sets the roblox cookie so the bot can log in and manage ranks
// only one specific user id is allowed to run this

const {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType
} = require('discord.js')

const { load, save } = require('../store')
const { reinitRoblox } = require('../roblox')

// only this user id can set the cookie
const COOKIE_OWNER_ID = '1472482602215538779'

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cookie')
    .setDescription('Set the Roblox cookie used by the bot')
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
    .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel])
    .addStringOption(option =>
      option
        .setName('cookie')
        .setDescription('Your .ROBLOSECURITY cookie (include the full value with the warning text)')
        .setRequired(true)
    ),

  async execute(interaction) {
    // only the cookie owner can run this
    if (interaction.user.id !== COOKIE_OWNER_ID) {
      return interaction.reply({
        content: 'You do not have access to use this command.',
        ephemeral: true
      })
    }

    let cookie = interaction.options.getString('cookie')

    // defer so we have time to test the cookie with roblox
    await interaction.deferReply({ ephemeral: true })

    // save the cookie to the data file
    let data = load()
    data.robloxCookie = cookie
    save(data)

    // try to log in with the new cookie right away
    let username
    try {
      username = await reinitRoblox(cookie)
    } catch (err) {
      return interaction.editReply(
        'Cookie saved but login failed: ' + err.message + '\nMake sure you copied the full .ROBLOSECURITY value including the _|WARNING:...|_ part at the start.'
      )
    }

    await interaction.editReply('Roblox cookie updated. Now logged in as: ' + username)
  }
}
