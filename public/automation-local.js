const hub = document.querySelector('#automationHub');
if (hub) {
  const $ = selector => hub.querySelector(selector);
  const message = (text, error=false) => { $('#nxAutoMessage').textContent=text; $('#nxAutoMessage').dataset.error=String(error); };
  const date = value => new Date(value).toLocaleString('es-PE',{timeZone:'America/Lima',dateStyle:'medium',timeStyle:'short'});
  async function request(workflow, payload={}) {
    const response=await fetch('/api/automation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workflow,...payload})});
    const data=await response.json();
    if(!response.ok || !data.ok) throw new Error(data.error || 'Inicia NEXORA con scripts/start_automations_local.sh para usar las automatizaciones locales.');
    return data;
  }
  function row(container, label, actions=[]) {
    const div=document.createElement('div');div.className='nx-auto-row';
    const span=document.createElement('span');span.textContent=label;div.append(span);
    for(const action of actions) div.append(action);
    container.append(div);
  }
  function button(label, callback) {
    const b=document.createElement('button');b.type='button';b.className='secondary';b.textContent=label;
    b.addEventListener('click',()=>perform(b,callback));return b;
  }
  async function perform(button, callback, success='Listo. Los cambios están guardados localmente.') {
    button.disabled=true;message('Procesando…');
    try { await callback();message(success); }
    catch(error) {message(error.message,true);}
    finally {button.disabled=false;}
  }
  async function status() {
    const s=await request('status');
    $('#nxAutoStatus').textContent=`Almacenamiento local conectado · Telegram ${s.telegram.enabled?'activo':s.telegram.configured?'en pausa':'sin configurar'} · ${s.pendingNotifications} avisos pendientes`;
    $('#nxEvents').textContent=[s.telegram.lastError, ...s.events.map(e=>`${date(e.at)} · ${e.action} · ${e.status}`)].filter(Boolean).join('\n') || 'Sin ejecuciones todavía.';
    $('#nxTelegram').elements.chat.value=s.telegram.chat;
  }
  async function refresh() {
    const [agenda,study]=await Promise.all([request('agenda',{operation:'list'}),request('study',{operation:'list'})]);
    $('#nxTasks').replaceChildren();
    const pending=agenda.tasks.filter(t=>t.status==='pending');
    if(!pending.length) row($('#nxTasks'),'No tienes tareas pendientes.');
    for(const t of pending) row($('#nxTasks'),`${t.title}\n${t.owner ? 'Responsable: '+t.owner+' · ' : ''}${t.course || ''}\n${date(t.due)} · prioridad ${t.priority}${Date.parse(t.due)<Date.now()?' · vencida':''}`,[button('Completar',async()=>{await request('agenda',{operation:'complete',id:t.id,requestId:crypto.randomUUID()});await refresh();})]);
    $('#nxSessions').replaceChildren();
    const sessions=study.sessions.filter(s=>s.status==='pending').slice(0,30);
    if(!sessions.length) row($('#nxSessions'),'No tienes sesiones pendientes. Crea un plan arriba.');
    for(const s of sessions) {
      const input=document.createElement('input');input.type='datetime-local';input.setAttribute('aria-label',`Nuevo horario para ${s.topic}`);
      row($('#nxSessions'),`${s.topic} · ${s.phase}\n${date(s.at)} · ${s.minutes} minutos`,[button('Completada',async()=>{await request('study',{operation:'complete',id:s.id,requestId:crypto.randomUUID()});await refresh();}),input,button('Reprogramar',async()=>{if(!input.value)throw new Error('Elige el nuevo horario.');await request('study',{operation:'reschedule',id:s.id,at:input.value,requestId:crypto.randomUUID()});await refresh();})]);
    }
    await status();
  }
  for(const [selector,workflow,operation] of [['#nxTask','agenda','create'],['#nxStudy','study','create'],['#nxMeeting','agenda','meeting']]) {
    const form=$(selector);
    form.addEventListener('submit',event=>{event.preventDefault();perform(event.submitter,async()=>{
      // Retain the identifier after a failed response so retrying cannot create duplicate records.
      const signature=JSON.stringify(Object.fromEntries(new FormData(form)));
      if(form.dataset.signature!==signature){form.dataset.signature=signature;form.dataset.requestId=crypto.randomUUID();}
      const p={...JSON.parse(signature),operation,requestId:form.dataset.requestId};
      if(operation==='meeting')p.tasks=[{title:p.taskTitle,owner:p.owner,due:p.due}];
      await request(workflow,p);form.reset();delete form.dataset.signature;delete form.dataset.requestId;await refresh();
    });});
  }
  $('#nxRefresh').addEventListener('click',event=>perform(event.currentTarget,refresh));
  for(const [selector,period] of [['#nxDaily','daily'],['#nxWeekly','weekly']]) $(selector).addEventListener('click',event=>perform(event.currentTarget,async()=>{
    const {report:r,history}=await request('reports',{operation:'generate',period});$('#nxReports').replaceChildren();
    row($('#nxReports'),`${period==='weekly'?'Últimos 7 días':'Últimas 24 horas'}\n${r.pendingTasks.length} tareas pendientes · ${r.overdueTasks.length} vencidas\n${r.completedTasks} tareas y ${r.completedSessions} sesiones completadas`);
    for(const item of history.slice(-5).reverse())row($('#nxReports'),`${item.period==='weekly'?'Semanal':'Diario'} · ${date(item.generatedAt)} · ${item.completedTasks} tareas completadas`);
    await status();
  }));
  const telegram=$('#nxTelegram');
  for (const [selector,format] of [['#nxDownloadPdf','pdf'],['#nxDownloadExcel','xlsx']]) {
    $(selector).addEventListener('click',event=>perform(event.currentTarget,async()=>{
      const response=await fetch('/api/automation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workflow:'reports',operation:'export',period:$('#nxReportPeriod').value,format})});
      if(!response.ok) { const data=await response.json();throw new Error(data.error || 'No se pudo descargar el reporte.'); }
      const blob=await response.blob();
      const url=URL.createObjectURL(blob), link=document.createElement('a');
      link.href=url;link.download=response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] || `NEXORA-reporte.${format}`;
      document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),60000);
    },'Reporte preparado. Revisa las descargas de tu navegador.'));
  }
  telegram.addEventListener('submit',event=>{event.preventDefault();perform(event.submitter,async()=>{await request('settings',{...Object.fromEntries(new FormData(telegram)),enabled:true});telegram.elements.token.value='';await status();});});
  $('#nxDiscover').addEventListener('click',event=>perform(event.currentTarget,async()=>{
    const {chats}=await request('settings',{token:telegram.elements.token.value,discover:true});$('#nxChats').replaceChildren();
    if(!chats.length)throw new Error('Envía /start a tu bot desde Telegram y vuelve a buscar.');
    for(const chat of chats)row($('#nxChats'),`Chat ${chat.id}`,[button('Usar este chat',async()=>{telegram.elements.chat.value=chat.id;})]);
  }));
  $('#nxDisconnect').addEventListener('click',event=>perform(event.currentTarget,async()=>{await request('settings',{enabled:false});await status();}));
  const initialise=()=>refresh().catch(error=>{$('#nxAutoStatus').textContent='Automatizaciones locales sin conexión';message(error.message,true);});
  document.querySelector('[data-view="automate"]').addEventListener('click',initialise);
  window.addEventListener('popstate',()=>{if(location.hash==='#automate')initialise();});
  const initialView=()=>{if(document.querySelector('#automateView').classList.contains('active'))initialise();};
  if(document.readyState!=='complete')document.addEventListener('DOMContentLoaded',initialView,{once:true});else initialView();
}
