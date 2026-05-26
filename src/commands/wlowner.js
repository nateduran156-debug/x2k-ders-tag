// /wlowner command
// manages who has full access to all bot commands
// the initial owner is set from the INITIAL_OWNER_ID env variable
// only existing wlowners can add or remove other wlowners

const {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType
} = require('discord.js')

const { load, save } = require('../store')

// check if someone is a wlowner or the initial bot owner
function isOwner(userId) {
  let data = load()
  let initialOwner = process.env.INITIAL_OWNER_ID

  // the initial owner always has access even before they are in the list
  if (userId === initialOwner) {
    return true
  }

  return data.wlowners.includes(userId)
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wlowner')
    .setDescription('Manage whitelist owners who have full bot access')
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
    .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel])
    .addSubcommand(sub =>
      sub
        .setName('add')
        .setDescription('Give someone full access to the bot')
        .addUserOption(option =>
          option.setName('user').setDescription('The user to add').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remove')
        .setDescription('Remove someones full access to the bot')
        .addUserOption(option =>
          option.setName('user').setDescription('The user to remove').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('See all whitelist owners')
    ),

  async execute(interaction) {
    let userId = interaction.user.id

    // only existing wlowners can use this command
    if (!isOwner(userId)) {
      return interaction.reply({
        content: 'You do not have access to use this command.',
        ephemeral: true
      })
    }

    let sub = interaction.options.getSubcommand()
    let data = load()

    // make sure the initial owner is always in the list
    if (process.env.INITIAL_OWNER_ID && !data.wlowners.includes(process.env.INITIAL_OWNER_ID)) {
      data.wlowners.push(process.env.INITIAL_OWNER_ID)
    }

    if (sub === 'add') {
      let user = interaction.options.getUser('user')

      if (data.wlowners.includes(user.id)) {
        return interaction.reply({
          content: user.username + ' is already a whitelist owner.',
          ephemeral: true
        })
      }

      data.wlowners.push(user.id)
      save(data)

      return interaction.reply({
        content: 'Added ' + user.username + ' as a whitelist owner. They now have full access to all commands.',
        ephemeral: true
      })
    }

    if (sub === 'remove') {
      let user = interaction.options.getUser('user')

      // cant remove the initial owner, they always keep access
      if (user.id === process.env.INITIAL_OWNER_ID) {
        return interaction.reply({
          content: 'You cannot remove the initial bot owner.',
          ephemeral: true
        })
      }

      if (!data.wlowners.includes(user.id)) {
        return interaction.reply({
          content: user.username + ' is not a whitelist owner.',
          ephemeral: true
        })
      }

      data.wlowners = data.wlowners.filter(id => id !== user.id)
      save(data)

      return interaction.reply({
        content: 'Removed ' + user.username + ' from whitelist owners.',
        ephemeral: true
      })
    }

    if (sub === 'list') {
      if (data.wlowners.length === 0) {
        return interaction.reply({
          content: 'No whitelist owners are set right now.',
          ephemeral: true
        })
      }

      let lines = ['**Whitelist Owners:**']
      for (let ownerId of data.wlowners) {
        lines.push('<@' + ownerId + '>')
      }

      return interaction.reply({
        content: lines.join('\n'),
        ephemeral: true
      })
    }
  }
}
