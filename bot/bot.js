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

const DISCORD_WEBHOOK_DAILY_WHEEL = process.env.DISCORD_WEBHOOK_DAILY_WHEEL;

const COOLDOWN_MS = 1000 * 60 * 60 * 4; // a 4 hour cooldown for claiming

const DAILY_REWARDS = [
  { amount: 500, weight: 20 },
  { amount: 550, weight: 18 },
  { amount: 600, weight: 16 },
  { amount: 650, weight: 14 },
  { amount: 700, weight: 12 },
  { amount: 750, weight: 10 },
  { amount: 800, weight: 8 },
  { amount: 850, weight: 6 },
  { amount: 900, weight: 4 },
  { amount: 950, weight: 2 },
  { amount: 1000, weight: 1 },
];

function chooseDailyReward() {
  const totalWeight = DAILY_REWARDS.reduce((sum, r) => sum + r.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const reward of DAILY_REWARDS) {
    if (rand < reward.weight) return reward.amount;
    rand -= reward.weight;
  }
  return DAILY_REWARDS[DAILY_REWARDS.length - 1].amount;
}

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

// --- Moderation helpers and scheduled punishment checks ---
function getActionColor(action) {
  const colors = {
    Ban: 0x008000,
    Unban: 0x008000,
    Mute: 0x008000,
    Unmute: 0x008000,
    Kick: 0x008000,
    Warn: 0x008000
  };
  return colors[action] || 0x2B2D31;
}

function formatDuration(minutes) {
  if (!minutes || isNaN(minutes)) return 'N/A';
  if (minutes < 60) return `${minutes} minute(s)`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hour(s)`;
  return `${Math.floor(minutes / 1440)} day(s)`;
}

function createModEmbed(action, target, reason, duration, moderator, caseId) {
  const embed = new EmbedBuilder()
    .setColor(getActionColor(action))
    .setAuthor({ name: `${action} | ${target.user ? target.user.tag : target.tag}`, iconURL: target.user ? target.user.displayAvatarURL() : target.displayAvatarURL() })
    .addFields(
      { name: 'User', value: `${target} (${target.user ? target.user.tag : target.tag})`, inline: true },
      { name: 'Moderator', value: `${moderator}`, inline: true },
      { name: 'Reason', value: reason || 'No reason provided' },
      { name: 'Case ID', value: `#${caseId}`, inline: true }
    )
    .setFooter({ text: `ID: ${target.id}` })
    .setTimestamp();

  if (duration) {
    embed.addFields({ name: 'Duration', value: formatDuration(duration), inline: true });
  }

  return embed;
}

async function logModAction(action, target, moderator, reason, duration = null, caseId) {
  try {
    const db = mongoose.connection.db;
    const casesCollection = db.collection('DiscordCases');

    await casesCollection.insertOne({
      caseId,
      action,
      targetId: target.id,
      targetTag: target.user ? target.user.tag : target.tag,
      moderatorId: moderator.id,
      moderatorTag: moderator.tag || moderator.user?.tag || String(moderator),
      reason: reason || 'No reason provided',
      duration,
      timestamp: new Date(),
      active: true
    });
  } catch (err) {
    console.error('Failed to log mod action:', err);
  }
}

async function sendDM(user, embed) {
  try {
    await user.send({ embeds: [embed] });
    return true;
  } catch (error) {
    console.log(`Could not send DM to ${user.tag || user.id}: ${error.message}`);
    return false;
  }
}

function canModerate(moderator, target) {
  if (!moderator || !target) return { canModerate: false, reason: 'Invalid members.' };
  if (moderator.id === target.id) return { canModerate: false, reason: 'You cannot moderate yourself.' };

  if (target.user?.bot && target.id === client.user.id) return { canModerate: false, reason: 'I cannot moderate myself.' };

  const allowedRoleIds = ['1276630724417683487', '1276630172472180746', '1276630034441961505', '1276629987046461580'];

  const targetHasPermissionRole = target.roles?.cache ? target.roles.cache.some(role => allowedRoleIds.includes(role.id)) : false;

  if (targetHasPermissionRole) {
    if (moderator.roles.highest.position <= target.roles.highest.position) {
      return { canModerate: false, reason: 'You cannot moderate a staff member with an equal or higher role.' };
    }
  }

  if (moderator.roles.highest.position <= target.roles.highest.position) {
    return { canModerate: false, reason: 'You cannot moderate someone with an equal or higher role.' };
  }

  const moderatorHasPermissionRole = moderator.roles?.cache ? moderator.roles.cache.some(role => allowedRoleIds.includes(role.id)) : false;
  if (!moderatorHasPermissionRole) {
    return { canModerate: false, reason: 'You do not have the required staff role to moderate members.' };
  }

  return { canModerate: true };
}

async function checkExpiredPunishments() {
  try {
    if (!mongoose.connection || !mongoose.connection.db) {
      // Mongo connection not ready yet
      return;
    }

    const db = mongoose.connection.db;
    const casesCollection = db.collection('DiscordCases');
    const mutesCollection = db.collection('DiscordMutes');


    const now = new Date();
    const guild = client.guilds.cache.get(process.env.GUILD_ID) || await client.guilds.fetch(process.env.GUILD_ID).catch(() => null);
    if (!guild) return;

    const expiredBans = await casesCollection.find({ action: 'Ban', active: true, duration: { $gt: 0 }, timestamp: { $exists: true } }).toArray();

    for (const ban of expiredBans) {
      const expiryTime = new Date(ban.timestamp.getTime() + (ban.duration * 60000));
      if (now >= expiryTime) {
        try {
          await guild.members.unban(ban.targetId, 'Automatic unban - ban duration expired');
          await casesCollection.updateOne({ caseId: ban.caseId }, { $set: { active: false } });
          console.log(`Automatically unbanned ${ban.targetTag} after ban duration expired`);
        } catch (error) {
          console.error(`Failed to auto-unban ${ban.targetTag}:`, error);
        }
      }
    }

    const expiredMutes = await mutesCollection.find({ expiresAt: { $lte: now } }).toArray();

    for (const mute of expiredMutes) {
      try {
        const member = await guild.members.fetch(mute.userId).catch(() => null);
        const muteRole = guild.roles.cache.get(process.env.MUTE_ROLE_ID);

        if (muteRole && member && member.roles.cache.has(muteRole.id)) {
          await member.roles.remove(muteRole);
          await mutesCollection.deleteOne({ _id: mute._id });
          console.log(`Automatically unmuted ${member.user.tag} after mute duration expired`);
        }
      } catch (error) {
        console.error(`Failed to auto-unmute user ${mute.userId}:`, error);
        await mutesCollection.deleteOne({ _id: mute._id });
      }
    }
  } catch (error) {
    console.error('Error checking expired punishments:', error);
  }
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.on('guildMemberAdd', async (member) => {
  try {
    const db = mongoose.connection.db;
    const mutesCollection = db.collection('DiscordMutes');

    const activeMute = await mutesCollection.findOne({ userId: member.id });
    if (activeMute && new Date() < activeMute.expiresAt) {
      const muteRole = member.guild.roles.cache.get(process.env.MUTE_ROLE_ID);
      if (muteRole) {
        await member.roles.add(muteRole);
        console.log(`Re-applied mute role to ${member.user.tag} on rejoin`);
      }
    }
  } catch (error) {
    console.error('Error re-applying mute on member join:', error);
  }
});

// -------------------- COMMANDS --------------------

const commands = [
  new SlashCommandBuilder()
    .setName("accesskey")
    .setDescription("Generate a secure one-time access key"),
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a user from the server')
    .addUserOption(option => option.setName('target').setDescription('The user to kick').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for the kick').setRequired(false)),
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a user from the server')
    .addUserOption(option => option.setName('target').setDescription('The user to ban').setRequired(true))
    .addIntegerOption(option => option.setName('duration').setDescription('Duration in minutes (optional)').setRequired(false))
    .addStringOption(option => option.setName('reason').setDescription('Reason for the ban').setRequired(false)),
  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mutes a user by adding the mute role')
    .addUserOption(option => option.setName('target').setDescription('The user to mute').setRequired(true))
    .addIntegerOption(option => option.setName('duration').setDescription('Duration in minutes (optional)').setRequired(false))
    .addStringOption(option => option.setName('reason').setDescription('Reason for the mute').setRequired(false)),
  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmutes a user by removing the mute role')
    .addUserOption(option => option.setName('target').setDescription('The user to unmute').setRequired(true)),
  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warns a user')
    .addUserOption(option => option.setName('target').setDescription('The user to warn').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for the warning').setRequired(false)),

  new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unbans a user from the server')
    .addUserOption(option => option.setName('target').setDescription('The user to unban').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for the unban').setRequired(false)),


  new SlashCommandBuilder()
    .setName("claim")
    .setDescription("Claim your Pixelit tokens with one Discord command"),

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
    .setDescription("Search for a Pixelit user by username or Discord ID")
    .addStringOption(option => 
      option.setName("username")
        .setDescription("The Pixelit username to search for")
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName("discord")
        .setDescription("A Discord ID or mention to search for (e.g. 123456789012345678 or <@123...>)")
        .setRequired(false)
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

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Bot is active and ready to serve.`);

  const activities = [
    { name: "Playing with the Pixelit API", type: ActivityType.Playing },
    { name: "Watching the developers code", type: ActivityType.Watching },
    { name: "/login to link account", type: ActivityType.Listening },
    { name: "Watching out for new members", type: ActivityType.Watching }
  ];

  let i = 0;
  setInterval(() => {
    client.user.setPresence({
      activities: [activities[i]],
      status: "online"
    });
    i = (i + 1) % activities.length;
  }, 20000); 
  try {
    await checkExpiredPunishments();
  } catch (err) {
    console.error('Initial checkExpiredPunishments failed:', err);
  }

  setInterval(checkExpiredPunishments, 60000);
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
      if (err && err.code === 10062) {
        const content = typeof response === "string" ? response : (response.content || JSON.stringify(response));
        const channel = interaction.channel;
        if (channel && typeof channel.send === "function") {
          return await channel.send(content);
        }

        try {
          const user = await client.users.fetch(interaction.user.id).catch(() => null);
          if (user) return await user.send(content);
        } catch (dmErr) {
          console.error("DM fallback failed:", dmErr);
        }
      } else {
        if (!interaction.replied && !interaction.deferred) {
          return await interaction.reply(typeof response === "string" ? { content: response } : response);
        }
        return await interaction.followUp(typeof response === "string" ? { content: response } : response);
      }
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
    try {
      if (err && err.code === 10062) {
        const content = "Processing...";
        const channel = interaction.channel;
        if (channel && typeof channel.send === "function") {
          await channel.send(content).catch(() => null);
        } else {
          const user = await client.users.fetch(interaction.user.id).catch(() => null);
          if (user) await user.send(content).catch(() => null);
        }
      } else if (!interaction.replied && !interaction.deferred) {
        const replyOpts = { content: "Processing..." };
        if (options.flags) replyOpts.flags = options.flags;
        else if (options.ephemeral) replyOpts.flags = MessageFlags.Ephemeral;
        await interaction.reply(replyOpts);
      }
    } catch (replyErr) {
      console.error("Fallback reply failed:", replyErr);
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

  // -------------------- MODERATION COMMANDS --------------------
  if (
    interaction.commandName === 'kick' ||
    interaction.commandName === 'ban' ||
    interaction.commandName === 'unban' ||
    interaction.commandName === 'mute' ||
    interaction.commandName === 'unmute' ||
    interaction.commandName === 'warn'
  ) {

    await safeDeferReply(interaction, { ephemeral: false });

    const action = interaction.commandName[0].toUpperCase() + interaction.commandName.slice(1); 

    const targetMember = interaction.options.getUser('target', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const duration = interaction.options.getInteger('duration') || null;

    const guild = interaction.guild;
    const moderator = interaction.member;

    try {
      const moderatorMember = interaction.guild.members.cache.get(moderator.user.id) || await interaction.guild.members.fetch(moderator.user.id);

      let resolvedTarget = null;
      if (action !== 'Unban') {
        resolvedTarget = await guild.members.fetch(targetMember.id).catch(() => null);
        if (!resolvedTarget) {
          return await replyOrEdit(interaction, `Could not find that user in this server.`);
        }
      } else {
        resolvedTarget = {
          id: targetMember.id,
          tag: targetMember.tag,
          user: targetMember,
          roles: { cache: new Map() },
          toString() {
            return `<@${targetMember.id}>`;
          }
        };
      }

      const modCheck = action === 'Unban' ? { canModerate: true } : canModerate(moderatorMember, resolvedTarget);

      if (!modCheck.canModerate) {
        return await replyOrEdit(interaction, `${modCheck.reason}`);
      }

      const db = mongoose.connection.db;

      const caseId = new mongoose.Types.ObjectId().toString().slice(-6);

      if (action === 'Kick') {
        await resolvedTarget.kick(reason);
        await logModAction(action, resolvedTarget, moderatorMember, reason, null, caseId);

        const embed = createModEmbed(action, resolvedTarget, reason, null, moderatorMember, caseId);
        await sendDM(resolvedTarget.user, embed);

        return await replyOrEdit(interaction, { embeds: [embed] });
      }

      if (action === 'Ban') {
        await guild.members.ban(resolvedTarget.id, { reason });
        await logModAction(action, resolvedTarget, moderatorMember, reason, duration, caseId);

        const embed = createModEmbed(action, resolvedTarget, reason, duration, moderatorMember, caseId);
        await sendDM(resolvedTarget.user, embed);

        return await replyOrEdit(interaction, { embeds: [embed] });
      }

      if (action === 'Mute') {
        const muteRole = guild.roles.cache.get(process.env.MUTE_ROLE_ID);
        if (!muteRole) return await replyOrEdit(interaction, `Mute role is not configured (MUTE_ROLE_ID).`);

        await resolvedTarget.roles.add(muteRole, reason);

        const mutesCollection = db.collection('DiscordMutes');
        if (duration && duration > 0) {
          await mutesCollection.updateOne(
            { userId: resolvedTarget.id },
            {
              $set: {
                userId: resolvedTarget.id,
                roleId: muteRole.id,
                duration,
                expiresAt: new Date(Date.now() + duration * 60000),
                moderatorId: moderatorMember.id,
                moderatorTag: moderatorMember.user?.tag || String(moderatorMember),
                reason
              }
            },
            { upsert: true }
          );
        } else {
          await mutesCollection.deleteOne({ userId: resolvedTarget.id });
        }

        await logModAction(action, resolvedTarget, moderatorMember, reason, duration, caseId);

        const embed = createModEmbed(action, resolvedTarget, reason, duration, moderatorMember, caseId);
        await sendDM(resolvedTarget.user, embed);

        return await replyOrEdit(interaction, { embeds: [embed] });
      }

      if (action === 'Unmute') {
        const muteRole = guild.roles.cache.get(process.env.MUTE_ROLE_ID);
        if (!muteRole) return await replyOrEdit(interaction, `Mute role is not configured (MUTE_ROLE_ID).`);

        await resolvedTarget.roles.remove(muteRole, reason);

        const mutesCollection = db.collection('DiscordMutes');
        await mutesCollection.deleteOne({ userId: resolvedTarget.id }).catch(() => null);

        await logModAction(action, resolvedTarget, moderatorMember, reason, null, caseId);

        const embed = createModEmbed(action, resolvedTarget, reason, null, moderatorMember, caseId);
        await sendDM(resolvedTarget.user, embed);

        return await replyOrEdit(interaction, { embeds: [embed] });
      }

      if (action === 'Unban') {
        await guild.members.unban(resolvedTarget.id, { reason });

        try {
          const casesCollection = db.collection('DiscordCases');
          await casesCollection.updateMany(
            { targetId: resolvedTarget.id, action: 'Ban', active: true },
            { $set: { active: false } }
          );
        } catch (e) {
          console.error('Unban case deactivation failed:', e);
        }

        await logModAction(action, resolvedTarget, moderatorMember, reason, null, caseId);
        const embed = createModEmbed(action, resolvedTarget, reason, null, moderatorMember, caseId);
        if (resolvedTarget.user) await sendDM(resolvedTarget.user, embed);
        return await replyOrEdit(interaction, { embeds: [embed] });
      }

      if (action === 'Warn') {
        await logModAction(action, resolvedTarget, moderatorMember, reason, null, caseId);
        const embed = createModEmbed(action, resolvedTarget, reason, null, moderatorMember, caseId);
        await sendDM(resolvedTarget.user, embed);
        return await replyOrEdit(interaction, { embeds: [embed] });
      }


      return await replyOrEdit(interaction, `Unsupported moderation action.`);
    } catch (err) {
      console.error(`${interaction.commandName} error:`, err);

      const msg = err?.message ? String(err.message) : 'Unknown error while executing moderation command.';
      return await replyOrEdit(interaction, `Failed to execute ${interaction.commandName}: ${msg}`);
    }
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
    const usernameQuery = interaction.options.getString("username");
    const discordQuery = interaction.options.getString("discord");

    try {
      let user = null;

      if (discordQuery) {
        const match = discordQuery.match(/\d{17,19}/);
        const discordId = match ? match[0] : discordQuery.replace(/\D/g, "");
        if (!discordId) {
          return await replyOrEdit(interaction, `Invalid Discord ID provided.`);
        }
        user = await User.findOne({ discordId: discordId });
        if (!user) {
          return await replyOrEdit(interaction, `Could not find a user linked to Discord ID **${discordId}**.`);
        }
      } else if (usernameQuery) {
        const query = usernameQuery;
        user = await User.findOne({ username: new RegExp(`^${query}$`, "i") });

        if (!user) {
          return await replyOrEdit(interaction, `Could not find a user named **${query}**.`);
        }
      } else {
        return await replyOrEdit(interaction, `Please provide a username or a Discord ID to search.`);
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
  
  if (interaction.commandName === "claim") {
    await safeDeferReply(interaction, { flags: MessageFlags.Ephemeral });

    try {
      const user = await User.findOne({ discordId: interaction.user.id });

      if (!user) {
        return await replyOrEdit(interaction, "You do not have a Pixelit account linked to this Discord. Use /login to link your account.");
      }

      const now = new Date();
      const last = user.lastClaim ? new Date(user.lastClaim) : null;

      if (last) {
        const nextClaim = new Date(last.getTime() + COOLDOWN_MS);
        if (nextClaim > now) {
          const msLeft = nextClaim - now;
          const hours = Math.floor(msLeft / (1000 * 60 * 60));
          const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / 60000);
          const seconds = Math.floor((msLeft % 60000) / 1000);
          return await replyOrEdit(interaction, `You have already claimed recently. Try again in ${hours}h ${minutes}m ${seconds}s.`);
        }
      }

      const reward = chooseDailyReward();
      user.tokens = (user.tokens || 0) + reward;
      user.lastClaim = now;
      await user.save();

      try {
        if (DISCORD_WEBHOOK_DAILY_WHEEL) {
          await fetch(DISCORD_WEBHOOK_DAILY_WHEEL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: `**${user.username}** has claimed **${reward.toLocaleString()}** tokens via bot` })
          });
        }
      } catch (webhookErr) {
        console.error("Daily wheel webhook error:", webhookErr);
      }

      return await replyOrEdit(interaction, `You claimed **${reward.toLocaleString()}** tokens! You now have ${user.tokens.toLocaleString()} tokens.`);
    } catch (err) {
      console.error("Claim command error:", err);
      return await replyOrEdit(interaction, "An error occurred while claiming tokens. Try again later.");
    }
  }
});

client.login(process.env.BOT_TOKEN);