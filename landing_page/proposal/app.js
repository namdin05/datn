const menu = document.querySelector('.menu-button');
const sidebar = document.querySelector('.sidebar');
const links = [...document.querySelectorAll('.toc a')];
const sections = links.map(link => document.querySelector(link.hash)).filter(Boolean);
function closeMenu() {
  sidebar.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
}
menu.addEventListener('click', () => {
  menu.setAttribute('aria-expanded', String(sidebar.classList.toggle('open')));
});
links.forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && sidebar.classList.contains('open')) {
    closeMenu();
    menu.focus();
  }
});
document.addEventListener('click', event => {
  if (!sidebar.contains(event.target) && !menu.contains(event.target)) closeMenu();
});
document.querySelector('.print-button').addEventListener('click', () => window.print());
let scheduled = false;
function updateReading() {
  let current = sections[0];
  sections.forEach(section => { if (section.getBoundingClientRect().top <= 145) current = section; });
  links.forEach(link => {
    const active = link.hash === '#' + current.id;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  const available = document.documentElement.scrollHeight - window.innerHeight;
  document.querySelector('.reading-progress').style.width = (available > 0 ? Math.min(100, window.scrollY / available * 100) : 100) + '%';
  scheduled = false;
}
window.addEventListener('scroll', () => {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateReading); }
}, { passive: true });
window.addEventListener('resize', updateReading);
updateReading();
