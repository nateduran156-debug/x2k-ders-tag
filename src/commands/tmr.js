// /tmr command (tag manager role)
// lets wlowners add or remove people/roles that can use the bot
// can have up to 10 roles per server and up to 20 users globally

const {
  SlashCommandBuilder,
  ApplicationIntegrationType,
  InteractionContextType
} = require('discord.js')

const { hasAccess } = require('../checks')
const { load, save } = require('../store')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tmr')
    .setDescription('Manage who can use the bot as a tag manager')
    .setIntegrationTypes([ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall])
    .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel])
    .addSubcommand(sub =>
      sub
        .setName('add-role')
        .setDescription('Add a Discord role as a tag manager (max 10 per server)')
        .addRoleOption(option =>
          option.setName('role').setDescription('The role to add').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remove-role')
        .setDescription('Remove a Discord role from tag managers')
        .addRoleOption(option =>
          option.setName('role').setDescription('The role to remove').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('add-user')
        .setDescription('Add a user as a tag manager (max 20 globally)')
        .addUserOption(option =>
          option.setName('user').setDescription('The user to add').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('remove-user')
        .setDescription('Remove a user from tag managers')
        .addUserOption(option =>
          option.setName('user').setDescription('The user to remove').setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('See all current tag managers')
    ),

  async execute(interaction) {
    // only wlowners can change who is a tag manager
    if (!hasAccess(interaction, true)) {
      return interaction.reply({
        content: 'You do not have access to use this command.',
        ephemeral: true
      })
    }

    let sub = interaction.options.getSubcommand()
    let data = load()
    let guildId = interaction.guildId

    // adding a role as a tag manager
    if (sub === 'add-role') {
      if (!guildId) {
        return interaction.reply({
          content: 'This subcommand only works in a server.',
          ephemeral: true
        })
      }

      let role = interaction.options.getRole('role')

      // set up the roles array for this server if it doesnt exist yet
      if (!data.tmrRoles[guildId]) {
        data.tmrRoles[guildId] = []
      }

      // check if we are at the limit
      if (data.tmrRoles[guildId].length >= 10) {
        return interaction.reply({
          content: 'You already have 10 tag manager roles for this server. Remove one first.',
          ephemeral: true
        })
      }

      // check for duplicates
      if (data.tmrRoles[guildId].includes(role.id)) {
        return interaction.reply({
          content: role.name + ' is already a tag manager role.',
          ephemeral: true
        })
      }

      data.tmrRoles[guildId].push(role.id)
      save(data)
      return interaction.reply({
        content: 'Added ' + role.name + ' as a tag manager role.',
        ephemeral: true
      })
    }

    // removing a role from tag managers
    if (sub === 'remove-role') {
      if (!guildId) {
        return interaction.reply({
          content: 'This subcommand only works in a server.',
          ephemeral: true
        })
      }

      let role = interaction.options.getRole('role')

      if (!data.tmrRoles[guildId] || !data.tmrRoles[guildId].includes(role.id)) {
        return interaction.reply({
          content: role.name + ' is not a tag manager role.',
          ephemeral: true
        })
      }

      data.tmrRoles[guildId] = data.tmrRoles[guildId].filter(r => r !== role.id)
      save(data)
      return interaction.reply({
        content: 'Removed ' + role.name + ' from tag manager roles.',
        ephemeral: true
      })
    }

    // adding a user as a tag manager
    if (sub === 'add-user') {
      let user = interaction.options.getUser('user')

      // check global user limit
      if (data.tmrUsers.length >= 20) {
        return interaction.reply({
          content: 'You already have 20 tag manager users. Remove one first.',
          ephemeral: true
        })
      }

      if (data.tmrUsers.includes(user.id)) {
        return interaction.reply({
          content: user.username + ' is already a tag manager.',
          ephemeral: true
        })
      }

      data.tmrUsers.push(user.id)
      save(data)
      return interaction.reply({
        content: 'Added ' + user.username + ' as a tag manager.',
        ephemeral: true
      })
    }

    // removing a user from tag managers
    if (sub === 'remove-user') {
      let user = interaction.options.getUser('user')

      if (!data.tmrUsers.includes(user.id)) {
        return interaction.reply({
          content: user.username + ' is not a tag manager.',
          ephemeral: true
        })
      }

      data.tmrUsers = data.tmrUsers.filter(u => u !== user.id)
      save(data)
      return interaction.reply({
        content: 'Removed ' + user.username + ' from tag managers.',
        ephemeral: true
      })
    }

    // list all current tag managers
    if (sub === 'list') {
      let lines = []

      // show roles for this server if we are in one
      if (guildId && data.tmrRoles[guildId] && data.tmrRoles[guildId].length > 0) {
        lines.push('**Tag Manager Roles (this server):**')
        for (let roleId of data.tmrRoles[guildId]) {
          lines.push('<@&' + roleId + '>')
        }
      } else {
        lines.push('No tag manager roles set for this server.')
      }

      lines.push('')

      // show global user list
      if (data.tmrUsers.length > 0) {
        lines.push('**Tag Manager Users (global):**')
        for (let userId of data.tmrUsers) {
          lines.push('<@' + userId + '>')
        }
      } else {
        lines.push('No tag manager users set.')
      }

      return interaction.reply({
        content: lines.join('\n'),
        ephemeral: true
      })
    }
  }
}
