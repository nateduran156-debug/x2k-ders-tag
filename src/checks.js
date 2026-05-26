// this file checks if someone is allowed to use the bot
// pretty much everyone is blocked unless they are whitelisted

const { load } = require('./store')

// returns true if the user can use the bot, false if they cant
// if requireOwner is true, only wlowners can pass
function hasAccess(interaction, requireOwner = false) {
  let userId = interaction.user.id
  let member = interaction.member
  let data = load()

  // wlowners can do anything, check them first
  if (data.wlowners.includes(userId)) {
    return true
  }

  // if the person has discord admin perms and isnt a wlowner, block them
  // this is so random server admins cant use the bot
  if (member && member.permissions && member.permissions.has('Administrator')) {
    return false
  }

  // if the command needs wlowner only, stop here
  if (requireOwner) {
    return false
  }

  // check if the user is a tag manager by their user id
  if (data.tmrUsers.includes(userId)) {
    return true
  }

  // check if the user has a tag manager role in this server
  if (member && interaction.guildId && data.tmrRoles[interaction.guildId]) {
    let theirRoles = [...member.roles.cache.keys()]
    let managerRoles = data.tmrRoles[interaction.guildId]

    // see if any of their roles match a tag manager role
    let hasManagerRole = theirRoles.some(r => managerRoles.includes(r))
    if (hasManagerRole) {
      return true
    }
  }

  // if nothing matched, they dont have access
  return false
}

module.exports = { hasAccess }
