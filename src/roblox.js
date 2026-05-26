// this file handles everything roblox related
// uses noblox.js to talk to the roblox api

const noblox = require('noblox.js')

// log into roblox using the cookie from env variables
async function setupRoblox() {
  let cookie = process.env.ROBLOX_COOKIE

  // debug log so we can tell if the env variable is actually being read
  if (!cookie) {
    console.error('ROBLOX_COOKIE environment variable is not set or is empty.')
    console.error('Make sure the variable name is exactly "ROBLOX_COOKIE" with no spaces or typos.')
    process.exit(1)
  }

  console.log('ROBLOX_COOKIE is set. Length:', cookie.length, 'chars')
  console.log('Cookie starts with:', cookie.substring(0, 30) + '...')

  // noblox expects the full cookie including the WARNING text
  // if it doesnt start with _|WARNING it might be the wrong value
  if (!cookie.startsWith('_|WARNING')) {
    console.warn('Warning: Cookie does not start with _|WARNING. Make sure you copied the full .ROBLOSECURITY value.')
  }

  try {
    await noblox.setCookie(cookie)
    let me = await noblox.getCurrentUser()
    console.log('Roblox logged in as:', me.UserName)
  } catch (err) {
    console.error('Roblox login failed:', err.message)
    console.error('Double check that the cookie is the .ROBLOSECURITY value from roblox.com and that you are currently logged in on that account.')
    process.exit(1)
  }
}

// get a roblox user id from their username
async function getIdFromUsername(username) {
  let id = await noblox.getIdFromUsername(username)
  return id
}

// set someone's rank in the group by rank name
async function setGroupRank(userId, rankName) {
  let groupId = parseInt(process.env.ROBLOX_GROUP_ID)
  await noblox.setRank(groupId, userId, rankName)
}

// get what rank name someone currently has in the group
async function getCurrentRankName(userId) {
  let groupId = parseInt(process.env.ROBLOX_GROUP_ID)
  let rankName = await noblox.getRankNameInGroup(groupId, userId)
  return rankName
}

// get the avatar headshot url for a roblox user
// returns null if it fails, not a big deal
async function getAvatarUrl(userId) {
  try {
    let thumbs = await noblox.getPlayerThumbnail(
      [userId],
      '150x150',
      'png',
      false,
      'headshot'
    )
    return thumbs?.[0]?.imageUrl || null
  } catch (err) {
    console.log('Could not get avatar for user', userId, '-', err.message)
    return null
  }
}

// get a username from a user id, used for display purposes
async function getUsernameFromId(userId) {
  try {
    let username = await noblox.getUsernameFromId(userId)
    return username
  } catch (err) {
    return null
  }
}

module.exports = {
  setupRoblox,
  getIdFromUsername,
  setGroupRank,
  getCurrentRankName,
  getAvatarUrl,
  getUsernameFromId
}
