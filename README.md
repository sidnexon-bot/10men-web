# 10men – Webové stránky

## Struktura souborů

```
10men/
├── index.html        ← Titulní stránka
├── o-nas.html        ← O nás / Historie
├── kalendar.html     ← Koncerty & akce
├── kontakt.html      ← Kontaktní formulář
├── style.css         ← Sdílený styl (všechny stránky)
├── shared.js         ← Navigace + patička (sdílené)
└── images/           ← Složka s obrázky (vytvoř ručně)
    ├── logo.png          ← Logo skupiny (kulaté, tmavé pozadí)
    ├── logo-lamen.png    ← Logo LAMEN
    └── foto-skupina.jpg  ← Skupinová fotografie
```

---

## 1. Příprava obrázků

Vytvoř složku `images/` a vlož do ní:
- **logo.png** – logo s kravátou (průhledné nebo tmavé pozadí), ideálně 200×200 px
- **logo-lamen.png** – logo LAMEN, ideálně 200×200 px
- **foto-skupina.jpg** – skupinová fotka, ideálně min. 1200 px šířka

---

## 2. Nastavení kontaktního formuláře (Formspree)

1. Jdi na [formspree.io](https://formspree.io) a vytvoř bezplatný účet
2. Vytvoř nový formulář, jako e-mail nastav `info@10men.cz`
3. Zkopíruj svůj **Form ID** (vypadá jako `xabc1234`)
4. V souboru `kontakt.html` najdi řádek:
   ```
   action="https://formspree.io/f/YOUR_FORM_ID"
   ```
   a nahraď `YOUR_FORM_ID` svým skutečným ID

Bezplatný plán Formspree: 50 zpráv/měsíc, žádná kreditní karta.

---

## 3. Nahrání na Forpsi hosting

### Přes Správce souborů (jednodušší)
1. Přihlaš se do klientského portálu Forpsi
2. Otevři **Správce souborů** pro svou doménu
3. Přejdi do složky `www` nebo `public_html`
4. Nahraj všechny soubory (index.html, style.css, shared.js, *.html)
5. Vytvoř složku `images/` a nahrej do ní obrázky

### Přes FTP
- Host: ftp.forpsi.com (nebo dle nastavení)
- Uživatel + heslo: viz Forpsi klientský portál
- Cílová složka: `/www/` nebo `/public_html/`

---

## 4. Přidání nového koncertu

Otevři `kalendar.html` a najdi komentář `JAK PŘIDAT KONCERT`.
Zkopíruj připravený blok, odkomentuj ho a uprav:
- datum (den + měsíc)
- název akce
- místo konání a čas
- popis

---

## 5. Jazyky (CZ / EN)

Přepínač jazyků je v horní liště. Překlady jsou v každém souboru
v sekci `const i18n = { cs: {...}, en: {...} }`.
Chceš přidat frázi? Přidej klíč do obou jazyků a použij
`data-i18n="klic"` na HTML elementu.

---

## Poznámky

- Web nevyžaduje žádný server, PHP ani databázi – funguje jako statické stránky
- Mobilní menu se otevírá hamburger tlačítkem (≡)
- Jazyk se ukládá do localStorage – uživatel ho nemusí vybírat pokaždé znovu
