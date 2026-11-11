
const $=s=>document.querySelector(s);
function setTheme(theme){if(!['original','navy','light'].includes(theme))theme='original';document.body.dataset.theme=theme;document.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===theme)));try{localStorage.setItem('bizons-theme',theme)}catch{}}
try{setTheme(localStorage.getItem('bizons-theme')||'original')}catch{setTheme('original')}
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}}function set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{toast('Przeglądarka nie pozwala zapisać danych.')}}let cart=[];
function modal(html){$('#modalBody').innerHTML=html;if(!$('#modal').open)$('#modal').showModal()}function toast(s){$('#toast').textContent=s;$('#toast').classList.remove('hidden');clearTimeout(window.tt);window.tt=setTimeout(()=>$('#toast').classList.add('hidden'),4200)}function showArchive(){clubArchive()}
function tabs(id,attr,fn){$(id).addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$(id).querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));fn(b.dataset[attr])})}
const galleryConfig=JSON.parse(document.getElementById('bizonsGalleryData').textContent);
const localPhotoUrls=new Map();
let activeAlbum=galleryConfig.albums[0]?.id||'all',activePhotoType='all',lightboxPhotos=[],lightboxIndex=0,lastPhotoTrigger=null,hoverTimer=null,suppressedHover=null;
function validRelativePath(path){return typeof path==='string' && path.length>0 && !path.startsWith('/') && !path.includes('\\') && !/[?#:]/.test(path) && path.split('/').every(part=>part && part!=='.' && part!=='..') && /\.(jpe?g|png|webp|avif|gif|svg)$/i.test(path)}
function photoUrl(path){return localPhotoUrls.get(path)||'./galerieBizonow/'+path.split('/').map(encodeURIComponent).join('/')}
function allPhotos(){return galleryConfig.albums.flatMap(a=>(a.photos||[]).filter(p=>validRelativePath(p.file)).map(p=>({...p,albumId:a.id,albumTitle:a.title,date:a.date,category:a.category})))}
function gallery(){
 const albums=galleryConfig.albums;
 $('#galleryTabs').innerHTML='<button class="event-album '+(activeAlbum==='all'?'selected':'')+'" data-event="all"><span>Wszystkie imprezy</span><small>'+allPhotos().length+' zdjęć</small></button>'+albums.map(a=>'<button class="event-album '+(activeAlbum===a.id?'selected':'')+'" data-event="'+safe(a.id)+'"><span>'+safe(a.title)+'</span><small>'+a.photos.length+' zdjęć</small></button>').join('');
 const chosen=albums.find(a=>a.id===activeAlbum);
 $('#selectedAlbumName').textContent=chosen?chosen.title:'Wszystkie imprezy';
 $('#albumSelect').innerHTML='<option value="all">Wszystkie albumy</option>'+albums.filter(a=>activePhotoType==='all'||a.category===activePhotoType).map(a=>`<option data-user-content value="${safe(a.id)}">${safe(a.title)}</option>`).join('');
 if(![...$('#albumSelect').options].some(o=>o.value===activeAlbum))activeAlbum='all';$('#albumSelect').value=activeAlbum;
 const list=allPhotos().filter(p=>(activeAlbum==='all'||p.albumId===activeAlbum)&&(activePhotoType==='all'||p.category===activePhotoType));
 lightboxPhotos=list;
 $('#galleryCount').textContent=list.length+' zdjęć · '+albums.length+' albumów';
 $('#albums').innerHTML=list.length?list.map((p,i)=>`<button class="photo-tile" data-photo="${i}" aria-label="Otwórz zdjęcie: ${safe(p.alt||p.caption||p.albumTitle)}"><img src="${safe(photoUrl(p.file))}" alt="${safe(p.alt||p.caption||p.albumTitle)}" loading="lazy" decoding="async"><span class="photo-overlay"><b data-user-content>${safe(p.caption||p.albumTitle)}</b><small>${safe(p.albumTitle)}${p.date?' · '+safe(p.date):''}</small><span>Otwórz podgląd ↗</span></span></button>`).join(''):'<div class="empty">Albumy pojawią się po publikacji zdjęć przez klub.</div>';
 $('#albums').querySelectorAll('.photo-tile').forEach(tile=>{
  const img=tile.querySelector('img');img.onerror=()=>{tile.classList.add('photo-missing');img.hidden=true;const msg=document.createElement('span');msg.textContent='Nie znaleziono pliku: '+list[Number(tile.dataset.photo)].file;tile.append(msg)};
  tile.addEventListener('click',()=>{clearTimeout(hoverTimer);openPhoto(Number(tile.dataset.photo),tile)});

 });
}
function openPhoto(i,trigger){if(!lightboxPhotos.length)return;clearTimeout(hoverTimer);lastPhotoTrigger=trigger;lightboxIndex=i;renderLightbox();if(!$('#lightbox').open)$('#lightbox').showModal()}
function renderLightbox(){const p=lightboxPhotos[lightboxIndex];$('#lightboxImg').src=photoUrl(p.file);$('#lightboxImg').alt=p.alt||p.caption||p.albumTitle;$('#lightboxCaption').textContent=(p.caption||p.albumTitle)+' · '+(lightboxIndex+1)+' / '+lightboxPhotos.length;$('#lightboxAlbum').textContent=p.albumTitle}
function closeLightbox(){suppressedHover=lastPhotoTrigger;$('#lightbox').close();lastPhotoTrigger?.focus({preventScroll:true})}
function stepPhoto(d){lightboxIndex=(lightboxIndex+d+lightboxPhotos.length)%lightboxPhotos.length;renderLightbox()}
$('#lightbox').addEventListener('click',()=>closeLightbox());
$('#lightbox').addEventListener('cancel',e=>{e.preventDefault();closeLightbox()});
$('#lightbox').addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();stepPhoto(1)}if(e.key==='ArrowLeft'){e.preventDefault();stepPhoto(-1)}});
$('#albumSelect').onchange=e=>{activeAlbum=e.target.value;gallery()};
$('#galleryTabs').addEventListener('click',e=>{const b=e.target.closest('[data-event]');if(!b)return;activeAlbum=b.dataset.event;activePhotoType='all';gallery()});

gallery();
// Produkty sklepu i osadzone zdjęcia
const products = [
  {
    "id": "badminton",
    "cat": "sport",
    "pl": "Figurka badmintonisty",
    "de": "Badmintonfigur",
    "price": 50,
    "range": null,
    "description": "Rzeźbiarska interpretacja ruchu na korcie.",
    "descriptionDe": "Skulpturale Interpretation einer Bewegung auf dem Badmintoncourt.",
    "images": [
      "images/9157e5319d7208d1.webp",
      "images/d4306dfc05aed40b.webp",
      "images/7103efa5e79d289c.webp"
    ]
  },
  {
    "id": "keyring",
    "cat": "club",
    "pl": "Brelok Bizony",
    "de": "Bizons-Schlüsselanhänger",
    "price": 20,
    "range": null,
    "description": "Klubowy akcent do kluczy lub torby.",
    "descriptionDe": "Ein Club-Akzent für Schlüssel oder Tasche.",
    "images": []
  },
  {
    "id": "phone",
    "cat": "desk",
    "pl": "Podstawka pod telefon",
    "de": "Smartphone-Ständer",
    "price": 40,
    "range": null,
    "description": "Biurkowa podstawka z motywem węża.",
    "descriptionDe": "Schreibtischständer mit Schlangenmotiv.",
    "images": [
      "images/63af6e3f5fc5692a.webp"
    ]
  },
  {
    "id": "decision",
    "cat": "desk",
    "pl": "Decyzyjnik",
    "de": "Entscheidungshelfer",
    "price": 35,
    "range": null,
    "description": "Dwa przykłady wzornictwa biurkowego.",
    "descriptionDe": "Zwei Designbeispiele für den Schreibtisch.",
    "images": [
      "images/311bb91d4422b9ce.webp",
      "images/72a450cb615472c8.webp"
    ]
  },
  {
    "id": "cardholder",
    "cat": "desk",
    "pl": "Wizytownik",
    "de": "Visitenkartenhalter",
    "price": 40,
    "range": null,
    "description": "Geometryczny stojak na wizytówki.",
    "descriptionDe": "Geometrischer Halter für Visitenkarten.",
    "images": [
      "images/5b11c90705ec4466.webp"
    ]
  },
  {
    "id": "tennis",
    "cat": "sport",
    "pl": "Figurka tenisistki",
    "de": "Figur einer Tennisspielerin",
    "price": 50,
    "range": null,
    "description": "Geometryczna sylwetka tenisistki w trakcie uderzenia.",
    "descriptionDe": "Geometrische Silhouette einer Tennisspielerin beim Schlag.",
    "images": [
      "images/c153ed883ceccc8a.webp"
    ]
  },
  {
    "id": "runner",
    "cat": "sport",
    "pl": "Figurka biegacza",
    "de": "Läuferfigur",
    "price": 70,
    "range": null,
    "description": "Dynamiczna forma inspirowana sprintem.",
    "descriptionDe": "Dynamische Form, inspiriert vom Sprint.",
    "images": [
      "images/e14a6235e8890047.webp"
    ]
  },
  {
    "id": "bison",
    "cat": "club",
    "pl": "Figurka bizona",
    "de": "Bisonfigur",
    "price": 70,
    "range": null,
    "description": "Figurka inspirowana symbolem klubu.",
    "descriptionDe": "Figur, inspiriert vom Clubsymbol.",
    "images": []
  },
  {
    "id": "medals",
    "cat": "awards",
    "pl": "Medale",
    "de": "Medaillen",
    "price": null,
    "range": "10–30",
    "description": "Nagrody turniejowe. W zapytaniu podaj model i liczbę sztuk.",
    "descriptionDe": "Turnierauszeichnungen. Gib in der Anfrage Modell und Stückzahl an.",
    "images": []
  },
  {
    "id": "trophies",
    "cat": "awards",
    "pl": "Statuetki okolicznościowe",
    "de": "Trophäen für besondere Anlässe",
    "price": null,
    "range": "50–350",
    "description": "Nagrody sportowe i rzeźbiarskie projekty na inne okazje.",
    "descriptionDe": "Sportpreise und skulpturale Entwürfe für weitere Anlässe.",
    "images": [
      "images/230eb85f124a7a9b.webp",
      "images/5c48afe6a68d4112.webp",
      "images/d33498df09372d2f.webp",
      "images/cecd61746f17051b.webp",
      "images/36083a7d1521f7cb.webp",
      "images/d1ba4ac709dbab35.webp",
      "images/307c13acb7dc46b0.webp"
    ]
  },
  {
    "id": "boxes",
    "cat": "gift",
    "pl": "Szkatułki na biżuterię i drobiazgi",
    "de": "Schatullen für Schmuck und Kleinigkeiten",
    "price": null,
    "range": "60–150",
    "description": "Modele do przechowywania biżuterii i pamiątek.",
    "descriptionDe": "Modelle für Schmuck und Erinnerungsstücke.",
    "images": []
  },
  {
    "id": "custom",
    "cat": "custom",
    "pl": "Figurki na indywidualne zamówienie",
    "de": "Figuren auf Anfrage",
    "price": null,
    "range": null,
    "description": "Mozart, gitara, skrzypce, wędkarstwo, golf i inne motywy.",
    "descriptionDe": "Mozart, Gitarre, Geige, Angeln, Golf und weitere Motive.",
    "images": [
      "images/6288f2941799499d.webp",
      "images/de88cdde53951a9c.webp"
    ]
  }
];
const shopText=(pl,de)=>document.documentElement.lang==='de'?de:pl;
const shopCategories={
  all:['Wszystkie','Alle'], sport:['Figurki sportowe','Sportfiguren'],
  club:['Bizony','Bizons'], desk:['Na biurko','Für den Schreibtisch'],
  awards:['Medale i statuetki','Medaillen und Trophäen'],
  gift:['Na prezent','Geschenke'], custom:['Na zamówienie','Auf Anfrage']
};
let shopCategory='all';
const shopName=p=>shopText(p.pl,p.de);
const shopPrice=p=>p.price!==null?p.price+' €':p.range?p.range+' €':shopText('Wycena indywidualna','Preis auf Anfrage');
cart=get('bizons-shop-cart-v1',[]);
if(!Array.isArray(cart))cart=[];
cart=cart.filter(item=>products.some(p=>p.id===item.id));
function visibleShopProducts(){
  return products.filter(p=>shopCategory==='all'||p.cat===shopCategory);
}
function renderShop(){
  $('#shopFilters').innerHTML=Object.entries(shopCategories).map(([key,labels])=>`<button type="button" class="tab ${key===shopCategory?'active':''}" aria-pressed="${key===shopCategory}" onclick="filterShop('${key}')">${shopText(...labels)}</button>`).join('');
  $('#products').innerHTML=visibleShopProducts().map(p=>`<button class="shop-gallery-tile" type="button" aria-label="${safe(shopName(p))}" onclick="chooseProduct('${p.id}')">${p.images.length
    ? `<img src="${safe(p.images[0])}" alt="${safe(shopName(p))}" loading="lazy" decoding="async">`
    : `<span class="shop-gallery-placeholder">${safe(shopName(p))}</span>`}</button>`).join('');
  updateCart();
}
function filterShop(category){shopCategory=category;renderShop();$('#shopFilters .active')?.focus({preventScroll:true})}

let shopPreview = null;
function chooseProduct(id, imageIndex=0){
  const p=products.find(item=>item.id===id);
  if(!p)return;
  shopPreview={id,imageIndex};
  modal(`<section class="shop-redbox-detail" data-user-content>
    ${p.images.length?`<button type="button" class="shop-redbox-image" aria-label="${shopText('Zamknij podgląd','Vorschau schließen')}" onclick="$('#modal').close()">
      <img src="${safe(p.images[imageIndex])}" alt="${safe(shopName(p))}">
    </button>`:''}
    <div class="shop-redbox-info">
      <h2 class="shop-redbox-title">${safe(shopName(p))}</h2>
      <div class="shop-redbox-price">${safe(shopPrice(p))}</div>
      <p class="shop-redbox-desc">${safe(shopText(p.description,p.descriptionDe))}</p>
      ${p.images.length>1?`<div class="shop-redbox-controls">
        <button type="button" onclick="stepShopPhoto(-1)" aria-label="${shopText('Poprzednie zdjęcie','Vorheriges Bild')}">‹</button>
        <span id="shopPhotoPosition" aria-live="polite">${imageIndex+1} / ${p.images.length}</span>
        <button type="button" onclick="stepShopPhoto(1)" aria-label="${shopText('Następne zdjęcie','Nächstes Bild')}">›</button>
      </div>`:''}
      <p class="tiny">${p.cat==='custom'?shopText('Termin i cena do uzgodnienia.','Preis und Termin nach Vereinbarung.'):shopText('Dostępność do potwierdzenia. Jeśli produkt wymaga przygotowania, może być gotowy do wysyłki w ciągu tygodnia.','Verfügbarkeit nach Bestätigung. Falls eine Anfertigung nötig ist, kann der Artikel innerhalb einer Woche versandbereit sein.')}</p>
      ${p.images.length>1||p.price===null?`<label class="field">${shopText('Model lub uwagi','Modell oder Anmerkungen')}<input id="shopVariant" maxlength="120" placeholder="${shopText('Np. wizualizacja 2','Z. B. Visualisierung 2')}"></label>`:''}
      <label class="field">${shopText('Liczba sztuk','Stückzahl')}<input id="shopQuantity" type="number" min="1" max="99" value="1"></label>
      <button class="btn primary" onclick="addCart('${p.id}')">${p.price===null?shopText('Dodaj do zapytania','Zur Anfrage hinzufügen'):shopText('Dodaj do koszyka','In den Warenkorb')}</button>
    </div>
  </section>`);
}
function stepShopPhoto(direction){
  if(!shopPreview||!$('.shop-redbox-detail'))return;
  const p=products.find(item=>item.id===shopPreview.id);
  if(!p||p.images.length<2)return;
  shopPreview.imageIndex=(shopPreview.imageIndex+direction+p.images.length)%p.images.length;
  $('.shop-redbox-image img').src=p.images[shopPreview.imageIndex];
  $('#shopPhotoPosition').textContent=`${shopPreview.imageIndex+1} / ${p.images.length}`;
}
$('#modal').addEventListener('keydown',event=>{
  if(!$('.shop-redbox-detail')||event.target.closest('input, textarea, select'))return;
  const direction=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;
  if(!direction)return;
  event.preventDefault();
  const visible=visibleShopProducts().filter(p=>p.images.length);
  const index=visible.findIndex(p=>p.id===shopPreview?.id);
  if(index!==-1&&visible.length>1){
    chooseProduct(visible[(index+direction+visible.length)%visible.length].id);
    $('.shop-redbox-image').focus({preventScroll:true});
  }
});
$('#modal').addEventListener('click',event=>{
  if(event.target===$('#modal')&&$('.shop-redbox-detail'))$('#modal').close();
});
function addCart(id){
  const input=$('#shopQuantity');
  if(!input.reportValidity())return;
  const quantity=Number(input.value);
  if(!Number.isInteger(quantity)||quantity<1||quantity>99)return;
  const variant=$('#shopVariant')?.value.trim()||'';
  const row=cart.find(c=>c.id===id&&c.variant===variant);
  if(row)row.quantity=Math.min(99,row.quantity+quantity);
  else cart.push({id,quantity,variant});
  set('bizons-shop-cart-v1',cart);updateCart();$('#modal').close();toast(shopText('Dodano do koszyka','Zum Warenkorb hinzugefügt'));
}
function updateCart(){$('#cartCount').textContent=cart.reduce((sum,c)=>sum+c.quantity,0)}
function removeCart(i){cart.splice(i,1);set('bizons-shop-cart-v1',cart);updateCart();openCart()}
function shopSubtotal(){return cart.reduce((sum,c)=>sum+(products.find(p=>p.id===c.id).price??0)*c.quantity,0)}
function openCart(){
  modal(`<section class="shop-detail" data-user-content><h2>${shopText('Twój klubowy koszyk','Dein Club-Warenkorb')}</h2>${cart.length?cart.map((c,i)=>{
    const p=products.find(x=>x.id===c.id);
    return `<p>${c.quantity} × ${safe(shopName(p))}${c.variant?' · '+safe(c.variant):''} · ${p.price===null?shopText('do wyceny','Preis auf Anfrage'):(p.price*c.quantity)+' €'} <button class="textlink" onclick="removeCart(${i})">${shopText('Usuń','Entfernen')}</button></p>`;
  }).join('')+`<h3>${shopText('Suma pozycji z ustaloną ceną','Summe der Artikel mit Festpreis')}: ${shopSubtotal()} €</h3>
    <label class="field">${shopText('Kraj dostawy','Lieferland')}<select id="shopCountry" onchange="set('bizons-shop-country',this.value)"><option value="AT">${shopText('Austria','Österreich')}</option><option value="PL">${shopText('Polska','Polen')}</option></select></label>
    <p class="tiny">${shopText('Pobierzesz listę do przesłania sprzedawcy. Cena modeli na wycenę i koszt wysyłki wymagają potwierdzenia.','Du erhältst eine Liste für den Verkäufer. Preise auf Anfrage und Versandkosten müssen bestätigt werden.')}</p><button class="btn primary" onclick="downloadShopInquiry()">${shopText('Pobierz zapytanie','Anfrage herunterladen')} ↓</button>`:`<p class="muted">${shopText('Koszyk jest pusty.','Dein Warenkorb ist leer.')}</p>`}</section>`);
  if($('#shopCountry'))$('#shopCountry').value=get('bizons-shop-country','AT')==='PL'?'PL':'AT';
}
function downloadShopInquiry(){
  const country=$('#shopCountry').value==='PL'?shopText('Polska','Polen'):shopText('Austria','Österreich');
  const lines=cart.map(c=>{
    const p=products.find(x=>x.id===c.id);
    return `${c.quantity} × ${shopName(p)}${c.variant?' ('+c.variant+')':''} · ${p.price===null?shopText('do wyceny','Preis auf Anfrage'):(p.price*c.quantity)+' €'}`;
  });
  const body=[shopText('Zapytanie do sklepu Vienna Bizons Club','Anfrage an den Shop des Vienna Bizons Club'),country,'',...lines,'',shopText('Suma pozycji z ustaloną ceną','Summe der Artikel mit Festpreis')+': '+shopSubtotal()+' €',shopText('Proszę o potwierdzenie dostępności, ceny i kosztu dostawy.','Bitte bestätigen Sie Verfügbarkeit, Preis und Versandkosten.')].join('\n');
  const url=URL.createObjectURL(new Blob([body],{type:'text/plain;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='bizons-zapytanie.txt';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
}

