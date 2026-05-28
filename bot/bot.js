require("dotenv").config();
const bcrypt = require("bcrypt");

const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  ActivityType,
  MessageFlags,
  EmbedBuilder
} = require("discord.js");

const mongoose = require("mongoose");
const crypto = require("crypto");

const User = require("../backend/models/User"); 
const AccessKey = require("../backend/models/AccessKey");
const Blook = require("../backend/models/Blook");

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
    .setDescription("Check bot latency"),

  new SlashCommandBuilder()
    .setName("login")
    .setDescription("Link your Pixelit account to Discord")
    .addStringOption(option => 
      option.setName("username")
        .setDescription("Your Pixelit username")
        .setRequired(true))
    .addStringOption(option => 
      option.setName("password")
        .setDescription("Your Pixelit password")
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName("logout")
    .setDescription("Unlink your Discord account from your Pixelit account"),

  new SlashCommandBuilder()
  .setName("pixel")
  .setDescription("Get information about a specific Pixel")
  .addStringOption(option => 
    option.setName("name")
      .setDescription("The exact name of the Pixel")
      .setRequired(true)),

  new SlashCommandBuilder()
    .setName("user")
    .setDescription("Search for a Pixelit user by username")
    .addStringOption(option => 
      option.setName("username")
        .setDescription("The Pixelit username to search for")
        .setRequired(true)
    ) //
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
  console.log(`Bot is active and ready to serve.`);

  const activities = [
    { name: "Playing with the Pixelit API", type: ActivityType.Playing },
    { name: "/login to link account", type: ActivityType.Listening }
  ];

  let i = 0;
  setInterval(() => {
    client.user.setPresence({
      activities: [activities[i]],
      status: "online"
    });
    i = (i + 1) % activities.length;
  }, 30000); 
});

// -------------------- COMMAND HANDLER --------------------

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "ping") {
      return interaction.reply({
      content: `Pong: ${client.ws.ping}ms`,
      flags: MessageFlags.Ephemeral
    });
  }


  if (interaction.commandName === "login") {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  
    const username = interaction.options.getString("username");
    const password = interaction.options.getString("password");

    try {
      const user = await User.findOne({ username: new RegExp(`^${username}$`, "i") });


      const isMatch = user ? await bcrypt.compare(password, user.password) : false;

      if (!isMatch) {
        return interaction.editReply("Invalid username or password.");
      }

      user.discordId = interaction.user.id;
      await user.save();

      return interaction.editReply(`Success! Account **${user.username}** is now linked to your Discord.`);
    }   catch (err) {
      console.error("Login command error:", err);
      return interaction.editReply("Server error. Try again later.");
    }
  }


  if (interaction.commandName === "logout") {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const user = await User.findOne({ discordId: interaction.user.id });

      if (!user) {
        return interaction.editReply("You do not have a Pixelit account linked to this Discord.");
      }

      user.discordId = null;
      await user.save();

      return interaction.editReply("Success! Your Discord account has been unlinked from your Pixelit account.");
    } catch (err) {
      console.error("Logout error:", err);
      return interaction.editReply("An error occurred while logging out. Try again later.");
    }
  }


  if (interaction.commandName === "user") {
    await interaction.deferReply();
  
    const query = interaction.options.getString("username");
  
    try {
      const user = await User.findOne({ username: new RegExp(`^${query}$`, "i") });

      if (!user) {
        return interaction.editReply(`Could not find a user named **${query}**.`);
      }

      const discordStatus = user.discordId 
        ? `<@${user.discordId}>` 
        : "Not Linked";

      const embed = new EmbedBuilder()
        .setColor(0x6f057a)
        .setTitle(`${user.username}'s Profile`)
        .setThumbnail(user.pfp)
        .addFields(
          { name: "Role", value: user.role, inline: true },
          { name: "Discord", value: discordStatus, inline: true },
          { name: "Tokens", value: user.tokens.toLocaleString(), inline: true },
          { name: "Packs Opened", value: user.opened.toString(), inline: true },
          { name: "Messages Sent", value: user.sent.toString(), inline: true },
          { name: "Join Date", value: new Date(user.joinDate).toLocaleDateString(), inline: true }
        )
        .setFooter({ text: `User ID: ${user.id}` });

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("User search error:", err);
      return interaction.editReply("An error occurred while searching for the user.");
    }
  } 

  if (interaction.commandName === "pixel") {
    await interaction.deferReply();
  
    const query = interaction.options.getString("name");
  
    try {
      const blook = await Blook.findOne({ blookName: new RegExp(`^${query}$`, "i") });

      if (!blook) {
        return interaction.editReply(`Could not find a Pixel named **${query}**.`);
      }

      const embed = new EmbedBuilder()
        .setColor(0x6f057a)
        .setTitle(`${blook.blookName}`)
        .setThumbnail(blook.imageUrl)
        .addFields(
          { name: "Rarity", value: blook.rarity || "Unknown", inline: true },
          { name: "Price", value: `${blook.price || 0} Tokens`, inline: true },
          { name: "Drop Chance", value: `${blook.chance || 0}%`, inline: true }
        )
        .setFooter({ text: `ID: ${blook._id}` });

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error("Pixel command error:", err);
      return interaction.editReply("An error occurred while fetching Pixel data.");
    }
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