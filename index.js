import { Client, GatewayIntentBits, Collection } from "discord.js"
import { readdir } from "fs/promises"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import config from "./src/settings/config.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
})

client.commands = new Collection()

async function loadCommands() {
  const pluginsPath = join(__dirname, "src", "plugins")
  try {
    const commandFiles = await readdir(pluginsPath)
    const jsFiles = commandFiles.filter((file) => file.endsWith(".js"))

    for (const file of jsFiles) {
      const filePath = join(pluginsPath, file)
      const command = await import(`file://${filePath}`)
      const handler = command.default

      if (handler.command && Array.isArray(handler.command)) {
        handler.command.forEach((cmd) => {
          client.commands.set(cmd, handler)
        })
      }
    }
  } catch (error) {
    console.error("Error loading commands:", error)
  }
}

client.once("ready", () => {
  console.log(`Bot is ready! Logged in as ${client.user.tag}`)
  console.log(`Developer: ${config.developer.name} (${config.developer.email})`)
})

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(config.prefix)) return

  const args = message.content.slice(config.prefix.length).trim().split(/ +/)
  const commandName = args.shift().toLowerCase()

  const command = client.commands.get(commandName)
  if (!command) return

  try {
    await command(message, { conn: client })
  } catch (error) {
    console.error("Error executing command:", error)
    message.reply("There was an error executing this command!")
  }
})

await loadCommands()
client.login(config.token)
