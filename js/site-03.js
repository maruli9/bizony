
const tourText=(pl,de)=>document.documentElement.lang==='de'?de:pl;
const tourDate=value=>new Intl.DateTimeFormat(document.documentElement.lang==='de'?'de-AT':'pl-PL',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Vienna'}).format(new Date(value));
const tourCategories={club:['Klubowe','Clubintern'],away:['Wyjazdowe','Auswärts'],solo:['Indywidualne','Einzelstarts']};
let tourDb,tourSession,tourMember,tourEvents=[],tourEntries=[],tourFilter='all',tourState='loading',tourVersion=0,tourReady;
const tourAdmin=()=>tourMember?.active&&tourMember.role==='admin';
const tourTitle=e=>tourText(e.title,e.title_de||e.title);
const tourEventDate=e=>e.date_only
  ? new Intl.DateTimeFormat(document.documentElement.lang==='de'?'de-AT':'pl-PL',{dateStyle:'full',timeZone:'Europe/Vienna'}).format(new Date(e.starts_at))
  : tourDate(e.starts_at);
const tourEntryStatus=(status,event)=>status==='confirmed'&&event.category==='away'
  ? tourText('Chęć udziału zgłoszona','Interesse gemeldet')
  : tourStatus(status);
const tourStatus=s=>s==='confirmed'?tourText('Potwierdzony','Bestätigt'):tourText('Lista rezerwowa','Warteliste');
function tourError(err){
  const messages={
    registration_closed:['Zapisy są zamknięte.','Die Anmeldung ist geschlossen.'],
    event_full:['Brak miejsc.','Keine Plätze frei.'],
    event_unavailable:['Turniej jest niedostępny.','Das Turnier ist nicht verfügbar.'],
    event_started:['Turniej już się rozpoczął.','Das Turnier hat bereits begonnen.'],
    membership_required:['Wymagane aktywne konto członka.','Ein aktives Mitgliedskonto ist erforderlich.'],
    capacity_below_confirmed:['Limit jest mniejszy niż liczba potwierdzonych uczestników.','Das Limit liegt unter der Zahl bestätigter Teilnehmer.']
  };
  return messages[err?.message]?tourText(...messages[err.message]):tourText('Operacja nie powiodła się. Sprawdź dane lub spróbuj ponownie.','Vorgang fehlgeschlagen. Bitte prüfe die Daten oder versuche es erneut.');
}
const bizonsReturningVisitor=(()=>{
  try{
    const returning=localStorage.getItem('bizons-has-visited')==='1';
    localStorage.setItem('bizons-has-visited','1');
    return returning;
  }catch{return false}
})();
function syncBizonsWelcome(){
  const welcome=$('#bizonsWelcome');
  if(tourState==='loading')return;
  const selected=tourState==='ready'&&tourSession
    ?(tourMember?.active?'Member':'Account')
    :(bizonsReturningVisitor?'Return':'First');
  for(const state of ['First','Return','Member','Account']){
    $('#bizonsWelcome'+state).hidden=state!==selected;
  }
  welcome.hidden=false;
}
function syncTrainingNav(){
  const link=$('#trainingNav');
  link.hidden=!tourMember?.active;
  link.textContent=tourText('Treningi','Training');
  if(link.hidden&&$('#trainingPanel')&&$('#modal').open)$('#modal').close();
}
const trainingDate=day=>new Intl.DateTimeFormat(document.documentElement.lang==='de'?'de-AT':'pl-PL',
  {dateStyle:'full',timeZone:'Europe/Vienna'}).format(new Date(day+'T12:00:00Z'));
const trainingName=kind=>kind==='thursday'?tourText('Czwartkowy trening','Donnerstagstraining'):tourText('Trening weekendowy','Wochenendtraining');
const trainingGroups=[
  ['confirmed','Potwierdzeni','Bestätigt'],
  ['waiting','Lista rezerwowa','Warteliste'],
  ['withdrawn','Rezygnacje','Abmeldungen']
];
const weekendFormats=[
  ['singles','Tylko singiel','Nur Einzel'],
  ['doubles','Tylko debel','Nur Doppel'],
  ['both','Singiel i debel','Einzel und Doppel']
];
function weekendFormatLabel(key){
  const format=weekendFormats.find(item=>item[0]===key);
  return format?tourText(format[1],format[2]):'';
}
function weekendReadiness(session){
  const confirmed=session.roster.filter(row=>row.status==='confirmed');
  const singles=confirmed.filter(row=>row.preference==='singles'||row.preference==='both').length;
  const doubles=confirmed.filter(row=>row.preference==='doubles'||row.preference==='both').length;
  return {singles,doubles};
}
function trainingError(error){
  const key=error?.message;
  if(error?.code==='PGRST202')return tourText('Treningi nie zostały jeszcze uruchomione.','Das Training wurde noch nicht eingerichtet.');
  if(error?.code==='23505')return tourText('Trening w tym dniu już istnieje.','An diesem Tag gibt es bereits ein Training.');
  const messages={
    training_preference_required:['Wybierz singiel, debel albo oba formaty.','Wähle Einzel, Doppel oder beides.'],
    training_weekend_capacity:['Weekendowy limit miejsc musi wynosić co najmniej 2.','Das Platzlimit am Wochenende muss mindestens 2 betragen.'],
    partner_venue_required:['Wpisz miejsce gry.','Gib den Spielort an.'],
    training_closed:['Zapisy na ten trening są już zamknięte.','Die Anmeldung für dieses Training ist bereits geschlossen.'],
    training_past:['Wybierz przyszły termin.','Wähle einen Termin in der Zukunft.'],
    training_capacity:['Limit nie może być mniejszy od liczby potwierdzonych osób.','Das Limit darf nicht unter der Zahl der bestätigten Personen liegen.'],
    training_member_required:['Potrzebne jest aktywne konto Bizons.','Ein aktives Bizons-Konto ist erforderlich.'],
    admin_required:['Potrzebne są uprawnienia administratora.','Administratorrechte sind erforderlich.']
  };
  return tourText(...(messages[key]||['Nie udało się wykonać operacji.','Der Vorgang ist fehlgeschlagen.']));
}
let trainingPartners=null;
function trainingPartnerPanel(){
  if(!trainingPartners)return `<p class="tiny">${tourText('Ogłoszenia partnerów są chwilowo niedostępne.','Die Partnersuche ist vorübergehend nicht verfügbar.')}</p>`;
  return `<details id="trainingPartnerPanel" class="bizons-partner-panel">
    <summary>${tourText('Szukam partnera/partnerki do badmintona','Badminton-Spielpartner/in gesucht')} · ${trainingPartners.length}</summary>
    <p class="tiny">${tourText('Wybierz własny dzień, godzinę i miejsce gry. Godziny w czasie Wiednia.','Wähle deinen eigenen Tag, deine Uhrzeit und den Spielort. Uhrzeiten in Wiener Ortszeit.')}</p>
    <button class="btn primary" type="button" onclick="trainingPartnerForm()">${tourText('Dodaj ogłoszenie','Anzeige hinzufügen')}</button>
    ${trainingPartners.map(row=>`<div class="internal" id="partner-offer-${safe(row.id)}">
      <strong>${safe(row.display_name)} · ${safe(weekendFormatLabel(row.format))}</strong>
      <p class="tiny">${trainingDate(row.day)} · ${safe(row.starts_at.slice(0,5))} · ${safe(row.venue)}</p>
      ${row.mine?`<div class="actions"><button class="btn" type="button" onclick="trainingPartnerForm('${safe(row.id)}')">${tourText('Edytuj','Bearbeiten')}</button>
      <button class="btn" type="button" onclick="removeTrainingPartner('${safe(row.id)}',this)">${tourText('Usuń ogłoszenie','Anzeige löschen')}</button></div>`:''}
    </div>`).join('')}
    <p class="tiny" role="status"></p></details>`;
}
function trainingPartnerForm(id=null){
  if(!tourMember?.active)return;
  const current=id?trainingPartners?.find(row=>row.id===id&&row.mine):{};
  if(!current)return;
  modal(`<section class="tour-dialog" id="trainingPanel"><h2>${tourText('Szukam partnera/partnerki','Spielpartner/in gesucht')}</h2>
    <p class="tiny">${tourText('Na ogłoszeniu pojawi się Twoja nazwa klubowa.','In der Anzeige steht dein Clubname.')}</p>
    <form id="trainingPartnerForm">
      <label class="field">${tourText('Dzień gry','Spieltag')}<input name="day" type="date" min="${safe(trainingOverview.today)}" value="${safe(current.day||'')}" required></label>
      <label class="field">${tourText('Godzina w Wiedniu','Uhrzeit in Wien')}<input name="time" type="time" value="${safe(current.starts_at?.slice(0,5)||'')}" required></label>
      <label class="field">${tourText('Miejsce gry','Spielort')}<input name="venue" value="${safe(current.venue||'')}" maxlength="160" required></label>
      <label class="field">${tourText('Format gry','Spielformat')}<select name="format" required>
        <option value="">${tourText('Wybierz format','Format wählen')}</option>
        ${weekendFormats.map(([key,pl,de])=>`<option value="${key}" ${current.format===key?'selected':''}>${tourText(pl,de)}</option>`).join('')}
      </select></label>
      <button class="btn primary" type="submit">${tourText('Zapisz ogłoszenie','Anzeige speichern')}</button>
      <button class="btn" type="button" onclick="openTraining(null,true)">${tourText('Wróć','Zurück')}</button><p class="tiny" role="status"></p>
    </form></section>`);
  const form=$('#trainingPartnerForm');
  form.onsubmit=event=>{
    event.preventDefault();
    const data=new FormData(form);
    const status=form.querySelector('[role=status]');
    const venue=data.get('venue').trim();
    if(!venue){status.textContent=tourText('Wpisz miejsce gry.','Gib den Spielort an.');return;}
    return saveTrainingPartner({p_id:id,p_day:data.get('day'),p_time:data.get('time'),p_venue:venue,p_format:data.get('format')},form.querySelector('[type=submit]'),status);
  };
}
function removeTrainingPartner(id,button){
  if(!confirm(tourText('Usunąć Twoje ogłoszenie?','Deine Anzeige löschen?')))return;
  return saveTrainingPartner({p_id:id,p_day:null,p_time:null,p_venue:null,p_format:null},button,button.closest('details').querySelector('[role=status]'));
}
async function saveTrainingPartner(params,button,status){
  if(!tourMember?.active)return;
  button.disabled=true;
  try{
    const {error}=await tourDb.rpc('bizons_partner_offer_save',params);
    if(error)throw error;
    if(button.isConnected&&$('#modal').open)await openTraining(null,true);
  }catch(error){if(status.isConnected)status.textContent=trainingError(error)}
  finally{button.disabled=false}
}

let trainingOverview=null;
async function openTraining(target=null,showPartners=false,partnerTarget=null){
  if(!tourMember?.active)return;
  modal(`<section id="trainingPanel" class="tour-dialog"><h2>${tourText('Treningi Bizons','Bizons-Training')}</h2>
    <div id="trainingBody" aria-live="polite">${tourText('Wczytywanie treningów…','Trainings werden geladen…')}</div></section>`);
  const body=$('#trainingBody');
  try{
    const {data,error}=await tourDb.rpc('bizons_training_overview');
    const partnerResponse=error?null:await Promise.resolve()
      .then(()=>tourDb.rpc('bizons_partner_offers')).catch(()=>null);
    if(error)throw error;
    if(!body.isConnected||!$('#modal').open||!tourMember?.active)return;
    trainingOverview=data;
    trainingPartners=Array.isArray(partnerResponse?.data)?partnerResponse.data:null;
    renderTraining(body);
    if(showPartners){
      const panel=$('#trainingPartnerPanel');
      if(panel){
        panel.open=true;
        const offer=partnerTarget?document.getElementById('partner-offer-'+partnerTarget):null;
        (offer||panel).scrollIntoView({block:'nearest'});
      }
    }
    if(target){
      const card=document.getElementById('training-card-'+target);
      if(card){
        for(let parent=card.parentElement;parent&&parent!==body;parent=parent.parentElement)
          if(parent.tagName==='DETAILS')parent.open=true;
        const roster=card.querySelector('details');
        if(roster)roster.open=true;
        card.scrollIntoView({block:'nearest'});
      }
    }
    void loadSiteFeed();
  }catch(error){if(body.isConnected)body.textContent=trainingError(error)}
}
function renderTraining(body){
  const sessions=trainingOverview.sessions;
  const active=sessions.filter(s=>!s.archived);
  const archives=sessions.filter(s=>s.archived);
  const list=(kind,empty)=>active.filter(s=>s.kind===kind).map(s=>trainingCard(s)).join('')||`<p class="muted">${empty}</p>`;
  body.innerHTML=`<p class="tiny">${tourText('Godziny w czasie Wiednia. W piątek zobaczysz kolejny czwartek, a poprzedni termin przejdzie do archiwum.','Alle Zeiten sind Wiener Ortszeit. Ab Freitag erscheint der nächste Donnerstag, der vorige Termin wandert ins Archiv.')}</p>
  ${tourAdmin()?`<div class="actions"><button class="btn" onclick="trainingForm('cycle')">${tourText('Ustaw cykl czwartkowy','Donnerstagstermine einrichten')}</button>
  <button class="btn" onclick="trainingForm('weekendCycle')">${tourText('Ustaw cykl weekendowy','Wochenendserie einrichten')}</button>
  <button class="btn" onclick="trainingForm('weekend')">${tourText('Dodaj trening weekendowy','Wochenendtraining hinzufügen')}</button></div>`:''}
  ${trainingPartnerPanel()}
  <h3>${tourText('Czwartki','Donnerstags')}</h3>${list('thursday',tourText('Cykl jeszcze nie został ustawiony.','Es wurde noch keine Serie eingerichtet.'))}
  <h3>${tourText('Sobota i niedziela','Samstag und Sonntag')}</h3>${list('weekend',tourText('Weekendowy cykl nie został jeszcze ustawiony.','Es gibt noch keinen zusätzlichen Termin.'))}
  <details><summary>${tourText('Archiwum treningów','Trainingsarchiv')} · ${archives.length}</summary>
    ${archives.map(s=>trainingCard(s)).join('')||`<p>${tourText('Archiwum jest puste.','Das Archiv ist leer.')}</p>`}</details>
  <p class="tiny" role="status" id="trainingStatus"></p>`;
}
function trainingCard(s){
  const registered=['confirmed','waiting'].includes(s.my_status);
  const weekend=s.kind==='weekend';
  const formats=weekend?weekendReadiness(s):null;
  const ready=tourText('Jest skład','Genug Spieler');
  const pending=tourText('Brakuje chętnych','Noch nicht genug Spieler');
  const preference=`<label class="field">${tourText('Format gry','Spielformat')}<select id="training-format-${safe(s.id)}" required>
    <option value="">${tourText('Wybierz format','Format wählen')}</option>${weekendFormats.map(([key,pl,de])=>`<option value="${key}" ${s.my_preference===key?'selected':''}>${tourText(pl,de)}</option>`).join('')}
  </select></label>`;
  const status=trainingGroups.find(group=>group[0]===s.my_status);
  const roster=trainingGroups.map(([key,pl,de])=>{
    const people=s.roster.filter(row=>row.status===key);
    return `<div><strong>${tourText(pl,de)} · ${people.length}</strong>${people.length?`<ol>${people.map(row=>`<li>${safe(row.name)}${row.preference?' · '+weekendFormatLabel(row.preference):''}</li>`).join('')}</ol>`:''}</div>`;
  }).join('');
  return `<div class="internal" id="training-card-${safe(s.id)}">
    <strong>${trainingName(s.kind)} · ${trainingDate(s.day)}</strong>
    ${s.cancelled?` <span class="badge">${tourText('Odwołany','Abgesagt')}</span>`:''}
    <p class="tiny">${safe(s.starts_at.slice(0,5))} · ${safe(s.venue)}${s.capacity===null?'':` · ${tourText('Limit miejsc','Platzlimit')} ${safe(s.capacity)}`}</p>
    ${formats&&!s.cancelled?`<p><strong>${tourText('Singiel','Einzel')}</strong> · ${formats.singles} / 2 · ${formats.singles>=2?ready:pending}<br>
      <strong>${tourText('Debel','Doppel')}</strong> · ${formats.doubles} / 4 · ${formats.doubles>=4?ready:pending}</p>`:''}
    ${status?`<p>${tourText('Twój status','Dein Status')} · ${tourText(status[1],status[2])}</p>`:''}
    ${s.archived?`<details><summary>${tourText('Listy uczestników','Teilnehmerlisten')}</summary><div class="training-roster">${roster}</div></details>`:`<div class="training-roster">${roster}</div>`}
    ${s.can_join?`${weekend?preference:''}<div class="actions">
    ${!registered||weekend?`<button class="btn primary" onclick="trainingSignup('${safe(s.id)}',true,this,${weekend})">${registered?tourText('Zmień format','Format ändern'):tourText('Zapisz się','Anmelden')}</button>`:''}
    ${registered?`<button class="btn" onclick="trainingSignup('${safe(s.id)}',false,this,${weekend})">${tourText('Zrezygnuj','Abmelden')}</button>`:''}
    ${tourAdmin()?`<button class="btn" onclick="trainingForm('edit','${safe(s.id)}')">${tourText('Edytuj','Bearbeiten')}</button>
    <button class="btn" onclick="trainingCancel('${safe(s.id)}',this)">${tourText('Odwołaj trening','Training absagen')}</button>`:''}</div>`:''}</div>`;
}
async function trainingAction(name,params,button,status){
  button.disabled=true;
  try{
    const {error}=await tourDb.rpc(name,params);
    if(error)throw error;
    if(button.isConnected&&$('#modal').open)await openTraining();
  }catch(error){if(status?.isConnected)status.textContent=trainingError(error)}
  finally{button.disabled=false}
}
function trainingSignup(id,join,button,weekend=false){
  if(!tourMember?.active)return;
  if(!join&&!confirm(tourText('Zrezygnować z tego treningu?','Von diesem Training abmelden?')))return;
  const params={p_session:id,p_join:join};
  if(weekend&&join){
    const select=$('#training-format-'+id);
    if(!select.reportValidity())return;
    params.p_preference=select.value;
  }
  return trainingAction('bizons_training_signup',params,button,$('#trainingStatus'));
}
function trainingCancel(id,button){
  if(!tourAdmin()||!confirm(tourText('Odwołać tylko ten termin treningu?','Nur diesen Trainingstermin absagen?')))return;
  return trainingAction('bizons_training_cancel',{p_session:id},button,$('#trainingStatus'));
}
function trainingForm(mode,id=null){
  if(!tourAdmin()||!trainingOverview)return;
  const weekendCycle=mode==='weekendCycle',cycle=mode==='cycle'||weekendCycle,editing=mode==='edit';
  const current=(weekendCycle?trainingOverview.weekend_cycle:cycle?trainingOverview.cycle:trainingOverview.sessions.find(s=>s.id===id))||{};
  const title=weekendCycle?tourText('Cykl weekendowy','Wochenendserie'):cycle?tourText('Cykl czwartkowy','Donnerstagsserie'):editing?tourText('Edytuj trening','Training bearbeiten'):tourText('Dodaj trening weekendowy','Wochenendtraining hinzufügen');
  modal(`<section class="tour-dialog" id="trainingPanel"><h2>${title}</h2>
    ${cycle?`<p class="tiny">${tourText('Ustawienia cyklu dotyczą nowych terminów. Najbliższy, jeśli już widnieje na liście, zmienisz osobno przyciskiem Edytuj.','Die Serie gilt für neue Termine. Ein bereits angelegter Termin kann einzeln bearbeitet werden.')}</p>`:''}
    <form id="trainingForm">
    ${weekendCycle?`<label class="field">${tourText('Dzień weekendu','Wochenendtag')}<select name="weekday" required>
      <option value="">${tourText('Wybierz dzień','Tag wählen')}</option>
      <option value="6" ${current.weekday===6?'selected':''}>${tourText('Sobota','Samstag')}</option>
      <option value="7" ${current.weekday===7?'selected':''}>${tourText('Niedziela','Sonntag')}</option>
    </select></label>`:''}
    ${cycle?'':`<label class="field">${tourText('Data (weekend: sobota lub niedziela)','Datum (Wochenende: Samstag oder Sonntag)')}<input type="date" name="day" min="${safe(trainingOverview.today)}" value="${safe(current.day||'')}" ${editing?'readonly':''} required></label>`}
    <label class="field">${tourText('Godzina w Wiedniu','Uhrzeit in Wien')}<input type="time" name="time" value="${safe(current.starts_at?.slice(0,5)||'')}" required></label>
    <label class="field">${tourText('Sala lub adres','Halle oder Adresse')}<input name="venue" value="${safe(current.venue||'')}" maxlength="160" required></label>
    <label class="field">${tourText('Limit miejsc (puste = bez limitu)','Platzlimit (leer = unbegrenzt)')}<input type="number" name="capacity" min="${weekendCycle||mode==='weekend'||current.kind==='weekend'?2:1}" max="500" value="${safe(current.capacity??'')}"></label>
    <button class="btn primary" type="submit">${tourText('Zapisz','Speichern')}</button>
    <button class="btn" type="button" onclick="openTraining()">${tourText('Wróć','Zurück')}</button>
    <p class="tiny" role="status"></p></form></section>`);
  const form=$('#trainingForm');
  form.onsubmit=event=>{
    event.preventDefault();
    const values=new FormData(form);
    const status=form.querySelector('[role=status]');
    const params={p_time:values.get('time'),p_venue:values.get('venue').trim(),p_capacity:values.get('capacity')===''?null:Number(values.get('capacity'))};
    if(!params.p_venue){status.textContent=tourText('Wpisz salę lub adres.','Gib eine Halle oder Adresse an.');return;}
    if(!cycle){
      params.p_id=id;params.p_day=values.get('day');
      const weekday=new Date(params.p_day+'T12:00:00Z').getUTCDay();
      if(!editing&&weekday!==0&&weekday!==6){
        status.textContent=tourText('Wybierz sobotę albo niedzielę.','Wähle Samstag oder Sonntag.');return;
      }
    }
    if(weekendCycle)params.p_weekday=Number(values.get('weekday'));
    const rpc=weekendCycle?'bizons_training_save_weekend_cycle':cycle?'bizons_training_save_cycle':'bizons_training_save_session';
    return trainingAction(rpc,params,form.querySelector('[type=submit]'),status);
  };
}

function renderEvents(filter=tourFilter){
  syncTrainingNav();
  syncBizonsWelcome();
  syncSiteFeedViewer();
  renderSiteFeed();
  tourFilter=filter;
  const list=$('#eventList');
  if(tourState!=='ready'){
    const message=tourState==='unconfigured'?tourText('Terminarz pojawi się po uruchomieniu strefy członka.','Der Kalender erscheint nach der Freischaltung des Mitgliederbereichs.'):tourState==='error'?tourText('Nie udało się pobrać terminarza.','Der Kalender konnte nicht geladen werden.'):tourText('Wczytywanie terminarza…','Kalender wird geladen…');
    list.innerHTML='<p class="muted">'+message+'</p>';return;
  }
  const visible=tourEvents.filter(e=>e.state!=='draft'&&(filter==='all'||e.category===filter));
  list.innerHTML=visible.length?visible.map(e=>{
    const entry=tourEntries.find(r=>r.event_id===e.id);
    const now=Date.now();
    const canSign=e.state==='published'&&now>=Date.parse(e.opens_at)&&now<Date.parse(e.closes_at||e.starts_at);
    const action=entry&&now<Date.parse(e.starts_at)?`<button class="btn" onclick="tourWithdraw('${e.id}',this)">${tourText('Zrezygnuj','Abmelden')}</button>`:canSign?`<button class="btn primary" onclick="tourSignup('${e.id}',this)">${tourMember?.active?tourText('Zapisz się','Anmelden'):tourText('Zaloguj się, aby się zapisać','Zur Anmeldung einloggen')}</button>`:'';
    return `<article class="event live-event" id="tournament-${safe(e.id)}"><div><span class="badge">${tourText(...tourCategories[e.category])} · ${e.visibility==='public'?tourText('Publiczny','Öffentlich'):tourText('Dla członków','Für Mitglieder')}</span><h3>${safe(tourTitle(e))}</h3><div>${safe(tourEventDate(e))} · ${safe(e.venue)}</div><p class="tiny">${tourText('Zapisy','Anmeldung')}: ${safe(tourDate(e.opens_at))} – ${e.closes_at?safe(tourDate(e.closes_at)):tourText('do dnia turnieju','bis zum Turniertag')} · ${e.capacity===null?tourText('bez limitu','ohne Limit'):e.capacity+' '+tourText('miejsc','Plätze')}</p><p class="tiny">${e.waitlist?tourText('Lista rezerwowa aktywna','Warteliste aktiv'):''}</p><p class="tour-details">${safe(tourText(e.details,e.details_de||e.details))}</p><b>${e.state==='cancelled'?tourText('Odwołany','Abgesagt'):entry?tourEntryStatus(entry.status,e):canSign?'':tourText('Zapisy nie są otwarte','Anmeldung nicht geöffnet')}</b></div>${action}</article>`;
  }).join(''):`<p class="muted">${tourText('Brak turniejów w tym widoku.','Keine Turniere in dieser Ansicht.')}</p>`;
}
async function refreshTournaments(){
  const version=++tourVersion;
  const sessionResult=await tourDb.auth.getSession();
  if(sessionResult.error)throw sessionResult.error;
  const session=sessionResult.data.session;
  const readMember=()=>tourDb.from('bizons_members').select('user_id,display_name,role,active').eq('user_id',session.user.id).maybeSingle();
  let memberResponse=session?await readMember():{data:null};
  if(memberResponse.error)throw memberResponse.error;
  if(!memberResponse.data&&session?.user.user_metadata?.bizons_self_signup===true&&session.user.email_confirmed_at){
    const activation=await tourDb.rpc('bizons_activate_self_signup');
    if(!activation.error&&activation.data){
      memberResponse=await readMember();
      if(memberResponse.error)throw memberResponse.error;
    }
  }
  const [eventsResponse,entriesResponse]=await Promise.all([
    tourDb.from('bizons_events').select('*').order('starts_at'),
    memberResponse.data?.active?tourDb.from('bizons_entries').select('event_id,status').eq('user_id',session.user.id):{data:[]}
  ]);
  if(eventsResponse.error||entriesResponse.error)throw eventsResponse.error||entriesResponse.error;
  if(version!==tourVersion)return;
  tourSession=session;tourMember=memberResponse.data;tourEvents=eventsResponse.data;tourEntries=entriesResponse.data;tourState='ready';
  $('#loginBtn').textContent=tourMember?.active?tourText('Mój panel ↗','Mein Bereich ↗'):tourText('Strefa bizona ↗','Mitgliederbereich ↗');
  renderEvents();
  void loadSiteFeed();
}
function tourLoadFailure(){tourState='error';tourEvents=[];tourEntries=[];tourMember=null;renderEvents()}
async function openMember(eventKey=null,createAccount=false){
  await tourReady;
  if(tourState!=='ready'){
    modal(`<h2>${tourText('Strefa bizona','Mitgliederbereich')}</h2><p>${tourText('Strefa bizona jest chwilowo niedostępna.','Der Mitgliederbereich ist derzeit nicht verfügbar.')}</p>`);return;
  }
  if(tourSession){if(eventKey&&tourMember?.active)await tourSignup(eventKey);else dashboard();return}
  if(createAccount){openMemberSignup(eventKey);return}
  modal(`<section class="tour-dialog"><h2>${tourText('Strefa bizona','Mitgliederbereich')}</h2><p>${tourText('Zaloguj się lub załóż konto, aby zobaczyć treningi i turnieje dla członków.','Melde dich an oder erstelle ein Konto, um Trainings und Turniere für Mitglieder zu sehen.')}</p><form id="memberLogin">
    ${eventKey?`<p>${tourText('Po zalogowaniu zapiszemy Twoją chęć udziału w wybranym turnieju.','Nach der Anmeldung wird dein Interesse am gewählten Turnier gespeichert.')}</p>`:''}
    <label class="field">E-mail<input type="email" name="email" autocomplete="username" required></label>
    <label class="field">${tourText('Hasło','Passwort')}<input type="password" name="password" autocomplete="current-password" required></label>
    <button class="btn primary">${tourText('Zaloguj się','Anmelden')}</button>
    <button type="button" class="btn" id="memberSignupButton">${tourText('Załóż konto','Konto erstellen')}</button>
    <button type="button" class="btn" onclick="tourReset(this)">${tourText('Zresetuj hasło','Passwort zurücksetzen')}</button>
    <p class="tiny" id="tourFormError" role="status"></p></form></section>`);
  $('#memberSignupButton').onclick=()=>openMemberSignup(eventKey);
  $('#memberLogin').onsubmit=async e=>{
    e.preventDefault();
    const form=e.currentTarget, button=form.querySelector('button');
    const values=new FormData(form);
    button.disabled=true;
    try{
      const {error}=await tourDb.auth.signInWithPassword({email:values.get('email').trim(),password:values.get('password')});
      if(error)throw error;
      await refreshTournaments();
      if(form.isConnected){
        if(eventKey&&tourMember?.active)await tourSignup(eventKey,button);
        else dashboard();
      }
    }catch{if(form.isConnected)$('#tourFormError').textContent=tourText('Logowanie nie powiodło się. Sprawdź e-mail i hasło.','Anmeldung fehlgeschlagen. Prüfe E-Mail und Passwort.')}
    finally{button.disabled=false}
  };
}
function openMemberSignup(eventKey){
  modal(`<section class="tour-dialog"><h2>${tourText('Załóż konto Bizons','Bizons-Konto erstellen')}</h2>
    <p>${tourText('Potwierdź adres e-mail z otrzymanej wiadomości. Po zalogowaniu uzyskasz dostęp do treningów i turniejów dla członków.','Bestätige deine E-Mail-Adresse über den Link in der Nachricht. Nach der Anmeldung erhältst du Zugang zu Trainings und Turnieren für Mitglieder.')}</p>
    <form id="memberSignup">
      <label class="field">${tourText('Imię i nazwisko','Vor- und Nachname')}<input name="displayName" autocomplete="name" maxlength="80" required></label>
      <label class="field">E-mail<input type="email" name="email" autocomplete="email" required></label>
      <label class="field">${tourText('Hasło (min. 10 znaków)','Passwort (mind. 10 Zeichen)')}<input type="password" name="password" autocomplete="new-password" minlength="10" required></label>
      <button type="submit" class="btn primary">${tourText('Załóż konto','Konto erstellen')}</button>
      <button type="button" class="btn" id="memberSignupBack">${tourText('Wróć do logowania','Zurück zur Anmeldung')}</button>
      <p class="tiny" role="status"></p>
    </form></section>`);
  const form=$('#memberSignup');
  $('#memberSignupBack').onclick=()=>openMember(eventKey);
  form.onsubmit=async event=>{
    event.preventDefault();
    const fields=new FormData(form);
    const name=fields.get('displayName').trim();
    const status=form.querySelector('[role=status]');
    const button=form.querySelector('[type=submit]');
    if(button.disabled)return;
    if(!name){
      status.textContent=tourText('Wpisz imię i nazwisko.','Gib deinen Vor- und Nachnamen ein.');
      return;
    }
    button.disabled=true;
    try{
      const {data,error}=await tourDb.auth.signUp({
        email:fields.get('email').trim(),
        password:fields.get('password'),
        options:{data:{bizons_self_signup:true,bizons_display_name:name}}
      });
      if(error)throw error;
      if(data.session){
        const {error:logoutError}=await tourDb.auth.signOut();
        if(logoutError)throw logoutError;
        status.textContent=tourText('Potwierdzanie e-maila jest chwilowo niedostępne. Skontaktuj się z klubem.','Die E-Mail-Bestätigung ist derzeit nicht verfügbar. Wende dich an den Club.');
        return;
      }
      form.reset();
      status.textContent=tourText('Sprawdź skrzynkę pocztową i folder Spam. Otwórz link potwierdzający, a następnie zaloguj się.','Prüfe deinen Posteingang und Spam-Ordner. Öffne den Bestätigungslink und melde dich anschließend an.');
    }catch(error){
      status.textContent=error.status===429
        ?tourText('Za dużo prób. Odczekaj chwilę i spróbuj ponownie.','Zu viele Versuche. Warte kurz und versuche es erneut.')
        :tourText('Nie udało się założyć konta. Sprawdź dane. Jeśli masz już konto, zaloguj się lub zresetuj hasło.','Das Konto konnte nicht erstellt werden. Prüfe deine Angaben. Wenn du bereits ein Konto hast, melde dich an oder setze dein Passwort zurück.');
    }finally{button.disabled=false}
  };
}
async function tourReset(button){
  const input=$('#memberLogin input[name=email]');
  if(!input.value||!input.reportValidity()){input.focus();return}
  button.disabled=true;
  try{
    const {error}=await tourDb.auth.resetPasswordForEmail(input.value.trim(),{redirectTo:location.origin+location.pathname});
    if(error)throw error;
    if(button.isConnected)$('#tourFormError').textContent=tourText('Sprawdź skrzynkę pocztową.','Prüfe deinen Posteingang.');
  }catch(e){if(button.isConnected)$('#tourFormError').textContent=tourError(e)}
  finally{button.disabled=false}
}
function dashboard(){
  const items=tourEntries.map(r=>({r,event:tourEvents.find(e=>e.id===r.event_id)})).filter(x=>x.event);
  modal(`<section class="tour-dialog"><h2>${tourText('Mój panel','Mein Bereich')}</h2>
  ${tourMember?.active?`<p>${safe(tourMember.display_name)}</p><h3>${tourText('Moje zgłoszenia','Meine Anmeldungen')}</h3>${items.map(({r,event:e})=>`<div class="internal"><b>${safe(tourTitle(e))}</b> · ${e.state==='cancelled'?tourText('Odwołany','Abgesagt'):tourEntryStatus(r.status,e)}<p class="tiny">${safe(tourEventDate(e))}</p>${Date.now()<Date.parse(e.starts_at)?`<button class="btn" onclick="tourWithdraw('${e.id}',this,true)">${tourText('Zrezygnuj','Abmelden')}</button>`:''}</div>`).join('')||`<p>${tourText('Brak zgłoszeń.','Keine Anmeldungen.')}</p>`}
  <div class="actions"><a class="btn" href="#events" onclick="$('#modal').close()">${tourText('Przejdź do terminarza','Zum Kalender')}</a>${tourAdmin()?`<button class="btn primary" onclick="tourAdminPanel()">${tourText('Zarządzaj turniejami','Turniere verwalten')}</button>`:''}</div>`:`<p>${!tourMember&&tourSession?.user.user_metadata?.bizons_self_signup===true
    ?tourText('Nie udało się aktywować konta. Spróbuj ponownie się zalogować lub skontaktuj się z klubem.','Das Konto konnte nicht aktiviert werden. Melde dich erneut an oder wende dich an den Club.')
    :tourText('Konto czeka na aktywację przez klub.','Das Konto wartet auf die Aktivierung durch den Club.')}</p>`}
  <div class="actions"><button class="btn" onclick="tourPassword()">${tourText('Ustaw hasło','Passwort festlegen')}</button><button class="btn" onclick="tourLogout(this)">${tourText('Wyloguj się','Abmelden')}</button></div></section>`);
}
async function tourLogout(button){
  button.disabled=true;
  try{const {error}=await tourDb.auth.signOut();if(error)throw error;await refreshTournaments();if(button.isConnected)$('#modal').close()}
  catch(e){toast(tourError(e))}finally{button.disabled=false}
}
function tourPassword(){
  modal(`<section class="tour-dialog"><h2>${tourText('Ustaw hasło','Passwort festlegen')}</h2><form id="tourPasswordForm"><label class="field">${tourText('Nowe hasło (min. 10 znaków)','Neues Passwort (mind. 10 Zeichen)')}<input name="password" type="password" autocomplete="new-password" minlength="10" required></label><button class="btn primary">${tourText('Zapisz hasło','Passwort speichern')}</button><p role="status" class="tiny"></p></form></section>`);
  $('#tourPasswordForm').onsubmit=async e=>{
    e.preventDefault();const form=e.currentTarget,b=form.querySelector('button');b.disabled=true;
    try{const {error}=await tourDb.auth.updateUser({password:new FormData(form).get('password')});if(error)throw error;await refreshTournaments();if(form.isConnected)dashboard()}
    catch(err){if(form.isConnected)form.querySelector('[role=status]').textContent=tourError(err)}finally{b.disabled=false}
  };
}
async function tourSignup(id,button=null){
  if(!tourMember?.active){await openMember(id);return}
  if(button)button.disabled=true;
  const event=tourEvents.find(item=>item.id===id);
  try{
    const {data,error}=await tourDb.rpc('bizons_register',{event_key:id});
    if(error)throw error;
    await refreshTournaments();
    dashboard();
    toast(event?tourEntryStatus(data,event):tourStatus(data));
  }catch(e){
    const formError=$('#tourFormError');
    if(formError)formError.textContent=tourError(e);
    else toast(tourError(e));
  }finally{if(button)button.disabled=false}
}
async function tourWithdraw(id,button,fromPanel=false,memberKey=null){
  if(!confirm(tourText('Anulować zgłoszenie?','Anmeldung stornieren?')))return;
  button.disabled=true;
  try{
    const {error}=await tourDb.rpc('bizons_withdraw',{event_key:id,member_key:memberKey});
    if(error)throw error;
    await refreshTournaments();
    if(button.isConnected){if(memberKey)await tourRoster(id);else if(fromPanel)dashboard()}
    toast(tourText('Zgłoszenie anulowane.','Anmeldung storniert.'));
  }catch(e){toast(tourError(e))}finally{button.disabled=false}
}
function tourAdminPanel(){
  if(!tourAdmin())return;
  modal(`<section class="tour-dialog"><h2>${tourText('Zarządzanie turniejami','Turnierverwaltung')}</h2><button class="btn primary" onclick="tourEventForm()">${tourText('Dodaj turniej +','Turnier hinzufügen +')}</button>
  ${tourEvents.map(e=>`<div class="internal"><b>${safe(tourTitle(e))}</b> · ${safe(tourEventDate(e))}<p class="tiny">${({draft:tourText('Szkic','Entwurf'),published:tourText('Opublikowany','Veröffentlicht'),cancelled:tourText('Odwołany','Abgesagt')})[e.state]}</p><button class="btn" onclick="tourEventForm('${e.id}')">${tourText('Edytuj','Bearbeiten')}</button> <button class="btn" onclick="tourRoster('${e.id}')">${tourText('Uczestnicy','Teilnehmer')}</button></div>`).join('')}
  <div class="actions"><button class="btn" onclick="dashboard()">${tourText('Wróć do panelu','Zurück zum Bereich')}</button></div></section>`);
}
function tourEventForm(id=null){
  if(!tourAdmin())return;
  const e=tourEvents.find(x=>x.id===id)||{};
  const localDate=value=>{if(!value)return '';const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)};
  const field=(label,key,type='text',required=true,max='')=>`<label class="field">${label}<input name="${key}" type="${type}" value="${safe(type==='datetime-local'?localDate(e[key]):e[key]??'')}" ${required?'required':''} ${max?'maxlength="'+max+'"':''} ${type==='number'?'min="1" max="500" step="1"':''}></label>`;
  const select=(label,key,values)=>`<label class="field">${label}<select name="${key}">${Object.entries(values).map(([k,v])=>`<option value="${k}" ${e[key]===k?'selected':''}>${v}</option>`).join('')}</select></label>`;
  modal(`<section class="tour-dialog"><h2>${tourText('Dane turnieju','Turnierdaten')}</h2><form id="tourEventForm">
  ${field(tourText('Nazwa PL','Name PL'),'title','text',true,120)}
  ${field(tourText('Nazwa DE','Name DE'),'title_de','text',false,120)}
  ${field(tourText('Miejsce','Spielort'),'venue','text',true,160)}
  <p class="tiny">${tourText('Godziny wpisujesz w strefie czasowej urządzenia. Na stronie wyświetlamy czas Wiednia.','Eingabe in der Zeitzone deines Geräts. Anzeige im Kalender in Wiener Ortszeit.')}</p>
  ${field(tourText('Start turnieju','Turnierbeginn'),'starts_at','datetime-local')}
  <label><input type="checkbox" name="date_only" ${e.date_only?'checked':''}> ${tourText('Pokaż tylko dzień turnieju','Nur den Turniertag anzeigen')}</label>
  ${field(tourText('Otwarcie zapisów','Anmeldestart'),'opens_at','datetime-local')}
  ${field(tourText('Koniec zapisów (opcjonalnie)','Anmeldeschluss (optional)'),'closes_at','datetime-local',false)}
  ${field(tourText('Limit miejsc (puste pole = bez limitu)','Platzlimit (leer = unbegrenzt)'),'capacity','number',false)}
  ${select(tourText('Kategoria','Kategorie'),'category',Object.fromEntries(Object.entries(tourCategories).map(([k,v])=>[k,tourText(...v)])))}
  ${select(tourText('Widoczność','Sichtbarkeit'),'visibility',{public:tourText('Publiczny','Öffentlich'),members:tourText('Tylko członkowie','Nur Mitglieder')})}
  ${select(tourText('Stan','Status'),'state',{draft:tourText('Szkic','Entwurf'),published:tourText('Opublikowany','Veröffentlicht'),cancelled:tourText('Odwołany','Abgesagt')})}
  <label><input type="checkbox" name="waitlist" ${e.waitlist!==false?'checked':''}> ${tourText('Lista rezerwowa','Warteliste')}</label>
  <label class="field">${tourText('Opis / regulamin PL','Beschreibung / Regeln PL')}<textarea name="details" maxlength="3000">${safe(e.details||'')}</textarea></label>
  <label class="field">${tourText('Opis / regulamin DE','Beschreibung / Regeln DE')}<textarea name="details_de" maxlength="3000">${safe(e.details_de||'')}</textarea></label>
  <button class="btn primary">${tourText('Zapisz turniej','Turnier speichern')}</button> <button type="button" class="btn" onclick="tourAdminPanel()">${tourText('Wróć','Zurück')}</button><p role="status" class="tiny"></p>
  </form></section>`);
  $('#tourEventForm').onsubmit=async ev=>{
    ev.preventDefault();const form=ev.currentTarget,b=form.querySelector('button');b.disabled=true;
    try{
      const payload=Object.fromEntries(new FormData(form));
      for(const key of ['starts_at','opens_at','closes_at'])payload[key]=payload[key]?new Date(payload[key]).toISOString():null;
      if(!(payload.opens_at<(payload.closes_at||payload.starts_at)&&(!payload.closes_at||payload.closes_at<=payload.starts_at)))throw new Error('date_order');
      payload.capacity=payload.capacity===''?null:Number(payload.capacity);payload.waitlist=form.elements.waitlist.checked;payload.date_only=form.elements.date_only.checked;
      const {error}=await tourDb.rpc('bizons_save_event',{event_key:id,payload});if(error)throw error;
      await refreshTournaments();if(form.isConnected)tourAdminPanel();
    }catch(err){if(form.isConnected)form.querySelector('[role=status]').textContent=err.message==='date_order'?tourText('Otwarcie zapisów musi poprzedzać ich zamknięcie, a zamknięcie musi nastąpić najpóźniej przy starcie turnieju.','Anmeldestart muss vor Anmeldeschluss liegen. Anmeldeschluss darf nicht nach Turnierbeginn liegen.'):tourError(err)}
    finally{b.disabled=false}
  };
}
async function tourRoster(id){
  if(!tourAdmin())return;
  const event=tourEvents.find(e=>e.id===id);if(!event)return;
  modal(`<section class="tour-dialog"><h2>${safe(tourTitle(event))}</h2><div id="tourRosterBody" aria-live="polite">…</div><button class="btn" onclick="tourAdminPanel()">${tourText('Wróć','Zurück')}</button></section>`);
  const target=$('#tourRosterBody');
  try{
    const [entries,withdrawals]=await Promise.all([
      tourDb.from('bizons_entries').select('user_id,status,bizons_members(display_name)').eq('event_id',id).order('queue_id'),
      tourDb.from('bizons_withdrawals').select('withdrawn_at,bizons_members(display_name)').eq('event_id',id).order('withdrawn_at',{ascending:false})
    ]);
    if(entries.error||withdrawals.error)throw entries.error||withdrawals.error;
    const data=entries.data;
    if(!target.isConnected)return;
    target.innerHTML=['confirmed','waiting'].map(status=>{
      const group=data.filter(r=>r.status===status);
      return `<h3>${status==='confirmed'?(event.category==='away'?tourText('Chętni','Interessierte'):tourText('Potwierdzeni','Bestätigt')):tourText('Lista rezerwowa','Warteliste')} · ${group.length}</h3><ol>${group.map(r=>`<li>${safe(r.bizons_members?.display_name||'—')} <button class="textlink" onclick="tourWithdraw('${id}',this,false,'${r.user_id}')">${tourText('Anuluj','Stornieren')}</button></li>`).join('')}</ol>`;
    }).join('')+`<h3>${tourText('Rezygnacje','Zurückgezogene Meldungen')} · ${withdrawals.data.length}</h3><ol>${withdrawals.data.map(r=>`<li>${safe(r.bizons_members?.display_name||'—')} · ${safe(tourDate(r.withdrawn_at))}</li>`).join('')}</ol>`;
  }catch(e){target.textContent=tourError(e)}
}
async function initTournaments(){
  renderEvents();
  const config=window.BIZONS_TOURNAMENTS;
  if(!config?.url||!config?.publishableKey){tourState='unconfigured';renderEvents();return}
  try{
    if(!/^(sb_publishable_[\w-]+|eyJ[\w.-]+)$/.test(config.publishableKey))throw new Error('invalid_key');
    // Legacy JWTs are accepted only for the anonymous API role.
    if(config.publishableKey.startsWith('eyJ')){
      const payload=JSON.parse(atob(config.publishableKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      if(payload.role!=='anon')throw new Error('invalid_key');
    }
    const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    tourDb=createClient(config.url,config.publishableKey);
    tourDb.auth.onAuthStateChange((event,session)=>{
      if(event==='SIGNED_OUT'){tourMember=null;tourSession=null;tourEntries=[];tourEvents=[];renderEvents()}
      setTimeout(()=>refreshTournaments().then(()=>{
        if(event==='PASSWORD_RECOVERY'||(session&&sessionStorage.getItem('bizons-invite')==='1')){
          sessionStorage.removeItem('bizons-invite');tourPassword();
        }
      }).catch(tourLoadFailure),0);
    });
    await refreshTournaments();
  }catch{tourLoadFailure()}
}
if(/(?:[?#&])type=invite(?:&|$)/.test(location.hash+location.search)){
  try{sessionStorage.setItem('bizons-invite','1')}catch{}
}
const siteFeedData=JSON.parse($('#bizonsActivityData').textContent);
let siteFeedLive=[];
let siteFeedBefore=null;
let siteFeedHasMore=false;
let siteFeedRequest=0;
let siteFeedViewer=null;
let siteFeedOlderLoaded=false;
let siteFeedCutoff=null;
const siteFeedKinds={
  article:['Artykuł','Artikel'],babolat:['Babolat Cup','Babolat Cup'],
  album:['Galeria','Galerie'],technique:['Technika tygodnia','Technik der Woche'],ranking:['Rankingi','Ranglisten'],
  tournament:['Turniej','Turnier'],training:['Trening','Training'],partner:['Szukam partnera','Partnersuche']
};
const siteFeedActions={
  added:['Nowość','Neu'],updated:['Aktualizacja','Aktualisierung'],
  cancelled:['Odwołano','Abgesagt'],signup:['Nowe zgłoszenie','Neue Anmeldung'],
  withdrawal:['Rezygnacja','Abmeldung'],removed:['Usunięto','Entfernt']
};
function siteFeedItem(row){
  const kind=siteFeedKinds[row.kind];
  const action=siteFeedActions[row.action];
  if(!kind||!action||!Number.isFinite(Date.parse(row.at)))return null;
  let title=tourText(row.pl||'',row.de||row.pl||'');
  if(row.kind==='training')title=row.day?trainingName(row.trainingKind)+' · '+trainingDate(row.day):tourText('Zobacz trening','Training ansehen');
  if(row.kind==='partner'){
    title=row.action==='cancelled'
      ?tourText('Anulowano ogłoszenie o grze','Spielanzeige zurückgezogen')
      :tourText('Ogłoszenie o grze w badmintona','Anzeige für ein Badmintonspiel');
    if(row.day)title+=' · '+trainingDate(row.day);
  }
  if(row.kind==='tournament'){
    const event=tourEvents.find(item=>item.id===row.target);
    title=event?tourTitle(event):tourText('Sprawdź terminarz','Zum Turnierkalender');
  }
  const href=row.action==='removed'?(row.kind==='album'?'#gallery':row.kind==='technique'?'#technika-tygodnia':'#news'):
    row.kind==='ranking'?'#rankings':'#bizons-'+row.kind+'-'+encodeURIComponent(row.target);
  const timestamp=new Intl.DateTimeFormat(currentLanguage==='de'?'de-AT':'pl-PL',{
    dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Vienna'
  }).format(new Date(row.at));
  return {href,title,tag:tourText(...kind)+' · '+tourText(...action),timestamp};
}
function renderSiteFeed(){
  const rows=[...siteFeedData.events,...siteFeedLive].filter(row=>!siteFeedCutoff||Date.parse(row.at)>Date.parse(siteFeedCutoff)).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).map(siteFeedItem).filter(Boolean);
  const markup=(item,small)=>`<li><a href="${safe(item.href)}">${small
    ?`<strong title="${safe(item.title)}">${safe(item.title||item.tag)}</strong><time>${safe(item.tag)}</time>`
    :`<span><span class="bizons-feed-time">${safe(item.tag)} · ${safe(item.timestamp)}</span><strong>${safe(item.title||item.tag)}</strong></span><span aria-hidden="true">↗</span>`}</a></li>`;
  const empty=`<li class="tiny">${tourText('Na razie nie ma nowych wiadomości.','Zurzeit gibt es keine neuen Meldungen.')}</li>`;
  $('#bizonsFeedMini').innerHTML=rows.slice(0,3).map(row=>markup(row,true)).join('')||empty;
  $('#bizonsFeedList').innerHTML=rows.map(row=>markup(row,false)).join('')||empty;
  $('#bizonsFeedLoad').hidden=!siteFeedHasMore;
  $('#bizonsFeedClear').hidden=!tourAdmin();
}
function syncSiteFeedViewer(){
  const viewer=tourMember?.active?tourMember.user_id:null;
  if(siteFeedViewer!==viewer){
    siteFeedViewer=viewer;siteFeedLive=[];siteFeedBefore=null;siteFeedHasMore=false;siteFeedOlderLoaded=false;
    siteFeedRequest++;
  }
}
async function loadSiteFeed(older=false){
  if(!tourDb)return;
  syncSiteFeedViewer();
  const request=++siteFeedRequest;
  const button=$('#bizonsFeedLoad');
  button.disabled=true;
  try{
    const [result,settings]=await Promise.all([
      tourDb.rpc('bizons_visible_site_activity_page',{p_before:older?siteFeedBefore:null}),
      tourDb.rpc('bizons_site_feed_cutoff')
    ]);
    if(request!==siteFeedRequest)return;
    const {data,error}=result;
    if(error||settings.error)throw error||settings.error;
    if(siteFeedCutoff!==settings.data){
      siteFeedCutoff=settings.data;
      siteFeedLive=[];siteFeedBefore=null;siteFeedHasMore=false;siteFeedOlderLoaded=false;
      if(older){await loadSiteFeed();return;}
    }
    const page=data.map(row=>({id:row.id,kind:row.kind,target:row.entity_id,action:row.action,at:row.happened_at,day:row.training_day,trainingKind:row.training_kind}));
    if(older||siteFeedOlderLoaded){
      const seen=new Map([...siteFeedLive,...page].map(row=>[row.id,row]));
      siteFeedLive=[...seen.values()];
    }else siteFeedLive=page;
    if(older||!siteFeedOlderLoaded){siteFeedBefore=page.at(-1)?.id??null;siteFeedHasMore=page.length===50;}
    if(older)siteFeedOlderLoaded=true;
    $('#bizonsFeedStatus').textContent='';
    renderSiteFeed();
  }catch{
    if(request===siteFeedRequest)$('#bizonsFeedStatus').textContent=tourText('Zmiany treningów i turniejów są chwilowo niedostępne.','Training- und Turnieränderungen sind vorübergehend nicht verfügbar.');
  }finally{if(request===siteFeedRequest)button.disabled=false}
}
function jumpToBizonsSection(hash){
  if(!['#ostatnia-chwila','#technika-tygodnia'].includes(hash))return false;
  requestAnimationFrame(()=>{
    if(location.hash!==hash)return;
    const header=document.querySelector('body > header');
    const height=Math.max(0,header?.getBoundingClientRect().bottom??0);
    document.documentElement.style.setProperty('--bizons-header-offset',(Math.ceil(height)+12)+'px');
    $(hash)?.scrollIntoView({block:'start',behavior:'instant'});
  });
  return true;
}
async function clearBizonsFeed(){
  if(!tourAdmin()||!tourDb)return;
  if(!confirm(tourText('Ukryć dotychczasowe wiadomości w panelu dla wszystkich? Nowe zmiany nadal będą się pojawiać.','Alle bisherigen Meldungen für alle ausblenden? Neue Änderungen erscheinen weiterhin.')))return;
  const button=$('#bizonsFeedClear');
  const status=$('#bizonsFeedStatus');
  button.disabled=true;
  try{
    const {data,error}=await tourDb.rpc('bizons_site_feed_clear');
    if(error)throw error;
    siteFeedRequest++;
    siteFeedCutoff=data;siteFeedLive=[];siteFeedBefore=null;siteFeedHasMore=false;siteFeedOlderLoaded=false;
    $('#bizonsFeedLoad').disabled=false;
    renderSiteFeed();
    status.textContent=tourText('Panel testowy został wyczyszczony.','Die Testmeldungen wurden ausgeblendet.');
  }catch{
    status.textContent=tourText('Nie udało się wyczyścić panelu.','Die Meldungen konnten nicht ausgeblendet werden.');
  }finally{button.disabled=false}
}
function siteFeedRoute(){
  if(location.hash==='#babolat-cup'){openBabolatChronicle();return}
  if(jumpToBizonsSection(location.hash))return;
  const match=location.hash.match(/^#bizons-(article|babolat|album|training|tournament|technique|partner)-([\w-]+)$/);
  if(!match)return;
  const [,kind,id]=match;
  if(kind==='training'){
    if(tourMember?.active)openTraining(id);
    else openMember();
  }else if(kind==='partner'){
    if(tourMember?.active)openTraining(null,true,id);
    else openMember();
  }else if(kind==='tournament'){
    renderEvents('all');
    ($('#tournament-'+id)||$('#events')).scrollIntoView();
  }else if(kind==='album'){
    if(galleryConfig.albums.some(album=>album.id===id)){
      activeAlbum=id;activePhotoType='all';gallery();$('#gallery').scrollIntoView();
    }
  }else{
    const index=clubData.articles.findIndex(article=>article.id===id&&article.status!=='draft');
    if(index>=0){
      if(kind==='babolat')openBabolatFromFeed(id);
      else clubArticle(index);
    }else $(kind==='technique'?'#technika-tygodnia':'#news').scrollIntoView();
  }
}
$('#bizonsFeedLoad').addEventListener('click',()=>loadSiteFeed(true));
$('#bizonsFeedClear').addEventListener('click',clearBizonsFeed);
document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href^="#bizons-"],a[href="#ostatnia-chwila"],a[href="#technika-tygodnia"]');
  if(link&&link.hash===location.hash){event.preventDefault();siteFeedRoute();}
});
window.addEventListener('hashchange',siteFeedRoute);

renderSiteFeed();
tourReady=initTournaments();
void tourReady.then(siteFeedRoute);
window.setInterval(()=>{if(!document.hidden&&tourDb)void loadSiteFeed();},60000);
tabs('#eventTabs','filter',renderEvents);
window.addEventListener('focus',()=>{if(tourDb)refreshTournaments().catch(tourLoadFailure)});

