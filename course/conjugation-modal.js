/* ============================================================================
   conjugation-modal.js — shared verb-conjugation cheatsheet component
   ----------------------------------------------------------------------------
   One source of truth for the cheatsheet. It has two modes:

   1. Modal mode (used by lessons). Just include:
          <script src="conjugation-modal.js"></script>
      The script injects a fixed floating button (bottom-right). Clicking it
      opens a native <dialog> whose contents live in a shadow root, so the
      cheatsheet styles never clash with the lesson's styles.

   2. Inline mode (used by conjugation.html). If the page contains
          <div id="conjugation-root"></div>
      the cheatsheet mounts itself inline instead of showing a button.

   No build step, no internet dependency. Reload the page after editing.
   ========================================================================= */
(function () {
  "use strict";

  if (window.__conjugationCheatsheetLoaded) return;
  window.__conjugationCheatsheetLoaded = true;

  /* ---------- reference data ---------- */
  var PRON = [
    {id:'yo',    label:'yo',                  ex:'yo'},
    {id:'tu',    label:'tú',                  ex:'tú'},
    {id:'el',    label:'él / ella / usted',   ex:'él'},
    {id:'nos',   label:'nosotros / nosotras', ex:'nosotros'},
    {id:'vos',   label:'vosotros / vosotras', ex:'vosotros'},
    {id:'ellos', label:'ellos / ellas / ustedes', ex:'ellos'}
  ];
  var NO_PRON = {id:'nf', label:'—', filterLabel:'— (no pronoun)', ex:''};
  var PRON_ALL = PRON.concat([NO_PRON]);

  var PRES  = {ar:['o','as','a','amos','áis','an'], er:['o','es','e','emos','éis','en'], ir:['o','es','e','imos','ís','en']};
  var PRET  = {ar:['é','aste','ó','amos','asteis','aron'], er:['í','iste','ió','imos','isteis','ieron'], ir:['í','iste','ió','imos','isteis','ieron']};
  var IMPERF= {ar:['aba','abas','aba','ábamos','abais','aban'], er:['ía','ías','ía','íamos','íais','ían'], ir:['ía','ías','ía','íamos','íais','ían']};
  var FUT   = {ar:['é','ás','á','emos','éis','án'], er:['é','ás','á','emos','éis','án'], ir:['é','ás','á','emos','éis','án']};
  var COND  = {ar:['ía','ías','ía','íamos','íais','ían'], er:['ía','ías','ía','íamos','íais','ían'], ir:['ía','ías','ía','íamos','íais','ían']};
  var SUBJP = {ar:['e','es','e','emos','éis','en'], er:['a','as','a','amos','áis','an'], ir:['a','as','a','amos','áis','an']};
  var SUBJI = {ar:['ara','aras','ara','áramos','arais','aran'], er:['iera','ieras','iera','iéramos','ierais','ieran'], ir:['iera','ieras','iera','iéramos','ierais','ieran']};
  var IMPER = {ar:['a','e','emos','ad','en'], er:['e','a','amos','ed','an'], ir:['e','a','amos','id','an']};
  var MODELS = {ar:'hablar', er:'comer', ir:'vivir'};

  var SECTIONS = [
    {id:'presente', name:'Presente', en:'present', level:'A1', note:'Regular -ar / -er / -ir verbs. Watch the irregular yo form of many common verbs.'},
    {id:'preterito', name:'Pretérito indefinido', en:'preterite', level:'A2', note:'Spelling changes in the yo form: buscar → busqué, llegar → llegué, empezar → empecé.'},
    {id:'imperfecto', name:'Imperfecto', en:'imperfect', level:'A2', note:'Only three verbs are irregular here: ser, ir, ver.'},
    {id:'futuro', name:'Futuro simple', en:'future', level:'A2', note:'The endings attach to the whole infinitive.'},
    {id:'condicional', name:'Condicional simple', en:'conditional', level:'B1', note:'Same irregular stems as the future.'},
    {id:'perfecto', name:'Pretérito perfecto', en:'present perfect', level:'A2', note:'haber (present) + participle. The participle never changes for gender or number.'},
    {id:'pluscuamperfecto', name:'Pluscuamperfecto', en:'pluperfect', level:'B1', note:'haber (imperfect) + participle.'},
    {id:'subj-pres', name:'Presente de subjuntivo', en:'present subjunctive', level:'B1', note:'-ar verbs take -e; -er / -ir verbs take -a.'},
    {id:'subj-imp', name:'Imperfecto de subjuntivo', en:'imperfect subjunctive', level:'B2', note:'The -ra forms shown; the -se forms (hablase…) are equally correct.'},
    {id:'imperativo', name:'Imperativo (afirmativo)', en:'affirmative command', level:'A2', note:'No yo form. Negative commands use the present subjunctive.'},
    {id:'inf', name:'Infinitivo', en:'infinitive', level:'A1'},
    {id:'ger', name:'Gerundio', en:'gerund (-ing form)', level:'A2'},
    {id:'part', name:'Participio', en:'past participle', level:'A2'}
  ];

  var IRREG = [
    {v:'ser', en:'to be (identity)', cls:'er', p:{
      presente:'soy|eres|es|somos|sois|son',
      preterito:'fui|fuiste|fue|fuimos|fuisteis|fueron',
      imperfecto:'era|eras|era|éramos|erais|eran',
      'subj-pres':'sea|seas|sea|seamos|seáis|sean',
      'subj-imp':'fuera|fueras|fuera|fuéramos|fuerais|fueran',
      imperativo:'—|sé|sea|seamos|sed|sean',
      part:'sido', ger:'siendo'}},
    {v:'estar', en:'to be (state)', cls:'ar', p:{
      presente:'estoy|estás|está|estamos|estáis|están',
      preterito:'estuve|estuviste|estuvo|estuvimos|estuvisteis|estuvieron',
      'subj-pres':'esté|estés|esté|estemos|estéis|estén',
      'subj-imp':'estuviera|estuvieras|estuviera|estuviéramos|estuvierais|estuvieran',
      imperativo:'—|está|esté|estemos|estad|estén'}},
    {v:'ir', en:'to go', cls:'ir', p:{
      presente:'voy|vas|va|vamos|vais|van',
      preterito:'fui|fuiste|fue|fuimos|fuisteis|fueron',
      imperfecto:'iba|ibas|iba|íbamos|ibais|iban',
      'subj-pres':'vaya|vayas|vaya|vayamos|vayáis|vayan',
      'subj-imp':'fuera|fueras|fuera|fuéramos|fuerais|fueran',
      imperativo:'—|ve|vaya|vamos|id|vayan',
      ger:'yendo'}},
    {v:'haber', en:'to have (auxiliary)', cls:'er', fc:'habr', p:{
      presente:'he|has|ha|hemos|habéis|han',
      preterito:'hube|hubiste|hubo|hubimos|hubisteis|hubieron',
      imperfecto:'había|habías|había|habíamos|habíais|habían',
      'subj-pres':'haya|hayas|haya|hayamos|hayáis|hayan',
      'subj-imp':'hubiera|hubieras|hubiera|hubiéramos|hubierais|hubieran'}},
    {v:'tener', en:'to have', cls:'er', fc:'tendr', p:{
      presente:'tengo|tienes|tiene|tenemos|tenéis|tienen',
      preterito:'tuve|tuviste|tuvo|tuvimos|tuvisteis|tuvieron',
      'subj-pres':'tenga|tengas|tenga|tengamos|tengáis|tengan',
      'subj-imp':'tuviera|tuvieras|tuviera|tuviéramos|tuvierais|tuvieran',
      imperativo:'—|ten|tenga|tengamos|tened|tengan'}},
    {v:'hacer', en:'to do / make', cls:'er', fc:'har', p:{
      presente:'hago|haces|hace|hacemos|hacéis|hacen',
      preterito:'hice|hiciste|hizo|hicimos|hicisteis|hicieron',
      'subj-pres':'haga|hagas|haga|hagamos|hagáis|hagan',
      'subj-imp':'hiciera|hicieras|hiciera|hiciéramos|hicierais|hicieran',
      imperativo:'—|haz|haga|hagamos|haced|hagan',
      part:'hecho'}},
    {v:'poder', en:'to be able to', cls:'er', fc:'podr', p:{
      presente:'puedo|puedes|puede|podemos|podéis|pueden',
      preterito:'pude|pudiste|pudo|pudimos|pudisteis|pudieron',
      'subj-pres':'pueda|puedas|pueda|podamos|podáis|puedan',
      'subj-imp':'pudiera|pudieras|pudiera|pudiéramos|pudierais|pudieran',
      imperativo:'—|—|pueda|podamos|poded|puedan',
      ger:'pudiendo'}},
    {v:'querer', en:'to want / love', cls:'er', fc:'querr', p:{
      presente:'quiero|quieres|quiere|queremos|queréis|quieren',
      preterito:'quise|quisiste|quiso|quisimos|quisisteis|quisieron',
      'subj-pres':'quiera|quieras|quiera|queramos|queráis|quieran',
      'subj-imp':'quisiera|quisieras|quisiera|quisiéramos|quisierais|quisieran',
      imperativo:'—|quiere|quiera|queramos|quered|quieran'}},
    {v:'decir', en:'to say / tell', cls:'ir', fc:'dir', p:{
      presente:'digo|dices|dice|decimos|decís|dicen',
      preterito:'dije|dijiste|dijo|dijimos|dijisteis|dijeron',
      'subj-pres':'diga|digas|diga|digamos|digáis|digan',
      'subj-imp':'dijera|dijeras|dijera|dijéramos|dijerais|dijeran',
      imperativo:'—|di|diga|digamos|decid|digan',
      part:'dicho', ger:'diciendo'}},
    {v:'venir', en:'to come', cls:'ir', fc:'vendr', p:{
      presente:'vengo|vienes|viene|venimos|venís|vienen',
      preterito:'vine|viniste|vino|vinimos|vinisteis|vinieron',
      'subj-pres':'venga|vengas|venga|vengamos|vengáis|vengan',
      'subj-imp':'viniera|vinieras|viniera|viniéramos|vinierais|vinieran',
      imperativo:'—|ven|venga|vengamos|venid|vengan',
      ger:'viniendo'}},
    {v:'saber', en:'to know (facts)', cls:'er', fc:'sabr', p:{
      presente:'sé|sabes|sabe|sabemos|sabéis|saben',
      preterito:'supe|supiste|supo|supimos|supisteis|supieron',
      'subj-pres':'sepa|sepas|sepa|sepamos|sepáis|sepan',
      'subj-imp':'supiera|supieras|supiera|supiéramos|supierais|supieran',
      imperativo:'—|sabe|sepa|sepamos|sabed|sepan'}},
    {v:'dar', en:'to give', cls:'ar', p:{
      presente:'doy|das|da|damos|dais|dan',
      preterito:'di|diste|dio|dimos|disteis|dieron',
      'subj-pres':'dé|des|dé|demos|deis|den',
      'subj-imp':'diera|dieras|diera|diéramos|dierais|dieran',
      imperativo:'—|da|dé|demos|dad|den'}},
    {v:'ver', en:'to see', cls:'er', p:{
      presente:'veo|ves|ve|vemos|veis|ven',
      preterito:'vi|viste|vio|vimos|visteis|vieron',
      imperfecto:'veía|veías|veía|veíamos|veíais|veían',
      'subj-pres':'vea|veas|vea|veamos|veáis|vean',
      'subj-imp':'viera|vieras|viera|viéramos|vierais|vieran',
      imperativo:'—|ve|vea|veamos|ved|vean',
      part:'visto'}},
    {v:'poner', en:'to put', cls:'er', fc:'pondr', p:{
      presente:'pongo|pones|pone|ponemos|ponéis|ponen',
      preterito:'puse|pusiste|puso|pusimos|pusisteis|pusieron',
      'subj-pres':'ponga|pongas|ponga|pongamos|pongáis|pongan',
      'subj-imp':'pusiera|pusieras|pusiera|pusiéramos|pusierais|pusieran',
      imperativo:'—|pon|ponga|pongamos|poned|pongan',
      part:'puesto'}},
    {v:'salir', en:'to go out', cls:'ir', fc:'saldr', p:{
      presente:'salgo|sales|sale|salimos|salís|salen',
      'subj-pres':'salga|salgas|salga|salgamos|salgáis|salgan',
      imperativo:'—|sal|salga|salgamos|salid|salgan'}},
    {v:'traer', en:'to bring', cls:'er', p:{
      presente:'traigo|traes|trae|traemos|traéis|traen',
      preterito:'traje|trajiste|trajo|trajimos|trajisteis|trajeron',
      'subj-pres':'traiga|traigas|traiga|traigamos|traigáis|traigan',
      'subj-imp':'trajera|trajeras|trajera|trajéramos|trajerais|trajeran',
      imperativo:'—|trae|traiga|traigamos|traed|traigan',
      part:'traído', ger:'trayendo'}},
    {v:'oír', en:'to hear', cls:'ir', p:{
      presente:'oigo|oyes|oye|oímos|oís|oyen',
      preterito:'oí|oíste|oyó|oímos|oísteis|oyeron',
      'subj-pres':'oiga|oigas|oiga|oigamos|oigáis|oigan',
      'subj-imp':'oyera|oyeras|oyera|oyéramos|oyerais|oyeran',
      imperativo:'—|oye|oiga|oigamos|oíd|oigan',
      part:'oído', ger:'oyendo'}},
    {v:'conocer', en:'to know (people/places)', cls:'er', p:{
      presente:'conozco|conoces|conoce|conocemos|conocéis|conocen',
      'subj-pres':'conozca|conozcas|conozca|conozcamos|conozcáis|conozcan',
      imperativo:'—|conoce|conozca|conozcamos|conoced|conozcan'}},
    {v:'jugar', en:'to play', cls:'ar', p:{
      presente:'juego|juegas|juega|jugamos|jugáis|juegan',
      preterito:'jugué|jugaste|jugó|jugamos|jugasteis|jugaron',
      'subj-pres':'juegue|juegues|juegue|juguemos|juguéis|jueguen',
      imperativo:'—|juega|juegue|juguemos|jugad|jueguen'}}
  ];

  var STEM = [
    {v:'pensar',    en:'to think',      cls:'ar', ch:'e:ie'},
    {v:'empezar',   en:'to begin',      cls:'ar', ch:'e:ie'},
    {v:'entender',  en:'to understand', cls:'er', ch:'e:ie'},
    {v:'cerrar',    en:'to close',      cls:'ar', ch:'e:ie'},
    {v:'perder',    en:'to lose',       cls:'er', ch:'e:ie'},
    {v:'volver',    en:'to return',     cls:'er', ch:'o:ue', pp:'vuelto'},
    {v:'encontrar', en:'to find',       cls:'ar', ch:'o:ue'},
    {v:'contar',    en:'to count / tell', cls:'ar', ch:'o:ue'},
    {v:'recordar',  en:'to remember',   cls:'ar', ch:'o:ue'},
    {v:'mostrar',   en:'to show',       cls:'ar', ch:'o:ue'},
    {v:'dormir',    en:'to sleep',      cls:'ir', ch:'o:ue'},
    {v:'morir',     en:'to die',        cls:'ir', ch:'o:ue', pp:'muerto'},
    {v:'pedir',     en:'to ask for',    cls:'ir', ch:'e:i'},
    {v:'servir',    en:'to serve',      cls:'ir', ch:'e:i'},
    {v:'repetir',   en:'to repeat',     cls:'ir', ch:'e:i'},
    {v:'vestir',    en:'to dress',      cls:'ir', ch:'e:i'},
    {v:'preferir',  en:'to prefer',     cls:'ir', ch:'e:ie'},
    {v:'sentir',    en:'to feel',       cls:'ir', ch:'e:ie'},
    {v:'mentir',    en:'to lie',        cls:'ir', ch:'e:ie'}
  ];

  var PP = [
    ['romper','to break','roto'],
    ['escribir','to write','escrito'],
    ['abrir','to open','abierto'],
    ['cubrir','to cover','cubierto'],
    ['resolver','to resolve','resuelto'],
    ['devolver','to give back','devuelto'],
    ['freír','to fry','frito'],
    ['imprimir','to print','impreso']
  ];

  /* ---------- styles (scoped inside the shadow root) ---------- */
  var STYLE = [
    ':host{',
    '  --bg:#ffffff; --fg:#1a1a1a; --muted:#6b7280;',
    '  --accent:#c2410c; --card:#f7f6f4; --border:#e4e2de;',
    '  --es:#111111; --en:#6b7280;',
    '  --regular:#0f766e; --stem:#b45309; --irregular:#b91c1c;',
    '  --regular-bg:#ecfdf5; --stem-bg:#fffbeb; --irregular-bg:#fef2f2;',
    '  display:block; background:var(--bg); color:var(--fg);',
    '  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;',
    '  font-size:17px; line-height:1.7; -webkit-text-size-adjust:100%;',
    '}',
    '@media (prefers-color-scheme: dark){ :host{',
    '  --bg:#121212; --fg:#e9e9e9; --muted:#a1a1aa;',
    '  --accent:#fb923c; --card:#1c1c1e; --border:#2e2e30;',
    '  --es:#f4f4f5; --en:#a1a1aa;',
    '  --regular:#5eead4; --stem:#fcd34d; --irregular:#fca5a5;',
    '  --regular-bg:#132722; --stem-bg:#2a2413; --irregular-bg:#2a1616;',
    '}}',
    '*{box-sizing:border-box}',
    '.wrap{max-width:900px; margin:0 auto; padding:1.2rem 1.1rem 4rem}',
    'header.top{border-bottom:2px solid var(--accent); padding-bottom:1rem; margin-bottom:1rem}',
    'h1{font-size:1.5rem; line-height:1.35; margin:0 0 .5rem}',
    '.lead{color:var(--muted); font-size:.95rem; margin:.35rem 0}',
    '.lead strong{color:var(--fg)}',
    '.legend{margin:.6rem 0 0}',
    '.tag{display:inline-block; font-size:.72rem; font-weight:700; letter-spacing:.02em; border:1px solid transparent; border-radius:999px; padding:.05rem .5rem; vertical-align:middle; white-space:nowrap}',
    '.t-regular{color:var(--regular); background:var(--regular-bg); border-color:var(--regular)}',
    '.t-stem{color:var(--stem); background:var(--stem-bg); border-color:var(--stem)}',
    '.t-irregular{color:var(--irregular); background:var(--irregular-bg); border-color:var(--irregular)}',
    '.toolbar{position:sticky; top:0; z-index:10; background:var(--bg); padding:.7rem 0; margin:0 0 .5rem; border-bottom:1px solid var(--border)}',
    '#search{width:100%; padding:.6rem .8rem; font-size:1rem; color:var(--fg); background:var(--card); border:1px solid var(--border); border-radius:10px}',
    '#search:focus{outline:2px solid var(--accent); outline-offset:1px}',
    '.controls{display:flex; flex-wrap:wrap; align-items:center; gap:.5rem; margin:.55rem 0 0}',
    '.controls button{font:inherit; font-size:.85rem; font-weight:600; cursor:pointer; color:var(--fg); background:var(--card); border:1px solid var(--border); border-radius:999px; padding:.25rem .8rem}',
    '.controls button:hover{border-color:var(--accent); color:var(--accent)}',
    '.count{color:var(--muted); font-size:.82rem; margin-left:auto}',
    '.filters{margin:.6rem 0 0; padding:.6rem .7rem; background:var(--card); border:1px solid var(--border); border-radius:10px}',
    'fieldset{border:none; margin:.35rem 0; padding:0}',
    'legend{font-size:.75rem; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--muted); padding:0 0 .15rem}',
    '.chks{display:flex; flex-wrap:wrap; gap:.3rem .7rem}',
    '.chk{display:inline-flex; align-items:center; gap:.35rem; font-size:.85rem; cursor:pointer; user-select:none}',
    '.chk input{accent-color:var(--accent)}',
    '.ts{border:1px solid var(--border); border-radius:12px; margin:.7rem 0; overflow:hidden; scroll-margin-top:8rem}',
    '.ts > summary{cursor:pointer; list-style:none; display:flex; align-items:baseline; flex-wrap:wrap; gap:.25rem .6rem; padding:.85rem 1rem; background:var(--card); font-weight:700; font-size:1.02rem}',
    '.ts > summary::-webkit-details-marker{display:none}',
    '.ts > summary::after{content:"\\25B8"; color:var(--accent); font-size:1rem; font-weight:700; margin-left:auto; transition:transform .15s}',
    '.ts[open] > summary::after{transform:rotate(90deg)}',
    '.ts-en{color:var(--muted); font-size:.8rem; font-weight:600}',
    '.lvl{font-size:.68rem; font-weight:700; letter-spacing:.04em; color:var(--accent); border:1px solid var(--accent); border-radius:999px; padding:0 .35rem; vertical-align:middle}',
    '.ts-count{color:var(--muted); font-size:.75rem; font-weight:600}',
    '.note{background:var(--card); border-left:4px solid var(--accent); border-radius:0 8px 8px 0; padding:.55rem .8rem; margin:.7rem .8rem 0; font-size:.9rem; color:var(--muted)}',
    '.table-wrap{overflow-x:auto; margin:.6rem 0 .2rem; -webkit-overflow-scrolling:touch}',
    'table{border-collapse:collapse; width:100%; font-size:.9rem}',
    'th,td{border:1px solid var(--border); padding:.45rem .55rem; text-align:left; vertical-align:top}',
    'th{background:var(--card); font-weight:700; white-space:nowrap}',
    'td .es{font-size:1.1rem; color:var(--es); font-weight:600}',
    'td .gloss{color:var(--muted); font-size:.82rem}',
    '.chg{display:inline-block; font-size:.72rem; font-weight:700; color:var(--stem); background:var(--stem-bg); border:1px solid var(--stem); border-radius:999px; padding:0 .35rem; white-space:nowrap}',
    '@media (max-width:620px){',
    '  table thead{display:none}',
    '  table,tbody,tr,td{display:block; width:100%}',
    '  tr{border:1px solid var(--border); border-radius:10px; margin-bottom:.6rem; padding:.4rem .65rem; background:var(--card)}',
    '  td{border:none; padding:.22rem 0; display:flex; justify-content:space-between; gap:1rem}',
    '  td::before{content:attr(data-label); color:var(--muted); font-weight:600; flex:0 0 auto}',
    '  td:first-child{font-size:1.1rem}',
    '}'
  ].join('\n');

  /* ---------- static markup rendered inside the shadow root ---------- */
  var TEMPLATE =
    '<div class="wrap">' +
      '<header class="top">' +
        '<h1>VERB CONJUGATION CHEATSHEET</h1>' +
        '<p class="lead">Every regular ending, the common irregular verbs and the stem-changers on one page. Filter by tense, pronoun, verb class or type &mdash; or search an ending.</p>' +
        '<p class="lead">Neutral Spanish. Note: <strong>vosotros</strong> is used in Spain; Latin America uses <strong>ustedes</strong> for the plural.</p>' +
        '<p class="legend">' +
          '<span class="tag t-regular">Regular</span> ' +
          '<span class="tag t-stem">Stem-changing</span> ' +
          '<span class="tag t-irregular">Irregular</span>' +
        '</p>' +
      '</header>' +
      '<div class="toolbar">' +
        '<input id="search" type="search" placeholder="Search ending, verb or example… (type -o to match endings)" autocomplete="off">' +
        '<div class="controls">' +
          '<button id="toggle" type="button" aria-expanded="false">Filters</button>' +
          '<button id="reset" type="button">Reset</button>' +
          '<span id="count" class="count"></span>' +
        '</div>' +
        '<div id="filters" class="filters" hidden>' +
          '<fieldset><legend>Tense</legend><div class="chks" id="f-tense"></div></fieldset>' +
          '<fieldset><legend>Pronoun</legend><div class="chks" id="f-pron"></div></fieldset>' +
          '<fieldset><legend>Verb class</legend><div class="chks" id="f-cls"></div></fieldset>' +
          '<fieldset><legend>Type</legend><div class="chks" id="f-type"></div></fieldset>' +
        '</div>' +
      '</div>' +
      '<div id="sections"></div>' +
    '</div>';

  /* ---------- render the cheatsheet into a shadow root ---------- */
  function mountApp(root) {
    root.innerHTML = '<style>' + STYLE + '</style>' + TEMPLATE;
    function $(id) { return root.getElementById(id); }

    /* ---- build rows ---- */
    var rows = [];
    var typeLabel = {regular: 'Regular', stem: 'Stem-changing', irregular: 'Irregular'};
    var pronLabel = {};
    PRON_ALL.forEach(function (p) { pronLabel[p.id] = p.label; });

    function replaceLast(s, from, to) {
      var i = s.lastIndexOf(from);
      if (i < 0) return s;
      return s.slice(0, i) + to + s.slice(i + from.length);
    }
    function clsOf(v) {
      var c = v.slice(-2).replace('í', 'i');
      if (c === 'ar') return 'ar';
      if (c === 'er') return 'er';
      return 'ir';
    }

    (function addRegular() {
      [
        {id: 'presente', end: PRES},
        {id: 'preterito', end: PRET},
        {id: 'imperfecto', end: IMPERF},
        {id: 'futuro', end: FUT, inf: true},
        {id: 'condicional', end: COND, inf: true},
        {id: 'subj-pres', end: SUBJP},
        {id: 'subj-imp', end: SUBJI}
      ].forEach(function (t) {
        ['ar', 'er', 'ir'].forEach(function (cls) {
          var stem = MODELS[cls].slice(0, -2);
          PRON.forEach(function (p, i) {
            var e = t.end[cls][i];
            var form = t.inf ? MODELS[cls] + e : stem + e;
            rows.push({tense: t.id, type: 'regular', cls: cls, pron: p.id,
              verb: MODELS[cls] + ' (-' + cls + ')', verbEn: '', ending: '-' + e,
              change: '', example: p.ex + ' ' + form});
          });
        });
      });
      ['ar', 'er', 'ir'].forEach(function (cls) {
        var stem = MODELS[cls].slice(0, -2);
        for (var k = 0; k < 5; k++) {
          var p = PRON[k + 1], e = IMPER[cls][k];
          rows.push({tense: 'imperativo', type: 'regular', cls: cls, pron: p.id,
            verb: MODELS[cls] + ' (-' + cls + ')', verbEn: '', ending: '-' + e,
            change: '', example: p.ex + ' ' + stem + e});
        }
      });
      [
        ['perfecto', ['he', 'has', 'ha', 'hemos', 'habéis', 'han']],
        ['pluscuamperfecto', ['había', 'habías', 'había', 'habíamos', 'habíais', 'habían']]
      ].forEach(function (c) {
        ['ar', 'er', 'ir'].forEach(function (cls) {
          var stem = MODELS[cls].slice(0, -2);
          var pe = cls === 'ar' ? 'ado' : 'ido';
          PRON.forEach(function (p, i) {
            rows.push({tense: c[0], type: 'regular', cls: cls, pron: p.id,
              verb: 'haber + participio', verbEn: '', ending: '-' + pe,
              change: '', example: p.ex + ' ' + c[1][i] + ' ' + stem + pe});
          });
        });
      });
      ['inf', 'ger', 'part'].forEach(function (kind) {
        ['ar', 'er', 'ir'].forEach(function (cls) {
          var stem = MODELS[cls].slice(0, -2), e, form;
          if (kind === 'inf') { e = '-' + cls; form = MODELS[cls]; }
          else if (kind === 'ger') { e = cls === 'ar' ? '-ando' : '-iendo'; form = stem + (cls === 'ar' ? 'ando' : 'iendo'); }
          else { e = cls === 'ar' ? '-ado' : '-ido'; form = stem + (cls === 'ar' ? 'ado' : 'ido'); }
          rows.push({tense: kind, type: 'regular', cls: cls, pron: 'nf',
            verb: MODELS[cls] + ' (-' + cls + ')', verbEn: '', ending: e,
            change: '', example: form});
        });
      });
    })();

    (function addIrregular() {
      function tensedRows(tense, verb, forms) {
        forms.forEach(function (f, i) {
          if (f === '—') return;
          rows.push({tense: tense, type: 'irregular', cls: verb.cls, pron: PRON[i].id,
            verb: verb.v, verbEn: verb.en, ending: '—', change: '',
            example: PRON[i].ex + ' ' + f});
        });
      }
      IRREG.forEach(function (verb) {
        ['presente', 'preterito', 'imperfecto', 'subj-pres', 'subj-imp', 'imperativo'].forEach(function (t) {
          if (verb.p[t]) tensedRows(t, verb, verb.p[t].split('|'));
        });
        if (verb.fc) {
          tensedRows('futuro', verb, [verb.fc + 'é', verb.fc + 'ás', verb.fc + 'á', verb.fc + 'emos', verb.fc + 'éis', verb.fc + 'án']);
          tensedRows('condicional', verb, [verb.fc + 'ía', verb.fc + 'ías', verb.fc + 'ía', verb.fc + 'íamos', verb.fc + 'íais', verb.fc + 'ían']);
        }
        if (verb.p.part) rows.push({tense: 'part', type: 'irregular', cls: verb.cls, pron: 'nf',
          verb: verb.v, verbEn: verb.en, ending: '—', example: verb.p.part});
        if (verb.p.ger) rows.push({tense: 'ger', type: 'irregular', cls: verb.cls, pron: 'nf',
          verb: verb.v, verbEn: verb.en, ending: '—', example: verb.p.ger});
      });
      PP.forEach(function (pp) {
        rows.push({tense: 'part', type: 'irregular', cls: clsOf(pp[0]), pron: 'nf',
          verb: pp[0], verbEn: pp[1], ending: '—', example: pp[2]});
      });
    })();

    (function addStem() {
      STEM.forEach(function (verb) {
        var cls = verb.cls, parts = verb.ch.split(':');
        var from = parts[0], to = parts[1];
        var stem = verb.v.slice(0, -2);
        var cstem = replaceLast(stem, from, to);
        var reduced = (to === 'ue') ? 'u' : 'i';
        var rstem = replaceLast(stem, from, reduced);

        PRON.forEach(function (p, i) {
          var affected = (i === 0 || i === 1 || i === 2 || i === 5);
          var st = affected ? cstem : stem;
          var e = PRES[cls][i];
          rows.push({tense: 'presente', type: 'stem', cls: cls, pron: p.id,
            verb: verb.v, verbEn: verb.en, ending: '-' + e,
            change: affected ? verb.ch : '', example: p.ex + ' ' + st + e});
        });

        PRON.forEach(function (p, i) {
          var affected = (i === 0 || i === 1 || i === 2 || i === 5);
          var st, ch;
          if (affected) { st = cstem; ch = verb.ch; }
          else if (cls === 'ir') { st = rstem; ch = from + ':' + reduced; }
          else { st = stem; ch = ''; }
          var e = SUBJP[cls][i];
          rows.push({tense: 'subj-pres', type: 'stem', cls: cls, pron: p.id,
            verb: verb.v, verbEn: verb.en, ending: '-' + e, change: ch,
            example: p.ex + ' ' + st + e});
        });

        for (var k = 0; k < 5; k++) {
          var p = PRON[k + 1], st, ch;
          if (k === 0 || k === 1 || k === 4) { st = cstem; ch = verb.ch; }
          else if (k === 2) { st = (cls === 'ir') ? rstem : stem; ch = (cls === 'ir') ? from + ':' + reduced : ''; }
          else { st = stem; ch = ''; }
          var e = IMPER[cls][k];
          rows.push({tense: 'imperativo', type: 'stem', cls: cls, pron: p.id,
            verb: verb.v, verbEn: verb.en, ending: '-' + e, change: ch,
            example: p.ex + ' ' + st + e});
        }

        if (cls === 'ir') {
          PRON.forEach(function (p, i) {
            var e = PRET[cls][i];
            var changed = (i === 2 || i === 5);
            rows.push({tense: 'preterito', type: 'stem', cls: cls, pron: p.id,
              verb: verb.v, verbEn: verb.en, ending: '-' + e,
              change: changed ? from + ':' + reduced : '',
              example: p.ex + ' ' + (changed ? rstem : stem) + e});
          });
          PRON.forEach(function (p, i) {
            rows.push({tense: 'subj-imp', type: 'stem', cls: cls, pron: p.id,
              verb: verb.v, verbEn: verb.en, ending: '-' + SUBJI[cls][i],
              change: from + ':' + reduced, example: p.ex + ' ' + rstem + SUBJI[cls][i]});
          });
          rows.push({tense: 'ger', type: 'stem', cls: cls, pron: 'nf',
            verb: verb.v, verbEn: verb.en, ending: '-iendo',
            change: from + ':' + reduced, example: rstem + 'iendo'});
        }

        if (verb.pp) {
          rows.push({tense: 'part', type: 'irregular', cls: cls, pron: 'nf',
            verb: verb.v, verbEn: verb.en, ending: '—', example: verb.pp});
        }
      });
    })();

    /* ---- render ---- */
    function esc(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function cell(label, html) {
      var td = document.createElement('td');
      td.setAttribute('data-label', label);
      td.innerHTML = html;
      return td;
    }
    function norm(s) {
      return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    var sectionEls = {};
    SECTIONS.forEach(function (sec) {
      var d = document.createElement('details');
      d.className = 'ts'; d.id = 'sec-' + sec.id;
      var s = document.createElement('summary');
      s.innerHTML = '<span>' + esc(sec.name) + '</span>' +
        (sec.en ? '<span class="ts-en">' + esc(sec.en) + '</span>' : '') +
        '<span class="lvl">' + sec.level + '</span>' +
        '<span class="ts-count" data-count></span>';
      d.appendChild(s);
      if (sec.note) {
        var n = document.createElement('p');
        n.className = 'note'; n.textContent = sec.note; d.appendChild(n);
      }
      var wrap = document.createElement('div');
      wrap.className = 'table-wrap';
      var table = document.createElement('table');
      table.innerHTML = '<thead><tr><th>Pronoun</th><th>Verb / class</th>' +
        '<th>Ending</th><th>Example</th><th>Type</th></tr></thead><tbody></tbody>';
      wrap.appendChild(table); d.appendChild(wrap);
      $('sections').appendChild(d);
      sectionEls[sec.id] = {el: d, tbody: table.tBodies[0],
        count: s.querySelector('[data-count]'), rows: []};
    });

    rows.forEach(function (r) {
      var sec = sectionEls[r.tense];
      if (!sec) return;
      var tr = document.createElement('tr');
      tr.appendChild(cell('Pronoun', esc(pronLabel[r.pron])));
      tr.appendChild(cell('Verb / class', esc(r.verb) +
        (r.verbEn ? ' <span class="gloss">' + esc(r.verbEn) + '</span>' : '')));
      tr.appendChild(cell('Ending', esc(r.ending) +
        (r.change ? ' <span class="chg">' + esc(r.change.replace(':', '→')) + '</span>' : '')));
      tr.appendChild(cell('Example', '<span class="es">' + esc(r.example) + '</span>'));
      tr.appendChild(cell('Type', '<span class="tag t-' + r.type + '">' + typeLabel[r.type] + '</span>'));
      sec.tbody.appendChild(tr);
      sec.rows.push({r: r, tr: tr});
    });

    /* ---- filters ---- */
    function buildChecks(containerId, items) {
      var box = $(containerId);
      items.forEach(function (it) {
        var label = document.createElement('label');
        label.className = 'chk';
        var cb = document.createElement('input');
        cb.type = 'checkbox'; cb.value = it.id; cb.setAttribute('data-group', containerId);
        if (it.checked) cb.checked = true;
        var span = document.createElement('span');
        span.textContent = it.label || it.name;
        label.appendChild(cb); label.appendChild(span); box.appendChild(label);
      });
    }
    buildChecks('f-tense', SECTIONS.map(function (s) { return {id: s.id, label: s.name}; }));
    buildChecks('f-pron', PRON_ALL.map(function (p) { return {id: p.id, label: p.filterLabel || p.label}; }));
    buildChecks('f-cls', [{id: 'ar', label: '-ar'}, {id: 'er', label: '-er'}, {id: 'ir', label: '-ir'}]);
    buildChecks('f-type', [
      {id: 'regular', label: 'Regular', checked: true},
      {id: 'stem', label: 'Stem-changing'},
      {id: 'irregular', label: 'Irregular'}
    ]);

    function checked(group) {
      return Array.prototype.slice.call(
        root.querySelectorAll('input[data-group="' + group + '"]:checked')
      ).map(function (c) { return c.value; });
    }

    var countEl = $('count');
    function apply() {
      var selT = checked('f-tense'), selP = checked('f-pron');
      var selC = checked('f-cls'), selY = checked('f-type');
      var raw = $('search').value.trim();
      var endOnly = raw.charAt(0) === '-';
      var q = norm(raw).replace(/-/g, '');
      var total = 0;

      Object.keys(sectionEls).forEach(function (id) {
        var sec = sectionEls[id], cnt = 0;
        sec.rows.forEach(function (item) {
          var r = item.r, vis = true;
          if (selT.length && selT.indexOf(id) < 0) vis = false;
          if (vis && selP.length && selP.indexOf(r.pron) < 0) vis = false;
          if (vis && selC.length && selC.indexOf(r.cls) < 0) vis = false;
          if (vis && selY.length && selY.indexOf(r.type) < 0) vis = false;
          if (vis && q) {
            var hay = endOnly
              ? norm(r.ending)
              : norm(r.verb + ' ' + (r.verbEn || '') + ' ' + r.example + ' ' +
                     r.ending + ' ' + typeLabel[r.type] + ' ' + pronLabel[r.pron]);
            if (hay.replace(/-/g, '').indexOf(q) < 0) vis = false;
          }
          item.tr.style.display = vis ? '' : 'none';
          if (vis) cnt++;
        });
        sec.count.textContent = cnt + '/' + sec.rows.length;
        sec.el.style.display = cnt ? '' : 'none';
        if (q && cnt) sec.el.open = true;
        total += cnt;
      });
      countEl.textContent = total + ' of ' + rows.length + ' forms';
    }

    $('search').addEventListener('input', apply);
    $('filters').addEventListener('change', apply);

    var toggle = $('toggle');
    toggle.addEventListener('click', function () {
      var f = $('filters');
      f.hidden = !f.hidden;
      toggle.setAttribute('aria-expanded', String(!f.hidden));
    });

    $('reset').addEventListener('click', function () {
      $('search').value = '';
      root.querySelectorAll('#filters input[type="checkbox"]').forEach(function (cb) {
        cb.checked = (cb.getAttribute('data-group') === 'f-type' && cb.value === 'regular');
      });
      apply();
    });

    sectionEls.presente.el.open = true;
    apply();
  }

  /* ---------- inline mode (conjugation.html) ---------- */
  function initInline() {
    var el = document.getElementById('conjugation-root');
    if (!el) return false;
    var shadow = el.attachShadow({mode: 'open'});
    mountApp(shadow);
    return true;
  }

  /* ---------- modal mode (lessons) ---------- */
  var MODAL_STYLE =
    '#cjm-btn{position:fixed; right:1rem; bottom:1rem; z-index:2147483000;' +
      'font:inherit; font-size:.85rem; font-weight:700; cursor:pointer;' +
      'color:#fff; background:#c2410c; border:1px solid #c2410c;' +
      'border-radius:999px; padding:.55rem 1rem; box-shadow:0 6px 18px rgba(0,0,0,.28);' +
      '-webkit-tap-highlight-color:transparent;}' +
    '#cjm-btn:hover{background:#9a3412; border-color:#9a3412}' +
    '#cjm-btn:active{transform:scale(.97)}' +
    '#cjm-dialog{border:none; padding:0; margin:auto; width:min(94vw,900px);' +
      'max-height:90vh; background:#fff; color:#1a1a1a; border-radius:14px;' +
      'box-shadow:0 24px 64px rgba(0,0,0,.4); overflow:hidden;' +
      'display:flex; flex-direction:column;}' +
    '#cjm-dialog:not([open]){display:none}' +
    '#cjm-dialog::backdrop{background:rgba(0,0,0,.55)}' +
    '.cjm-bar{display:flex; align-items:center; gap:.5rem;' +
      'padding:.6rem .8rem; background:#f7f6f4; border-bottom:1px solid #e4e2de;' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;' +
      'font-size:.8rem; font-weight:700; letter-spacing:.06em; color:#6b7280;' +
      'text-transform:uppercase;}' +
    '.cjm-close{margin-left:auto; font:inherit; font-size:1.4rem; line-height:1;' +
      'cursor:pointer; color:#6b7280; background:transparent; border:none;' +
      'padding:0 .3rem; border-radius:6px;}' +
    '.cjm-close:hover{color:#c2410c}' +
    '#cjm-host{flex:1 1 auto; min-height:0; overflow:auto;' +
      '-webkit-overflow-scrolling:touch; overscroll-behavior:contain;}' +
    '@media (prefers-color-scheme: dark){' +
      '#cjm-btn{background:#fb923c; border-color:#fb923c; color:#1a1a1a}' +
      '#cjm-btn:hover{background:#fdba74; border-color:#fdba74}' +
      '#cjm-dialog{background:#121212; color:#e9e9e9}' +
      '.cjm-bar{background:#1c1c1e; border-bottom-color:#2e2e30; color:#a1a1aa}' +
      '.cjm-close{color:#a1a1aa}' +
      '.cjm-close:hover{color:#fb923c}' +
    '}' +
    '@media (max-width:620px){' +
      '#cjm-dialog{width:100vw; max-width:none; height:100dvh; max-height:100dvh; border-radius:0}' +
    '}';

  function initModal() {
    var style = document.createElement('style');
    style.textContent = MODAL_STYLE;
    document.head.appendChild(style);

    var btn = document.createElement('button');
    btn.id = 'cjm-btn';
    btn.type = 'button';
    btn.textContent = 'Conjugations';
    btn.title = 'Open verb conjugation cheatsheet';
    btn.setAttribute('aria-label', 'Open verb conjugation cheatsheet');
    document.body.appendChild(btn);

    var dlg = document.createElement('dialog');
    dlg.id = 'cjm-dialog';
    dlg.setAttribute('aria-label', 'Verb conjugation cheatsheet');
    dlg.innerHTML =
      '<div class="cjm-bar">' +
        '<span>Verb conjugation cheatsheet</span>' +
        '<button type="button" class="cjm-close" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div id="cjm-host"></div>';
    document.body.appendChild(dlg);

    var host = dlg.querySelector('#cjm-host');
    var mounted = false;

    function open() {
      if (!mounted) {
        mountApp(host.attachShadow({mode: 'open'}));
        mounted = true;
      }
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
      document.documentElement.style.overflow = 'hidden';
    }
    function close() {
      if (typeof dlg.close === 'function' && dlg.open) dlg.close();
      else dlg.removeAttribute('open');
    }

    btn.addEventListener('click', open);
    dlg.querySelector('.cjm-close').addEventListener('click', close);
    dlg.addEventListener('close', function () {
      document.documentElement.style.overflow = '';
    });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) close();
    });
  }

  function init() {
    if (!initInline()) initModal();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
