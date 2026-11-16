/* Režim vzhledu: uložená volba, jinak nastavení systému. Načítá se v <head>, aby stránka nebliknula. */
(function () {
  var t = null;
  try { t = localStorage.getItem('10men-theme'); } catch (e) {}
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  window.toggleTheme = function () {
    var d = document.documentElement, cur = d.getAttribute('data-theme');
    if (!cur) cur = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var next = cur === 'dark' ? 'light' : 'dark';
    d.setAttribute('data-theme', next);
    try { localStorage.setItem('10men-theme', next); } catch (e) {}
  };
})();
