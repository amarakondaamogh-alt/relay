'use strict';
(() => {
  // ================= utilities =================
  const $ = (sel, root = document) => root.querySelector(sel);

  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style') Object.assign(el.style, v);
        else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      el.append(c instanceof Node ? c : String(c));
    }
    return el;
  }

  const ICONS = {
    mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
    micOff: '<line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
    headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
    headphonesOff: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/><line x1="1" y1="1" x2="23" y2="23"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
    videoOff: '<path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/>',
    screen: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    hash: '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>',
    speaker: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
    reply: '<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>',
    edit: '<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    chevron: '<polyline points="6 9 12 15 18 9"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
  };

  function icon(name, cls = '') {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('class', ('i ' + cls).trim());
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = ICONS[name];
    return svg;
  }

  // replaceChildren that accepts nested arrays and skips null/false.
  const fill = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter((k) => k != null && k !== false));

  const iconBtn = (name, title, onclick, cls = '') =>
    h('button', { class: 'icon-btn ' + cls, title, 'aria-label': title, onclick }, icon(name));

  const escapeHtml = (s) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function fmtTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return `Today at ${time}`;
    const y = new Date(now);
    y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return `Yesterday at ${time}`;
    return `${d.toLocaleDateString()} ${time}`;
  }
  const shortTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  function toast(text, isError = false) {
    const el = h('div', { class: 'toast' + (isError ? ' err' : '') }, text);
    $('#toast-root').append(el);
    setTimeout(() => el.remove(), 4000);
  }

  const storage = {
    get(k) {
      try { return JSON.parse(localStorage.getItem(k)); } catch { return null; }
    },
    set(k, v) {
      try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
    },
  };

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard');
    } catch {
      toast('Could not copy. Select the text and copy it manually.', true);
    }
  }

  // ================= sounds =================
  let sfxCtx = null;
  function tones(freqs, dur = 0.12, vol = 0.12) {
    try {
      sfxCtx = sfxCtx || new AudioContext();
      let t = sfxCtx.currentTime;
      for (const f of freqs) {
        const o = sfxCtx.createOscillator();
        const g = sfxCtx.createGain();
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(sfxCtx.destination);
        o.start(t);
        o.stop(t + dur + 0.02);
        t += dur;
      }
    } catch {}
  }
  const sfx = {
    join: () => tones([523, 784]),
    leave: () => tones([784, 523]),
    ping: () => tones([988, 1319], 0.08, 0.08),
    ring: () => tones([659, 523, 659, 523], 0.18, 0.1),
  };

  // ================= state =================
  const S = {
    me: null,
    users: {},
    servers: {},
    dms: {},
    online: new Set(),
    voice: {}, // roomId -> [{ userId, muted, deafened, video, screen }]
    messages: {}, // channelId -> { list, hasMore }
    view: { serverId: null, channelId: null },
    friendsTab: 'online',
    lastChannel: storage.get('lastChannel') || {},
    unread: {},
    mentions: {},
    typing: {}, // channelId -> { userId: timeoutId }
    drafts: {},
    replyTo: null,
    editing: null,
    showMembers: storage.get('showMembers') !== false,
    forceBottom: false,
    booted: false,
    ring: null,
    dom: {},
  };
  let socket = null;
  const pendingInvite = (location.pathname.match(/^\/invite\/([\w-]+)/) || [])[1] || null;

  function emitAck(event, data) {
    return new Promise((resolve) =>
      socket
        .timeout(10000)
        .emit(event, data, (err, res) =>
          resolve(err ? { error: 'The server did not respond. Check your connection.' } : res || {})
        )
    );
  }

  const otherMember = (dm) => dm.members.find((m) => m !== S.me.id) || S.me.id;
  const userName = (uid) => (S.users[uid] ? S.users[uid].username : 'Unknown');
  const isFriend = (uid) => S.me.friends.includes(uid);

  function channelInfo(channelId) {
    if (!channelId) return null;
    if (S.dms[channelId]) return { type: 'dm', dm: S.dms[channelId] };
    for (const s of Object.values(S.servers)) {
      const c = s.channels.find((x) => x.id === channelId);
      if (c) return { type: c.type, server: s, channel: c };
    }
    return null;
  }

  function roomLabel(roomId) {
    const info = channelInfo(roomId);
    if (!info) return 'Call';
    if (info.type === 'dm') return `@${userName(otherMember(info.dm))}`;
    return `${info.channel.name} / ${info.server.name}`;
  }

  function avatar(uid, size = '', { dot = false, speak = false } = {}) {
    const u = S.users[uid] || { username: '?', color: '#4e5058' };
    const el = h('div', { class: `avatar ${size}`.trim(), title: u.username }, [...u.username][0].toUpperCase());
    el.style.background = u.color;
    if (dot) el.append(h('span', { class: 'dot' + (S.online.has(uid) ? ' on' : '') }));
    if (speak) {
      el.dataset.speak = uid;
      if (V.speaking.has(uid)) el.classList.add('speaking');
    }
    return el;
  }

  // ================= auth =================
  let authMode = 'login';
  function showAuth() {
    $('#app').classList.add('hidden');
    $('#auth').classList.remove('hidden');
    $('#auth-invite').classList.toggle('hidden', !pendingInvite);
    setAuthMode(pendingInvite ? 'register' : 'login');
  }

  function setAuthMode(mode) {
    authMode = mode;
    const reg = mode === 'register';
    $('#auth-title').textContent = reg ? 'Create an account' : 'Welcome back!';
    $('#auth-sub').textContent = reg ? 'Pick a username your friends can find you by.' : "We're so excited to see you again!";
    $('#auth-submit').textContent = reg ? 'Continue' : 'Log In';
    $('#auth-switch-text').textContent = reg ? 'Already have an account?' : 'Need an account?';
    $('#auth-switch').textContent = reg ? 'Log In' : 'Register';
    $('#auth-password').autocomplete = reg ? 'new-password' : 'current-password';
    $('#auth-error').textContent = '';
  }

  $('#auth-switch').addEventListener('click', () => setAuthMode(authMode === 'login' ? 'register' : 'login'));
  $('#auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#auth-submit');
    btn.disabled = true;
    $('#auth-error').textContent = '';
    try {
      const res = await fetch(`/api/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: $('#auth-username').value.trim(), password: $('#auth-password').value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      $('#auth-password').value = '';
      startApp();
    } catch (err) {
      $('#auth-error').textContent = err.message === 'Failed to fetch' ? "Can't reach the server." : err.message;
    } finally {
      btn.disabled = false;
    }
  });

  async function logout() {
    leaveVoice();
    await fetch('/api/logout', { method: 'POST' }).catch(() => {});
    location.href = '/';
  }

  // ================= socket =================
  function startApp() {
    $('#auth').classList.add('hidden');
    $('#app').classList.remove('hidden');
    fill($('#main'), h('div', { class: 'empty' }, 'Connecting…'));
    socket = io();
    let wasConnected = false;
    socket.on('connect_error', (err) => {
      if (err.message === 'unauthorized') {
        socket.disconnect();
        showAuth();
      }
    });
    socket.on('disconnect', (reason) => {
      if (wasConnected && reason !== 'io client disconnect') toast('Connection lost. Reconnecting…', true);
    });
    socket.on('connect', () => (wasConnected = true));

    socket.on('bootstrap', onBootstrap);
    socket.on('presence', ({ userId, online }) => {
      online ? S.online.add(userId) : S.online.delete(userId);
      renderAll();
    });
    socket.on('message:new', onMessageNew);
    socket.on('message:update', (m) => {
      const c = S.messages[m.channelId];
      if (!c) return;
      const i = c.list.findIndex((x) => x.id === m.id);
      if (i >= 0) c.list[i] = m;
      if (S.view.channelId === m.channelId) renderMessageList();
    });
    socket.on('message:delete', ({ channelId, id }) => {
      const c = S.messages[channelId];
      if (!c) return;
      c.list = c.list.filter((x) => x.id !== id);
      if (S.view.channelId === channelId) renderMessageList();
    });
    socket.on('typing', ({ channelId, userId }) => {
      if (userId === S.me.id) return;
      const t = (S.typing[channelId] = S.typing[channelId] || {});
      clearTimeout(t[userId]);
      t[userId] = setTimeout(() => {
        delete t[userId];
        if (S.view.channelId === channelId) renderTyping();
      }, 4000);
      if (S.view.channelId === channelId) renderTyping();
    });
    socket.on('friends:update', (d) => {
      const hadIncoming = S.me.incoming.length;
      Object.assign(S.users, d.users);
      d.online.forEach((id) => S.online.add(id));
      S.me.friends = d.friends;
      S.me.incoming = d.incoming;
      S.me.outgoing = d.outgoing;
      if (d.incoming.length > hadIncoming) sfx.ping();
      renderAll();
    });
    socket.on('server:added', (d) => {
      S.servers[d.server.id] = d.server;
      Object.assign(S.users, d.users);
      d.online.forEach((id) => S.online.add(id));
      Object.assign(S.voice, d.voice);
      renderAll();
    });
    socket.on('server:updated', (s) => {
      S.servers[s.id] = s;
      if (S.view.serverId === s.id && !s.channels.some((c) => c.id === S.view.channelId)) navigate(s.id);
      else renderAll();
    });
    socket.on('server:removed', ({ serverId, kicked, name }) => {
      const s = S.servers[serverId];
      if (!s) return;
      delete S.servers[serverId];
      for (const c of s.channels) delete S.voice[c.id];
      if (kicked) toast(`You were removed from ${name}`, true);
      if (S.view.serverId === serverId) navigate(null, null);
      else renderAll();
    });
    socket.on('server:member-joined', ({ serverId, user, online }) => {
      const s = S.servers[serverId];
      if (!s) return;
      S.users[user.id] = user;
      if (online) S.online.add(user.id);
      if (!s.members.includes(user.id)) s.members.push(user.id);
      renderAll();
    });
    socket.on('server:member-left', ({ serverId, userId }) => {
      const s = S.servers[serverId];
      if (!s) return;
      s.members = s.members.filter((m) => m !== userId);
      renderAll();
    });
    socket.on('dm:new', ({ dm, users, online }) => {
      S.dms[dm.id] = dm;
      Object.assign(S.users, users);
      online.forEach((id) => S.online.add(id));
      renderAll();
    });
    socket.on('voice:update', ({ roomId, members }) => {
      if (members.length) S.voice[roomId] = members;
      else delete S.voice[roomId];
      if (S.ring && S.ring.roomId === roomId && !members.length) S.ring.close();
      renderAll();
    });
    socket.on('voice:signal', onSignal);
    socket.on('voice:peer-left', ({ userId }) => {
      closePeer(userId);
      sfx.leave();
      renderStage();
    });
    socket.on('voice:ended', () => {
      if (!V.roomId) return;
      leaveVoice(false);
      toast('You were disconnected from the call');
    });
    socket.on('call:ring', ({ roomId, from }) => showRing(roomId, from));
    socket.on('call:declined', ({ roomId, by }) => {
      if (by === S.me.id) {
        if (S.ring && S.ring.roomId === roomId) S.ring.close();
      } else if (V.roomId === roomId) {
        toast(`${userName(by)} declined the call`);
      }
    });
  }

  function onBootstrap(b) {
    S.me = b.me;
    S.users = b.users;
    S.servers = {};
    b.servers.forEach((s) => (S.servers[s.id] = s));
    S.dms = {};
    b.dms.forEach((d) => (S.dms[d.id] = d));
    S.online = new Set([...b.online, b.me.id]);
    S.voice = b.voice;
    S.messages = {};
    V.iceServers = b.iceServers;

    if (!S.booted) {
      S.booted = true;
      const saved = storage.get('view');
      if (saved && (saved.channelId ? channelInfo(saved.channelId) : !saved.serverId || S.servers[saved.serverId]))
        S.view = saved;
      if (pendingInvite) acceptInvite(pendingInvite);
    }
    const v = S.view;
    if ((v.serverId && !S.servers[v.serverId]) || (v.channelId && !channelInfo(v.channelId))) S.view = { serverId: null, channelId: null };
    navigate(S.view.serverId, S.view.channelId);
    if (V.roomId) rejoinVoice();
  }

  async function acceptInvite(code) {
    history.replaceState(null, '', '/');
    const r = await emitAck('server:join', { code });
    if (r.error) return toast(r.error, true);
    navigate(r.serverId);
    toast(`Joined ${S.servers[r.serverId] ? S.servers[r.serverId].name : 'server'}!`);
  }

  function onMessageNew(m) {
    const c = S.messages[m.channelId];
    if (c && !c.list.some((x) => x.id === m.id)) c.list.push(m);
    if (S.dms[m.channelId]) S.dms[m.channelId].lastAt = m.createdAt;
    const t = S.typing[m.channelId];
    if (t && t[m.authorId]) {
      clearTimeout(t[m.authorId]);
      delete t[m.authorId];
    }
    const viewing = S.view.channelId === m.channelId && document.visibilityState === 'visible';
    if (m.authorId !== S.me.id && !viewing) {
      S.unread[m.channelId] = (S.unread[m.channelId] || 0) + 1;
      if (S.dms[m.channelId] || mentionsMe(m)) {
        S.mentions[m.channelId] = (S.mentions[m.channelId] || 0) + 1;
        sfx.ping();
      }
    }
    if (S.view.channelId === m.channelId) {
      const mine = m.authorId === S.me.id && S.forceBottom;
      S.forceBottom = false;
      renderMessageList({ keep: mine ? 'bottom' : 'auto' });
      renderTyping();
    }
    renderRail();
    renderSidebar();
    updateTitle();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && S.view.channelId) {
      markRead(S.view.channelId);
      renderRail();
      renderSidebar();
    }
  });

  function markRead(channelId) {
    delete S.unread[channelId];
    delete S.mentions[channelId];
    updateTitle();
  }

  function updateTitle() {
    const n = Object.values(S.mentions).reduce((a, b) => a + b, 0);
    document.title = (n ? `(${n}) ` : '') + 'Relay';
  }

  // ================= navigation =================
  function navigate(serverId, channelId) {
    if (serverId && !channelId) {
      const s = S.servers[serverId];
      const remembered = S.lastChannel[serverId];
      channelId =
        remembered && s.channels.some((c) => c.id === remembered)
          ? remembered
          : (s.channels.find((c) => c.type === 'text') || s.channels[0] || {}).id || null;
    }
    S.view = { serverId: serverId || null, channelId: channelId || null };
    if (serverId && channelId) {
      S.lastChannel[serverId] = channelId;
      storage.set('lastChannel', S.lastChannel);
    }
    storage.set('view', S.view);
    if (channelId) markRead(channelId);
    S.replyTo = null;
    S.editing = null;
    $('#app').classList.remove('drawer-open');
    closePopover();
    renderAll();
    renderMainBody();
    const info = channelInfo(channelId);
    if (info && info.type !== 'voice') loadMessages(channelId);
  }

  async function loadMessages(channelId, before) {
    if (!before && S.messages[channelId]) return;
    const r = await emitAck('messages:fetch', { channelId, before });
    if (r.error) return toast(r.error, true);
    const c = S.messages[channelId];
    if (before && c) {
      c.list = [...r.messages, ...c.list];
      c.hasMore = r.hasMore;
    } else {
      S.messages[channelId] = { list: r.messages, hasMore: r.hasMore };
    }
    if (S.view.channelId === channelId) renderMessageList({ keep: before ? 'prepend' : 'bottom' });
  }

  // ================= rendering: frame =================
  function renderAll() {
    if (!S.me) return;
    renderRail();
    renderSidebar();
    renderVoicePanel();
    renderUserPanel();
    renderMembers();
    renderHeader();
    renderStage();
    if (S.dom.friends && S.friendsTab !== 'add') renderFriends();
  }

  function railItem({ active, unread, badge, title, onclick, content, btnClass = '' }) {
    return h(
      'div',
      { class: 'rail-item' + (active ? ' active' : '') + (unread ? ' unread' : '') },
      h('span', { class: 'rail-pill' }),
      h('button', { class: 'rail-btn ' + btnClass, title, 'aria-label': title, onclick }, content),
      badge ? h('span', { class: 'badge' }, badge > 99 ? '99+' : badge) : null
    );
  }

  function renderRail() {
    const dmBadge =
      Object.keys(S.dms).reduce((n, id) => n + (S.mentions[id] || 0), 0) + S.me.incoming.length;
    const items = [
      railItem({
        active: !S.view.serverId,
        badge: dmBadge,
        title: 'Direct Messages',
        onclick: () => navigate(null, null),
        content: icon('chat'),
      }),
      h('div', { class: 'rail-sep' }),
    ];
    for (const s of Object.values(S.servers)) {
      const unread = s.channels.some((c) => S.unread[c.id]);
      const mentions = s.channels.reduce((n, c) => n + (S.mentions[c.id] || 0), 0);
      const initials = s.name
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => [...w][0])
        .join('')
        .slice(0, 3);
      items.push(
        railItem({
          active: S.view.serverId === s.id,
          unread,
          badge: mentions,
          title: s.name,
          onclick: () => navigate(s.id),
          content: initials,
        })
      );
    }
    items.push(
      railItem({ title: 'Create a server', onclick: openCreateServer, content: icon('plus'), btnClass: 'add' }),
      railItem({ title: 'Join a server', onclick: openJoinServer, content: icon('compass'), btnClass: 'add' })
    );
    fill($('#rail'), ...items);
  }

  function renderSidebar() {
    const header = $('#sidebar-header');
    const list = $('#sidebar-list');
    const s = S.servers[S.view.serverId];
    if (!s) {
      const fresh = h('header', { id: 'sidebar-header', class: 'sidebar-header' }, h('span', { class: 'title' }, 'Direct Messages'));
      header.replaceWith(fresh);
      const dms = Object.values(S.dms).sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
      fill(list, 
        h(
          'button',
          { class: 'ch' + (!S.view.channelId ? ' active' : ''), onclick: () => navigate(null, null) },
          icon('users'),
          h('span', { class: 'name' }, 'Friends'),
          S.me.incoming.length ? h('span', { class: 'badge' }, S.me.incoming.length) : null
        ),
        h('div', { class: 'cat' }, h('span', null, 'Direct Messages'), iconBtn('plus', 'New message', openNewDm)),
        dms.length
          ? dms.map((dm) => {
              const uid = otherMember(dm);
              const inCall = (S.voice[dm.id] || []).length > 0;
              return h(
                'button',
                {
                  class:
                    'ch ch-dm' + (S.view.channelId === dm.id ? ' active' : '') + (S.unread[dm.id] ? ' unread' : ''),
                  onclick: () => navigate(null, dm.id),
                },
                avatar(uid, '', { dot: true }),
                h('span', { class: 'name' }, userName(uid)),
                inCall ? icon('phone', 'sm') : null,
                S.mentions[dm.id] ? h('span', { class: 'badge' }, S.mentions[dm.id]) : null
              );
            })
          : h('p', { class: 'muted small', style: { padding: '0 8px' } }, 'No conversations yet. Add a friend to start chatting!')
      );
      return;
    }

    const owner = s.ownerId === S.me.id;
    const fresh = h(
      'button',
      { id: 'sidebar-header', class: 'sidebar-header', onclick: (e) => openServerMenu(e.currentTarget, s) },
      h('span', { class: 'title' }, s.name),
      icon('chevron', 'sm')
    );
    header.replaceWith(fresh);

    const channelBtn = (c) => {
      const isVoice = c.type === 'voice';
      const btn = h(
        'button',
        {
          class:
            'ch' + (S.view.channelId === c.id ? ' active' : '') + (!isVoice && S.unread[c.id] ? ' unread' : ''),
          onclick: () => {
            navigate(s.id, c.id);
            if (isVoice && V.roomId !== c.id) joinVoice(c.id);
          },
        },
        icon(isVoice ? 'speaker' : 'hash', 'sm'),
        h('span', { class: 'name' }, c.name),
        S.mentions[c.id] ? h('span', { class: 'badge' }, S.mentions[c.id]) : null,
        owner
          ? h(
              'span',
              { class: 'ch-actions' },
              iconBtn('trash', 'Delete channel', (e) => {
                e.stopPropagation();
                deleteChannel(s, c);
              })
            )
          : null
      );
      if (!isVoice) return btn;
      const members = S.voice[c.id] || [];
      return [
        btn,
        members.length
          ? h(
              'div',
              { class: 'voice-users' },
              members.map((m) =>
                h(
                  'div',
                  { class: 'voice-user' },
                  avatar(m.userId, 'sm', { speak: true }),
                  h('span', { class: 'name' }, userName(m.userId)),
                  m.screen || m.video ? h('span', { class: 'tag' }, m.screen ? 'LIVE' : 'CAM') : null,
                  m.deafened ? icon('headphonesOff', 'xs') : m.muted ? icon('micOff', 'xs') : null
                )
              )
            )
          : null,
      ];
    };

    const cat = (label, type) =>
      h(
        'div',
        { class: 'cat' },
        h('span', null, label),
        owner ? iconBtn('plus', 'Create channel', () => openCreateChannel(s, type)) : null
      );

    fill(list, 
      cat('Text Channels', 'text'),
      s.channels.filter((c) => c.type === 'text').map(channelBtn),
      cat('Voice Channels', 'voice'),
      s.channels.filter((c) => c.type === 'voice').map(channelBtn)
    );
  }

  function renderVoicePanel() {
    const el = $('#voice-panel');
    if (!V.roomId) {
      el.classList.add('hidden');
      return;
    }
    const info = channelInfo(V.roomId);
    el.classList.remove('hidden');
    fill(el, 
      h(
        'div',
        { class: 'row' },
        h(
          'button',
          {
            class: 'grow',
            title: 'Go to call',
            onclick: () => info && navigate(info.server ? info.server.id : null, V.roomId),
          },
          h('div', { class: 'voice-status' }, 'Voice Connected'),
          h('div', { class: 'voice-room' }, roomLabel(V.roomId))
        ),
        iconBtn('phone', 'Disconnect', () => leaveVoice(), 'danger')
      ),
      h(
        'div',
        { class: 'ctrls' },
        h(
          'button',
          { class: 'btn' + (V.camTrack ? ' on' : ''), title: V.camTrack ? 'Turn off camera' : 'Turn on camera', onclick: toggleCamera },
          icon(V.camTrack ? 'video' : 'videoOff', 'sm')
        ),
        h(
          'button',
          { class: 'btn' + (V.screenTrack ? ' on' : ''), title: V.screenTrack ? 'Stop sharing' : 'Share your screen', onclick: toggleScreen },
          icon('screen', 'sm')
        )
      )
    );
  }

  function renderUserPanel() {
    fill($('#user-panel'), 
      avatar(S.me.id, '', { dot: true, speak: true }),
      h('div', { class: 'who' }, h('b', null, S.me.username), h('span', null, V.roomId ? 'In a call' : 'Online')),
      iconBtn(V.muted ? 'micOff' : 'mic', V.muted ? 'Unmute' : 'Mute', toggleMute, V.muted ? 'off' : ''),
      iconBtn(V.deafened ? 'headphonesOff' : 'headphones', V.deafened ? 'Undeafen' : 'Deafen', toggleDeafen, V.deafened ? 'off' : ''),
      iconBtn('logout', 'Log out', logout)
    );
  }

  function renderMembers() {
    const el = $('#members');
    const s = S.servers[S.view.serverId];
    if (!s || !S.showMembers) {
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    const sorted = [...s.members].sort((a, b) => userName(a).localeCompare(userName(b)));
    const on = sorted.filter((id) => S.online.has(id));
    const off = sorted.filter((id) => !S.online.has(id));
    const row = (id, offline) =>
      h(
        'button',
        { class: 'member' + (offline ? ' off' : ''), onclick: (e) => openUserMenu(e.currentTarget, id) },
        avatar(id, '', { dot: true }),
        h('span', { class: 'name' }, userName(id)),
        id === s.ownerId ? h('span', { class: 'crown', title: 'Server owner' }, '👑') : null
      );
    fill(el, 
      h('div', { class: 'cat' }, `Online — ${on.length}`),
      on.map((id) => row(id, false)),
      off.length ? h('div', { class: 'cat' }, `Offline — ${off.length}`) : null,
      off.map((id) => row(id, true))
    );
  }

  // ================= rendering: main =================
  function renderMainBody() {
    const main = $('#main');
    S.dom = {};
    const header = h('header', { class: 'main-header' });
    const body = h('div', { class: 'main-body' });
    S.dom.header = header;
    fill(main, header, body);
    const info = channelInfo(S.view.channelId);

    if (!S.view.channelId) {
      S.dom.friends = h('div', { class: 'friends' });
      body.append(S.dom.friends);
      renderFriends();
    } else if (!info) {
      body.append(h('div', { class: 'empty' }, 'Nothing here yet.'));
    } else if (info.type === 'voice') {
      S.dom.stage = h('div', { class: 'stage full' });
      body.append(S.dom.stage);
    } else {
      if (info.type === 'dm') {
        S.dom.stage = h('div', { class: 'stage hidden' });
        body.append(S.dom.stage);
      }
      S.dom.messages = h('div', { class: 'messages', onclick: onMessagesClick });
      S.dom.messages.addEventListener('scroll', () => {
        const c = S.messages[S.view.channelId];
        if (S.dom.messages.scrollTop < 40 && c && c.hasMore && !c.loadingMore) {
          c.loadingMore = true;
          loadMessages(S.view.channelId, c.list[0] && c.list[0].id).finally(() => (c.loadingMore = false));
        }
      });
      body.append(S.dom.messages, composerEl(info));
      renderMessageList({ keep: 'bottom' });
    }
    renderHeader();
    renderStage();
  }

  function renderHeader() {
    const el = S.dom.header;
    if (!el) return;
    const menuBtn = iconBtn('menu', 'Open menu', () => $('#app').classList.toggle('drawer-open'), 'menu-btn');
    const info = channelInfo(S.view.channelId);

    if (!S.view.channelId) {
      const tab = (id, label, extra) =>
        h(
          'button',
          {
            class: 'tab' + (id === 'add' ? ' add' : '') + (S.friendsTab === id ? ' active' : ''),
            onclick: () => {
              S.friendsTab = id;
              renderHeader();
              renderFriends();
            },
          },
          label,
          extra
        );
      fill(el, 
        menuBtn,
        h('div', { class: 'title' }, icon('users'), h('span', null, 'Friends')),
        h(
          'div',
          { class: 'tabs' },
          tab('online', 'Online'),
          tab('all', 'All'),
          tab('pending', 'Pending ', S.me.incoming.length ? h('span', { class: 'badge' }, S.me.incoming.length) : null),
          tab('add', 'Add Friend')
        )
      );
      return;
    }
    if (!info) return fill(el, menuBtn);

    if (info.type === 'dm') {
      const uid = otherMember(info.dm);
      fill(el, 
        menuBtn,
        h('div', { class: 'title' }, avatar(uid, 'sm', { dot: true }), h('span', null, userName(uid))),
        h('div', { class: 'spacer' }),
        iconBtn('phone', 'Start voice call', () => joinVoice(info.dm.id)),
        iconBtn('video', 'Start video call', () => joinVoice(info.dm.id, { video: true }))
      );
      return;
    }
    fill(el, 
      menuBtn,
      h('div', { class: 'title' }, icon(info.type === 'voice' ? 'speaker' : 'hash'), h('span', null, info.channel.name)),
      h('div', { class: 'spacer' }),
      iconBtn('userPlus', 'Invite people', () => openInvite(info.server)),
      iconBtn(
        'users',
        S.showMembers ? 'Hide member list' : 'Show member list',
        () => {
          S.showMembers = !S.showMembers;
          storage.set('showMembers', S.showMembers);
          renderMembers();
          renderHeader();
        },
        S.showMembers ? 'active' : ''
      )
    );
  }

  // ================= friends page =================
  function renderFriends() {
    const el = S.dom.friends;
    if (!el) return;
    const me = S.me;
    const row = (uid, sub, actions) =>
      h(
        'div',
        { class: 'friend' },
        avatar(uid, 'lg', { dot: true }),
        h('div', { class: 'who' }, h('b', null, userName(uid)), h('span', null, sub)),
        h('div', { class: 'acts' }, actions)
      );
    const roundBtn = (name, title, onclick, cls = '') =>
      h('button', { class: 'round-btn ' + cls, title, 'aria-label': title, onclick }, icon(name, 'sm'));
    const friendActions = (uid) => [
      roundBtn('chat', 'Message', () => openDm(uid)),
      roundBtn('phone', 'Call', () => openDm(uid, true)),
      roundBtn('x', 'Remove friend', () => removeFriend(uid), 'no'),
    ];
    const empty = (emoji, text) => h('div', { class: 'empty' }, h('span', { class: 'big-emoji' }, emoji), text);

    if (S.friendsTab === 'add') {
      const input = h('input', { placeholder: 'Enter a username', maxlength: 40, autocomplete: 'off', 'aria-label': 'Username' });
      const msg = h('div', { class: 'form-msg' });
      const btn = h('button', { class: 'btn btn-primary btn-sm', type: 'submit' }, 'Send Friend Request');
      const form = h(
        'form',
        {
          onsubmit: async (e) => {
            e.preventDefault();
            const username = input.value.trim();
            if (!username) return;
            btn.disabled = true;
            const r = await emitAck('friend:request', { username });
            btn.disabled = false;
            msg.className = 'form-msg ' + (r.error ? 'err' : 'ok');
            msg.textContent = r.error || `Success! Your friend request to ${username} was sent.`;
            if (!r.error) input.value = '';
          },
        },
        input,
        btn
      );
      fill(el, 
        h(
          'div',
          { class: 'add-friend' },
          h('h3', null, 'Add Friend'),
          h('p', null, 'You can add friends with their username. Your username is ', h('b', null, me.username), '.'),
          form,
          msg
        ),
        h(
          'div',
          { class: 'add-friend', style: { marginTop: '32px' } },
          h('h3', null, 'Invite someone new'),
          h('p', null, 'Send them this site\'s link so they can create an account:'),
          h(
            'div',
            { class: 'copy-row', style: { marginTop: '8px' } },
            h('input', { value: location.origin, readonly: true, 'aria-label': 'Site link' }),
            h('button', { class: 'btn btn-primary btn-sm', onclick: () => copyText(location.origin) }, 'Copy')
          )
        )
      );
      input.focus();
      return;
    }

    if (S.friendsTab === 'pending') {
      const n = me.incoming.length + me.outgoing.length;
      fill(el, 
        h('h3', null, `Pending — ${n}`),
        me.incoming.map((uid) =>
          row(uid, 'Incoming Friend Request', [
            roundBtn('check', 'Accept', () => emitAck('friend:accept', { userId: uid }).then(showError), 'ok'),
            roundBtn('x', 'Ignore', () => emitAck('friend:remove', { userId: uid }).then(showError), 'no'),
          ])
        ),
        me.outgoing.map((uid) =>
          row(uid, 'Outgoing Friend Request', [
            roundBtn('x', 'Cancel', () => emitAck('friend:remove', { userId: uid }).then(showError), 'no'),
          ])
        ),
        n ? null : empty('📭', "There are no pending friend requests.")
      );
      return;
    }

    const list = me.friends
      .filter((id) => S.friendsTab === 'all' || S.online.has(id))
      .sort((a, b) => userName(a).localeCompare(userName(b)));
    fill(el, 
      h('h3', null, `${S.friendsTab === 'all' ? 'All friends' : 'Online'} — ${list.length}`),
      list.map((uid) => row(uid, S.online.has(uid) ? 'Online' : 'Offline', friendActions(uid))),
      list.length
        ? null
        : me.friends.length
          ? empty('💤', 'No friends are online right now.')
          : h(
              'div',
              { class: 'empty' },
              h('span', { class: 'big-emoji' }, '👋'),
              'No friends yet. ',
              h('button', { class: 'link-btn', onclick: () => { S.friendsTab = 'add'; renderHeader(); renderFriends(); } }, 'Add a friend'),
              ' to get started.'
            )
    );
  }

  const showError = (r) => r && r.error && toast(r.error, true);

  async function openDm(uid, call = false) {
    const r = await emitAck('dm:open', { userId: uid });
    if (r.error) return toast(r.error, true);
    navigate(null, r.dmId);
    if (call) joinVoice(r.dmId);
  }

  async function removeFriend(uid) {
    if (await confirmModal({ title: `Remove ${userName(uid)}`, text: `Are you sure you want to remove ${userName(uid)} from your friends?`, confirm: 'Remove Friend', danger: true }))
      showError(await emitAck('friend:remove', { userId: uid }));
  }

  // ================= messages =================
  const mentionsMe = (m) =>
    new RegExp(`@${escapeRe(S.me.username)}(?![\\w.])`, 'i').test(m.content) ||
    (m.replyTo && m.replyTo.authorId === S.me.id && m.authorId !== S.me.id);

  const IMAGE_RE = /^https?:\/\/\S+\.(?:png|jpe?g|gif|webp)(?:\?\S*)?$/i;

  function renderMarkdown(text) {
    const slots = [];
    const stash = (html) => `\u0001${slots.push(html) - 1}\u0001`;
    let s = escapeHtml(text);
    s = s.replace(/```(?:[\w+-]*\n)?([\s\S]*?)\n?```/g, (_, code) => stash(`<pre><code>${code}</code></pre>`));
    s = s.replace(/`([^`\n]+)`/g, (_, code) => stash(`<code>${code}</code>`));
    s = s.replace(/https?:\/\/(?:(?!&quot;|&#39;|&lt;|&gt;)[^\s<])+/g, (match) => {
      const url = match.replace(/[.,:;!?)\]]+$/, '');
      return stash(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`) + match.slice(url.length);
    });
    const known = new Set(Object.values(S.users).map((u) => u.username.toLowerCase()));
    s = s.replace(/@([a-zA-Z0-9_.]{2,32})/g, (m, name) =>
      known.has(name.toLowerCase()) ? stash(`<span class="mention">${m}</span>`) : m
    );
    s = s
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<u>$1</u>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/~~(.+?)~~/g, '<s>$1</s>')
      .replace(/\|\|(.+?)\|\|/g, '<span class="spoiler" title="Click to reveal">$1</span>');
    return s.replace(/\u0001(\d+)\u0001/g, (_, i) => slots[+i]);
  }

  function welcomeEl(info) {
    if (info.type === 'dm') {
      const uid = otherMember(info.dm);
      return h(
        'div',
        { class: 'welcome' },
        avatar(uid, 'xl'),
        h('h2', null, userName(uid)),
        h('p', { class: 'muted' }, 'This is the beginning of your direct message history with ', h('b', null, '@' + userName(uid)), '.')
      );
    }
    return h(
      'div',
      { class: 'welcome' },
      h('div', { class: 'big' }, icon('hash')),
      h('h2', null, `Welcome to #${info.channel.name}!`),
      h('p', { class: 'muted' }, `This is the start of the #${info.channel.name} channel.`)
    );
  }

  function renderMessageList({ keep = 'auto' } = {}) {
    const box = S.dom.messages;
    if (!box) return;
    const channelId = S.view.channelId;
    const info = channelInfo(channelId);
    const cache = S.messages[channelId];
    const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
    const prevHeight = box.scrollHeight;
    const prevTop = box.scrollTop;

    if (!cache) {
      fill(box, h('div', { class: 'empty' }, 'Loading messages…'));
      return;
    }
    const nodes = [cache.hasMore ? h('div', { class: 'empty small' }, 'Loading older messages…') : welcomeEl(info)];
    let prev = null;
    for (const m of cache.list) {
      const grouped =
        prev &&
        prev.authorId === m.authorId &&
        m.createdAt - prev.createdAt < 7 * 60e3 &&
        !m.replyTo &&
        new Date(prev.createdAt).toDateString() === new Date(m.createdAt).toDateString();
      if (!prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString())
        nodes.push(h('div', { class: 'day' }, h('span', null, new Date(m.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' }))));
      nodes.push(messageEl(m, grouped, info));
      prev = m;
    }
    fill(box, ...nodes);

    if (keep === 'bottom' || (keep === 'auto' && nearBottom)) box.scrollTop = box.scrollHeight;
    else if (keep === 'prepend') box.scrollTop = box.scrollHeight - prevHeight + prevTop;
    else box.scrollTop = prevTop;

    if (S.editing) {
      const ta = $('.edit-box textarea', box);
      if (ta) {
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
      }
    }
  }

  function messageEl(m, grouped, info) {
    const mine = m.authorId === S.me.id;
    const canDelete = mine || (info.server && info.server.ownerId === S.me.id);
    const el = h('div', {
      class: 'msg' + (grouped ? ' grouped' : '') + (m.replyTo ? ' has-reply' : '') + (mentionsMe(m) ? ' mentioned' : ''),
      id: 'm-' + m.id,
    });

    if (m.replyTo) {
      el.append(
        h(
          'div',
          { class: 'reply-ref', 'data-jump': m.replyTo.id },
          avatar(m.replyTo.authorId, 'sm'),
          h('b', null, '@' + userName(m.replyTo.authorId)),
          h('span', { class: 'txt' }, m.replyTo.content)
        )
      );
    }
    if (grouped) {
      el.append(h('span', { class: 'side-time', title: fmtTime(m.createdAt) }, shortTime(m.createdAt)));
    } else {
      const av = avatar(m.authorId, 'lg');
      av.addEventListener('click', (e) => openUserMenu(e.currentTarget, m.authorId));
      el.append(
        av,
        h(
          'div',
          { class: 'msg-head' },
          h('span', { class: 'msg-author', onclick: (e) => openUserMenu(e.currentTarget, m.authorId) }, userName(m.authorId)),
          h('span', { class: 'msg-time', title: new Date(m.createdAt).toLocaleString() }, fmtTime(m.createdAt))
        )
      );
    }

    if (S.editing === m.id) {
      el.append(editBox(m));
    } else {
      const content = h('div', { class: 'msg-content', html: renderMarkdown(m.content) });
      if (m.editedAt) content.append(h('span', { class: 'edited', title: new Date(m.editedAt).toLocaleString() }, '(edited)'));
      el.append(content);
    }

    const images = (m.content.match(/https?:\/\/\S+/g) || []).filter((u) => IMAGE_RE.test(u)).slice(0, 3);
    for (const src of images) {
      const img = h('img', { class: 'embed-img', src, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' });
      img.addEventListener('load', () => {
        const box = S.dom.messages;
        if (box && box.scrollHeight - box.scrollTop - box.clientHeight < img.height + 160) box.scrollTop = box.scrollHeight;
      });
      img.addEventListener('error', () => img.remove());
      el.append(h('a', { href: src, target: '_blank', rel: 'noopener noreferrer' }, img));
    }

    const reactions = Object.entries(m.reactions || {});
    if (reactions.length) {
      el.append(
        h(
          'div',
          { class: 'reactions' },
          reactions.map(([emoji, users]) =>
            h(
              'button',
              {
                class: 'reaction' + (users.includes(S.me.id) ? ' mine' : ''),
                title: users.map(userName).join(', '),
                onclick: () => react(m, emoji),
              },
              emoji,
              h('span', { class: 'n' }, users.length)
            )
          )
        )
      );
    }

    const actions = h(
      'div',
      { class: 'msg-actions' },
      iconBtn('smile', 'Add reaction', (e) => {
        actions.classList.add('open');
        openEmojiPicker(e.currentTarget, (emoji) => react(m, emoji), () => actions.classList.remove('open'));
      }),
      iconBtn('reply', 'Reply', () => startReply(m)),
      mine ? iconBtn('edit', 'Edit', () => startEdit(m.id)) : null,
      canDelete ? iconBtn('trash', 'Delete', (e) => deleteMessage(m, e.shiftKey), 'danger') : null
    );
    el.append(actions);
    return el;
  }

  function editBox(m) {
    const ta = h('textarea', { rows: 1, maxlength: 2000, 'aria-label': 'Edit message' });
    ta.value = m.content;
    const save = async () => {
      const content = ta.value.trim();
      S.editing = null;
      if (!content) return deleteMessage(m);
      if (content !== m.content) showError(await emitAck('message:edit', { channelId: m.channelId, id: m.id, content }));
      renderMessageList();
    };
    const cancel = () => {
      S.editing = null;
      renderMessageList();
      focusComposer();
    };
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        save();
      } else if (e.key === 'Escape') {
        cancel();
      }
    });
    ta.addEventListener('input', () => autoGrow(ta));
    requestAnimationFrame(() => autoGrow(ta));
    return h(
      'div',
      { class: 'edit-box' },
      ta,
      h(
        'div',
        { class: 'hint' },
        'escape to ',
        h('button', { class: 'link-btn', onclick: cancel }, 'cancel'),
        ' • enter to ',
        h('button', { class: 'link-btn', onclick: save }, 'save')
      )
    );
  }

  function startEdit(id) {
    S.editing = id;
    renderMessageList();
  }

  function startReply(m) {
    S.replyTo = m;
    renderReplyBar();
    focusComposer();
  }

  async function react(m, emoji) {
    showError(await emitAck('message:react', { channelId: m.channelId, id: m.id, emoji }));
  }

  async function deleteMessage(m, skipConfirm = false) {
    if (
      !skipConfirm &&
      !(await confirmModal({
        title: 'Delete Message',
        text: 'Are you sure you want to delete this message? (Tip: hold Shift while clicking delete to skip this.)',
        confirm: 'Delete',
        danger: true,
      }))
    )
      return;
    showError(await emitAck('message:delete', { channelId: m.channelId, id: m.id }));
  }

  function onMessagesClick(e) {
    const spoiler = e.target.closest('.spoiler');
    if (spoiler) return spoiler.classList.add('shown');
    const jump = e.target.closest('[data-jump]');
    if (jump) {
      const target = document.getElementById('m-' + jump.dataset.jump);
      if (!target) return toast('That message is too far back to jump to.');
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      target.classList.add('highlight');
      setTimeout(() => target.classList.remove('highlight'), 1500);
    }
  }

  // ================= composer =================
  const autoGrow = (ta) => {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  };
  const focusComposer = () => {
    if (S.dom.input && matchMedia('(hover: hover)').matches) S.dom.input.focus();
  };

  function composerEl(info) {
    const channelId = S.view.channelId;
    const placeholder = info.type === 'dm' ? `Message @${userName(otherMember(info.dm))}` : `Message #${info.channel.name}`;
    const ta = h('textarea', { rows: 1, placeholder, maxlength: 2000, 'aria-label': placeholder });
    ta.value = S.drafts[channelId] || '';
    let lastTyping = 0;

    const send = async () => {
      const content = ta.value.trim();
      if (!content) return;
      const replyTo = S.replyTo && S.replyTo.id;
      ta.value = '';
      S.drafts[channelId] = '';
      S.replyTo = null;
      renderReplyBar();
      autoGrow(ta);
      S.forceBottom = true;
      const r = await emitAck('message:send', { channelId, content, replyTo });
      if (r.error) {
        toast(r.error, true);
        if (!ta.value) ta.value = content;
        autoGrow(ta);
      }
    };

    ta.addEventListener('input', () => {
      autoGrow(ta);
      S.drafts[channelId] = ta.value;
      if (ta.value && Date.now() - lastTyping > 3000) {
        lastTyping = Date.now();
        socket.emit('typing', { channelId });
      }
    });
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        send();
      } else if (e.key === 'Escape' && S.replyTo) {
        S.replyTo = null;
        renderReplyBar();
      } else if (e.key === 'ArrowUp' && !ta.value) {
        const c = S.messages[channelId];
        const last = c && [...c.list].reverse().find((m) => m.authorId === S.me.id);
        if (last) {
          e.preventDefault();
          startEdit(last.id);
        }
      }
    });

    const emojiBtn = iconBtn('smile', 'Emoji', (e) =>
      openEmojiPicker(e.currentTarget, (emoji) => {
        const pos = ta.selectionStart ?? ta.value.length;
        ta.value = ta.value.slice(0, pos) + emoji + ta.value.slice(ta.selectionEnd ?? pos);
        ta.dispatchEvent(new Event('input'));
        ta.focus();
      })
    );

    S.dom.input = ta;
    S.dom.replyBar = h('div');
    S.dom.composer = h('div', { class: 'composer' }, ta, emojiBtn);
    S.dom.typing = h('div', { class: 'typing', 'aria-live': 'polite' });
    requestAnimationFrame(() => {
      autoGrow(ta);
      focusComposer();
    });
    renderReplyBar();
    renderTyping();
    return h('div', { class: 'composer-wrap' }, S.dom.replyBar, S.dom.composer, S.dom.typing);
  }

  function renderReplyBar() {
    if (!S.dom.replyBar) return;
    const m = S.replyTo;
    S.dom.composer.classList.toggle('has-reply', !!m);
    fill(S.dom.replyBar, 
      m
        ? h(
            'div',
            { class: 'reply-bar' },
            h('span', null, 'Replying to ', h('b', null, userName(m.authorId))),
            iconBtn('x', 'Cancel reply', () => {
              S.replyTo = null;
              renderReplyBar();
            })
          )
        : ''
    );
  }

  function renderTyping() {
    if (!S.dom.typing) return;
    const ids = Object.keys(S.typing[S.view.channelId] || {});
    if (!ids.length) return fill(S.dom.typing);
    const names = ids.map((id) => h('b', null, userName(id)));
    const text =
      ids.length === 1
        ? [names[0], ' is typing…']
        : ids.length <= 3
          ? [...names.slice(0, -1).flatMap((n) => [n, ', ']).slice(0, -1), ' and ', names[names.length - 1], ' are typing…']
          : ['Several people are typing…'];
    fill(S.dom.typing, h('span', { class: 'dots' }, h('i'), h('i'), h('i')), ...text);
  }

  // ================= popovers, menus & modals =================
  const EMOJIS = '😀 😂 🤣 😊 😍 🥰 😘 😎 🤔 😐 🙄 😏 😴 🥳 😭 😢 😡 🤯 😱 🥶 🤡 💀 👻 👽 🤖 💩 👍 👎 👏 🙌 🙏 💪 👀 👋 🤝 ✌️ 🤞 👌 ❤️ 🧡 💛 💚 💙 💜 🖤 💔 🔥 ✨ ⭐ 🎉 🎊 🎁 🏆 ⚽ 🏀 🎮 🎧 🎵 🍕 🍔 🍟 🍩 ☕ 🐶 🐱 🦄 🌈 ☀️ 🌙 ✅ ❌ ⚠️ ❓ 💯 🚀 💡 📌'.split(' ');

  let activePopover = null;
  function closePopover() {
    if (activePopover) activePopover();
  }

  function popover(anchor, content, onClose) {
    closePopover();
    const pop = h('div', { class: 'popover' }, content);
    document.body.append(pop);
    const r = anchor.getBoundingClientRect();
    const pr = pop.getBoundingClientRect();
    let top = r.bottom + 6;
    if (top + pr.height > innerHeight - 8) top = Math.max(8, r.top - pr.height - 6);
    const left = Math.min(Math.max(8, r.right - pr.width), innerWidth - pr.width - 8);
    pop.style.top = top + 'px';
    pop.style.left = Math.max(8, left) + 'px';
    const outside = (e) => {
      if (!pop.contains(e.target) && !anchor.contains(e.target)) close();
    };
    const key = (e) => e.key === 'Escape' && close();
    const close = () => {
      pop.remove();
      document.removeEventListener('mousedown', outside, true);
      document.removeEventListener('keydown', key);
      activePopover = null;
      if (onClose) onClose();
    };
    setTimeout(() => {
      document.addEventListener('mousedown', outside, true);
      document.addEventListener('keydown', key);
    });
    activePopover = close;
    return close;
  }

  function openEmojiPicker(anchor, onPick, onClose) {
    const close = popover(
      anchor,
      h(
        'div',
        { class: 'emoji-grid' },
        EMOJIS.map((e) =>
          h('button', { title: e, onclick: () => { onPick(e); close(); } }, e)
        )
      ),
      onClose
    );
  }

  function menu(anchor, items) {
    const close = popover(
      anchor,
      h(
        'div',
        { class: 'menu' },
        items.filter(Boolean).map((it) =>
          it === '-'
            ? h('hr')
            : h('button', { class: it.danger ? 'danger' : '', onclick: () => { close(); it.action(); } }, it.label, it.icon ? icon(it.icon, 'sm') : null)
        )
      )
    );
  }

  function openUserMenu(anchor, uid) {
    if (uid === S.me.id) return menu(anchor, [{ label: 'Copy Username', icon: 'link', action: () => copyText(S.me.username) }]);
    const s = S.servers[S.view.serverId];
    const friend = isFriend(uid);
    const pending = S.me.outgoing.includes(uid);
    const incoming = S.me.incoming.includes(uid);
    menu(anchor, [
      { label: 'Message', icon: 'chat', action: () => openDm(uid) },
      { label: 'Call', icon: 'phone', action: () => openDm(uid, true) },
      '-',
      friend
        ? { label: 'Remove Friend', danger: true, action: () => removeFriend(uid) }
        : incoming
          ? { label: 'Accept Friend Request', icon: 'check', action: () => emitAck('friend:accept', { userId: uid }).then(showError) }
          : pending
            ? { label: 'Friend Request Sent', action: () => {} }
            : { label: 'Add Friend', icon: 'userPlus', action: () => emitAck('friend:request', { username: userName(uid) }).then((r) => (r.error ? toast(r.error, true) : toast('Friend request sent'))) },
      { label: 'Copy Username', icon: 'link', action: () => copyText(userName(uid)) },
      s && s.ownerId === S.me.id && s.members.includes(uid)
        ? { label: `Kick ${userName(uid)}`, danger: true, action: () => kickMember(s, uid) }
        : null,
    ]);
  }

  function openServerMenu(anchor, s) {
    const owner = s.ownerId === S.me.id;
    menu(anchor, [
      { label: 'Invite People', icon: 'userPlus', action: () => openInvite(s) },
      owner ? { label: 'Create Channel', icon: 'plus', action: () => openCreateChannel(s, 'text') } : null,
      owner ? { label: 'Rename Server', icon: 'edit', action: () => openRenameServer(s) } : null,
      '-',
      owner
        ? { label: 'Delete Server', danger: true, icon: 'trash', action: () => deleteServer(s) }
        : { label: 'Leave Server', danger: true, icon: 'logout', action: () => leaveServer(s) },
    ]);
  }

  function modal(build, onClose) {
    const backdrop = h('div', { class: 'modal-backdrop' });
    const box = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true' });
    const key = (e) => e.key === 'Escape' && close();
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      backdrop.remove();
      document.removeEventListener('keydown', key);
      if (onClose) onClose();
    };
    backdrop.addEventListener('mousedown', (e) => e.target === backdrop && close());
    document.addEventListener('keydown', key);
    box.append(...[build(close)].flat());
    backdrop.append(box);
    $('#modal-root').append(backdrop);
    const first = $('input, textarea', box);
    if (first) first.focus();
    return close;
  }

  // A modal with one text field. `submit` returns an error string to keep it open.
  function formModal({ title, sub, label, value = '', placeholder = '', submitLabel, extra, submit }) {
    modal((close) => {
      const input = h('input', { class: 'field', value, placeholder, maxlength: 200, required: true });
      const err = h('div', { class: 'form-msg err' });
      const btn = h('button', { class: 'btn btn-primary', type: 'submit' }, submitLabel);
      const form = h(
        'form',
        {
          onsubmit: async (e) => {
            e.preventDefault();
            btn.disabled = true;
            const error = await submit(input.value.trim());
            btn.disabled = false;
            if (error) err.textContent = error;
            else close();
          },
        },
        h('div', { class: 'modal-body' }, h('h2', null, title), sub ? h('p', null, sub) : null, extra || null, h('label', null, label, input), err),
        h('div', { class: 'modal-foot' }, h('button', { class: 'btn btn-ghost', type: 'button', onclick: close }, 'Cancel'), btn)
      );
      requestAnimationFrame(() => input.select());
      return form;
    });
  }

  function confirmModal({ title, text, confirm, danger }) {
    return new Promise((resolve) => {
      let result = false;
      modal(
        (close) => [
          h('div', { class: 'modal-body' }, h('h2', null, title), h('p', null, text)),
          h(
            'div',
            { class: 'modal-foot' },
            h('button', { class: 'btn btn-ghost', onclick: close }, 'Cancel'),
            h('button', { class: 'btn ' + (danger ? 'btn-red' : 'btn-primary'), onclick: () => { result = true; close(); } }, confirm)
          ),
        ],
        () => resolve(result)
      );
    });
  }

  function openCreateServer() {
    formModal({
      title: 'Create your server',
      sub: 'Your server is where you and your friends hang out. Make yours and start talking.',
      label: 'Server name',
      value: `${S.me.username}'s server`,
      submitLabel: 'Create',
      submit: async (name) => {
        const r = await emitAck('server:create', { name });
        if (r.error) return r.error;
        navigate(r.serverId);
        openInvite(S.servers[r.serverId]);
      },
    });
  }

  function openJoinServer() {
    formModal({
      title: 'Join a server',
      sub: 'Paste an invite link from a friend.',
      label: 'Invite link',
      placeholder: `${location.origin}/invite/hTKzmak`,
      submitLabel: 'Join Server',
      submit: async (code) => {
        if (!code) return 'Please enter an invite link.';
        const r = await emitAck('server:join', { code });
        if (r.error) return r.error;
        navigate(r.serverId);
      },
    });
  }

  function openRenameServer(s) {
    formModal({
      title: 'Rename server',
      label: 'Server name',
      value: s.name,
      submitLabel: 'Save',
      submit: async (name) => (await emitAck('server:rename', { serverId: s.id, name })).error,
    });
  }

  function openCreateChannel(s, type) {
    let chosen = type;
    const opt = (t, label) =>
      h(
        'button',
        {
          type: 'button',
          class: chosen === t ? 'sel' : '',
          onclick: (e) => {
            chosen = t;
            [...e.currentTarget.parentNode.children].forEach((b) => b.classList.toggle('sel', b === e.currentTarget));
          },
        },
        icon(t === 'voice' ? 'speaker' : 'hash'),
        label
      );
    formModal({
      title: 'Create Channel',
      label: 'Channel name',
      placeholder: 'new-channel',
      submitLabel: 'Create Channel',
      extra: h('div', null, h('label', null, 'Channel type'), h('div', { class: 'radio-row', style: { marginTop: '8px' } }, opt('text', 'Text'), opt('voice', 'Voice'))),
      submit: async (name) => {
        const r = await emitAck('channel:create', { serverId: s.id, name, type: chosen });
        if (r.error) return r.error;
        navigate(s.id, r.channelId);
      },
    });
  }

  function openInvite(s) {
    const link = `${location.origin}/invite/${s.invite}`;
    modal((close) => [
      h(
        'div',
        { class: 'modal-body' },
        h('h2', null, `Invite friends to ${s.name}`),
        h('p', null, 'Send this link to anyone. They can make an account and join right away.'),
        h(
          'div',
          { class: 'copy-row' },
          h('input', { value: link, readonly: true, 'aria-label': 'Invite link', onfocus: (e) => e.target.select() }),
          h('button', { class: 'btn btn-primary btn-sm', onclick: () => copyText(link) }, 'Copy')
        )
      ),
      h('div', { class: 'modal-foot' }, h('button', { class: 'btn btn-primary', onclick: close }, 'Done')),
    ]);
  }

  function openNewDm() {
    const friends = [...S.me.friends].sort((a, b) => userName(a).localeCompare(userName(b)));
    modal((close) => [
      h(
        'div',
        { class: 'modal-body' },
        h('h2', null, 'Start a conversation'),
        friends.length
          ? h(
              'div',
              null,
              friends.map((uid) =>
                h(
                  'button',
                  { class: 'member', onclick: () => { close(); openDm(uid); } },
                  avatar(uid, '', { dot: true }),
                  h('span', { class: 'name' }, userName(uid))
                )
              )
            )
          : h('p', null, 'You have no friends added yet. Add some from the Friends page!')
      ),
      h('div', { class: 'modal-foot' }, h('button', { class: 'btn btn-ghost', onclick: close }, 'Close')),
    ]);
  }

  async function deleteChannel(s, c) {
    if (await confirmModal({ title: 'Delete Channel', text: `Delete ${c.type === 'text' ? '#' : ''}${c.name}? Its messages will be gone forever.`, confirm: 'Delete Channel', danger: true }))
      showError(await emitAck('channel:delete', { serverId: s.id, channelId: c.id }));
  }

  async function deleteServer(s) {
    if (await confirmModal({ title: `Delete ${s.name}`, text: 'This deletes the server and all of its messages for everyone. This cannot be undone.', confirm: 'Delete Server', danger: true }))
      showError(await emitAck('server:delete', { serverId: s.id }));
  }

  async function leaveServer(s) {
    if (await confirmModal({ title: `Leave ${s.name}`, text: "You won't be able to rejoin unless you're invited again.", confirm: 'Leave Server', danger: true }))
      showError(await emitAck('server:leave', { serverId: s.id }));
  }

  async function kickMember(s, uid) {
    if (await confirmModal({ title: `Kick ${userName(uid)}`, text: `Remove ${userName(uid)} from ${s.name}? They can rejoin with an invite.`, confirm: 'Kick', danger: true }))
      showError(await emitAck('server:kick', { serverId: s.id, userId: uid }));
  }

  function showRing(roomId, from) {
    if (V.roomId === roomId || S.ring) return;
    sfx.ring();
    const timer = setInterval(sfx.ring, 2500);
    const timeout = setTimeout(() => S.ring && S.ring.close(), 30000);
    const close = modal(
      (close) =>
        h(
          'div',
          { class: 'modal-body ring' },
          avatar(from, 'xl'),
          h('h2', null, userName(from)),
          h('p', null, 'Incoming call…'),
          h(
            'div',
            { class: 'ring-actions' },
            h('button', { class: 'stage-btn hang', title: 'Decline', onclick: () => { emitAck('call:decline', { roomId }); close(); } }, icon('phone')),
            h('button', { class: 'stage-btn on', title: 'Accept', onclick: () => { close(); navigate(null, roomId); joinVoice(roomId); } }, icon('phone'))
          )
        ),
      () => {
        clearInterval(timer);
        clearTimeout(timeout);
        S.ring = null;
      }
    );
    S.ring = { roomId, close };
  }

  // ================= voice & video =================
  const V = {
    roomId: null,
    localStream: null,
    camTrack: null,
    screenTrack: null,
    peers: new Map(), // userId -> peer
    muted: storage.get('muted') === true,
    deafened: false,
    iceServers: [],
    audioCtx: null,
    analysers: new Map(),
    speaking: new Set(),
    speakTimer: null,
    videoEls: new Map(),
    joining: false,
  };

  const sendSignal = (to, data) => socket.emit('voice:signal', { to, data });

  async function getMic() {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
    } catch {
      return null;
    }
  }

  async function joinVoice(roomId, { video = false } = {}) {
    if (V.joining) return;
    if (V.roomId === roomId) {
      if (video && !V.camTrack) toggleCamera();
      return;
    }
    if (!window.RTCPeerConnection || !navigator.mediaDevices) {
      return toast('Calls need a modern browser and an https:// link.', true);
    }
    V.joining = true;
    try {
      if (V.roomId) leaveVoice();
      const stream = await getMic();
      if (!stream) toast('No microphone access — you joined muted. Allow the mic in your browser to talk.', true);
      V.roomId = roomId;
      V.localStream = stream;
      V.audioCtx = V.audioCtx || new AudioContext();
      V.audioCtx.resume();
      const r = await emitAck('voice:join', { roomId, muted: V.muted || !stream });
      if (r.error) {
        V.roomId = null;
        if (stream) stream.getTracks().forEach((t) => t.stop());
        V.localStream = null;
        return toast(r.error, true);
      }
      if (stream) watchSpeaking(S.me.id, stream);
      applyLocalAudio();
      for (const uid of r.peers) if (!V.peers.has(uid)) createPeer(uid, true);
      clearInterval(V.speakTimer);
      V.speakTimer = setInterval(speakingTick, 100);
      sendVoiceState();
      sfx.join();
      if (video) await toggleCamera();
    } finally {
      V.joining = false;
      renderVoiceUI();
    }
  }

  // After a reconnect the server has forgotten us; rejoin the same room with the same devices.
  async function rejoinVoice() {
    const roomId = V.roomId;
    for (const uid of [...V.peers.keys()]) closePeer(uid);
    if (!channelInfo(roomId)) return leaveVoice(false);
    const r = await emitAck('voice:join', { roomId, muted: V.muted || !V.localStream });
    if (r.error || V.roomId !== roomId) return leaveVoice(false);
    for (const uid of r.peers) if (!V.peers.has(uid)) createPeer(uid, true);
    sendVoiceState();
    renderVoiceUI();
  }

  function leaveVoice(notify = true) {
    if (!V.roomId) return;
    if (notify && socket) socket.emit('voice:leave');
    for (const uid of [...V.peers.keys()]) closePeer(uid);
    for (const t of [...(V.localStream ? V.localStream.getTracks() : []), V.camTrack, V.screenTrack]) if (t) t.stop();
    V.localStream = V.camTrack = V.screenTrack = null;
    for (const a of V.analysers.values()) a.src.disconnect();
    V.analysers.clear();
    clearInterval(V.speakTimer);
    V.speaking.clear();
    V.videoEls.clear();
    V.roomId = null;
    sfx.leave();
    renderVoiceUI();
  }

  function createPeer(uid, initiator) {
    const pc = new RTCPeerConnection({ iceServers: V.iceServers });
    const peer = {
      uid,
      pc,
      polite: S.me.id > uid,
      makingOffer: false,
      ignoreOffer: false,
      attached: false,
      audioEl: null,
      videoTrack: null,
      videoSender: null,
      queue: Promise.resolve(),
    };
    V.peers.set(uid, peer);
    pc.onicecandidate = (e) => e.candidate && sendSignal(uid, { candidate: e.candidate.toJSON() });
    pc.onnegotiationneeded = async () => {
      try {
        peer.makingOffer = true;
        await pc.setLocalDescription();
        sendSignal(uid, { description: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } });
      } catch (e) {
        console.warn('negotiation failed', e);
      } finally {
        peer.makingOffer = false;
      }
    };
    pc.ontrack = ({ track }) => {
      if (track.kind === 'audio') {
        const stream = new MediaStream([track]);
        if (!peer.audioEl) {
          peer.audioEl = h('audio', { autoplay: true });
          $('#audio-sink').append(peer.audioEl);
        }
        peer.audioEl.srcObject = stream;
        peer.audioEl.muted = V.deafened;
        peer.audioEl.play().catch(() => {});
        watchSpeaking(uid, stream);
      } else {
        peer.videoTrack = track;
        track.addEventListener('unmute', renderStage);
        renderStage();
      }
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') pc.restartIce();
    };
    if (initiator) attachLocal(peer);
    return peer;
  }

  function attachLocal(peer) {
    peer.attached = true;
    const audio = V.localStream && V.localStream.getAudioTracks()[0];
    if (audio) peer.pc.addTrack(audio, V.localStream);
    else peer.pc.addTransceiver('audio', { direction: 'recvonly' });
    const vt = V.screenTrack || V.camTrack;
    if (vt) peer.videoSender = peer.pc.addTrack(vt, new MediaStream([vt]));
  }

  // "Perfect negotiation": both sides may offer; the polite side yields on collisions.
  function onSignal({ from, data }) {
    if (!V.roomId || !data) return;
    const peer = V.peers.get(from) || createPeer(from, false);
    peer.queue = peer.queue.then(async () => {
      const { pc } = peer;
      try {
        if (data.description) {
          const isOffer = data.description.type === 'offer';
          const collision = isOffer && (peer.makingOffer || pc.signalingState !== 'stable');
          peer.ignoreOffer = !peer.polite && collision;
          if (peer.ignoreOffer) return;
          await pc.setRemoteDescription(data.description);
          if (isOffer) {
            if (!peer.attached) attachLocal(peer);
            await pc.setLocalDescription();
            sendSignal(from, { description: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } });
          }
        } else if (data.candidate) {
          try {
            await pc.addIceCandidate(data.candidate);
          } catch (e) {
            if (!peer.ignoreOffer) console.warn('ICE candidate error', e);
          }
        }
      } catch (e) {
        console.warn('signal error', e);
      }
    });
  }

  function closePeer(uid) {
    const peer = V.peers.get(uid);
    if (!peer) return;
    peer.pc.close();
    if (peer.audioEl) peer.audioEl.remove();
    const a = V.analysers.get(uid);
    if (a) a.src.disconnect();
    V.analysers.delete(uid);
    V.videoEls.delete(uid);
    V.peers.delete(uid);
  }

  function applyLocalAudio() {
    const track = V.localStream && V.localStream.getAudioTracks()[0];
    if (track) track.enabled = !(V.muted || V.deafened);
    for (const p of V.peers.values()) if (p.audioEl) p.audioEl.muted = V.deafened;
  }

  function sendVoiceState() {
    if (!V.roomId) return;
    socket.emit('voice:state', {
      muted: V.muted || !V.localStream,
      deafened: V.deafened,
      video: !!V.camTrack,
      screen: !!V.screenTrack,
    });
  }

  async function toggleMute() {
    if (V.roomId && !V.localStream) {
      const stream = await getMic();
      if (!stream) return toast('Microphone blocked. Allow it in your browser settings, then try again.', true);
      V.localStream = stream;
      V.muted = false;
      const track = stream.getAudioTracks()[0];
      watchSpeaking(S.me.id, stream);
      for (const p of V.peers.values()) {
        const tr = p.pc.getTransceivers().find((t) => t.receiver.track && t.receiver.track.kind === 'audio');
        if (tr) {
          tr.direction = 'sendrecv';
          tr.sender.replaceTrack(track);
          tr.sender.setStreams && tr.sender.setStreams(stream);
        } else {
          p.pc.addTrack(track, stream);
        }
      }
    } else {
      V.muted = !V.muted;
      if (!V.muted && V.deafened) V.deafened = false;
    }
    storage.set('muted', V.muted);
    applyLocalAudio();
    sendVoiceState();
    tones([V.muted ? 440 : 660], 0.06, 0.06);
    renderVoiceUI();
  }

  function toggleDeafen() {
    V.deafened = !V.deafened;
    applyLocalAudio();
    sendVoiceState();
    renderVoiceUI();
  }

  function updateVideoSenders() {
    const vt = V.screenTrack || V.camTrack || null;
    for (const p of V.peers.values()) {
      if (!p.attached) continue;
      if (p.videoSender) p.videoSender.replaceTrack(vt);
      else if (vt) p.videoSender = p.pc.addTrack(vt, new MediaStream([vt]));
    }
    V.videoEls.delete(S.me.id);
  }

  async function toggleCamera() {
    if (!V.roomId) return;
    if (V.camTrack) {
      V.camTrack.stop();
      V.camTrack = null;
    } else {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } } });
        if (!V.roomId) return s.getTracks().forEach((t) => t.stop());
        if (V.screenTrack) {
          V.screenTrack.stop();
          V.screenTrack = null;
        }
        V.camTrack = s.getVideoTracks()[0];
      } catch {
        return toast('Camera unavailable. Allow camera access in your browser.', true);
      }
    }
    updateVideoSenders();
    sendVoiceState();
    renderVoiceUI();
  }

  async function toggleScreen() {
    if (!V.roomId) return;
    if (V.screenTrack) {
      V.screenTrack.stop();
      V.screenTrack = null;
    } else {
      if (!navigator.mediaDevices.getDisplayMedia) return toast("Screen sharing isn't supported on this device.", true);
      try {
        const s = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 30 } }, audio: false });
        if (!V.roomId) return s.getTracks().forEach((t) => t.stop());
        if (V.camTrack) {
          V.camTrack.stop();
          V.camTrack = null;
        }
        V.screenTrack = s.getVideoTracks()[0];
        V.screenTrack.addEventListener('ended', () => {
          if (V.screenTrack === s.getVideoTracks()[0]) toggleScreen();
        });
      } catch {
        return;
      }
    }
    updateVideoSenders();
    sendVoiceState();
    renderVoiceUI();
  }

  function watchSpeaking(uid, stream) {
    try {
      const old = V.analysers.get(uid);
      if (old) old.src.disconnect();
      const src = V.audioCtx.createMediaStreamSource(stream);
      const an = V.audioCtx.createAnalyser();
      an.fftSize = 512;
      src.connect(an);
      V.analysers.set(uid, { src, an, buf: new Uint8Array(an.fftSize), last: 0 });
    } catch {}
  }

  function speakingTick() {
    const now = Date.now();
    const next = new Set();
    for (const [uid, a] of V.analysers) {
      a.an.getByteTimeDomainData(a.buf);
      let sum = 0;
      for (const v of a.buf) sum += ((v - 128) / 128) ** 2;
      if (Math.sqrt(sum / a.buf.length) > 0.02) a.last = now;
      const self = uid === S.me.id;
      if (now - a.last < 300 && !(self && (V.muted || V.deafened))) next.add(uid);
    }
    for (const uid of new Set([...next, ...V.speaking])) {
      if (next.has(uid) === V.speaking.has(uid)) continue;
      document.querySelectorAll(`[data-speak="${uid}"]`).forEach((el) => el.classList.toggle('speaking', next.has(uid)));
    }
    V.speaking = next;
  }

  function renderVoiceUI() {
    renderSidebar();
    renderVoicePanel();
    renderUserPanel();
    renderHeader();
    renderStage();
  }

  function videoFor(uid, track, mirror) {
    let el = V.videoEls.get(uid);
    if (!el || el._track !== track) {
      el = h('video', { autoplay: true, playsinline: true });
      el.muted = true;
      el.srcObject = new MediaStream([track]);
      el._track = track;
      V.videoEls.set(uid, el);
    }
    el.classList.toggle('mirror', !!mirror);
    return el;
  }

  function renderStage() {
    const el = S.dom.stage;
    if (!el) return;
    const roomId = S.view.channelId;
    const info = channelInfo(roomId);
    if (!info) return;
    const isDm = info.type === 'dm';
    const members = S.voice[roomId] || [];
    const inRoom = V.roomId === roomId;

    if (isDm && !members.length && !inRoom) {
      el.className = 'stage hidden';
      fill(el);
      return;
    }
    el.className = 'stage ' + (isDm ? 'split' : 'full');

    if (!inRoom) {
      fill(el, 
        h(
          'div',
          { class: 'stage-empty' },
          h(
            'div',
            null,
            h('h2', null, isDm ? `Call with ${userName(otherMember(info.dm))}` : info.channel.name),
            h('p', null, members.length ? 'In the call now:' : 'No one is here yet. Jump in and others will see you.'),
            h('div', { class: 'who', style: { margin: '12px 0' } }, members.map((m) => avatar(m.userId, 'lg', { speak: true }))),
            h(
              'div',
              { class: 'stage-bar' },
              h('button', { class: 'btn btn-green', onclick: () => joinVoice(roomId) }, icon('phone', 'sm'), isDm ? 'Join Call' : 'Join Voice'),
              h('button', { class: 'btn', onclick: () => joinVoice(roomId, { video: true }) }, icon('video', 'sm'), 'Join with Video')
            )
          )
        )
      );
      return;
    }

    const tiles = members.map((m) => {
      const me = m.userId === S.me.id;
      let video = null;
      if (m.video || m.screen) {
        const track = me ? V.screenTrack || V.camTrack : V.peers.get(m.userId) && V.peers.get(m.userId).videoTrack;
        if (track) video = videoFor(m.userId, track, me && !!V.camTrack);
      }
      const tile = h(
        'div',
        {
          class: 'tile' + (V.speaking.has(m.userId) ? ' speaking' : ''),
          'data-speak': m.userId,
          title: 'Double-click for fullscreen',
          ondblclick: (e) => e.currentTarget.requestFullscreen && e.currentTarget.requestFullscreen().catch(() => {}),
        },
        video || avatar(m.userId, 'xl'),
        h(
          'div',
          { class: 'label' },
          m.deafened ? icon('headphonesOff', 'xs') : m.muted ? icon('micOff', 'xs') : null,
          h('span', null, userName(m.userId) + (m.screen ? ' (screen)' : ''))
        )
      );
      return tile;
    });

    const btn = (name, title, onclick, cls = '') =>
      h('button', { class: 'stage-btn ' + cls, title, 'aria-label': title, onclick }, icon(name));
    fill(el, 
      h('div', { class: 'tiles' }, tiles),
      h(
        'div',
        { class: 'stage-bar' },
        btn(V.muted || !V.localStream ? 'micOff' : 'mic', V.muted ? 'Unmute' : 'Mute', toggleMute, V.muted || !V.localStream ? 'off' : ''),
        btn(V.deafened ? 'headphonesOff' : 'headphones', V.deafened ? 'Undeafen' : 'Deafen', toggleDeafen, V.deafened ? 'off' : ''),
        btn(V.camTrack ? 'video' : 'videoOff', V.camTrack ? 'Turn off camera' : 'Turn on camera', toggleCamera, V.camTrack ? 'on' : ''),
        btn('screen', V.screenTrack ? 'Stop sharing' : 'Share screen', toggleScreen, V.screenTrack ? 'on' : ''),
        btn('phone', 'Leave call', () => leaveVoice(), 'hang')
      )
    );
    for (const v of el.querySelectorAll('video')) v.play().catch(() => {});
  }

  // ================= boot =================
  $('#scrim').addEventListener('click', () => $('#app').classList.remove('drawer-open'));
  window.addEventListener('beforeunload', () => {
    if (V.roomId && socket) socket.emit('voice:leave');
  });

  fetch('/api/me')
    .then((r) => (r.ok ? startApp() : showAuth()))
    .catch(() => showAuth());
})();
