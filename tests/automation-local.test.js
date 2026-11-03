import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createEngine, dueDate } from '../local-automation/engine.mjs';
import { createAutomationServer } from '../local-automation/server.mjs';
const fixed=()=>new Date('2026-11-03T15:00:00Z');
function engine(t) { const e=createEngine(':memory:',fixed);t.after(()=>e.close());return e; }

test('interpreta fechas en Lima y rechaza fechas imposibles',()=>{
  assert.equal(dueDate('2026-11-04T18:00'),'2026-11-04T23:00:00.000Z');
  for(const date of ['2026-02-30T10:00','2026-11-04T25:00','ayer']) assert.throws(()=>dueDate(date));
});
test('una solicitud reintentada crea una sola tarea y conserva datos al reiniciar',t=>{
  const dir=mkdtempSync(join(tmpdir(),'nexora-')); t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const file=join(dir,'data.sqlite');let e=createEngine(file,fixed);
  const payload={operation:'create',title:'Informe',due:'2026-11-04T18:00',requestId:'same'};
  const first=e.run('agenda',payload);assert.deepEqual(e.run('agenda',payload),first);assert.equal(e.all('task').length,1);e.close();
  e=createEngine(file,fixed);assert.equal(e.run('agenda',payload).task.id,first.task.id);e.close();
});
test('valida todos los acuerdos antes de guardar una reunión',t=>{
  const e=engine(t);
  assert.throws(()=>e.run('agenda',{operation:'meeting',title:'Reunión',tasks:[{title:'Uno',owner:'Ana',due:'2026-11-04T10:00'},{title:'Dos',due:'incorrecto'}]}));
  assert.equal(e.all('meeting').length,0);assert.equal(e.all('task').length,0);
});
test('estudio distribuye sesiones antes del examen sin solaparlas',t=>{
  const e=engine(t),p={operation:'create',topic:'SQL',exam:'2026-11-06T12:00',dailyTime:'18:00',minutes:40};
  const result=e.run('study',p);assert.equal(result.sessions.length,3);
  assert.ok(result.sessions.every(s=>Date.parse(s.at)+s.minutes*60000<Date.parse(result.plan.exam)));
  assert.throws(()=>e.run('study',p),/No hay espacio/);
  assert.throws(()=>e.run('study',{operation:'reschedule',id:result.sessions[0].id,at:'2026-11-06T13:00'}),/anterior/);
  assert.throws(()=>e.run('study',{operation:'reschedule',id:result.sessions[0].id,at:'2026-11-04T18:20'}),/cruza/);
  assert.equal(e.run('study',{operation:'complete',id:result.sessions[0].id}).session.status,'done');
});
test('recordatorios y reportes programados se guardan una sola vez',t=>{
  const e=engine(t);e.run('agenda',{operation:'create',title:'Hoy',due:'2026-11-03T14:00'});
  for(let i=0;i<3;i++){e.run('agenda',{operation:'tick'});e.run('reports',{operation:'tick'});}
  assert.equal(e.all('report').length,1);
  assert.equal(e.db.prepare('SELECT count(*) AS n FROM outbox').get().n,2);
});
test('domingo genera reporte semanal y diario; completar afecta las métricas',t=>{
  const e=createEngine(':memory:',()=>new Date('2026-11-09T00:00:00Z'));t.after(()=>e.close());
  const task=e.run('agenda',{operation:'create',title:'Prueba',due:'2026-11-10T10:00'}).task;
  e.run('agenda',{operation:'complete',id:task.id});e.run('reports',{operation:'tick'});
  assert.equal(e.all('report').length,2);assert.equal(e.run('reports',{period:'weekly'}).report.completedTasks,1);
});
test('los tres bots trabajan sobre los mismos registros y son idempotentes',t=>{
  const e=engine(t);
  const p={text:'/agregar Informe | 2026-11-04T18:00 | Redes',updateId:1,requestId:'telegram:1'};
  e.run('bot-tasks',p);e.run('bot-tasks',p);assert.equal(e.all('task').length,1);
  e.run('bot-meetings',{text:'/acuerdo Sprint | Ana | 2026-11-04T12:00 | Revisar',updateId:2});
  assert.equal(e.all('meeting').length,1);assert.equal(e.all('task').length,2);
  assert.match(e.run('bot-study',{text:'/estudio',updateId:3}).reply,/Crea tu plan/);
  assert.equal(e.db.prepare('SELECT count(*) AS n FROM outbox').get().n,3);
});

test('servicio protege datos y token; polling ignora otros chats y reintenta sin repetir tareas',async t=>{
  const e=engine(t),secret='test-secret-'.repeat(4),token='123456789:abcdefghijklmnopqrstuvwxyzABCDE';
  let fail=true;const sent=[];
  const fetcher=async(url,options)=>{
    const p=JSON.parse(options.body);
    if(url.includes('getMe'))return Response.json({ok:true,result:{id:123}});
    if(url.includes('getWebhookInfo'))return Response.json({ok:true,result:{url:''}});
    if(url.includes('getUpdates'))return Response.json({ok:true,result:p.offset===undefined?[]:[{update_id:1,message:{chat:{id:7},text:'/agregar Informe | 2026-11-04T10:00'}},{update_id:2,message:{chat:{id:99},text:'/agregar No permitido | 2026-11-04T10:00'}}]});
    if(url.includes('/webhook/')){e.run('bot-tasks',p);if(fail){fail=false;throw new Error('timeout');}return Response.json({ok:true});}
    if(url.includes('sendMessage')){sent.push(p);return Response.json({ok:true,result:{}});}
    throw new Error('Unexpected request');
  };
  const {server,poll}=createAutomationServer({engine:e,secret,fetcher});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const url=`http://127.0.0.1:${server.address().port}`;
  const call=(path,body={},auth=secret)=>fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json','x-nexora-automation-key':auth},body:JSON.stringify(body)});
  assert.equal((await call('/status',{},'bad')).status,401);
  assert.equal((await call('/settings',{token,chat:'7'})).status,200);
  assert.ok(!e.setting('telegramToken').includes(token));
  const status=await(await call('/status')).json();assert.ok(!JSON.stringify(status).includes(token));
  await poll();await poll();assert.equal(e.all('task').length,1);assert.equal(sent.length,1);assert.equal(sent[0].chat_id,'7');
});

test('completar o reprogramar retira recordatorios que ya no corresponden',t=>{
  const e=engine(t);
  const task=e.run('agenda',{operation:'create',title:'Pendiente',due:'2026-11-03T14:00'}).task;
  e.run('agenda',{operation:'tick'});assert.equal(e.status().pendingNotifications,1);
  e.run('agenda',{operation:'complete',id:task.id});assert.equal(e.status().pendingNotifications,0);
  const plan=e.run('study',{operation:'create',topic:'Redes',exam:'2026-11-05T18:00',minutes:40});
  const session=plan.sessions[0];e.notify(`session:${session.id}:${session.at}`,'aviso anterior');
  e.run('study',{operation:'reschedule',id:session.id,at:'2026-11-04T17:00'});
  assert.equal(e.status().pendingNotifications,0);
});

test('los seis workflows usan autenticación, sin secretos ni código arbitrario',async()=>{
  const {readdir,readFile}=await import('node:fs/promises');
  const paths=await readdir(new URL('../automations/local/',import.meta.url));assert.equal(paths.length,6);
  for(const path of paths){
    const w=JSON.parse(await readFile(new URL('../automations/local/'+path,import.meta.url),'utf8'));
    assert.equal(w.nodes[0].parameters.authentication,'headerAuth');
    assert.ok(w.nodes[1].parameters.jsonBody.includes('$execution.id'));
    assert.ok(w.nodes.every(n=>n.type!=='n8n-nodes-base.executeCommand'));
  }
});

test('la API local rechaza otros orígenes y conserva errores de validación',async t=>{
  const {default:handler}=await import('../api/automation.js');
  const keys=['AUTOMATION_SERVICE_URL','N8N_AUTOMATION_BASE_URL','AUTOMATION_SHARED_SECRET'];
  const previous=Object.fromEntries(keys.map(k=>[k,process.env[k]]));const oldFetch=globalThis.fetch;
  t.after(()=>{for(const k of keys){if(previous[k]===undefined)delete process.env[k];else process.env[k]=previous[k];}globalThis.fetch=oldFetch;});
  process.env.AUTOMATION_SERVICE_URL='http://automation:3002';process.env.N8N_AUTOMATION_BASE_URL='http://n8n:5678';process.env.AUTOMATION_SHARED_SECRET='internal';
  const response=()=>({code:200,payload:null,setHeader(){},status(c){this.code=c;return this;},json(p){this.payload=p;return this;}});
  let calls=0;globalThis.fetch=async()=>{calls++;return Response.json({ok:false,error:'Elige un horario futuro.'});};
  let res=response();await handler({method:'POST',headers:{origin:'https://otro.example',host:'localhost:3000'},body:{workflow:'study'}},res);assert.equal(res.code,403);assert.equal(calls,0);
  res=response();await handler({method:'POST',headers:{origin:'http://localhost:3000',host:'localhost:3000'},body:{workflow:'study'}},res);assert.equal(res.code,400);assert.match(res.payload.error,/futuro/);
});
