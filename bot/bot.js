require("dotenv").config();
const bcrypt = require("bcrypt");

const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  ActivityType,
  Events,
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

const badgeDiscordRoleMap = {
  Verified: "1276629833429946439",
  Owner: "1276630724417683487",
  Developer: "1398820249872367706",
  Artist: "1276630784001708132",
  "Community Manager": "1276629987046461580",
  Admin: "1276630172472180746",
  Moderator: "1276630034441961505",
  Tester: "1276629928141520906",
  Veteran: "1507439050078945290",
  Plus: "1512190823880593628",
  OG: "1276629902308802601"
};

function getDiscordRoleIdsForUser(user) {
  if (!Array.isArray(user.badges)) return [];

  const roleIds = new Set();
  for (const badge of user.badges) {
    const badgeName = typeof badge.name === "string" ? badge.name.trim() : "";
    const roleId = badgeDiscordRoleMap[badgeName];
    if (roleId) {
      roleIds.add(roleId);
    }
  }

  return [...roleIds];
}

const boosterBadgeId = "689d377805836f5839186cc1";
const boosterBadgeImage = "https://izumiihd.github.io/pixelitcdn/assets/img/badges/Booster.png";

function createBoosterBadge() {
  return {
    badgeId: boosterBadgeId,
    _id: new mongoose.Types.ObjectId(boosterBadgeId),
    name: "Booster",
    image: boosterBadgeImage
  };
}

function hasBoosterBadge(user) {
  if (!Array.isArray(user.badges)) return false;
  return user.badges.some(b => {
    if (!b) return false;
    const id = b._id ? String(b._id) : "";
    const name = typeof b.name === "string" ? b.name : "";
    return id === boosterBadgeId || name === "Booster";
  });
}

function syncBoosterBadge(user, isBoosting) {
  if (!user || !Array.isArray(user.badges)) return;

  const hasBadge = hasBoosterBadge(user);

  if (isBoosting && !hasBadge) {
    user.badges.push(createBoosterBadge());
  }

  if (!isBoosting && hasBadge) {
    user.badges = user.badges.filter(b => {
      if (!b) return false;
      const id = b._id ? String(b._id) : "";
      const name = typeof b.name === "string" ? b.name : "";
      return id !== boosterBadgeId && name !== "Booster";
    });
  }
}

async function syncDiscordBadgeRoles(member, desiredRoleIds) {
  if (!member) return;
  const botMember = member.guild.members.me;
  if (!botMember) return;

  const allBadgeRoleIds = Object.values(badgeDiscordRoleMap);
  const botHighestPosition = botMember.roles.highest.position;

  const manageableDesiredRoleIds = desiredRoleIds.filter(roleId => {
    const role = member.guild.roles.cache.get(roleId);
    return role && role.position < botHighestPosition;
  });

  const unmanageableRoleIds = desiredRoleIds.filter(roleId => !manageableDesiredRoleIds.includes(roleId));
  if (unmanageableRoleIds.length) {
    console.warn("Cannot manage these badge roles due to role position:", unmanageableRoleIds);
  }

  const rolesToAdd = manageableDesiredRoleIds.filter(roleId => !member.roles.cache.has(roleId));
  const rolesToRemove = allBadgeRoleIds.filter(roleId => {
    const role = member.guild.roles.cache.get(roleId);
    return role && role.position < botHighestPosition && member.roles.cache.has(roleId) && !manageableDesiredRoleIds.includes(roleId);
  });

  if (rolesToAdd.length) {
    await member.roles.add(rolesToAdd).catch(err => {
      console.error("Failed to add badge roles:", err);
    });
  }

  if (rolesToRemove.length) {
    await member.roles.remove(rolesToRemove).catch(err => {
      console.error("Failed to remove stale badge roles:", err);
    });
  }
}

async function syncUserDiscordRoles(user) {
  if (!user || !user.discordId) return;
  const guild = client.guilds.cache.get(process.env.GUILD_ID) || await client.guilds.fetch(process.env.GUILD_ID).catch(() => null);
  if (!guild) return;

  const member = await guild.members.fetch(user.discordId).catch(() => null);
  if (!member) return;

  const desiredRoleIds = getDiscordRoleIdsForUser(user);
  await syncDiscordBadgeRoles(member, desiredRoleIds);
}

function shouldSyncUserChange(change) {
  if (change.operationType !== "update") return false;
  const desc = change.updateDescription;
  if (!desc) return false;

  const updatedKeys = Object.keys(desc.updatedFields || {});
  if (updatedKeys.some(key => key === "badges" || key.startsWith("badges."))) return true;
  if (desc.removedFields && desc.removedFields.includes("badges")) return true;
  if (updatedKeys.some(key => key === "discordId")) return true;
  return false;
}

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "Pixelit-Rewrite"
    });

    console.log("MongoDB connected (bot)");
    return mongoose.connection;
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
}

connectDB().then(connection => {
  if (!connection) return;

  const changeStream = User.watch([], { fullDocument: "updateLookup" });

  changeStream.on("change", async change => {
    try {
      if (!shouldSyncUserChange(change)) return;
      const user = change.fullDocument;
      await syncUserDiscordRoles(user);
    } catch (err) {
      console.error("User change stream sync error:", err);
    }
  });

  changeStream.on("error", err => {
    console.error("User change stream error:", err);
  });
});


const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
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
    .setName("quantity")
    .setDescription("See the total circulation for a Pixel")
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
    ) 
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

client.once(Events.ClientReady, () => {
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

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  try {
    const oldBoost = Boolean(oldMember.premiumSince || oldMember.premiumSinceTimestamp);
    const newBoost = Boolean(newMember.premiumSince || newMember.premiumSinceTimestamp);
    if (oldBoost === newBoost) return;

    const user = await User.findOne({ discordId: newMember.id });
    if (!user) return;

    syncBoosterBadge(user, newBoost);
    await user.save();
  } catch (err) {
    console.error("Guild member boost sync error:", err);
  }
});

// -------------------- INTERACTIONS --------------------

async function replyOrEdit(interaction, response) {
  try {
    if (interaction.deferred || interaction.replied) {
      return await interaction.editReply(response);
    }
    return await interaction.reply(response);
  } catch (err) {
    console.error("replyOrEdit failed:", err);
    try {
      if (!interaction.replied && !interaction.deferred) {
        // best-effort fallback
        return await interaction.reply(typeof response === "string" ? { content: response } : response);
      }
      return await interaction.followUp(typeof response === "string" ? { content: response } : response);
    } catch (err2) {
      console.error("Fallback replyOrEdit failed:", err2);
    }
  }
}

async function safeDeferReply(interaction, options = {}) {
  try {
    if (interaction.deferred || interaction.replied) return true;

    const ephemeralFlag = Boolean(options.ephemeral || options.flags);
    await interaction.deferReply({ ephemeral: ephemeralFlag });
    return true;
  } catch (err) {
    console.error("Failed to defer reply:", err);
    if (!interaction.replied && !interaction.deferred) {
      try {
        const replyOpts = { content: "Processing..." };
        if (options.flags) replyOpts.flags = options.flags;
        else if (options.ephemeral) replyOpts.flags = MessageFlags.Ephemeral;
        await interaction.reply(replyOpts);
      } catch (replyErr) {
        console.error("Fallback reply failed:", replyErr);
      }
    }
    return false;
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "ping") {
      return interaction.reply({
      content: `Pong: ${client.ws.ping}ms`,
      flags: MessageFlags.Ephemeral
    });
  }


  if (interaction.commandName === "login") {
    await safeDeferReply(interaction, { flags: MessageFlags.Ephemeral });
  
    const username = interaction.options.getString("username");
    const password = interaction.options.getString("password");

    try {
      const user = await User.findOne({ username: new RegExp(`^${username}$`, "i") });


      const isMatch = user ? await bcrypt.compare(password, user.password) : false;

      if (!isMatch) {
        return await replyOrEdit(interaction, "Invalid username or password.");
      }

      user.discordId = interaction.user.id;
      const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
      const isBoosting = Boolean(member && (member.premiumSince || member.premiumSinceTimestamp));

      try {
        syncBoosterBadge(user, isBoosting);
      } catch (err) {
        console.error("Booster badge sync error on login:", err);
      }

      try {
        const desiredRoleIds = getDiscordRoleIdsForUser(user);
        await syncDiscordBadgeRoles(member, desiredRoleIds);
      } catch (err) {
        console.error("Badge role sync error on login:", err);
      }

      await user.save();

      return await replyOrEdit(interaction, `Success! Account **${user.username}** is now linked to your Discord.`);
    }   catch (err) {
      console.error("Login command error:", err);
      return await replyOrEdit(interaction, "Server error. Try again later.");
    }
  }


  if (interaction.commandName === "logout") {
    await safeDeferReply(interaction, { flags: MessageFlags.Ephemeral });

    try {

      const user = await User.findOne({ discordId: interaction.user.id });

      if (!user) {
        return await replyOrEdit(interaction, "You do not have a Pixelit account linked to this Discord.");
      }

      const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
      
      try {
        await syncDiscordBadgeRoles(member, []);
      } catch (err) {
        console.error("Badge role removal error on logout:", err);
      }

      try {
        syncBoosterBadge(user, false);
      } catch (err) {
        console.error("Booster badge removal error on logout:", err);
      }

      user.discordId = null;
      await user.save();

      return await replyOrEdit(interaction, "Success! Your Discord account has been unlinked from your Pixelit account.");
    } catch (err) {
      console.error("Logout error:", err);
      return await replyOrEdit(interaction, "An error occurred while logging out. Try again later.");
    }
  }


  if (interaction.commandName === "user") {
    await safeDeferReply(interaction);
  
    const query = interaction.options.getString("username");
  
    try {
      const user = await User.findOne({ username: new RegExp(`^${query}$`, "i") });

      if (!user) {
        return await replyOrEdit(interaction, `Could not find a user named **${query}**.`);
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

      return await replyOrEdit(interaction, { embeds: [embed] });
    } catch (err) {
      console.error("User search error:", err);
      return await replyOrEdit(interaction, "An error occurred while searching for the user.");
    }
  } 

  if (interaction.commandName === "pixel") {
    await safeDeferReply(interaction);
  
    const query = interaction.options.getString("name");
  
    try {
      const blook = await Blook.findOne({ blookName: new RegExp(`^${query}$`, "i") });

      if (!blook) {
        return await replyOrEdit(interaction, `Could not find a Pixel named **${query}**.`);
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

      return await replyOrEdit(interaction, { embeds: [embed] });
    } catch (err) {
      console.error("Pixel command error:", err);
      return await replyOrEdit(interaction, "An error occurred while fetching Pixel data.");
    }
  }

  if (interaction.commandName === "quantity") {
    await safeDeferReply(interaction);

    const query = interaction.options.getString("name");

    try {
      const escaped = query.trim().replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
      const blook = await Blook.findOne({ blookName: new RegExp(`^${escaped}$`, "i") });

      if (!blook) {
        return await replyOrEdit(interaction, `Could not find a blook named **${query}**.`);
      }

      const users = await User.find({ [`blooks.${blook.blookName}`]: { $exists: true } }).select('username blooks').lean();

      const holders = [];
      for (const u of users) {
        const val = u.blooks?.[blook.blookName];
        let amt = 0;
        if (typeof val === 'number') amt = val;
        else if (val && typeof val.amount !== 'undefined') amt = Number(val.amount) || 0;
        if (Number.isFinite(amt) && amt > 0) {
          holders.push({ username: u.username, amount: amt });
        }
      }

      const total = holders.reduce((s, h) => s + h.amount, 0);
      const top = holders.sort((a, b) => b.amount - a.amount).slice(0, 10);

      const topText = top.length ? top.map((t, i) => `${i + 1}. ${t.username} — ${t.amount.toLocaleString()}`).join('\n') : 'No holders';

      const embed = new EmbedBuilder()
        .setColor(0x6f057a)
        .setTitle(`${blook.blookName} — Circulation`)
        .setThumbnail(blook.imageUrl)
        .addFields(
          { name: 'Total Circulating', value: total.toLocaleString(), inline: true },
          { name: 'Top Holders', value: topText, inline: false }
        )
        .setFooter({ text: `ID: ${blook._id}` });

      return await replyOrEdit(interaction, { embeds: [embed] });
    } catch (err) {
      console.error('Quantity command error:', err);
      return await replyOrEdit(interaction, 'An error occurred while calculating circulation.');
    }
  }

  if (interaction.commandName === "accesskey") {
    try {
      await safeDeferReply(interaction, { flags: MessageFlags.Ephemeral });

      const hasGeneratedBefore = await AccessKey.findOne({
        discordId: interaction.user.id
      });

      if (hasGeneratedBefore) {
        return await replyOrEdit(interaction, "You have already generated an access key.");
      }

      const key = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await AccessKey.create({
        key,
        discordId: interaction.user.id,
        used: false,
        expiresAt
      });

      return await replyOrEdit(interaction, `━━━━━━━━━━━━━━━━━━
      ACCESS KEY GENERATED

      ${key}

      Expires in: 10 minutes
      One-time use only
      ━━━━━━━━━━━━━━━━━━`);

    } catch (err) {
      console.error("Access key error:", err);
      return await replyOrEdit(interaction, "Failed to generate access key.");
    }
  }
});

client.login(process.env.BOT_TOKEN);