# Instrukce: přidání značek do HTML souborů O nás

Generátor hledá 3 sady značek v každém ze 4 souborů.
Musíš je přidat ručně.

────────────────────────────────────────────────────
SOUBORY K ÚPRAVĚ:

1. o-nas/index.html
1. en/about/index.html
1. de/uber-uns/index.html
1. es/sobre-nosotros/index.html
   ────────────────────────────────────────────────────

## 1. I18N SCRIPT BLOK

Najdi v souboru blok `<script>` obsahující `const i18n = {`.
Obal celý tento `<script>` … `</script>` blok značkami:

  <!-- GEN:ONAS-I18N:START -->

  <script>
    const i18n = { ... };
    window.applyI18n = ...;
    document.addEventListener(...);
  </script>

  <!-- GEN:ONAS-I18N:END -->

Generátor celý tento blok nahradí aktuálními daty z Firestore.
Funkce applyI18n a DOMContentLoaded listener se tím také přepíší —
generátor je vloží automaticky.

## 2. TIMELINE POLOŽKY

Najdi v souboru místo kde jsou `.tl-item` divy:

  <div class="timeline">
    <div class="tl-item">...</div>
    <div class="tl-item">...</div>
    ...
  </div>

Přidej značky UVNITŘ `.timeline` divu, kolem všech `.tl-item` bloků:

  <div class="timeline">
    <!-- GEN:ONAS-TIMELINE:START -->
    <div class="tl-item">...</div>
    ...
    <!-- GEN:ONAS-TIMELINE:END -->
  </div>

## 3. KARTY OCENĚNÍ

Najdi `.awards-grid` div s `.award-card` kartami:

  <div class="awards-grid">
    <div class="award-card">...</div>
    ...
  </div>

Přidej značky UVNITŘ `.awards-grid`:

  <div class="awards-grid">
    <!-- GEN:ONAS-AWARDS:START -->
    <div class="award-card">...</div>
    ...
    <!-- GEN:ONAS-AWARDS:END -->
  </div>

## POZNÁMKA

Po prvním spuštění generátoru bude obsah mezi značkami
přepsán daty z Firestore. Stávající HTML obsah se ztratí
(ale data jsou importována do Firestore skriptem init-onas.js,
takže o nic nepřijdeš).