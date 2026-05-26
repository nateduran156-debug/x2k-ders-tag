// this is the file that saves and loads all the bot data
// i used a json file because its simple and it works

const fs = require('fs')
const path = require('path')

// where the data file lives
const DATA_FILE = path.join(__dirname, '../data/store.json')

// this is what the data looks like when the bot first starts
const blankData = {
  robloxCookie: null,   // set this using /cookie
  wlowners: [],         // people who have full access to everything
  tmrUsers: [],         // tag managers by user id
  tmrRoles: {},         // tag managers by discord role (per server)
  tagLogChannels: {},   // which channel to send logs to (per server)
  tags: ['x2 red', 'buni tag'] // the default tags
}

// load the data from the file
function load() {
  // if the file doesnt exist yet, make it with the default data
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true })
    fs.writeFileSync(DATA_FILE, JSON.stringify(blankData, null, 2))
    return JSON.parse(JSON.stringify(blankData))
  }

  // read and parse the json file
  let raw = fs.readFileSync(DATA_FILE, 'utf-8')
  return JSON.parse(raw)
}

// save the data back to the file
function save(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

module.exports = { load, save }
