(function () {
  'use strict';

  var ARTICLES = window.ARTICLES;
  var ITEMS = window.ITEMS;
  var SCALE = [
    { v: 1, t: 'Strongly disagree' },
    { v: 2, t: 'Disagree' },
    { v: 3, t: 'Not sure' },
    { v: 4, t: 'Agree' },
    { v: 5, t: 'Strongly agree' }
  ];
  var TIER = {
    1: { name: 'Essential', c: 'var(--tier1)', bg: 'var(--tier1-bg)', hex: '#7a1f1f' },
    2: { name: 'Urgent', c: 'var(--tier2)', bg: 'var(--tier2-bg)', hex: '#9a5b13' },
    3: { name: 'Important', c: 'var(--tier3)', bg: 'var(--tier3-bg)', hex: '#2f6b4f' },
    4: { name: 'Preference', c: 'var(--tier4)', bg: 'var(--tier4-bg)', hex: '#3e5c76' }
  };

  var state = { mode: null, step: 0, answers: {} };
  var main = document.getElementById('main');
  var progress = document.getElementById('progress');
  var chart = null;
  var CFG = window.CREED_CONFIG || {};
  var OWNER = CFG.ownerName || 'Erv';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function activeItems() {
    return state.mode === 'essentials' ? ITEMS.filter(function (i) { return i.tier === 1; }) : ITEMS.slice();
  }
  function steps() {
    var items = activeItems();
    return ARTICLES.map(function (a) {
      return { article: a, items: items.filter(function (i) { return i.a === a.n; }) };
    }).filter(function (s) { return s.items.length; });
  }
  function answeredCount() {
    return activeItems().filter(function (i) { return state.answers[i.id]; }).length;
  }
  function scrollTop() { window.scrollTo({ top: 0, behavior: 'auto' }); main.focus({ preventScroll: true }); }

  function setProgress(show) {
    progress.hidden = !show;
    if (!show) return;
    var total = activeItems().length, done = answeredCount();
    var pct = Math.round((done / total) * 100);
    document.getElementById('progressLabel').textContent = done + ' of ' + total + ' answered';
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressBar').setAttribute('aria-valuenow', pct);
  }

  // ---------- Intro
  function renderIntro() {
    state = { mode: null, step: 0, answers: {} };
    setProgress(false);
    var t1 = ITEMS.filter(function (i) { return i.tier === 1; }).length;
    main.innerHTML =
      '<section class="hero fade-in">' +
        '<p class="eyebrow">A self-examination survey</p>' +
        '<h1>What do you believe about the faith once delivered?</h1>' +
        '<p class="lede">Rate each statement drawn from the Apostles\u2019 Creed. Your report shows where your beliefs line up with the essentials of historic Christianity, and where you stand on questions faithful Christians debate.</p>' +
      '</section>' +
      '<div class="modes fade-in">' +
        '<button type="button" class="mode primary" data-start="full">' +
          '<div class="meta"><span>' + ITEMS.length + ' statements</span><span>About 12 minutes</span></div>' +
          '<h2>Full survey</h2>' +
          '<p>All twelve articles of the creed, including secondary questions such as baptism, spiritual gifts, and the end times.</p>' +
          '<span class="go">Begin the full survey</span>' +
        '</button>' +
        '<button type="button" class="mode" data-start="essentials">' +
          '<div class="meta"><span>' + t1 + ' statements</span><span>About 7 minutes</span></div>' +
          '<h2>Essentials check</h2>' +
          '<p>Only the Tier 1 statements: the truths that define the Christian faith itself.</p>' +
          '<span class="go">Begin the essentials check</span>' +
        '</button>' +
      '</div>' +
      '<div class="howto fade-in">' +
        '<div><h3>Rate each statement</h3><p>From strongly disagree to strongly agree. Some statements are true and some are false, so read each one carefully.</p></div>' +
        '<div><h3>Essentials are checked</h3><p>Answers on Tier 1 statements are compared with historic Christian teaching and highlighted when they differ.</p></div>' +
        '<div><h3>Everything else is mapped</h3><p>Secondary questions have no wrong answer. The report shows where you lean instead.</p></div>' +
      '</div>' +
      '<div class="tiers-legend">' +
        [1, 2, 3, 4].map(function (n) {
          var d = { 1: 'Defines the faith', 2: 'Shapes the church', 3: 'Debated within a church', 4: 'Personal preference' }[n];
          return '<div class="tl" style="--c:' + TIER[n].c + '"><b>Tier ' + n + ' \u00b7 ' + TIER[n].name + '</b>' + d + '</div>';
        }).join('') +
      '</div>' +
      '<p class="grace"><b>A word of grace.</b> This is a tool for understanding beliefs, not a test for salvation. People are saved by trusting Christ, not by mastering vocabulary, and a new believer may not yet know how to answer every question.</p>';
    scrollTop();
  }

  // ---------- Survey
  function renderStep() {
    var all = steps();
    var s = all[state.step];
    setProgress(true);
    var html =
      '<section class="article-head fade-in">' +
        '<p class="eyebrow">Article ' + s.article.n + ' \u00b7 Step ' + (state.step + 1) + ' of ' + all.length + '</p>' +
        '<h1>' + esc(s.article.title) + '</h1>' +
        '<blockquote>' + esc(s.article.creed) + '</blockquote>' +
      '</section>' +
      '<div class="scale-hint" aria-hidden="true"><span>1 = Strongly disagree</span><span>5 = Strongly agree</span></div>' +
      '<form id="stepForm" class="fade-in" novalidate>' +
      s.items.map(function (it) {
        var name = 'q' + it.id;
        return '<fieldset class="item" id="item-' + it.id + '">' +
          '<legend><span class="q"><span class="qn">' + it.id + '</span><span>' + esc(it.text) + '</span></span></legend>' +
          '<div class="likert">' +
          SCALE.map(function (o) {
            var checked = state.answers[it.id] === o.v ? ' checked' : '';
            return '<label><input type="radio" name="' + name + '" value="' + o.v + '"' + checked + ' aria-label="' + o.t + '">' +
              '<span class="num">' + o.v + '</span><span class="txt">' + o.t + '</span></label>';
          }).join('') +
          '</div></fieldset>';
      }).join('') +
      '</form>' +
      '<div class="nav">' +
        '<button type="button" class="btn ghost" data-action="back">' + (state.step === 0 ? 'Change survey' : 'Back') + '</button>' +
        '<p class="nav-msg" id="navMsg" role="status" aria-live="polite"></p>' +
        '<button type="button" class="btn" data-action="next">' + (state.step === all.length - 1 ? 'See my results' : 'Next') + '</button>' +
      '</div>';
    main.innerHTML = html;
    scrollTop();
  }

  function onChange(e) {
    var t = e.target;
    if (t.type !== 'radio') return;
    var id = Number(t.name.slice(1));
    state.answers[id] = Number(t.value);
    var fs = document.getElementById('item-' + id);
    if (fs) fs.classList.remove('missing');
    var msg = document.getElementById('navMsg');
    if (msg) msg.textContent = '';
    setProgress(true);
  }

  function next() {
    var s = steps()[state.step];
    var missing = s.items.filter(function (i) { return !state.answers[i.id]; });
    if (missing.length) {
      missing.forEach(function (i) { document.getElementById('item-' + i.id).classList.add('missing'); });
      document.getElementById('navMsg').textContent = missing.length === 1 ? 'Please answer the highlighted statement.' : 'Please answer the ' + missing.length + ' highlighted statements.';
      document.getElementById('item-' + missing[0].id).scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (state.step < steps().length - 1) { state.step++; renderStep(); }
    else renderResults();
  }
  function back() {
    if (state.step === 0) { renderIntro(); return; }
    state.step--; renderStep();
  }

  // ---------- Scoring
  // f = answer converted to a "faithful" scale: 5 = fully aligned with historic teaching, 1 = fully opposed
  function faithful(it, v) { return it.key === 'A' ? v : 6 - v; }
  function score() {
    var items = activeItems();
    var t1 = items.filter(function (i) { return i.tier === 1; });
    var flags = [], unsure = [], aligned = 0, sum = 0;
    t1.forEach(function (it) {
      var f = faithful(it, state.answers[it.id]);
      sum += (f - 1) / 4;
      if (f >= 4) aligned++;
      else if (f === 3) unsure.push(it);
      else if (it.soft) unsure.push(it);
      else flags.push(it);
    });
    var byArticle = ARTICLES.map(function (a) {
      var list = t1.filter(function (i) { return i.a === a.n; });
      if (!list.length) return null;
      var s = list.reduce(function (acc, it) { return acc + (faithful(it, state.answers[it.id]) - 1) / 4; }, 0);
      return { n: a.n, title: a.title, pct: Math.round((s / list.length) * 100) };
    }).filter(Boolean);
    var open = items.filter(function (i) { return i.tier > 1; });
    return { t1: t1, pct: Math.round((sum / t1.length) * 100), aligned: aligned, flags: flags, unsure: unsure, byArticle: byArticle, open: open };
  }

  function verdict(r) {
    if (!r.flags.length && !r.unsure.length) return {
      h: 'Your answers affirm every essential of the historic Christian faith.',
      p: 'On each Tier 1 statement, you answered in line with what Christians have confessed since the Apostles\u2019 Creed.' + (state.mode === 'full' ? ' Where you differ from other believers, it is on secondary questions that faithful churches debate.' : ' The full survey adds the secondary questions that faithful churches debate.') };
    if (!r.flags.length) return {
      h: 'Your answers affirm the essentials, with a few places to explore.',
      p: 'None of your answers contradict historic Christian teaching, but on a few essential statements you were unsure or disagreed with wording. Those are listed below with Scripture to study.' };
    if (r.flags.length <= 3) return {
      h: 'Your answers affirm most essentials, and a few differ from historic teaching.',
      p: 'On ' + r.flags.length + ' essential ' + (r.flags.length === 1 ? 'statement' : 'statements') + ', your answer differs from what the church has historically confessed. That may come from the wording, or it may reflect a real difference worth studying. Each one is listed below with the reasoning and Scripture.' };
    return {
      h: 'Several of your answers differ from historic Christian teaching on essentials.',
      p: 'On ' + r.flags.length + ' Tier 1 statements, your answers differ from what Christians have confessed since the early church. This is not a verdict on you; it is an invitation to look at these truths closely, with Scripture and with a pastor or trusted believer.' };
  }

  function answerLabel(v) { return SCALE[v - 1].t; }

  function ring(pct) {
    var r = 70, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
    var col = pct >= 85 ? '#2f6b4f' : pct >= 60 ? '#a87a12' : '#7a1f1f';
    return '<div class="ring" role="img" aria-label="Essentials alignment ' + pct + ' percent">' +
      '<svg viewBox="0 0 168 168"><circle cx="84" cy="84" r="' + r + '" fill="none" stroke="#e6e1d8" stroke-width="14"/>' +
      '<circle cx="84" cy="84" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg>' +
      '<div class="val"><b>' + pct + '%</b><span>essentials</span></div></div>';
  }

  function flagCard(it, kind) {
    var fc = kind === 'differs' ? 'var(--tier1)' : 'var(--unsure)';
    var tag = kind === 'differs' ? 'Differs from historic teaching' : 'Worth exploring';
    var faithfulTxt = it.key === 'A' ? 'Historic Christian teaching affirms this.' : 'Historic Christian teaching rejects this.';
    return '<div class="flag" style="--fc:' + fc + '">' +
      '<div class="top"><p class="stmt">' + it.id + '. ' + esc(it.text) + '</p><span class="tag">' + tag + '</span></div>' +
      '<p class="yours">You answered: <b>' + answerLabel(state.answers[it.id]) + '</b>. ' + faithfulTxt + '</p>' +
      '<p class="why">' + esc(it.why) + '</p>' +
      '<p class="refs">Study: ' + esc(it.refs) + '</p></div>';
  }

  function leanRow(it) {
    var v = state.answers[it.id];
    var pos = ((v - 1) / 4) * 100;
    var side = v < 3 ? 0 : v > 3 ? 1 : -1;
    var keyNote = '';
    if (it.key) {
      var f = faithful(it, v);
      keyNote = f >= 4 ? '' : '<p class="note">' + esc(it.why) + '</p>';
      var lbl = it.key === 'A' ? ['Disagree', 'Agree'] : ['Disagree', 'Agree'];
      return '<div class="lean" style="--c:' + TIER[it.tier].c + '"><p class="stmt">' + it.id + '. ' + esc(it.text) + '</p>' +
        '<div class="bar"><span class="l' + (side === 0 ? ' on' : '') + '">' + lbl[0] + '</span><div class="track"><i style="left:' + pos + '%"></i></div><span class="r' + (side === 1 ? ' on' : '') + '">' + lbl[1] + '</span></div>' + keyNote + '</div>';
    }
    return '<div class="lean" style="--c:' + TIER[it.tier].c + '"><p class="stmt">' + it.id + '. ' + esc(it.text) + '</p>' +
      '<div class="bar"><span class="l' + (side === 0 ? ' on' : '') + '">' + esc(it.lean[0]) + '</span>' +
      '<div class="track" role="img" aria-label="You answered ' + answerLabel(v) + '"><i style="left:' + pos + '%"></i></div>' +
      '<span class="r' + (side === 1 ? ' on' : '') + '">' + esc(it.lean[1]) + '</span></div>' +
      (side === -1 ? '<p class="note">You were unsure. ' + esc(it.why) + '</p>' : '') + '</div>';
  }

  function renderResults() {
    var r = score();
    var v = verdict(r);
    progress.hidden = true;
    var html =
      '<section class="result-head fade-in">' + ring(r.pct) +
        '<div><p class="eyebrow">Your report \u00b7 ' + (state.mode === 'essentials' ? 'Essentials check' : 'Full survey') + '</p>' +
        '<h1>' + v.h + '</h1><p class="summary">' + v.p + '</p>' +
        '<div class="counts">' +
          '<span class="count" style="--bg:var(--tier3-bg);--fg:var(--tier3)">' + r.aligned + ' of ' + r.t1.length + ' essentials affirmed</span>' +
          (r.unsure.length ? '<span class="count" style="--bg:var(--unsure-bg);--fg:var(--unsure)">' + r.unsure.length + ' worth exploring</span>' : '') +
          (r.flags.length ? '<span class="count" style="--bg:var(--tier1-bg);--fg:var(--tier1)">' + r.flags.length + ' differ from historic teaching</span>' : '') +
        '</div></div>' +
      '</section>';

    html += '<section class="section"><h2>Essentials to look at closely</h2>' +
      '<p class="sub">Tier 1 statements where your answer was unsure or differs from what the church has historically confessed.</p>';
    if (!r.flags.length && !r.unsure.length) {
      html += '<div class="card all-clear"><span class="tick" aria-hidden="true">\u2713</span><p>No essential statements need attention. You affirmed all ' + r.t1.length + '.</p></div>';
    } else {
      html += r.flags.map(function (i) { return flagCard(i, 'differs'); }).join('') +
        r.unsure.map(function (i) { return flagCard(i, 'unsure'); }).join('');
    }
    html += '</section>';

    html += '<section class="section"><h2>Essentials by article of the creed</h2>' +
      '<p class="sub">How closely your Tier 1 answers line up with historic teaching in each part of the creed. 100% means you strongly affirmed every essential in that article.</p>' +
      '<div class="card"><div class="chart-box"><canvas id="articleChart" aria-label="Bar chart of essentials alignment by creed article" role="img"></canvas></div></div></section>';

    if (state.mode === 'full') {
      html += '<section class="section"><h2>Where you stand on secondary questions</h2>' +
        '<p class="sub">These are not scored. Faithful Christians answer them differently, and your answers help show which church traditions you are closest to.</p>' +
        '<div class="card">' +
        [2, 3, 4].map(function (t) {
          var list = r.open.filter(function (i) { return i.tier === t; });
          return '<div class="profile-group" style="--c:' + TIER[t].c + '"><h3>Tier ' + t + ' \u00b7 ' + TIER[t].name + '</h3>' + list.map(leanRow).join('') + '</div>';
        }).join('') +
        '</div></section>';
    }

    html += '<details class="method"><summary>How this report is calculated</summary><ul>' +
      '<li>Each Tier 1 statement is either true or false according to historic Christian teaching. About half are phrased so that the faithful answer is \u201cdisagree.\u201d</li>' +
      '<li>Agreeing strongly with a true statement, or disagreeing strongly with a false one, counts 100%. \u201cNot sure\u201d counts 50%. The essentials score is the average across all Tier 1 statements.</li>' +
      '<li>A Tier 1 answer of \u201cnot sure\u201d is marked worth exploring. A Tier 1 answer in the opposite direction is marked as differing from historic teaching. Statement 17 (\u201cmother of God\u201d) is only marked worth exploring, because disagreement there is usually about wording.</li>' +
      '<li>Tier 2, 3, and 4 statements are never flagged. Their position is shown on a scale between two common views.</li>' +
      '</ul></details>';

    html += shareSection();
    html += '<div class="actions">' +
      '<button type="button" class="btn" data-action="download">Download my results</button>' +
      '<button type="button" class="btn ghost" data-action="review">Review my answers</button>' +
      (state.mode === 'essentials' ? '<button type="button" class="btn ghost" data-action="upgrade">Take the full survey</button>' : '') +
      '<button type="button" class="btn ghost" data-action="home">Start over</button></div>';

    main.innerHTML = html;
    scrollTop();
    drawChart(r);
  }

  function shareSection() {
    var hasSheet = !!CFG.sheetEndpoint;
    return '<section class="section" id="share"><h2>Share your results with ' + esc(OWNER) + '</h2>' +
      '<p class="sub">Optional. Nothing is sent unless you choose to. ' + (hasSheet ? 'Sending adds your score, flagged statements, and answers to ' + esc(OWNER) + '\u2019s private response sheet.' : 'This opens your email app with a summary of your results.') + '</p>' +
      '<form class="card share-form" id="shareForm" novalidate>' +
        '<div class="field-row">' +
          '<label class="field"><span>Your name <em class="opt">(optional)</em></span><input type="text" name="name" maxlength="80" autocomplete="name" /></label>' +
          '<label class="field"><span>Your email <em class="opt">(optional, if you want a reply)</em></span><input type="email" name="email" maxlength="120" autocomplete="email" /></label>' +
        '</div>' +
        '<label class="field"><span>A note or question <em class="opt">(optional)</em></span><textarea name="note" rows="3" maxlength="1000"></textarea></label>' +
        '<label class="consent"><input type="checkbox" name="consent" /> <span>I agree to send my answers and results to ' + esc(OWNER) + '.</span></label>' +
        '<div class="share-actions">' +
          (hasSheet ? '<button type="submit" class="btn">Send to ' + esc(OWNER) + '</button>' : '') +
          (CFG.ownerEmail ? '<button type="button" class="btn ' + (hasSheet ? 'ghost' : '') + '" data-action="mail">Email my results' + (hasSheet ? ' instead' : '') + '</button>' : '') +
        '</div>' +
        '<p class="share-status" id="shareStatus" role="status" aria-live="polite"></p>' +
      '</form></section>';
  }

  function shareFields() {
    var f = document.getElementById('shareForm');
    var el = f.elements;
    return { form: f, name: el['name'].value.trim(), email: el['email'].value.trim(), note: el['note'].value.trim(), consent: el['consent'].checked };
  }
  function setStatus(msg, kind) {
    var el = document.getElementById('shareStatus');
    el.textContent = msg; el.className = 'share-status' + (kind ? ' ' + kind : '');
  }
  function payload(fields) {
    var r = score();
    var answers = {};
    activeItems().forEach(function (i) { answers[i.id] = state.answers[i.id]; });
    var arts = {};
    r.byArticle.forEach(function (a) { arts[a.n] = a.pct; });
    return {
      name: fields.name, email: fields.email, note: fields.note,
      mode: state.mode === 'essentials' ? 'Essentials check' : 'Full survey',
      pct: r.pct, affirmed: r.aligned, total: r.t1.length,
      exploring: r.unsure.length, differs: r.flags.length,
      flagged: r.flags.map(function (i) { return i.id; }).join(', '),
      unsure: r.unsure.map(function (i) { return i.id; }).join(', '),
      articles: arts, answers: answers,
      page: location.href.split('#')[0]
    };
  }
  function sendSheet(e) {
    e.preventDefault();
    var f = shareFields();
    if (!f.consent) { setStatus('Please check the box to agree before sending.', 'warn'); return; }
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) { setStatus('That email address looks incomplete. Fix it or leave it blank.', 'warn'); return; }
    var btn = f.form.querySelector('button[type="submit"]');
    btn.disabled = true; setStatus('Sending\u2026');
    fetch(CFG.sheetEndpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload(f)) })
      .then(function () { setStatus('Sent. Thank you for sharing your results with ' + OWNER + '.', 'ok'); btn.textContent = 'Sent'; })
      .catch(function () { btn.disabled = false; setStatus('Could not send right now. Check your connection, or use \u201cEmail my results\u201d instead.', 'warn'); });
  }
  function mailResults() {
    var f = shareFields();
    if (!f.consent) { setStatus('Please check the box to agree before sending.', 'warn'); return; }
    var p = payload(f), r = score(), v = verdict(r);
    var L = [];
    L.push("The Apostles' Creed, Examined: " + p.mode);
    if (p.name) L.push('From: ' + p.name + (p.email ? ' (' + p.email + ')' : ''));
    L.push('');
    L.push('Essentials score: ' + p.pct + '% (' + p.affirmed + ' of ' + p.total + ' affirmed)');
    L.push(v.h);
    if (p.flagged) L.push('Differs from historic teaching: ' + p.flagged);
    if (p.unsure) L.push('Worth exploring: ' + p.unsure);
    L.push('');
    L.push('By article: ' + r.byArticle.map(function (a) { return a.n + '=' + a.pct + '%'; }).join(', '));
    L.push('');
    L.push('Answers (statement=rating, 1 strongly disagree to 5 strongly agree):');
    L.push(Object.keys(p.answers).map(function (k) { return k + '=' + p.answers[k]; }).join(' '));
    if (p.note) { L.push(''); L.push('Note: ' + p.note); }
    var href = 'mailto:' + CFG.ownerEmail + '?subject=' + encodeURIComponent("My Apostles' Creed results" + (p.name ? ' - ' + p.name : '')) + '&body=' + encodeURIComponent(L.join('\n'));
    window.location.href = href;
    setStatus('Your email app should open with your results filled in. Press Send there to finish.', 'ok');
  }

  function drawChart(r) {
    var el = document.getElementById('articleChart');
    if (!el) return;
    if (!window.Chart) { el.parentElement.innerHTML = '<p class="sub">Chart unavailable.</p>'; return; }
    if (chart) chart.destroy();
    var mobile = window.matchMedia('(max-width: 720px)').matches;
    chart = new Chart(el, {
      type: 'bar',
      data: {
        labels: r.byArticle.map(function (a) { return mobile ? 'Art. ' + a.n : a.n + '. ' + a.title; }),
        datasets: [{
          data: r.byArticle.map(function (a) { return a.pct; }),
          backgroundColor: r.byArticle.map(function (a) { return a.pct >= 85 ? '#2f6b4f' : a.pct >= 60 ? '#c49a2c' : '#7a1f1f'; }),
          borderRadius: 4, barThickness: mobile ? 18 : 20
        }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: { duration: 500 },
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { title: function (c) { var a = r.byArticle[c[0].dataIndex]; return 'Article ' + a.n + ': ' + a.title; }, label: function (c) { return c.parsed.x + '% aligned'; } } }
        },
        scales: {
          x: { min: 0, max: 100, ticks: { callback: function (v) { return v + '%'; }, font: { family: 'Switzer', size: 12 }, color: '#5b6672' }, grid: { color: '#e6e1d8' } },
          y: { ticks: { font: { family: 'Switzer', size: 12 }, color: '#1f2933' }, grid: { display: false } }
        }
      }
    });
  }

  function download() {
    var r = score(), v = verdict(r);
    var lines = [];
    lines.push("THE APOSTLES' CREED, EXAMINED: MY RESULTS");
    lines.push((state.mode === 'essentials' ? 'Essentials check' : 'Full survey') + ' \u00b7 ' + new Date().toLocaleDateString());
    lines.push('');
    lines.push('Essentials score: ' + r.pct + '% (' + r.aligned + ' of ' + r.t1.length + ' affirmed)');
    lines.push(v.h);
    lines.push('');
    if (r.flags.length) { lines.push('DIFFERS FROM HISTORIC TEACHING'); r.flags.forEach(function (i) { lines.push('- ' + i.id + '. ' + i.text + ' (You: ' + answerLabel(state.answers[i.id]) + ')'); lines.push('  ' + i.why + ' Study: ' + i.refs); }); lines.push(''); }
    if (r.unsure.length) { lines.push('WORTH EXPLORING'); r.unsure.forEach(function (i) { lines.push('- ' + i.id + '. ' + i.text + ' (You: ' + answerLabel(state.answers[i.id]) + ')'); lines.push('  ' + i.why + ' Study: ' + i.refs); }); lines.push(''); }
    lines.push('ESSENTIALS BY ARTICLE');
    r.byArticle.forEach(function (a) { lines.push('- Article ' + a.n + ' (' + a.title + '): ' + a.pct + '%'); });
    if (state.mode === 'full') {
      lines.push(''); lines.push('SECONDARY QUESTIONS');
      r.open.forEach(function (i) {
        var val = state.answers[i.id];
        var lean = i.lean ? (val < 3 ? i.lean[0] : val > 3 ? i.lean[1] : 'Unsure') : answerLabel(val);
        lines.push('- [Tier ' + i.tier + '] ' + i.id + '. ' + i.text + ' (You: ' + answerLabel(val) + (i.lean ? '; leans: ' + lean : '') + ')');
      });
    }
    lines.push(''); lines.push('ALL ANSWERS');
    activeItems().forEach(function (i) { lines.push(i.id + '. [Tier ' + i.tier + '] ' + i.text + ' = ' + state.answers[i.id] + ' (' + answerLabel(state.answers[i.id]) + ')'); });
    var blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'apostles-creed-results.txt';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  document.addEventListener('click', function (e) {
    var start = e.target.closest('[data-start]');
    if (start) { state.mode = start.getAttribute('data-start'); state.step = 0; renderStep(); return; }
    var act = e.target.closest('[data-action]');
    if (!act) return;
    var a = act.getAttribute('data-action');
    if (a === 'next') next();
    else if (a === 'back') back();
    else if (a === 'home') renderIntro();
    else if (a === 'review') { state.step = 0; renderStep(); }
    else if (a === 'upgrade') { state.mode = 'full'; state.step = 0; renderStep(); }
    else if (a === 'download') download();
    else if (a === 'mail') mailResults();
  });
  document.addEventListener('change', onChange);
  document.addEventListener('submit', function (e) { if (e.target.id === 'shareForm') sendSheet(e); });

  // Test hook: ?fill=faithful|random|mixed pre-fills answers for review
  window.__creed = { fill: function (kind) {
    ITEMS.forEach(function (i) {
      var v;
      if (kind === 'faithful') v = i.key === 'A' ? 5 : i.key === 'D' ? 1 : 1 + (i.id % 5);
      else v = 1 + Math.floor(Math.random() * 5);
      state.answers[i.id] = v;
    });
  }, results: function (mode) { state.mode = mode || 'full'; renderResults(); } };

  renderIntro();
})();
