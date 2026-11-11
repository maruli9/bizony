
(() => {
  const dialog = document.getElementById('kontakt');
  const opener = document.getElementById('bzContactOpen');
  opener.addEventListener('click',event=>{
    event.preventDefault();
    if(!dialog.open)dialog.showModal();
  });
  dialog.querySelector('.bz-contact-close').addEventListener('click',()=>dialog.close());
  const form = document.getElementById('bzContactForm');
  const status = document.getElementById('bzContactStatus');
  const button = form.querySelector('button[type="submit"]');
  const heroArt = document.querySelector('.hero-art');
  const photo = heroArt && getComputedStyle(heroArt).backgroundImage.match(/url\("[^"]+"\)/);
  if(photo)document.querySelector('.bz-contact-shell').style.setProperty('--bz-contact-watermark',photo[0]);

  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(button.disabled)return;
    const data=new FormData(form);
    for(const key of ['name','email','message'])data.set(key,data.get(key).trim());
    if(!data.get('name')||!data.get('message')){
      status.textContent='Wpisz imię i treść wiadomości.';
      return;
    }
    data.set('topic',form.elements.topic.selectedOptions[0].textContent.trim());
    button.disabled=true;
    status.textContent='Wysyłanie wiadomości…';
    try{
      const response=await fetch(form.action,{
        method:'POST',headers:{Accept:'application/json'},body:data
      });
      if(!response.ok)throw Error('Submission rejected');
      form.reset();
      status.textContent='Wiadomość wysłana. Dziękujemy!';
    }catch{
      status.textContent='Nie udało się wysłać wiadomości. Spróbuj ponownie.';
    }finally{
      button.disabled=false;
    }
  });
})();
