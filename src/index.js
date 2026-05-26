// main bot file, this is where everything starts
// loads all the commands and listens for interactions

const { Client, GatewayIntentBits, Collection, Events } = require('discord.js')
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
