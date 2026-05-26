// main bot file, this is where everything starts
// loads all the commands and listens for interactions

const { Client, GatewayIntentBits, Collection, Events, REST, Routes } = require('discord.js')
const fs = require('fs')
const path = require('path')
const { setupRoblox } = require('./roblox')
const { load, save } = require('./store')

// create the discord client
// we only need the Guilds intent since we use slash commands
let client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
})

// this is where we store all the loaded commands
client.commands = new Collection()

// load every command file from the commands folder
let commandFolder = path.join(__dirname, 'commands')
let commandFiles = fs.readdirSync(commandFolder).filter(file => file.endsWith('.js'))

for (let file of commandFiles) {
  let command = require(`./commands/${file}`)

  // make sure the command has data and an execute function
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command)
    console.log('Loaded command:', command.data.name)
  }
}

// registers all slash commands globally with discord
// this runs automatically on startup so you dont have to run deploy.js manually
async function registerCommands() {
  let token = process.env.DISCORD_BOT_TOKEN
  let clientId = process.env.DISCORD_CLIENT_ID

  if (!token || !clientId) {
    console.log('Skipping command registration — DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID is not set.')
    return
  }

  // build the list of commands to register
  let commandData = []
  for (let [name, command] of client.commands) {
    commandData.push(command.data.toJSON())
  }

  let rest = new REST({ version: '10' }).setToken(token)

  try {
    console.log('Registering', commandData.length, 'slash commands with Discord...')
    await rest.put(Routes.applicationCommands(clientId), { body: commandData })
    console.log('Slash commands registered successfully.')
  } catch (err) {
    console.error('Failed to register slash commands:', err.message)
    // not fatal, bot can still run
  }
}

// runs once when the bot connects to discord
client.once(Events.ClientReady, async () => {
  console.log('Bot is online as:', client.user.tag)

  // add the initial owner to wlowners if they arent already there
  if (process.env.INITIAL_OWNER_ID) {
    let data = load()
    if (!data.wlowners.includes(process.env.INITIAL_OWNER_ID)) {
      data.wlowners.push(process.env.INITIAL_OWNER_ID)
      save(data)
      console.log('Added initial owner to whitelist:', process.env.INITIAL_OWNER_ID)
    }
  }

  // register slash commands globally right after the bot comes online
  await registerCommands()
})

// this runs every time someone does a slash command or autocomplete
client.on(Events.InteractionCreate, async interaction => {

  // handle autocomplete separately
  if (interaction.isAutocomplete()) {
    let command = client.commands.get(interaction.commandName)
    if (!command || !command.autocomplete) return

    try {
      await command.autocomplete(interaction)
    } catch (err) {
      console.error('Autocomplete error on', interaction.commandName, '-', err.message)
    }
    return
  }

  // only handle slash commands from here
  if (!interaction.isChatInputCommand()) return

  let command = client.commands.get(interaction.commandName)
  if (!command) return

  // run the command and catch any errors
  try {
    await command.execute(interaction)
  } catch (err) {
    console.error('Error running /' + interaction.commandName + ':', err)

    let errorMsg = { content: 'Something went wrong. Try again.', ephemeral: true }

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMsg)
    } else {
      await interaction.reply(errorMsg)
    }
  }
})

// start everything up
async function start() {
  await setupRoblox()
  await client.login(process.env.DISCORD_BOT_TOKEN)
}

start().catch(err => {
  console.error('Bot failed to start:', err)
  process.exit(1)
})
