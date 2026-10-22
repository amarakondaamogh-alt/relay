'use strict';
const express = require('express');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const { Server } = require('socket.io');
const store = require('./store');

const scrypt = promisify(crypto.scrypt);

const PORT = process.env.PORT || 3000;
const SESSION_DAYS = 30;
const MAX_MESSAGES_PER_CHANNEL = 1000;
const PAGE_SIZE = 50;
const USERNAME_RE = /^[a-zA-Z0-9_.]{2,32}$/;
const COLORS = ['#5865f2', '#3ba55c', '#faa61a', '#eb459e', '#ed4245', '#9b59b6', '#1abc9c', '#e67e22', '#3498db', '#747f8d'];

const ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
if (process.env.TURN_URL) {
  ICE_SERVERS.push({
    urls: process.env.TURN_URL.split(',').map((s) => s.trim()),
    username: process.env.TURN_USERNAME,
    credential: process.env.TURN_CREDENTIAL,
  });
}

// ---------- state ----------
let db = { users: {}, sessions: {}, servers: {}, dms: {}, messages: {} };
const byUsername = new Map(); // lowercase username -> userId
const channelIndex = new Map(); // channelId -> serverId
const online = new Map(); // userId -> open socket count
const voiceRooms = new Map(); // roomId -> Map(userId -> { socketId, muted, deafened, video, screen })
const userVoice = new Map(); // userId -> roomId

function rebuildIndexes() {
  byUsername.clear();
  channelIndex.clear();
  for (const u of Object.values(db.users)) byUsername.set(u.username.toLowerCase(), u.id);
  for (const s of Object.values(db.servers)) for (const c of s.channels) channelIndex.set(c.id, s.id);
  const now = Date.now();
  for (const [k, s] of Object.entries(db.sessions)) if (s.expires < now) delete db.sessions[k];
}

let saveChain = Promise.resolve();
let saveTimer = null;
function persist() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveChain = saveChain.then(() => store.save(db)).catch((e) => console.error('Save failed:', e));
  }, 1000);
}

const newId = () => crypto.randomBytes(8).toString('hex');
const newInvite = () => crypto.randomBytes(6).toString('base64url');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const publicUser = (u) => ({ id: u.id, username: u.username, color: u.color, createdAt: u.createdAt });

function cleanText(v, max) {
  return String(v == null ? '' : v)
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max);
}

class UserError extends Error {}
const fail = (msg) => {
  throw new UserError(msg);
};

// ---------- auth ----------
async function hashPassword(password, salt) {
  return (await scrypt(password, salt, 64)).toString('hex');
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function sessionUser(cookieHeader) {
  const token = parseCookies(cookieHeader).sid;
  if (!token) return null;
  const s = db.sessions[sha256(token)];
  if (!s || s.expires < Date.now()) return null;
  return db.users[s.userId] || null;
}

function startSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions[sha256(token)] = { userId, expires: Date.now() + SESSION_DAYS * 864e5 };
  persist();
  res.setHeader(
    'Set-Cookie',
    `sid=${token}; HttpOnly; Path=/; Max-Age=${SESSION_DAYS * 86400}; SameSite=Lax${req.secure ? '; Secure' : ''}`
  );
}

const authAttempts = new Map(); // ip -> { count, reset }
function tooManyAttempts(ip) {
  const now = Date.now();
  let e = authAttempts.get(ip);
  if (!e || e.reset < now) authAttempts.set(ip, (e = { count: 0, reset: now + 15 * 60e3 }));
  return ++e.count > 30;
}

// ---------- http ----------
const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 256 * 1024 });

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; media-src 'self' blob:; connect-src 'self' ws: wss:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'"
  );
  next();
});
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const indexHtml = path.join(__dirname, 'public', 'index.html');
app.get('/invite/:code', (req, res) => res.sendFile(indexHtml));

app.post('/api/register', async (req, res) => {
  if (tooManyAttempts(req.ip)) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || !USERNAME_RE.test(username))
    return res.status(400).json({ error: 'Username must be 2–32 characters: letters, numbers, _ or .' });
  if (typeof password !== 'string' || password.length < 6 || password.length > 200)
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  if (byUsername.has(username.toLowerCase())) return res.status(409).json({ error: 'That username is taken.' });

  const salt = crypto.randomBytes(16).toString('hex');
  const user = {
    id: newId(),
    username,
    salt,
    hash: await hashPassword(password, salt),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    createdAt: Date.now(),
    friends: [],
    incoming: [],
    outgoing: [],
  };
  if (byUsername.has(username.toLowerCase())) return res.status(409).json({ error: 'That username is taken.' });
  db.users[user.id] = user;
  byUsername.set(username.toLowerCase(), user.id);
  startSession(req, res, user.id);
  res.json({ user: publicUser(user) });
});

app.post('/api/login', async (req, res) => {
  if (tooManyAttempts(req.ip)) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  const { username, password } = req.body || {};
  const user = typeof username === 'string' && db.users[byUsername.get(username.toLowerCase())];
  if (!user || typeof password !== 'string') return res.status(401).json({ error: 'Wrong username or password.' });
  const hash = Buffer.from(await hashPassword(password, user.salt), 'hex');
  if (!crypto.timingSafeEqual(hash, Buffer.from(user.hash, 'hex')))
    return res.status(401).json({ error: 'Wrong username or password.' });
  startSession(req, res, user.id);
  res.json({ user: publicUser(user) });
});

app.post('/api/logout', (req, res) => {
  const token = parseCookies(req.headers.cookie).sid;
  if (token) delete db.sessions[sha256(token)];
  persist();
  res.setHeader('Set-Cookie', 'sid=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  const user = sessionUser(req.headers.cookie);
  if (!user) return res.status(401).json({ error: 'Not logged in' });
  res.json({ user: publicUser(user) });
});

// ---------- helpers ----------
function serverView(s) {
  return { id: s.id, name: s.name, ownerId: s.ownerId, members: s.members, channels: s.channels, invite: s.invite };
}

function relatedUserIds(uid) {
  const me = db.users[uid];
  const ids = new Set([...me.friends, ...me.incoming, ...me.outgoing]);
  for (const s of Object.values(db.servers)) if (s.members.includes(uid)) s.members.forEach((m) => ids.add(m));
  for (const d of Object.values(db.dms)) if (d.members.includes(uid)) d.members.forEach((m) => ids.add(m));
  ids.delete(uid);
  return ids;
}

function profiles(ids) {
  const users = {};
  for (const id of ids) if (db.users[id]) users[id] = publicUser(db.users[id]);
  return users;
}

// What a user may do in a channel id (server channel or DM).
function access(uid, channelId) {
  const sid = channelIndex.get(channelId);
  if (sid) {
    const s = db.servers[sid];
    if (!s || !s.members.includes(uid)) return null;
    return { type: 'server', server: s, channel: s.channels.find((c) => c.id === channelId) };
  }
  const dm = db.dms[channelId];
  if (dm && dm.members.includes(uid)) return { type: 'dm', dm };
  return null;
}

function audience(channelId) {
  const sid = channelIndex.get(channelId);
  if (sid) return ['server:' + sid];
  const dm = db.dms[channelId];
  return dm ? dm.members.map((m) => 'user:' + m) : [];
}

function sharesServer(a, b) {
  return Object.values(db.servers).some((s) => s.members.includes(a) && s.members.includes(b));
}

// ---------- voice ----------
function roomMembers(roomId) {
  const room = voiceRooms.get(roomId);
  if (!room) return [];
  return [...room].map(([userId, s]) => ({ userId, muted: s.muted, deafened: s.deafened, video: s.video, screen: s.screen }));
}

function canUseRoom(uid, roomId) {
  const acc = access(uid, roomId);
  return !!acc && (acc.type === 'dm' || (acc.channel && acc.channel.type === 'voice'));
}

function broadcastVoice(roomId) {
  io.to(audience(roomId)).emit('voice:update', { roomId, members: roomMembers(roomId) });
}

// Removes a user from their voice room. `onlySocket` skips it if that room belongs to another tab;
// `notify` tells the user's client it was disconnected by the server.
function leaveVoice(uid, { onlySocket = null, notify = false } = {}) {
  const roomId = userVoice.get(uid);
  if (!roomId) return;
  const room = voiceRooms.get(roomId);
  const entry = room && room.get(uid);
  if (!entry || (onlySocket && entry.socketId !== onlySocket)) return;
  room.delete(uid);
  userVoice.delete(uid);
  if (notify) io.to(entry.socketId).emit('voice:ended');
  for (const e of room.values()) io.to(e.socketId).emit('voice:peer-left', { userId: uid });
  if (!room.size) voiceRooms.delete(roomId);
  broadcastVoice(roomId);
}

function closeRoom(roomId) {
  const room = voiceRooms.get(roomId);
  if (!room) return;
  for (const uid of [...room.keys()]) leaveVoice(uid, { notify: true });
}

// ---------- sockets ----------
io.use((socket, next) => {
  const user = sessionUser(socket.handshake.headers.cookie);
  if (!user) return next(new Error('unauthorized'));
  socket.data.userId = user.id;
  next();
});

function rateLimiter(perSecond, burst) {
  let allowance = burst;
  let last = Date.now();
  return () => {
    const now = Date.now();
    allowance = Math.min(burst, allowance + ((now - last) / 1000) * perSecond);
    last = now;
    if (allowance < 1) return false;
    allowance -= 1;
    return true;
  };
}

function bootstrap(uid) {
  const me = db.users[uid];
  const related = relatedUserIds(uid);
  const servers = Object.values(db.servers).filter((s) => s.members.includes(uid)).map(serverView);
  const dms = Object.values(db.dms).filter((d) => d.members.includes(uid));
  const voice = {};
  for (const roomId of voiceRooms.keys()) if (access(uid, roomId)) voice[roomId] = roomMembers(roomId);
  return {
    me: { ...publicUser(me), friends: me.friends, incoming: me.incoming, outgoing: me.outgoing },
    users: profiles([...related, uid]),
    servers,
    dms,
    online: [...related].filter((id) => online.has(id)),
    voice,
    iceServers: ICE_SERVERS,
  };
}

function sendFriendState(...ids) {
  for (const id of ids) {
    const u = db.users[id];
    const all = [...u.friends, ...u.incoming, ...u.outgoing];
    io.to('user:' + id).emit('friends:update', {
      friends: u.friends,
      incoming: u.incoming,
      outgoing: u.outgoing,
      users: profiles(all),
      online: all.filter((x) => online.has(x)),
    });
  }
}

function acceptFriend(uid, tid) {
  const me = db.users[uid];
  const them = db.users[tid];
  me.incoming = me.incoming.filter((x) => x !== tid);
  them.outgoing = them.outgoing.filter((x) => x !== uid);
  if (!me.friends.includes(tid)) me.friends.push(tid);
  if (!them.friends.includes(uid)) them.friends.push(uid);
  sendFriendState(uid, tid);
  persist();
}

io.on('connection', (socket) => {
  const uid = socket.data.userId;
  const sendLimit = rateLimiter(5, 10);
  const actionLimit = rateLimiter(3, 15);

  socket.join('user:' + uid);
  for (const s of Object.values(db.servers)) if (s.members.includes(uid)) socket.join('server:' + s.id);

  const count = (online.get(uid) || 0) + 1;
  online.set(uid, count);
  if (count === 1) {
    const rooms = [...relatedUserIds(uid)].map((id) => 'user:' + id);
    if (rooms.length) io.to(rooms).emit('presence', { userId: uid, online: true });
  }
  socket.emit('bootstrap', bootstrap(uid));

  // Registers a handler that always answers its ack with a result or { error }.
  const on = (event, fn) =>
    socket.on(event, (data, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      if (!db.users[uid]) return reply({ error: 'Account not found' });
      try {
        reply(fn(data && typeof data === 'object' ? data : {}) || { ok: true });
      } catch (e) {
        if (!(e instanceof UserError)) console.error(`Error in ${event}:`, e);
        reply({ error: e instanceof UserError ? e.message : 'Something went wrong' });
      }
    });

  // ----- messages -----
  on('messages:fetch', ({ channelId, before }) => {
    if (!access(uid, channelId)) fail('You do not have access to that channel');
    const list = db.messages[channelId] || [];
    let end = list.length;
    if (before) {
      const i = list.findIndex((m) => m.id === before);
      if (i >= 0) end = i;
    }
    const start = Math.max(0, end - PAGE_SIZE);
    return { messages: list.slice(start, end), hasMore: start > 0 };
  });

  on('message:send', ({ channelId, content, replyTo }) => {
    if (!sendLimit()) fail('You are sending messages too fast');
    const acc = access(uid, channelId);
    if (!acc) fail('You do not have access to that channel');
    if (acc.type === 'server' && acc.channel.type !== 'text') fail('That is a voice channel');
    content = cleanText(content, 2000);
    if (!content) fail('Message is empty');
    const list = db.messages[channelId] || (db.messages[channelId] = []);
    const msg = { id: newId(), channelId, authorId: uid, content, createdAt: Date.now(), reactions: {} };
    if (typeof replyTo === 'string') {
      const orig = list.find((m) => m.id === replyTo);
      if (orig) msg.replyTo = { id: orig.id, authorId: orig.authorId, content: orig.content.slice(0, 120) };
    }
    list.push(msg);
    if (list.length > MAX_MESSAGES_PER_CHANNEL) list.splice(0, list.length - MAX_MESSAGES_PER_CHANNEL);
    if (acc.type === 'dm') acc.dm.lastAt = msg.createdAt;
    io.to(audience(channelId)).emit('message:new', msg);
    persist();
  });

  on('message:edit', ({ channelId, id, content }) => {
    if (!access(uid, channelId)) fail('You do not have access to that channel');
    const msg = (db.messages[channelId] || []).find((m) => m.id === id);
    if (!msg || msg.authorId !== uid) fail('You can only edit your own messages');
    content = cleanText(content, 2000);
    if (!content) fail('Message is empty');
    msg.content = content;
    msg.editedAt = Date.now();
    io.to(audience(channelId)).emit('message:update', msg);
    persist();
  });

  on('message:delete', ({ channelId, id }) => {
    const acc = access(uid, channelId);
    if (!acc) fail('You do not have access to that channel');
    const list = db.messages[channelId] || [];
    const i = list.findIndex((m) => m.id === id);
    if (i < 0) fail('Message not found');
    const isOwner = acc.type === 'server' && acc.server.ownerId === uid;
    if (list[i].authorId !== uid && !isOwner) fail('You can only delete your own messages');
    list.splice(i, 1);
    io.to(audience(channelId)).emit('message:delete', { channelId, id });
    persist();
  });

  on('message:react', ({ channelId, id, emoji }) => {
    if (!actionLimit()) fail('Slow down');
    if (!access(uid, channelId)) fail('You do not have access to that channel');
    emoji = cleanText(emoji, 16);
    if (!emoji) fail('Invalid emoji');
    const msg = (db.messages[channelId] || []).find((m) => m.id === id);
    if (!msg) fail('Message not found');
    const users = msg.reactions[emoji] || [];
    if (users.includes(uid)) {
      msg.reactions[emoji] = users.filter((x) => x !== uid);
      if (!msg.reactions[emoji].length) delete msg.reactions[emoji];
    } else {
      if (!msg.reactions[emoji] && Object.keys(msg.reactions).length >= 20) fail('Too many reactions');
      msg.reactions[emoji] = [...users, uid];
    }
    io.to(audience(channelId)).emit('message:update', msg);
    persist();
  });

  socket.on('typing', (data) => {
    const channelId = data && data.channelId;
    if (typeof channelId === 'string' && access(uid, channelId))
      socket.to(audience(channelId)).emit('typing', { channelId, userId: uid });
  });

  // ----- servers -----
  on('server:create', ({ name }) => {
    if (!actionLimit()) fail('Slow down');
    name = cleanText(name, 50);
    if (!name) fail('Give your server a name');
    if (Object.values(db.servers).filter((s) => s.ownerId === uid).length >= 25) fail('You own too many servers');
    const s = {
      id: newId(),
      name,
      ownerId: uid,
      members: [uid],
      invite: newInvite(),
      createdAt: Date.now(),
      channels: [
        { id: newId(), name: 'general', type: 'text' },
        { id: newId(), name: 'General', type: 'voice' },
      ],
    };
    db.servers[s.id] = s;
    s.channels.forEach((c) => channelIndex.set(c.id, s.id));
    io.in('user:' + uid).socketsJoin('server:' + s.id);
    io.to('user:' + uid).emit('server:added', { server: serverView(s), users: {}, online: [], voice: {} });
    persist();
    return { serverId: s.id };
  });

  on('server:join', ({ code }) => {
    if (!actionLimit()) fail('Slow down');
    code = cleanText(code, 200).split('/').filter(Boolean).pop() || '';
    const s = Object.values(db.servers).find((x) => x.invite === code);
    if (!s) fail('That invite is invalid or has expired');
    if (s.members.includes(uid)) return { serverId: s.id };
    if (s.members.length >= 500) fail('That server is full');
    s.members.push(uid);
    io.to('server:' + s.id).emit('server:member-joined', {
      serverId: s.id,
      user: publicUser(db.users[uid]),
      online: online.has(uid),
    });
    io.in('user:' + uid).socketsJoin('server:' + s.id);
    const voice = {};
    for (const c of s.channels) if (voiceRooms.has(c.id)) voice[c.id] = roomMembers(c.id);
    io.to('user:' + uid).emit('server:added', {
      server: serverView(s),
      users: profiles(s.members),
      online: s.members.filter((m) => online.has(m)),
      voice,
    });
    persist();
    return { serverId: s.id };
  });

  function ownedServer(serverId) {
    const s = db.servers[serverId];
    if (!s || !s.members.includes(uid)) fail('Server not found');
    if (s.ownerId !== uid) fail('Only the server owner can do that');
    return s;
  }

  on('server:leave', ({ serverId }) => {
    const s = db.servers[serverId];
    if (!s || !s.members.includes(uid)) fail('Server not found');
    if (s.ownerId === uid) fail('You own this server. Delete it instead.');
    const room = userVoice.get(uid);
    if (room && channelIndex.get(room) === s.id) leaveVoice(uid, { notify: true });
    s.members = s.members.filter((m) => m !== uid);
    io.in('user:' + uid).socketsLeave('server:' + s.id);
    io.to('user:' + uid).emit('server:removed', { serverId: s.id });
    io.to('server:' + s.id).emit('server:member-left', { serverId: s.id, userId: uid });
    persist();
  });

  on('server:delete', ({ serverId }) => {
    const s = ownedServer(serverId);
    for (const c of s.channels) {
      closeRoom(c.id);
      channelIndex.delete(c.id);
      delete db.messages[c.id];
    }
    io.to('server:' + s.id).emit('server:removed', { serverId: s.id });
    io.in('server:' + s.id).socketsLeave('server:' + s.id);
    delete db.servers[s.id];
    persist();
  });

  on('server:rename', ({ serverId, name }) => {
    const s = ownedServer(serverId);
    name = cleanText(name, 50);
    if (!name) fail('Give your server a name');
    s.name = name;
    io.to('server:' + s.id).emit('server:updated', serverView(s));
    persist();
  });

  on('server:kick', ({ serverId, userId }) => {
    const s = ownedServer(serverId);
    if (userId === uid || !s.members.includes(userId)) fail('Cannot kick that member');
    const room = userVoice.get(userId);
    if (room && channelIndex.get(room) === s.id) leaveVoice(userId, { notify: true });
    s.members = s.members.filter((m) => m !== userId);
    io.in('user:' + userId).socketsLeave('server:' + s.id);
    io.to('user:' + userId).emit('server:removed', { serverId: s.id, kicked: true, name: s.name });
    io.to('server:' + s.id).emit('server:member-left', { serverId: s.id, userId });
    persist();
  });

  on('channel:create', ({ serverId, name, type }) => {
    const s = ownedServer(serverId);
    type = type === 'voice' ? 'voice' : 'text';
    name = cleanText(name, 40);
    if (type === 'text') name = name.toLowerCase().replace(/\s+/g, '-');
    if (!name) fail('Give the channel a name');
    if (s.channels.length >= 50) fail('Too many channels');
    const channel = { id: newId(), name, type };
    s.channels.push(channel);
    channelIndex.set(channel.id, s.id);
    io.to('server:' + s.id).emit('server:updated', serverView(s));
    persist();
    return { channelId: channel.id };
  });

  on('channel:delete', ({ serverId, channelId }) => {
    const s = ownedServer(serverId);
    if (!s.channels.some((c) => c.id === channelId)) fail('Channel not found');
    closeRoom(channelId);
    s.channels = s.channels.filter((c) => c.id !== channelId);
    channelIndex.delete(channelId);
    delete db.messages[channelId];
    io.to('server:' + s.id).emit('server:updated', serverView(s));
    persist();
  });

  // ----- friends & DMs -----
  on('friend:request', ({ username }) => {
    if (!actionLimit()) fail('Slow down');
    const tid = byUsername.get(cleanText(username, 40).replace(/^@/, '').toLowerCase());
    if (!tid) fail("Couldn't find anyone with that username. Usernames are case-insensitive.");
    if (tid === uid) fail("That's you!");
    const me = db.users[uid];
    const them = db.users[tid];
    if (me.friends.includes(tid)) fail("You're already friends");
    if (me.incoming.includes(tid)) return acceptFriend(uid, tid);
    if (me.outgoing.includes(tid)) fail('Friend request already sent');
    me.outgoing.push(tid);
    them.incoming.push(uid);
    sendFriendState(uid, tid);
    persist();
  });

  on('friend:accept', ({ userId }) => {
    if (!db.users[uid].incoming.includes(userId)) fail('No pending request from that user');
    acceptFriend(uid, userId);
  });

  // Declines, cancels or unfriends.
  on('friend:remove', ({ userId }) => {
    const me = db.users[uid];
    const them = db.users[userId];
    if (!them) fail('User not found');
    for (const [a, b] of [[me, userId], [them, uid]]) {
      a.friends = a.friends.filter((x) => x !== b);
      a.incoming = a.incoming.filter((x) => x !== b);
      a.outgoing = a.outgoing.filter((x) => x !== b);
    }
    sendFriendState(uid, userId);
    persist();
  });

  on('dm:open', ({ userId }) => {
    if (!db.users[userId] || userId === uid) fail('User not found');
    const existing = Object.values(db.dms).find((d) => d.members.includes(uid) && d.members.includes(userId));
    if (existing) return { dmId: existing.id };
    if (!db.users[uid].friends.includes(userId) && !sharesServer(uid, userId))
      fail('You can only message friends or people who share a server with you');
    const dm = { id: newId(), members: [uid, userId], createdAt: Date.now(), lastAt: Date.now() };
    db.dms[dm.id] = dm;
    for (const m of dm.members) {
      const other = dm.members.find((x) => x !== m);
      io.to('user:' + m).emit('dm:new', { dm, users: profiles(dm.members), online: online.has(other) ? [other] : [] });
    }
    persist();
    return { dmId: dm.id };
  });

  // ----- voice & calls -----
  on('voice:join', ({ roomId, muted }) => {
    if (!canUseRoom(uid, roomId)) fail("You can't join that call");
    const current = userVoice.get(uid);
    if (current) {
      const prev = voiceRooms.get(current).get(uid);
      leaveVoice(uid, { notify: prev.socketId !== socket.id });
    }
    let room = voiceRooms.get(roomId);
    if (!room) voiceRooms.set(roomId, (room = new Map()));
    if (room.size >= 16) fail('That call is full');
    const peers = [...room.keys()];
    room.set(uid, { socketId: socket.id, muted: !!muted, deafened: false, video: false, screen: false });
    userVoice.set(uid, roomId);
    broadcastVoice(roomId);
    const dm = db.dms[roomId];
    if (dm) {
      const other = dm.members.find((m) => m !== uid);
      if (!room.has(other)) io.to('user:' + other).emit('call:ring', { roomId, from: uid });
    }
    return { peers };
  });

  on('voice:leave', () => leaveVoice(uid, { onlySocket: socket.id }));

  on('voice:state', (state) => {
    const roomId = userVoice.get(uid);
    const entry = roomId && voiceRooms.get(roomId).get(uid);
    if (!entry || entry.socketId !== socket.id) return;
    for (const k of ['muted', 'deafened', 'video', 'screen']) if (k in state) entry[k] = !!state[k];
    broadcastVoice(roomId);
  });

  // Relays WebRTC offers/answers/ICE candidates between two people in the same call.
  socket.on('voice:signal', (msg) => {
    if (!msg || typeof msg.to !== 'string') return;
    const roomId = userVoice.get(uid);
    const room = roomId && voiceRooms.get(roomId);
    if (!room || room.get(uid).socketId !== socket.id) return;
    const target = room.get(msg.to);
    if (target) io.to(target.socketId).emit('voice:signal', { from: uid, data: msg.data });
  });

  on('call:decline', ({ roomId }) => {
    const dm = db.dms[roomId];
    if (!dm || !dm.members.includes(uid)) fail('Call not found');
    io.to(audience(roomId)).emit('call:declined', { roomId, by: uid });
  });

  socket.on('disconnect', () => {
    leaveVoice(uid, { onlySocket: socket.id });
    const n = (online.get(uid) || 1) - 1;
    if (n > 0) return online.set(uid, n);
    online.delete(uid);
    if (!db.users[uid]) return;
    const rooms = [...relatedUserIds(uid)].map((id) => 'user:' + id);
    if (rooms.length) io.to(rooms).emit('presence', { userId: uid, online: false });
  });
});

// ---------- start ----------
async function shutdown() {
  clearTimeout(saveTimer);
  try {
    await saveChain;
    await store.save(db);
  } finally {
    process.exit(0);
  }
}

(async () => {
  const loaded = await store.load();
  if (loaded) db = Object.assign(db, loaded);
  rebuildIndexes();
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  server.listen(PORT, () => console.log(`Relay running on http://localhost:${PORT}`));
})().catch((e) => {
  console.error('Failed to start:', e);
  process.exit(1);
});
