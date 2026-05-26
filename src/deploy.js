// run this file once to register all the slash commands globally
// you only need to run this when you add or change commands
// command: node src/deploy.js

const { REST, Routes } = require('discord.js')
const fs = require('fs')
const path = require('path')

// load env variables from .env file if it exists
try {
  require('dotenv').config({ path: path.join(__dirname, '../.env') })
} catch {
  // dotenv is optional, secrets can come from the environment directly
}

let token = process.env.DISCORD_BOT_TOKEN
let clientId = process.env.DISCORD_CLIENT_ID

// make sure we have what we need before doing anything
if (!token) {
  console.error('Missing DISCORD_BOT_TOKEN. Add it to your environment variables.')
  process.exit(1)
}
if (!clientId) {
  console.error('Missing DISCORD_CLIENT_ID. Add it to your environment variables.')
  process.exit(1)
}

// load all the command definitions
let commands = []
let commandFolder = path.join(__dirname, 'commands')
let commandFiles = fs.readdirSync(commandFolder).filter(file => file.endsWith('.js'))

for (let file of commandFiles) {
  let command = require(`./commands/${file}`)
  if (command.data) {
    commands.push(command.data.toJSON())
    console.log('Queued command for deploy:', command.data.name)
  }
}

// set up the rest client to talk to discord
let rest = new REST({ version: '10' }).setToken(token)

// send the commands to discord
;(async () => {
  try {
    console.log('Deploying', commands.length, 'slash commands globally...')

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands }
    )

    console.log('Done. Commands deployed globally.')
    console.log('Note: It can take up to 1 hour for commands to show up everywhere.')
  } catch (err) {
    console.error('Deploy failed:', err.message)
    process.exit(1)
  }
})()
