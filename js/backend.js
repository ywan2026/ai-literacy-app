// ===============================================================
//  백엔드 어댑터: Supabase(실제 수업) / Demo(설정이 비었을 때, 같은 브라우저 탭끼리만 동기화)
//  두 구현 모두 같은 함수 이름을 제공합니다.
// ===============================================================
(function () {
  const H = () => ({ room: [], msg: [], resp: [], part: [], presence: [] });

  // ---------------- Supabase ----------------
  function createSupabaseBackend(room, C) {
    const sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, {
      realtime: { params: { eventsPerSecond: 20 } },
    });
    const h = H();
    let ch = null;
    let rtStatus = 'INIT';
    const fire = (k, ...a) => h[k].forEach((f) => { try { f(...a); } catch (e) { console.error(e); } });
    const chk = ({ data, error }) => { if (error) throw error; return data; };

    return {
      mode: 'supabase',
      on(k, f) { h[k].push(f); },
      async connect(meta) {
        ch = sb.channel('room:' + room, { config: { presence: { key: meta.id } } });
        ch.on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${room}` }, (p) => fire('room', p.new))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `room_id=eq.${room}` }, (p) => fire('msg', p.eventType, p.new, p.old))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'responses', filter: `room_id=eq.${room}` }, (p) => fire('resp', p.eventType, p.new))
          .on('postgres_changes', { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${room}` }, (p) => fire('part', p.eventType, p.new))
          .on('presence', { event: 'sync' }, () => {
            const st = ch.presenceState();
            fire('presence', Object.values(st).map((arr) => arr[0]).filter(Boolean));
          });
        return await new Promise((res) => {
          let done = false;
          const fin = (v) => { if (!done) { done = true; res(v); } };
          ch.subscribe(async (s, err) => {
            rtStatus = s;
            if (s === 'SUBSCRIBED') { try { await ch.track(meta); } catch (e) {} fin(true); }
            else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') { console.warn('realtime', s, err); fin(false); }
          });
          setTimeout(() => fin(false), 8000);
        });
      },
      realtimeOk() { return rtStatus === 'SUBSCRIBED'; },
      async retrack(meta) { try { await ch.track(meta); } catch (e) {} },
      async getRoom() {
        const d = chk(await sb.from('rooms').select('*').eq('id', room).maybeSingle());
        if (!d) throw new Error('수업 방(' + room + ')이 없습니다. schema.sql을 실행했는지 확인하세요.');
        return d;
      },
      async isTeacher(code) { return !!chk(await sb.rpc('is_teacher', { p_room: room, p_code: code })); },
      async setRoom(code, patch) {
        chk(await sb.rpc('teacher_set_room', { p_room: room, p_code: code, p_slide: patch.current_slide ?? null, p_locked: patch.chat_locked ?? null }));
      },
      async listMessages() { return chk(await sb.from('messages').select('*').eq('room_id', room).order('id').limit(5000)); },
      async sendMessage(m) {
        chk(await sb.from('messages').insert({ room_id: room, slide_key: m.slide_key, participant_id: m.participant_id, name: m.name, body: m.body }));
      },
      async teacherSend(code, slide_key, body) { chk(await sb.rpc('teacher_send', { p_room: room, p_code: code, p_slide: slide_key, p_body: body })); },
      async setHidden(code, id, hidden) { chk(await sb.rpc('teacher_hide', { p_room: room, p_code: code, p_id: id, p_hidden: hidden })); },
      async listResponses() { return chk(await sb.from('responses').select('*').eq('room_id', room).limit(10000)); },
      async upsertResponse(r) {
        chk(await sb.from('responses').upsert({ room_id: room, ...r, updated_at: new Date().toISOString() }, { onConflict: 'room_id,slide_key,item,participant_id' }));
      },
      async upsertParticipant(p) {
        chk(await sb.from('participants').upsert({ room_id: room, id: p.id, name: p.name, last_seen: new Date().toISOString() }, { onConflict: 'id' }));
      },
      async listParticipants() { return chk(await sb.from('participants').select('*').eq('room_id', room).order('joined_at')); },
      async resetAll(code) { chk(await sb.rpc('teacher_reset', { p_room: room, p_code: code })); },
    };
  }

  // ---------------- Demo (localStorage + BroadcastChannel) ----------------
  function createDemoBackend(room, C) {
    const KEY = 'ai-lit-demo:' + room;
    const h = H();
    let mem = null;
    const blank = () => ({ room: { id: room, current_slide: 0, chat_locked: false, reset_at: null }, messages: [], responses: [], participants: [], seq: 1 });
    const load = () => {
      try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch (e) {}
      return mem || (mem = blank());
    };
    const save = (db) => { mem = db; try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
    let bc = null;
    try { bc = new BroadcastChannel(KEY); } catch (e) {}
    const fire = (k, ...a) => h[k].forEach((f) => { try { f(...a); } catch (e) { console.error(e); } });
    const emit = (evt) => { dispatch(evt); if (bc) bc.postMessage(evt); };
    const peers = new Map();
    let me = null;
    function dispatch(e) {
      if (e.k === 'presence') {
        if (e.leave) peers.delete(e.meta.id); else peers.set(e.meta.id, { ...e.meta, t: Date.now() });
        firePresence();
      } else fire(e.k, ...e.a);
    }
    function firePresence() {
      const now = Date.now();
      for (const [id, p] of peers) if (now - p.t > 9000) peers.delete(id);
      fire('presence', [...peers.values()]);
    }
    if (bc) bc.onmessage = (ev) => {
      dispatch(ev.data);
      if (ev.data.k === 'presence' && ev.data.hello && me) bc.postMessage({ k: 'presence', meta: me });
    };
    setInterval(() => { if (me) emit({ k: 'presence', meta: me }); else firePresence(); }, 3000);
    window.addEventListener('pagehide', () => { if (me && bc) bc.postMessage({ k: 'presence', meta: me, leave: true }); });
    const delay = () => new Promise((r) => setTimeout(r, 30));

    return {
      mode: 'demo',
      on(k, f) { h[k].push(f); },
      async connect(meta) { me = meta; emit({ k: 'presence', meta, hello: true }); return true; },
      realtimeOk() { return true; },
      async retrack(meta) { me = meta; emit({ k: 'presence', meta }); },
      async getRoom() { return load().room; },
      async isTeacher(code) { await delay(); return code === C.DEMO_TEACHER_CODE; },
      async setRoom(code, patch) {
        if (code !== C.DEMO_TEACHER_CODE) throw new Error('not teacher');
        const db = load(); Object.assign(db.room, patch); save(db); emit({ k: 'room', a: [db.room] });
      },
      async listMessages() { return load().messages; },
      async sendMessage(m) {
        const db = load();
        if (db.room.chat_locked) throw new Error('chat locked');
        const row = { id: db.seq++, room_id: room, ...m, is_teacher: false, hidden: false, created_at: new Date().toISOString() };
        db.messages.push(row); save(db); emit({ k: 'msg', a: ['INSERT', row] });
      },
      async teacherSend(code, slide_key, body) {
        const db = load();
        const row = { id: db.seq++, room_id: room, slide_key, participant_id: null, name: '선생님', body, is_teacher: true, hidden: false, created_at: new Date().toISOString() };
        db.messages.push(row); save(db); emit({ k: 'msg', a: ['INSERT', row] });
      },
      async setHidden(code, id, hidden) {
        const db = load(); const m = db.messages.find((x) => x.id === id); if (!m) return;
        m.hidden = hidden; save(db); emit({ k: 'msg', a: ['UPDATE', m] });
      },
      async listResponses() { return load().responses; },
      async upsertResponse(r) {
        const db = load();
        let row = db.responses.find((x) => x.slide_key === r.slide_key && x.item === r.item && x.participant_id === r.participant_id);
        if (row) Object.assign(row, r, { updated_at: new Date().toISOString() });
        else { row = { id: db.seq++, room_id: room, ...r, updated_at: new Date().toISOString() }; db.responses.push(row); }
        save(db); emit({ k: 'resp', a: ['UPSERT', row] });
      },
      async upsertParticipant(p) {
        const db = load();
        let row = db.participants.find((x) => x.id === p.id);
        if (row) { row.name = p.name; row.last_seen = new Date().toISOString(); }
        else { row = { room_id: room, id: p.id, name: p.name, joined_at: new Date().toISOString(), last_seen: new Date().toISOString() }; db.participants.push(row); }
        save(db); emit({ k: 'part', a: ['UPSERT', row] });
      },
      async listParticipants() { return load().participants; },
      async resetAll(code) {
        const db = blank(); db.room.reset_at = new Date().toISOString(); save(db); emit({ k: 'room', a: [db.room] });
      },
    };
  }

  window.createBackend = function (room, C) {
    if (C.SUPABASE_URL && C.SUPABASE_ANON_KEY && window.supabase) return createSupabaseBackend(room, C);
    return createDemoBackend(room, C);
  };
})();
