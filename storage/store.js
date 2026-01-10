const fs = require('fs');
const path = require('path');

const DATA_DIR = './data';
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const BANS_FILE = path.join(DATA_DIR, 'bans.json');
const REMINDERS_FILE = path.join(DATA_DIR, 'reminders.json');
const WARNS_FILE = path.join(DATA_DIR, 'warns.json');
const BADWORDS_FILE = path.join(DATA_DIR, 'badwords.json');
const BLOCKED_FILE = path.join(DATA_DIR, 'blocked.json');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

function loadJSON(filePath, defaultValue = {}) {
    try {
        ensureDataDir();
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error.message);
    }
    return defaultValue;
}

function saveJSON(filePath, data) {
    try {
        ensureDataDir();
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error saving ${filePath}:`, error.message);
        return false;
    }
}

let settingsCache = null;
let bansCache = null;
let remindersCache = null;
let warnsCache = null;
let badwordsCache = null;
let blockedCache = null;

function getSettings() {
    if (!settingsCache) {
        settingsCache = loadJSON(SETTINGS_FILE, {});
    }
    return settingsCache;
}

function saveSettings() {
    return saveJSON(SETTINGS_FILE, settingsCache || {});
}

function getGroupSettings(groupId) {
    const settings = getSettings();
    if (!settings[groupId]) {
        settings[groupId] = {
            prefix: settings.globalPrefix || '.',
            welcome: { enabled: false },
            goodbye: { enabled: false },
            autotype_pm: false,
            autotype_group: false,
            autorecord_pm: false,
            autorecord_group: false,
            autoread_pm: false,
            autoread_group: false,
            autoreact_pm: false,
            autoreact_group: false,
            autostatusview: false,
            autostatusdownload: false,
            autoafk: { enabled: false, message: 'I am currently busy. I will get back to you soon.' },
            autoblock: false,
            antilink: { enabled: false, action: 'delete' },
            antisticker: { enabled: false, action: 'delete' },
            antiimage: { enabled: false, action: 'delete' },
            antivideo: { enabled: false, action: 'delete' },
            antiaudio: { enabled: false, action: 'delete' },
            antidocument: { enabled: false, action: 'delete' },
            antiviewonce: { enabled: false },
            antidelete: { enabled: false },
            antitag: { enabled: false, action: 'delete' },
            antimention: { enabled: false, action: 'delete' },
            antigroupmention: { enabled: false, action: 'delete' },
            antitoxic: { enabled: false, action: 'delete' },
            antispam: { enabled: false, action: 'delete' },
            antiinvite: { enabled: false, action: 'delete' },
            antiforeign: { enabled: false, action: 'delete' },
            antiviewstatus: { enabled: false },
            antideletestatus: { enabled: false },
            anticall: { enabled: false },
            antibug: { enabled: false },
            antibadword: { enabled: false },
            autoreact: { enabled: false },
            readreceipts: { enabled: false },
            autoread: { enabled: false },
            isOpen: true,
            opentime: null,
            language: 'eng'
        };
        saveSettings();
    }
    
    // Ensure all features exist in current group settings
    const defaults = {
        antilink: { enabled: false, action: 'delete' },
        antisticker: { enabled: false, action: 'delete' },
        antiimage: { enabled: false, action: 'delete' },
        antivideo: { enabled: false, action: 'delete' },
        antiaudio: { enabled: false, action: 'delete' },
        antidocument: { enabled: false, action: 'delete' },
        antiviewonce: { enabled: false },
        antidelete: { enabled: false },
        antitag: { enabled: false, action: 'delete' },
        antimention: { enabled: false, action: 'delete' },
        antigroupmention: { enabled: false, action: 'delete' },
        antitoxic: { enabled: false, action: 'delete' },
        antispam: { enabled: false, action: 'delete' },
        antiinvite: { enabled: false, action: 'delete' },
        antiforeign: { enabled: false, action: 'delete' },
        welcome: { enabled: false },
        goodbye: { enabled: false },
        autotype_pm: { enabled: false },
        autotype_group: { enabled: false },
        autorecord_pm: { enabled: false },
        autorecord_group: { enabled: false },
        autoread_pm: { enabled: false },
        autoread_group: { enabled: false },
        autoreact_pm: { enabled: false },
        autoreact_group: { enabled: false },
        autostatusview: { enabled: false },
        autostatusdownload: { enabled: false },
        autoblock: { enabled: false }
    };

    for (const key in defaults) {
        if (settings[groupId][key] === undefined) {
            settings[groupId][key] = defaults[key];
        }
    }
    
    return settings[groupId];
}

function setGroupSetting(groupId, setting, value) {
    const settings = getSettings();
    if (!settings[groupId]) {
        getGroupSettings(groupId);
    }
    settings[groupId][setting] = value;
    return saveSettings();
}

function getBans() {
    if (!bansCache) {
        bansCache = loadJSON(BANS_FILE, {});
    }
    return bansCache;
}

function saveBans() {
    return saveJSON(BANS_FILE, bansCache || {});
}

function banUser(groupId, oderId, bannedBy, reason = '') {
    const bans = getBans();
    if (!bans[groupId]) bans[groupId] = {};
    bans[groupId][oderId] = {
        oderId,
        bannedBy,
        reason,
        timestamp: Date.now()
    };
    return saveBans();
}

function unbanUser(groupId, oderId, requesterId) {
    const bans = getBans();
    if (!bans[groupId] || !bans[groupId][oderId]) return { success: false, reason: 'User not banned' };
    
    delete bans[groupId][oderId];
    saveBans();
    return { success: true };
}

function isUserBanned(groupId, userId) {
    const bans = getBans();
    if (!bans[groupId]) return false;
    const userIdClean = userId?.split('@')[0]?.split(':')[0];
    
    for (const bannedId of Object.keys(bans[groupId])) {
        const bannedClean = bannedId?.split('@')[0]?.split(':')[0];
        if (bannedClean === userIdClean) {
            return bans[groupId][bannedId];
        }
    }
    return false;
}

function isBanned(groupId, userId) {
    return !!isUserBanned(groupId, userId);
}

function getReminders() {
    if (!remindersCache) {
        remindersCache = loadJSON(REMINDERS_FILE, []);
    }
    return remindersCache;
}

function saveReminders() {
    return saveJSON(REMINDERS_FILE, remindersCache || []);
}

function addReminder(reminder) {
    const reminders = getReminders();
    reminder.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    reminders.push(reminder);
    saveReminders();
    return reminder.id;
}

function removeReminder(reminderId) {
    const reminders = getReminders();
    const index = reminders.findIndex(r => r.id === reminderId);
    if (index !== -1) {
        reminders.splice(index, 1);
        saveReminders();
        return true;
    }
    return false;
}

function updateReminder(reminderId, updates) {
    const reminders = getReminders();
    const reminder = reminders.find(r => r.id === reminderId);
    if (reminder) {
        Object.assign(reminder, updates);
        saveReminders();
        return true;
    }
    return false;
}

function getWarns() {
    if (!warnsCache) {
        warnsCache = loadJSON(WARNS_FILE, {});
    }
    return warnsCache;
}

function saveWarns() {
    return saveJSON(WARNS_FILE, warnsCache || {});
}

function addWarn(groupId, oderId, reason = '') {
    const warns = getWarns();
    if (!warns[groupId]) warns[groupId] = {};
    if (!warns[groupId][oderId]) warns[groupId][oderId] = [];
    
    warns[groupId][oderId].push({
        reason,
        timestamp: Date.now()
    });
    saveWarns();
    return warns[groupId][oderId].length;
}

function getWarnCount(groupId, oderId) {
    const warns = getWarns();
    if (!warns[groupId] || !warns[groupId][oderId]) return 0;
    return warns[groupId][oderId].length;
}

function clearWarns(groupId, oderId) {
    const warns = getWarns();
    if (warns[groupId] && warns[groupId][oderId]) {
        delete warns[groupId][oderId];
        saveWarns();
        return true;
    }
    return false;
}

function getBadwords() {
    if (!badwordsCache) {
        badwordsCache = loadJSON(BADWORDS_FILE, {});
    }
    return badwordsCache;
}

function saveBadwords() {
    return saveJSON(BADWORDS_FILE, badwordsCache || {});
}

function addBadword(groupId, word) {
    const badwords = getBadwords();
    if (!badwords[groupId]) badwords[groupId] = [];
    if (!badwords[groupId].includes(word.toLowerCase())) {
        badwords[groupId].push(word.toLowerCase());
        saveBadwords();
    }
    return true;
}

function removeBadword(groupId, word) {
    const badwords = getBadwords();
    if (!badwords[groupId]) return false;
    const index = badwords[groupId].indexOf(word.toLowerCase());
    if (index !== -1) {
        badwords[groupId].splice(index, 1);
        saveBadwords();
        return true;
    }
    return false;
}

function getBadwordsList(groupId) {
    const badwords = getBadwords();
    return badwords[groupId] || [];
}

function getBlocked() {
    if (!blockedCache) {
        blockedCache = loadJSON(BLOCKED_FILE, {});
    }
    return blockedCache;
}

function saveBlocked() {
    return saveJSON(BLOCKED_FILE, blockedCache || {});
}

function blockUser(groupId, userId) {
    const blocked = getBlocked();
    if (!blocked[groupId]) blocked[groupId] = [];
    if (!blocked[groupId].includes(userId)) {
        blocked[groupId].push(userId);
        saveBlocked();
    }
    return true;
}

function unblockUser(groupId, userId) {
    const blocked = getBlocked();
    if (!blocked[groupId]) return false;
    const index = blocked[groupId].indexOf(userId);
    if (index !== -1) {
        blocked[groupId].splice(index, 1);
        saveBlocked();
        return true;
    }
    return false;
}

function isUserBlocked(groupId, userId) {
    const blocked = getBlocked();
    return blocked[groupId] && blocked[groupId].includes(userId);
}

function getBlockedList(groupId) {
    const blocked = getBlocked();
    return blocked[groupId] || [];
}

async function checkAdminStatus(sock, groupId, senderId, senderLid) {
    try {
        const groupMetadata = await sock.groupMetadata(groupId);
        const admins = groupMetadata.participants
            .filter(p => p.admin)
            .map(p => p.id);
        
        return admins.includes(senderId) || admins.includes(senderLid);
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

function isOwnerCheck(senderId, senderLid, ownerId, ownerLid) {
    const cleanSender = senderId?.split('@')[0]?.split(':')[0];
    const cleanOwnerId = ownerId?.split('@')[0]?.split(':')[0];
    const cleanOwnerLid = ownerLid?.split('@')[0]?.split(':')[0];

    if (cleanSender && (cleanSender === cleanOwnerId || cleanSender === cleanOwnerLid)) return true;
    if (senderId === ownerId || senderLid === ownerLid || senderId === ownerLid || senderLid === ownerId) return true;

    const OWNER_NUMBER = process.env.OWNER_NUMBER || process.env.ADMIN_NUMBER;
    const ownerJid = OWNER_NUMBER ? `${OWNER_NUMBER.replace(/[^0-9]/g, '')}@s.whatsapp.net` : null;
    
    if (ownerJid) {
        const senderClean = senderId.split('@')[0].split(':')[0];
        const ownerClean = ownerJid.split('@')[0];
        return senderClean === ownerClean || senderId === ownerJid || senderLid === ownerJid || (senderLid && senderLid.split('@')[0].split(':')[0] === ownerClean);
    }
    return false;
}

function isUserBanned(groupId, userId) {
    const bans = getBans();
    if (!bans[groupId]) return false;
    const userIdClean = userId?.split('@')[0]?.split(':')[0];
    
    for (const bannedId of Object.keys(bans[groupId])) {
        const bannedClean = bannedId?.split('@')[0]?.split(':')[0];
        if (bannedClean === userIdClean) {
            return bans[groupId][bannedId];
        }
    }
    return false;
}

function isBanned(groupId, userId) {
    return !!isUserBanned(groupId, userId);
}

function addWarning(groupId, userId, reason = '') {
    const warns = getWarns();
    if (!warns[groupId]) warns[groupId] = {};
    if (!warns[groupId][userId]) warns[groupId][userId] = [];
    
    warns[groupId][userId].push({
        reason,
        timestamp: Date.now()
    });
    saveWarns();
    
    const count = warns[groupId][userId].length;
    const banned = count >= 3;
    
    if (banned) {
        banUser(groupId, userId, 'SYSTEM', `Exceeded 3 warnings: ${reason}`);
    }
    
    return { count, banned };
}

module.exports = {
    getSettings,
    saveSettings,
    getGroupSettings,
    setGroupSetting,
    getBans,
    saveBans,
    banUser,
    unbanUser,
    isUserBanned,
    isBanned,
    getReminders,
    saveReminders,
    addReminder,
    removeReminder,
    updateReminder,
    getWarns,
    saveWarns,
    addWarn,
    addWarning,
    getWarnCount,
    clearWarns,
    getBadwords,
    saveBadwords,
    addBadword,
    removeBadword,
    getBadwordsList,
    getBlocked,
    saveBlocked,
    blockUser,
    unblockUser,
    isUserBlocked,
    getBlockedList,
    checkAdminStatus,
    isOwnerCheck
};
