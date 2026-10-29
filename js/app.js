(function () {
  'use strict';
  const C = window.APP_CONFIG, SLIDES = window.SLIDES, SECTIONS = window.SECTIONS;
  const qs = new URLSearchParams(location.search);
  const ROOM = (qs.get('room') || C.ROOM_ID).trim();
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }));

  const configured = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY);
  const demo = qs.get('demo') === '1';   // 데모 모드는 주소 뒤에 ?demo=1 을 붙였을 때만
  const stop = (msg) => { document.body.innerHTML = '<div style="max-width:520px;margin:15vh auto;padding:28px;font:16px/1.6 -apple-system,system-ui,sans-serif;background:#fff;border-radius:18px;box-shadow:0 8px 24px rgba(0,0,0,.08)">' + msg + '</div>'; document.body.style.background = '#f2f2f7'; };
  if (!demo && !configured) { stop('<b>서버 설정이 비어 있어요.</b><br>js/config.js 에 SUPABASE_URL 과 키를 넣어 GitHub에 다시 올려 주세요.'); return; }
  if (!demo && !window.supabase) { stop('<b>Supabase 라이브러리를 불러오지 못했어요.</b><br>인터넷 연결을 확인하고 새로고침해 주세요.'); return; }
  const api = demo ? window.createBackend(ROOM, { ...C, SUPABASE_URL: '', SUPABASE_ANON_KEY: '' }) : window.createBackend(ROOM, C);

  const S = {
    me: null, teacher: false, code: null,
    room: { current_slide: 0, chat_locked: false, reset_at: null },
    messages: [], responses: new Map(), participants: new Map(), presence: [],
    rendered: -1, lastSend: 0,
  };
  const rkey = (r) => r.slide_key + '|' + r.item + '|' + r.participant_id;
  const cur = () => SLIDES[Math.min(Math.max(S.room.current_slide | 0, 0), SLIDES.length - 1)];

  // ---------------- UI helpers ----------------
  let toastT;
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2600); }
  function confirmBox(title, text) {
    return new Promise((res) => {
      $('modalTitle').textContent = title; $('modalText').textContent = text; $('modal').hidden = false;
      const done = (v) => { $('modal').hidden = true; $('modalOk').onclick = $('modalCancel').onclick = null; res(v); };
      $('modalOk').onclick = () => done(true); $('modalCancel').onclick = () => done(false);
    });
  }
  const fail = (e) => { console.error(e); toast('문제가 생겼어요: ' + (e && e.message ? e.message : e)); };

  // ---------------- 로그인 ----------------
  $('modeBadge').textContent = api.mode === 'demo' ? '데모 모드 · 이 브라우저 안에서만 동기화됩니다' : '';
  const teacherLogin = qs.has('teacher');   // 교사 전용 주소: ...?teacher
  const saved = store.get('ai-lit:' + ROOM + ':me');
  if (teacherLogin) {
    $('nameInput').placeholder = '교사 코드를 입력하세요'; $('nameInput').type = 'password';
    $('loginBtn').textContent = '교사로 들어가기';
    document.querySelector('.login-hint').textContent = '교사 전용 입장 화면입니다.';
  } else if (saved && saved.name) $('nameInput').value = saved.name;

  $('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = $('nameInput').value.trim();
    if (!name) return;
    $('loginBtn').disabled = true; $('loginBtn').textContent = '접속 중…';
    try {
      await api.getRoom();   // 수업 방이 있는지 먼저 확인
      const isT = await api.isTeacher(name);
      if (teacherLogin && !isT) {
        toast('교사 코드가 맞지 않아요. Supabase에 저장한 코드를 확인해 주세요.');
        $('loginBtn').disabled = false; $('loginBtn').textContent = '교사로 들어가기';
        return;
      }
      if (isT) {
        S.teacher = true; S.code = name;
        S.me = { id: (store.get('ai-lit:' + ROOM + ':tid')) || uuid(), name: '선생님' };
        store.set('ai-lit:' + ROOM + ':tid', S.me.id);
      } else {
        const prev = store.get('ai-lit:' + ROOM + ':me');
        S.me = { id: prev && prev.name === name ? prev.id : uuid(), name };
        store.set('ai-lit:' + ROOM + ':me', S.me);
        await api.upsertParticipant(S.me);
      }
      await start();
    } catch (err) {
      fail(err);
      $('loginBtn').disabled = false; $('loginBtn').textContent = '참여하기';
    }
  });

  async function start() {
    document.body.classList.toggle('is-teacher', S.teacher);
    document.body.classList.toggle('is-student', !S.teacher);
    $('login').hidden = true; $('app').hidden = false;
    $('addrHost').textContent = C.DISPLAY_HOST || location.host;
    $('mePill').textContent = S.teacher ? '선생님 모드' : S.me.name;

    api.on('room', (r) => {
      const resetChanged = r.reset_at && r.reset_at !== S.room.reset_at;
      S.room = { ...S.room, ...guardRoom(r) };
      if (resetChanged) { reload(); if (!S.teacher) toast('선생님이 수업 데이터를 초기화했어요'); }
      render();
    });
    api.on('msg', (type, row) => {
      if (!row || row.room_id && row.room_id !== ROOM) return;
      const i = S.messages.findIndex((m) => m.id === row.id);
      if (i >= 0) S.messages[i] = row; else S.messages.push(row);
      renderChat();
    });
    api.on('resp', (type, row) => { if (row) { S.responses.set(rkey(row), row); renderLive(); } });
    api.on('part', (type, row) => { if (row) { S.participants.set(row.id, row); renderRoster(); } });
    api.on('presence', (list) => { S.presence = list; renderRoster(); });

    await reload();
    S.rendered = -1;
    const meta = () => ({ id: S.me.id, name: S.me.name, role: S.teacher ? 'teacher' : 'student' });
    const rtOk = await api.connect(meta());
    setConn(true, rtOk);
    render();
    if (!rtOk && S.teacher) toast('실시간 연결이 안 돼서 3초마다 새로고침 방식으로 동작해요');

    // 실시간이 끊겨도 동작하도록 주기적으로 동기화 (실시간 정상: 10초, 실패: 3초)
    const tick = async () => {
      if (document.visibilityState === 'visible') { await reload(true); render(); }
      setTimeout(tick, api.realtimeOk && api.realtimeOk() ? 10000 : 3000);
    };
    setTimeout(tick, 3000);
    // 학생 접속 기록(명단용) 30초마다 갱신
    if (!S.teacher) setInterval(() => { if (document.visibilityState === 'visible') api.upsertParticipant(S.me).catch(() => {}); }, 30000);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') { reload(true).then(render); api.retrack(meta()); if (!S.teacher) api.upsertParticipant(S.me).catch(() => {}); }
    });
    window.addEventListener('online', () => { setConn(true, true); reload(true).then(render); });
    window.addEventListener('offline', () => setConn(false));
  }

  function setConn(ok, rt) {
    const c = $('conn'); c.classList.toggle('off', !ok); c.classList.toggle('slow', ok && rt === false);
    c.title = !ok ? '연결 끊김' : (api.mode === 'demo' ? '데모 모드' : rt === false ? '연결됨 (새로고침 방식)' : '실시간 연결됨');
  }

  async function reload(quiet) {
    try {
      const [room, msgs, resps, parts] = await Promise.all([api.getRoom(), api.listMessages(), api.listResponses(), S.teacher ? api.listParticipants() : Promise.resolve([])]);
      const resetChanged = S.room.reset_at !== undefined && room.reset_at && room.reset_at !== S.room.reset_at;
      S.room = guardRoom(room); S.messages = msgs || [];
      S.responses = new Map((resps || []).map((r) => [rkey(r), r]));
      S.participants = new Map((parts || []).map((p) => [p.id, p]));
      if (!quiet || resetChanged) S.rendered = -1;
      setConn(true, api.realtimeOk ? api.realtimeOk() : true);
    } catch (e) { if (quiet) setConn(false); else fail(e); }
  }

  // ---------------- 렌더링 ----------------
  function render() {
    const idx = Math.min(Math.max(S.room.current_slide | 0, 0), SLIDES.length - 1);
    const s = SLIDES[idx];
    if (S.rendered !== idx) { S.rendered = idx; renderSlide(s, idx); }
    renderTabs(s);
    $('addrPath').textContent = ' / ' + (idx + 1) + '. ' + s.title;
    $('tbCount').textContent = (idx + 1) + ' / ' + SLIDES.length;
    $('prevBtn').disabled = $('tbPrev').disabled = idx === 0;
    $('nextBtn').disabled = $('tbNext').disabled = idx === SLIDES.length - 1;
    $('tbLock').textContent = S.room.chat_locked ? '채팅 잠금 해제' : '채팅 잠금';
    $('tbLock').classList.toggle('on', !!S.room.chat_locked);
    renderChat(); renderLive(); renderRoster();
  }

  function renderTabs(s) {
    $('tabs').innerHTML = SECTIONS.map((name, i) => {
      const first = SLIDES.findIndex((x) => x.section === i);
      return `<button class="tab ${i === s.section ? 'active' : ''}" data-go="${first}" ${S.teacher ? '' : 'tabindex="-1"'}>${i ? '<span class="tab-n">' + i + '</span>' : ''}${esc(name)}</button>`;
    }).join('');
    const a = $('tabs').querySelector('.active'); if (a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function renderSlide(s, idx) {
    const el = $('slide');
    el.className = 'slide' + (s.layout ? ' layout-' + s.layout : '');
    let h = '';
    if (s.layout === 'divider') {
      const list = SLIDES.filter((x) => x.section === s.section && x.layout !== 'divider');
      el.innerHTML = `<div class="div-wrap"><div class="div-num">${String(s.divider.n).padStart(2, '0')}</div><div class="div-text"><div class="div-chap">CHAPTER ${s.divider.n} · 약 ${esc(s.divider.mins)}</div><h2 class="slide-title">${esc(s.title)}</h2><p class="lead">${esc(s.divider.sub)}</p>
        <ol class="div-list">${list.map((x) => `<li>${esc(x.title)}</li>`).join('')}</ol></div></div><span class="pg div-pg">${idx + 1} / ${SLIDES.length}</span>`;
      el.scrollTop = 0; $('chatSub').textContent = s.title; updateImgBtn(s);
      return;
    }
    h += `<div class="slide-meta">${s.section ? '<span class="sec">' + s.section + '. ' + esc(SECTIONS[s.section]) + '</span>' : ''}<span class="pg">${idx + 1} / ${SLIDES.length}</span></div>`;
    if (s.kicker) h += `<div class="kicker">${esc(s.kicker)}</div>`;
    h += `<h2 class="slide-title">${esc(s.title)}</h2>`;
    if (s.video) h += videoHTML(s.video);
    if (s.link && s.submit) h += linkHTML(s.link);
    if (s.html) h += `<div class="slide-body">${s.html}</div>`;
    if (s.link && !s.submit) h += linkHTML(s.link);
    if (s.poll) h += `<div class="poll" data-slide="${s.key}">${s.poll.label ? '<div class="poll-label">' + esc(s.poll.label) + '</div>' : ''}${s.poll.options.map((o, i) =>
      `<button class="opt" data-opt="${i}"><span class="opt-bar"></span><span class="opt-check"></span><span class="opt-text">${esc(o)}</span><span class="opt-n"></span></button>`).join('')}
      <div class="poll-foot"><span class="poll-total"></span>${s.poll.multi ? '<span>여러 개 선택 가능</span>' : '<span>다시 누르면 바꿀 수 있어요</span>'}</div></div>`;
    if (s.flips) h += `<div class="flips">${s.flips.map((f, i) =>
      `<button class="flip" data-flip="${i}"><div class="flip-inner"><div class="flip-front"><span class="flip-tag">${esc(f.tag)}</span><p>${esc(f.q)}</p><span class="flip-tap">눌러서 해설 보기</span></div><div class="flip-back"><span class="flip-tag">해설</span><p>${f.a}</p></div></div></button>`).join('')}</div>`;
    if (s.cards) h += `<div class="judge">${s.cards.items.map((c, i) =>
      `<div class="jcard" data-card="${i}"><div class="jhead"><b>${esc(c.title)}</b><span class="jn"></span>${c.answer && S.teacher ? `<button class="reveal-btn" data-reveal="${i}">정답 확인</button>` : ''}</div><p>${esc(c.text)}</p>
        <div class="jbtns">${s.cards.choices.map((ch) => `<button class="jb" data-choice="${esc(ch)}"><span class="jl">${esc(ch)}</span><span class="jc"></span></button>`).join('')}</div>
        <div class="jbar">${s.cards.choices.map((ch) => `<i data-bar="${esc(ch)}"></i>`).join('')}</div>
        <div class="janswer" hidden></div>${S.teacher ? '<div class="jnames"></div>' : ''}</div>`).join('')}</div>`;
    if (s.checks) h += `<div class="checks">${s.checks.map((c, i) => `<button class="check" data-check="${i}"><span class="cbox"></span><span><b>${i + 1}. ${esc(c.t)}</b><span>${esc(c.d)}</span></span></button>`).join('')}</div>`;
    el.innerHTML = h;
    el.scrollTop = 0;
    el.querySelectorAll('.check').forEach((b) => b.addEventListener('click', () => b.classList.toggle('on')));

    if (s.submit) {
      const host = el.querySelector('.submit-host') || el.appendChild(Object.assign(document.createElement('div'), { className: 'submit-host' }));
      host.innerHTML = `<form class="submit">${s.submit.fields.map((f) => f.options
        ? `<label><span>${esc(f.label)}</span><select data-field="${f.id}"><option value="">선택하세요</option>${f.options.map((o) => `<option>${esc(o)}</option>`).join('')}</select></label>`
        : `<label><span>${esc(f.label)}</span><textarea data-field="${f.id}" rows="${f.rows || 2}" maxlength="400" placeholder="${esc(f.placeholder || '')}"></textarea></label>`).join('')}
        <button class="btn primary" type="submit">${esc(s.submit.button || '제출')}</button><span class="submit-state"></span></form>`;
      const mine = myResp(s.key, 'submit');
      if (mine && mine.value) host.querySelectorAll('[data-field]').forEach((t) => (t.value = mine.value[t.dataset.field] || ''));
      if (s.tally) el.insertAdjacentHTML('beforeend', '<div class="tally"></div>');
      host.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); submitForm(s, host); });
    }
    // 이벤트
    el.querySelectorAll('.opt').forEach((b) => b.addEventListener('click', () => vote(s, +b.dataset.opt)));
    el.querySelectorAll('.flip').forEach((b) => b.addEventListener('click', () => b.classList.toggle('flipped')));
    el.querySelectorAll('.jb').forEach((b) => b.addEventListener('click', () => judge(s, +b.closest('.jcard').dataset.card, b.dataset.choice)));
    el.querySelectorAll('.reveal-btn').forEach((b) => b.addEventListener('click', () => toggleReveal(s, +b.dataset.reveal)));

    $('chatSub').textContent = s.title;
    $('chatText').placeholder = s.chatPrompt || '의견을 입력하세요';
    updateImgBtn(s);
  }
  function updateImgBtn(s) { $('imgBtn').hidden = !(s.allowImage && !S.teacher); }

  function linkHTML(l) { return `<div class="linkbox"><a class="btn primary" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a><span>${esc(l.hint || '')}</span></div>`; }
  function videoHTML(v) {
    const thumb = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
    if (!S.teacher && !C.STUDENT_VIDEO) {
      return `<div class="video student-wait" style="background-image:url('${thumb}')"><div><b>앞 화면을 함께 봐요</b><span>영상은 선생님 화면에서 재생돼요</span></div></div><p class="caption">${esc(v.caption || '')}</p>`;
    }
    const p = new URLSearchParams({ rel: '0', playsinline: '1', modestbranding: '1' });
    if (v.start) p.set('start', v.start); if (v.end) p.set('end', v.end);
    return `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?${p}" title="${esc(v.caption || 'video')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe></div><p class="caption">${esc(v.caption || '')}</p>`;
  }

  // 응답 집계
  function myResp(slide, item) { return S.responses.get(slide + '|' + item + '|' + S.me.id); }
  function respsFor(slide, item) { const out = []; for (const r of S.responses.values()) if (r.slide_key === slide && r.item === item) out.push(r); return out; }

  function renderLive() {
    const s = cur(); const el = $('slide');
    if (s.poll) {
      const rs = respsFor(s.key, 'poll');
      const counts = s.poll.options.map(() => 0);
      rs.forEach((r) => { const v = Array.isArray(r.value) ? r.value : [r.value]; v.forEach((i) => { if (counts[i] != null) counts[i]++; }); });
      const total = rs.filter((r) => Array.isArray(r.value) ? r.value.length : r.value != null).length;
      const mine = myResp(s.key, 'poll'); const mv = mine ? (Array.isArray(mine.value) ? mine.value : [mine.value]) : [];
      const max = Math.max(1, ...counts);
      el.querySelectorAll('.opt').forEach((b) => {
        const i = +b.dataset.opt; const pct = total ? Math.round((counts[i] / total) * 100) : 0;
        b.querySelector('.opt-bar').style.width = (total ? (counts[i] / max) * 100 : 0) + '%';
        b.querySelector('.opt-n').textContent = total ? `${counts[i]}명 · ${pct}%` : '';
        b.classList.toggle('mine', mv.includes(i));
      });
      const t = el.querySelector('.poll-total'); if (t) t.textContent = `${total}명 응답`;
    }
    if (s.tally) {
      const box = el.querySelector('.tally');
      if (box) {
        const [rowF, ...cols] = s.tally.map((id) => s.submit.fields.find((f) => f.id === id));
        const subs = respsFor(s.key, 'submit').map((r) => r.value || {}).filter((v) => v[rowF.id]);
        const groups = new Map(); subs.forEach((v) => { if (!groups.has(v[rowF.id])) groups.set(v[rowF.id], []); groups.get(v[rowF.id]).push(v); });
        const cell = (arr, f) => { const n = {}; arr.forEach((v) => { if (v[f.id]) n[v[f.id]] = (n[v[f.id]] || 0) + 1; }); return Object.entries(n).sort((a, b) => b[1] - a[1]).map(([k, c]) => `<span class="tchip">${esc(k)} <b>${c}</b></span>`).join('') || '<i>—</i>'; };
        box.innerHTML = subs.length ? `<div class="tally-head"><b>우리 반 실험 결과</b><span>${subs.length}명 제출</span></div><div class="table-wrap"><table class="terms tally-t"><thead><tr><th>${esc(rowF.label)}</th>${cols.map((f) => `<th>${esc(f.label)}</th>`).join('')}</tr></thead><tbody>${[...groups].map(([k, arr]) => `<tr><th>${esc(k)} <small>${arr.length}</small></th>${cols.map((f) => `<td>${cell(arr, f)}</td>`).join('')}</tr>`).join('')}<tr class="total"><th>전체</th>${cols.map((f) => `<td>${cell(subs, f)}</td>`).join('')}</tr></tbody></table></div>` : '<div class="tally-head"><b>우리 반 실험 결과</b><span>제출하면 여기에 모여요</span></div>';
      }
    }
    if (s.cards) {
      const revealed = revealedSet(s);
      el.querySelectorAll('.jcard').forEach((card) => {
        const i = card.dataset.card; const rs = respsFor(s.key, 'card-' + i);
        const item = s.cards.items[+i]; const rev = revealed.has(+i) && item.answer;
        const mine = myResp(s.key, 'card-' + i); const show = S.teacher || !!mine || rev;
        card.classList.toggle('revealed', !!rev);
        const ans = card.querySelector('.janswer');
        ans.hidden = !rev;
        if (rev) ans.innerHTML = `<b>정답 ${esc(item.answer)}</b> ${esc(item.explain || '')}`;
        card.querySelectorAll('.jb').forEach((b) => b.classList.toggle('correct', !!rev && b.dataset.choice === item.answer));
        const rb = card.querySelector('.reveal-btn'); if (rb) { rb.textContent = rev ? '정답 숨기기' : '정답 확인'; rb.classList.toggle('on', !!rev); }
        const nm = card.querySelector('.jnames');
        if (nm) nm.innerHTML = s.cards.choices.map((c) => { const who = rs.filter((r) => r.value === c).map((r) => esc(r.name)); return `<div class="jname-row"><span class="jname-c" data-c="${esc(c)}">${esc(c)}</span><span>${who.length ? who.join(', ') : '<i>없음</i>'}</span></div>`; }).join('');
        const n = {}; s.cards.choices.forEach((c) => (n[c] = 0)); rs.forEach((r) => { if (n[r.value] != null) n[r.value]++; });
        const tot = rs.length;
        card.querySelectorAll('.jb').forEach((b) => {
          b.classList.toggle('mine', !!(mine && mine.value === b.dataset.choice));
          b.querySelector('.jc').textContent = show && tot ? n[b.dataset.choice] : '';
        });
        card.querySelectorAll('[data-bar]').forEach((bar) => { bar.style.flexGrow = show && tot ? n[bar.dataset.bar] : 0; });
        card.querySelector('.jbar').classList.toggle('empty', !(show && tot));
        card.querySelector('.jn').textContent = tot ? tot + '명 판정' : '';
      });
    }
  }

  function revealedSet(s) {
    let best = null;
    for (const r of S.responses.values()) if (r.slide_key === s.key && r.item === 'reveal' && (!best || String(r.updated_at) > String(best.updated_at))) best = r;
    return new Set(best && Array.isArray(best.value) ? best.value : []);
  }
  async function toggleReveal(s, i) {
    const set = revealedSet(s); set.has(i) ? set.delete(i) : set.add(i);
    const row = { slide_key: s.key, item: 'reveal', participant_id: S.me.id, name: '선생님', value: [...set].sort(), updated_at: new Date().toISOString() };
    S.responses.set(rkey(row), row); renderLive();
    try { const { updated_at, ...r } = row; await api.upsertResponse(r); } catch (e) { fail(e); }
  }
  async function vote(s, i) {
    if (S.teacher) return toast('교사 화면에서는 결과만 볼 수 있어요');
    const mine = myResp(s.key, 'poll');
    let value;
    if (s.poll.multi) { const v = new Set(mine && Array.isArray(mine.value) ? mine.value : []); v.has(i) ? v.delete(i) : v.add(i); value = [...v].sort(); }
    else value = i;
    const row = { slide_key: s.key, item: 'poll', participant_id: S.me.id, name: S.me.name, value };
    S.responses.set(rkey(row), { ...(mine || {}), ...row }); renderLive();
    try { await api.upsertResponse(row); } catch (e) { fail(e); }
  }
  async function judge(s, i, choice) {
    if (S.teacher) return toast('교사 화면에서는 결과만 볼 수 있어요');
    const row = { slide_key: s.key, item: 'card-' + i, participant_id: S.me.id, name: S.me.name, value: choice };
    S.responses.set(rkey(row), row); renderLive();
    try { await api.upsertResponse(row); } catch (e) { fail(e); }
  }
  async function submitForm(s, host) {
    if (S.teacher) return toast('교사 화면에서는 제출할 수 없어요');
    const value = {}; let any = false;
    host.querySelectorAll('[data-field]').forEach((t) => { value[t.dataset.field] = t.value.trim(); if (value[t.dataset.field]) any = true; });
    if (!any) return toast('내용을 입력해 주세요');
    const miss = s.submit.fields.find((f) => f.options && !value[f.id]);
    if (miss) return toast(miss.label + '을(를) 골라 주세요');
    const state = host.querySelector('.submit-state');
    try {
      await api.upsertResponse({ slide_key: s.key, item: 'submit', participant_id: S.me.id, name: S.me.name, value });
      const body = s.submit.fields.filter((f) => value[f.id]).map((f) => `【${f.label}】 ${value[f.id]}`).join('\n');
      if (!S.room.chat_locked) await api.sendMessage({ slide_key: s.key, participant_id: S.me.id, name: S.me.name, body: body.slice(0, 1200) });
      state.textContent = '제출했어요 ✓ 고쳐서 다시 제출할 수도 있어요';
    } catch (e) { fail(e); }
  }

  // ---------------- 채팅 ----------------
  function renderChat() {
    const s = cur(); const list = $('chatList');
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
    const msgs = S.messages.filter((m) => m.slide_key === s.key && (S.teacher || !m.hidden));
    $('chatCount').textContent = msgs.filter((m) => !m.hidden).length;
    const sig = s.key + '|' + msgs.map((m) => m.id + (m.hidden ? 'h' : '')).join(',');
    const same = sig === S._chatSig; S._chatSig = sig;
    if (same) { /* 변경 없음: 다시 그리지 않음 */ }
    else if (!msgs.length) list.innerHTML = `<div class="chat-empty"><div class="bubble-ico">💬</div><p>${esc(s.chatPrompt || '첫 의견을 남겨 주세요')}</p></div>`;
    else list.innerHTML = msgs.map((m) => {
      const mine = m.participant_id && m.participant_id === S.me.id && !m.is_teacher || (S.teacher && m.is_teacher);
      const cls = ['msg', mine ? 'mine' : '', m.is_teacher ? 'teacher' : '', m.hidden ? 'hidden-msg' : ''].join(' ');
      const t = new Date(m.created_at); const tm = isNaN(t) ? '' : t.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      const tools = S.teacher && !m.is_teacher ? `<button class="hide-btn" data-id="${m.id}" data-h="${m.hidden ? 0 : 1}">${m.hidden ? '다시 보이기' : '숨기기'}</button>` : '';
      return `<div class="${cls}"><div class="who">${mine ? '' : esc(m.name)}${m.hidden ? ' · 숨김' : ''}</div><div class="bubble${m.image_url ? ' has-img' : ''}">${m.image_url ? `<img class="chat-img" src="${esc(m.image_url)}" alt="${esc(m.name)}님이 올린 이미지" loading="lazy">` : ''}${m.image_url && m.body === '(이미지)' ? '' : esc(m.body)}</div><div class="meta">${tm}${tools}</div></div>`;
    }).join('');
    if (!same) {
      list.querySelectorAll('.hide-btn').forEach((b) => b.addEventListener('click', async () => {
        try { await api.setHidden(S.code, +b.dataset.id, b.dataset.h === '1'); } catch (e) { fail(e); }
      }));
      list.querySelectorAll('.chat-img').forEach((img) => img.addEventListener('click', () => openLightbox(img.src, img.alt)));
    }
    if (nearBottom || S._forceBottom) { list.scrollTop = list.scrollHeight; S._forceBottom = false; }
    const locked = S.room.chat_locked && !S.teacher;
    $('chatText').disabled = locked; $('sendBtn').disabled = locked;
    $('chatForm').classList.toggle('locked', locked);
    if (locked) $('chatText').placeholder = '선생님이 채팅을 잠시 멈췄어요';
    else $('chatText').placeholder = s.chatPrompt || '의견을 입력하세요';
  }

  const ta = $('chatText');
  ta.addEventListener('input', () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'; });
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('chatForm').requestSubmit(); } });
  $('chatForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = ta.value.trim(); if (!body) return;
    if (Date.now() - S.lastSend < 1500) return toast('조금만 천천히 보내 주세요');
    S.lastSend = Date.now();
    const s = cur(); ta.value = ''; ta.style.height = 'auto'; S._forceBottom = true;
    try {
      if (S.teacher) await api.teacherSend(S.code, s.key, body);
      else await api.sendMessage({ slide_key: s.key, participant_id: S.me.id, name: S.me.name, body });
    } catch (err) { ta.value = body; fail(S.room.chat_locked ? '채팅이 잠겨 있어요' : err); }
  });

  // 이미지 공유: 기기에서 고른 사진을 줄여서(최대 1280px) 올립니다
  function shrink(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file); const img = new Image();
      img.onload = () => {
        const max = 1280; const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        c.toBlob((b) => (b ? res(b) : rej(new Error('이미지를 변환하지 못했어요'))), 'image/jpeg', 0.82);
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('이미지 파일을 열 수 없어요')); };
      img.src = url;
    });
  }
  $('imgInput').addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0]; e.target.value = '';
    if (!file) return;
    if (!/^image\//.test(file.type)) return toast('이미지 파일만 올릴 수 있어요');
    if (S.room.chat_locked) return toast('채팅이 잠겨 있어요');
    const s = cur(); $('imgBtn').classList.add('busy');
    try {
      const blob = await shrink(file);
      const url = await api.uploadImage(blob);
      S._forceBottom = true;
      const caption = ta.value.trim(); if (caption) { ta.value = ''; ta.style.height = 'auto'; }
      await api.sendMessage({ slide_key: s.key, participant_id: S.me.id, name: S.me.name, body: caption || '(이미지)', image_url: url });
      toast('이미지를 공유했어요');
    } catch (err) { fail(err); }
    finally { $('imgBtn').classList.remove('busy'); }
  });
  function openLightbox(src, alt) { $('lightImg').src = src; $('lightImg').alt = alt || ''; $('lightbox').hidden = false; }
  $('lightbox').addEventListener('click', () => ($('lightbox').hidden = true));

  // ---------------- 교사: 전체 목차 (주소창 클릭) ----------------
  function renderOverview() {
    const curIdx = S.room.current_slide | 0;
    $('ovBody').innerHTML = SECTIONS.map((name, sec) => {
      const items = SLIDES.map((x, i) => ({ x, i })).filter(({ x }) => x.section === sec);
      if (!items.length) return '';
      return `<section class="ov-sec"><h4>${sec ? sec + '. ' : ''}${esc(name)}</h4><div class="ov-grid">${items.map(({ x, i }) => {
        const kind = x.layout === 'divider' ? '간지' : x.video ? '영상' : x.poll ? '투표' : x.cards ? '판정' : x.submit ? '제출' : x.flips ? '카드' : x.checks ? '체크' : x.link ? '활동' : '설명';
        return `<button class="ov-card ${i === curIdx ? 'current' : ''} ${x.layout === 'divider' ? 'is-div' : ''}" data-go="${i}"><span class="ov-n">${i + 1}</span><span class="ov-k">${kind}</span><b>${esc(x.title)}</b></button>`;
      }).join('')}</div></section>`;
    }).join('');
  }
  $('address').addEventListener('click', () => {
    if (!S.teacher) return;
    renderOverview(); $('overview').hidden = false;
    const c = $('ovBody').querySelector('.current'); if (c) c.scrollIntoView({ block: 'center' });
  });
  $('ovClose').addEventListener('click', () => ($('overview').hidden = true));
  $('ovBody').addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) { $('overview').hidden = true; go(+b.dataset.go); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { $('overview').hidden = true; $('lightbox').hidden = true; } });

  // ---------------- 교사 도구 ----------------
  // 교사가 방금 넘긴 화면이 늦게 도착한 옛 데이터로 되돌아가지 않도록 잠시 보호
  function guardRoom(r) {
    if (S.teacher && S.pending && Date.now() < S.pending.until && r.current_slide !== S.pending.slide) return { ...r, current_slide: S.pending.slide };
    return r;
  }
  async function go(i) {
    if (!S.teacher) return;
    i = Math.max(0, Math.min(SLIDES.length - 1, i));
    if (i === (S.room.current_slide | 0)) return;
    const prev = S.room.current_slide | 0;
    S.pending = { slide: i, until: Date.now() + 4000 };
    S.room.current_slide = i; render();
    try { await api.setRoom(S.code, { current_slide: i }); }
    catch (e) { S.pending = null; S.room.current_slide = prev; render(); fail(new Error('화면을 넘기지 못했어요 (' + (e.message || e) + ')')); }
  }
  $('prevBtn').onclick = $('tbPrev').onclick = () => go((S.room.current_slide | 0) - 1);
  $('nextBtn').onclick = $('tbNext').onclick = () => go((S.room.current_slide | 0) + 1);
  $('tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b && S.teacher) go(+b.dataset.go); });
  document.addEventListener('keydown', (e) => {
    if (!S.teacher || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || !$('overview').hidden) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') go((S.room.current_slide | 0) + 1);
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') go((S.room.current_slide | 0) - 1);
  });
  $('tbLock').onclick = async () => {
    const v = !S.room.chat_locked; S.room.chat_locked = v; render();
    try { await api.setRoom(S.code, { chat_locked: v }); } catch (e) { fail(e); }
  };
  $('tbRoster').onclick = () => { $('roster').hidden = !$('roster').hidden; renderRoster(); };
  $('rosterClose').onclick = () => ($('roster').hidden = true);
  $('tbReset').onclick = async () => {
    if (!(await confirmBox('수업 데이터 초기화', '모든 채팅·응답·명단이 지워지고 첫 슬라이드로 돌아갑니다. 되돌릴 수 없어요. 먼저 CSV를 받아 두세요.'))) return;
    try { await api.resetAll(S.code); await reload(); render(); toast('초기화했어요'); } catch (e) { fail(e); }
  };

  function renderRoster() {
    if (!S.teacher) return;
    const online = new Map(S.presence.filter((p) => p.role !== 'teacher').map((p) => [p.id, p]));
    // 실시간 접속 정보가 없을 때는 최근 70초 안에 접속 기록이 있는 학생을 접속 중으로 표시
    const now = Date.now();
    S.participants.forEach((p) => { if (!online.has(p.id) && p.last_seen && now - new Date(p.last_seen).getTime() < 70000) online.set(p.id, p); });
    $('rosterN').textContent = online.size;
    if ($('roster').hidden) return;
    const all = new Map(S.participants);
    online.forEach((p, id) => { if (!all.has(id)) all.set(id, { id, name: p.name }); });
    const s = cur();
    const answered = new Set();
    for (const r of S.responses.values()) if (r.slide_key === s.key) answered.add(r.participant_id);
    S.messages.forEach((m) => { if (m.slide_key === s.key) answered.add(m.participant_id); });
    const rows = [...all.values()].sort((a, b) => (online.has(b.id) - online.has(a.id)) || a.name.localeCompare(b.name, 'ko'));
    $('rosterBody').innerHTML = `<div class="roster-sum">접속 ${online.size}명 · 전체 ${all.size}명 · 이 슬라이드 참여 ${[...answered].filter((id) => all.has(id)).length}명</div>` +
      (rows.length ? rows.map((p) => `<div class="roster-row ${online.has(p.id) ? 'on' : ''}"><i></i><span>${esc(p.name)}</span>${answered.has(p.id) ? '<em>참여</em>' : ''}</div>`).join('') : '<p class="muted">아직 아무도 없어요</p>');
  }

  $('tbCsv').onclick = async () => {
    try {
      const [msgs, resps, parts] = await Promise.all([api.listMessages(), api.listResponses(), api.listParticipants()]);
      const idx = Object.fromEntries(SLIDES.map((s, i) => [s.key, i]));
      const fmt = (s, item, v) => {
        if (v == null) return '';
        if (s && s.poll && item === 'poll') return (Array.isArray(v) ? v : [v]).map((i) => s.poll.options[i]).join(' / ');
        if (s && s.submit && item === 'submit') return s.submit.fields.map((f) => `${f.label}: ${v[f.id] || ''}`).join(' | ');
        return typeof v === 'object' ? JSON.stringify(v) : String(v);
      };
      const itemName = (s, item) => {
        if (item.startsWith('card-') && s && s.cards) return s.cards.items[+item.slice(5)].title;
        return { poll: '투표', submit: '제출' }[item] || item;
      };
      const rows = [['구분', '슬라이드', '슬라이드 제목', '이름', '항목', '응답', '시간']];
      resps.filter((r) => r.item !== 'reveal').forEach((r) => { const s = SLIDES[idx[r.slide_key]]; rows.push(['응답', (idx[r.slide_key] ?? -1) + 1, s ? s.title : r.slide_key, r.name, itemName(s, r.item), fmt(s, r.item, r.value), r.updated_at]); });
      msgs.forEach((m) => { const s = SLIDES[idx[m.slide_key]]; rows.push(['채팅' + (m.hidden ? '(숨김)' : ''), (idx[m.slide_key] ?? -1) + 1, s ? s.title : m.slide_key, m.name, m.image_url ? '이미지' : '', m.image_url ? (m.body === '(이미지)' ? '' : m.body + ' ') + m.image_url : m.body, m.created_at]); });
      const body = rows.slice(1).sort((a, b) => (a[1] - b[1]) || String(a[6]).localeCompare(String(b[6])));
      parts.forEach((p) => body.push(['참여자', '', '', p.name, '접속', '', p.joined_at]));
      const csv = '﻿' + [rows[0], ...body].map((r) => r.map((c) => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(',')).join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const d = new Date(); a.download = `AI리터러시_${ROOM}_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      toast('CSV를 내려받았어요');
    } catch (e) { fail(e); }
  };
})();
