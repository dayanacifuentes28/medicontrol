(function () {
  var $ = function (id) { return document.getElementById(id); };
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function fd(d) { return two(d.getDate()) + '/' + two(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function ft(d) { return two(d.getHours()) + ':' + two(d.getMinutes()); }
  function toISO(d) { return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()); }
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

  var SAVEKEY = 'medicontrol.v2';
  var SURVKEY = 'medicontrol.encuestas.v1';

  var meds, acts, cfg, kardex, filtro, tasks, user, last, sel, nextId, nextKid, filtroAct, editId;

  function save() {
    try { localStorage.setItem(SAVEKEY, JSON.stringify({ meds: meds, acts: acts, cfg: cfg, kardex: kardex, nextId: nextId, nextKid: nextKid, last: last })); }
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
      cfg = s.cfg;
      meds.forEach(function (m) { if (!m.cat) m.cat = 'Otros'; if (!m.lab) m.lab = '—'; if (m.invima === undefined) m.invima = ''; });
      if (Array.isArray(s.kardex) && s.kardex.length) {
        kardex = s.kardex.map(function (k) { if (k.fecha) k.fecha = new Date(k.fecha); return k; });
      } else {
        kardex = meds.map(function (m, i) { return { id: i + 1, medId: m.id, fecha: ago(i, 9, 15), concepto: 'Inventario inicial', entrada: m.stock, salida: 0, saldo: m.stock }; });
      }
      nextId = s.nextId || (meds.length + 1);
      nextKid = s.nextKid || (kardex.length + 1);
      last = s.last ? new Date(s.last) : new Date();
      return true;
    } catch (e) { return false; }
  }
  function kardexSeed() {
    kardex = meds.map(function (m, i) { return { id: i + 1, medId: m.id, fecha: ago(i, 9, 15), concepto: 'Inventario inicial', entrada: m.stock, salida: 0, saldo: m.stock }; });
    nextKid = kardex.length + 1;
  }
  function addKardex(med, concepto, entrada, salida, saldo) {
    kardex.unshift({ id: nextKid++, medId: med.id, fecha: new Date(), concepto: concepto, entrada: entrada, salida: salida, saldo: saldo });
  }

  function surveys() {
    var raw;
    try { raw = localStorage.getItem(SURVKEY); } catch (e) { return []; }
    try { var a = JSON.parse(raw); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function saveSurveys(list) { try { localStorage.setItem(SURVKEY, JSON.stringify(list)); } catch (e) {} }
  function renderSurveyCount() {
    var s = surveys();
    $('a-s-count').textContent = s.length;
    $('a-s-info').hidden = s.length === 0;
  }

  function init() {
    meds = [
      ['Paracetamol 500 mg', 'Analgésico', 'Genfar', '2021M-0004982', 'L24201', 120, 270],
      ['Amoxicilina 500 mg', 'Antibiótico', 'Procaps', '2019M-0012307', 'L24115', 12, 210],
      ['Ibuprofeno 400 mg', 'Antiinflamatorio', 'Genéricos', '2020M-0007755', 'L24207', 250, 430],
      ['Omeprazol 20 mg', 'Gastroprotector', 'Ecar', '2018M-0006143', 'L24310', 96, 510],
      ['Loratadina 10 mg', 'Antihistamínico', 'Tecnoquímicas', '2019M-0010521', 'L24312', 58, 330],
      ['Metformina 850 mg', 'Antidiabético', 'MK', '2017M-0008872', 'L24320', 140, 480],
      ['Losartán 50 mg', 'Antihipertensivo', 'Procaps', '2020M-0006439', 'L24325', 88, 590],
      ['Salbutamol 100 mcg (inhalador)', 'Broncodilatador', 'GSK', '2016M-0004417', 'L24330', 8, 40],
      ['Diclofenaco 50 mg', 'Antiinflamatorio', 'Genfar', '2018M-0002299', 'L24335', 75, 370],
      ['Azitromicina 500 mg', 'Antibiótico', 'Labiofarma', '2021M-0011895', 'L24340', 42, 560],
      ['Atorvastatina 20 mg', 'Hipolipemiante', 'Pfizer', '2017M-0009351', 'L24345', 110, 650],
      ['Cetirizina 10 mg', 'Antihistamínico', 'MK', '2019M-0007630', 'L24350', 60, 305]
    ].map(function (r, i) { return { id: i + 1, n: r[0], cat: r[1], lab: r[2], invima: r[3], lote: r[4], stock: r[5], vence: addDays(r[6]) }; });
    nextId = meds.length + 1;
    acts = [
      { d: ago(1, 16, 40), tipo: 'Consulta', txt: 'Paracetamol 500 mg' },
      { d: ago(1, 16, 32), tipo: 'Consulta', txt: 'Amoxicilina 500 mg' },
      { d: ago(2, 9, 15), tipo: 'Registro', txt: 'Medicamento registrado: Cetirizina 10 mg (lote L24350)' }
    ];
    cfg = { stock: 20, dias: 90 };
    filtro = 'todos'; filtroAct = 'todas'; user = ''; last = new Date(); sel = null; editId = null;
    tasks = {};
    if (!loadState()) { kardexSeed(); save(); }
    renderSurveyCount();
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
    $('a-survey-btn').hidden = n < TASKS.length;
    renderSurveyCount();
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

  function renderCharts() {
    var box = $('a-charts'); box.innerHTML = '';
    var st = meds.filter(function (m) { return m.stock <= cfg.stock; }).slice().sort(function (a, b) { return a.stock - b.stock; }).slice(0, 5);
    var vc = meds.filter(function (m) { var d = daysTo(m.vence); return d >= 0 && d <= cfg.dias; }).slice().sort(function (a, b) { return daysTo(a.vence) - daysTo(b.vence); }).slice(0, 5);
    function bar(name, val, p, cls) {
      return '<div class="a-bar"><div class="lbl"><span>' + name + '</span><small>' + val + '</small></div><div class="track"><div class="fill ' + cls + '" style="width:' + p + '%"></div></div></div>';
    }
    var html = '<div class="a-chart"><h4>Stock bajo</h4>';
    if (!st.length) html += '<p class="none">Sin stock bajo.</p>';
    var baseStock = cfg.stock > 0 ? cfg.stock : 1;
    st.forEach(function (m) { html += bar(m.n, m.stock + ' u', Math.max(3, Math.min(100, Math.round(m.stock / baseStock * 100))), 'warn'); });
    html += '</div><div class="a-chart"><h4>Próximos vencimientos</h4>';
    if (!vc.length) html += '<p class="none">Sin vencimientos próximos.</p>';
    var baseDias = cfg.dias > 0 ? cfg.dias : 1;
    vc.forEach(function (m) { var d = daysTo(m.vence); html += bar(m.n, 'en ' + d + ' días', Math.max(3, Math.min(100, Math.round(d / baseDias * 100))), 'mint'); });
    html += '</div>';
    box.innerHTML = html;
  }

  function renderPanel() {
    $('a-n-total').textContent = meds.length;
    $('a-n-alerts').textContent = alertMeds().length;
    $('a-n-acts').textContent = acts.length;
    $('a-updated').textContent = ft(last) + ' hs';
    var eu = document.getElementById('a-exit-user'); if (eu) eu.textContent = user || 'Salir';
    $('a-p-total').textContent = meds.length;
    $('a-p-acts').textContent = acts.length;
    $('a-who').textContent = user || '—';
    renderCharts();
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
  function logout() { log('Acceso', 'Cierre de sesión de ' + user); user = ''; $('a-user').value = ''; go('login'); }
  $('a-logout').addEventListener('click', logout);
  var exitBtn = document.getElementById('a-exit');
  if (exitBtn) exitBtn.addEventListener('click', function () { logout(); });

  $('a-b-consultar').addEventListener('click', function () { go('meds'); });
  $('a-b-registrar').addEventListener('click', function () { openReg(null); });

  function openReg(m) {
    editId = m ? m.id : null;
    $('a-r-msg').textContent = '';
    if (m) {
      $('a-r-title').textContent = 'Editar medicamento';
      $('a-r-name').value = m.n; $('a-r-cat').value = m.cat || 'Otros'; $('a-r-lab').value = m.lab || ''; $('a-r-invima').value = m.invima || '';
      $('a-r-lote').value = m.lote; $('a-r-stock').value = m.stock; $('a-r-date').value = toISO(m.vence);
    } else {
      $('a-reg-form').reset(); $('a-r-title').textContent = 'Registrar medicamento';
    }
    $('a-dlg-reg').showModal();
  }
  $('a-r-cancel').addEventListener('click', function () { $('a-r-msg').textContent = ''; $('a-dlg-reg').close(); });

  $('a-reg-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var n = $('a-r-name').value.trim(), cat = $('a-r-cat').value, lab = $('a-r-lab').value.trim(), invima = $('a-r-invima').value.trim();
    var l = $('a-r-lote').value.trim(), s = $('a-r-stock').value, dt = $('a-r-date').value, m = $('a-r-msg');
    if (!n || !l || s === '' || !dt) { m.textContent = 'Completa nombre, lote, stock y vencimiento.'; return; }
    if (parseInt(s, 10) < 0) { m.textContent = 'El stock no puede ser negativo.'; return; }
    if (meds.some(function (x) { return norm(x.lote) === norm(l) && x.id !== editId; })) { m.textContent = 'Ya existe un medicamento con ese lote.'; return; }
    var p = dt.split('-');
    var venceDate = new Date(+p[0], +p[1] - 1, +p[2], 12);
    if (editId != null) {
      var med = meds.filter(function (x) { return x.id === editId; })[0];
      if (!med) { m.textContent = 'No se encontró el medicamento.'; return; }
      var oldStock = med.stock, newStock = parseInt(s, 10);
      med.n = n; med.cat = cat; med.lab = lab; med.invima = invima; med.lote = l; med.stock = newStock; med.vence = venceDate;
      if (newStock !== oldStock) {
        addKardex(med, 'Ajuste de inventario', newStock > oldStock ? newStock - oldStock : 0, newStock < oldStock ? oldStock - newStock : 0, newStock);
      }
      editId = null;
      $('a-reg-form').reset(); $('a-dlg-reg').close();
      log('Actualización', 'Datos actualizados: ' + n + ' (lote ' + l + ')'); toast('Medicamento actualizado');
    } else {
      var id = nextId++;
      var nuevo = { id: id, n: n, cat: cat, lab: lab, invima: invima, lote: l, stock: parseInt(s, 10), vence: venceDate };
      meds.unshift(nuevo);
      addKardex(nuevo, 'Registro', nuevo.stock, 0, nuevo.stock);
      $('a-reg-form').reset(); $('a-dlg-reg').close();
      done('registro'); log('Registro', 'Medicamento registrado: ' + n + ' (lote ' + l + ')'); toast('Medicamento registrado');
    }
  });

  function openDetail(m) {
    sel = m; $('a-d-title').textContent = m.n;
    var b = $('a-d-body'); b.innerHTML = '';
    var rows = [
      'Categoría: ' + m.cat, 'Laboratorio: ' + m.lab, 'Registro INVIMA: ' + (m.invima || '—'),
      'Lote: ' + m.lote, 'Stock: ' + m.stock + ' unidades', 'Vence: ' + fd(m.vence)
    ].concat(alertsFor(m).map(function (a) { return '⚠ ' + a; }));
    if (rows.length === 6) rows.push('Sin alertas con los umbrales actuales.');
    rows.forEach(function (r) { var p = document.createElement('p'); p.textContent = r; b.appendChild(p); });
    var kl = $('a-kardex'); kl.innerHTML = '';
    var ks = kardex.filter(function (k) { return k.medId === m.id; });
    if (!ks.length) { var e = document.createElement('li'); e.textContent = 'Sin movimientos registrados.'; kl.appendChild(e); }
    ks.forEach(function (k) {
      var li = document.createElement('li');
      var tm = document.createElement('time'); tm.textContent = fd(k.fecha) + ' ' + ft(k.fecha);
      var c = document.createElement('span');
      c.textContent = k.concepto + ' — Entrada: ' + k.entrada + ', Salida: ' + k.salida;
      var sal = document.createElement('span'); sal.className = 'saldo' + (k.saldo <= cfg.stock ? '' : ' ok'); sal.textContent = 'Saldo: ' + k.saldo + ' unidades';
      li.appendChild(tm); li.appendChild(c); li.appendChild(sal); kl.appendChild(li);
    });
    if (m.n.indexOf('Paracetamol') === 0) done('consulta');
    log('Consulta', m.n);
    $('a-dlg-det').showModal();
  }
  $('a-d-close').addEventListener('click', function () { $('a-dlg-det').close(); });
  $('a-d-edit').addEventListener('click', function () { $('a-dlg-det').close(); if (sel) openReg(sel); });
  $('a-d-del').addEventListener('click', function () {
    if (!sel) return;
    if (!confirm('¿Eliminar ' + sel.n + ' del inventario?')) return;
    kardex = kardex.filter(function (k) { return k.medId !== sel.id; });
    meds = meds.filter(function (x) { return x.id !== sel.id; });
    log('Eliminación', 'Medicamento eliminado: ' + sel.n);
    sel = null; $('a-dlg-det').close();
    toast('Medicamento eliminado');
  });
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
    addKardex(med, tipo === 'entrada' ? 'Entrada de stock' : 'Salida de stock', tipo === 'entrada' ? q : 0, tipo === 'entrada' ? 0 : q, med.stock);
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

  function exportCsv() {
    if (!meds.length) { toast('No hay medicamentos para exportar'); return; }
    function esc(v) { var t = String(v == null ? '' : v); if (/[";\n]/.test(t)) t = '"' + t.replace(/"/g, '""') + '"'; return t; }
    var lines = [[esc('Nombre'), esc('Categoría'), esc('Laboratorio'), esc('Registro INVIMA'), esc('Lote'), esc('Stock'), esc('Vencimiento'), esc('Alertas')].join(';')];
    meds.forEach(function (m) {
      lines.push([esc(m.n), esc(m.cat), esc(m.lab), esc(m.invima), esc(m.lote), esc(m.stock), esc(fd(m.vence)), esc(alertsFor(m).join('; '))].join(';'));
    });
    var blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = 'inventario-medicontrol.csv';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast('Inventario exportado');
  }
  $('a-export').addEventListener('click', exportCsv);

  $('a-q').addEventListener('input', renderMeds);
  $('a-filt-btn').addEventListener('click', function () { var c = $('a-chips'); c.hidden = !c.hidden; this.setAttribute('aria-expanded', String(!c.hidden)); });
  document.querySelectorAll('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      filtro = b.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      renderMeds();
    });
  });

  $('a-survey-btn').addEventListener('click', function () {
    $('a-s-ease').value = '3'; $('a-s-und').value = '3'; $('a-s-sat').value = '3';
    $('a-s-time').value = '1 a 3 minutos'; $('a-s-notes').value = ''; $('a-s-msg').textContent = '';
    $('a-dlg-survey').showModal();
  });
  $('a-s-cancel').addEventListener('click', function () { $('a-dlg-survey').close(); });
  $('a-survey-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var list = surveys();
    list.push({ fecha: new Date().toISOString(), facilidad: $('a-s-ease').value, comprension: $('a-s-und').value, satisfaccion: $('a-s-sat').value, tiempo: $('a-s-time').value, notas: $('a-s-notes').value.trim() });
    saveSurveys(list); renderSurveyCount();
    $('a-s-msg').textContent = 'Encuesta guardada. ¡Gracias por tu retroalimentación!';
    setTimeout(function () { $('a-s-msg').textContent = ''; $('a-dlg-survey').close(); }, 1100);
  });

  $('a-reset').addEventListener('click', function () {
    try { localStorage.removeItem(SAVEKEY); } catch (e) {}
    init(); renderTasks(); go('login'); toast('Prototipo reiniciado');
  });

  init(); renderTasks(); go('login');
})();