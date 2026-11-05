const periods = { daily: 'Últimas 24 horas', weekly: 'Últimos 7 días', all: 'Todo el historial' };
const formatDate = value => value ? new Date(value).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' }) : '—';
const dateCell = value => value ? new Date(Date.parse(value) - 5 * 3600000) : null;
const state = (item, at, generated) => item.status === 'done' ? 'Completada' : at <= generated ? 'Pendiente vencida' : 'Pendiente';
const metrics = [
  ['pendingTasks', 'Tareas y acuerdos pendientes actuales'], ['overdueTasks', 'De ellos, vencidos'],
  ['createdTasks', 'Tareas y acuerdos creados en el período'], ['completedTasks', 'Tareas y acuerdos completados en el período'],
  ['pendingAgreements', 'Acuerdos pendientes (incluidos en tareas)'], ['completedAgreements', 'Acuerdos completados (incluidos en tareas)'],
  ['pendingSessions', 'Sesiones pendientes actuales'], ['dueSessions', 'De ellas, con horario vencido'],
  ['completedSessions', 'Sesiones completadas en el período'], ['completedMinutes', 'Minutos de estudio completados en el período'],
  ['createdPlans', 'Planes creados en el período'], ['createdMeetings', 'Reuniones creadas en el período']
];

export async function exportAutomationReport(snapshot, format) {
  if (!snapshot || snapshot.version !== 1 || !periods[snapshot.period] || !['pdf', 'xlsx'].includes(format)) throw new Error('Reporte inválido.');
  const buffer = format === 'pdf' ? await pdf(snapshot) : await excel(snapshot);
  return { buffer, filename: `NEXORA-automatizaciones-${snapshot.period}-${snapshot.generatedAt.replace(/[:.]/g, '-')}.${format}`,
    contentType: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
}

async function excel(s) {
  const { default: ExcelJS } = await import('exceljs');
  const book = new ExcelJS.Workbook();
  book.creator = 'NEXORA'; book.created = new Date(s.generatedAt);
  function sheet(name, columns, rows) {
    const ws = book.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = columns.map(([header, width, isDate]) => ({ header, width, style: isDate ? { numFmt: 'dd/mm/yyyy hh:mm' } : {} }));
    for (const values of rows) ws.addRow(values);
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF172D47' } };
    ws.getRow(1).height = 30;
    ws.eachRow(row => { row.alignment = { vertical: 'top', wrapText: true }; });
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, ws.rowCount), column: columns.length } };
    ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    return ws;
  }
  sheet('Resumen', [['Indicador', 60], ['Valor', 48]], [
    ['Reporte de automatizaciones', 'NEXORA'], ['Período', periods[s.period]], ['Generado · hora de Lima', dateCell(s.generatedAt)],
    ['Inicio del período · Lima', dateCell(s.start)], ['Alcance', 'Actividad del período y todos los pendientes actuales.'],
    ['Fechas', 'Todas las fechas están expresadas en hora de Lima (UTC−5).'],
    ...metrics.map(([key, title]) => [title, s.summary[key]])
  ]).getColumn(2).eachCell(cell => { if (cell.value instanceof Date) cell.numFmt = 'dd/mm/yyyy hh:mm'; });
  const meetingNames = new Map(s.meetings.map(m => [m.id, m.title]));
  sheet('Tareas y acuerdos', [['ID', 38], ['Tipo', 16], ['Tarea', 48], ['Estado actual', 24], ['Curso', 24], ['Responsable', 24], ['Prioridad', 14], ['Entrega · Lima', 22, true], ['Creada · Lima', 22, true], ['Completada · Lima', 22, true], ['Reunión', 40]],
    s.tasks.map(t => [t.id, t.meetingId ? 'Acuerdo' : 'Tarea', t.title, state(t, t.due, s.generatedAt), t.course, t.owner, t.priority, dateCell(t.due), dateCell(t.createdAt), dateCell(t.completedAt), meetingNames.get(t.meetingId) || '']));
  sheet('Sesiones', [['ID', 38], ['Plan ID', 38], ['Tema', 48], ['Fase', 28], ['Estado actual', 24], ['Programada · Lima', 22, true], ['Minutos', 14], ['Completada · Lima', 22, true]],
    s.sessions.map(x => [x.id, x.planId, x.topic, x.phase, state(x, x.at, s.generatedAt), dateCell(x.at), x.minutes, dateCell(x.completedAt)]));
  sheet('Planes', [['ID', 38], ['Tema', 48], ['Examen · Lima', 22, true], ['Minutos por sesión', 20], ['Hora diaria · Lima', 20], ['Creado · Lima', 22, true]],
    s.plans.map(p => [p.id, p.topic, dateCell(p.exam), p.minutes, p.dailyTime, dateCell(p.createdAt)]));
  sheet('Reuniones', [['ID', 38], ['Reunión', 48], ['Notas', 80], ['Creada · Lima', 22, true]],
    s.meetings.map(m => [m.id, m.title, m.notes, dateCell(m.createdAt)]));
  return Buffer.from(await book.xlsx.writeBuffer());
}

async function pdf(s) {
  const { default: PDFDocument } = await import('pdfkit');
  const doc = new PDFDocument({ size: 'A4', margin: 48, bufferPages: true, info: { Title: 'NEXORA · Reporte de automatizaciones', Author: 'NEXORA' } });
  const chunks = [];
  const complete = new Promise((resolve, reject) => { doc.on('data', chunk => chunks.push(chunk)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject); });
  const text = (value, size = 10, bold = false) => { doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size).fillColor('#172d47').text(String(value), { lineGap: 3 }); };
  const section = title => { doc.addPage(); text(title, 20, true); doc.moveDown(); };
  const item = (title, lines) => {
    if (doc.y > doc.page.height - 140) doc.addPage();
    text(title, 12, true);
    for (const line of lines.filter(Boolean)) text(line);
    doc.moveDown();
  };
  text('NEXORA', 12, true); doc.moveDown(); text('Reporte de automatizaciones', 26, true); doc.moveDown();
  text(periods[s.period], 16, true); text(`Generado: ${formatDate(s.generatedAt)} · Lima`);
  if (s.start) text(`Actividad desde: ${formatDate(s.start)}`);
  text('Incluye la actividad del período y todos los pendientes actuales. Los planes y reuniones relacionados se incluyen como contexto. Todas las fechas corresponden a Lima (UTC-5).');
  doc.moveDown(); text('Resumen', 18, true); doc.moveDown(0.5);
  for (const [key, label] of metrics) text(`${label}: ${s.summary[key]}`);
  const names = new Map(s.meetings.map(m => [m.id, m.title]));
  section('Tareas y acuerdos');
  if (!s.tasks.length) text('Sin tareas ni acuerdos para este reporte.');
  for (const t of s.tasks) item(t.title, [
    `${t.meetingId ? 'Acuerdo' : 'Tarea'} · ${state(t, t.due, s.generatedAt)} · Prioridad ${t.priority}`,
    t.course && `Curso o proyecto: ${t.course}`, t.owner && `Responsable: ${t.owner}`,
    `Entrega: ${formatDate(t.due)} · Creada: ${formatDate(t.createdAt)}`, t.completedAt && `Completada: ${formatDate(t.completedAt)}`,
    t.meetingId && `Reunión: ${names.get(t.meetingId) || t.meetingId}`, `ID: ${t.id}`
  ]);
  section('Sesiones de estudio');
  if (!s.sessions.length) text('Sin sesiones para este reporte.');
  for (const x of s.sessions) item(x.topic, [`${x.phase} · ${state(x, x.at, s.generatedAt)} · ${x.minutes} minutos`, `Programada: ${formatDate(x.at)}`, x.completedAt && `Completada: ${formatDate(x.completedAt)}`, `ID: ${x.id} · Plan: ${x.planId}`]);
  section('Planes de estudio');
  if (!s.plans.length) text('Sin planes para este reporte.');
  for (const p of s.plans) item(p.topic, [`Examen: ${formatDate(p.exam)} · ${p.minutes} minutos por sesión`, `Hora diaria: ${p.dailyTime} · Creado: ${formatDate(p.createdAt)}`, `ID: ${p.id}`]);
  section('Reuniones');
  if (!s.meetings.length) text('Sin reuniones para este reporte.');
  for (const m of s.meetings) item(m.title, [`Creada: ${formatDate(m.createdAt)}`, m.notes, `ID: ${m.id}`]);
  const range = doc.bufferedPageRange();
  for (let page = range.start; page < range.start + range.count; page++) {
    doc.switchToPage(page);
    const bottom = doc.page.margins.bottom; doc.page.margins.bottom = 0;
    doc.font('Helvetica').fontSize(8).fillColor('#66758a').text(`NEXORA · Automatizaciones     |     ${page + 1} / ${range.count}`, 48, doc.page.height - 30, { lineBreak: false });
    doc.page.margins.bottom = bottom;
  }
  doc.end();
  return complete;
}
