
(() => {
  const dropdown = document.querySelector('.bizons-menu-dropdown');
  const button = dropdown.querySelector('.menu-btn');
  const nav = document.getElementById('mainNavigation');
  const soundSwitch = document.getElementById('bizonsMenuSound');
  const shopNotice = document.getElementById('bizonsShopNotice');
  shopNotice.addEventListener('close', () => button.focus({preventScroll:true}));
  const soundPreference = 'bizons-menu-sound';
  let soundEnabled = false;
  let clickSound;

  try { soundEnabled = localStorage.getItem(soundPreference) === 'on'; } catch {}
  soundSwitch.setAttribute('aria-checked', String(soundEnabled));

  function playMenuSound() {
    if (!soundEnabled) return;
    clickSound ??= new Audio('media/16c628e21435449d.wav');
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  }

  soundSwitch.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundSwitch.setAttribute('aria-checked', String(soundEnabled));
    try { localStorage.setItem(soundPreference, soundEnabled ? 'on' : 'off'); } catch {}
    if (soundEnabled) playMenuSound();
    else clickSound?.pause();
  });

  function highlightMenuLink(target) {
    const link = target?.closest('a');
    const highlighted = Boolean(link && nav.contains(link));
    if (highlighted) nav.style.setProperty('--menu-line-y', (link.offsetTop + link.offsetHeight - 5) + 'px');
    nav.classList.toggle('has-menu-highlight', highlighted);
  }

  nav.addEventListener('pointerover', event => {
    if (event.pointerType === 'mouse') highlightMenuLink(event.target);
  });
  nav.addEventListener('pointerleave', () => highlightMenuLink(nav.querySelector('a:focus-visible')));
  nav.addEventListener('pointerdown', event => highlightMenuLink(event.target));
  nav.addEventListener('focusin', event => highlightMenuLink(event.target));

  function setMenuOpen(open) {
    nav.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
    if (!open) highlightMenuLink(null);
  }

  button.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') setMenuOpen(true);
  });
  dropdown.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' && !nav.contains(document.activeElement)) setMenuOpen(false);
  });
  button.addEventListener('click', () => {
    setMenuOpen(!nav.classList.contains('open'));
    playMenuSound();
  });
  nav.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    playMenuSound();
    setMenuOpen(false);
    if (nav.contains(document.activeElement)) button.focus({preventScroll:true});
    if (link.getAttribute('aria-controls') === shopNotice.id) {
      event.preventDefault();
      if (!shopNotice.open) shopNotice.showModal();
    }
  });
  dropdown.addEventListener('focusout', event => {
    if (!dropdown.contains(event.relatedTarget)) setMenuOpen(false);
  });
  document.addEventListener('pointerdown', event => {
    if (!dropdown.contains(event.target)) setMenuOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !nav.classList.contains('open')) return;
    setMenuOpen(false);
    if (dropdown.contains(document.activeElement)) button.focus({preventScroll:true});
  });
})();
