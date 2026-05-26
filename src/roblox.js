// this file handles everything roblox related
// uses noblox.js to talk to the roblox api

const noblox = require('noblox.js')
const { load } = require('./store')

// log into roblox — tries env variable first, then falls back to stored cookie
async function setupRoblox() {
  // check env variable first in case someone wants to use it the old way
  let cookie = process.env.ROBLOX_COOKIE

  // if no env variable, try to load from the saved data file
  if (!cookie) {
    let data = load()
    cookie = data.robloxCookie
  }

  // if still nothing, just warn and move on
  // the bot will still start, you just wont be able to use roblox commands until /cookie is run
  if (!cookie) {
    console.log('No Roblox cookie found. Run /cookie to set one before using roblox commands.')
    return
  }

  try {
    await noblox.setCookie(cookie)
    let me = await noblox.getCurrentUser()
    console.log('Roblox logged in as:', me.UserName)
  } catch (err) {
    console.error('Roblox login failed:', err.message)
    console.log('Run /cookie with a valid cookie to fix this.')
    // dont exit, let the bot stay online so /cookie can be used to fix it
  }
}

// re-login to roblox with a new cookie
// called after someone uses /cookie
async function reinitRoblox(cookie) {
  await noblox.setCookie(cookie)
  let me = await noblox.getCurrentUser()
  console.log('Roblox re-logged in as:', me.UserName)
  return me.UserName
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
  reinitRoblox,
  getIdFromUsername,
  setGroupRank,
  getCurrentRankName,
  getAvatarUrl,
  getUsernameFromId
}
