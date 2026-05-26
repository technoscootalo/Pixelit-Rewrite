require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  ActivityType,
  MessageFlags
} = require("discord.js");

const mongoose = require("mongoose");
const crypto = require("crypto");

const AccessKey = require("../backend/models/AccessKey");


mongoose.set("strictQuery", true);
mongoose.set("bufferCommands", false);

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "Pixelit-Rewrite"
    });

    console.log("MongoDB connected (bot)");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}

connectDB();


const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// -------------------- COMMANDS --------------------

const commands = [
  new SlashCommandBuilder()
    .setName("accesskey")
    .setDescription("Generate a secure one-time access key"),

  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check bot latency")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

async function registerCommands() {
  try {
    console.log("Registering slash commands...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("Slash commands registered");
  } catch (err) {
    console.error("Command registration error:", err);
  }
}

registerCommands();

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [
      {
        name: "",
        type: ActivityType.Playing
      }
    ],
    status: "online"
  });
});

// -------------------- COMMAND HANDLER --------------------

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // PING
  if (interaction.commandName === "ping") {
    return interaction.reply({
      content: `Pong: ${client.ws.ping}ms`,
      flags: MessageFlags.Ephemeral
    });
  }

  if (interaction.commandName === "accesskey") {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const key = crypto.randomBytes(32).toString("hex");

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const saved = await AccessKey.create({
        key,
        discordId: interaction.user.id,
        used: false,
        expiresAt
      });

      console.log("Access key created:", saved.key);

      return interaction.editReply(
`━━━━━━━━━━━━━━━━━━
ACCESS KEY GENERATED

${key}

Expires in: 10 minutes
One-time use only
━━━━━━━━━━━━━━━━━━`
      );

    } catch (err) {
      console.error("Access key error:", err);

      if (interaction.deferred) {
        return interaction.editReply("Failed to generate access key.");
      }

      return interaction.reply({
        content: "Failed to generate access key.",
        flags: MessageFlags.Ephemeral
      });
    }
  }
});

client.login(process.env.BOT_TOKEN);