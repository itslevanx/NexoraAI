import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { createEngine } from './engine.mjs';

export function createAutomationServer({ engine, secret, n8n = 'http://n8n:5678', fetcher = fetch }) {
  if (!secret || secret.length < 32) throw new Error('Configura una clave local de al menos 32 caracteres.');
  const key = createHash('sha256').update(secret).digest();
  const encrypt = value => { const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', key, iv); const data = Buffer.concat([c.update(value,'utf8'),c.final()]); return Buffer.concat([iv,c.getAuthTag(),data]).toString('base64'); };
  const decrypt = value => { const b = Buffer.from(value,'base64'), c = createDecipheriv('aes-256-gcm',key,b.subarray(0,12)); c.setAuthTag(b.subarray(12,28)); return Buffer.concat([c.update(b.subarray(28)),c.final()]).toString(); };
  let busy = false, lastError = '', lastPoll = '';
  const configured = () => Boolean(engine.setting('telegramToken') && engine.setting('telegramChat'));
  async function telegram(method, body, overrideToken) {
    const token = overrideToken || decrypt(engine.setting('telegramToken'));
    const response = await fetcher(`https://api.telegram.org/bot${token}/${method}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body), signal:AbortSignal.timeout(15000) });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(`Telegram no pudo completar ${method} (código ${data.error_code || response.status}).`);
    return data.result;
  }
  const route = input => /^\/(estudio|estudiado|reprogramar)(?:\s|$)/.test(input) ? 'study' : /^\/(reuniones|acuerdo|acuerdohecho)(?:\s|$)/.test(input) ? 'meetings' : 'tasks';
  async function poll() {
    if (busy || !configured() || engine.setting('telegramEnabled') !== 'true') return;
    busy = true;
    try {
      const updates = await telegram('getUpdates', { offset:Number(engine.setting('telegramOffset') || 0), timeout:0, allowed_updates:['message'] });
      for (const u of updates) {
        if (!Number.isSafeInteger(u.update_id)) continue;
        const chat = u.message?.chat?.id;
        if (String(chat) === engine.setting('telegramChat') && typeof u.message?.text === 'string') engine.db.prepare('INSERT OR IGNORE INTO inbox(id,data) VALUES(?,?)').run(u.update_id,JSON.stringify({ updateId:u.update_id, text:u.message.text }));
        engine.setting('telegramOffset', u.update_id+1);
      }
      for (const row of engine.db.prepare('SELECT * FROM inbox WHERE done=0 ORDER BY id LIMIT 10').all()) {
        const data = JSON.parse(row.data);
        if (/^\/(start|ayuda)(?:\s|$)/.test(data.text)) {
          engine.notify(`reply:${row.id}`, 'NEXORA · Comandos\n/pendientes · /hoy\n/agregar título | AAAA-MM-DDTHH:mm | curso\n/hecho ID\n/estudio · /estudiado ID\n/reprogramar ID | AAAA-MM-DDTHH:mm\n/reuniones\n/acuerdo reunión | responsable | AAAA-MM-DDTHH:mm | tarea\n/acuerdohecho ID\nHorarios de Lima. Crea planes de estudio en NEXORA.');
        } else if (!/^\/(pendientes|hoy|agregar|hecho|estudio|estudiado|reprogramar|reuniones|acuerdo|acuerdohecho)(?:\s|$)/.test(data.text)) {
          engine.notify(`reply:${row.id}`, 'Usa /ayuda para ver los comandos disponibles.');
        } else {
          const response = await fetcher(`${n8n}/webhook/nexora-bot-${route(data.text)}`, { method:'POST', headers:{'Content-Type':'application/json','x-nexora-automation-key':secret}, body:JSON.stringify({...data,requestId:`telegram:${row.id}`}), signal:AbortSignal.timeout(20000) });
          if (!response.ok) throw new Error('n8n no pudo procesar el mensaje. Se reintentará.');
        }
        engine.db.prepare('UPDATE inbox SET done=1 WHERE id=?').run(row.id);
      }
      for (const row of engine.db.prepare("SELECT * FROM outbox WHERE status='pending' AND attempts<10 ORDER BY rowid LIMIT 10").all()) {
        try {
          await telegram('sendMessage', { chat_id:engine.setting('telegramChat'), text:row.text, reply_markup:{keyboard:[['/hoy','/pendientes'],['/estudio','/reuniones'],['/ayuda']],resize_keyboard:true} });
          engine.db.prepare("UPDATE outbox SET status='sent', error='' WHERE id=?").run(row.id);
        } catch (error) {
          engine.db.prepare('UPDATE outbox SET attempts=attempts+1,error=? WHERE id=?').run(error.message,row.id);
          throw error;
        }
      }
      lastPoll = new Date().toISOString(); lastError = '';
    } catch (e) { lastError = e.message.includes('Telegram') || e.message.includes('n8n') ? e.message : 'No se pudo conectar. Se reintentará automáticamente.'; }
    finally { busy = false; }
  }
  const server = createServer(async (req,res) => {
    res.setHeader('Content-Type','application/json; charset=utf-8'); res.setHeader('Cache-Control','no-store');
    const send = (code, data) => { res.statusCode=code; res.end(JSON.stringify(data)); };
    if (req.url === '/health') return send(200,{ok:true});
    const supplied = Buffer.from(String(req.headers['x-nexora-automation-key'] || ''));
    const expected = Buffer.from(secret);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied,expected)) return send(401,{error:'Acceso local no autorizado.'});
    if (req.method !== 'POST') return send(405,{error:'Usa POST.'});
    try {
      let raw=''; for await(const chunk of req) { raw+=chunk; if(Buffer.byteLength(raw)>65536) throw new Error('Solicitud demasiado grande.'); }
      const body = JSON.parse(raw || '{}');
      if(req.url === '/status') return send(200,{ok:true,telegram:{configured:configured(),enabled:engine.setting('telegramEnabled')==='true',chat:engine.setting('telegramChat') || '',lastPoll,lastError},...engine.status()});
      if(req.url === '/settings') {
        if (body.enabled === false) { engine.setting('telegramEnabled','false'); return send(200,{ok:true}); }
        if (busy) throw new Error('Espera unos segundos antes de cambiar la configuración.');
        const token = body.token || (engine.setting('telegramToken') ? decrypt(engine.setting('telegramToken')) : '');
        if(!/^\d{5,20}:[A-Za-z0-9_-]{20,100}$/.test(token)) throw new Error('Ingresa un token válido de BotFather.');
        busy = true;
        try {
          await telegram('getMe',{},token);
          const hook=await telegram('getWebhookInfo',{},token);
          if(hook.url) throw new Error('El bot ya tiene un webhook activo. Usa un bot dedicado sin webhook.');
          if(body.discover) {
            const updates=await telegram('getUpdates',{timeout:0,allowed_updates:['message']},token);
            const chats=[...new Set(updates.filter(u=>u.message?.chat?.type==='private').map(u=>String(u.message.chat.id)))];
            return send(200,{ok:true,chats:chats.map(id=>({id}))});
          }
          const chat=String(body.chat || '').trim();
          if(!/^\d{1,20}$/.test(chat)) throw new Error('Indica el identificador numérico de tu chat privado.');
          const changed=!engine.setting('telegramToken') || decrypt(engine.setting('telegramToken'))!==token || engine.setting('telegramChat')!==chat;
          if(changed) {
            const updates=await telegram('getUpdates',{timeout:0,allowed_updates:['message']},token);
            engine.setting('telegramOffset',updates.length ? Math.max(...updates.map(u=>u.update_id))+1 : 0);
            engine.db.prepare('UPDATE inbox SET done=1 WHERE done=0').run();
          }
          engine.setting('telegramToken',encrypt(token));
          engine.setting('telegramChat',chat); engine.setting('telegramEnabled','true');
        } finally { busy=false; }
        return send(200,{ok:true,message:'Bot conectado. Envía /ayuda desde el chat autorizado.'});
      }
      const match = req.url.match(/^\/run\/(agenda|study|reports|bot-tasks|bot-study|bot-meetings)$/);
      if(!match) return send(404,{error:'Ruta no encontrada.'});
      try { return send(200,engine.run(match[1],body)); }
      catch(e) {
        if(match[1].startsWith('bot-') && Number.isSafeInteger(body.updateId)) { engine.notify(`reply:${body.updateId}`, `No pude completar la acción: ${e.message}\nUsa /ayuda para revisar el formato.`); return send(200,{ok:true,handledError:true}); }
        return send(200,{ok:false,error:e.message});
      }
    } catch(e) { send(400,{error:e.message.includes('https://') ? 'No se pudo conectar al servicio externo.' : e.message}); }
  });
  return {server,poll};
}
if(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dir=process.env.DATA_DIR || './n8n-local/data'; mkdirSync(dir,{recursive:true});
  const engine=createEngine(`${dir}/automation.sqlite`);
  const {server,poll}=createAutomationServer({engine,secret:process.env.AUTOMATION_SHARED_SECRET,n8n:process.env.N8N_BASE_URL});
  server.listen(Number(process.env.PORT || 3002),'0.0.0.0',()=>console.log('Automatizaciones locales listas.'));
  const interval=setInterval(poll,5000); interval.unref();
  for(const signal of ['SIGTERM','SIGINT']) process.once(signal,()=>{clearInterval(interval);server.close(()=>{engine.close();process.exit(0);});});
}
