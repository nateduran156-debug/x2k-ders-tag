// this file handles everything roblox related
// uses noblox.js to talk to the roblox api

const noblox = require('noblox.js')
const fetch = require('node-fetch')
const { load } = require('./store')

// validate a cookie directly against the modern roblox api
// noblox.js uses the old mobileapi/userinfo endpoint which roblox often rejects
// this uses the current users api instead and returns the username on success
async function validateCookieDirect(cookie) {
  const res = await fetch('https://users.roblox.com/v1/users/authenticated', {
    headers: {
      cookie: '.ROBLOSECURITY=' + cookie,
      'User-Agent': 'Mozilla/5.0'
    }
  })
  if (res.status === 401 || res.status === 403) {
    throw new Error('Cookie is invalid or expired. Get a fresh .ROBLOSECURITY cookie from your browser and try again.')
  }
  if (!res.ok) {
    throw new Error('Roblox API returned status ' + res.status + '. Try again in a moment.')
  }
  const data = await res.json()
  if (!data.name) {
    throw new Error('Could not read username from Roblox. The cookie may be invalid.')
  }
  return data.name
}

// log into roblox — tries env variable first, then falls back to stored cookie
async function setupRoblox() {
  let cookie = process.env.ROBLOX_COOKIE

  if (!cookie) {
    let data = load()
    cookie = data.robloxCookie
  }

  if (!cookie) {
    console.log('No Roblox cookie found. Run /cookie to set one before using roblox commands.')
    return
  }

  try {
    cookie = cookie.trim()
    // validate using the modern api first
    const username = await validateCookieDirect(cookie)
    // set the cookie in noblox skipping its own (broken) validation
    await noblox.setCookie(cookie, false)
    console.log('Roblox logged in as:', username)
  } catch (err) {
    console.error('Roblox login failed:', err.message)
    console.log('Run /cookie with a valid cookie to fix this.')
  }
}

// re-login to roblox with a new cookie, called after /cookie command
async function reinitRoblox(cookie) {
  cookie = cookie.trim()
  // validate with the modern roblox api (avoids noblox's broken mobileapi/userinfo check)
  const username = await validateCookieDirect(cookie)
  // hand the cookie to noblox, skipping its own validation since we just did it
  await noblox.setCookie(cookie, false)
  console.log('Roblox re-logged in as:', username)
  return username
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
