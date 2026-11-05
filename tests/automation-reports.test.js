import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { createEngine } from '../local-automation/engine.mjs';
import { exportAutomationReport } from '../api/_automation-report-export.js';

function fixture(t) {
  let at='2026-10-01T15:00:00Z';
  const engine=createEngine(':memory:',()=>new Date(at));t.after(()=>engine.close());
  const old=engine.run('agenda',{operation:'create',title:'Antigua completada',due:'2026-11-10T18:00'}).task;
  engine.run('agenda',{operation:'complete',id:old.id});
  for(let i=0;i<35;i++) engine.run('agenda',{operation:'create',title:i===0?'=SUM(A1:A2)':`Pendiente ${i}`,due:'2026-11-02T18:00'});
  const plan=engine.run('study',{operation:'create',topic:'Repaso',exam:'2026-11-10T12:00',minutes:40});
  at='2026-11-03T15:00:00Z';
  const boundary=engine.run('agenda',{operation:'create',title:'Límite diario',due:'2026-11-05T18:00'}).task;
  engine.run('agenda',{operation:'complete',id:boundary.id});
  engine.run('study',{operation:'complete',id:plan.sessions[0].id});
  at='2026-11-04T15:00:00Z';
  engine.run('agenda',{operation:'meeting',title:'Reunión de diseño',notes:'Notas extensas. '.repeat(600),tasks:[{title:'Revisar diseño',owner:'Ana',due:'2026-11-06T18:00'}]});
  return engine;
}

test('el reporte conserva todos los pendientes antiguos y aplica límites inclusivos a la actividad',t=>{
  const e=fixture(t);
  const daily=e.run('reports',{operation:'export',period:'daily'}).snapshot;
  assert.equal(daily.tasks.length,37);assert.equal(daily.summary.pendingTasks,36);assert.equal(daily.summary.overdueTasks,35);
  assert.equal(daily.summary.completedTasks,1);assert.equal(daily.summary.completedSessions,1);assert.equal(daily.summary.completedMinutes,40);
  assert.equal(daily.summary.pendingAgreements,1);assert.equal(daily.summary.createdMeetings,1);
  assert.equal(daily.sessions.length,e.all('session').length);
  assert.equal(daily.plans.length,1);assert.equal(daily.meetings.length,1);
  assert.ok(!daily.tasks.some(x=>x.title==='Antigua completada'));
  assert.equal(e.run('reports',{operation:'export',period:'all'}).snapshot.summary.completedTasks,2);
  assert.throws(()=>e.run('reports',{operation:'export',period:'invalid'}),/período/);
  assert.equal(e.all('report').length,0);assert.equal(e.status().pendingNotifications,0);
});

test('Excel incluye cinco hojas, fechas locales, números y textos sin fórmulas ejecutables',async t=>{
  const s=fixture(t).run('reports',{operation:'export',period:'all'}).snapshot;
  const file=await exportAutomationReport(s,'xlsx');
  assert.match(file.contentType,/spreadsheetml/);
  const book=new ExcelJS.Workbook();await book.xlsx.load(file.buffer);
  assert.equal(book.worksheets.length,5);
  const tasks=book.getWorksheet('Tareas y acuerdos');assert.equal(tasks.rowCount,s.tasks.length+1);
  assert.equal(tasks.getRow(2).getCell(3).value,'=SUM(A1:A2)');
  assert.ok(tasks.getRow(2).getCell(8).value instanceof Date);
  assert.equal(tasks.getRow(2).getCell(8).value.toISOString(),'2026-11-02T18:00:00.000Z');
  assert.equal(book.getWorksheet('Sesiones').rowCount,s.sessions.length+1);
  assert.equal(book.getWorksheet('Reuniones').getRow(2).getCell(3).value,s.meetings[0].notes);
  assert.equal(typeof book.getWorksheet('Sesiones').getRow(2).getCell(7).value,'number');
});

test('PDF admite múltiples páginas y notas largas; un reporte vacío también se descarga',async t=>{
  const s=fixture(t).run('reports',{operation:'export',period:'weekly'}).snapshot;
  const file=await exportAutomationReport(s,'pdf');
  assert.equal(file.buffer.subarray(0,5).toString(),'%PDF-');
  assert.ok((file.buffer.toString('latin1').match(/\/Type \/Page\b/g)||[]).length>5);
  const empty=createEngine(':memory:');t.after(()=>empty.close());
  for(const format of ['pdf','xlsx']) assert.ok((await exportAutomationReport(empty.run('reports',{operation:'export',period:'all'}).snapshot,format)).buffer.length>1000);
});

test('la API sirve descargas binarias frescas y rechaza formatos incorrectos antes de llamar a n8n',async t=>{
  const {default:handler}=await import('../api/automation.js');
  const keys=['AUTOMATION_SERVICE_URL','N8N_AUTOMATION_BASE_URL','AUTOMATION_SHARED_SECRET'];
  const previous=keys.map(k=>process.env[k]),fetcher=globalThis.fetch;
  t.after(()=>{keys.forEach((k,i)=>previous[i]===undefined?delete process.env[k]:process.env[k]=previous[i]);globalThis.fetch=fetcher;});
  keys.forEach(k=>process.env[k]='http://local');
  const s=fixture(t).run('reports',{operation:'export',period:'daily'}).snapshot;
  let calls=0;globalThis.fetch=async(url,options)=>{calls++;assert.equal(JSON.parse(options.body).operation,'export');return Response.json({ok:true,snapshot:s});};
  const response=()=>({headers:{},code:200,setHeader(k,v){this.headers[k]=v;},status(c){this.code=c;return this;},json(p){this.payload=p;return this;},send(p){this.payload=p;return this;}});
  const req=format=>({method:'POST',headers:{host:'localhost:3000',origin:'http://localhost:3000'},body:{workflow:'reports',operation:'export',period:'daily',format}});
  for(const format of ['xlsx','pdf']) {const res=response();await handler(req(format),res);assert.equal(res.code,200);assert.ok(Buffer.isBuffer(res.payload));assert.equal(res.headers['Cache-Control'],'no-store');assert.match(res.headers['Content-Disposition'],new RegExp(`\\.${format}"$`));}
  const res=response();await handler(req('csv'),res);assert.equal(res.code,400);assert.equal(calls,2);
});
