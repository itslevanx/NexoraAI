import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

export function limaDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
function text(value, name, max = 500) {
  const result = String(value ?? '').trim();
  if (!result || result.length > max) throw new Error(`${name}: escribe entre 1 y ${max} caracteres.`);
  return result;
}
export function dueDate(value) {
  const s = String(value || '');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?$/.test(s)) throw new Error('Indica una fecha y hora válidas.');
  const parsed = new Date(/(?:Z|[+-]\d{2}:\d{2})$/.test(s) ? s : `${s}-05:00`);
  if (!Number.isFinite(parsed.getTime())) throw new Error('Fecha inválida.');
  const rawDay = s.slice(0, 10);
  const check = new Date(`${rawDay}T12:00:00Z`);
  if (check.toISOString().slice(0, 10) !== rawDay || Number(s.slice(11, 13)) > 23 || Number(s.slice(14, 16)) > 59) throw new Error('Fecha inválida.');
  return parsed.toISOString();
}
export function createEngine(path = ':memory:', clock = () => new Date()) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY, kind TEXT NOT NULL, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, at TEXT NOT NULL, action TEXT NOT NULL, status TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY, result TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY, text TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, error TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS inbox(id INTEGER PRIMARY KEY, data TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0);`);
  const all = kind => db.prepare('SELECT data FROM records WHERE kind=?').all(kind).map(r => JSON.parse(r.data));
  const save = (kind, item) => { db.prepare('INSERT INTO records VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(item.id, kind, JSON.stringify(item)); return item; };
  const get = (kind, id) => { const item = all(kind).find(x => x.id === id); if (!item) throw new Error('Registro no encontrado.'); return item; };
  const setting = (key, value) => value === undefined ? db.prepare('SELECT value FROM settings WHERE key=?').get(key)?.value : db.prepare('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key, String(value));
  const now = () => clock().toISOString();
  const makeTask = p => save('task', { id: randomUUID(), title: text(p.title, 'Título', 200), course: String(p.course || '').slice(0, 100), owner: String(p.owner || '').slice(0, 100), due: dueDate(p.due), priority: ['alta', 'normal', 'baja'].includes(p.priority) ? p.priority : 'normal', status: 'pending', createdAt: now(), meetingId: p.meetingId || '' });
  const notify = (id, message) => db.prepare('INSERT OR IGNORE INTO outbox(id,text) VALUES(?,?)').run(id, message);
  function agenda(p) {
    if (p.operation === 'create') return { task: makeTask(p) };
    if (p.operation === 'complete') { const t = get('task', p.id); db.prepare("DELETE FROM outbox WHERE status='pending' AND id LIKE ?").run(`task:${t.id}:%`); return { task: save('task', { ...t, status: 'done', completedAt: t.completedAt || now() }) }; }
    if (p.operation === 'meeting') {
      const title = text(p.title, 'Título', 200);
      const tasks = p.tasks || [];
      if (!Array.isArray(tasks) || tasks.length > 30) throw new Error('Máximo 30 acuerdos.');
      for (const task of tasks) { text(task.title, 'Acuerdo', 200); text(task.owner, 'Responsable', 100); dueDate(task.due); }
      const meeting = save('meeting', { id: randomUUID(), title, notes: text(p.notes || title, 'Notas', 10000), createdAt: now() });
      return { meeting, tasks: tasks.map(t => makeTask({ ...t, meetingId: meeting.id })) };
    }
    if (p.operation === 'tick') {
      for (const t of all('task').filter(t => t.status === 'pending')) {
        const hours = (Date.parse(t.due) - clock()) / 3600000;
        if (hours <= 24) notify(`task:${t.id}:${limaDay(clock())}`, `${hours < 0 ? 'Vencida' : 'Próxima entrega'}: ${t.title} · ${new Date(t.due).toLocaleString('es-PE', { timeZone: 'America/Lima' })}`);
      }
      for (const s of all('session').filter(s => s.status === 'pending' && s.at <= now())) notify(`session:${s.id}:${s.at}`, `Sesión de estudio pendiente: ${s.topic} · ${s.minutes} min. /estudio para consultar.`);
    } else if (p.operation && p.operation !== 'list') throw new Error('Operación de agenda no válida.');
    return { tasks: all('task').sort((a,b) => a.due.localeCompare(b.due)), meetings: all('meeting') };
  }
  function study(p) {
    if (p.operation === 'create') {
      const topic = text(p.topic, 'Tema', 200);
      const exam = dueDate(p.exam);
      const minutes = Number(p.minutes);
      const dailyTime = p.dailyTime || '18:00';
      if (!Number.isInteger(minutes) || minutes < 20 || minutes > 120) throw new Error('Elige entre 20 y 120 minutos diarios.');
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(dailyTime)) throw new Error('Hora de estudio inválida.');
      if (Date.parse(exam) <= clock()) throw new Error('El examen debe ser futuro.');
      const dates = [];
      for (let day = new Date(`${limaDay(clock())}T12:00:00Z`), i = 0; i < 365; i++, day.setUTCDate(day.getUTCDate()+1)) {
        const at = dueDate(`${day.toISOString().slice(0,10)}T${dailyTime}`);
        if (at >= exam) break;
        if (at > now() && Date.parse(at)+minutes*60000 <= Date.parse(exam) && !all('session').some(s => s.status === 'pending' && Date.parse(s.at) < Date.parse(at)+minutes*60000 && Date.parse(s.at)+s.minutes*60000 > Date.parse(at))) dates.push(at);
      }
      if (!dates.length) throw new Error('No hay espacio antes del examen a la hora elegida.');
      if (Date.parse(exam) - clock() > 365 * 86400000) throw new Error('Planifica hasta un año por adelantado.');
      const plan = save('plan', { id: randomUUID(), topic, exam, minutes, dailyTime, createdAt: now() });
      const sessions = dates.map((at, i) => save('session', { id: randomUUID(), planId: plan.id, topic, at, minutes, phase: i === dates.length-1 ? 'Autoevaluación' : i % 3 === 2 ? 'Repaso' : 'Estudio y práctica', status: 'pending' }));
      return { plan, sessions };
    }
    if (['complete','reschedule'].includes(p.operation)) {
      const s = get('session', p.id), plan = get('plan', s.planId);
      if (p.operation === 'complete') { db.prepare("DELETE FROM outbox WHERE status='pending' AND id LIKE ?").run(`session:${s.id}:%`); return { session: save('session', { ...s, status:'done', completedAt: s.completedAt || now() }) }; }
      if (s.status === 'done') throw new Error('La sesión ya está completada.');
      const at = dueDate(p.at);
      if (at <= now() || at >= plan.exam) throw new Error('Elige un horario futuro anterior al examen.');
      const end = Date.parse(at) + s.minutes * 60000;
      if (end > Date.parse(plan.exam)) throw new Error('La sesión debe terminar antes del examen.');
      if (all('session').some(x => x.id !== s.id && x.status === 'pending' && Date.parse(x.at) < end && Date.parse(x.at)+x.minutes*60000 > Date.parse(at))) throw new Error('Ese horario se cruza con otra sesión.');
      db.prepare("DELETE FROM outbox WHERE status='pending' AND id LIKE ?").run(`session:${s.id}:%`);
      return { session: save('session', { ...s, at }) };
    }
    if (p.operation && p.operation !== 'list') throw new Error('Operación de estudio no válida.');
    return { plans: all('plan'), sessions: all('session').sort((a,b) => a.at.localeCompare(b.at)) };
  }
  function report(period = 'daily') {
    const days = period === 'weekly' ? 7 : 1;
    const start = new Date(clock().getTime() - days*86400000).toISOString();
    const tasks = all('task'), sessions = all('session');
    return { generatedAt: now(), period, pendingTasks: tasks.filter(t => t.status === 'pending'), overdueTasks: tasks.filter(t => t.status === 'pending' && t.due < now()), completedTasks: tasks.filter(t => t.completedAt >= start).length, completedSessions: sessions.filter(s => s.completedAt >= start).length, upcomingSessions: sessions.filter(s => s.status === 'pending').slice(0, 20) };
  }
  function reports(p) {
    if (p.operation === 'export') return { snapshot: reportSnapshot(p.period) };
    if (p.operation === 'tick') {
      const day = limaDay(clock());
      const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Lima', hour:'2-digit', hourCycle:'h23' }).format(clock()));
      const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
      // On restart, deliver today's report once after its scheduled time, never a backlog of stale days.
      for (const period of hour >= 8 ? ['daily', ...(weekday === 0 && hour >= 18 ? ['weekly'] : [])] : []) {
        const id = `report:${period}:${day}`;
        if (!all('report').some(r => r.id === id)) {
          const result = save('report', { id, ...report(period) });
          notify(id, `${period === 'weekly' ? 'Reporte semanal' : 'Agenda diaria'}: ${result.pendingTasks.length} tareas pendientes, ${result.overdueTasks.length} vencidas, ${result.completedTasks} completadas y ${result.completedSessions} sesiones realizadas.`);
        }
      }
    } else if (p.operation && p.operation !== 'generate') throw new Error('Operación de reporte no válida.');
    return { report: report(p.period === 'weekly' ? 'weekly' : 'daily'), history: all('report').slice(-14) };
  }
  function reportSnapshot(period = 'weekly') {
    if (!['daily', 'weekly', 'all'].includes(period)) throw new Error('Elige un período válido para el reporte.');
    const generatedAt = now();
    const start = period === 'all' ? null : new Date(Date.parse(generatedAt) - (period === 'daily' ? 1 : 7) * 86400000).toISOString();
    const inPeriod = at => Boolean(at && (!start || at >= start) && at <= generatedAt);
    const tasks = all('task'), sessions = all('session'), plans = all('plan'), meetings = all('meeting');
    // Current pending work is always included; the period applies to creation and completion activity.
    const selectedTasks = tasks.filter(t => t.status === 'pending' || inPeriod(t.completedAt) || inPeriod(t.createdAt)).sort((a,b) => a.due.localeCompare(b.due));
    const selectedSessions = sessions.filter(s => s.status === 'pending' || inPeriod(s.completedAt)).sort((a,b) => a.at.localeCompare(b.at));
    const completedTasks = tasks.filter(t => t.status === 'done' && inPeriod(t.completedAt));
    const completedSessions = sessions.filter(s => s.status === 'done' && inPeriod(s.completedAt));
    return {
      version: 1, generatedAt, period, start, timeZone: 'America/Lima',
      summary: {
        totalTasks: tasks.length, pendingTasks: tasks.filter(t => t.status === 'pending').length,
        overdueTasks: tasks.filter(t => t.status === 'pending' && t.due < generatedAt).length,
        createdTasks: tasks.filter(t => inPeriod(t.createdAt)).length, completedTasks: completedTasks.length,
        pendingAgreements: tasks.filter(t => t.meetingId && t.status === 'pending').length,
        completedAgreements: completedTasks.filter(t => t.meetingId).length,
        totalSessions: sessions.length, pendingSessions: sessions.filter(s => s.status === 'pending').length,
        dueSessions: sessions.filter(s => s.status === 'pending' && s.at <= generatedAt).length,
        completedSessions: completedSessions.length,
        completedMinutes: completedSessions.reduce((sum,s) => sum + s.minutes, 0),
        createdPlans: plans.filter(p => inPeriod(p.createdAt)).length,
        createdMeetings: meetings.filter(m => inPeriod(m.createdAt)).length
      },
      tasks: selectedTasks,
      sessions: selectedSessions,
      plans: plans.filter(p => inPeriod(p.createdAt) || selectedSessions.some(s => s.planId === p.id)),
      meetings: meetings.filter(m => inPeriod(m.createdAt) || selectedTasks.some(t => t.meetingId === m.id))
    };
  }
  function bot(kind, p) {
    const input = String(p.text || '').trim();
    const [command, ...rest] = input.split(/\s+/), arg = rest.join(' ');
    let reply;
    if (kind === 'tasks') {
      if (command === '/agregar') { const [title, due, course] = arg.split('|').map(x=>x.trim()); const t = makeTask({ title, due, course }); reply = `Tarea guardada: ${t.title}\nID: ${t.id}`; }
      else if (command === '/hecho') { agenda({ operation:'complete', id:arg }); reply = 'Tarea completada.'; }
      else { const items = all('task').filter(t => t.status === 'pending' && (command !== '/hoy' || limaDay(new Date(t.due)) <= limaDay(clock()))); reply = items.length ? items.map(t=>`${t.title} · ${t.due.slice(0,10)}\nID: ${t.id}`).join('\n\n') : 'No tienes tareas pendientes en esta consulta.'; }
    } else if (kind === 'study') {
      if (command === '/estudiado') { study({ operation:'complete', id:arg }); reply = 'Sesión completada.'; }
      else if (command === '/reprogramar') { const [id, at] = arg.split('|').map(x=>x.trim()); study({ operation:'reschedule', id, at }); reply = 'Sesión reprogramada.'; }
      else { const sessions = all('session').filter(s=>s.status==='pending').sort((a,b)=>a.at.localeCompare(b.at)).slice(0,10); reply = sessions.length ? sessions.map(s=>`${s.topic} · ${new Date(s.at).toLocaleString('es-PE',{timeZone:'America/Lima'})} · ${s.minutes} min\nID: ${s.id}`).join('\n\n') : 'Crea tu plan de estudio desde NEXORA.'; }
    } else if (kind === 'meetings') {
      if (command === '/acuerdo') { const [meetingTitle, owner, due, title] = arg.split('|').map(x=>x.trim()); agenda({ operation:'meeting', title:meetingTitle, notes: title, tasks:[{ owner, due, title }] }); reply = 'Acuerdo y responsable registrados.'; }
      else if (command === '/acuerdohecho') { const task = get('task',arg); if (!task.meetingId) throw new Error('Ese pendiente no pertenece a una reunión.'); agenda({ operation:'complete', id:arg }); reply = 'Acuerdo completado.'; }
      else { const tasks = all('task').filter(t=>t.meetingId && t.status==='pending'); reply = tasks.length ? tasks.map(t=>`${t.owner}: ${t.title}\nID: ${t.id}`).join('\n\n') : 'No hay acuerdos pendientes.'; }
    } else throw new Error('Bot no válido.');
    notify(`reply:${p.updateId}`, reply.slice(0,3900));
    return { reply };
  }
  function run(kind, p = {}) {
    const requestId = p.requestId;
    if (requestId && (typeof requestId !== 'string' || requestId.length > 200)) throw new Error('Identificador de solicitud inválido.');
    const key = requestId ? `${kind}:${requestId}` : '';
    if (key) { const prior = db.prepare('SELECT result FROM requests WHERE id=?').get(key); if (prior) return JSON.parse(prior.result); }
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = { ok:true, ...(kind === 'agenda' ? agenda(p) : kind === 'study' ? study(p) : kind === 'reports' ? reports(p) : bot(kind.replace('bot-',''),p)) };
      if (key) db.prepare('INSERT INTO requests VALUES(?,?)').run(key, JSON.stringify(result));
      db.prepare('INSERT INTO events(at,action,status) VALUES(?,?,?)').run(now(), `${kind}:${p.operation || 'list'}`, 'ok');
      db.exec('COMMIT');
      return result;
    } catch (e) { db.exec('ROLLBACK'); db.prepare('INSERT INTO events(at,action,status) VALUES(?,?,?)').run(now(), kind, 'error'); throw e; }
  }
  return { db, run, setting, notify, all, close:()=>db.close(), status:()=>({ events:db.prepare('SELECT * FROM events ORDER BY id DESC LIMIT 20').all(), pendingNotifications:db.prepare("SELECT count(*) AS n FROM outbox WHERE status='pending'").get().n }) };
}
