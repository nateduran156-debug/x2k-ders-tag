// this file handles everything roblox related
// uses noblox.js to talk to the roblox api

const noblox = require('noblox.js')

// log into roblox using the cookie from env variables
async function setupRoblox() {
  try {
    await noblox.setCookie(process.env.ROBLOX_COOKIE)
    let me = await noblox.getCurrentUser()
    console.log('Roblox logged in as:', me.UserName)
  } catch (err) {
    console.error('Roblox login failed:', err.message)
    // cant run the bot without roblox access so just exit
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
