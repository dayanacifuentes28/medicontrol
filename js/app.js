(function () {
  var $ = function (id) { return document.getElementById(id); };
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function fd(d) { return two(d.getDate()) + '/' + two(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function ft(d) { return two(d.getHours()) + ':' + two(d.getMinutes()); }
  function addDays(n) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d; }
  function daysTo(d) { var t = new Date(); t.setHours(12, 0, 0, 0); return Math.round((d - t) / 86400000); }
  function ago(days, h, m) { var d = new Date(); d.setDate(d.getDate() - days); d.setHours(h, m, 0, 0); return d; }

  var TASKS = [
    ['login', 'Iniciar sesión'],
    ['consulta', 'Consultar el detalle de Paracetamol 500 mg'],
    ['registro', 'Registrar un medicamento nuevo'],
    ['alertas', 'Revisar las alertas pendientes'],
    ['salida', 'Registrar una salida de stock'],
    ['historial', 'Filtrar el historial por movimientos']
  ];

  var SAVEKEY = 'medicontrol.v1';

  var meds, acts, cfg, filtro, tasks, user, last, sel, nextId, filtroAct;

  function save() {
    try { localStorage.setItem(SAVEKEY, JSON.stringify({ meds: meds, acts: acts, cfg: cfg, nextId: nextId, last: last })); }
    catch (e) {}
  }
  function loadState() {
    var raw;
    try { raw = localStorage.getItem(SAVEKEY); } catch (e) { return false; }
    if (!raw) return false;
    try {
      var s = JSON.parse(raw);
      if (!s || !Array.isArray(s.meds) || !Array.isArray(s.acts) || !s.cfg) return false;
      meds = s.meds.map(function (m) { if (m.vence) m.vence = new Date(m.vence); return m; });
      acts = s.acts.map(function (a) { if (a.d) a.d = new Date(a.d); return a; });
      cfg = s.cfg; nextId = s.nextId || (meds.length + 1); last = s.last ? new Date(s.last) : new Date();
      return true;
    } catch (e) { return false; }
  }

  function init() {
    meds = [
      ['Paracetamol 500 mg', 'L24201', 120, 270], ['Amoxicilina 500 mg', 'L24115', 12, 210],
      ['Ibuprofeno 400 mg', 'L24207', 250, 430], ['Omeprazol 20 mg', 'L24310', 96, 510],
      ['Loratadina 10 mg', 'L24312', 58, 330], ['Metformina 850 mg', 'L24320', 140, 480],
      ['Losartán 50 mg', 'L24325', 88, 590], ['Salbutamol 100 mcg (inhalador)', 'L24330', 8, 40],
      ['Diclofenaco 50 mg', 'L24335', 75, 370], ['Azitromicina 500 mg', 'L24340', 42, 560],
      ['Atorvastatina 20 mg', 'L24345', 110, 650], ['Cetirizina 10 mg', 'L24350', 60, 305]
    ].map(function (r, i) { return { id: i + 1, n: r[0], lote: r[1], stock: r[2], vence: addDays(r[3]) }; });
    nextId = meds.length + 1;
    acts = [
      { d: ago(1, 16, 40), tipo: 'Consulta', txt: 'Paracetamol 500 mg' },
      { d: ago(1, 16, 32), tipo: 'Consulta', txt: 'Amoxicilina 500 mg' },
      { d: ago(2, 9, 15), tipo: 'Registro', txt: 'Medicamento registrado: Cetirizina 10 mg (lote L24350)' }
    ];
    cfg = { stock: 20, dias: 90 };
    filtro = 'todos'; filtroAct = 'todas'; user = ''; last = new Date(); sel = null;
    tasks = {};
    var ok = loadState();
    if (!ok) save();
    $('a-q').value = ''; $('a-cfg-stock').value = cfg.stock; $('a-cfg-dias').value = cfg.dias;
    $('a-hist-f').value = 'todas';
    document.querySelectorAll('[data-filter]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filter === 'todos')); });
  }

  function alertsFor(m) {
    var out = [];
    if (m.stock <= cfg.stock) out.push('Stock bajo: ' + m.stock + ' unidades');
    var d = daysTo(m.vence);
    if (d < 0) out.push('Vencido hace ' + Math.abs(d) + ' días');
    else if (d <= cfg.dias) out.push('Vence en ' + d + ' días');
    return out;
  }
  function alertMeds() { return meds.filter(function (m) { return alertsFor(m).length; }); }

  function done(k) { if (!tasks[k]) { tasks[k] = true; renderTasks(); } }
  function renderTasks() {
    var ul = $('a-tasks'); ul.innerHTML = ''; var n = 0;
    TASKS.forEach(function (t) {
      var li = document.createElement('li'); var ok = !!tasks[t[0]]; if (ok) { n++; li.className = 'done'; }
      var c = document.createElement('span'); c.className = 'ck'; c.setAttribute('aria-hidden', 'true'); c.textContent = ok ? '✓' : '';
      var s = document.createElement('span'); s.textContent = t[1] + (ok ? ' (hecho)' : '');
      li.appendChild(c); li.appendChild(s); ul.appendChild(li);
    });
    $('a-prog').textContent = n + ' de ' + TASKS.length + ' tareas completadas';
    $('a-tasks-end').hidden = n < TASKS.length;
  }

  function log(tipo, txt) { acts.unshift({ d: new Date(), tipo: tipo, txt: txt }); last = new Date(); renderAll(); save(); }

  function medItem(m, clickable) {
    var li = document.createElement('li');
    var el = document.createElement(clickable ? 'button' : 'div');
    el.className = 'a-med'; if (clickable) el.type = 'button';
    var t = document.createElement('strong'); t.textContent = '💊 ' + m.n; el.appendChild(t);
    var rows = [['Lote: ' + m.lote], ['Stock: ' + m.stock + ' unidades'], ['Vence: ' + fd(m.vence)]];
    alertsFor(m).forEach(function (a) { rows.push(['⚠ ' + a, 'warn']); });
    rows.forEach(function (r) { var s = document.createElement('span'); s.textContent = r[0]; if (r[1]) s.className = r[1]; el.appendChild(s); });
    if (clickable) el.addEventListener('click', function () { openDetail(m); });
    li.appendChild(el); return li;
  }

  function renderMeds() {
    var q = norm($('a-q').value.trim());
    var res = meds.filter(function (m) {
      return (!q || norm(m.n).indexOf(q) > -1 || norm(m.lote).indexOf(q) > -1) && (filtro === 'todos' || alertsFor(m).length);
    });
    $('a-count').textContent = res.length;
    var ul = $('a-list'); ul.innerHTML = '';
    if (!res.length) { var e = document.createElement('li'); e.className = 'a-empty'; e.textContent = 'No hay medicamentos con esa búsqueda. Prueba con otro nombre o lote.'; ul.appendChild(e); }
    res.forEach(function (m) { ul.appendChild(medItem(m, true)); });
    var r = $('a-recent'); r.innerHTML = ''; var seen = {}, n = 0;
    acts.forEach(function (a) {
      if (a.tipo !== 'Consulta' || seen[a.txt] || n >= 3) return; seen[a.txt] = 1; n++;
      var li = document.createElement('li'); li.textContent = '💊 ' + fd(a.d) + ' - ' + a.txt; r.appendChild(li);
    });
    if (!n) { var l = document.createElement('li'); l.textContent = 'Aún no hay consultas.'; r.appendChild(l); }
  }

  function renderAlertas() {
    var ul = $('a-alert-list'); ul.innerHTML = ''; var am = alertMeds();
    if (!am.length) { var e = document.createElement('li'); e.className = 'a-empty'; e.textContent = 'No hay alertas pendientes con los umbrales actuales.'; ul.appendChild(e); }
    am.forEach(function (m) { ul.appendChild(medItem(m, false)); });
    var b = $('a-badge'); b.textContent = am.length; b.hidden = !am.length;
  }

  function renderActs() {
    var ul = $('a-hist'); ul.innerHTML = '';
    var list = acts.filter(function (a) { return filtroAct === 'todas' || a.tipo === filtroAct; });
    if (!list.length) { var e = document.createElement('li'); e.textContent = 'No hay actividades de este tipo todavía.'; ul.appendChild(e); }
    list.slice(0, 40).forEach(function (a) {
      var li = document.createElement('li');
      var tm = document.createElement('time'); tm.textContent = fd(a.d) + ' ' + ft(a.d);
      var b = document.createElement('b'); b.textContent = a.tipo + ': ';
      li.appendChild(tm); li.appendChild(b); li.appendChild(document.createTextNode(a.txt)); ul.appendChild(li);
    });
    var s = $('a-mov-med'), cur = s.value; s.innerHTML = '';
    meds.forEach(function (m) { var o = document.createElement('option'); o.value = m.id; o.textContent = m.n + ' (stock ' + m.stock + ')'; s.appendChild(o); });
    if (cur) s.value = cur;
  }

  function renderPanel() {
    $('a-n-total').textContent = meds.length;
    $('a-n-alerts').textContent = alertMeds().length;
    $('a-n-acts').textContent = acts.length;
    $('a-updated').textContent = ft(last) + ' hs';
    $('a-p-total').textContent = meds.length;
    $('a-p-acts').textContent = acts.length;
    $('a-who').textContent = user || '—';
  }
  function renderAll() { renderPanel(); renderMeds(); renderAlertas(); renderActs(); }

  var toastT;
  function toast(t) { var el = $('a-toast'); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { el.hidden = true; }, 2200); }

  var SCREENS = ['login', 'panel', 'meds', 'perfil', 'alertas', 'actividades'];
  function go(id) {
    SCREENS.forEach(function (s) { $('a-' + s).hidden = s !== id; });
    $('a-nav').hidden = id === 'login';
    document.querySelectorAll('#a-nav button').forEach(function (b) {
      if (b.dataset.go === id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    $('a-view').scrollTop = 0;
    if (id === 'alertas' && user) done('alertas');
    renderAll();
  }

  $('phone').addEventListener('click', function (e) {
    var t = e.target.closest('[data-go]'); if (t) go(t.dataset.go);
  });

  $('a-login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var u = $('a-user').value.trim(), p = $('a-pass').value, m = $('a-login-msg');
    if (!u || !p) { m.className = 'a-msg err'; m.textContent = 'Escribe tu usuario y tu contraseña para continuar.'; return; }
    user = u; m.textContent = ''; $('a-pass').value = '';
    done('login'); log('Acceso', 'Inicio de sesión de ' + u); go('panel');
  });
  $('a-forgot').addEventListener('click', function () {
    var m = $('a-login-msg'); m.className = 'a-msg'; m.textContent = 'Pide a tu administrador que restablezca tu contraseña.';
  });
  $('a-logout').addEventListener('click', function () { log('Acceso', 'Cierre de sesión de ' + user); user = ''; $('a-user').value = ''; go('login'); });

  $('a-b-consultar').addEventListener('click', function () { go('meds'); });
  $('a-b-registrar').addEventListener('click', function () { $('a-r-msg').textContent = ''; $('a-dlg-reg').showModal(); });
  $('a-r-cancel').addEventListener('click', function () { $('a-dlg-reg').close(); });

  $('a-reg-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var n = $('a-r-name').value.trim(), l = $('a-r-lote').value.trim(), s = $('a-r-stock').value, dt = $('a-r-date').value, m = $('a-r-msg');
    if (!n || !l || s === '' || !dt) { m.textContent = 'Completa nombre, lote, stock y vencimiento.'; return; }
    if (parseInt(s, 10) < 0) { m.textContent = 'El stock no puede ser negativo.'; return; }
    if (meds.some(function (x) { return norm(x.lote) === norm(l); })) { m.textContent = 'Ya existe un medicamento con ese lote.'; return; }
    var p = dt.split('-');
    meds.unshift({ id: nextId++, n: n, lote: l, stock: parseInt(s, 10), vence: new Date(+p[0], +p[1] - 1, +p[2], 12) });
    $('a-reg-form').reset(); $('a-dlg-reg').close();
    done('registro'); log('Registro', 'Medicamento registrado: ' + n + ' (lote ' + l + ')'); toast('Medicamento registrado');
  });

  function openDetail(m) {
    sel = m; $('a-d-title').textContent = m.n;
    var b = $('a-d-body'); b.innerHTML = '';
    var rows = ['Lote: ' + m.lote, 'Stock: ' + m.stock + ' unidades', 'Vence: ' + fd(m.vence)].concat(alertsFor(m).map(function (a) { return '⚠ ' + a; }));
    if (rows.length === 3) rows.push('Sin alertas con los umbrales actuales.');
    rows.forEach(function (r) { var p = document.createElement('p'); p.textContent = r; b.appendChild(p); });
    if (m.n.indexOf('Paracetamol') === 0) done('consulta');
    log('Consulta', m.n);
    $('a-dlg-det').showModal();
  }
  $('a-d-close').addEventListener('click', function () { $('a-dlg-det').close(); });
  $('a-d-mov').addEventListener('click', function () {
    $('a-dlg-det').close(); go('actividades'); if (sel) $('a-mov-med').value = sel.id;
  });

  $('a-mov').addEventListener('submit', function (e) {
    e.preventDefault();
    var m = $('a-mov-msg'), id = parseInt($('a-mov-med').value, 10), tipo = $('a-mov-tipo').value, q = parseInt($('a-mov-qty').value, 10);
    var med = meds.filter(function (x) { return x.id === id; })[0];
    m.className = 'a-msg';
    if (!med) { m.textContent = 'Elige un medicamento.'; return; }
    if (!q || q < 1) { m.textContent = 'Escribe una cantidad mayor que cero.'; return; }
    if (tipo === 'salida' && q > med.stock) { m.textContent = 'La salida supera el stock disponible (' + med.stock + ' unidades).'; return; }
    var antes = med.stock <= cfg.stock;
    med.stock += tipo === 'entrada' ? q : -q;
    $('a-mov-qty').value = ''; m.textContent = '';
    log('Movimiento', (tipo === 'entrada' ? 'Entrada' : 'Salida') + ' de ' + q + ' unidades: ' + med.n + ' (stock: ' + med.stock + ')');
    if (!antes && med.stock <= cfg.stock) log('Alerta', 'Stock bajo: ' + med.n + ' (' + med.stock + ' unidades)');
    if (tipo === 'salida') done('salida');
    toast('Actividad registrada');
  });

  $('a-hist-f').addEventListener('change', function () {
    filtroAct = this.value; if (filtroAct === 'Movimiento') done('historial'); renderActs();
  });

  $('a-cfg').addEventListener('submit', function (e) {
    e.preventDefault();
    var s = parseInt($('a-cfg-stock').value, 10), d = parseInt($('a-cfg-dias').value, 10), m = $('a-cfg-msg');
    if (isNaN(s) || isNaN(d) || s < 0 || d < 0) { m.textContent = 'Usa números iguales o mayores que cero.'; return; }
    m.textContent = ''; cfg.stock = s; cfg.dias = d;
    log('Alerta', 'Umbrales actualizados: stock de ' + s + ' o menos, vencimiento en ' + d + ' días o menos'); toast('Alertas actualizadas');
  });

  $('a-q').addEventListener('input', renderMeds);
  $('a-filt-btn').addEventListener('click', function () { var c = $('a-chips'); c.hidden = !c.hidden; this.setAttribute('aria-expanded', String(!c.hidden)); });
  document.querySelectorAll('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      filtro = b.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      renderMeds();
    });
  });

  $('a-reset').addEventListener('click', function () { try { localStorage.removeItem(SAVEKEY); } catch (e) {} init(); renderTasks(); go('login'); toast('Prototipo reiniciado'); });

  init(); renderTasks(); go('login');
})();
