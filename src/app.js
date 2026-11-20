
const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} = React;
const LESSON = {
  level: 'المستوى الأول',
  unit: 'الوحدة ١: أَنَا',
  title: 'مَنْ أَنَا؟',
  fn: 'التعريف بالنفس',
  phase: 1
};
const PHASES = [{
  n: 1,
  unit: 'الوحدة ١',
  name: 'الفَتْحَة',
  ex: 'قَلَم · وَلَد · جَرَس',
  note: 'كلمات كاملة، والوقف بالسكون'
}, {
  n: 2,
  unit: 'الوحدة ٢',
  name: 'الكَسْرَة',
  ex: 'إِبِل · كَتِف',
  note: 'تُضاف إلى الفتحة'
}, {
  n: 3,
  unit: 'الوحدة ٣',
  name: 'الضَّمَّة',
  ex: 'عُنُق · كُتُب',
  note: 'الحركات الثلاث معًا'
}, {
  n: 4,
  unit: 'الوحدة ٤',
  name: 'المُدُود',
  ex: 'بَاب · فِيل · نُور',
  note: 'ا و ي'
}, {
  n: 5,
  unit: 'الوحدة ٥',
  name: 'السُّكُون',
  ex: 'بَيْت · قَلْب · مَكْتَب',
  note: 'العقدة الأولى عند الطالب'
}, {
  n: 6,
  unit: 'الوحدة ٦',
  name: 'الشَّدَّة',
  ex: 'أُمِّي · جَدَّة',
  note: ''
}, {
  n: 7,
  unit: 'الوحدة ٧',
  name: 'التَّنْوِين وَ«الـ»',
  ex: 'قَلَمٌ · الشَّمْس',
  note: 'الشمسية والقمرية'
}, {
  n: 8,
  unit: 'الوحدة ٨',
  name: 'التَّكَامُل',
  ex: 'جمل متصلة',
  note: 'قراءة بطلاقة'
}];
const MARK_RE = /[ً-ْٰ]/;
const AR_LETTER = /[ء-ي]/;
const PUNCT_RE = /^([«"(]*)(.*?)([.!؟،,:»")…]*)$/;
const FATHA = 'َ';
const stripMarks = s => s.replace(/[ً-ْٰ]/g, '');
const SIGHT = new Set(['أنا', 'هذا', 'هذه', 'يا', 'ما', 'لا', 'نعم', 'هو', 'هي']);
function clustersOf(word) {
  const out = [];
  for (const ch of word) {
    if (MARK_RE.test(ch) && out.length) out[out.length - 1] += ch;else out.push(ch);
  }
  return out;
}
function allowedMarks(phase) {
  const s = new Set([FATHA]);
  if (phase >= 2) s.add('ِ');
  if (phase >= 3) s.add('ُ');
  return s;
}
function clReadable(c, phase, isLast) {
  if (!AR_LETTER.test(c[0])) return false;
  const marks = c.slice(1);
  if (!marks) return !!isLast && !'اويىةآ'.includes(c[0]);
  return marks.length === 1 && allowedMarks(phase).has(marks);
}
function classify(word, phase = LESSON.phase) {
  const bare = stripMarks(word);
  if (SIGHT.has(bare)) return {
    type: 'sight'
  };
  if (bare.startsWith('و') && word.startsWith('وَ') && SIGHT.has(bare.slice(1))) return {
    type: 'sight'
  };
  const cl = clustersOf(word);
  if (cl.length >= 2 && cl.every((c, i) => clReadable(c, phase, i === cl.length - 1))) return {
    type: 'read'
  };
  return {
    type: 'mimic'
  };
}
function tokenize(text) {
  const parts = [];
  const re = /⟦([^⟧]*)⟧/g;
  let last = 0,
    m;
  while (m = re.exec(text)) {
    if (m.index > last) parts.push({
      slot: false,
      t: text.slice(last, m.index)
    });
    const inner = m[1];
    parts.push({
      slot: true,
      me: inner.startsWith('*'),
      t: inner.replace(/^\*/, '')
    });
    last = re.lastIndex;
  }
  if (last < text.length) parts.push({
    slot: false,
    t: text.slice(last)
  });
  return parts;
}
function countTags(text) {
  const c = {
    read: 0,
    mimic: 0,
    sight: 0,
    me: 0
  };
  tokenize(text).forEach(part => {
    part.t.split(/\s+/).filter(Boolean).forEach(raw => {
      const mm = raw.match(PUNCT_RE);
      const w = mm ? mm[2] : raw;
      if (!w || !AR_LETTER.test(w)) return;
      if (part.me) {
        c.me++;
        return;
      }
      const k = classify(w).type;
      c[k]++;
    });
  });
  return c;
}
const AGES = {
  6: 'سِتُّ سَنَوَاتٍ',
  7: 'سَبْعُ سَنَوَاتٍ',
  8: 'ثَمَانِي سَنَوَاتٍ',
  9: 'تِسْعُ سَنَوَاتٍ',
  10: 'عَشْرُ سَنَوَاتٍ',
  11: 'إِحْدَى عَشْرَةَ سَنَةً',
  12: 'اثْنَتَا عَشْرَةَ سَنَةً',
  13: 'ثَلَاثَ عَشْرَةَ سَنَةً',
  14: 'أَرْبَعَ عَشْرَةَ سَنَةً'
};
const ageAmm = n => `${n} ${n <= 10 ? 'سنين' : 'سنة'}`;
const COUNTRIES = [{
  id: 'syria',
  label: 'سوريا',
  from: 'مِنْ سُورِيَا',
  inn: 'فِي سُورِيَا'
}, {
  id: 'palestine',
  label: 'فلسطين',
  from: 'مِنْ فِلَسْطِينَ',
  inn: 'فِي فِلَسْطِينَ'
}, {
  id: 'jordan',
  label: 'الأردن',
  from: 'مِنَ الْأُرْدُنِّ',
  inn: 'فِي الْأُرْدُنِّ'
}, {
  id: 'lebanon',
  label: 'لبنان',
  from: 'مِنْ لُبْنَانَ',
  inn: 'فِي لُبْنَانَ'
}, {
  id: 'egypt',
  label: 'مصر',
  from: 'مِنْ مِصْرَ',
  inn: 'فِي مِصْرَ'
}, {
  id: 'iraq',
  label: 'العراق',
  from: 'مِنَ الْعِرَاقِ',
  inn: 'فِي الْعِرَاقِ'
}, {
  id: 'morocco',
  label: 'المغرب',
  from: 'مِنَ الْمَغْرِبِ',
  inn: 'فِي الْمَغْرِبِ'
}, {
  id: 'turkey',
  label: 'تركيا',
  from: 'مِنْ تُرْكِيَا',
  inn: 'فِي تُرْكِيَا'
}, {
  id: 'canada',
  label: 'كندا',
  from: 'مِنْ كَنَدَا',
  inn: 'فِي كَنَدَا'
}, {
  id: 'usa',
  label: 'أمريكا',
  from: 'مِنْ أَمْرِيكَا',
  inn: 'فِي أَمْرِيكَا'
}, {
  id: 'germany',
  label: 'ألمانيا',
  from: 'مِنْ أَلْمَانْيَا',
  inn: 'فِي أَلْمَانْيَا'
}, {
  id: 'sweden',
  label: 'السويد',
  from: 'مِنَ السُّوَيْدِ',
  inn: 'فِي السُّوَيْدِ'
}];
const cById = id => COUNTRIES.find(c => c.id === id) || COUNTRIES[0];
const GRADES = {
  4: 'الرَّابِعِ',
  5: 'الْخَامِسِ',
  6: 'السَّادِسِ',
  7: 'السَّابِعِ',
  8: 'الثَّامِنِ',
  9: 'التَّاسِعِ'
};
const GRADES_AMM = {
  4: 'رابع',
  5: 'خامس',
  6: 'سادس',
  7: 'سابع',
  8: 'ثامن',
  9: 'تاسع'
};
const LIKES = {
  young: [{
    id: 'ball',
    ar: 'الْكُرَةَ',
    amm: 'الطابة',
    ic: 'ball'
  }, {
    id: 'draw',
    ar: 'الرَّسْمَ',
    amm: 'الرسم',
    ic: 'palette'
  }, {
    id: 'cats',
    ar: 'الْقِطَطَ',
    amm: 'البسينات',
    ic: 'cat'
  }, {
    id: 'stories',
    ar: 'الْقِصَصَ',
    amm: 'القصص',
    ic: 'stories'
  }, {
    id: 'swim',
    ar: 'السِّبَاحَةَ',
    amm: 'السباحة',
    ic: 'swim'
  }, {
    id: 'cars',
    ar: 'السَّيَّارَاتِ',
    amm: 'السيارات',
    ic: 'car'
  }, {
    id: 'dolls',
    ar: 'الدُّمَى',
    amm: 'اللعب',
    ic: 'teddy'
  }],
  old: [{
    id: 'football',
    ar: 'كُرَةَ الْقَدَمِ',
    amm: 'الفوتبول',
    ic: 'ball'
  }, {
    id: 'draw',
    ar: 'الرَّسْمَ',
    amm: 'الرسم',
    ic: 'palette'
  }, {
    id: 'reading',
    ar: 'الْقِرَاءَةَ',
    amm: 'القراءة',
    ic: 'openbook'
  }, {
    id: 'swim',
    ar: 'السِّبَاحَةَ',
    amm: 'السباحة',
    ic: 'swim'
  }, {
    id: 'cook',
    ar: 'الطَّبْخَ',
    amm: 'الطبخ',
    ic: 'pan'
  }, {
    id: 'games',
    ar: 'الْأَلْعَابَ الْإِلِكْتُرُونِيَّةَ',
    amm: 'ألعاب الفيديو',
    ic: 'gamepad'
  }, {
    id: 'photo',
    ar: 'التَّصْوِيرَ',
    amm: 'التصوير',
    ic: 'camera'
  }]
};
const HARVEST = [{
  k: 'greet',
  ic: 'hand',
  label: 'التحية'
}, {
  k: 'name',
  ic: 'tag',
  label: 'اسمي'
}, {
  k: 'age',
  ic: 'cake',
  label: 'عمري'
}, {
  k: 'from',
  ic: 'globe',
  label: 'بلدي'
}, {
  k: 'things',
  ic: 'pen',
  label: 'أشيائي'
}, {
  k: 'friend',
  ic: 'friends',
  label: 'صديقي'
}, {
  k: 'likes',
  ic: 'heart',
  label: 'ما أحب'
}];
const VIRUSES = [{
  k: 'shu',
  amm: 'شو',
  fu: 'مَا',
  ex: 'مَا اسْمُكَ؟'
}, {
  k: 'wein',
  amm: 'وين',
  fu: 'أَيْنَ',
  ex: 'مِنْ أَيْنَ أَنْتَ؟'
}, {
  k: 'addesh',
  amm: 'قديش',
  fu: 'كَمْ',
  ex: 'كَمْ عُمْرُكَ؟'
}, {
  k: 'had',
  amm: 'هاد',
  fu: 'هَذَا',
  ex: 'هَذَا قَلَمِي.'
}, {
  k: 'hay',
  amm: 'هاي',
  fu: 'هَذِهِ',
  ex: 'هَذِهِ صَدِيقَتِي.'
}, {
  k: 'tabaa',
  amm: 'تبعي',
  fu: 'ـِي',
  ex: 'هَذَا كِتَابِي.'
}, {
  k: 'min',
  amm: 'مين',
  fu: 'مَنْ',
  ex: 'مَنْ هَذَا؟'
}, {
  k: 'inta',
  amm: 'إنت',
  fu: 'أَنْتَ',
  ex: 'وَأَنْتَ؟'
}, {
  k: 'bhebb',
  amm: 'بحب',
  fu: 'أُحِبُّ',
  ex: 'أَنَا أُحِبُّ الرَّسْمَ.'
}, {
  k: 'saheb',
  amm: 'صاحبي',
  fu: 'صَدِيقِي',
  ex: 'هَذَا صَدِيقِي.'
}, {
  k: 'sneen',
  amm: 'سنين',
  fu: 'سَنَوَات',
  ex: 'عُمْرِي عَشْرُ سَنَوَاتٍ.'
}, {
  k: 'yalla',
  amm: 'يلا',
  fu: 'هَيَّا',
  ex: 'هَيَّا إِلَى الْمَدْرَسَةِ!'
}];
const store = {
  get(k, d) {
    try {
      const v = localStorage.getItem('tawasul1:' + k);
      return v ? JSON.parse(v) : d;
    } catch (e) {
      return d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem('tawasul1:' + k, JSON.stringify(v));
    } catch (e) {}
  },
  clear() {
    try {
      Object.keys(localStorage).filter(k => k.startsWith('tawasul1:')).forEach(k => localStorage.removeItem(k));
    } catch (e) {}
  }
};
let AC = null;
function tone(freq, dur = 0.12, type = 'sine', vol = 0.08, when = 0) {
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(),
      g = AC.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(AC.destination);
    const t = AC.currentTime + when;
    o.start(t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.stop(t + dur + 0.02);
  } catch (e) {}
}
const sfx = {
  ok() {
    tone(660, .1, 'triangle');
    tone(880, .14, 'triangle', .08, .1);
    tone(1320, .18, 'triangle', .06, .2);
  },
  bad() {
    tone(220, .18, 'square', .04);
  },
  pop() {
    tone(520, .07, 'sine', .07);
  },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, .2, 'triangle', .07, i * .12));
  },
  tick() {
    tone(1200, .03, 'square', .02);
  }
};
function speak(text) {
  try {
    if (!window.speechSynthesis) return;
    const clean = String(text).replace(/[⟦⟧*]/g, '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'ar-SA';
    u.rate = 0.82;
    const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith('ar'));
    if (v) u.voice = v;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch (e) {}
}
function Icon({
  n,
  s = 4,
  style
}) {
  const u = PX.url(n);
  if (!u) return null;
  return React.createElement("img", {
    className: "px",
    src: u,
    alt: "",
    style: {
      width: 12 * s,
      height: 12 * s,
      ...style
    }
  });
}
function CharImg({
  def,
  s = 4,
  k,
  style
}) {
  const u = PX.charUrl(def, k || JSON.stringify(def));
  const h = def.adult ? 20 : 16;
  return React.createElement("img", {
    className: "px",
    src: u,
    alt: "",
    style: {
      width: 12 * s,
      height: h * s,
      ...style
    }
  });
}
function Pic({
  ic,
  char,
  s = 6
}) {
  return char ? React.createElement(CharImg, {
    def: char,
    s: s
  }) : ic ? React.createElement(Icon, {
    n: ic,
    s: s
  }) : null;
}
function Word({
  w
}) {
  const m = w.match(PUNCT_RE);
  const pre = m ? m[1] : '',
    core = m ? m[2] : w,
    post = m ? m[3] : '';
  if (!core || !AR_LETTER.test(core)) return React.createElement("span", null, w);
  const c = classify(core);
  const say = e => {
    if (e.currentTarget.closest('button')) return;
    e.stopPropagation();
    speak(core);
  };
  const title = {
    read: 'أقرؤها وحدي',
    sight: 'كلمة أعرفها بالنظر',
    mimic: 'أسمعها من المعلم وأعيدها'
  }[c.type];
  return React.createElement(React.Fragment, null, pre, React.createElement("span", {
    className: 'w t-' + c.type,
    onClick: say,
    title: title
  }, core), post);
}
function TT({
  text,
  className = '',
  style
}) {
  const parts = tokenize(text);
  return React.createElement("span", {
    className: 'tt ' + className,
    style: style
  }, parts.map((p, i) => {
    const words = p.t.split(/(\s+)/);
    const inner = words.map((w, j) => /^\s+$/.test(w) || !w ? React.createElement("span", {
      key: j
    }, w) : p.me ? React.createElement("span", {
      key: j,
      className: "w t-me",
      onClick: () => speak(w),
      title: "\u0627\u0633\u0645\u064A \u2014 \u0623\u0639\u0631\u0641\u0647"
    }, w) : React.createElement(Word, {
      key: j,
      w: w
    }));
    return p.slot ? React.createElement("span", {
      key: i,
      className: "slot",
      title: "\u0645\u0646 \u0627\u062E\u062A\u064A\u0627\u0631\u0643"
    }, inner) : React.createElement("span", {
      key: i
    }, inner);
  }));
}
function Legend({
  compact
}) {
  return React.createElement("div", {
    className: "legend"
  }, React.createElement("span", {
    className: "lg read"
  }, React.createElement("i", {
    className: "sq"
  }), compact ? 'أقرأ' : 'أقرؤها وحدي'), React.createElement("span", {
    className: "lg sight"
  }, React.createElement("i", {
    className: "sq"
  }), compact ? 'بالنظر' : 'أعرفها بالنظر'), React.createElement("span", {
    className: "lg mimic"
  }, React.createElement("i", {
    className: "sq"
  }), compact ? 'أحاكي' : 'أسمعها من المعلم وأعيدها'), React.createElement("span", {
    className: "lg me"
  }, React.createElement("i", {
    className: "sq"
  }), compact ? 'لي' : 'معلوماتي'));
}
function Quota({
  texts
}) {
  const c = {
    read: 0,
    mimic: 0,
    sight: 0,
    me: 0
  };
  texts.forEach(t => {
    const x = countTags(t);
    Object.keys(c).forEach(k => c[k] += x[k]);
  });
  const total = c.read + c.mimic + c.sight + c.me || 1;
  return React.createElement("div", {
    className: "row wrapf small",
    style: {
      gap: 8
    }
  }, React.createElement("b", {
    className: "mute"
  }, "\u0645\u0642\u062F\u0627\u0631 \u0627\u0644\u0642\u0631\u0627\u0621\u0629:"), React.createElement("span", {
    className: "lg read"
  }, React.createElement("i", {
    className: "sq"
  }), c.read, " \u064A\u0642\u0631\u0624\u0647\u0627"), React.createElement("span", {
    className: "lg sight"
  }, React.createElement("i", {
    className: "sq"
  }), c.sight, " \u0628\u0627\u0644\u0646\u0638\u0631"), React.createElement("span", {
    className: "lg mimic"
  }, React.createElement("i", {
    className: "sq"
  }), c.mimic, " \u064A\u062D\u0627\u0643\u064A\u0647\u0627"), React.createElement("span", {
    className: "mute"
  }, "(", Math.round((c.read + c.sight + c.me) / total * 100), "\u066A \u0642\u0631\u0627\u0621\u0629 \u0630\u0627\u062A\u064A\u0629)"));
}
function SayBtn({
  text,
  sm
}) {
  return React.createElement("button", {
    className: "btn ghost sm icon-btn",
    onClick: () => speak(text),
    title: "\u0627\u0633\u062A\u0645\u0639 (\u0635\u0648\u062A \u0645\u0633\u0627\u0639\u062F)"
  }, React.createElement(Icon, {
    n: "speaker",
    s: 2.5
  }));
}
function TeacherBar({
  onGrade,
  compact,
  label = 'المعلم'
}) {
  return React.createElement("div", {
    className: "tbar"
  }, React.createElement("span", {
    className: "lbl"
  }, label, ":"), React.createElement("button", {
    className: "tb g",
    onClick: () => onGrade('full')
  }, "\u2713 ", compact ? 'فصحى' : 'فصحى كاملة'), React.createElement("button", {
    className: "tb w",
    onClick: () => onGrade('switch')
  }, "\u21C4 ", compact ? 'عامية' : 'تبديل لهجة'), React.createElement("button", {
    className: "tb p",
    onClick: () => onGrade('pause')
  }, "\u2026 ", compact ? 'توقف' : 'توقف-بحث'));
}
function Energy({
  value,
  girl
}) {
  const v = Math.max(0, Math.min(100, value));
  return React.createElement("div", {
    className: "col",
    style: {
      gap: 6
    }
  }, React.createElement("div", {
    className: "row between small"
  }, React.createElement("b", null, "\u0627\u0644\u0637\u0627\u0642\u0629"), React.createElement("b", null, v, "\u066A")), React.createElement("div", {
    className: "energy"
  }, React.createElement("div", {
    className: "fill",
    style: {
      width: v + '%'
    }
  }), React.createElement("div", {
    className: "rk",
    style: {
      right: v + '%'
    }
  }, React.createElement(Icon, {
    n: "star",
    s: 2
  }))));
}
function Modal({
  children,
  onClose,
  wide
}) {
  return React.createElement("div", {
    className: "modal-bg",
    onClick: onClose
  }, React.createElement("div", {
    className: "modal card fade",
    style: wide ? {
      maxWidth: 960
    } : null,
    onClick: e => e.stopPropagation()
  }, children));
}
function Toast({
  msg
}) {
  return msg ? React.createElement("div", {
    className: "toast"
  }, msg) : null;
}
function HarvestBar({
  harvest,
  C
}) {
  return React.createElement("div", {
    className: "harvest"
  }, React.createElement("div", {
    className: "row",
    style: {
      gap: 8,
      maxWidth: 1180,
      margin: '0 auto'
    }
  }, React.createElement("span", {
    className: "small",
    style: {
      fontWeight: 800,
      whiteSpace: 'nowrap'
    }
  }, "\u062D\u0635\u0627\u062F\u064A"), React.createElement("div", {
    className: "hv grow"
  }, HARVEST.map(h => React.createElement("div", {
    key: h.k,
    className: 'hslot' + (harvest.includes(h.k) ? ' on' : ''),
    title: h.label
  }, React.createElement(Icon, {
    n: h.ic,
    s: 2
  }), React.createElement("span", null, h.label)))), React.createElement("b", {
    className: "small",
    style: {
      whiteSpace: 'nowrap'
    }
  }, harvest.length, "/", HARVEST.length)));
}
function GuideModal({
  k,
  onClose
}) {
  const g = GUIDE[k];
  if (!g) return null;
  return React.createElement(Modal, {
    onClose: onClose
  }, React.createElement("div", {
    className: "row between"
  }, React.createElement("div", {
    className: "h2"
  }, "\u062F\u0644\u064A\u0644 \u0627\u0644\u0645\u0639\u0644\u0645: ", g.t), React.createElement("span", {
    className: "pill"
  }, g.min, " \u062F\u0642\u064A\u0642\u0629")), React.createElement("ul", {
    className: "col",
    style: {
      marginTop: 12,
      paddingRight: 18,
      gap: 8
    }
  }, g.items.map((x, i) => React.createElement("li", {
    key: i
  }, x))), React.createElement("div", {
    style: {
      marginTop: 14
    }
  }, React.createElement(Legend, null)), React.createElement("div", {
    className: "row",
    style: {
      marginTop: 14,
      justifyContent: 'flex-end'
    }
  }, React.createElement("button", {
    className: "btn",
    onClick: onClose
  }, "\u0641\u0647\u0645\u062A")));
}
function TeacherDrawer({
  open,
  onClose,
  tagsOn,
  setTagsOn,
  viruses,
  logVirus,
  C,
  onReset,
  onGuide
}) {
  if (!open) return null;
  const list = VIRUSES.filter(v => C.girl ? true : v.k !== 'hay');
  return React.createElement(React.Fragment, null, React.createElement("div", {
    className: "modal-bg",
    style: {
      background: 'rgba(0,0,0,.35)'
    },
    onClick: onClose
  }), React.createElement("div", {
    className: "drawer"
  }, React.createElement("div", {
    className: "row between"
  }, React.createElement("div", {
    className: "h2"
  }, "\u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u0639\u0644\u0645"), React.createElement("button", {
    className: "btn ghost sm",
    onClick: onClose
  }, "\u0625\u063A\u0644\u0627\u0642")), React.createElement("div", {
    className: "card",
    style: {
      marginTop: 12
    }
  }, React.createElement("div", {
    className: "row between"
  }, React.createElement("b", null, "\u062A\u0631\u0645\u064A\u0632 \u0627\u0644\u0642\u0631\u0627\u0621\u0629"), React.createElement("button", {
    className: 'chip' + (tagsOn ? ' on' : ''),
    onClick: () => setTagsOn(!tagsOn)
  }, tagsOn ? 'ظاهر' : 'مخفي')), React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, React.createElement(Legend, null))), React.createElement("div", {
    className: "card",
    style: {
      marginTop: 12
    }
  }, React.createElement("b", null, "\u0633\u062C\u0651\u0644 \u0639\u0627\u0645\u064A\u0629 \u0633\u0645\u0639\u062A\u0647\u0627 (\u0628\u0635\u0645\u062A)"), React.createElement("div", {
    className: "mute small"
  }, "\u062A\u0638\u0647\u0631 \u0641\u064A \u0627\u0644\u0639\u064A\u0627\u062F\u0629 \u0644\u0639\u0644\u0627\u062C\u0647\u0627 \u0644\u0627\u062D\u0642\u064B\u0627. \u0644\u0627 \u062A\u0642\u0627\u0637\u0639 \u0627\u0644\u0637\u0627\u0644\u0628."), React.createElement("div", {
    className: "row wrapf",
    style: {
      marginTop: 8,
      gap: 6
    }
  }, list.map(v => {
    const n = viruses.filter(x => x === v.k).length;
    return React.createElement("button", {
      key: v.k,
      className: 'chip' + (n ? ' on' : ''),
      onClick: () => logVirus(v.k)
    }, v.amm, n ? React.createElement("b", null, " \xD7", n) : null);
  }))), React.createElement("div", {
    className: "card",
    style: {
      marginTop: 12
    }
  }, React.createElement("b", null, "\u0645\u0633\u0627\u0631 \u0627\u0644\u0642\u0631\u0627\u0621\u0629 \u0641\u064A \u0627\u0644\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0623\u0648\u0644"), React.createElement("div", {
    className: "mute small",
    style: {
      margin: '4px 0 8px'
    }
  }, "\u0627\u0644\u062A\u0635\u0646\u064A\u0641 \u0622\u0644\u064A \u0648\u0628\u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u0643\u0627\u0645\u0644\u0629: \u0643\u0644 \u0643\u0644\u0645\u0629 \u0641\u0648\u0642 \u0645\u0631\u062D\u0644\u0629 \u0627\u0644\u0637\u0627\u0644\u0628 \xAB\u0645\u062D\u0627\u0643\u0627\u0629\xBB\u060C \u0648\u0645\u0639 \u0643\u0644 \u0648\u062D\u062F\u0629 \u062A\u0646\u062A\u0642\u0644 \u0643\u0644\u0645\u0627\u062A \u0643\u0627\u0645\u0644\u0629 \u0645\u0646 \u0627\u0644\u0628\u0646\u0641\u0633\u062C\u064A \u0625\u0644\u0649 \u0627\u0644\u0623\u062E\u0636\u0631."), React.createElement("div", {
    className: "col",
    style: {
      gap: 6
    }
  }, PHASES.map(ph => React.createElement("div", {
    key: ph.n,
    className: "row",
    style: {
      gap: 8,
      padding: '6px 10px',
      borderRadius: 12,
      background: ph.n === LESSON.phase ? 'var(--acc-soft)' : 'transparent',
      border: '1px solid var(--line)'
    }
  }, React.createElement("b", {
    style: {
      minWidth: 64
    }
  }, ph.unit), React.createElement("b", {
    className: "naskh"
  }, ph.name), React.createElement("span", {
    className: "naskh mute small grow"
  }, ph.ex), ph.n === LESSON.phase && React.createElement("span", {
    className: "pill"
  }, "\u0627\u0644\u0622\u0646"))))), React.createElement("div", {
    className: "row",
    style: {
      marginTop: 14,
      gap: 8
    }
  }, React.createElement("button", {
    className: "btn ghost sm",
    onClick: onReset
  }, "\u21BA \u0637\u0627\u0644\u0628 \u062C\u062F\u064A\u062F"))));
}
let GEN = 'm';
const G = (m, f) => GEN === 'f' ? f : m;
const L1_AR = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const L1_SHUF = a => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};
const L1CH = {
  boy: {
    style: 'short',
    pal: {
      t: '#4f9ad8',
      T: '#3576b0',
      h: '#2b1a0e'
    }
  },
  girl: {
    style: 'long',
    pal: {
      t: '#ff7aa8',
      T: '#d9538a',
      h: '#5a2e14'
    }
  },
  father: {
    style: 'short',
    adult: 'm',
    pal: {
      t: '#2f9e44',
      T: '#21753a',
      h: '#2b1a0e',
      s: '#e3b088'
    }
  },
  mother: {
    style: 'hijab',
    adult: 'f',
    pal: {
      h: '#9b5de5',
      t: '#9b5de5',
      T: '#7442b8'
    }
  },
  brother: {
    style: 'short',
    pal: {
      t: '#f2b632',
      T: '#c98a12',
      h: '#2b1a0e'
    }
  },
  sister: {
    style: 'long',
    pal: {
      t: '#b28dff',
      T: '#8a63e0',
      h: '#3b2416'
    }
  },
  grandpa: {
    style: 'cap',
    adult: 'm',
    pal: {
      t: '#8a5a2e',
      T: '#6b4321',
      c: '#e5e7eb',
      h: '#d1d5db',
      s: '#e3b088'
    }
  },
  grandma: {
    style: 'hijab',
    adult: 'f',
    pal: {
      h: '#e5e7eb',
      t: '#6b7280',
      T: '#4b5563'
    }
  },
  teacherM: {
    style: 'short',
    adult: 'm',
    pal: {
      t: '#3a7bd5',
      T: '#2a5aa0',
      h: '#2b1a0e',
      s: '#e3b088'
    }
  },
  teacherF: {
    style: 'hijab',
    adult: 'f',
    pal: {
      h: '#0ea5e9',
      t: '#38bdf8',
      T: '#0284c7'
    }
  },
  neighbor: {
    style: 'cap',
    adult: 'm',
    pal: {
      t: '#e2483d',
      T: '#b83a30',
      c: '#ffffff',
      h: '#1b120c',
      s: '#e3b088'
    }
  },
  seller: {
    style: 'cap',
    adult: 'm',
    pal: {
      t: '#f59e0b',
      T: '#c47a12',
      c: '#c47a12',
      h: '#1b120c'
    }
  },
  maker: {
    style: 'short',
    adult: 'm',
    pal: {
      t: '#14b8a6',
      T: '#0f766e',
      h: '#3b2416'
    }
  },
  scribe: {
    style: 'cap',
    adult: 'm',
    pal: {
      t: '#f4f6f8',
      T: '#cfd6de',
      c: '#2a1d24',
      h: '#2b1a0e',
      s: '#e3b088'
    }
  },
  nurse: {
    style: 'hijab',
    adult: 'f',
    pal: {
      h: '#eef2f7',
      t: '#f4f6f8',
      T: '#cfd6de'
    }
  },
  zaid: {
    style: 'short',
    pal: {
      t: '#ef476f',
      T: '#b8304f',
      h: '#7a4a1e'
    }
  },
  salma: {
    style: 'long',
    pal: {
      t: '#2f9e44',
      T: '#21753a',
      h: '#1b120c'
    }
  },
  visitor: {
    style: 'cap',
    adult: 'm',
    pal: {
      t: '#6b7280',
      T: '#4b5563',
      c: '#3a7bd5',
      h: '#2b1a0e',
      s: '#e3b088'
    }
  },
  newFriendM: {
    style: 'short',
    pal: {
      t: '#22a06b',
      T: '#1a7f53',
      h: '#1b120c'
    }
  },
  newFriendF: {
    style: 'long',
    pal: {
      t: '#f59e0b',
      T: '#c47a12',
      h: '#5a2e14'
    }
  }
};
Object.assign(PX.icons, {
  mosque: {
    pal: {
      o: '#2a1d24',
      g: '#2f9e44',
      w: '#ffffff',
      d: '#8a5a2e',
      y: '#f6d365'
    },
    rows: [".....y......", "....ogo.....", "...oggggo...", "..oggggggo..", "..oggggggo..", ".oooooooooo.", ".owwwwwwwwo.", ".owwoddowwo.", ".owwoddowwo.", ".owwoddowwo.", ".oooooooooo.", "............"]
  },
  bag: {
    pal: {
      o: '#2a1d24',
      r: '#e2483d',
      R: '#b83a30',
      w: '#ffffff'
    },
    rows: ["............", "....oooo....", "...o....o...", "..oooooooo..", "..orrrrrro..", "..orRRRRro..", "..orRwwRro..", "..orRRRRro..", "..orrrrrro..", "..orrrrrro..", "..oooooooo..", "............"]
  },
  chair: {
    pal: {
      o: '#2a1d24',
      b: '#b07a45'
    },
    rows: ["............", "...o........", "...ob.......", "...ob.......", "...ob.......", "...ob.......", "...obbbbbo..", "...oooooooo.", "...o.....o..", "...o.....o..", "...o.....o..", "............"]
  },
  milk: {
    pal: {
      o: '#2a1d24',
      w: '#ffffff',
      b: '#3a7bd5'
    },
    rows: ["....oooo....", "....owwo....", "...owwwwo...", "..owwwwwwo..", "..owwwwwwo..", "..obbbbbbo..", "..obwwwwbo..", "..obbbbbbo..", "..owwwwwwo..", "..owwwwwwo..", "..oooooooo..", "............"]
  },
  apple: {
    pal: {
      o: '#2a1d24',
      r: '#e2483d',
      w: '#ffb3b3',
      g: '#2f9e44',
      G: '#21753a'
    },
    rows: ["......g.....", ".....gG.....", "...ooooooo..", "..orrrrrrro.", ".orrwrrrrrro", ".orwrrrrrrro", ".orrrrrrrrro", ".orrrrrrrrro", "..orrrrrrro.", "...orrorro..", "....oo.oo...", "............"]
  },
  market: {
    pal: {
      o: '#2a1d24',
      r: '#e2483d',
      w: '#ffffff',
      y: '#f6d365',
      g: '#2f9e44',
      b: '#b07a45'
    },
    rows: ["............", "oooooooooooo", "orwrwrwrwrwo", "orwrwrwrwrwo", ".o........o.", ".o........o.", ".o.yyggrr.o.", ".oooooooooo.", ".obbbbbbbbo.", ".obbbbbbbbo.", ".oooooooooo.", "............"]
  },
  hospital: {
    pal: {
      o: '#2a1d24',
      w: '#ffffff',
      r: '#e2483d',
      b: '#7cc4ff'
    },
    rows: ["............", ".oooooooooo.", ".owwwwwwwwo.", ".owwwrrwwwo.", ".owwrrrrwwo.", ".owwwrrwwwo.", ".owwwwwwwwo.", ".owbwwwwbwo.", ".owwwoowwwo.", ".owwwoowwwo.", ".oooooooooo.", "............"]
  },
  plane: {
    pal: {
      o: '#2a1d24',
      b: '#7cc4ff'
    },
    rows: ["............", ".....oo.....", ".....ob.....", "o....ob....o", "oooooobooooo", "obbbbbbbbbbo", "oooooobooooo", ".....ob.....", "....oobbo...", ".....oo.....", "............", "............"]
  },
  clock: {
    pal: {
      o: '#2a1d24',
      w: '#ffffff'
    },
    rows: ["...oooooo...", "..owwwwwwo..", ".owwwwowwwo.", ".owwwwowwwo.", ".owwwwowwwo.", ".owwwwooowo.", ".owwwwwwwwo.", ".owwwwwwwwo.", "..owwwwwwo..", "...oooooo...", "..o......o..", "............"]
  },
  bulb: {
    pal: {
      o: '#2a1d24',
      y: '#f6d365',
      Y: '#fff3b0',
      g: '#94a3b8'
    },
    rows: ["....oooo....", "...oyyyyo...", "..oyyYyyyo..", "..oyYyyyyo..", "..oyyyyyyo..", "...oyyyyo...", "....oyyo....", "....oggo....", "....oggo....", ".....oo.....", "............", "............"]
  },
  bread: {
    pal: {
      o: '#2a1d24',
      b: '#e0a458',
      B: '#b9783a'
    },
    rows: ["............", "............", "...oooooo...", "..obbbbbbo..", ".obBbBbBbbo.", ".obbbbbbbbo.", ".obbbbbbbbo.", ".oBBBBBBBBo.", "..oooooooo..", "............", "............", "............"]
  },
  juice: {
    pal: {
      o: '#2a1d24',
      g: '#f59e0b',
      y: '#fff3c4',
      w: '#ffffff',
      s: '#e2483d'
    },
    rows: ["............", ".......ss...", "......s.....", "...oooooo...", "...owwwwo...", "...oggggo...", "...ogyygo...", "...ogyygo...", "...oggggo...", "...oggggo...", "...oooooo...", "............"]
  },
  water: {
    pal: {
      o: '#2a1d24',
      b: '#7cc4ff',
      B: '#4aa3ff',
      w: '#ffffff'
    },
    rows: ["............", "..oooooooo..", "..owwwwwwo..", "..obbbbbbo..", "..obwbbbbo..", "..obwbbbbo..", "..obbbbbbo..", "..oBbbbbbo..", "..oBBbbbbo..", "..oBBBBBBo..", "..oooooooo..", "............"]
  },
  bed: {
    pal: {
      o: '#2a1d24',
      b: '#8a5a2e',
      w: '#ffffff',
      r: '#e2483d',
      R: '#b83a30'
    },
    rows: ["............", "............", "o...........", "ob..........", "obwwoo......", "obwwoorrrrro", "obooorrrrrRo", "oooooooooooo", "obbbbbbbbbbo", "oooooooooooo", "o..........o", "............"]
  },
  sun: {
    pal: {
      o: '#c98a12',
      y: '#f6d365',
      Y: '#f2b632'
    },
    rows: [".....o......", "..o..o..o...", "...o...o....", "....ooo.....", "o..oyyyo..o.", ".ooyyYyyoo..", "...oyyyo....", "....ooo.....", "...o...o....", "..o..o..o...", ".....o......", "............"]
  },
  food: {
    pal: {
      o: '#2a1d24',
      w: '#ffffff',
      g: '#d9d9d9',
      r: '#e2483d',
      y: '#f6d365',
      G: '#2f9e44'
    },
    rows: ["............", "............", "....yyGG....", "...yrryGG...", "..yyrrryyy..", ".oooooooooo.", "owwwwwwwwwwo", ".owwwwwwwwo.", "..ogggggggo.", "...oooooo...", "............", "............"]
  }
});
const L1_COUNTRIES = [{
  id: 'syria',
  n: 'سُورِيَا',
  from: 'مِنْ سُورِيَا'
}, {
  id: 'palestine',
  n: 'فِلَسْطِينُ',
  from: 'مِنْ فِلَسْطِينَ'
}, {
  id: 'jordan',
  n: 'الْأُرْدُنُّ',
  from: 'مِنَ الْأُرْدُنِّ'
}, {
  id: 'lebanon',
  n: 'لُبْنَانُ',
  from: 'مِنْ لُبْنَانَ'
}, {
  id: 'egypt',
  n: 'مِصْرُ',
  from: 'مِنْ مِصْرَ'
}, {
  id: 'iraq',
  n: 'الْعِرَاقُ',
  from: 'مِنَ الْعِرَاقِ'
}, {
  id: 'morocco',
  n: 'الْمَغْرِبُ',
  from: 'مِنَ الْمَغْرِبِ'
}, {
  id: 'algeria',
  n: 'الْجَزَائِرُ',
  from: 'مِنَ الْجَزَائِرِ'
}, {
  id: 'yemen',
  n: 'الْيَمَنُ',
  from: 'مِنَ الْيَمَنِ'
}, {
  id: 'sudan',
  n: 'السُّودَانُ',
  from: 'مِنَ السُّودَانِ'
}, {
  id: 'turkey',
  n: 'تُرْكِيَا',
  from: 'مِنْ تُرْكِيَا'
}, {
  id: 'canada',
  n: 'كَنَدَا',
  from: 'مِنْ كَنَدَا'
}];
const l1Country = id => L1_COUNTRIES.find(c => c.id === id) || L1_COUNTRIES[0];
const L1_LIKES = [{
  v: 'ball',
  w: 'الْكُرَةَ',
  label: 'الْكُرَةُ',
  ic: 'ball'
}, {
  v: 'draw',
  w: 'الرَّسْمَ',
  label: 'الرَّسْمُ',
  ic: 'palette'
}, {
  v: 'swim',
  w: 'السِّبَاحَةَ',
  label: 'السِّبَاحَةُ',
  ic: 'swim'
}, {
  v: 'read',
  w: 'الْقِرَاءَةَ',
  label: 'الْقِرَاءَةُ',
  ic: 'openbook'
}];
const L1_LET = {
  'ا': {
    n: 'أَلِفٌ',
    c: false
  },
  'أ': {
    n: 'أَلِفٌ عَلَيْهَا هَمْزَةٌ',
    c: false
  },
  'ب': {
    n: 'بَاءٌ',
    c: true
  },
  'ت': {
    n: 'تَاءٌ',
    c: true
  },
  'د': {
    n: 'دَالٌ',
    c: false
  },
  'ر': {
    n: 'رَاءٌ',
    c: false
  },
  'س': {
    n: 'سِينٌ',
    c: true
  },
  'ص': {
    n: 'صَادٌ',
    c: true
  },
  'ق': {
    n: 'قَافٌ',
    c: true
  },
  'ل': {
    n: 'لَامٌ',
    c: true
  },
  'م': {
    n: 'مِيمٌ',
    c: true
  },
  'ن': {
    n: 'نُونٌ',
    c: true
  },
  'و': {
    n: 'وَاوٌ',
    c: false
  },
  'ي': {
    n: 'يَاءٌ',
    c: true
  }
};
const ZWJ = '‍';
const L1_FORM_LBL = {
  iso: 'وَحْدَهُ',
  ini: 'فِي الْأَوَّلِ',
  med: 'فِي الْوَسَطِ',
  fin: 'فِي الْآخِرِ'
};
const l1Form = (ch, f) => f === 'ini' ? ch + ZWJ : f === 'med' ? ZWJ + ch + ZWJ : f === 'fin' ? ZWJ + ch : ch;
function l1WordForms(letters) {
  return letters.map((ch, i) => {
    const prev = i > 0 && L1_LET[letters[i - 1]].c,
      next = i < letters.length - 1,
      c = L1_LET[ch].c;
    const f = c ? prev ? next ? 'med' : 'fin' : next ? 'ini' : 'iso' : prev ? 'fin' : 'iso';
    return {
      ch,
      f
    };
  });
}
Object.assign(L1_LET, {
  'ث': {
    n: 'ثَاءٌ',
    c: true
  },
  'ج': {
    n: 'جِيمٌ',
    c: true
  },
  'ح': {
    n: 'حَاءٌ',
    c: true
  },
  'خ': {
    n: 'خَاءٌ',
    c: true
  },
  'ذ': {
    n: 'ذَالٌ',
    c: false
  },
  'ز': {
    n: 'زَايٌ',
    c: false
  },
  'ش': {
    n: 'شِينٌ',
    c: true
  },
  'ض': {
    n: 'ضَادٌ',
    c: true
  },
  'ط': {
    n: 'طَاءٌ',
    c: true
  },
  'ظ': {
    n: 'ظَاءٌ',
    c: true
  },
  'ع': {
    n: 'عَيْنٌ',
    c: true
  },
  'غ': {
    n: 'غَيْنٌ',
    c: true
  },
  'ف': {
    n: 'فَاءٌ',
    c: true
  },
  'ك': {
    n: 'كَافٌ',
    c: true
  },
  'ه': {
    n: 'هَاءٌ',
    c: true
  },
  'ة': {
    n: 'تَاءٌ مَرْبُوطَةٌ',
    c: false
  }
});
const L1_SCENES = {
  greet: [[{
    ch: 'boy',
    x: .25,
    y: .9
  }, {
    ch: 'neighbor',
    x: .72,
    y: .9,
    flip: 1
  }], [{
    ch: 'boy',
    x: .3,
    y: .9
  }, {
    ic: 'hand',
    x: .45,
    y: .45,
    s: .5
  }, {
    ch: 'neighbor',
    x: .7,
    y: .9,
    flip: 1
  }], [{
    ch: 'boy',
    x: .3,
    y: .9
  }, {
    ic: 'hand',
    x: .45,
    y: .45,
    s: .5
  }, {
    ic: 'hand',
    x: .62,
    y: .45,
    s: .5
  }, {
    ch: 'neighbor',
    x: .7,
    y: .9,
    flip: 1
  }]],
  thanks: [[{
    ch: 'neighbor',
    x: .7,
    y: .9,
    flip: 1
  }, {
    ic: 'apple',
    x: .62,
    y: .5,
    s: .45
  }, {
    ch: 'boy',
    x: .25,
    y: .9
  }], [{
    ch: 'neighbor',
    x: .7,
    y: .9,
    flip: 1
  }, {
    ic: 'apple',
    x: .42,
    y: .5,
    s: .45
  }, {
    ch: 'boy',
    x: .25,
    y: .9
  }], [{
    ch: 'neighbor',
    x: .7,
    y: .9,
    flip: 1
  }, {
    ic: 'heart',
    x: .45,
    y: .3,
    s: .45
  }, {
    ic: 'apple',
    x: .3,
    y: .5,
    s: .4
  }, {
    ch: 'boy',
    x: .25,
    y: .9
  }]],
  bye: [[{
    ch: 'boy',
    x: .3,
    y: .9
  }, {
    ch: 'neighbor',
    x: .7,
    y: .9,
    flip: 1
  }], [{
    ch: 'boy',
    x: .22,
    y: .9
  }, {
    ic: 'hand',
    x: .38,
    y: .4,
    s: .5
  }, {
    ch: 'neighbor',
    x: .78,
    y: .9,
    flip: 1
  }], [{
    ch: 'boy',
    x: .12,
    y: .9
  }, {
    ic: 'hand',
    x: .3,
    y: .4,
    s: .5
  }, {
    ch: 'neighbor',
    x: .9,
    y: .9,
    flip: 1
  }]],
  neighbor: [[{
    ic: 'house',
    x: .25,
    y: .95,
    s: 1.1
  }, {
    ic: 'house',
    x: .75,
    y: .95,
    s: 1.1
  }], [{
    ic: 'house',
    x: .25,
    y: .95,
    s: 1.1
  }, {
    ch: 'boy',
    x: .4,
    y: .98
  }, {
    ic: 'house',
    x: .75,
    y: .95,
    s: 1.1
  }, {
    ch: 'neighbor',
    x: .6,
    y: .98,
    flip: 1
  }], [{
    ic: 'house',
    x: .25,
    y: .95,
    s: 1.1
  }, {
    ch: 'boy',
    x: .44,
    y: .98
  }, {
    ic: 'hand',
    x: .5,
    y: .4,
    s: .45
  }, {
    ic: 'house',
    x: .75,
    y: .95,
    s: 1.1
  }, {
    ch: 'neighbor',
    x: .58,
    y: .98,
    flip: 1
  }]],
  friend: [[{
    ch: 'boy',
    x: .3,
    y: .9
  }, {
    ch: 'zaid',
    x: .7,
    y: .9,
    flip: 1
  }], [{
    ch: 'boy',
    x: .35,
    y: .9
  }, {
    ic: 'ball',
    x: .5,
    y: .5,
    s: .5
  }, {
    ch: 'zaid',
    x: .65,
    y: .9,
    flip: 1
  }], [{
    ch: 'boy',
    x: .35,
    y: .9
  }, {
    ic: 'heart',
    x: .5,
    y: .3,
    s: .45
  }, {
    ic: 'ball',
    x: .5,
    y: .55,
    s: .5
  }, {
    ch: 'zaid',
    x: .65,
    y: .9,
    flip: 1
  }]],
  newkid: [[{
    ic: 'park',
    x: .5,
    y: .95,
    s: 1.2
  }, {
    ch: 'boy',
    x: .25,
    y: .98
  }], [{
    ic: 'park',
    x: .5,
    y: .95,
    s: 1.2
  }, {
    ch: 'boy',
    x: .25,
    y: .98
  }, {
    ch: 'newFriendM',
    x: .95,
    y: .98,
    flip: 1
  }], [{
    ic: 'park',
    x: .5,
    y: .95,
    s: 1.2
  }, {
    ch: 'boy',
    x: .25,
    y: .98
  }, {
    ic: 'question',
    x: .5,
    y: .35,
    s: .45
  }, {
    ch: 'newFriendM',
    x: .75,
    y: .98,
    flip: 1
  }]],
  help: [[{
    ch: 'zaid',
    x: .7,
    y: .9,
    flip: 1
  }, {
    ic: 'bag',
    x: .7,
    y: .55,
    s: .45
  }, {
    ch: 'boy',
    x: .25,
    y: .9
  }], [{
    ch: 'zaid',
    x: .7,
    y: .9,
    flip: 1
  }, {
    ic: 'bag',
    x: .5,
    y: .5,
    s: .45
  }, {
    ch: 'boy',
    x: .35,
    y: .9
  }], [{
    ch: 'zaid',
    x: .7,
    y: .9,
    flip: 1
  }, {
    ic: 'bag',
    x: .35,
    y: .5,
    s: .45
  }, {
    ch: 'boy',
    x: .35,
    y: .9
  }, {
    ic: 'star',
    x: .55,
    y: .25,
    s: .4
  }]],
  kind: [[{
    ch: 'zaid',
    x: .3,
    y: .9
  }, {
    ic: 'apple',
    x: .3,
    y: .5,
    s: .45
  }, {
    ch: 'boy',
    x: .7,
    y: .9,
    flip: 1
  }], [{
    ch: 'zaid',
    x: .35,
    y: .9
  }, {
    ic: 'apple',
    x: .5,
    y: .5,
    s: .45
  }, {
    ch: 'boy',
    x: .7,
    y: .9,
    flip: 1
  }], [{
    ch: 'zaid',
    x: .35,
    y: .9
  }, {
    ic: 'apple',
    x: .68,
    y: .5,
    s: .45
  }, {
    ic: 'heart',
    x: .5,
    y: .25,
    s: .4
  }, {
    ch: 'boy',
    x: .7,
    y: .9,
    flip: 1
  }]],
  smart: [[{
    ch: 'zaid',
    x: .4,
    y: .9
  }, {
    ic: 'question',
    x: .6,
    y: .4,
    s: .5
  }], [{
    ch: 'zaid',
    x: .4,
    y: .9
  }, {
    ic: 'bulb',
    x: .6,
    y: .35,
    s: .5
  }], [{
    ch: 'zaid',
    x: .4,
    y: .9
  }, {
    ic: 'bulb',
    x: .6,
    y: .3,
    s: .6
  }, {
    ic: 'star',
    x: .78,
    y: .2,
    s: .35
  }]],
  plays: [[{
    ch: 'zaid',
    x: .3,
    y: .9
  }, {
    ic: 'ball',
    x: .45,
    y: .8,
    s: .45
  }, {
    ch: 'boy',
    x: .7,
    y: .9,
    flip: 1
  }], [{
    ch: 'zaid',
    x: .3,
    y: .9
  }, {
    ic: 'ball',
    x: .5,
    y: .5,
    s: .45
  }, {
    ch: 'boy',
    x: .7,
    y: .9,
    flip: 1
  }], [{
    ch: 'zaid',
    x: .3,
    y: .9
  }, {
    ic: 'ball',
    x: .58,
    y: .8,
    s: .45
  }, {
    ch: 'boy',
    x: .7,
    y: .9,
    flip: 1
  }]],
  likes3: [[{
    ch: 'zaid',
    x: .4,
    y: .9
  }], [{
    ch: 'zaid',
    x: .4,
    y: .9
  }, {
    ic: 'ball',
    x: .62,
    y: .5,
    s: .5
  }], [{
    ch: 'zaid',
    x: .4,
    y: .9
  }, {
    ic: 'ball',
    x: .62,
    y: .5,
    s: .5
  }, {
    ic: 'heart',
    x: .5,
    y: .22,
    s: .4
  }]],
  guest: [[{
    ic: 'house',
    x: .3,
    y: .95,
    s: 1.2
  }, {
    ch: 'visitor',
    x: .85,
    y: .98,
    flip: 1
  }], [{
    ic: 'house',
    x: .3,
    y: .95,
    s: 1.2
  }, {
    ch: 'visitor',
    x: .6,
    y: .98,
    flip: 1
  }, {
    ic: 'hand',
    x: .5,
    y: .4,
    s: .4
  }], [{
    ic: 'house',
    x: .3,
    y: .95,
    s: 1.2
  }, {
    ch: 'visitor',
    x: .32,
    y: .98,
    flip: 1
  }, {
    ic: 'chair',
    x: .22,
    y: .95,
    s: .6
  }]],
  big: [[{
    ch: 'grandpa',
    x: .35,
    y: .95
  }, {
    ch: 'boy',
    x: .7,
    y: .95
  }], [{
    ch: 'grandpa',
    x: .35,
    y: .95
  }, {
    ic: 'star',
    x: .35,
    y: .12,
    s: .35
  }, {
    ch: 'boy',
    x: .7,
    y: .95
  }], [{
    ch: 'grandpa',
    x: .35,
    y: .95
  }, {
    ic: 'star',
    x: .35,
    y: .12,
    s: .35
  }, {
    ch: 'boy',
    x: .7,
    y: .95
  }]],
  small: [[{
    ch: 'grandpa',
    x: .35,
    y: .95
  }, {
    ch: 'boy',
    x: .7,
    y: .95
  }], [{
    ch: 'grandpa',
    x: .35,
    y: .95
  }, {
    ch: 'boy',
    x: .7,
    y: .95
  }, {
    ic: 'star',
    x: .7,
    y: .35,
    s: .35
  }], [{
    ch: 'grandpa',
    x: .35,
    y: .95
  }, {
    ch: 'boy',
    x: .7,
    y: .95
  }, {
    ic: 'star',
    x: .7,
    y: .35,
    s: .35
  }]],
  works: [[{
    ch: 'father',
    x: .35,
    y: .95
  }, {
    ic: 'house',
    x: .75,
    y: .95,
    s: .9
  }], [{
    ch: 'father',
    x: .5,
    y: .95
  }, {
    ic: 'house',
    x: .75,
    y: .95,
    s: .9
  }], [{
    ch: 'father',
    x: .62,
    y: .95
  }, {
    ic: 'bag',
    x: .5,
    y: .55,
    s: .4
  }, {
    ic: 'house',
    x: .75,
    y: .95,
    s: .9
  }]],
  cooks: [[{
    ch: 'mother',
    x: .4,
    y: .95
  }, {
    ic: 'pan',
    x: .65,
    y: .7,
    s: .5
  }], [{
    ch: 'mother',
    x: .4,
    y: .95
  }, {
    ic: 'pan',
    x: .65,
    y: .7,
    s: .5
  }, {
    ic: 'food',
    x: .65,
    y: .35,
    s: .4
  }], [{
    ch: 'mother',
    x: .4,
    y: .95
  }, {
    ic: 'food',
    x: .65,
    y: .5,
    s: .55
  }]],
  hunger: [[{
    ch: 'boy',
    x: .4,
    y: .95
  }, {
    ic: 'bread',
    x: .7,
    y: .5,
    s: .45
  }], [{
    ch: 'boy',
    x: .4,
    y: .95
  }, {
    ic: 'bread',
    x: .7,
    y: .5,
    s: .55
  }], [{
    ch: 'boy',
    x: .4,
    y: .95
  }, {
    ic: 'bread',
    x: .7,
    y: .5,
    s: .45
  }, {
    ic: 'question',
    x: .55,
    y: .25,
    s: .35
  }]],
  thirst: [[{
    ch: 'boy',
    x: .4,
    y: .95
  }, {
    ic: 'sun',
    x: .75,
    y: .3,
    s: .5
  }], [{
    ch: 'boy',
    x: .4,
    y: .95
  }, {
    ic: 'sun',
    x: .75,
    y: .3,
    s: .5
  }, {
    ic: 'water',
    x: .68,
    y: .75,
    s: .45
  }], [{
    ch: 'boy',
    x: .4,
    y: .95
  }, {
    ic: 'sun',
    x: .75,
    y: .3,
    s: .5
  }, {
    ic: 'water',
    x: .68,
    y: .75,
    s: .55
  }]],
  tired: [[{
    ch: 'boy',
    x: .4,
    y: .95
  }, {
    ic: 'ball',
    x: .65,
    y: .8,
    s: .4
  }], [{
    ch: 'boy',
    x: .4,
    y: .95
  }, {
    ic: 'bed',
    x: .7,
    y: .9,
    s: .7
  }], [{
    ic: 'bed',
    x: .5,
    y: .9,
    s: .9
  }, {
    ic: 'moon',
    x: .8,
    y: .25,
    s: .4
  }]],
  wake: [[{
    ic: 'bed',
    x: .45,
    y: .9,
    s: .9
  }, {
    ic: 'moon',
    x: .8,
    y: .25,
    s: .4
  }], [{
    ic: 'bed',
    x: .45,
    y: .9,
    s: .9
  }, {
    ic: 'sun',
    x: .8,
    y: .25,
    s: .4
  }], [{
    ic: 'bed',
    x: .45,
    y: .9,
    s: .9
  }, {
    ch: 'boy',
    x: .75,
    y: .98
  }, {
    ic: 'sun',
    x: .8,
    y: .25,
    s: .4
  }]],
  pray: [[{
    ic: 'mosque',
    x: .5,
    y: .95,
    s: 1.1
  }], [{
    ic: 'mosque',
    x: .5,
    y: .95,
    s: 1.1
  }, {
    ch: 'boy',
    x: .2,
    y: .98
  }], [{
    ic: 'mosque',
    x: .5,
    y: .95,
    s: 1.1
  }, {
    ch: 'boy',
    x: .4,
    y: .98
  }]],
  go: [[{
    ch: 'boy',
    x: .15,
    y: .98
  }, {
    ic: 'school',
    x: .75,
    y: .95,
    s: 1.1
  }], [{
    ch: 'boy',
    x: .35,
    y: .98
  }, {
    ic: 'school',
    x: .75,
    y: .95,
    s: 1.1
  }], [{
    ch: 'boy',
    x: .55,
    y: .98
  }, {
    ic: 'school',
    x: .75,
    y: .95,
    s: 1.1
  }]],
  sleep: [[{
    ic: 'bed',
    x: .45,
    y: .9,
    s: .9
  }, {
    ic: 'sun',
    x: .8,
    y: .25,
    s: .4
  }, {
    ch: 'boy',
    x: .75,
    y: .98
  }], [{
    ic: 'bed',
    x: .45,
    y: .9,
    s: .9
  }, {
    ic: 'moon',
    x: .8,
    y: .25,
    s: .4
  }, {
    ch: 'boy',
    x: .55,
    y: .98
  }], [{
    ic: 'bed',
    x: .45,
    y: .9,
    s: .9
  }, {
    ic: 'moon',
    x: .8,
    y: .25,
    s: .4
  }]],
  new: [[{
    ic: 'bag',
    x: .5,
    y: .7,
    s: .6
  }], [{
    ic: 'bag',
    x: .5,
    y: .7,
    s: .6
  }, {
    ic: 'star',
    x: .3,
    y: .25,
    s: .3
  }], [{
    ic: 'bag',
    x: .5,
    y: .7,
    s: .6
  }, {
    ic: 'star',
    x: .3,
    y: .25,
    s: .3
  }, {
    ic: 'star',
    x: .7,
    y: .2,
    s: .3
  }]]
};
(function () {
  const pad = rows => rows.map(r => (r + '............').slice(0, 12)).concat(Array(Math.max(0, 12 - rows.length)).fill('............')).slice(0, 12);
  const ic = (pal, rows) => ({
    pal: Object.assign({
      o: '#2a1d24',
      w: '#ffffff',
      k: '#1b1b1b'
    }, pal),
    rows: pad(rows)
  });
  const arrowR = ["............", "............", "......y.....", "......yy....", "......yyy...", ".yyyyyyyyy..", ".yyyyyyyyy..", "......yyy...", "......yy....", "......y.....", "............", "............"];
  Object.assign(PX.icons, {
    rope: ic({
      h: '#e2483d',
      y: '#c98a12'
    }, ["............", ".hh......hh.", ".hh......hh.", "..y......y..", "..y......y..", "...y....y...", "...y....y...", "....y..y....", ".....yy.....", "............"]),
    coin: ic({
      y: '#f6d365',
      d: '#c98a12'
    }, ["............", "....oooo....", "...oyyyyo...", "..oyyddyyo..", "..oydyyyyo..", "..oydyyyyo..", "..oyyddyyo..", "...oyyyyo...", "....oooo...."]),
    shirt: ic({
      w: '#f8fafc'
    }, ["............", "...oo..oo...", "..owwoowwo..", ".owwwwwwwwo.", "owwowwwwowwo", "oo.owwwwo.oo", "...owwwwo...", "...owwwwo...", "...owwwwo...", "...owwwwo...", "...oooooo..."]),
    dress: ic({
      p: '#ff7aa8'
    }, ["............", "....oooo....", "...oppppo...", "..oppppppo..", "...oppppo...", "...oppppo...", "..oppppppo..", "..oppppppo..", ".oppppppppo.", ".oppppppppo.", ".oooooooooo."]),
    gift: ic({
      g: '#3a7bd5',
      r: '#e2483d'
    }, ["............", ".....rrr....", ".oooooooooo.", ".oggggrgggo.", ".oggggrgggo.", ".oooooooooo.", "..ogggrggo..", "..ogggrggo..", "..ogggrggo..", "..ogggrggo..", "..oooooooo.."]),
    medicine: ic({
      r: '#e2483d'
    }, ["............", "....oooo....", "....orro....", "...oooooo...", "...owwwwo...", "...owrrwo...", "...orrrro...", "...owrrwo...", "...owwwwo...", "...owwwwo...", "...oooooo..."]),
    ouch: ic({
      r: '#ef233c'
    }, ["............", ".....r......", "..r..r..r...", "...r.r.r....", "....rrr.....", ".rrrrrrrrr..", "....rrr.....", "...r.r.r....", "..r..r..r...", ".....r......"]),
    calendar: ic({
      r: '#e2483d',
      k: '#9aa5b1'
    }, ["..o.o..o.o..", ".oooooooooo.", ".orrrrrrrro.", ".oooooooooo.", ".owwwwwwwwo.", ".owkkwwkkwo.", ".owwwwwwwwo.", ".owkkwwkkwo.", ".owwwwwwwwo.", ".oooooooooo."]),
    arrowR: ic({
      y: '#f59e0b'
    }, arrowR),
    arrowL: ic({
      y: '#f59e0b'
    }, arrowR.map(r => r.split('').reverse().join(''))),
    board: ic({
      g: '#2f6f4f',
      w: '#ffffff'
    }, ["............", "oooooooooooo", "oggggggggggo", "ogwwggggwggo", "oggggwwggggo", "oggggggggggo", "oooooooooooo", "....o..o....", "...o....o..."])
  });
  Object.assign(L1CH, {
    doctor: {
      style: 'cap',
      adult: 'm',
      pal: {
        t: '#f4f6f8',
        T: '#cfd6de',
        c: '#22a06b',
        h: '#2b1a0e',
        s: '#e3b088'
      }
    },
    builder: {
      style: 'cap',
      adult: 'm',
      pal: {
        t: '#f59e0b',
        T: '#c47a12',
        c: '#facc15',
        h: '#1b120c',
        s: '#e3b088'
      }
    }
  });
  const B = (x, o) => Object.assign({
    ch: 'boy',
    x,
    y: .9
  }, o || {});
  const I = (n, x, y, s) => ({
    ic: n,
    x,
    y,
    s: s || .6
  });
  const C = (ch, x, o) => Object.assign({
    ch,
    x,
    y: .9
  }, o || {});
  Object.assign(L1_SCENES, {
    search: [[B(.3), I('question', .3, .32, .4)], [B(.5, {
      flip: 1
    })], [B(.7), I('question', .7, .32, .4)]],
    inP: [[I('bag', .62, .92, 1), I('ball', .25, .4, .4)], [I('bag', .62, .92, 1), I('ball', .45, .45, .4)], [I('bag', .62, .92, 1), I('ball', .62, .62, .4)]],
    onP: [[I('desk', .55, .92, 1.1), I('ball', .2, .45, .4)], [I('desk', .55, .92, 1.1), I('ball', .4, .35, .4)], [I('desk', .55, .92, 1.1), I('ball', .55, .5, .4)]],
    underP: [[I('chair', .55, .92, 1.1), I('ball', .18, .92, .4)], [I('chair', .55, .92, 1.1), I('ball', .38, .92, .4)], [I('chair', .55, .92, 1.1), I('ball', .56, .92, .4)]],
    aboveP: [[I('bed', .5, .92, 1.1), I('bulb', .5, .35, .5)], [I('bed', .5, .92, 1.1), I('bulb', .5, .35, .5), I('star', .68, .3, .3)]],
    nearS: [[I('house', .2, .92, 1), I('mosque', .55, .92, 1), B(.3)], [I('house', .2, .92, 1), I('mosque', .55, .92, 1), B(.38)], [I('house', .2, .92, 1), I('mosque', .55, .92, 1), B(.45), I('star', .45, .3, .3)]],
    farS: [[I('house', .1, .92, .9), I('school', .92, .92, .5), B(.18)], [I('house', .1, .92, .9), I('school', .92, .92, .5), B(.4)], [I('house', .1, .92, .9), I('school', .92, .92, .5), B(.62)], [I('house', .1, .92, .9), I('school', .92, .92, .5), B(.8)]],
    count: [[I('bread', .25, .8, .6)], [I('bread', .25, .8, .6), I('bread', .5, .8, .6)], [I('bread', .25, .8, .6), I('bread', .5, .8, .6), I('bread', .75, .8, .6)]],
    pay: [[B(.2), C('seller', .8, {
      flip: 1
    }), I('coin', .32, .5, .35)], [B(.2), C('seller', .8, {
      flip: 1
    }), I('coin', .5, .45, .35)], [B(.2), C('seller', .8, {
      flip: 1
    }), I('coin', .68, .5, .35), I('bread', .5, .62, .4)]],
    we: [[B(.25), C('zaid', .5), C('girl', .75)], [B(.25), C('zaid', .5), C('girl', .75), I('heart', .5, .22, .35)], [B(.3), C('zaid', .5), C('girl', .7), I('heart', .3, .22, .3), I('heart', .7, .22, .3)]],
    turn: [[B(.25), C('zaid', .75, {
      flip: 1
    }), I('ball', .32, .9, .35), I('star', .25, .2, .35)], [B(.25), C('zaid', .75, {
      flip: 1
    }), I('ball', .35, .6, .35), I('star', .25, .2, .35)]],
    turn2: [[B(.25), C('zaid', .75, {
      flip: 1
    }), I('ball', .45, .55, .35)], [B(.25), C('zaid', .75, {
      flip: 1
    }), I('ball', .68, .9, .35), I('star', .75, .2, .35)]],
    start: [[B(.4), I('flag', .55, .75, .45)], [B(.4), I('flag', .55, .55, .45)], [B(.4), I('flag', .55, .35, .45), I('star', .7, .25, .3)]],
    come: [[B(.25), I('hand', .38, .45, .4), C('zaid', .85, {
      flip: 1
    })], [B(.25), I('hand', .38, .4, .4), C('zaid', .65, {
      flip: 1
    })], [B(.25), C('zaid', .45, {
      flip: 1
    }), I('heart', .35, .22, .3)]],
    back: [[I('school', .85, .92, .9), B(.2)], [I('school', .85, .92, .9), B(.42)], [I('school', .85, .92, .9), B(.64)]],
    sick: [[B(.5), I('ouch', .5, .45, .35)], [B(.5)], [I('bed', .5, .92, 1.1), B(.5), I('ouch', .5, .45, .35)]],
    pHead: [[B(.5), I('ouch', .5, .42, .35)], [B(.5)]],
    pBelly: [[B(.5), I('ouch', .5, .74, .35)], [B(.5)]],
    pBack: [[B(.5, {
      flip: 1
    }), I('ouch', .62, .62, .35)], [B(.5, {
      flip: 1
    })]],
    yest: [[I('calendar', .5, .85, .9)], [I('calendar', .5, .85, .9), I('arrowR', .82, .6, .45)], [I('calendar', .5, .85, .9), I('arrowR', .86, .6, .45), I('moon', .2, .35, .35)]],
    today: [[I('calendar', .5, .85, .9), I('sun', .2, .35, .4)], [I('calendar', .5, .85, .9), I('sun', .2, .35, .4), I('star', .5, .2, .3)]],
    tmrw: [[I('calendar', .5, .85, .9)], [I('calendar', .5, .85, .9), I('arrowL', .18, .6, .45)], [I('calendar', .5, .85, .9), I('arrowL', .14, .6, .45), I('sun', .82, .35, .35)]],
    visit: [[I('house', .72, .92, 1), B(.2)], [I('house', .72, .92, 1), B(.42)], [I('house', .72, .92, 1), B(.5), C('grandpa', .88, {
      flip: 1
    }), I('heart', .7, .2, .3)]],
    eid: [[I('moon', .3, .35, .5), I('gift', .7, .9, .6)], [I('moon', .3, .35, .5), I('star', .55, .2, .3), I('gift', .7, .9, .6)], [I('moon', .3, .35, .5), I('star', .55, .2, .3), I('star', .8, .3, .3), I('gift', .7, .9, .6)]],
    clean: [[I('shirt', .5, .88, .9)], [I('shirt', .5, .88, .9), I('star', .3, .3, .3)], [I('shirt', .5, .88, .9), I('star', .3, .3, .3), I('star', .72, .25, .3)]]
  });
})();
const L1_PARTS = {
  1: 'الْجُزْءُ الْأَوَّلُ',
  4: 'الْجُزْءُ الثَّانِي'
};

const L1_ST = [{
  k: 'vocab',
  t: 'الْمُفْرَدَاتُ',
  who: 'vocab'
}, {
  k: 'read',
  t: 'قِرَاءَةُ الْمُحَاكَاةِ',
  who: 'host'
}, {
  k: 'rule',
  t: 'الْقَالَبُ وَالْقَاعِدَةُ',
  who: 'rule'
}, {
  k: 'hide',
  t: 'الْقِرَاءَةُ بِالْقَرَائِنِ',
  who: 'hide'
}, {
  k: 'clinic',
  t: 'عِيَادَةُ الدِّقَّةِ',
  who: 'clinic'
}, {
  k: 'qa',
  t: 'سُؤَالٌ وَجَوَابٌ',
  who: 'qa'
}, {
  k: 'tower',
  t: 'ابْنِ بُرْجًا',
  who: 'tower'
}, {
  k: 'final',
  t: 'السَّرْدُ الْمُتَّصِلُ',
  who: 'host'
}, {
  k: 'write',
  t: 'الْكِتَابَةُ الْمُوَجَّهَةُ',
  who: 'write'
}];
const L1_META = [{
  n: 1,
  icon: 'hand',
  color: '#b4532a',
  grp: 1
}, {
  n: 2,
  icon: 'tag',
  color: '#3d5a9e',
  grp: 1
}, {
  n: 3,
  icon: 'question',
  color: '#0f766e',
  grp: 1
}, {
  n: 4,
  icon: 'bag',
  color: '#b83a30',
  grp: 2
}, {
  n: 5,
  icon: 'friends',
  color: '#2f9e44',
  grp: 2
}, {
  n: 6,
  icon: 'house',
  color: '#7442b8',
  grp: 2
}, {
  n: 7,
  icon: 'food',
  color: '#c98a12',
  grp: 3
}, {
  n: 8,
  icon: 'sun',
  color: '#1a7f53',
  grp: 3
}, {
  n: 9,
  icon: 'bag',
  color: '#b4532a',
  grp: 4
}, {
  n: 10,
  icon: 'street',
  color: '#3d5a9e',
  grp: 4
}, {
  n: 11,
  icon: 'market',
  color: '#b83a30',
  grp: 4
}, {
  n: 12,
  icon: 'school',
  color: '#0f766e',
  grp: 5
}, {
  n: 13,
  icon: 'ball',
  color: '#2f9e44',
  grp: 5
}, {
  n: 14,
  icon: 'stethoscope',
  color: '#7442b8',
  grp: 5
}, {
  n: 15,
  icon: 'clock',
  color: '#c98a12',
  grp: 6
}, {
  n: 16,
  icon: 'moon',
  color: '#1a7f53',
  grp: 6
}];
const L1_REVIEWS = [{
  id: 'rA',
  after: 3,
  grp: 1,
  t: 'مُرَاجَعَةُ الْمُدُنِ ١–٣',
  fn: 'أُسَلِّمُ · أُعَرِّفُ بِنَفْسِي · أَسْأَلُ',
  color: '#0f766e',
  icon: 'friends'
}, {
  id: 'rB',
  after: 6,
  grp: 2,
  t: 'مُرَاجَعَةُ الْمُدُنِ ٤–٦',
  fn: 'أُشِيرُ · أُعَرِّفُ بِصَدِيقِي · بِعَائِلَتِي',
  color: '#7442b8',
  icon: 'house'
}, {
  id: 'rC',
  after: 8,
  grp: 3,
  t: 'مُرَاجَعَةُ الْمُدُنِ ٧–٨',
  fn: 'أَحْكِي يَوْمِي · أَطْلُبُ بِأَدَبٍ',
  color: '#1a7f53',
  icon: 'sun'
}, {
  id: 'rD',
  after: 11,
  grp: 4,
  t: 'مُرَاجَعَةُ الْمُدُنِ ٩–١١',
  fn: 'أَسْأَلُ عَنِ الْمَكَانِ · أَصِفُ حَيِّي · أَشْتَرِي',
  color: '#b4532a',
  icon: 'market'
}, {
  id: 'rE',
  after: 14,
  grp: 5,
  t: 'مُرَاجَعَةُ الْمُدُنِ ١٢–١٤',
  fn: 'صَفُّنَا · نَلْعَبُ · أَقُولُ مَا يُؤْلِمُنِي',
  color: '#2f9e44',
  icon: 'friends'
}, {
  id: 'rF',
  after: 16,
  grp: 6,
  t: 'مُرَاجَعَةُ الْمُدُنِ ١٥–١٦',
  fn: 'أَمْسِ · الْيَوْمَ · غَدًا',
  color: '#3d5a9e',
  icon: 'clock'
}, {
  id: 'rZ',
  after: 16,
  grp: 7,
  t: 'حِكَايَتِي',
  fn: 'خِتَامُ الْمُسْتَوَى الْأَوَّلِ: حِكَايَةٌ وَاحِدَةٌ تَجْمَعُ كُلَّ شَيْءٍ',
  color: '#c98a12',
  icon: 'star'
}];
const L1_GROUPS = [{
  n: 1,
  t: 'التَّعَارُفُ',
  cities: [1, 2, 3],
  review: 'rA'
}, {
  n: 2,
  t: 'مَنْ حَوْلِي',
  cities: [4, 5, 6],
  review: 'rB'
}, {
  n: 3,
  t: 'حَاجَاتِي وَيَوْمِي',
  cities: [7, 8],
  review: 'rC'
}, {
  n: 4,
  t: 'الْمَكَانُ وَالشِّرَاءُ',
  cities: [9, 10, 11],
  review: 'rD'
}, {
  n: 5,
  t: 'مَعَ الْآخَرِينَ',
  cities: [12, 13, 14],
  review: 'rE'
}, {
  n: 6,
  t: 'الزَّمَنُ',
  cities: [15, 16],
  review: 'rF'
}, {
  n: 7,
  t: 'الْخِتَامُ',
  cities: [],
  review: 'rZ'
}];
function l1Title(n) {
  return [null, {
    t: 'السَّلَامُ',
    fn: 'أُسَلِّمُ وَأَرُدُّ التَّحِيَّةَ',
    val: 'إِفْشَاءُ السَّلَامِ',
    rule: 'عِبَارَاتٌ مَحْفُوظَةٌ: قَوْلٌ وَرَدٌّ'
  }, {
    t: 'أَنَا',
    fn: 'أُعَرِّفُ بِنَفْسِي',
    val: 'الِاعْتِزَازُ بِالِاسْمِ وَاللُّغَةِ',
    rule: 'يَاءُ الْمُتَكَلِّمِ: ـِي = لِي أَنَا'
  }, {
    t: G('وَأَنْتَ؟', 'وَأَنْتِ؟'),
    fn: 'أَسْأَلُ عَنْ غَيْرِي وَأُجِيبُ',
    val: 'حُسْنُ السُّؤَالِ وَالْإِصْغَاءِ',
    rule: G('كَافُ الْمُخَاطَبِ: ـكَ = لَكَ أَنْتَ', 'كَافُ الْمُخَاطَبِ: ـكِ = لَكِ أَنْتِ')
  }, {
    t: 'هَذَا وَهَذِهِ',
    fn: 'أُسَمِّي مَا حَوْلِي وَمَنْ حَوْلِي',
    val: 'النِّظَامُ وَحِفْظُ الْأَشْيَاءِ',
    rule: 'هَذَا أَمْ هَذِهِ؟ انْظُرْ إِلَى آخِرِ الْكَلِمَةِ'
  }, {
    t: G('صَدِيقِي', 'صَدِيقَتِي'),
    fn: 'أُعَرِّفُ بِغَيْرِي',
    val: 'التَّعَاوُنُ وَحُسْنُ الْجِوَارِ',
    rule: G('هُوَ: اسْمُهُ، يُحِبُّ', 'هِيَ: اسْمُهَا، تُحِبُّ')
  }, {
    t: 'عَائِلَتِي',
    fn: 'أُعَرِّفُ بِعَائِلَتِي',
    val: 'بِرُّ الْوَالِدَيْنِ',
    rule: 'عِنْدِي = مَعِي، لِي'
  }, {
    t: 'أَشْعُرُ وَأُرِيدُ',
    fn: 'أُعَبِّرُ عَنْ حَاجَتِي بِأَدَبٍ',
    val: 'الطَّلَبُ بِأَدَبٍ وَآدَابُ الطَّعَامِ',
    rule: 'بِـ وَأَنْ: كَلِمَتَانِ لَا تَسْقُطَانِ'
  }, {
    t: 'يَوْمِي',
    fn: 'أَحْكِي يَوْمِي',
    val: 'الصَّلَاةُ وَتَنْظِيمُ الْوَقْتِ',
    rule: 'ثُمَّ = بَعْدَ ذَلِكَ'
  }, {
    t: 'أَيْنَ؟',
    fn: 'أَسْأَلُ عَنِ الْمَكَانِ وَأَصِفُهُ',
    val: 'النِّظَامُ: لِكُلِّ شَيْءٍ مَكَانُهُ',
    rule: 'فِي · عَلَى · تَحْتَ · فَوْقَ: وَبَعْدَهَا كَسْرَةٌ'
  }, {
    t: 'حَيِّي',
    fn: 'أَصِفُ حَيِّي: الْقَرِيبَ وَالْبَعِيدَ',
    val: 'حُبُّ الْحَيِّ وَإِكْرَامُ الْجَارِ',
    rule: 'قَرِيبٌ وَقَرِيبَةٌ: انْظُرْ إِلَى «ـةٍ»'
  }, {
    t: 'فِي الدُّكَّانِ',
    fn: 'أَشْتَرِي، وَأَسْأَلُ عَنِ الْعَدَدِ وَالثَّمَنِ',
    val: 'الْأَدَبُ مَعَ الْبَائِعِ',
    rule: 'كَمْ؟ وَالْأَعْدَادُ مِنْ ١ إِلَى ١٠'
  }, {
    t: 'صَفُّنَا',
    fn: 'أَتَكَلَّمُ عَنِّي وَعَنْ أَصْحَابِي',
    val: 'حُبُّ الْعِلْمِ وَاحْتِرَامُ الْمُعَلِّمِ',
    rule: 'نَحْنُ: «ـنَا» وَ«نَـ»'
  }, {
    t: 'نَلْعَبُ',
    fn: G('أَدْعُو صَاحِبِي، وَنَتَبَادَلُ الدَّوْرَ', 'أَدْعُو صَاحِبَتِي، وَنَتَبَادَلُ الدَّوْرَ'),
    val: 'الْعَدْلُ فِي اللَّعِبِ',
    rule: G('هَيَّا نَلْعَبْ · دَوْرِي وَدَوْرُكَ', 'هَيَّا نَلْعَبْ · دَوْرِي وَدَوْرُكِ')
  }, {
    t: 'أَتَأَلَّمُ',
    fn: 'أَقُولُ مَا يُؤْلِمُنِي',
    val: 'الصَّبْرُ وَالدُّعَاءُ لِلْمَرِيضِ',
    rule: '«ـنِي» مَعَ الْفِعْلِ: يُؤْلِمُنِي'
  }, {
    t: 'أَمْسِ',
    fn: 'أَحْكِي مَا فَعَلْتُ',
    val: 'صِلَةُ الرَّحِمِ',
    rule: 'أَمْسِ: «ـتُ» فِي آخِرِ الْفِعْلِ'
  }, {
    t: 'غَدًا الْعِيدُ',
    fn: 'أَقُولُ مَا سَأَفْعَلُ',
    val: 'فَرْحَةُ الْعِيدِ وَالتَّهْنِئَةُ',
    rule: 'غَدًا: «سَـ» قَبْلَ الْفِعْلِ'
  }][n];
}
const l1Pick = (U, picks, k) => {
  const p = U.picks.find(x => x.k === k);
  const v = picks && picks[k];
  return p.opts.find(o => o.v === v) || p.opts[0];
};
const l1Friends = () => G([{
  v: 'sami',
  w: 'سَامِي',
  label: 'سَامِي',
  ch: 'zaid'
}, {
  v: 'adam',
  w: 'آدَمُ',
  label: 'آدَمُ',
  ch: 'brother'
}, {
  v: 'yusuf',
  w: 'يُوسُفُ',
  label: 'يُوسُفُ',
  ch: 'newFriendM'
}], [{
  v: 'layla',
  w: 'لَيْلَى',
  label: 'لَيْلَى',
  ch: 'sister'
}, {
  v: 'maryam',
  w: 'مَرْيَمُ',
  label: 'مَرْيَمُ',
  ch: 'newFriendF'
}, {
  v: 'sara',
  w: 'سَارَةُ',
  label: 'سَارَةُ',
  ch: 'salma'
}]);
const l1FriendPicks = () => [{
  k: 'fname',
  q: G('مَا اسْمُ صَدِيقِكَ؟', 'مَا اسْمُ صَدِيقَتِكِ؟'),
  opts: l1Friends()
}, {
  k: 'fcountry',
  q: G('مِنْ أَيْنَ هُوَ؟', 'مِنْ أَيْنَ هِيَ؟'),
  opts: ['egypt', 'morocco', 'iraq', 'syria'].map(id => {
    const c = l1Country(id);
    return {
      v: id,
      w: c.from,
      label: c.n,
      ic: 'globe'
    };
  })
}, {
  k: 'flike',
  q: G('مَاذَا يُحِبُّ؟', 'مَاذَا تُحِبُّ؟'),
  opts: L1_LIKES
}];
const l1Dreams = () => [{
  v: 'doc',
  w: G('طَبِيبًا', 'طَبِيبَةً'),
  label: G('طَبِيبٌ', 'طَبِيبَةٌ'),
  ic: 'stethoscope'
}, {
  v: 'teach',
  w: G('مُعَلِّمًا', 'مُعَلِّمَةً'),
  label: G('مُعَلِّمٌ', 'مُعَلِّمَةٌ'),
  ic: 'school'
}, {
  v: 'eng',
  w: G('مُهَنْدِسًا', 'مُهَنْدِسَةً'),
  label: G('مُهَنْدِسٌ', 'مُهَنْدِسَةٌ'),
  ic: 'house'
}, {
  v: 'pilot',
  w: G('طَيَّارًا', 'طَيَّارَةً'),
  label: G('طَيَّارٌ', 'طَيَّارَةٌ'),
  ic: 'plane'
}];
function buildUnit(n, P, picks) {
  const nm = (P.name || '').trim() || G('عُمَر', 'مَرْيَم');
  const NM = `⟦*${nm}⟧`;
  const age = AGES[P.age] || AGES[9];
  const C = l1Country(P.country);
  const hb = G('يَا حَبِيبِي', 'يَا حَبِيبَتِي');
  const meta = L1_META[n - 1],
    ttl = l1Title(n);
  const U = {
    ...meta,
    ...ttl,
    picks: []
  };
  const P_ = k => l1Pick(U, picks, k);
  if (n === 1) {
    U.picks = [{
      k: 'time',
      q: G('مَتَى تَلْتَقِي بِجَارِكُمْ؟', 'مَتَى تَلْتَقِينَ بِجَارِكُمْ؟'),
      opts: [{
        v: 'am',
        label: 'فِي الصَّبَاحِ',
        ic: 'sun'
      }, {
        v: 'pm',
        label: 'فِي الْمَسَاءِ',
        ic: 'moon'
      }]
    }];
    const am = P_('time').v === 'am';
    U.host = {
      name: 'جَارُنَا',
      gen: 'جَارِنَا',
      char: L1CH.neighbor,
      at: [20, 11],
      intro: G(`أَهْلًا يَا ${NM}! أَنَا جَارُكُمْ. كُلَّ يَوْمٍ نَلْتَقِي فِي الطَّرِيقِ. اقْرَأْ مَا نَقُولُ.`, `أَهْلًا يَا ${NM}! أَنَا جَارُكُمْ. كُلَّ يَوْمٍ نَلْتَقِي فِي الطَّرِيقِ. اقْرَئِي مَا نَقُولُ.`),
      final: G('الْآنَ سَلِّمْ عَلَيَّ، وَقُلْ كُلَّ كَلَامِ اللِّقَاءِ.', 'الْآنَ سَلِّمِي عَلَيَّ، وَقُولِي كُلَّ كَلَامِ اللِّقَاءِ.')
    };
    U.vocab = [{
      w: 'سَلَامٌ',
      scene: 'greet'
    }, {
      w: 'صَبَاحٌ',
      ic: 'sun'
    }, {
      w: 'مَسَاءٌ',
      ic: 'moon'
    }, {
      w: 'خَيْرٌ',
      ic: 'star'
    }, {
      w: 'نُورٌ',
      ic: 'bulb'
    }, {
      w: 'شُكْرًا',
      scene: 'thanks'
    }, {
      w: 'عَفْوًا',
      ic: 'hand'
    }, {
      w: 'جَارٌ',
      scene: 'neighbor'
    }];
    U.lines = [{
      t: 'السَّلَامُ عَلَيْكُمْ يَا عَمِّي.',
      key: 'عَلَيْكُمْ',
      scene: 'greet'
    }, {
      t: am ? 'صَبَاحُ الْخَيْرِ.' : 'مَسَاءُ الْخَيْرِ.',
      key: am ? 'صَبَاحُ' : 'مَسَاءُ',
      ic: am ? 'sun' : 'moon'
    }, {
      t: 'كَيْفَ حَالُكَ يَا عَمِّي؟',
      key: 'حَالُكَ',
      ic: 'question'
    }, {
      t: 'أَنَا بِخَيْرٍ، وَالْحَمْدُ لِلَّهِ.',
      key: 'بِخَيْرٍ',
      ic: 'star'
    }, {
      t: 'شُكْرًا يَا عَمِّي.',
      key: 'شُكْرًا',
      scene: 'thanks'
    }, {
      t: 'مَعَ السَّلَامَةِ.',
      key: 'السَّلَامَةِ',
      scene: 'bye'
    }];
    U.other = {
      0: 'وَعَلَيْكُمُ السَّلَامُ.',
      1: am ? 'صَبَاحُ النُّورِ.' : 'مَسَاءُ النُّورِ.',
      2: 'بِخَيْرٍ، وَالْحَمْدُ لِلَّهِ. وَأَنْتَ، كَيْفَ حَالُكَ؟',
      4: 'عَفْوًا.',
      5: 'مَعَ السَّلَامَةِ.'
    };
    U.templates = ['السَّلَامُ عَلَيْكُمْ ← وَعَلَيْكُمُ السَّلَامُ', 'صَبَاحُ الْخَيْرِ ← صَبَاحُ النُّورِ', 'كَيْفَ حَالُكَ؟ ← بِخَيْرٍ، وَالْحَمْدُ لِلَّهِ', 'شُكْرًا ← عَفْوًا', 'مَعَ السَّلَامَةِ'];
    U.tiles = [['السَّلَامُ', 'عَلَيْكُمْ', 'يَا', 'عَمِّي.'], ['أَنَا', 'بِخَيْرٍ،', 'وَالْحَمْدُ', 'لِلَّهِ.']];
    U.rule = {
      title: 'كُلُّ تَحِيَّةٍ لَهَا رَدٌّ',
      cols: ['يَقُولُ', 'أَرُدُّ'],
      rows: [['السَّلَامُ عَلَيْكُمْ', 'وَعَلَيْكُمُ السَّلَامُ'], ['صَبَاحُ الْخَيْرِ', 'صَبَاحُ النُّورِ'], ['مَسَاءُ الْخَيْرِ', 'مَسَاءُ النُّورِ'], ['كَيْفَ حَالُكَ؟', 'بِخَيْرٍ، وَالْحَمْدُ لِلَّهِ'], ['شُكْرًا', 'عَفْوًا']],
      note: 'نَحْفَظُ كُلَّ تَحِيَّةٍ مَعَ رَدِّهَا، مِثْلَ زَوْجٍ لَا يَفْتَرِقُ. وَنَرُدُّ التَّحِيَّةَ بِمِثْلِهَا أَوْ بِأَحْسَنَ مِنْهَا.',
      quiz: [{
        ic: 'sun',
        q: 'صَبَاحُ الْخَيْرِ! ← …',
        opts: ['صَبَاحُ النُّورِ', 'مَسَاءُ النُّورِ'],
        ok: 'صَبَاحُ النُّورِ'
      }, {
        scene: 'greet',
        q: 'السَّلَامُ عَلَيْكُمْ! ← …',
        opts: ['وَعَلَيْكُمُ السَّلَامُ', 'مَعَ السَّلَامَةِ'],
        ok: 'وَعَلَيْكُمُ السَّلَامُ'
      }, {
        ic: 'question',
        q: 'كَيْفَ حَالُكَ؟ ← …',
        opts: ['بِخَيْرٍ، وَالْحَمْدُ لِلَّهِ', 'صَبَاحُ النُّورِ'],
        ok: 'بِخَيْرٍ، وَالْحَمْدُ لِلَّهِ'
      }, {
        scene: 'thanks',
        q: 'شُكْرًا! ← …',
        opts: ['عَفْوًا', 'شُكْرًا'],
        ok: 'عَفْوًا'
      }]
    };
    U.write = {
      word: 'سَلَام',
      letters: ['س', 'ل', 'ا', 'م'],
      sentence: 'السَّلَامُ عَلَيْكُمْ.'
    };
    U.clinic = [{
      bad: 'عَلَيْكُمُ السَّلَامُ يَا عَمِّي.',
      good: 'السَّلَامُ عَلَيْكُمْ يَا عَمِّي.',
      why: 'أَنَا أَبْدَأُ، فَأَقُولُ: السَّلَامُ عَلَيْكُمْ'
    }, {
      bad: 'صَبَاحُ الْخَيْرِ! ← صَبَاحُ الْخَيْرِ!',
      good: 'صَبَاحُ الْخَيْرِ! ← صَبَاحُ النُّورِ!',
      why: 'الرَّدُّ: صَبَاحُ النُّورِ'
    }, {
      bad: 'كَيْفَ حَالُكَ؟ ← شُكْرًا.',
      good: 'كَيْفَ حَالُكَ؟ ← بِخَيْرٍ، وَالْحَمْدُ لِلَّهِ.',
      why: 'جَوَابُ «كَيْفَ حَالُكَ؟»: بِخَيْرٍ'
    }, {
      bad: 'فِي اللَّيْلِ أَقُولُ: صَبَاحُ الْخَيْرِ.',
      good: 'فِي اللَّيْلِ أَقُولُ: مَسَاءُ الْخَيْرِ.',
      why: 'فِي اللَّيْلِ: مَسَاءٌ'
    }];
    U.qa = [{
      q: 'السَّلَامُ عَلَيْكُمْ.',
      qc: 'السَّلَامُ',
      a: 'وَعَلَيْكُمُ السَّلَامُ.',
      ac: 'السَّلَامُ'
    }, am ? {
      q: 'صَبَاحُ الْخَيْرِ.',
      qc: 'صَبَاحُ',
      a: 'صَبَاحُ النُّورِ.',
      ac: 'صَبَاحُ'
    } : {
      q: 'مَسَاءُ الْخَيْرِ.',
      qc: 'مَسَاءُ',
      a: 'مَسَاءُ النُّورِ.',
      ac: 'مَسَاءُ'
    }, {
      q: G('كَيْفَ حَالُكَ؟', 'كَيْفَ حَالُكِ؟'),
      qc: 'كَيْفَ',
      a: 'أَنَا بِخَيْرٍ، وَالْحَمْدُ لِلَّهِ.',
      ac: 'بِخَيْرٍ'
    }, {
      q: 'شُكْرًا.',
      qc: 'شُكْرًا',
      a: 'عَفْوًا.',
      ac: 'عَفْوًا'
    }, {
      q: 'مَعَ السَّلَامَةِ.',
      qc: 'السَّلَامَةِ',
      a: 'مَعَ السَّلَامَةِ.',
      ac: 'السَّلَامَةِ'
    }];
    U.ask = {
      say: 'كَيْفَ حَالُكَ يَا جَدِّي؟',
      reply: G('أَنَا بِخَيْرٍ، وَالْحَمْدُ لِلَّهِ. بَارَكَ اللَّهُ فِيكَ.', 'أَنَا بِخَيْرٍ، وَالْحَمْدُ لِلَّهِ. بَارَكَ اللَّهُ فِيكِ.')
    };
  }
  if (n === 2) {
    U.picks = [{
      k: 'like',
      q: G('مَاذَا تُحِبُّ؟', 'مَاذَا تُحِبِّينَ؟'),
      opts: L1_LIKES
    }, {
      k: 'dream',
      q: G('مَاذَا تُرِيدُ أَنْ تَصِيرَ؟', 'مَاذَا تُرِيدِينَ أَنْ تَصِيرِي؟'),
      opts: l1Dreams()
    }];
    const like = P_('like'),
      dream = P_('dream');
    U.host = {
      name: G('الْمُعَلِّمُ', 'الْمُعَلِّمَةُ'),
      gen: G('الْمُعَلِّمِ', 'الْمُعَلِّمَةِ'),
      char: G(L1CH.teacherM, L1CH.teacherF),
      at: [36, 17],
      intro: G(`أَهْلًا يَا ${NM}! أَنْتَ طَالِبٌ جَدِيدٌ فِي صَفِّنَا. اقْرَأْ، ثُمَّ عَرِّفْنَا بِنَفْسِكَ.`, `أَهْلًا يَا ${NM}! أَنْتِ طَالِبَةٌ جَدِيدَةٌ فِي صَفِّنَا. اقْرَئِي، ثُمَّ عَرِّفِينَا بِنَفْسِكِ.`),
      final: G('الْآنَ عَرِّفِ الصَّفَّ كُلَّهُ بِنَفْسِكَ.', 'الْآنَ عَرِّفِي الصَّفَّ كُلَّهُ بِنَفْسِكِ.')
    };
    U.vocab = [{
      w: 'اسْمٌ',
      ic: 'tag'
    }, {
      w: 'عُمْرٌ',
      ic: 'cake'
    }, {
      w: 'بَلَدٌ',
      ic: 'globe'
    }, {
      w: 'كُرَةٌ',
      ic: 'ball'
    }, {
      w: 'رَسْمٌ',
      ic: 'palette'
    }, {
      w: 'سِبَاحَةٌ',
      ic: 'swim'
    }, {
      w: 'قِرَاءَةٌ',
      ic: 'openbook'
    }, {
      w: 'أُحِبُّ',
      ic: 'heart'
    }];
    U.lines = [{
      t: 'مَرْحَبًا!',
      ic: 'hand'
    }, {
      t: `اسْمِي ${NM}.`,
      key: 'اسْمِي',
      ic: 'tag'
    }, {
      t: `عُمْرِي ${age}.`,
      key: 'عُمْرِي',
      ic: 'cake'
    }, {
      t: `أَنَا ${C.from}.`,
      key: 'أَنَا',
      ic: 'globe'
    }, {
      t: `أُحِبُّ ${like.w}.`,
      key: like.w,
      ic: like.ic
    }, {
      t: `أُرِيدُ أَنْ أَصِيرَ ${dream.w}.`,
      key: dream.w,
      ic: dream.ic
    }, {
      t: 'أُحِبُّ لُغَتِي الْعَرَبِيَّةَ.',
      key: 'لُغَتِي',
      ic: 'heart'
    }];
    U.templates = ['اسْمِي …', 'عُمْرِي …', 'أَنَا مِنْ …', 'أُحِبُّ …', 'أُرِيدُ أَنْ أَصِيرَ …'];
    U.tiles = [['أُحِبُّ', like.w + '.'], ['أُرِيدُ', 'أَنْ', 'أَصِيرَ', dream.w + '.']];
    U.rule = {
      title: 'يَاءُ الْمُتَكَلِّمِ: «ـِي» = لِي أَنَا',
      cols: ['الْكَلِمَةُ', 'لِي أَنَا'],
      rows: [['اسْمٌ', 'اسْمِي'], ['عُمْرٌ', 'عُمْرِي'], ['بَلَدٌ', 'بَلَدِي'], ['كُرَةٌ', 'كُرَتِي'], ['لُغَةٌ', 'لُغَتِي']],
      note: 'نُضِيفُ «ـِي» فَتَصِيرُ الْكَلِمَةُ لِي أَنَا. وَالتَّاءُ الْمَرْبُوطَةُ تَصِيرُ «ـتِي»: كُرَةٌ ← كُرَتِي. وَحِينَ أَتَكَلَّمُ عَنْ نَفْسِي يَبْدَأُ الْفِعْلُ بِـ«أُ»: أُحِبُّ.',
      quiz: [{
        ic: 'ball',
        q: 'كُرَةٌ لِي: هَذِهِ …',
        opts: ['كُرَتِي', 'كُرَةٌ'],
        ok: 'كُرَتِي'
      }, {
        ic: 'house',
        q: 'بَيْتٌ لِي: هَذَا …',
        opts: ['بَيْتٌ', 'بَيْتِي'],
        ok: 'بَيْتِي'
      }, {
        ic: 'globe',
        q: 'بَلَدٌ لِي: …',
        opts: ['بَلَدِي', 'بَلَدٌ'],
        ok: 'بَلَدِي'
      }, {
        ic: 'heart',
        q: `أَنَا … ${like.w}.`,
        opts: ['أُحِبُّ', 'حُبٌّ'],
        ok: 'أُحِبُّ'
      }]
    };
    U.write = {
      word: 'اسْمِي',
      letters: ['ا', 'س', 'م', 'ي'],
      sentence: `اسْمِي ${NM}.`
    };
    U.clinic = [{
      bad: `اسْمٌ ${NM}.`,
      good: `اسْمِي ${NM}.`,
      why: 'الِاسْمُ لِي: اسْمِي'
    }, {
      bad: `أَنَا ${C.n}.`,
      good: `أَنَا ${C.from}.`,
      why: 'كَلِمَةٌ نَاقِصَةٌ: مِنْ'
    }, {
      bad: `أُرِيدُ أَصِيرُ ${dream.w}.`,
      good: `أُرِيدُ أَنْ أَصِيرَ ${dream.w}.`,
      why: 'كَلِمَةٌ نَاقِصَةٌ: أَنْ'
    }];
    U.qa = [{
      q: G('مَا اسْمُكَ؟', 'مَا اسْمُكِ؟'),
      qc: G('اسْمُكَ', 'اسْمُكِ'),
      a: `اسْمِي ${NM}.`,
      ac: 'اسْمِي'
    }, {
      q: G('كَمْ عُمْرُكَ؟', 'كَمْ عُمْرُكِ؟'),
      qc: G('عُمْرُكَ', 'عُمْرُكِ'),
      a: `عُمْرِي ${age}.`,
      ac: 'عُمْرِي'
    }, {
      q: G('مِنْ أَيْنَ أَنْتَ؟', 'مِنْ أَيْنَ أَنْتِ؟'),
      qc: 'مِنْ',
      a: `أَنَا ${C.from}.`,
      ac: 'مِنْ'
    }, {
      q: G('مَاذَا تُحِبُّ؟', 'مَاذَا تُحِبِّينَ؟'),
      qc: G('تُحِبُّ', 'تُحِبِّينَ'),
      a: `أُحِبُّ ${like.w}.`,
      ac: 'أُحِبُّ'
    }, {
      q: G('مَاذَا تُرِيدُ أَنْ تَصِيرَ؟', 'مَاذَا تُرِيدِينَ أَنْ تَصِيرِي؟'),
      qc: G('تُرِيدُ', 'تُرِيدِينَ'),
      a: `أُرِيدُ أَنْ أَصِيرَ ${dream.w}.`,
      ac: 'أُرِيدُ'
    }];
    U.ask = {
      say: 'وَأَنْتَ يَا جَدِّي، مِنْ أَيْنَ أَنْتَ؟',
      reply: `أَنَا مِنْ فِلَسْطِينَ ${hb}.`
    };
  }
  if (n === 3) {
    U.picks = l1FriendPicks();
    const fn = P_('fname'),
      fc = P_('fcountry'),
      fl = P_('flike');
    const K = G('ـكَ', 'ـكِ');
    U.host = {
      name: G('وَلَدٌ جَدِيدٌ', 'بِنْتٌ جَدِيدَةٌ'),
      gen: G('الْوَلَدِ الْجَدِيدِ', 'الْبِنْتِ الْجَدِيدَةِ'),
      char: L1CH[fn.ch] || G(L1CH.newFriendM, L1CH.newFriendF),
      at: [14, 10],
      intro: G(`مَرْحَبًا! أَنَا جَدِيدٌ فِي الْحَدِيقَةِ. اسْأَلْنِي يَا ${NM}، وَأَنَا أُجِيبُ.`, `مَرْحَبًا! أَنَا جَدِيدَةٌ فِي الْحَدِيقَةِ. اسْأَلِينِي يَا ${NM}، وَأَنَا أُجِيبُ.`),
      final: G('الْآنَ اسْأَلْنِي كُلَّ الْأَسْئِلَةِ، وَقُلْ لِي عَنْ نَفْسِكَ.', 'الْآنَ اسْأَلِينِي كُلَّ الْأَسْئِلَةِ، وَقُولِي لِي عَنْ نَفْسِكِ.')
    };
    U.vocab = [{
      w: 'وَلَدٌ',
      ch: 'boy'
    }, {
      w: 'بِنْتٌ',
      ch: 'girl'
    }, {
      w: G('صَدِيقٌ', 'صَدِيقَةٌ'),
      scene: 'friend'
    }, {
      w: 'حَدِيقَةٌ',
      ic: 'park'
    }, {
      w: G('جَدِيدٌ', 'جَدِيدَةٌ'),
      scene: 'new'
    }, {
      w: 'سُؤَالٌ',
      ic: 'question'
    }];
    U.lines = G([{
      t: 'مَرْحَبًا! مَا اسْمُكَ؟',
      key: 'اسْمُكَ',
      ic: 'tag'
    }, {
      t: 'كَمْ عُمْرُكَ؟',
      key: 'عُمْرُكَ',
      ic: 'cake'
    }, {
      t: 'مِنْ أَيْنَ أَنْتَ؟',
      key: 'أَنْتَ',
      ic: 'globe'
    }, {
      t: 'مَاذَا تُحِبُّ؟',
      key: 'تُحِبُّ',
      ic: 'heart'
    }, {
      t: `أَنَا أُحِبُّ ${fl.w} أَيْضًا!`,
      key: 'أَيْضًا',
      ic: fl.ic
    }, {
      t: 'أَنْتَ صَدِيقِي.',
      key: 'صَدِيقِي',
      scene: 'friend'
    }], [{
      t: 'مَرْحَبًا! مَا اسْمُكِ؟',
      key: 'اسْمُكِ',
      ic: 'tag'
    }, {
      t: 'كَمْ عُمْرُكِ؟',
      key: 'عُمْرُكِ',
      ic: 'cake'
    }, {
      t: 'مِنْ أَيْنَ أَنْتِ؟',
      key: 'أَنْتِ',
      ic: 'globe'
    }, {
      t: 'مَاذَا تُحِبِّينَ؟',
      key: 'تُحِبِّينَ',
      ic: 'heart'
    }, {
      t: `أَنَا أُحِبُّ ${fl.w} أَيْضًا!`,
      key: 'أَيْضًا',
      ic: fl.ic
    }, {
      t: 'أَنْتِ صَدِيقَتِي.',
      key: 'صَدِيقَتِي',
      scene: 'friend'
    }]);
    U.other = {
      0: `اسْمِي ${fn.w}.`,
      1: 'عُمْرِي ' + age + '.',
      2: `أَنَا ${fc.w}.`,
      3: `أُحِبُّ ${fl.w}.`,
      5: G('وَأَنْتَ صَدِيقِي!', 'وَأَنْتِ صَدِيقَتِي!')
    };
    U.templates = G(['مَا اسْمُكَ؟', 'كَمْ عُمْرُكَ؟', 'مِنْ أَيْنَ أَنْتَ؟', 'مَاذَا تُحِبُّ؟'], ['مَا اسْمُكِ؟', 'كَمْ عُمْرُكِ؟', 'مِنْ أَيْنَ أَنْتِ؟', 'مَاذَا تُحِبِّينَ؟']);
    U.tiles = G([['مَا', 'اسْمُكَ؟'], ['مَاذَا', 'تُحِبُّ؟'], ['أَنْتَ', 'صَدِيقِي.']], [['مَا', 'اسْمُكِ؟'], ['مَاذَا', 'تُحِبِّينَ؟'], ['أَنْتِ', 'صَدِيقَتِي.']]);
    U.rule = {
      title: G('لِي: ـِي · لَكَ: ـكَ', 'لِي: ـِي · لَكِ: ـكِ'),
      cols: ['لِي أَنَا', G('لَكَ أَنْتَ', 'لَكِ أَنْتِ')],
      rows: G([['اسْمِي', 'اسْمُكَ'], ['عُمْرِي', 'عُمْرُكَ'], ['بَلَدِي', 'بَلَدُكَ'], ['أُحِبُّ', 'تُحِبُّ']], [['اسْمِي', 'اسْمُكِ'], ['عُمْرِي', 'عُمْرُكِ'], ['بَلَدِي', 'بَلَدُكِ'], ['أُحِبُّ', 'تُحِبِّينَ']]),
      note: G('الْكَلِمَةُ هِيَ هِيَ، وَآخِرُهَا يَتَغَيَّرُ: «ـِي» لِي أَنَا، وَ«ـكَ» لَكَ أَنْتَ. وَالْفِعْلُ: أَنَا أُحِبُّ، وَأَنْتَ تُحِبُّ. الْآنَ تَعْرِفُ لِمَاذَا قُلْنَا فِي مَدِينَةِ السَّلَامِ: كَيْفَ حَالُكَ؟', 'الْكَلِمَةُ هِيَ هِيَ، وَآخِرُهَا يَتَغَيَّرُ: «ـِي» لِي أَنَا، وَ«ـكِ» لَكِ أَنْتِ. وَالْفِعْلُ: أَنَا أُحِبُّ، وَأَنْتِ تُحِبِّينَ. الْآنَ تَعْرِفِينَ لِمَاذَا قُلْنَا فِي مَدِينَةِ السَّلَامِ: كَيْفَ حَالُكِ؟'),
      quiz: G([{
        ic: 'tag',
        q: 'أَسْأَلُ صَدِيقِي: مَا …؟',
        opts: ['اسْمُكَ', 'اسْمِي'],
        ok: 'اسْمُكَ'
      }, {
        ic: 'cake',
        q: 'أَسْأَلُ صَدِيقِي: كَمْ …؟',
        opts: ['عُمْرِي', 'عُمْرُكَ'],
        ok: 'عُمْرُكَ'
      }, {
        ic: 'heart',
        q: 'أَسْأَلُ صَدِيقِي: مَاذَا …؟',
        opts: ['تُحِبُّ', 'أُحِبُّ'],
        ok: 'تُحِبُّ'
      }, {
        ic: 'globe',
        q: 'أُجِيبُ: … مِنْ سُورِيَا.',
        opts: ['أَنَا', 'أَنْتَ'],
        ok: 'أَنَا'
      }], [{
        ic: 'tag',
        q: 'أَسْأَلُ صَدِيقَتِي: مَا …؟',
        opts: ['اسْمُكِ', 'اسْمِي'],
        ok: 'اسْمُكِ'
      }, {
        ic: 'cake',
        q: 'أَسْأَلُ صَدِيقَتِي: كَمْ …؟',
        opts: ['عُمْرِي', 'عُمْرُكِ'],
        ok: 'عُمْرُكِ'
      }, {
        ic: 'heart',
        q: 'أَسْأَلُ صَدِيقَتِي: مَاذَا …؟',
        opts: ['تُحِبِّينَ', 'أُحِبُّ'],
        ok: 'تُحِبِّينَ'
      }, {
        ic: 'globe',
        q: 'أُجِيبُ: … مِنْ سُورِيَا.',
        opts: ['أَنَا', 'أَنْتِ'],
        ok: 'أَنَا'
      }])
    };
    U.write = G({
      word: 'اسْمُكَ',
      letters: ['ا', 'س', 'م', 'ك'],
      sentence: 'مَا اسْمُكَ؟'
    }, {
      word: 'اسْمُكِ',
      letters: ['ا', 'س', 'م', 'ك'],
      sentence: 'مَا اسْمُكِ؟'
    });
    U.clinic = G([{
      bad: 'مَا اسْمِي؟',
      good: 'مَا اسْمُكَ؟',
      why: 'أَسْأَلُ عَنْ صَدِيقِي: اسْمُكَ'
    }, {
      bad: 'مَاذَا أُحِبُّ؟',
      good: 'مَاذَا تُحِبُّ؟',
      why: 'أَسْأَلُهُ هُوَ: تُحِبُّ'
    }, {
      bad: 'أَيْنَ أَنْتَ؟',
      good: 'مِنْ أَيْنَ أَنْتَ؟',
      why: 'كَلِمَةٌ نَاقِصَةٌ: مِنْ'
    }], [{
      bad: 'مَا اسْمِي؟',
      good: 'مَا اسْمُكِ؟',
      why: 'أَسْأَلُ عَنْ صَدِيقَتِي: اسْمُكِ'
    }, {
      bad: 'مَاذَا أُحِبُّ؟',
      good: 'مَاذَا تُحِبِّينَ؟',
      why: 'أَسْأَلُهَا هِيَ: تُحِبِّينَ'
    }, {
      bad: 'أَيْنَ أَنْتِ؟',
      good: 'مِنْ أَيْنَ أَنْتِ؟',
      why: 'كَلِمَةٌ نَاقِصَةٌ: مِنْ'
    }]);
    U.qa = G([{
      q: 'اسْأَلْ عَنِ الِاسْمِ.',
      qc: 'الِاسْمِ',
      a: 'مَا اسْمُكَ؟',
      ac: 'اسْمُكَ'
    }, {
      q: 'اسْأَلْ عَنِ الْعُمْرِ.',
      qc: 'الْعُمْرِ',
      a: 'كَمْ عُمْرُكَ؟',
      ac: 'عُمْرُكَ'
    }, {
      q: 'اسْأَلْ عَنِ الْبَلَدِ.',
      qc: 'الْبَلَدِ',
      a: 'مِنْ أَيْنَ أَنْتَ؟',
      ac: 'أَنْتَ'
    }, {
      q: 'اسْأَلْ: مَاذَا يُحِبُّ؟',
      qc: 'مَاذَا',
      a: 'مَاذَا تُحِبُّ؟',
      ac: 'تُحِبُّ'
    }], [{
      q: 'اسْأَلِي عَنِ الِاسْمِ.',
      qc: 'الِاسْمِ',
      a: 'مَا اسْمُكِ؟',
      ac: 'اسْمُكِ'
    }, {
      q: 'اسْأَلِي عَنِ الْعُمْرِ.',
      qc: 'الْعُمْرِ',
      a: 'كَمْ عُمْرُكِ؟',
      ac: 'عُمْرُكِ'
    }, {
      q: 'اسْأَلِي عَنِ الْبَلَدِ.',
      qc: 'الْبَلَدِ',
      a: 'مِنْ أَيْنَ أَنْتِ؟',
      ac: 'أَنْتِ'
    }, {
      q: 'اسْأَلِي: مَاذَا تُحِبُّ؟',
      qc: 'مَاذَا',
      a: 'مَاذَا تُحِبِّينَ؟',
      ac: 'تُحِبِّينَ'
    }]);
    U.ask = {
      say: 'يَا جَدِّي، مَاذَا تُحِبُّ؟',
      reply: `أُحِبُّ الْقِرَاءَةَ ${hb}.`
    };
  }
  if (n === 4) {
    U.picks = [{
      k: 'toy',
      q: G('مَا لُعْبَتُكَ؟', 'مَا لُعْبَتُكِ؟'),
      opts: [{
        v: 'ball',
        w: 'كُرَتِي',
        label: 'كُرَةٌ',
        ic: 'ball',
        dem: 'هَذِهِ'
      }, {
        v: 'car',
        w: 'سَيَّارَتِي',
        label: 'سَيَّارَةٌ',
        ic: 'car',
        dem: 'هَذِهِ'
      }, {
        v: 'teddy',
        w: 'دُبِّي',
        label: 'دُبٌّ',
        ic: 'teddy',
        dem: 'هَذَا'
      }]
    }];
    const toy = P_('toy');
    U.host = {
      name: 'أُمِّي',
      gen: 'أُمِّي',
      char: L1CH.mother,
      at: [6, 10],
      intro: G(`جَاءَ ضَيْفٌ صَغِيرٌ يَا ${NM}. أَرِهِ غُرْفَتَكَ، وَقُلْ لَهُ: مَا هَذَا، وَمَا هَذِهِ.`, `جَاءَتْ ضَيْفَةٌ صَغِيرَةٌ يَا ${NM}. أَرِيهَا غُرْفَتَكِ، وَقُولِي لَهَا: مَا هَذَا، وَمَا هَذِهِ.`),
      final: G('الْآنَ سَمِّ كُلَّ شَيْءٍ فِي غُرْفَتِكَ.', 'الْآنَ سَمِّي كُلَّ شَيْءٍ فِي غُرْفَتِكِ.')
    };
    U.vocab = [{
      w: 'قَلَمٌ',
      ic: 'pen'
    }, {
      w: 'كِتَابٌ',
      ic: 'book'
    }, {
      w: 'حَقِيبَةٌ',
      ic: 'bag'
    }, {
      w: 'طَاوِلَةٌ',
      ic: 'desk'
    }, {
      w: 'كُرْسِيٌّ',
      ic: 'chair'
    }, {
      w: 'سَيَّارَةٌ',
      ic: 'car'
    }, {
      w: 'بَيْتٌ',
      ic: 'house'
    }, {
      w: 'ضَيْفٌ',
      scene: 'guest'
    }];
    U.lines = [{
      t: 'هَذَا بَيْتِي.',
      key: 'بَيْتِي',
      ic: 'house'
    }, {
      t: 'هَذِهِ طَاوِلَتِي.',
      key: 'طَاوِلَتِي',
      ic: 'desk'
    }, {
      t: 'هَذَا كُرْسِيٌّ.',
      key: 'كُرْسِيٌّ',
      ic: 'chair'
    }, {
      t: 'هَذَا قَلَمِي، وَهَذَا كِتَابِي.',
      key: 'كِتَابِي',
      ic: 'book'
    }, {
      t: 'هَذِهِ حَقِيبَتِي.',
      key: 'حَقِيبَتِي',
      ic: 'bag'
    }, {
      t: `${toy.dem} ${toy.w}.`,
      key: toy.w,
      ic: toy.ic
    }, {
      t: 'هَذَا وَلَدٌ، وَهَذِهِ بِنْتٌ.',
      key: 'بِنْتٌ',
      ch: 'girl'
    }];
    U.templates = ['هَذَا …', 'هَذِهِ …ـَةٌ', 'هَذَا …ـِي', 'هَذِهِ …ـتِي'];
    U.tiles = [['هَذِهِ', 'حَقِيبَتِي.'], ['هَذَا', 'قَلَمِي،', 'وَهَذَا', 'كِتَابِي.']];
    U.rule = {
      title: 'هَذَا أَمْ هَذِهِ؟ انْظُرْ إِلَى آخِرِ الْكَلِمَةِ',
      cols: ['بِلَا «ـة»: هَذَا', 'فِيهَا «ـة»: هَذِهِ'],
      rows: [['قَلَمٌ', 'حَقِيبَةٌ'], ['كِتَابٌ', 'طَاوِلَةٌ'], ['بَيْتٌ', 'سَيَّارَةٌ'], ['وَلَدٌ', 'بِنْتٌ']],
      note: 'إِذَا كَانَ فِي آخِرِ الْكَلِمَةِ تَاءٌ مَرْبُوطَةٌ «ـة» نَقُولُ: هَذِهِ. وَإِلَّا نَقُولُ: هَذَا. وَلِلْبِنْتِ وَالْمَرْأَةِ نَقُولُ دَائِمًا: هَذِهِ.',
      quiz: [{
        ic: 'bag',
        q: '… حَقِيبَةٌ.',
        opts: ['هَذَا', 'هَذِهِ'],
        ok: 'هَذِهِ'
      }, {
        ic: 'pen',
        q: '… قَلَمٌ.',
        opts: ['هَذَا', 'هَذِهِ'],
        ok: 'هَذَا'
      }, {
        ic: 'car',
        q: '… سَيَّارَتِي.',
        opts: ['هَذِهِ', 'هَذَا'],
        ok: 'هَذِهِ'
      }, {
        ch: 'girl',
        q: '… بِنْتٌ.',
        opts: ['هَذَا', 'هَذِهِ'],
        ok: 'هَذِهِ'
      }, {
        ch: 'boy',
        q: '… وَلَدٌ.',
        opts: ['هَذِهِ', 'هَذَا'],
        ok: 'هَذَا'
      }]
    };
    U.write = {
      word: 'هَذَا',
      letters: ['ه', 'ذ', 'ا'],
      sentence: 'هَذَا قَلَمِي.'
    };
    U.clinic = [{
      bad: 'هَذَا حَقِيبَتِي.',
      good: 'هَذِهِ حَقِيبَتِي.',
      why: 'حَقِيبَةٌ فِي آخِرِهَا «ـة»: هَذِهِ'
    }, {
      bad: 'هَذِهِ كِتَابِي.',
      good: 'هَذَا كِتَابِي.',
      why: 'كِتَابٌ لَيْسَ فِي آخِرِهِ «ـة»: هَذَا'
    }, {
      bad: 'هَذَا بِنْتٌ.',
      good: 'هَذِهِ بِنْتٌ.',
      why: 'لِلْبِنْتِ: هَذِهِ'
    }];
    U.qa = [{
      q: 'مَا هَذَا؟',
      qc: 'هَذَا',
      a: 'هَذَا قَلَمِي.',
      ac: 'هَذَا'
    }, {
      q: 'مَا هَذِهِ؟',
      qc: 'هَذِهِ',
      a: 'هَذِهِ حَقِيبَتِي.',
      ac: 'هَذِهِ'
    }, {
      q: 'مَنْ هَذَا؟',
      qc: 'مَنْ',
      a: 'هَذَا وَلَدٌ.',
      ac: 'وَلَدٌ'
    }, {
      q: 'مَنْ هَذِهِ؟',
      qc: 'مَنْ',
      a: 'هَذِهِ بِنْتٌ.',
      ac: 'بِنْتٌ'
    }];
    U.ask = {
      say: 'يَا جَدِّي، مَا هَذِهِ؟',
      reply: `هَذِهِ نَظَّارَتِي ${hb}.`
    };
  }
  if (n === 5) {
    U.picks = l1FriendPicks();
    const fn = P_('fname').w,
      fch = P_('fname').ch,
      fc = P_('fcountry').w,
      fl = P_('flike');
    U.host = {
      name: 'جَدَّتِي',
      gen: 'جَدَّتِي',
      char: L1CH.grandma,
      at: [14, 10],
      intro: G(`مَنْ هَذَا الْوَلَدُ مَعَكَ يَا ${NM}؟ اقْرَأْ، وَعَرِّفْنِي بِهِ.`, `مَنْ هَذِهِ الْبِنْتُ مَعَكِ يَا ${NM}؟ اقْرَئِي، وَعَرِّفِينِي بِهَا.`),
      final: G('الْآنَ قُلْ لِي كُلَّ شَيْءٍ عَنْ صَدِيقِكَ.', 'الْآنَ قُولِي لِي كُلَّ شَيْءٍ عَنْ صَدِيقَتِكِ.')
    };
    U.vocab = [{
      w: G('صَدِيقٌ', 'صَدِيقَةٌ'),
      scene: 'friend'
    }, {
      w: 'جَارٌ',
      scene: 'neighbor'
    }, {
      w: G('يُحِبُّ', 'تُحِبُّ'),
      scene: 'likes3'
    }, {
      w: G('يَلْعَبُ', 'تَلْعَبُ'),
      scene: 'plays'
    }, {
      w: G('يُسَاعِدُ', 'تُسَاعِدُ'),
      scene: 'help'
    }, {
      w: G('لَطِيفٌ', 'لَطِيفَةٌ'),
      scene: 'kind'
    }, {
      w: G('ذَكِيٌّ', 'ذَكِيَّةٌ'),
      scene: 'smart'
    }];
    U.lines = G([{
      t: 'هَذَا صَدِيقِي.',
      key: 'صَدِيقِي',
      ch: fch
    }, {
      t: `اسْمُهُ ${fn}.`,
      key: 'اسْمُهُ',
      ic: 'tag'
    }, {
      t: `هُوَ ${fc}.`,
      key: 'هُوَ',
      ic: 'globe'
    }, {
      t: 'هُوَ جَارِي.',
      key: 'جَارِي',
      scene: 'neighbor'
    }, {
      t: `هُوَ يُحِبُّ ${fl.w}.`,
      key: 'يُحِبُّ',
      ic: fl.ic
    }, {
      t: 'هُوَ يَلْعَبُ مَعِي.',
      key: 'يَلْعَبُ',
      scene: 'plays'
    }, {
      t: 'هُوَ لَطِيفٌ وَذَكِيٌّ.',
      key: 'ذَكِيٌّ',
      scene: 'smart'
    }, {
      t: 'أُسَاعِدُهُ، وَيُسَاعِدُنِي.',
      key: 'أُسَاعِدُهُ',
      scene: 'help'
    }], [{
      t: 'هَذِهِ صَدِيقَتِي.',
      key: 'صَدِيقَتِي',
      ch: fch
    }, {
      t: `اسْمُهَا ${fn}.`,
      key: 'اسْمُهَا',
      ic: 'tag'
    }, {
      t: `هِيَ ${fc}.`,
      key: 'هِيَ',
      ic: 'globe'
    }, {
      t: 'هِيَ جَارَتِي.',
      key: 'جَارَتِي',
      scene: 'neighbor'
    }, {
      t: `هِيَ تُحِبُّ ${fl.w}.`,
      key: 'تُحِبُّ',
      ic: fl.ic
    }, {
      t: 'هِيَ تَلْعَبُ مَعِي.',
      key: 'تَلْعَبُ',
      scene: 'plays'
    }, {
      t: 'هِيَ لَطِيفَةٌ وَذَكِيَّةٌ.',
      key: 'ذَكِيَّةٌ',
      scene: 'smart'
    }, {
      t: 'أُسَاعِدُهَا، وَتُسَاعِدُنِي.',
      key: 'أُسَاعِدُهَا',
      scene: 'help'
    }]);
    U.templates = G(['هَذَا صَدِيقِي.', 'اسْمُهُ …', 'هُوَ مِنْ …', 'هُوَ يُحِبُّ …'], ['هَذِهِ صَدِيقَتِي.', 'اسْمُهَا …', 'هِيَ مِنْ …', 'هِيَ تُحِبُّ …']);
    U.tiles = G([['هَذَا', 'صَدِيقِي.'], ['هُوَ', 'يُحِبُّ', fl.w + '.']], [['هَذِهِ', 'صَدِيقَتِي.'], ['هِيَ', 'تُحِبُّ', fl.w + '.']]);
    U.rule = G({
      title: 'مِنْ «أَنَا» إِلَى «أَنْتَ» إِلَى «هُوَ»',
      cols: ['أَنَا', 'أَنْتَ', 'هُوَ'],
      rows: [['اسْمِي', 'اسْمُكَ', 'اسْمُهُ'], ['عُمْرِي', 'عُمْرُكَ', 'عُمْرُهُ'], ['بَلَدِي', 'بَلَدُكَ', 'بَلَدُهُ'], ['أُحِبُّ', 'تُحِبُّ', 'يُحِبُّ'], ['أَلْعَبُ', 'تَلْعَبُ', 'يَلْعَبُ']],
      note: 'تَعْرِفُ «ـِي» لِي، وَ«ـكَ» لَكَ. وَالْآنَ: «ـهُ» لَهُ هُوَ. وَالْفِعْلُ: أَنَا أُحِبُّ، أَنْتَ تُحِبُّ، هُوَ يُحِبُّ. وَلِلْبِنْتِ: هِيَ، اسْمُهَا، تُحِبُّ.',
      quiz: [{
        ch: fch,
        q: 'صَدِيقِي: … سَامِي.',
        opts: ['اسْمُهُ', 'اسْمِي'],
        ok: 'اسْمُهُ'
      }, {
        ch: fch,
        q: 'هُوَ … الْكُرَةَ.',
        opts: ['يُحِبُّ', 'أُحِبُّ'],
        ok: 'يُحِبُّ'
      }, {
        ch: 'boy',
        q: 'أَنَا … الرَّسْمَ.',
        opts: ['أُحِبُّ', 'يُحِبُّ'],
        ok: 'أُحِبُّ'
      }, {
        ch: 'girl',
        q: 'هَذِهِ بِنْتٌ. … لَيْلَى.',
        opts: ['اسْمُهَا', 'اسْمُهُ'],
        ok: 'اسْمُهَا'
      }, {
        ch: 'girl',
        q: 'هِيَ … السِّبَاحَةَ.',
        opts: ['تُحِبُّ', 'يُحِبُّ'],
        ok: 'تُحِبُّ'
      }]
    }, {
      title: 'مِنْ «أَنَا» إِلَى «أَنْتِ» إِلَى «هِيَ»',
      cols: ['أَنَا', 'أَنْتِ', 'هِيَ'],
      rows: [['اسْمِي', 'اسْمُكِ', 'اسْمُهَا'], ['عُمْرِي', 'عُمْرُكِ', 'عُمْرُهَا'], ['بَلَدِي', 'بَلَدُكِ', 'بَلَدُهَا'], ['أُحِبُّ', 'تُحِبِّينَ', 'تُحِبُّ'], ['أَلْعَبُ', 'تَلْعَبِينَ', 'تَلْعَبُ']],
      note: 'تَعْرِفِينَ «ـِي» لِي، وَ«ـكِ» لَكِ. وَالْآنَ: «ـهَا» لَهَا هِيَ. وَالْفِعْلُ: أَنَا أُحِبُّ، أَنْتِ تُحِبِّينَ، هِيَ تُحِبُّ. وَلِلْوَلَدِ: هُوَ، اسْمُهُ، يُحِبُّ.',
      quiz: [{
        ch: fch,
        q: 'صَدِيقَتِي: … لَيْلَى.',
        opts: ['اسْمُهَا', 'اسْمِي'],
        ok: 'اسْمُهَا'
      }, {
        ch: fch,
        q: 'هِيَ … الرَّسْمَ.',
        opts: ['تُحِبُّ', 'أُحِبُّ'],
        ok: 'تُحِبُّ'
      }, {
        ch: 'girl',
        q: 'أَنَا … الْكُرَةَ.',
        opts: ['أُحِبُّ', 'تُحِبُّ'],
        ok: 'أُحِبُّ'
      }, {
        ch: 'boy',
        q: 'هَذَا وَلَدٌ. … سَامِي.',
        opts: ['اسْمُهُ', 'اسْمُهَا'],
        ok: 'اسْمُهُ'
      }, {
        ch: 'boy',
        q: 'هُوَ … السِّبَاحَةَ.',
        opts: ['يُحِبُّ', 'تُحِبُّ'],
        ok: 'يُحِبُّ'
      }]
    });
    U.write = G({
      word: 'اسْمُهُ',
      letters: ['ا', 'س', 'م', 'ه'],
      sentence: `اسْمُهُ ${fn}.`
    }, {
      word: 'اسْمُهَا',
      letters: ['ا', 'س', 'م', 'ه', 'ا'],
      sentence: `اسْمُهَا ${fn}.`
    });
    U.clinic = G([{
      bad: `اسْمِي ${fn}.`,
      good: `اسْمُهُ ${fn}.`,
      why: 'أَتَكَلَّمُ عَنْ صَدِيقِي: اسْمُهُ'
    }, {
      bad: `هُوَ أُحِبُّ ${fl.w}.`,
      good: `هُوَ يُحِبُّ ${fl.w}.`,
      why: 'هُوَ يُحِبُّ، وَأَنَا أُحِبُّ'
    }, {
      bad: `اسْمُكَ ${fn}.`,
      good: `اسْمُهُ ${fn}.`,
      why: 'لَيْسَ أَمَامِي، أَتَكَلَّمُ عَنْهُ: اسْمُهُ'
    }], [{
      bad: `اسْمِي ${fn}.`,
      good: `اسْمُهَا ${fn}.`,
      why: 'أَتَكَلَّمُ عَنْ صَدِيقَتِي: اسْمُهَا'
    }, {
      bad: `هِيَ أُحِبُّ ${fl.w}.`,
      good: `هِيَ تُحِبُّ ${fl.w}.`,
      why: 'هِيَ تُحِبُّ، وَأَنَا أُحِبُّ'
    }, {
      bad: `اسْمُكِ ${fn}.`,
      good: `اسْمُهَا ${fn}.`,
      why: 'لَيْسَتْ أَمَامِي، أَتَكَلَّمُ عَنْهَا: اسْمُهَا'
    }]);
    U.qa = G([{
      q: 'مَنْ هَذَا؟',
      qc: 'هَذَا',
      a: 'هَذَا صَدِيقِي.',
      ac: 'هَذَا'
    }, {
      q: 'مَا اسْمُهُ؟',
      qc: 'اسْمُهُ',
      a: `اسْمُهُ ${fn}.`,
      ac: 'اسْمُهُ'
    }, {
      q: 'مِنْ أَيْنَ هُوَ؟',
      qc: 'هُوَ',
      a: `هُوَ ${fc}.`,
      ac: 'هُوَ'
    }, {
      q: 'مَاذَا يُحِبُّ؟',
      qc: 'يُحِبُّ',
      a: `هُوَ يُحِبُّ ${fl.w}.`,
      ac: 'يُحِبُّ'
    }, {
      q: 'هَلْ هُوَ لَطِيفٌ؟',
      qc: 'لَطِيفٌ',
      a: 'نَعَمْ، هُوَ لَطِيفٌ وَذَكِيٌّ.',
      ac: 'لَطِيفٌ'
    }], [{
      q: 'مَنْ هَذِهِ؟',
      qc: 'هَذِهِ',
      a: 'هَذِهِ صَدِيقَتِي.',
      ac: 'هَذِهِ'
    }, {
      q: 'مَا اسْمُهَا؟',
      qc: 'اسْمُهَا',
      a: `اسْمُهَا ${fn}.`,
      ac: 'اسْمُهَا'
    }, {
      q: 'مِنْ أَيْنَ هِيَ؟',
      qc: 'هِيَ',
      a: `هِيَ ${fc}.`,
      ac: 'هِيَ'
    }, {
      q: 'مَاذَا تُحِبُّ صَدِيقَتُكِ؟',
      qc: 'تُحِبُّ',
      a: `هِيَ تُحِبُّ ${fl.w}.`,
      ac: 'تُحِبُّ'
    }, {
      q: 'هَلْ هِيَ لَطِيفَةٌ؟',
      qc: 'لَطِيفَةٌ',
      a: 'نَعَمْ، هِيَ لَطِيفَةٌ وَذَكِيَّةٌ.',
      ac: 'لَطِيفَةٌ'
    }]);
    U.ask = {
      say: 'يَا جَدِّي، هَلْ عِنْدَكَ صَدِيقٌ؟',
      reply: 'نَعَمْ، صَدِيقِي اسْمُهُ أَحْمَدُ، وَهُوَ لَطِيفٌ.'
    };
  }
  if (n === 6) {
    U.picks = [{
      k: 'sibs',
      q: G('هَلْ عِنْدَكَ إِخْوَةٌ؟', 'هَلْ عِنْدَكِ إِخْوَةٌ؟'),
      opts: [{
        v: 'b',
        label: 'أَخٌ',
        ch: 'brother',
        line: 'عِنْدِي أَخٌ.',
        ans: 'نَعَمْ، عِنْدِي أَخٌ.'
      }, {
        v: 's',
        label: 'أُخْتٌ',
        ch: 'sister',
        line: 'عِنْدِي أُخْتٌ.',
        ans: 'نَعَمْ، عِنْدِي أُخْتٌ.'
      }, {
        v: 'bs',
        label: 'أَخٌ وَأُخْتٌ',
        ic: 'friends',
        line: 'عِنْدِي أَخٌ وَأُخْتٌ.',
        ans: 'نَعَمْ، عِنْدِي أَخٌ وَأُخْتٌ.'
      }, {
        v: '0',
        label: 'لَيْسَ عِنْدِي',
        ic: 'house',
        line: 'لَيْسَ عِنْدِي إِخْوَةٌ.',
        ans: 'لَا، لَيْسَ عِنْدِي إِخْوَةٌ.'
      }]
    }];
    const sib = P_('sibs');
    U.host = {
      name: 'الضَّيْفُ',
      gen: 'الضَّيْفِ',
      char: L1CH.visitor,
      at: [14, 10],
      intro: G(`السَّلَامُ عَلَيْكُمْ! أَنَا ضَيْفٌ عِنْدَكُمْ. هَذِهِ صُوَرُ عَائِلَتِكَ يَا ${NM}؟ اقْرَأْ، وَعَرِّفْنِي بِهِمْ.`, `السَّلَامُ عَلَيْكُمْ! أَنَا ضَيْفٌ عِنْدَكُمْ. هَذِهِ صُوَرُ عَائِلَتِكِ يَا ${NM}؟ اقْرَئِي، وَعَرِّفِينِي بِهِمْ.`),
      final: G('الْآنَ عَرِّفْنِي بِعَائِلَتِكَ كُلِّهَا.', 'الْآنَ عَرِّفِينِي بِعَائِلَتِكِ كُلِّهَا.')
    };
    U.vocab = [{
      w: 'أَبٌ',
      ch: 'father'
    }, {
      w: 'أُمٌّ',
      ch: 'mother'
    }, {
      w: 'أَخٌ',
      ch: 'brother'
    }, {
      w: 'أُخْتٌ',
      ch: 'sister'
    }, {
      w: 'جَدٌّ',
      ch: 'grandpa'
    }, {
      w: 'جَدَّةٌ',
      ch: 'grandma'
    }, {
      w: 'يَعْمَلُ',
      scene: 'works'
    }, {
      w: 'تَطْبُخُ',
      scene: 'cooks'
    }, {
      w: 'كَبِيرٌ',
      scene: 'big'
    }, {
      w: 'صَغِيرٌ',
      scene: 'small'
    }];
    U.lines = [{
      t: 'هَذِهِ عَائِلَتِي.',
      key: 'عَائِلَتِي',
      ic: 'friends'
    }, {
      t: 'هَذَا أَبِي. هُوَ يَعْمَلُ.',
      key: 'يَعْمَلُ',
      scene: 'works'
    }, {
      t: 'هَذِهِ أُمِّي. هِيَ تَطْبُخُ.',
      key: 'تَطْبُخُ',
      scene: 'cooks'
    }, {
      t: sib.line,
      key: sib.v === '0' ? 'لَيْسَ' : 'عِنْدِي',
      ch: sib.ch || 'brother'
    }, {
      t: 'عِنْدِي جَدٌّ كَبِيرٌ، وَجَدَّةٌ.',
      key: 'كَبِيرٌ',
      scene: 'big'
    }, {
      t: 'أُحِبُّ عَائِلَتِي.',
      key: 'أُحِبُّ',
      ic: 'heart'
    }, {
      t: 'أُسَاعِدُ أُمِّي وَأَبِي.',
      key: 'أُسَاعِدُ',
      scene: 'help'
    }];
    U.templates = ['هَذَا أَبِي.', 'هَذِهِ أُمِّي.', 'عِنْدِي …', 'لَيْسَ عِنْدِي …', 'هُوَ يَعْمَلُ. / هِيَ تَطْبُخُ.'];
    U.tiles = [['عِنْدِي', 'أَخٌ', 'وَأُخْتٌ.'], ['أُسَاعِدُ', 'أُمِّي', 'وَأَبِي.']];
    U.rule = {
      title: 'عِنْدِي = مَعِي، لِي',
      cols: ['الشَّخْصُ', 'الْجُمْلَةُ'],
      rows: [['أَخٌ', 'عِنْدِي أَخٌ'], ['أُخْتٌ', 'عِنْدِي أُخْتٌ'], ['جَدٌّ وَجَدَّةٌ', 'عِنْدِي جَدٌّ وَجَدَّةٌ'], ['لَا أَحَدَ', 'لَيْسَ عِنْدِي إِخْوَةٌ']],
      note: '«عِنْدِي» فِيهَا يَاءُ الْمُتَكَلِّمِ نَفْسُهَا: عِنْدَ + ـِي. وَحِينَ لَا يَكُونُ الشَّيْءُ مَعِي أَقُولُ: لَيْسَ عِنْدِي.',
      quiz: [{
        ch: 'brother',
        q: '… أَخٌ.',
        opts: ['عِنْدِي', 'أَنَا'],
        ok: 'عِنْدِي'
      }, {
        ic: 'house',
        q: 'لَا إِخْوَةَ لِي: … إِخْوَةٌ.',
        opts: ['لَيْسَ عِنْدِي', 'عِنْدِي'],
        ok: 'لَيْسَ عِنْدِي'
      }, {
        ch: 'father',
        q: 'هَذَا أَبِي. هُوَ …',
        opts: ['يَعْمَلُ', 'تَعْمَلُ'],
        ok: 'يَعْمَلُ'
      }, {
        ch: 'mother',
        q: 'هَذِهِ أُمِّي. هِيَ …',
        opts: ['تَطْبُخُ', 'يَطْبُخُ'],
        ok: 'تَطْبُخُ'
      }]
    };
    U.write = {
      word: 'عِنْدِي',
      letters: ['ع', 'ن', 'د', 'ي'],
      sentence: 'عِنْدِي أَخٌ.'
    };
    U.clinic = [{
      bad: 'أَنَا أَخٌ.',
      good: 'عِنْدِي أَخٌ.',
      why: 'أَخِي مَعِي: عِنْدِي'
    }, {
      bad: 'هَذَا أُمِّي.',
      good: 'هَذِهِ أُمِّي.',
      why: 'أُمِّي امْرَأَةٌ: هَذِهِ'
    }, {
      bad: 'أُمِّي يَطْبُخُ.',
      good: 'أُمِّي تَطْبُخُ.',
      why: 'هِيَ تَطْبُخُ'
    }];
    U.qa = [{
      q: 'مَنْ هَذَا؟',
      qc: 'هَذَا',
      a: 'هَذَا أَبِي.',
      ac: 'هَذَا'
    }, {
      q: 'مَاذَا يَعْمَلُ أَبُوكَ؟',
      qc: 'يَعْمَلُ',
      a: 'هُوَ يَعْمَلُ.',
      ac: 'يَعْمَلُ'
    }, {
      q: G('هَلْ عِنْدَكَ إِخْوَةٌ؟', 'هَلْ عِنْدَكِ إِخْوَةٌ؟'),
      qc: 'إِخْوَةٌ',
      a: sib.ans,
      ac: sib.v === '0' ? 'إِخْوَةٌ' : 'عِنْدِي'
    }, {
      q: G('مَنْ تُسَاعِدُ؟', 'مَنْ تُسَاعِدِينَ؟'),
      qc: G('تُسَاعِدُ', 'تُسَاعِدِينَ'),
      a: 'أُسَاعِدُ أُمِّي وَأَبِي.',
      ac: 'أُسَاعِدُ'
    }];
    U.ask = {
      say: 'يَا جَدِّي، هَلْ عِنْدَكَ أُخْتٌ؟',
      reply: 'نَعَمْ، عِنْدِي أُخْتٌ، اسْمُهَا فَاطِمَةُ.'
    };
  }
  if (n === 7) {
    U.picks = [{
      k: 'food',
      q: G('مَاذَا تُرِيدُ أَنْ تَأْكُلَ؟', 'مَاذَا تُرِيدِينَ أَنْ تَأْكُلِي؟'),
      opts: [{
        v: 'bread',
        w: 'خُبْزًا',
        label: 'خُبْزٌ',
        ic: 'bread'
      }, {
        v: 'apple',
        w: 'تُفَّاحَةً',
        label: 'تُفَّاحَةٌ',
        ic: 'apple'
      }, {
        v: 'rice',
        w: 'أَرُزًّا',
        label: 'أَرُزٌّ',
        ic: 'food'
      }]
    }, {
      k: 'drink',
      q: G('مَاذَا تُرِيدُ أَنْ تَشْرَبَ؟', 'مَاذَا تُرِيدِينَ أَنْ تَشْرَبِي؟'),
      opts: [{
        v: 'water',
        w: 'مَاءً',
        label: 'مَاءٌ',
        ic: 'water'
      }, {
        v: 'milk',
        w: 'حَلِيبًا',
        label: 'حَلِيبٌ',
        ic: 'milk'
      }, {
        v: 'juice',
        w: 'عَصِيرًا',
        label: 'عَصِيرٌ',
        ic: 'juice'
      }]
    }];
    const food = P_('food'),
      drink = P_('drink');
    U.host = {
      name: 'أُمِّي',
      gen: 'أُمِّي',
      char: L1CH.mother,
      at: [6, 10],
      intro: G(`رَجَعْتَ مِنَ الْمَلْعَبِ يَا ${NM}! اقْرَأْ، ثُمَّ قُلْ لِي: بِمَاذَا تَشْعُرُ؟`, `رَجَعْتِ مِنَ الْمَلْعَبِ يَا ${NM}! اقْرَئِي، ثُمَّ قُولِي لِي: بِمَاذَا تَشْعُرِينَ؟`),
      final: G('الْآنَ قُلْ لِي: بِمَاذَا تَشْعُرُ، وَمَاذَا تُرِيدُ؟', 'الْآنَ قُولِي لِي: بِمَاذَا تَشْعُرِينَ، وَمَاذَا تُرِيدِينَ؟')
    };
    U.vocab = [{
      w: 'جُوعٌ',
      scene: 'hunger'
    }, {
      w: 'عَطَشٌ',
      scene: 'thirst'
    }, {
      w: 'تَعَبٌ',
      scene: 'tired'
    }, {
      w: 'خُبْزٌ',
      ic: 'bread'
    }, {
      w: 'مَاءٌ',
      ic: 'water'
    }, {
      w: 'حَلِيبٌ',
      ic: 'milk'
    }, {
      w: 'تُفَّاحَةٌ',
      ic: 'apple'
    }, {
      w: 'عَصِيرٌ',
      ic: 'juice'
    }];
    U.lines = [{
      t: 'أَشْعُرُ بِالْجُوعِ.',
      key: 'بِالْجُوعِ',
      scene: 'hunger'
    }, {
      t: `أُرِيدُ أَنْ آكُلَ ${food.w}، مِنْ فَضْلِكِ.`,
      key: food.w,
      ic: food.ic
    }, {
      t: 'أَشْعُرُ بِالْعَطَشِ.',
      key: 'بِالْعَطَشِ',
      scene: 'thirst'
    }, {
      t: `أُرِيدُ أَنْ أَشْرَبَ ${drink.w}.`,
      key: drink.w,
      ic: drink.ic
    }, {
      t: 'بِسْمِ اللَّهِ.',
      key: 'بِسْمِ',
      ic: 'food'
    }, {
      t: 'الْحَمْدُ لِلَّهِ. شُكْرًا يَا أُمِّي.',
      key: 'الْحَمْدُ',
      ic: 'star'
    }, {
      t: 'أَشْعُرُ بِالتَّعَبِ، أُرِيدُ أَنْ أَنَامَ.',
      key: 'بِالتَّعَبِ',
      scene: 'tired'
    }];
    U.templates = ['أَشْعُرُ بِـ …', 'أُرِيدُ أَنْ … مِنْ فَضْلِكِ.', 'بِسْمِ اللَّهِ.', 'الْحَمْدُ لِلَّهِ.'];
    U.tiles = [['أَشْعُرُ', 'بِالْجُوعِ.'], ['أُرِيدُ', 'أَنْ', 'أَشْرَبَ', drink.w + '.']];
    U.rule = {
      title: 'بِـ وَأَنْ: كَلِمَتَانِ لَا تَسْقُطَانِ',
      cols: ['الْكَلِمَةُ', 'الْجُمْلَةُ'],
      rows: [['جُوعٌ', 'أَشْعُرُ بِالْجُوعِ'], ['عَطَشٌ', 'أَشْعُرُ بِالْعَطَشِ'], ['تَعَبٌ', 'أَشْعُرُ بِالتَّعَبِ'], ['آكُلُ', 'أُرِيدُ أَنْ آكُلَ'], ['أَشْرَبُ', 'أُرِيدُ أَنْ أَشْرَبَ'], ['أَنَامُ', 'أُرِيدُ أَنْ أَنَامَ']],
      note: 'بَعْدَ «أَشْعُرُ» تَأْتِي «بِـ» دَائِمًا. وَبَعْدَ «أُرِيدُ» إِذَا جَاءَ فِعْلٌ تَأْتِي «أَنْ» دَائِمًا. وَحِينَ نَطْلُبُ نَقُولُ: مِنْ فَضْلِكَ.',
      quiz: [{
        scene: 'tired',
        q: 'أَيُّ جُمْلَةٍ صَحِيحَةٌ؟',
        opts: ['أَشْعُرُ بِالتَّعَبِ.', 'أَشْعُرُ التَّعَبَ.'],
        ok: 'أَشْعُرُ بِالتَّعَبِ.'
      }, {
        ic: 'milk',
        q: 'أُرِيدُ … أَشْرَبَ حَلِيبًا.',
        opts: ['أَنْ', 'بِـ'],
        ok: 'أَنْ'
      }, {
        scene: 'hunger',
        q: 'أَشْعُرُ …',
        opts: ['بِالْجُوعِ', 'الْجُوعَ'],
        ok: 'بِالْجُوعِ'
      }, {
        ic: 'bread',
        q: 'أُرِيدُ خُبْزًا …',
        opts: ['مِنْ فَضْلِكِ.', 'الْآنَ!'],
        ok: 'مِنْ فَضْلِكِ.'
      }]
    };
    U.write = {
      word: 'أُرِيدُ',
      letters: ['أ', 'ر', 'ي', 'د'],
      sentence: 'أُرِيدُ أَنْ آكُلَ.'
    };
    U.clinic = [{
      bad: 'أَشْعُرُ الْجُوعَ.',
      good: 'أَشْعُرُ بِالْجُوعِ.',
      why: 'بَعْدَ «أَشْعُرُ» نَقُولُ: بِـ'
    }, {
      bad: 'أُرِيدُ أَشْرَبُ.',
      good: 'أُرِيدُ أَنْ أَشْرَبَ.',
      why: 'كَلِمَةٌ نَاقِصَةٌ: أَنْ'
    }, {
      bad: `أُرِيدُ ${drink.w}!`,
      good: `أُرِيدُ ${drink.w} مِنْ فَضْلِكِ.`,
      why: 'نَطْلُبُ بِأَدَبٍ: مِنْ فَضْلِكِ'
    }];
    U.qa = [{
      q: G('بِمَاذَا تَشْعُرُ؟', 'بِمَاذَا تَشْعُرِينَ؟'),
      qc: G('تَشْعُرُ', 'تَشْعُرِينَ'),
      a: 'أَشْعُرُ بِالْجُوعِ.',
      ac: 'أَشْعُرُ'
    }, {
      q: G('مَاذَا تُرِيدُ أَنْ تَأْكُلَ؟', 'مَاذَا تُرِيدِينَ أَنْ تَأْكُلِي؟'),
      qc: G('تَأْكُلَ', 'تَأْكُلِي'),
      a: `أُرِيدُ أَنْ آكُلَ ${food.w}.`,
      ac: 'آكُلَ'
    }, {
      q: G('مَاذَا تَقُولُ قَبْلَ الْأَكْلِ؟', 'مَاذَا تَقُولِينَ قَبْلَ الْأَكْلِ؟'),
      qc: 'قَبْلَ',
      a: 'قَبْلَ الْأَكْلِ أَقُولُ: بِسْمِ اللَّهِ.',
      ac: 'قَبْلَ'
    }, {
      q: G('مَاذَا تَقُولُ بَعْدَ الْأَكْلِ؟', 'مَاذَا تَقُولِينَ بَعْدَ الْأَكْلِ؟'),
      qc: 'بَعْدَ',
      a: 'بَعْدَ الْأَكْلِ أَقُولُ: الْحَمْدُ لِلَّهِ.',
      ac: 'بَعْدَ'
    }];
    U.ask = {
      say: 'يَا جَدِّي، هَلْ تُرِيدُ أَنْ تَشْرَبَ مَاءً؟',
      reply: `نَعَمْ، شُكْرًا ${hb}.`
    };
  }
  if (n === 8) {
    U.host = {
      name: G('الْمُعَلِّمُ', 'الْمُعَلِّمَةُ'),
      gen: G('الْمُعَلِّمِ', 'الْمُعَلِّمَةِ'),
      char: G(L1CH.teacherM, L1CH.teacherF),
      at: [36, 17],
      intro: G(`يَا ${NM}، احْكِ لَنَا يَوْمَكَ مِنْ أَوَّلِهِ. اقْرَأْ أَوَّلًا.`, `يَا ${NM}، احْكِي لَنَا يَوْمَكِ مِنْ أَوَّلِهِ. اقْرَئِي أَوَّلًا.`),
      final: G('الْآنَ احْكِ يَوْمَكَ كُلَّهُ بِالتَّرْتِيبِ.', 'الْآنَ احْكِي يَوْمَكِ كُلَّهُ بِالتَّرْتِيبِ.')
    };
    U.vocab = [{
      w: 'صَبَاحٌ',
      ic: 'sun'
    }, {
      w: 'لَيْلٌ',
      ic: 'moon'
    }, {
      w: 'مَدْرَسَةٌ',
      ic: 'school'
    }, {
      w: 'أَسْتَيْقِظُ',
      scene: 'wake'
    }, {
      w: 'أُصَلِّي',
      scene: 'pray'
    }, {
      w: 'آكُلُ',
      ic: 'food'
    }, {
      w: 'أَذْهَبُ',
      scene: 'go'
    }, {
      w: 'أَلْعَبُ',
      ic: 'ball'
    }, {
      w: 'أَنَامُ',
      scene: 'sleep'
    }];
    U.lines = [{
      t: 'فِي الصَّبَاحِ أَسْتَيْقِظُ.',
      key: 'أَسْتَيْقِظُ',
      scene: 'wake'
    }, {
      t: 'أُصَلِّي، ثُمَّ آكُلُ.',
      key: 'ثُمَّ',
      scene: 'pray'
    }, {
      t: 'ثُمَّ أَذْهَبُ إِلَى الْمَدْرَسَةِ.',
      key: 'أَذْهَبُ',
      scene: 'go'
    }, {
      t: 'بَعْدَ الْمَدْرَسَةِ أَلْعَبُ.',
      key: 'أَلْعَبُ',
      ic: 'ball'
    }, {
      t: 'ثُمَّ أُسَاعِدُ أُمِّي.',
      key: 'أُسَاعِدُ',
      scene: 'help'
    }, {
      t: 'فِي اللَّيْلِ أَنَامُ.',
      key: 'أَنَامُ',
      scene: 'sleep'
    }, {
      t: 'هَذَا يَوْمِي.',
      key: 'يَوْمِي',
      ic: 'sun'
    }];
    U.templates = ['فِي الصَّبَاحِ …', '…، ثُمَّ …', 'بَعْدَ الْمَدْرَسَةِ …', 'فِي اللَّيْلِ …'];
    U.tiles = [['فِي', 'الصَّبَاحِ', 'أَسْتَيْقِظُ.'], ['أُصَلِّي،', 'ثُمَّ', 'آكُلُ.']];
    U.rule = {
      title: 'ثُمَّ = بَعْدَ ذَلِكَ',
      cols: ['أَوَّلًا', 'بَعْدَ ذَلِكَ', 'الْجُمْلَةُ'],
      rows: [['أَسْتَيْقِظُ', 'أُصَلِّي', 'أَسْتَيْقِظُ، ثُمَّ أُصَلِّي'], ['أُصَلِّي', 'آكُلُ', 'أُصَلِّي، ثُمَّ آكُلُ'], ['آكُلُ', 'أَذْهَبُ', 'آكُلُ، ثُمَّ أَذْهَبُ'], ['أَلْعَبُ', 'أَنَامُ', 'أَلْعَبُ، ثُمَّ أَنَامُ']],
      note: '«ثُمَّ» تَرْبِطُ شَيْئَيْنِ بِالتَّرْتِيبِ: الْأَوَّلُ قَبْلَهَا، وَالثَّانِي بَعْدَهَا. كُلُّ الْأَفْعَالِ هُنَا تَبْدَأُ بِـ«أَ» لِأَنِّي أَتَكَلَّمُ عَنْ نَفْسِي.',
      quiz: [{
        scene: 'wake',
        q: 'أَسْتَيْقِظُ، … أُصَلِّي.',
        opts: ['ثُمَّ', 'فِي'],
        ok: 'ثُمَّ'
      }, {
        scene: 'go',
        q: 'آكُلُ، ثُمَّ …',
        opts: ['أَذْهَبُ', 'أَسْتَيْقِظُ'],
        ok: 'أَذْهَبُ'
      }, {
        scene: 'sleep',
        q: 'أَلْعَبُ، … أَنَامُ.',
        opts: ['ثُمَّ', 'أَنَا'],
        ok: 'ثُمَّ'
      }, {
        ic: 'sun',
        q: 'أَيُّ تَرْتِيبٍ صَحِيحٌ؟',
        opts: ['أَسْتَيْقِظُ، ثُمَّ آكُلُ.', 'آكُلُ، ثُمَّ أَسْتَيْقِظُ.'],
        ok: 'أَسْتَيْقِظُ، ثُمَّ آكُلُ.'
      }]
    };
    U.write = {
      word: 'ثُمَّ',
      letters: ['ث', 'م'],
      sentence: 'أُصَلِّي، ثُمَّ آكُلُ.'
    };
    U.clinic = [{
      bad: 'آكُلُ، ثُمَّ أَسْتَيْقِظُ.',
      good: 'أَسْتَيْقِظُ، ثُمَّ آكُلُ.',
      why: 'التَّرْتِيبُ: أَسْتَيْقِظُ أَوَّلًا'
    }, {
      bad: 'أُصَلِّي آكُلُ.',
      good: 'أُصَلِّي، ثُمَّ آكُلُ.',
      why: 'كَلِمَةٌ نَاقِصَةٌ: ثُمَّ'
    }, {
      bad: 'فِي اللَّيْلِ أَسْتَيْقِظُ.',
      good: 'فِي اللَّيْلِ أَنَامُ.',
      why: 'فِي اللَّيْلِ نَنَامُ'
    }];
    U.qa = [{
      q: G('مَتَى تَسْتَيْقِظُ؟', 'مَتَى تَسْتَيْقِظِينَ؟'),
      qc: G('تَسْتَيْقِظُ', 'تَسْتَيْقِظِينَ'),
      a: 'أَسْتَيْقِظُ فِي الصَّبَاحِ.',
      ac: 'أَسْتَيْقِظُ'
    }, {
      q: G('مَاذَا تَفْعَلُ بَعْدَ الصَّلَاةِ؟', 'مَاذَا تَفْعَلِينَ بَعْدَ الصَّلَاةِ؟'),
      qc: 'بَعْدَ',
      a: 'أُصَلِّي، ثُمَّ آكُلُ.',
      ac: 'ثُمَّ'
    }, {
      q: G('إِلَى أَيْنَ تَذْهَبُ؟', 'إِلَى أَيْنَ تَذْهَبِينَ؟'),
      qc: G('تَذْهَبُ', 'تَذْهَبِينَ'),
      a: 'أَذْهَبُ إِلَى الْمَدْرَسَةِ.',
      ac: 'أَذْهَبُ'
    }, {
      q: G('مَتَى تَنَامُ؟', 'مَتَى تَنَامِينَ؟'),
      qc: G('تَنَامُ', 'تَنَامِينَ'),
      a: 'فِي اللَّيْلِ أَنَامُ.',
      ac: 'أَنَامُ'
    }];
    U.ask = {
      say: 'يَا جَدِّي، مَتَى تَسْتَيْقِظُ؟',
      reply: 'أَسْتَيْقِظُ فِي الْفَجْرِ، ثُمَّ أُصَلِّي.'
    };
  }
  if (n === 9) {
    U.picks = [{
      k: 'thing',
      q: G('مَاذَا ضَاعَ مِنْكَ؟', 'مَاذَا ضَاعَ مِنْكِ؟'),
      opts: [{
        v: 'pen',
        w: 'قَلَمِي',
        base: 'الْقَلَمُ',
        pr: 'هُوَ',
        label: 'الْقَلَمُ',
        ic: 'pen'
      }, {
        v: 'book',
        w: 'كِتَابِي',
        base: 'الْكِتَابُ',
        pr: 'هُوَ',
        label: 'الْكِتَابُ',
        ic: 'book'
      }, {
        v: 'ball',
        w: 'كُرَتِي',
        base: 'الْكُرَةُ',
        pr: 'هِيَ',
        label: 'الْكُرَةُ',
        ic: 'ball'
      }]
    }];
    const th = P_('thing');
    U.host = {
      name: 'أُمِّي',
      gen: 'أُمِّي',
      char: L1CH.mother,
      at: [6, 11],
      intro: G(`يَا ${NM}، الْمَدْرَسَةُ بَعْدَ قَلِيلٍ، وَ${th.base} لَيْسَ فِي الْحَقِيبَةِ! اقْرَأْ، ثُمَّ ابْحَثْ مَعِي.`, `يَا ${NM}، الْمَدْرَسَةُ بَعْدَ قَلِيلٍ، وَ${th.base} لَيْسَ فِي الْحَقِيبَةِ! اقْرَئِي، ثُمَّ ابْحَثِي مَعِي.`),
      final: G('الْآنَ احْكِ كَيْفَ بَحَثْتَ وَوَجَدْتَ.', 'الْآنَ احْكِي كَيْفَ بَحَثْتِ وَوَجَدْتِ.')
    };
    if (th.pr === 'هِيَ') U.host.intro = U.host.intro.replace('لَيْسَ فِي', 'لَيْسَتْ فِي');
    U.vocab = [{
      w: 'قَلَمٌ',
      ic: 'pen'
    }, {
      w: 'كِتَابٌ',
      ic: 'book'
    }, {
      w: 'حَقِيبَةٌ',
      ic: 'bag'
    }, {
      w: 'مَكْتَبٌ',
      ic: 'desk'
    }, {
      w: 'كُرْسِيٌّ',
      ic: 'chair'
    }, {
      w: 'سَرِيرٌ',
      ic: 'bed'
    }, {
      w: 'أَبْحَثُ',
      scene: 'search'
    }];
    U.lines = [{
      t: `يَا أُمِّي، أَيْنَ ${th.w}؟`,
      key: 'أَيْنَ',
      scene: 'search'
    }, {
      t: `هَلْ ${th.pr} فِي الْحَقِيبَةِ؟`,
      key: 'فِي',
      scene: 'inP'
    }, {
      t: `هَلْ ${th.pr} عَلَى الْمَكْتَبِ؟`,
      key: 'عَلَى',
      scene: 'onP'
    }, {
      t: `${th.base} تَحْتَ الْكُرْسِيِّ!`,
      key: 'تَحْتَ',
      scene: 'underP'
    }, {
      t: `هَا ${th.pr}! شُكْرًا يَا أُمِّي.`,
      key: 'هَا',
      scene: 'thanks'
    }, {
      t: `الْآنَ ${th.base} فِي الْحَقِيبَةِ.`,
      key: 'الْحَقِيبَةِ',
      ic: 'bag'
    }];
    U.other = {
      0: G('ابْحَثْ مَعِي يَا حَبِيبِي.', 'ابْحَثِي مَعِي يَا حَبِيبَتِي.'),
      1: G('لَا. انْظُرْ عَلَى الْمَكْتَبِ.', 'لَا. انْظُرِي عَلَى الْمَكْتَبِ.'),
      2: G('لَا. انْظُرْ تَحْتَ الْكُرْسِيِّ.', 'لَا. انْظُرِي تَحْتَ الْكُرْسِيِّ.'),
      3: G('أَحْسَنْتَ!', 'أَحْسَنْتِ!'),
      4: 'عَفْوًا. لِكُلِّ شَيْءٍ مَكَانُهُ.'
    };
    U.templates = ['أَيْنَ …؟', 'هَلْ هُوَ فِي …؟', '… عَلَى …', '… تَحْتَ …', '… فَوْقَ …'];
    U.tiles = [['أَيْنَ', th.w + '؟'], [th.base, 'تَحْتَ', 'الْكُرْسِيِّ!']];
    U.rule = {
      title: 'فِي · عَلَى · تَحْتَ · فَوْقَ: وَالْكَلِمَةُ بَعْدَهَا بِكَسْرَةٍ',
      cols: ['الْكَلِمَةُ', 'أَيْنَ؟'],
      rows: [['الْحَقِيبَةُ', 'فِي الْحَقِيبَةِ'], ['الْمَكْتَبُ', 'عَلَى الْمَكْتَبِ'], ['الْكُرْسِيُّ', 'تَحْتَ الْكُرْسِيِّ'], ['السَّرِيرُ', 'فَوْقَ السَّرِيرِ']],
      note: 'أَسْأَلُ عَنِ الْمَكَانِ بِـ«أَيْنَ؟». وَأُجِيبُ بِـ: فِي، عَلَى، تَحْتَ، فَوْقَ. وَالْكَلِمَةُ بَعْدَهَا تَنْتَهِي بِكَسْرَةٍ: الْمَكْتَبُ ← عَلَى الْمَكْتَبِ.',
      quiz: [{
        scene: 'inP',
        q: 'الْكُرَةُ … الْحَقِيبَةِ.',
        opts: ['فِي', 'تَحْتَ'],
        ok: 'فِي'
      }, {
        scene: 'onP',
        q: 'الْكُرَةُ … الْمَكْتَبِ.',
        opts: ['عَلَى', 'فِي'],
        ok: 'عَلَى'
      }, {
        scene: 'underP',
        q: 'الْكُرَةُ … الْكُرْسِيِّ.',
        opts: ['تَحْتَ', 'عَلَى'],
        ok: 'تَحْتَ'
      }, {
        scene: 'aboveP',
        q: 'الْمِصْبَاحُ فَوْقَ …',
        opts: ['السَّرِيرِ', 'السَّرِيرُ'],
        ok: 'السَّرِيرِ'
      }]
    };
    U.write = {
      words: [{
        word: 'قَلَمِي',
        letters: ['ق', 'ل', 'م', 'ي']
      }, {
        word: 'فِي',
        letters: ['ف', 'ي']
      }],
      newL: ['ق', 'ف'],
      sentence: 'الْقَلَمُ فِي الْحَقِيبَةِ.'
    };
    U.clinic = [{
      bad: 'الْقَلَمُ عَلَى الْكُرْسِيُّ.',
      good: 'الْقَلَمُ عَلَى الْكُرْسِيِّ.',
      why: 'بَعْدَ «عَلَى»: كَسْرَةٌ'
    }, {
      bad: 'الْكِتَابُ الْحَقِيبَةِ.',
      good: 'الْكِتَابُ فِي الْحَقِيبَةِ.',
      why: 'كَلِمَةٌ نَاقِصَةٌ: فِي'
    }, {
      bad: 'مَاذَا قَلَمِي؟',
      good: 'أَيْنَ قَلَمِي؟',
      why: 'أَسْأَلُ عَنِ الْمَكَانِ: أَيْنَ'
    }];
    U.qa = [{
      q: `أَيْنَ ${th.base}؟`,
      qc: 'أَيْنَ',
      a: `${th.base} تَحْتَ الْكُرْسِيِّ.`,
      ac: 'تَحْتَ'
    }, {
      q: 'أَيْنَ الْكِتَابُ؟',
      qc: 'أَيْنَ',
      a: 'الْكِتَابُ عَلَى الْمَكْتَبِ.',
      ac: 'عَلَى'
    }, {
      q: 'أَيْنَ الْقَلَمُ الْآنَ؟',
      qc: 'الْآنَ',
      a: 'الْقَلَمُ فِي الْحَقِيبَةِ.',
      ac: 'فِي'
    }, {
      q: 'أَيْنَ الْمِصْبَاحُ؟',
      qc: 'الْمِصْبَاحُ',
      a: 'الْمِصْبَاحُ فَوْقَ السَّرِيرِ.',
      ac: 'فَوْقَ'
    }];
    U.ask = {
      say: 'يَا جَدِّي، أَيْنَ نَظَّارَتُكَ؟',
      reply: G('نَظَّارَتِي؟ هَا هِيَ، عَلَى رَأْسِي! شُكْرًا يَا حَبِيبِي.', 'نَظَّارَتِي؟ هَا هِيَ، عَلَى رَأْسِي! شُكْرًا يَا حَبِيبَتِي.')
    };
    U.tower = [0, 1, 2, 3].map(i => U.lines[i]);
  }
  if (n === 10) {
    const pl = (v, w, gen, label, ic, f) => ({
      v,
      w,
      gen,
      label,
      ic,
      f
    });
    U.picks = [{
      k: 'near',
      q: G('مَا الْقَرِيبُ مِنْ بَيْتِكَ؟', 'مَا الْقَرِيبُ مِنْ بَيْتِكِ؟'),
      opts: [pl('mosque', 'الْمَسْجِدُ', 'الْمَسْجِدِ', 'الْمَسْجِدُ', 'mosque', false), pl('shop', 'الدُّكَّانُ', 'الدُّكَّانِ', 'الدُّكَّانُ', 'market', false), pl('park', 'الْحَدِيقَةُ', 'الْحَدِيقَةِ', 'الْحَدِيقَةُ', 'park', true)]
    }, {
      k: 'far',
      q: G('وَمَا الْبَعِيدُ؟', 'وَمَا الْبَعِيدُ؟'),
      opts: [pl('school', 'الْمَدْرَسَةُ', 'الْمَدْرَسَةِ', 'الْمَدْرَسَةُ', 'school', true), pl('hosp', 'الْمُسْتَشْفَى', 'الْمُسْتَشْفَى', 'الْمُسْتَشْفَى', 'hospital', false), pl('market', 'السُّوقُ', 'السُّوقِ', 'السُّوقُ', 'market', true)]
    }];
    const nr = P_('near'),
      fr = P_('far');
    const adj = (o, a) => o.f ? a + 'َةٌ' : a + 'ٌ';
    const nearA = adj(nr, 'قَرِيب'),
      farA = adj(fr, 'بَعِيد');
    U.host = {
      name: G('جَارٌ جَدِيدٌ', 'جَارَةٌ جَدِيدَةٌ'),
      gen: G('الْجَارِ الْجَدِيدِ', 'الْجَارَةِ الْجَدِيدَةِ'),
      char: G(L1CH.newFriendM, L1CH.newFriendF),
      at: [27, 11],
      intro: G(`مَرْحَبًا يَا ${NM}! أَنَا جَدِيدٌ فِي الْحَيِّ، وَلَا أَعْرِفُ الْأَمَاكِنَ. اقْرَأْ، ثُمَّ عَرِّفْنِي بِحَيِّكَ.`, `مَرْحَبًا يَا ${NM}! أَنَا جَدِيدَةٌ فِي الْحَيِّ، وَلَا أَعْرِفُ الْأَمَاكِنَ. اقْرَئِي، ثُمَّ عَرِّفِينِي بِحَيِّكِ.`),
      final: G('الْآنَ عَرِّفْنِي بِحَيِّكَ كُلِّهِ.', 'الْآنَ عَرِّفِينِي بِحَيِّكِ كُلِّهِ.')
    };
    U.vocab = [{
      w: 'حَيٌّ',
      ic: 'street'
    }, {
      w: 'بَيْتٌ',
      ic: 'house'
    }, {
      w: 'مَسْجِدٌ',
      ic: 'mosque'
    }, {
      w: 'دُكَّانٌ',
      ic: 'market'
    }, {
      w: 'حَدِيقَةٌ',
      ic: 'park'
    }, {
      w: 'مَدْرَسَةٌ',
      ic: 'school'
    }, {
      w: 'قَرِيبٌ',
      scene: 'nearS'
    }, {
      w: 'بَعِيدٌ',
      scene: 'farS'
    }];
    U.lines = [{
      t: 'مَرْحَبًا! هَذَا حَيِّي.',
      key: 'حَيِّي',
      ic: 'street'
    }, {
      t: 'وَهَذَا بَيْتِي.',
      key: 'بَيْتِي',
      ic: 'house'
    }, {
      t: `${nr.w} ${nearA} مِنْ بَيْتِي.`,
      key: nearA,
      scene: 'nearS'
    }, {
      t: `${fr.w} ${farA}.`,
      key: farA,
      scene: 'farS'
    }, {
      t: `أَذْهَبُ إِلَى ${fr.gen} بِالسَّيَّارَةِ.`,
      key: 'بِالسَّيَّارَةِ',
      ic: 'car'
    }, {
      t: `وَأَمْشِي إِلَى ${nr.gen}.`,
      key: 'أَمْشِي',
      scene: 'go'
    }, {
      t: 'حَيِّي جَمِيلٌ.',
      key: 'جَمِيلٌ',
      ic: 'star'
    }];
    U.other = {
      1: G('بَيْتُكَ جَمِيلٌ!', 'بَيْتُكِ جَمِيلٌ!'),
      3: G(`وَكَيْفَ تَذْهَبُ إِلَى ${fr.gen}؟`, `وَكَيْفَ تَذْهَبِينَ إِلَى ${fr.gen}؟`),
      6: G('نَعَمْ، حَيُّكَ جَمِيلٌ. شُكْرًا!', 'نَعَمْ، حَيُّكِ جَمِيلٌ. شُكْرًا!')
    };
    U.templates = ['هَذَا حَيِّي.', '… قَرِيبٌ', '… قَرِيبَةٌ', '… بَعِيدٌ', '… بَعِيدَةٌ', 'أَذْهَبُ إِلَى …'];
    U.tiles = [[nr.w, nearA, 'مِنْ', 'بَيْتِي.'], ['أَذْهَبُ', 'إِلَى', fr.gen, 'بِالسَّيَّارَةِ.']];
    U.rule = {
      title: G('قَرِيبٌ أَمْ قَرِيبَةٌ؟ انْظُرْ إِلَى آخِرِ الْكَلِمَةِ', 'قَرِيبٌ أَمْ قَرِيبَةٌ؟ انْظُرِي إِلَى آخِرِ الْكَلِمَةِ'),
      cols: ['الْمَكَانُ', 'قَرِيبٌ أَمْ قَرِيبَةٌ؟'],
      rows: [['الْمَسْجِدُ', 'الْمَسْجِدُ قَرِيبٌ'], ['الدُّكَّانُ', 'الدُّكَّانُ قَرِيبٌ'], ['الْمَدْرَسَةُ', 'الْمَدْرَسَةُ قَرِيبَةٌ'], ['الْحَدِيقَةُ', 'الْحَدِيقَةُ قَرِيبَةٌ']],
      note: 'تَذَكَّرْ مَدِينَةَ «هَذَا وَهَذِهِ»: الْكَلِمَةُ الَّتِي آخِرُهَا «ـةٌ» نَقُولُ لَهَا: هَذِهِ، وَنَقُولُ: قَرِيبَةٌ، بَعِيدَةٌ. وَالْكَلِمَةُ بِلَا «ـةٍ»: هَذَا، قَرِيبٌ، بَعِيدٌ.',
      quiz: [{
        ic: 'mosque',
        q: 'الْمَسْجِدُ …',
        opts: ['قَرِيبٌ', 'قَرِيبَةٌ'],
        ok: 'قَرِيبٌ'
      }, {
        ic: 'school',
        q: 'الْمَدْرَسَةُ …',
        opts: ['بَعِيدَةٌ', 'بَعِيدٌ'],
        ok: 'بَعِيدَةٌ'
      }, {
        ic: 'park',
        q: 'الْحَدِيقَةُ …',
        opts: ['قَرِيبَةٌ', 'قَرِيبٌ'],
        ok: 'قَرِيبَةٌ'
      }, {
        ic: 'market',
        q: 'الدُّكَّانُ …',
        opts: ['بَعِيدٌ', 'بَعِيدَةٌ'],
        ok: 'بَعِيدٌ'
      }]
    };
    U.write = {
      words: [{
        word: 'قَرِيبٌ',
        letters: ['ق', 'ر', 'ي', 'ب']
      }, {
        word: 'قَرِيبَةٌ',
        letters: ['ق', 'ر', 'ي', 'ب', 'ة']
      }],
      newL: ['ب', 'ة'],
      sentence: 'الْمَسْجِدُ قَرِيبٌ.'
    };
    U.clinic = [{
      bad: 'الْمَدْرَسَةُ قَرِيبٌ.',
      good: 'الْمَدْرَسَةُ قَرِيبَةٌ.',
      why: 'الْمَدْرَسَةُ آخِرُهَا «ـةٌ»: قَرِيبَةٌ'
    }, {
      bad: 'الْمَسْجِدُ قَرِيبَةٌ.',
      good: 'الْمَسْجِدُ قَرِيبٌ.',
      why: 'الْمَسْجِدُ بِلَا «ـةٍ»: قَرِيبٌ'
    }, {
      bad: 'أَذْهَبُ الْمَدْرَسَةِ.',
      good: 'أَذْهَبُ إِلَى الْمَدْرَسَةِ.',
      why: 'كَلِمَةٌ نَاقِصَةٌ: إِلَى'
    }];
    U.qa = [{
      q: G('أَيْنَ بَيْتُكَ؟', 'أَيْنَ بَيْتُكِ؟'),
      qc: 'أَيْنَ',
      a: 'بَيْتِي فِي هَذَا الْحَيِّ.',
      ac: 'فِي'
    }, {
      q: `هَلْ ${nr.w} ${nearA}؟`,
      qc: nearA,
      a: `نَعَمْ، ${nr.w} ${nearA}.`,
      ac: nearA
    }, {
      q: `هَلْ ${fr.w} ${adj(fr, 'قَرِيب')}؟`,
      qc: adj(fr, 'قَرِيب'),
      a: `لَا، ${fr.w} ${farA}.`,
      ac: farA
    }, {
      q: G(`كَيْفَ تَذْهَبُ إِلَى ${fr.gen}؟`, `كَيْفَ تَذْهَبِينَ إِلَى ${fr.gen}؟`),
      qc: 'كَيْفَ',
      a: `أَذْهَبُ إِلَى ${fr.gen} بِالسَّيَّارَةِ.`,
      ac: 'بِالسَّيَّارَةِ'
    }];
    U.ask = {
      say: 'يَا جَدِّي، هَلْ بَيْتُكَ قَرِيبٌ؟',
      reply: G('نَعَمْ يَا حَبِيبِي، بَيْتِي قَرِيبٌ مِنَ الْمَسْجِدِ.', 'نَعَمْ يَا حَبِيبَتِي، بَيْتِي قَرِيبٌ مِنَ الْمَسْجِدِ.')
    };
    U.tower = [0, 2, 3, 4].map(i => U.lines[i]);
  }
  if (n === 11) {
    U.picks = [{
      k: 'num',
      q: G('كَمْ رَغِيفًا تُرِيدُ؟', 'كَمْ رَغِيفًا تُرِيدِينَ؟'),
      opts: [{
        v: '3',
        w: 'ثَلَاثَةً',
        label: '٣',
        ic: 'bread'
      }, {
        v: '4',
        w: 'أَرْبَعَةً',
        label: '٤',
        ic: 'bread'
      }, {
        v: '5',
        w: 'خَمْسَةً',
        label: '٥',
        ic: 'bread'
      }]
    }, {
      k: 'drink',
      q: G('وَمَاذَا تُرِيدُ أَيْضًا؟', 'وَمَاذَا تُرِيدِينَ أَيْضًا؟'),
      opts: [{
        v: 'milk',
        w: 'حَلِيبًا',
        label: 'حَلِيبٌ',
        ic: 'milk'
      }, {
        v: 'juice',
        w: 'عَصِيرًا',
        label: 'عَصِيرٌ',
        ic: 'juice'
      }, {
        v: 'water',
        w: 'مَاءً',
        label: 'مَاءٌ',
        ic: 'water'
      }]
    }];
    const num = P_('num'),
      dr = P_('drink');
    U.host = {
      name: 'الْبَائِعُ',
      gen: 'الْبَائِعِ',
      char: L1CH.seller,
      at: [30, 11],
      intro: G(`أَهْلًا يَا ${NM}! أُمُّكَ أَرْسَلَتْكَ إِلَى الدُّكَّانِ لِتَشْتَرِيَ خُبْزًا. اقْرَأْ، ثُمَّ اشْتَرِ مِنِّي.`, `أَهْلًا يَا ${NM}! أُمُّكِ أَرْسَلَتْكِ إِلَى الدُّكَّانِ لِتَشْتَرِيَ خُبْزًا. اقْرَئِي، ثُمَّ اشْتَرِي مِنِّي.`),
      final: G('الْآنَ اشْتَرِ كُلَّ شَيْءٍ مِنْ أَوَّلِهِ.', 'الْآنَ اشْتَرِي كُلَّ شَيْءٍ مِنْ أَوَّلِهِ.')
    };
    U.vocab = [{
      w: 'خُبْزٌ',
      ic: 'bread'
    }, {
      w: 'رَغِيفٌ',
      scene: 'count'
    }, {
      w: 'حَلِيبٌ',
      ic: 'milk'
    }, {
      w: 'عَصِيرٌ',
      ic: 'juice'
    }, {
      w: 'مَاءٌ',
      ic: 'water'
    }, {
      w: 'بَائِعٌ',
      ch: 'seller'
    }, {
      w: 'ثَمَنٌ',
      scene: 'pay'
    }];
    U.lines = [{
      t: 'السَّلَامُ عَلَيْكُمْ يَا عَمِّي.',
      key: 'عَلَيْكُمْ',
      scene: 'greet'
    }, {
      t: 'أُرِيدُ خُبْزًا، مِنْ فَضْلِكَ.',
      key: 'خُبْزًا',
      ic: 'bread'
    }, {
      t: `${num.w}، مِنْ فَضْلِكَ.`,
      key: num.w,
      scene: 'count'
    }, {
      t: `وَأُرِيدُ ${dr.w} أَيْضًا.`,
      key: dr.w,
      ic: dr.ic
    }, {
      t: 'كَمِ الثَّمَنُ؟',
      key: 'كَمِ',
      scene: 'pay'
    }, {
      t: 'تَفَضَّلْ. شُكْرًا يَا عَمِّي.',
      key: 'تَفَضَّلْ',
      scene: 'thanks'
    }];
    U.other = {
      0: 'وَعَلَيْكُمُ السَّلَامُ. أَهْلًا بِكَ!',
      1: G('كَمْ رَغِيفًا تُرِيدُ؟', 'كَمْ رَغِيفًا تُرِيدِينَ؟'),
      2: G('تَفَضَّلْ. وَمَاذَا تُرِيدُ أَيْضًا؟', 'تَفَضَّلِي. وَمَاذَا تُرِيدِينَ أَيْضًا؟'),
      3: G('تَفَضَّلْ.', 'تَفَضَّلِي.'),
      4: 'عَشَرَةٌ.',
      5: 'عَفْوًا. مَعَ السَّلَامَةِ.'
    };
    U.other[0] = G('وَعَلَيْكُمُ السَّلَامُ. أَهْلًا بِكَ!', 'وَعَلَيْكُمُ السَّلَامُ. أَهْلًا بِكِ!');
    U.templates = ['أُرِيدُ …، مِنْ فَضْلِكَ.', 'كَمْ …؟', 'كَمِ الثَّمَنُ؟', 'وَاحِدٌ، اثْنَانِ، ثَلَاثَةٌ …'];
    U.tiles = [['أُرِيدُ', 'خُبْزًا،', 'مِنْ', 'فَضْلِكَ.'], ['كَمِ', 'الثَّمَنُ؟']];
    U.rule = {
      title: 'كَمْ؟ ← نَعُدُّ مِنْ وَاحِدٍ إِلَى عَشَرَةٍ',
      cols: ['الرَّقْمُ', 'نَقُولُ'],
      rows: [['١', 'وَاحِدٌ'], ['٢', 'اثْنَانِ'], ['٣', 'ثَلَاثَةٌ'], ['٤', 'أَرْبَعَةٌ'], ['٥', 'خَمْسَةٌ'], ['٦', 'سِتَّةٌ'], ['٧', 'سَبْعَةٌ'], ['٨', 'ثَمَانِيَةٌ'], ['٩', 'تِسْعَةٌ'], ['١٠', 'عَشَرَةٌ']],
      note: 'نَسْأَلُ عَنِ الْعَدَدِ بِـ«كَمْ؟»، وَنُجِيبُ بِالْعَدَدِ وَحْدَهُ. وَحِينَ أَطْلُبُ أَقُولُ: ثَلَاثَةً، مِنْ فَضْلِكَ. وَأَسْأَلُ عَنِ الثَّمَنِ: كَمِ الثَّمَنُ؟',
      quiz: [{
        scene: 'count',
        q: 'كَمْ رَغِيفًا؟ (٣) ← …',
        opts: ['ثَلَاثَةٌ', 'خَمْسَةٌ'],
        ok: 'ثَلَاثَةٌ'
      }, {
        ic: 'question',
        q: 'وَاحِدٌ، اثْنَانِ، …',
        opts: ['ثَلَاثَةٌ', 'أَرْبَعَةٌ'],
        ok: 'ثَلَاثَةٌ'
      }, {
        scene: 'pay',
        q: 'أَسْأَلُ الْبَائِعَ: … الثَّمَنُ؟',
        opts: ['كَمِ', 'أَيْنَ'],
        ok: 'كَمِ'
      }, {
        ic: 'star',
        q: 'سِتَّةٌ، سَبْعَةٌ، …',
        opts: ['ثَمَانِيَةٌ', 'تِسْعَةٌ'],
        ok: 'ثَمَانِيَةٌ'
      }]
    };
    U.write = {
      words: [{
        word: 'خُبْزٌ',
        letters: ['خ', 'ب', 'ز']
      }],
      newL: ['خ', 'ز'],
      sentence: 'أُرِيدُ خُبْزًا.'
    };
    U.clinic = [{
      bad: 'أَيْنَ الثَّمَنُ؟',
      good: 'كَمِ الثَّمَنُ؟',
      why: 'أَسْأَلُ عَنِ الْعَدَدِ: كَمْ'
    }, {
      bad: 'وَاحِدٌ، ثَلَاثَةٌ، اثْنَانِ.',
      good: 'وَاحِدٌ، اثْنَانِ، ثَلَاثَةٌ.',
      why: 'التَّرْتِيبُ: ١ ثُمَّ ٢ ثُمَّ ٣'
    }, {
      bad: 'أُرِيدُ خُبْزًا!',
      good: 'أُرِيدُ خُبْزًا، مِنْ فَضْلِكَ.',
      why: 'نَطْلُبُ بِأَدَبٍ: مِنْ فَضْلِكَ'
    }];
    U.qa = [{
      q: G('مَاذَا تُرِيدُ؟', 'مَاذَا تُرِيدِينَ؟'),
      qc: G('تُرِيدُ', 'تُرِيدِينَ'),
      a: 'أُرِيدُ خُبْزًا، مِنْ فَضْلِكَ.',
      ac: 'أُرِيدُ'
    }, {
      q: G('كَمْ رَغِيفًا تُرِيدُ؟', 'كَمْ رَغِيفًا تُرِيدِينَ؟'),
      qc: 'كَمْ',
      a: `${num.w}، مِنْ فَضْلِكَ.`,
      ac: num.w
    }, {
      q: G('كَمْ عُمْرُكَ؟', 'كَمْ عُمْرُكِ؟'),
      qc: 'كَمْ',
      a: `عُمْرِي ${age}.`,
      ac: 'عُمْرِي'
    }, {
      q: G('عُدَّ مِنْ وَاحِدٍ إِلَى خَمْسَةٍ.', 'عُدِّي مِنْ وَاحِدٍ إِلَى خَمْسَةٍ.'),
      qc: G('عُدَّ', 'عُدِّي'),
      a: 'وَاحِدٌ، اثْنَانِ، ثَلَاثَةٌ، أَرْبَعَةٌ، خَمْسَةٌ.',
      ac: 'وَاحِدٌ'
    }];
    U.ask = {
      say: 'يَا جَدِّي، كَمْ عُمْرُكَ؟',
      reply: 'عُمْرِي سَبْعُونَ سَنَةً، وَالْحَمْدُ لِلَّهِ.'
    };
    U.tower = [1, 2, 3, 4].map(i => U.lines[i]);
  }
  if (n === 12) {
    U.picks = [{
      k: 'mate',
      q: G('مَا اسْمُ زَمِيلِكَ فِي الصَّفِّ؟', 'مَا اسْمُ زَمِيلَتِكِ فِي الصَّفِّ؟'),
      opts: l1Friends()
    }];
    const mt = P_('mate');
    const ZM = G('زَمِيلِي', 'زَمِيلَتِي');
    U.host = {
      name: G('أَخِي الصَّغِيرُ', 'أُخْتِي الصَّغِيرَةُ'),
      gen: G('أَخِي الصَّغِيرِ', 'أُخْتِي الصَّغِيرَةِ'),
      char: G(L1CH.brother, L1CH.sister),
      at: [14, 11],
      intro: G(`يَا ${NM}، أَنَا صَغِيرٌ، وَأُرِيدُ أَنْ أَدْخُلَ الْمَدْرَسَةَ. كَيْفَ صَفُّكُمْ؟ اقْرَأْ، ثُمَّ حَدِّثْنِي.`, `يَا ${NM}، أَنَا صَغِيرَةٌ، وَأُرِيدُ أَنْ أَدْخُلَ الْمَدْرَسَةَ. كَيْفَ صَفُّكُمْ؟ اقْرَئِي، ثُمَّ حَدِّثِينِي.`),
      final: G('الْآنَ حَدِّثْنِي عَنْ صَفِّكُمْ كُلِّهِ.', 'الْآنَ حَدِّثِينِي عَنْ صَفِّكُمْ كُلِّهِ.')
    };
    U.vocab = [{
      w: 'صَفٌّ',
      ic: 'school'
    }, {
      w: G('مُعَلِّمٌ', 'مُعَلِّمَةٌ'),
      ch: G('teacherM', 'teacherF')
    }, {
      w: G('طَالِبٌ', 'طَالِبَةٌ'),
      ch: G('boy', 'girl')
    }, {
      w: G('زَمِيلٌ', 'زَمِيلَةٌ'),
      scene: 'friend'
    }, {
      w: 'دَفْتَرٌ',
      ic: 'notebook'
    }, {
      w: 'لَوْحٌ',
      ic: 'board'
    }, {
      w: 'أَدْرُسُ',
      ic: 'openbook'
    }, {
      w: 'أَكْتُبُ',
      ic: 'pen'
    }];
    U.lines = [{
      t: 'هَذَا صَفُّنَا.',
      key: 'صَفُّنَا',
      ic: 'school'
    }, {
      t: 'نَحْنُ فِي صَفٍّ وَاحِدٍ.',
      key: 'نَحْنُ',
      scene: 'we'
    }, {
      t: G('مُعَلِّمُنَا لَطِيفٌ.', 'مُعَلِّمَتُنَا لَطِيفَةٌ.'),
      key: G('مُعَلِّمُنَا', 'مُعَلِّمَتُنَا'),
      ch: G('teacherM', 'teacherF')
    }, {
      t: 'نَدْرُسُ، وَنَكْتُبُ، وَنَقْرَأُ.',
      key: 'نَدْرُسُ',
      ic: 'openbook'
    }, {
      t: 'نَكْتُبُ فِي الدَّفْتَرِ.',
      key: 'نَكْتُبُ',
      ic: 'notebook'
    }, {
      t: `${ZM} ${mt.w}.`,
      key: ZM,
      ch: mt.ch
    }, {
      t: 'نَحْنُ نُحِبُّ صَفَّنَا.',
      key: 'نُحِبُّ',
      ic: 'heart'
    }];
    U.other = {
      0: 'صَفُّكُمْ كَبِيرٌ!',
      2: 'وَمَاذَا تَفْعَلُونَ فِي الصَّفِّ؟',
      6: 'أَنَا أَيْضًا أُرِيدُ صَفًّا مِثْلَ صَفِّكُمْ!'
    };
    U.templates = ['هَذَا صَفُّنَا.', 'نَحْنُ …', 'نَدْرُسُ · نَكْتُبُ · نَقْرَأُ', 'نَحْنُ نُحِبُّ …'];
    U.tiles = [['نَحْنُ', 'فِي', 'صَفٍّ', 'وَاحِدٍ.'], ['نَحْنُ', 'نُحِبُّ', 'صَفَّنَا.']];
    U.rule = {
      title: 'نَحْنُ: «ـنَا» فِي آخِرِ الِاسْمِ، وَ«نَـ» فِي أَوَّلِ الْفِعْلِ',
      cols: ['أَنَا', 'نَحْنُ'],
      rows: [['صَفِّي', 'صَفُّنَا'], [G('مُعَلِّمِي', 'مُعَلِّمَتِي'), G('مُعَلِّمُنَا', 'مُعَلِّمَتُنَا')], ['أَكْتُبُ', 'نَكْتُبُ'], ['أَدْرُسُ', 'نَدْرُسُ'], ['أُحِبُّ', 'نُحِبُّ']],
      note: 'حِينَ أَتَكَلَّمُ عَنِّي وَعَنْ أَصْحَابِي أَقُولُ: نَحْنُ. الشَّيْءُ الَّذِي لَنَا يَنْتَهِي بِـ«ـنَا»: صَفُّنَا. وَالْفِعْلُ يَبْدَأُ بِـ«نَـ»: نَكْتُبُ.',
      quiz: [{
        scene: 'we',
        q: 'أَنَا وَأَصْحَابِي: … نَكْتُبُ.',
        opts: ['نَحْنُ', 'أَنَا'],
        ok: 'نَحْنُ'
      }, {
        ic: 'school',
        q: 'الصَّفُّ لَنَا: هَذَا …',
        opts: ['صَفُّنَا', 'صَفِّي'],
        ok: 'صَفُّنَا'
      }, {
        ic: 'notebook',
        q: 'نَحْنُ … فِي الدَّفْتَرِ.',
        opts: ['نَكْتُبُ', 'أَكْتُبُ'],
        ok: 'نَكْتُبُ'
      }, {
        ic: 'openbook',
        q: 'أَنَا … الْعَرَبِيَّةَ.',
        opts: ['أَدْرُسُ', 'نَدْرُسُ'],
        ok: 'أَدْرُسُ'
      }]
    };
    U.write = {
      words: [{
        word: 'صَفٌّ',
        letters: ['ص', 'ف']
      }, {
        word: 'نَحْنُ',
        letters: ['ن', 'ح', 'ن']
      }],
      newL: ['ص', 'ح'],
      sentence: 'نَحْنُ فِي صَفٍّ وَاحِدٍ.'
    };
    U.clinic = [{
      bad: 'نَحْنُ أَكْتُبُ.',
      good: 'نَحْنُ نَكْتُبُ.',
      why: 'نَحْنُ: نَكْتُبُ'
    }, {
      bad: 'أَنَا نُحِبُّ صَفِّي.',
      good: 'أَنَا أُحِبُّ صَفِّي.',
      why: 'أَنَا: أُحِبُّ'
    }, {
      bad: 'هَذَا صَفُّ نَحْنُ.',
      good: 'هَذَا صَفُّنَا.',
      why: 'الصَّفُّ لَنَا: صَفُّنَا'
    }];
    U.qa = [{
      q: 'مَاذَا تَفْعَلُونَ فِي الصَّفِّ؟',
      qc: 'تَفْعَلُونَ',
      a: 'نَدْرُسُ، وَنَكْتُبُ، وَنَقْرَأُ.',
      ac: 'نَدْرُسُ'
    }, {
      q: 'أَيْنَ تَكْتُبُونَ؟',
      qc: 'تَكْتُبُونَ',
      a: 'نَكْتُبُ فِي الدَّفْتَرِ.',
      ac: 'نَكْتُبُ'
    }, {
      q: G('مَنْ زَمِيلُكَ؟', 'مَنْ زَمِيلَتُكِ؟'),
      qc: G('زَمِيلُكَ', 'زَمِيلَتُكِ'),
      a: `${ZM} ${mt.w}.`,
      ac: ZM
    }, {
      q: 'هَلْ تُحِبُّونَ صَفَّكُمْ؟',
      qc: 'تُحِبُّونَ',
      a: 'نَعَمْ، نَحْنُ نُحِبُّ صَفَّنَا.',
      ac: 'نُحِبُّ'
    }];
    U.ask = {
      say: 'يَا جَدِّي، هَلْ تُحِبُّ الْمَدْرَسَةَ؟',
      reply: 'نَعَمْ، أُحِبُّ الْمَدْرَسَةَ، وَأُحِبُّ الْعِلْمَ.'
    };
    U.tower = [0, 1, 3, 6].map(i => U.lines[i]);
  }
  if (n === 13) {
    U.picks = [{
      k: 'game',
      q: G('بِمَاذَا تُحِبُّ أَنْ تَلْعَبَ؟', 'بِمَاذَا تُحِبِّينَ أَنْ تَلْعَبِي؟'),
      opts: [{
        v: 'ball',
        w: 'بِالْكُرَةِ',
        label: 'الْكُرَةُ',
        ic: 'ball'
      }, {
        v: 'rope',
        w: 'بِالْحَبْلِ',
        label: 'الْحَبْلُ',
        ic: 'rope'
      }, {
        v: 'doll',
        w: 'بِالدُّمْيَةِ',
        label: 'الدُّمْيَةُ',
        ic: 'teddy'
      }]
    }];
    const gm = P_('game');
    const FR = G('يَا صَدِيقِي', 'يَا صَدِيقَتِي');
    U.host = {
      name: G('صَدِيقِي', 'صَدِيقَتِي'),
      gen: G('صَدِيقِي', 'صَدِيقَتِي'),
      char: G(L1CH.zaid, L1CH.salma),
      at: [11, 19],
      intro: G(`جَاءَتِ الِاسْتِرَاحَةُ يَا ${NM}! أَنَا هُنَا فِي الْحَدِيقَةِ. اقْرَأْ، ثُمَّ ادْعُنِي إِلَى اللَّعِبِ.`, `جَاءَتِ الِاسْتِرَاحَةُ يَا ${NM}! أَنَا هُنَا فِي الْحَدِيقَةِ. اقْرَئِي، ثُمَّ ادْعِينِي إِلَى اللَّعِبِ.`),
      final: G('الْآنَ قُلْ كُلَّ مَا تَقُولُهُ فِي اللَّعِبِ مِنْ أَوَّلِهِ.', 'الْآنَ قُولِي كُلَّ مَا تَقُولِينَهُ فِي اللَّعِبِ مِنْ أَوَّلِهِ.')
    };
    U.vocab = [{
      w: 'كُرَةٌ',
      ic: 'ball'
    }, {
      w: 'حَبْلٌ',
      ic: 'rope'
    }, {
      w: 'دُمْيَةٌ',
      ic: 'teddy'
    }, {
      w: 'دَوْرٌ',
      scene: 'turn'
    }, {
      w: 'أَبْدَأُ',
      scene: 'start'
    }, {
      w: 'مَعًا',
      scene: 'we'
    }, {
      w: 'أَرْجِعُ',
      scene: 'back'
    }];
    U.lines = [{
      t: G(`تَعَالَ ${FR}!`, `تَعَالَيْ ${FR}!`),
      key: G('تَعَالَ', 'تَعَالَيْ'),
      scene: 'come'
    }, {
      t: `هَيَّا نَلْعَبْ ${gm.w}!`,
      key: 'نَلْعَبْ',
      ic: gm.ic
    }, {
      t: G('أَنَا أَبْدَأُ، ثُمَّ أَنْتَ.', 'أَنَا أَبْدَأُ، ثُمَّ أَنْتِ.'),
      key: 'أَبْدَأُ',
      scene: 'start'
    }, {
      t: 'هَذَا دَوْرِي.',
      key: 'دَوْرِي',
      scene: 'turn'
    }, {
      t: G('الْآنَ دَوْرُكَ.', 'الْآنَ دَوْرُكِ.'),
      key: G('دَوْرُكَ', 'دَوْرُكِ'),
      scene: 'turn2'
    }, {
      t: 'نَحْنُ نَلْعَبُ مَعًا.',
      key: 'مَعًا',
      scene: 'we'
    }, {
      t: 'هَيَّا نَرْجِعْ إِلَى الصَّفِّ.',
      key: 'نَرْجِعْ',
      scene: 'back'
    }];
    U.other = {
      0: 'نَعَمْ؟',
      1: 'هَيَّا! مَنْ يَبْدَأُ؟',
      3: G('أَحْسَنْتَ!', 'أَحْسَنْتِ!'),
      4: 'شُكْرًا!',
      6: 'هَيَّا!'
    };
    U.templates = [G('تَعَالَ …', 'تَعَالَيْ …'), 'هَيَّا نَـ…', 'أَنَا أَبْدَأُ، ثُمَّ …', 'دَوْرِي · ' + G('دَوْرُكَ', 'دَوْرُكِ')];
    U.tiles = [['هَيَّا', 'نَلْعَبْ', gm.w + '!'], ['الْآنَ', G('دَوْرُكَ.', 'دَوْرُكِ.')]];
    U.rule = {
      title: 'نَدْعُو صَاحِبَنَا: هَيَّا نَـ… · ' + G('دَوْرِي وَدَوْرُكَ', 'دَوْرِي وَدَوْرُكِ'),
      cols: ['أَنَا', 'أَدْعُو صَاحِبِي'],
      rows: [['أَلْعَبُ', 'هَيَّا نَلْعَبْ'], ['أَرْسُمُ', 'هَيَّا نَرْسُمْ'], ['أَقْرَأُ', 'هَيَّا نَقْرَأْ'], ['أَرْجِعُ', 'هَيَّا نَرْجِعْ']],
      note: G('حِينَ أَدْعُو صَاحِبِي أَقُولُ: تَعَالَ، أَوْ: هَيَّا. ثُمَّ الْفِعْلُ يَبْدَأُ بِـ«نَـ»، وَآخِرُهُ سَاكِنٌ: هَيَّا نَلْعَبْ. وَفِي اللَّعِبِ: هَذَا دَوْرِي، وَالْآنَ دَوْرُكَ.', 'حِينَ أَدْعُو صَاحِبَتِي أَقُولُ: تَعَالَيْ، أَوْ: هَيَّا. ثُمَّ الْفِعْلُ يَبْدَأُ بِـ«نَـ»، وَآخِرُهُ سَاكِنٌ: هَيَّا نَلْعَبْ. وَفِي اللَّعِبِ: هَذَا دَوْرِي، وَالْآنَ دَوْرُكِ.'),
      quiz: [{
        ic: 'ball',
        q: 'هَيَّا … بِالْكُرَةِ!',
        opts: ['نَلْعَبْ', 'أَلْعَبُ'],
        ok: 'نَلْعَبْ'
      }, {
        scene: 'turn',
        q: 'أَنَا أَلْعَبُ الْآنَ: هَذَا …',
        opts: ['دَوْرِي', G('دَوْرُكَ', 'دَوْرُكِ')],
        ok: 'دَوْرِي'
      }, {
        scene: 'turn2',
        q: G('صَاحِبِي يَلْعَبُ الْآنَ: هَذَا …', 'صَاحِبَتِي تَلْعَبُ الْآنَ: هَذَا …'),
        opts: [G('دَوْرُكَ', 'دَوْرُكِ'), 'دَوْرِي'],
        ok: G('دَوْرُكَ', 'دَوْرُكِ')
      }, {
        ic: 'palette',
        q: 'هَيَّا … !',
        opts: ['نَرْسُمْ', 'أَرْسُمُ'],
        ok: 'نَرْسُمْ'
      }]
    };
    U.write = {
      words: [{
        word: G('تَعَالَ', 'تَعَالَيْ'),
        letters: G(['ت', 'ع', 'ا', 'ل'], ['ت', 'ع', 'ا', 'ل', 'ي'])
      }, {
        word: 'دَوْرِي',
        letters: ['د', 'و', 'ر', 'ي']
      }],
      newL: ['ت', 'و'],
      sentence: G('تَعَالَ نَلْعَبْ.', 'تَعَالَيْ نَلْعَبْ.')
    };
    U.clinic = [{
      bad: 'هَيَّا أَلْعَبُ!',
      good: 'هَيَّا نَلْعَبْ!',
      why: 'أَدْعُو صَاحِبِي: نَلْعَبْ'
    }, {
      bad: G('أَنَا أَبْدَأُ، أَنْتَ.', 'أَنَا أَبْدَأُ، أَنْتِ.'),
      good: G('أَنَا أَبْدَأُ، ثُمَّ أَنْتَ.', 'أَنَا أَبْدَأُ، ثُمَّ أَنْتِ.'),
      why: 'كَلِمَةٌ نَاقِصَةٌ: ثُمَّ'
    }, {
      bad: 'هَيَّا نَلْعَبْ الْكُرَةِ.',
      good: 'هَيَّا نَلْعَبْ بِالْكُرَةِ.',
      why: 'كَلِمَةٌ نَاقِصَةٌ: بِـ'
    }];
    U.qa = [{
      q: 'بِمَاذَا تَلْعَبُونَ؟',
      qc: 'تَلْعَبُونَ',
      a: `نَلْعَبُ ${gm.w}.`,
      ac: 'نَلْعَبُ'
    }, {
      q: 'مَنْ يَبْدَأُ؟',
      qc: 'يَبْدَأُ',
      a: G('أَنَا أَبْدَأُ، ثُمَّ صَدِيقِي.', 'أَنَا أَبْدَأُ، ثُمَّ صَدِيقَتِي.'),
      ac: 'أَبْدَأُ'
    }, {
      q: 'هَلْ تُحِبُّونَ اللَّعِبَ مَعًا؟',
      qc: 'مَعًا',
      a: 'نَعَمْ، نَحْنُ نُحِبُّ اللَّعِبَ مَعًا.',
      ac: 'نُحِبُّ'
    }, {
      q: 'انْتَهَتِ الِاسْتِرَاحَةُ. مَاذَا تَقُولُونَ؟',
      qc: 'انْتَهَتِ',
      a: 'هَيَّا نَرْجِعْ إِلَى الصَّفِّ.',
      ac: 'نَرْجِعْ'
    }];
    U.ask = {
      say: 'يَا جَدِّي، هَيَّا نَلْعَبْ مَعًا!',
      reply: G('هَيَّا يَا حَبِيبِي! أَنْتَ تَبْدَأُ، ثُمَّ أَنَا.', 'هَيَّا يَا حَبِيبَتِي! أَنْتِ تَبْدَئِينَ، ثُمَّ أَنَا.')
    };
    U.tower = [0, 1, 2, 4].map(i => U.lines[i]);
  }
  if (n === 14) {
    U.picks = [{
      k: 'part',
      q: G('مَاذَا يُؤْلِمُكَ فِي الْحِكَايَةِ؟', 'مَاذَا يُؤْلِمُكِ فِي الْحِكَايَةِ؟'),
      opts: [{
        v: 'belly',
        w: 'بَطْنِي',
        label: 'الْبَطْنُ',
        scene: 'pBelly'
      }, {
        v: 'head',
        w: 'رَأْسِي',
        label: 'الرَّأْسُ',
        scene: 'pHead'
      }, {
        v: 'back',
        w: 'ظَهْرِي',
        label: 'الظَّهْرُ',
        scene: 'pBack'
      }]
    }];
    const pt = P_('part');
    const SICK = G('مَرِيضٌ', 'مَرِيضَةٌ');
    U.host = {
      name: 'أُمِّي',
      gen: 'أُمِّي',
      char: L1CH.mother,
      at: [6, 11],
      intro: G(`يَا ${NM}، أَنْتَ لَا تَلْعَبُ الْيَوْمَ! قُلْ لِي: مَا بِكَ؟ اقْرَأْ أَوَّلًا.`, `يَا ${NM}، أَنْتِ لَا تَلْعَبِينَ الْيَوْمَ! قُولِي لِي: مَا بِكِ؟ اقْرَئِي أَوَّلًا.`),
      final: G('الْآنَ قُلْ لِي وَلِلطَّبِيبِ كُلَّ شَيْءٍ مِنْ أَوَّلِهِ.', 'الْآنَ قُولِي لِي وَلِلطَّبِيبِ كُلَّ شَيْءٍ مِنْ أَوَّلِهِ.')
    };
    U.vocab = [{
      w: 'رَأْسٌ',
      scene: 'pHead'
    }, {
      w: 'بَطْنٌ',
      scene: 'pBelly'
    }, {
      w: 'ظَهْرٌ',
      scene: 'pBack'
    }, {
      w: 'يَدٌ',
      ic: 'hand'
    }, {
      w: G('مَرِيضٌ', 'مَرِيضَةٌ'),
      scene: 'sick'
    }, {
      w: 'طَبِيبٌ',
      ch: 'doctor'
    }, {
      w: 'دَوَاءٌ',
      ic: 'medicine'
    }];
    U.lines = [{
      t: `يَا أُمِّي، أَنَا ${SICK}.`,
      key: SICK,
      scene: 'sick'
    }, {
      t: `${pt.w} يُؤْلِمُنِي.`,
      key: 'يُؤْلِمُنِي',
      scene: pt.scene
    }, {
      t: 'السَّلَامُ عَلَيْكُمْ يَا طَبِيبُ.',
      key: 'طَبِيبُ',
      ch: 'doctor'
    }, {
      t: `${pt.w} يُؤْلِمُنِي كَثِيرًا.`,
      key: 'كَثِيرًا',
      scene: pt.scene
    }, {
      t: 'شُكْرًا يَا طَبِيبُ.',
      key: 'شُكْرًا',
      ic: 'medicine'
    }, {
      t: 'الْآنَ أَنَا بِخَيْرٍ، وَالْحَمْدُ لِلَّهِ.',
      key: 'بِخَيْرٍ',
      ic: 'star'
    }];
    U.other = {
      0: G('سَلَامَتُكَ يَا حَبِيبِي! مَاذَا يُؤْلِمُكَ؟', 'سَلَامَتُكِ يَا حَبِيبَتِي! مَاذَا يُؤْلِمُكِ؟'),
      1: G('تَعَالَ نَذْهَبْ إِلَى الطَّبِيبِ.', 'تَعَالَيْ نَذْهَبْ إِلَى الطَّبِيبِ.'),
      2: G('وَعَلَيْكُمُ السَّلَامُ. مَاذَا يُؤْلِمُكَ؟', 'وَعَلَيْكُمُ السَّلَامُ. مَاذَا يُؤْلِمُكِ؟'),
      3: G('لَا بَأْسَ. خُذْ هَذَا الدَّوَاءَ، وَنَمْ قَلِيلًا.', 'لَا بَأْسَ. خُذِي هَذَا الدَّوَاءَ، وَنَامِي قَلِيلًا.'),
      4: 'عَفْوًا. شَفَاكَ اللَّهُ.'
    };
    U.other[4] = G('عَفْوًا. شَفَاكَ اللَّهُ.', 'عَفْوًا. شَفَاكِ اللَّهُ.');
    U.templates = [`أَنَا ${SICK}.`, '… يُؤْلِمُنِي.', G('مَاذَا يُؤْلِمُكَ؟', 'مَاذَا يُؤْلِمُكِ؟'), 'الْآنَ أَنَا بِخَيْرٍ.'];
    U.tiles = [[pt.w, 'يُؤْلِمُنِي.'], ['الْآنَ', 'أَنَا', 'بِخَيْرٍ،', 'وَالْحَمْدُ', 'لِلَّهِ.']];
    U.rule = {
      title: G('«ـِي» مَعَ الِاسْمِ، وَ«ـنِي» مَعَ الْفِعْلِ: يُؤْلِمُنِي · يُؤْلِمُكَ', '«ـِي» مَعَ الِاسْمِ، وَ«ـنِي» مَعَ الْفِعْلِ: يُؤْلِمُنِي · يُؤْلِمُكِ'),
      cols: ['لِي أَنَا', G('لَكَ أَنْتَ', 'لَكِ أَنْتِ')],
      rows: G([['يُؤْلِمُنِي', 'يُؤْلِمُكَ'], ['بَطْنِي', 'بَطْنُكَ'], ['رَأْسِي', 'رَأْسُكَ'], ['ظَهْرِي', 'ظَهْرُكَ']], [['يُؤْلِمُنِي', 'يُؤْلِمُكِ'], ['بَطْنِي', 'بَطْنُكِ'], ['رَأْسِي', 'رَأْسُكِ'], ['ظَهْرِي', 'ظَهْرُكِ']]),
      note: G('مَعَ الِاسْمِ أَقُولُ «ـِي»: بَطْنِي. وَمَعَ الْفِعْلِ أَقُولُ «ـنِي»: يُؤْلِمُنِي. وَأَسْأَلُ صَاحِبِي بِـ«ـكَ»: مَاذَا يُؤْلِمُكَ؟', 'مَعَ الِاسْمِ أَقُولُ «ـِي»: بَطْنِي. وَمَعَ الْفِعْلِ أَقُولُ «ـنِي»: يُؤْلِمُنِي. وَأَسْأَلُ صَاحِبَتِي بِـ«ـكِ»: مَاذَا يُؤْلِمُكِ؟'),
      quiz: [{
        scene: 'pBelly',
        q: 'بَطْنِي …',
        opts: ['يُؤْلِمُنِي', G('يُؤْلِمُكَ', 'يُؤْلِمُكِ')],
        ok: 'يُؤْلِمُنِي'
      }, {
        ic: 'question',
        q: G('أَسْأَلُ صَدِيقِي: مَاذَا …؟', 'أَسْأَلُ صَدِيقَتِي: مَاذَا …؟'),
        opts: [G('يُؤْلِمُكَ', 'يُؤْلِمُكِ'), 'يُؤْلِمُنِي'],
        ok: G('يُؤْلِمُكَ', 'يُؤْلِمُكِ')
      }, {
        scene: 'sick',
        q: 'أَنَا …',
        opts: G(['مَرِيضٌ', 'مَرِيضَةٌ'], ['مَرِيضَةٌ', 'مَرِيضٌ']),
        ok: SICK
      }, {
        scene: 'pHead',
        q: 'الرَّأْسُ لِي: …',
        opts: ['رَأْسِي', G('رَأْسُكَ', 'رَأْسُكِ')],
        ok: 'رَأْسِي'
      }]
    };
    U.write = {
      words: [{
        word: 'بَطْنِي',
        letters: ['ب', 'ط', 'ن', 'ي']
      }, {
        word: 'مَرِيضٌ',
        letters: ['م', 'ر', 'ي', 'ض']
      }],
      newL: ['ط', 'ض'],
      sentence: `أَنَا ${SICK}.`
    };
    U.clinic = [{
      bad: `${pt.w} يُؤْلِمُكَ.`,
      good: `${pt.w} يُؤْلِمُنِي.`,
      why: 'الْأَلَمُ عِنْدِي أَنَا: يُؤْلِمُنِي'
    }, {
      bad: G('أَنَا مَرِيضَةٌ.', 'أَنَا مَرِيضٌ.'),
      good: `أَنَا ${SICK}.`,
      why: G('أَنَا وَلَدٌ: مَرِيضٌ', 'أَنَا بِنْتٌ: مَرِيضَةٌ')
    }, {
      bad: 'بَطْنٌ يُؤْلِمُنِي.',
      good: 'بَطْنِي يُؤْلِمُنِي.',
      why: 'الْبَطْنُ لِي: بَطْنِي'
    }];
    U.qa = [{
      q: G('مَا بِكَ يَا حَبِيبِي؟', 'مَا بِكِ يَا حَبِيبَتِي؟'),
      qc: G('بِكَ', 'بِكِ'),
      a: `أَنَا ${SICK} يَا جَدِّي.`,
      ac: SICK
    }, {
      q: G('مَاذَا يُؤْلِمُكَ؟', 'مَاذَا يُؤْلِمُكِ؟'),
      qc: G('يُؤْلِمُكَ', 'يُؤْلِمُكِ'),
      a: `${pt.w} يُؤْلِمُنِي.`,
      ac: 'يُؤْلِمُنِي'
    }, {
      q: 'إِلَى أَيْنَ تَذْهَبُونَ؟',
      qc: 'أَيْنَ',
      a: 'نَذْهَبُ إِلَى الطَّبِيبِ.',
      ac: 'نَذْهَبُ'
    }, {
      q: G('كَيْفَ حَالُكَ الْآنَ؟', 'كَيْفَ حَالُكِ الْآنَ؟'),
      qc: 'الْآنَ',
      a: 'الْآنَ أَنَا بِخَيْرٍ، وَالْحَمْدُ لِلَّهِ.',
      ac: 'بِخَيْرٍ'
    }];
    U.ask = {
      say: 'سَلَامَتُكَ يَا جَدِّي! هَلْ ظَهْرُكَ يُؤْلِمُكَ؟',
      reply: G('قَلِيلًا يَا حَبِيبِي. شُكْرًا لَكَ.', 'قَلِيلًا يَا حَبِيبَتِي. شُكْرًا لَكِ.')
    };
    U.tower = [0, 1, 3, 5].map(i => U.lines[i]);
  }
  if (n === 15) {
    U.picks = [{
      k: 'food',
      q: G('مَاذَا أَكَلْتَ عِنْدَ جَدِّكَ؟', 'مَاذَا أَكَلْتِ عِنْدَ جَدِّكِ؟'),
      opts: [{
        v: 'chicken',
        w: 'دَجَاجًا',
        label: 'دَجَاجٌ',
        ic: 'food'
      }, {
        v: 'apple',
        w: 'تُفَّاحًا',
        label: 'تُفَّاحٌ',
        ic: 'apple'
      }, {
        v: 'cake',
        w: 'كَعْكًا',
        label: 'كَعْكٌ',
        ic: 'cake'
      }]
    }, {
      k: 'drink',
      q: G('وَمَاذَا شَرِبْتَ؟', 'وَمَاذَا شَرِبْتِ؟'),
      opts: [{
        v: 'milk',
        w: 'حَلِيبًا',
        label: 'حَلِيبٌ',
        ic: 'milk'
      }, {
        v: 'juice',
        w: 'عَصِيرًا',
        label: 'عَصِيرٌ',
        ic: 'juice'
      }, {
        v: 'water',
        w: 'مَاءً',
        label: 'مَاءٌ',
        ic: 'water'
      }]
    }];
    const fd = P_('food'),
      dr = P_('drink');
    U.host = {
      name: G('الْمُعَلِّمُ', 'الْمُعَلِّمَةُ'),
      gen: G('الْمُعَلِّمِ', 'الْمُعَلِّمَةِ'),
      char: G(L1CH.teacherM, L1CH.teacherF),
      at: [36, 17],
      intro: G(`صَبَاحُ الْخَيْرِ يَا ${NM}! أَمْسِ كَانَ يَوْمَ عُطْلَةٍ. مَاذَا فَعَلْتَ؟ اقْرَأْ أَوَّلًا.`, `صَبَاحُ الْخَيْرِ يَا ${NM}! أَمْسِ كَانَ يَوْمَ عُطْلَةٍ. مَاذَا فَعَلْتِ؟ اقْرَئِي أَوَّلًا.`),
      final: G('الْآنَ احْكِ لِلصَّفِّ يَوْمَ أَمْسِ كُلَّهُ.', 'الْآنَ احْكِي لِلصَّفِّ يَوْمَ أَمْسِ كُلَّهُ.')
    };
    U.vocab = [{
      w: 'أَمْسِ',
      scene: 'yest'
    }, {
      w: 'الْيَوْمَ',
      scene: 'today'
    }, {
      w: 'جَدٌّ',
      ch: 'grandpa'
    }, {
      w: 'جَدَّةٌ',
      ch: 'grandma'
    }, {
      w: 'زُرْتُ',
      scene: 'visit'
    }, {
      w: 'عُطْلَةٌ',
      ic: 'sun'
    }, {
      w: 'رَجَعْتُ',
      scene: 'back'
    }];
    U.lines = [{
      t: 'أَمْسِ ذَهَبْتُ إِلَى بَيْتِ جَدِّي.',
      key: 'ذَهَبْتُ',
      scene: 'yest'
    }, {
      t: 'زُرْتُ جَدِّي وَجَدَّتِي.',
      key: 'زُرْتُ',
      scene: 'visit'
    }, {
      t: `أَكَلْتُ ${fd.w} مَعَ عَائِلَتِي.`,
      key: 'أَكَلْتُ',
      ic: fd.ic
    }, {
      t: `وَشَرِبْتُ ${dr.w}.`,
      key: 'شَرِبْتُ',
      ic: dr.ic
    }, {
      t: 'ثُمَّ لَعِبْتُ فِي الْحَدِيقَةِ.',
      key: 'لَعِبْتُ',
      ic: 'park'
    }, {
      t: 'فِي اللَّيْلِ رَجَعْتُ إِلَى الْبَيْتِ.',
      key: 'رَجَعْتُ',
      scene: 'back'
    }];
    U.other = {
      0: G('مَا شَاءَ اللَّهُ! وَمَاذَا فَعَلْتَ هُنَاكَ؟', 'مَا شَاءَ اللَّهُ! وَمَاذَا فَعَلْتِ هُنَاكَ؟'),
      3: 'صَحَّةً وَعَافِيَةً! وَبَعْدَ ذَلِكَ؟',
      5: G('مَا أَجْمَلَ يَوْمَكَ!', 'مَا أَجْمَلَ يَوْمَكِ!')
    };
    U.templates = ['أَمْسِ …ـتُ', 'ذَهَبْتُ إِلَى …', 'أَكَلْتُ … · شَرِبْتُ …', 'ثُمَّ …'];
    U.tiles = [['أَمْسِ', 'ذَهَبْتُ', 'إِلَى', 'بَيْتِ', 'جَدِّي.'], ['ثُمَّ', 'لَعِبْتُ', 'فِي', 'الْحَدِيقَةِ.']];
    U.rule = {
      title: 'أَمْسِ: «ـتُ» فِي آخِرِ الْفِعْلِ',
      cols: ['الْيَوْمَ', 'أَمْسِ'],
      rows: [['أَذْهَبُ', 'ذَهَبْتُ'], ['آكُلُ', 'أَكَلْتُ'], ['أَشْرَبُ', 'شَرِبْتُ'], ['أَلْعَبُ', 'لَعِبْتُ'], ['أَرْجِعُ', 'رَجَعْتُ']],
      note: G('الْيَوْمَ: يَبْدَأُ الْفِعْلُ بِـ«أَ»: أَذْهَبُ. أَمْسِ: يَنْتَهِي الْفِعْلُ بِـ«ـتُ»: ذَهَبْتُ. وَأَسْأَلُ صَدِيقِي بِـ«ـتَ»: مَاذَا فَعَلْتَ؟', 'الْيَوْمَ: يَبْدَأُ الْفِعْلُ بِـ«أَ»: أَذْهَبُ. أَمْسِ: يَنْتَهِي الْفِعْلُ بِـ«ـتُ»: ذَهَبْتُ. وَأَسْأَلُ صَدِيقَتِي بِـ«ـتِ»: مَاذَا فَعَلْتِ؟'),
      quiz: [{
        scene: 'yest',
        q: 'أَمْسِ … إِلَى بَيْتِ جَدِّي.',
        opts: ['ذَهَبْتُ', 'أَذْهَبُ'],
        ok: 'ذَهَبْتُ'
      }, {
        scene: 'today',
        q: 'الْيَوْمَ … خُبْزًا.',
        opts: ['آكُلُ', 'أَكَلْتُ'],
        ok: 'آكُلُ'
      }, {
        ic: 'juice',
        q: 'أَمْسِ … عَصِيرًا.',
        opts: ['شَرِبْتُ', 'أَشْرَبُ'],
        ok: 'شَرِبْتُ'
      }, {
        ic: 'park',
        q: 'أَمْسِ … فِي الْحَدِيقَةِ.',
        opts: ['لَعِبْتُ', 'أَلْعَبُ'],
        ok: 'لَعِبْتُ'
      }]
    };
    U.write = {
      words: [{
        word: 'شَرِبْتُ',
        letters: ['ش', 'ر', 'ب', 'ت']
      }, {
        word: 'جَدِّي',
        letters: ['ج', 'د', 'ي']
      }],
      newL: ['ش', 'ج'],
      sentence: 'زُرْتُ جَدِّي.'
    };
    U.clinic = [{
      bad: 'أَمْسِ أَذْهَبُ إِلَى بَيْتِ جَدِّي.',
      good: 'أَمْسِ ذَهَبْتُ إِلَى بَيْتِ جَدِّي.',
      why: 'أَمْسِ: ذَهَبْتُ'
    }, {
      bad: 'أَمْسِ أَشْرَبُ عَصِيرًا.',
      good: 'أَمْسِ شَرِبْتُ عَصِيرًا.',
      why: 'أَمْسِ: شَرِبْتُ'
    }, {
      bad: 'أَكَلْتُ، لَعِبْتُ.',
      good: 'أَكَلْتُ، ثُمَّ لَعِبْتُ.',
      why: 'كَلِمَةٌ نَاقِصَةٌ: ثُمَّ'
    }];
    U.qa = [{
      q: G('مَاذَا فَعَلْتَ أَمْسِ؟', 'مَاذَا فَعَلْتِ أَمْسِ؟'),
      qc: 'أَمْسِ',
      a: 'أَمْسِ ذَهَبْتُ إِلَى بَيْتِ جَدِّي.',
      ac: 'ذَهَبْتُ'
    }, {
      q: G('مَاذَا أَكَلْتَ؟', 'مَاذَا أَكَلْتِ؟'),
      qc: G('أَكَلْتَ', 'أَكَلْتِ'),
      a: `أَكَلْتُ ${fd.w}.`,
      ac: 'أَكَلْتُ'
    }, {
      q: G('وَمَاذَا شَرِبْتَ؟', 'وَمَاذَا شَرِبْتِ؟'),
      qc: G('شَرِبْتَ', 'شَرِبْتِ'),
      a: `شَرِبْتُ ${dr.w}.`,
      ac: 'شَرِبْتُ'
    }, {
      q: G('أَيْنَ لَعِبْتَ؟', 'أَيْنَ لَعِبْتِ؟'),
      qc: G('لَعِبْتَ', 'لَعِبْتِ'),
      a: 'لَعِبْتُ فِي الْحَدِيقَةِ.',
      ac: 'لَعِبْتُ'
    }];
    U.ask = {
      say: 'يَا جَدِّي، مَاذَا فَعَلْتَ أَمْسِ؟',
      reply: 'أَمْسِ صَلَّيْتُ فِي الْمَسْجِدِ، ثُمَّ قَرَأْتُ الْقُرْآنَ.'
    };
    U.tower = [0, 1, 2, 4].map(i => U.lines[i]);
  }
  if (n === 16) {
    U.picks = [{
      k: 'vis',
      q: G('مَنْ سَتَزُورُ فِي الْعِيدِ؟', 'مَنْ سَتَزُورِينَ فِي الْعِيدِ؟'),
      opts: [{
        v: 'gp',
        w: 'جَدِّي',
        label: 'جَدِّي',
        ch: 'grandpa'
      }, {
        v: 'gm',
        w: 'جَدَّتِي',
        label: 'جَدَّتِي',
        ch: 'grandma'
      }, {
        v: 'uncle',
        w: 'عَمِّي',
        label: 'عَمِّي',
        ch: 'father'
      }]
    }];
    const vs = P_('vis');
    const CL = G('ثَوْبًا', 'فُسْتَانًا'),
      CLm = G('ثَوْبِي', 'فُسْتَانِي');
    U.host = {
      name: 'أَبِي',
      gen: 'أَبِي',
      char: L1CH.father,
      at: [6, 11],
      intro: G(`يَا ${NM}، رَأَيْنَا الْهِلَالَ: غَدًا الْعِيدُ! مَاذَا سَتَفْعَلُ غَدًا؟ اقْرَأْ أَوَّلًا.`, `يَا ${NM}، رَأَيْنَا الْهِلَالَ: غَدًا الْعِيدُ! مَاذَا سَتَفْعَلِينَ غَدًا؟ اقْرَئِي أَوَّلًا.`),
      final: G('الْآنَ قُلْ لِي كُلَّ مَا سَتَفْعَلُهُ غَدًا.', 'الْآنَ قُولِي لِي كُلَّ مَا سَتَفْعَلِينَهُ غَدًا.')
    };
    U.vocab = [{
      w: 'غَدًا',
      scene: 'tmrw'
    }, {
      w: 'عِيدٌ',
      scene: 'eid'
    }, {
      w: G('ثَوْبٌ', 'فُسْتَانٌ'),
      ic: G('shirt', 'dress')
    }, {
      w: 'جَدِيدٌ',
      scene: 'new'
    }, {
      w: 'نَظِيفٌ',
      scene: 'clean'
    }, {
      w: 'هَدِيَّةٌ',
      ic: 'gift'
    }, {
      w: 'صَلَاةٌ',
      scene: 'pray'
    }];
    U.lines = [{
      t: 'غَدًا الْعِيدُ!',
      key: 'الْعِيدُ',
      scene: 'eid'
    }, {
      t: 'سَأَسْتَيْقِظُ فِي الصَّبَاحِ.',
      key: 'سَأَسْتَيْقِظُ',
      scene: 'wake'
    }, {
      t: `سَأَلْبَسُ ${CL} جَدِيدًا.`,
      key: 'سَأَلْبَسُ',
      ic: G('shirt', 'dress')
    }, {
      t: `${CLm} جَدِيدٌ وَنَظِيفٌ.`,
      key: 'نَظِيفٌ',
      scene: 'clean'
    }, {
      t: 'سَأُصَلِّي صَلَاةَ الْعِيدِ.',
      key: 'سَأُصَلِّي',
      scene: 'pray'
    }, {
      t: `ثُمَّ سَأَزُورُ ${vs.w}.`,
      key: 'سَأَزُورُ',
      ch: vs.ch
    }, {
      t: 'وَسَأَقُولُ: عِيدٌ مُبَارَكٌ!',
      key: 'مُبَارَكٌ',
      scene: 'greet'
    }];
    U.other = {
      0: G('نَعَمْ يَا حَبِيبِي! مَاذَا سَتَفْعَلُ غَدًا؟', 'نَعَمْ يَا حَبِيبَتِي! مَاذَا سَتَفْعَلِينَ غَدًا؟'),
      3: 'مَا شَاءَ اللَّهُ!',
      6: G('عِيدٌ مُبَارَكٌ عَلَيْكَ يَا حَبِيبِي!', 'عِيدٌ مُبَارَكٌ عَلَيْكِ يَا حَبِيبَتِي!')
    };
    U.templates = ['غَدًا …', 'سَأَـ…', 'سَأُصَلِّي · سَأَلْبَسُ · سَأَزُورُ', 'عِيدٌ مُبَارَكٌ!'];
    U.tiles = [['سَأُصَلِّي', 'صَلَاةَ', 'الْعِيدِ.'], ['ثُمَّ', 'سَأَزُورُ', vs.w + '.']];
    U.rule = {
      title: 'غَدًا: «سَـ» قَبْلَ الْفِعْلِ',
      cols: ['الْيَوْمَ', 'غَدًا'],
      rows: [['أَلْبَسُ', 'سَأَلْبَسُ'], ['أُصَلِّي', 'سَأُصَلِّي'], ['أَزُورُ', 'سَأَزُورُ'], ['أَلْعَبُ', 'سَأَلْعَبُ']],
      note: 'أَمْسِ: ذَهَبْتُ. الْيَوْمَ: أَذْهَبُ. غَدًا: سَأَذْهَبُ. نَضَعُ «سَـ» قَبْلَ الْفِعْلِ، فَيَصِيرُ لِغَدٍ.',
      quiz: [{
        scene: 'tmrw',
        q: 'غَدًا … جَدِّي.',
        opts: ['سَأَزُورُ', 'زُرْتُ'],
        ok: 'سَأَزُورُ'
      }, {
        scene: 'yest',
        q: 'أَمْسِ … جَدِّي.',
        opts: ['زُرْتُ', 'سَأَزُورُ'],
        ok: 'زُرْتُ'
      }, {
        ic: G('shirt', 'dress'),
        q: `غَدًا … ${CL} جَدِيدًا.`,
        opts: ['سَأَلْبَسُ', 'لَبِسْتُ'],
        ok: 'سَأَلْبَسُ'
      }, {
        ic: 'sun',
        q: 'أَمْسِ، الْيَوْمَ، …',
        opts: ['غَدًا', 'أَمْسِ'],
        ok: 'غَدًا'
      }]
    };
    U.write = {
      words: [{
        word: 'غَدًا',
        letters: ['غ', 'د', 'ا']
      }, {
        word: 'نَظِيفٌ',
        letters: ['ن', 'ظ', 'ي', 'ف']
      }],
      newL: ['غ', 'ظ'],
      sentence: 'غَدًا الْعِيدُ.'
    };
    U.clinic = [{
      bad: 'غَدًا زُرْتُ جَدِّي.',
      good: 'غَدًا سَأَزُورُ جَدِّي.',
      why: 'غَدًا: سَأَزُورُ'
    }, {
      bad: 'أَمْسِ سَأَلْعَبُ.',
      good: 'أَمْسِ لَعِبْتُ.',
      why: 'أَمْسِ: لَعِبْتُ'
    }, {
      bad: 'سَأُصَلِّي، سَأَزُورُ جَدِّي.',
      good: 'سَأُصَلِّي، ثُمَّ سَأَزُورُ جَدِّي.',
      why: 'كَلِمَةٌ نَاقِصَةٌ: ثُمَّ'
    }];
    U.qa = [{
      q: G('مَاذَا سَتَفْعَلُ غَدًا؟', 'مَاذَا سَتَفْعَلِينَ غَدًا؟'),
      qc: 'غَدًا',
      a: 'سَأُصَلِّي صَلَاةَ الْعِيدِ.',
      ac: 'سَأُصَلِّي'
    }, {
      q: G('مَاذَا سَتَلْبَسُ؟', 'مَاذَا سَتَلْبَسِينَ؟'),
      qc: G('سَتَلْبَسُ', 'سَتَلْبَسِينَ'),
      a: `سَأَلْبَسُ ${CL} جَدِيدًا.`,
      ac: 'سَأَلْبَسُ'
    }, {
      q: G('مَنْ سَتَزُورُ؟', 'مَنْ سَتَزُورِينَ؟'),
      qc: G('سَتَزُورُ', 'سَتَزُورِينَ'),
      a: `سَأَزُورُ ${vs.w}.`,
      ac: 'سَأَزُورُ'
    }, {
      q: G('مَاذَا تَقُولُ فِي الْعِيدِ؟', 'مَاذَا تَقُولِينَ فِي الْعِيدِ؟'),
      qc: 'الْعِيدِ',
      a: 'أَقُولُ: عِيدٌ مُبَارَكٌ!',
      ac: 'مُبَارَكٌ'
    }];
    U.ask = {
      say: 'يَا جَدِّي، عِيدٌ مُبَارَكٌ!',
      reply: G('عِيدٌ مُبَارَكٌ عَلَيْكَ يَا حَبِيبِي! هَذِهِ هَدِيَّتُكَ.', 'عِيدٌ مُبَارَكٌ عَلَيْكِ يَا حَبِيبَتِي! هَذِهِ هَدِيَّتُكِ.')
    };
    U.tower = [0, 2, 4, 5].map(i => U.lines[i]);
  }
  if (!U.tower) U.tower = U.lines.slice(0, Math.min(4, U.lines.length));
  if (U.write && !U.write.words) U.write.words = [{
    word: U.write.word,
    letters: U.write.letters
  }];
  if (U.write && !U.write.word) {
    U.write.word = U.write.words.map(w => w.word).join(' · ');
    U.write.letters = [].concat(...U.write.words.map(w => w.letters));
  }
  U.npcs = {
    host: {
      ...U.host
    },
    tower: {
      name: 'الْبَنَّاءُ',
      gen: 'الْبَنَّاءِ',
      char: L1CH.builder,
      at: [45, 31],
      intro: G('تَعَالَ نَبْنِ بُرْجًا! قُلْ جُمْلَةً صَحِيحَةً، فَتَصِيرَ طَابِقًا. وَحِينَ يَكْتَمِلُ الْبُرْجُ، قُلِ الْحِكَايَةَ كُلَّهَا.', 'تَعَالَيْ نَبْنِ بُرْجًا! قُولِي جُمْلَةً صَحِيحَةً، فَتَصِيرَ طَابِقًا. وَحِينَ يَكْتَمِلُ الْبُرْجُ، قُولِي الْحِكَايَةَ كُلَّهَا.')
    },
    vocab: {
      name: 'بَائِعُ الصُّوَرِ',
      gen: 'بَائِعِ الصُّوَرِ',
      char: L1CH.seller,
      at: [32, 10],
      intro: G(`أَهْلًا يَا ${NM}! عِنْدِي صُوَرُ كَلِمَاتِ الْمَدِينَةِ. انْظُرْ، وَاسْمَعْ، ثُمَّ الْعَبْ.`, `أَهْلًا يَا ${NM}! عِنْدِي صُوَرُ كَلِمَاتِ الْمَدِينَةِ. انْظُرِي، وَاسْمَعِي، ثُمَّ الْعَبِي.`)
    },
    rule: {
      name: 'صَانِعُ الْجُمَلِ',
      gen: 'صَانِعِ الْجُمَلِ',
      char: L1CH.maker,
      at: [47, 10],
      intro: G('هُنَا نَصْنَعُ الْجُمَلَ. رَتِّبِ الْكَلِمَاتِ، وَاعْرِفِ الْقَاعِدَةَ.', 'هُنَا نَصْنَعُ الْجُمَلَ. رَتِّبِي الْكَلِمَاتِ، وَاعْرِفِي الْقَاعِدَةَ.')
    },
    hide: {
      name: G('زَيْد', 'سَلْمَى'),
      gen: G('زَيْد', 'سَلْمَى'),
      char: G(L1CH.zaid, L1CH.salma),
      at: [18, 22],
      intro: G('تَعَالَ نَلْعَبْ! أُخْفِي كَلِمَاتٍ، وَأَنْتَ تَجِدُهَا.', 'تَعَالَيْ نَلْعَبْ! أُخْفِي كَلِمَاتٍ، وَأَنْتِ تَجِدِينَهَا.')
    },
    write: {
      name: 'الْخَطَّاطُ',
      gen: 'الْخَطَّاطِ',
      char: L1CH.scribe,
      at: [39, 10],
      intro: G('أَهْلًا! هُنَا نَتَعَلَّمُ الْحُرُوفَ: كَيْفَ تَتَّصِلُ، وَكَيْفَ تَنْفَصِلُ. الْمُعَلِّمُ يَكْتُبُ عَلَى اللَّوْحِ، وَأَنْتَ تَكْتُبُ عَلَى وَرَقَتِكَ.', 'أَهْلًا! هُنَا نَتَعَلَّمُ الْحُرُوفَ: كَيْفَ تَتَّصِلُ، وَكَيْفَ تَنْفَصِلُ. الْمُعَلِّمُ يَكْتُبُ عَلَى اللَّوْحِ، وَأَنْتِ تَكْتُبِينَ عَلَى وَرَقَتِكِ.')
    },
    clinic: {
      name: 'طَبِيبَةُ الدِّقَّةِ',
      gen: 'طَبِيبَةِ الدِّقَّةِ',
      char: L1CH.nurse,
      at: [31, 23],
      intro: G('هُنَا عِيَادَةُ الدِّقَّةِ. عِنْدِي جُمَلٌ مَرِيضَةٌ، فِيهَا خَطَأٌ صَغِيرٌ. سَاعِدْنِي!', 'هُنَا عِيَادَةُ الدِّقَّةِ. عِنْدِي جُمَلٌ مَرِيضَةٌ، فِيهَا خَطَأٌ صَغِيرٌ. سَاعِدِينِي!')
    },
    qa: {
      name: 'جَدِّي',
      gen: 'جَدِّي',
      char: L1CH.grandpa,
      at: [13, 24],
      intro: G(`تَعَالَ يَا ${NM}! أَسْأَلُكَ، وَأَنْتَ تُجِيبُ. ثُمَّ اسْأَلْنِي أَنْتَ.`, `تَعَالَيْ يَا ${NM}! أَسْأَلُكِ، وَأَنْتِ تُجِيبِينَ. ثُمَّ اسْأَلِينِي أَنْتِ.`)
    }
  };
  return U;
}
function CueText({
  text,
  cue
}) {
  const cueBare = stripMarks(cue || '').replace(/^ال/, '');
  const parts = tokenize(text);
  return React.createElement("span", {
    className: "tt"
  }, parts.map((p, i) => {
    const inner = p.t.split(/(\s+)/).map((w, j) => {
      if (/^\s+$/.test(w) || !w) return React.createElement("span", {
        key: j
      }, w);
      const m = w.match(PUNCT_RE);
      const core = m ? m[2] : w;
      const isCue = cue && stripMarks(core).replace(/^ال/, '') === cueBare;
      const el = p.me ? React.createElement("span", {
        className: "w t-me"
      }, w) : React.createElement(Word, {
        w: w
      });
      return isCue ? React.createElement("span", {
        key: j,
        className: "cue"
      }, el) : React.createElement("span", {
        key: j
      }, el);
    });
    return p.slot ? React.createElement("span", {
      key: i,
      className: "slot"
    }, inner) : React.createElement("span", {
      key: i
    }, inner);
  }));
}
const plain = t => String(t).replace(/[⟦⟧*]/g, '');
function L1Scene({
  name,
  s = 6
}) {
  const frames = L1_SCENES[name] || [];
  const [f, setF] = useState(0);
  useEffect(() => {
    if (frames.length < 2) return;
    const id = setInterval(() => setF(x => (x + 1) % frames.length), 650);
    return () => clearInterval(id);
  }, [name]);
  const W = 22 * s,
    H = 15 * s;
  return React.createElement("span", {
    className: "scene",
    style: {
      width: W,
      height: H
    }
  }, (frames[f] || []).map((o, k) => {
    const el = o.ch ? React.createElement(CharImg, {
      def: L1CH[o.ch] || L1CH.boy,
      s: s * .55,
      style: {
        transform: o.flip ? 'scaleX(-1)' : 'none'
      }
    }) : React.createElement(Icon, {
      n: o.ic,
      s: s * (o.s || .6) * 1.15
    });
    return React.createElement("span", {
      key: k,
      className: "sc-o",
      style: {
        left: o.x * 100 + '%',
        top: o.y * 100 + '%'
      }
    }, el);
  }));
}
function VView({
  v,
  s = 6
}) {
  if (v.scene) return React.createElement(L1Scene, {
    name: v.scene,
    s: s
  });
  if (v.ch) return React.createElement(CharImg, {
    def: L1CH[v.ch],
    s: s * .75
  });
  if (v.view === 'near') return React.createElement("span", {
    className: "vcomp"
  }, React.createElement(CharImg, {
    def: G(L1CH.boy, L1CH.girl),
    s: s * .5
  }), React.createElement(Icon, {
    n: "house",
    s: s * .8
  }));
  if (v.view === 'far') return React.createElement("span", {
    className: "vcomp"
  }, React.createElement(CharImg, {
    def: G(L1CH.boy, L1CH.girl),
    s: s * .5
  }), React.createElement("span", {
    className: "dots"
  }, "\xB7 \xB7 \xB7 \xB7 \xB7"), React.createElement(Icon, {
    n: "house",
    s: s * .35
  }));
  if (v.view === 'on') return React.createElement("span", {
    className: "vstack"
  }, React.createElement(Icon, {
    n: "ball",
    s: s * .5
  }), React.createElement(Icon, {
    n: "desk",
    s: s * .8
  }));
  if (v.view === 'under') return React.createElement("span", {
    className: "vstack"
  }, React.createElement(Icon, {
    n: "desk",
    s: s * .8
  }), React.createElement(Icon, {
    n: "ball",
    s: s * .5
  }));
  if (v.ic) return React.createElement(Icon, {
    n: v.ic,
    s: s
  });
  return null;
}
function L1Dots({
  n,
  i
}) {
  return React.createElement("div", {
    className: "row center",
    style: {
      gap: 4
    }
  }, Array.from({
    length: n
  }).map((_, k) => React.createElement("span", {
    key: k,
    style: {
      width: 12,
      height: 12,
      borderRadius: 2,
      background: k < i ? 'var(--acc)' : k === i ? 'var(--acc2)' : 'var(--line)'
    }
  })));
}
function SpeakBtn({
  text,
  label
}) {
  return React.createElement("button", {
    className: "btn ghost sm",
    onClick: () => speak(plain(text))
  }, React.createElement(Icon, {
    n: "speaker",
    s: 2.5
  }), label !== false && React.createElement("span", {
    className: "naskh"
  }, label || G('اسْمَعْ', 'اسْمَعِي')));
}
function L1Say({
  line,
  onDone,
  note
}) {
  return React.createElement("div", {
    className: "col center fade",
    style: {
      gap: 12
    }
  }, React.createElement("span", {
    className: "pill naskh"
  }, G('قُلْهَا بِصَوْتٍ عَالٍ', 'قُولِيهَا بِصَوْتٍ عَالٍ')), React.createElement("div", {
    className: "say-line sm"
  }, React.createElement(TT, {
    text: line
  })), note && React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 18
    }
  }, note), React.createElement("div", {
    className: "row wrapf center",
    style: {
      gap: 10
    }
  }, React.createElement("button", {
    className: "btn lg",
    onClick: () => {
      sfx.win();
      onDone();
    }
  }, "\u2713 \u0642\u064F\u0644\u0652\u062A\u064F\u0647\u064E\u0627"), React.createElement(SpeakBtn, {
    text: line
  })));
}
function L1Bar({
  onGrade
}) {
  return React.createElement("div", {
    className: "tbar"
  }, React.createElement("span", {
    className: "lbl"
  }, "\u0631\u064E\u0623\u0652\u064A\u064F \u0627\u0644\u0652\u0645\u064F\u0639\u064E\u0644\u0650\u0651\u0645\u0650:"), React.createElement("button", {
    className: "tb g",
    onClick: () => onGrade('full')
  }, "\u2713 \u0641\u064F\u0635\u0652\u062D\u064E\u0649 \u0643\u064E\u0627\u0645\u0650\u0644\u064E\u0629\u064C"), React.createElement("button", {
    className: "tb w",
    onClick: () => onGrade('switch')
  }, "\u21C4 \u062A\u064E\u0628\u0652\u062F\u0650\u064A\u0644\u064F \u0644\u064E\u0647\u0652\u062C\u064E\u0629\u064D"), React.createElement("button", {
    className: "tb p",
    onClick: () => onGrade('pause')
  }, "\u2026 \u062A\u064E\u0648\u064E\u0642\u064F\u0651\u0641\u064C \u0648\u064E\u0628\u064E\u062D\u0652\u062B\u064C"));
}
function DoneBox({
  msg,
  onDone,
  label
}) {
  return React.createElement("div", {
    className: "col center fade",
    style: {
      gap: 10
    }
  }, React.createElement(Icon, {
    n: "star",
    s: 6
  }), React.createElement("div", {
    className: "h2 naskh"
  }, msg || G('أَحْسَنْتَ!', 'أَحْسَنْتِ!')), React.createElement("button", {
    className: "btn lg",
    onClick: onDone
  }, label || 'انْطَلِقْ'));
}
function VocabSt({
  U,
  onDone
}) {
  const [stage, setStage] = useState('cards');
  const [seen, setSeen] = useState([]);
  const order = useMemo(() => L1_SHUF(U.vocab.map((_, i) => i)), [U.n]);
  const [i, setI] = useState(0);
  const [bad, setBad] = useState(null);
  const opts = useMemo(() => {
    if (i >= order.length) return [];
    const k = order[i],
      others = L1_SHUF(U.vocab.map((_, j) => j).filter(j => j !== k)).slice(0, 2);
    return L1_SHUF([k, ...others]);
  }, [i]);
  useEffect(() => {
    if (stage === 'game' && i < order.length) speak(U.vocab[order[i]].w);
  }, [stage, i]);
  if (stage === 'cards') return React.createElement("div", {
    className: "col",
    style: {
      gap: 12
    }
  }, React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 19
    }
  }, G('انْقُرْ كُلَّ صُورَةٍ، وَاسْمَعْ كَلِمَتَهَا، وَقُلْهَا.', 'انْقُرِي كُلَّ صُورَةٍ، وَاسْمَعِي كَلِمَتَهَا، وَقُولِيهَا.')), React.createElement("div", {
    className: "vgrid"
  }, U.vocab.map((v, k) => React.createElement("button", {
    key: k,
    className: 'vcard' + (seen.includes(k) ? ' on' : ''),
    onClick: () => {
      speak(v.w);
      setSeen(s => s.includes(k) ? s : [...s, k]);
    }
  }, React.createElement(VView, {
    v: v,
    s: 6
  }), React.createElement("span", {
    className: "vw"
  }, v.w)))), React.createElement("div", {
    className: "row center"
  }, React.createElement("button", {
    className: "btn lg",
    disabled: seen.length < U.vocab.length,
    onClick: () => setStage('game')
  }, seen.length < U.vocab.length ? `${L1_AR(seen.length)} / ${L1_AR(U.vocab.length)}` : G('الْعَبْ الْآنَ', 'الْعَبِي الْآنَ'))));
  if (i >= order.length) return React.createElement(DoneBox, {
    msg: G('عَرَفْتَ كُلَّ الْكَلِمَاتِ!', 'عَرَفْتِ كُلَّ الْكَلِمَاتِ!'),
    onDone: onDone
  });
  const v = U.vocab[order[i]];
  return React.createElement("div", {
    className: "col center",
    style: {
      gap: 12
    }
  }, React.createElement(L1Dots, {
    n: order.length,
    i: i
  }), React.createElement("div", {
    className: "row center",
    style: {
      gap: 10
    }
  }, React.createElement("div", {
    className: "bigword naskh"
  }, v.w), React.createElement(SpeakBtn, {
    text: v.w,
    label: false
  })), React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 19
    }
  }, G('أَيْنَ صُورَتُهَا؟ انْقُرْهَا.', 'أَيْنَ صُورَتُهَا؟ انْقُرِيهَا.')), React.createElement("div", {
    className: "opts"
  }, opts.map(k => React.createElement("button", {
    key: k,
    className: 'opt' + (bad === k ? ' shake' : ''),
    onClick: () => {
      if (k === order[i]) {
        sfx.ok();
        setI(i + 1);
      } else {
        sfx.bad();
        setBad(k);
        setTimeout(() => setBad(null), 400);
      }
    }
  }, React.createElement(VView, {
    v: U.vocab[k],
    s: 6
  })))));
}
function PickPanel({
  U,
  picks,
  setPick,
  onDone
}) {
  const ready = U.picks.every(p => picks && picks[p.k]);
  return React.createElement("div", {
    className: "col",
    style: {
      gap: 14
    }
  }, U.picks.map(p => React.createElement("div", {
    key: p.k,
    className: "col",
    style: {
      gap: 6
    }
  }, React.createElement("b", {
    className: "naskh",
    style: {
      fontSize: 21
    }
  }, p.q), React.createElement("div", {
    className: "row wrapf",
    style: {
      gap: 8
    }
  }, p.opts.map(o => React.createElement("button", {
    key: o.v,
    className: 'chip pickchip' + (picks && picks[p.k] === o.v ? ' on' : ''),
    onClick: () => {
      sfx.pop();
      setPick(p.k, o.v);
    }
  }, (o.ic || o.ch) && React.createElement(VView, {
    v: o,
    s: 3
  }), React.createElement("span", {
    className: "naskh",
    style: {
      fontSize: 20
    }
  }, o.label)))))), React.createElement("div", {
    className: "row center"
  }, React.createElement("button", {
    className: "btn lg",
    disabled: !ready,
    onClick: onDone
  }, G('ابْدَأِ الْقِرَاءَةَ', 'ابْدَئِي الْقِرَاءَةَ'))));
}
function ReadSt({
  U,
  picks,
  setPick,
  onDone
}) {
  const needPick = U.picks.length > 0;
  const [stage, setStage] = useState(needPick ? 'pick' : 'read');
  const [i, setI] = useState(0);
  useEffect(() => {
    if (stage === 'read' && i < U.lines.length) setTimeout(() => speak(plain(U.lines[i].t)), 250);
  }, [stage, i]);
  if (stage === 'pick') return React.createElement(PickPanel, {
    U: U,
    picks: picks,
    setPick: setPick,
    onDone: () => setStage('read')
  });
  if (i >= U.lines.length) return React.createElement("div", {
    className: "col",
    style: {
      gap: 10
    }
  }, React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 19
    }
  }, G('الْآنَ اقْرَأِ النَّصَّ كُلَّهُ وَحْدَكَ.', 'الْآنَ اقْرَئِي النَّصَّ كُلَّهُ وَحْدَكِ.')), React.createElement("div", {
    className: "readbox"
  }, U.lines.map((l, k) => React.createElement(React.Fragment, {
    key: k
  }, React.createElement("div", {
    className: "rline"
  }, React.createElement(VView, {
    v: l,
    s: 2.6
  }), React.createElement(TT, {
    text: l.t
  })), U.other && U.other[k] && React.createElement("div", {
    className: "rline oth"
  }, React.createElement(CharImg, {
    def: U.host.char,
    s: 1.6
  }), React.createElement(TT, {
    text: U.other[k]
  }))))), React.createElement("div", {
    className: "row center",
    style: {
      gap: 10
    }
  }, React.createElement(SpeakBtn, {
    text: U.lines.map(l => l.t).join(' ')
  }), React.createElement("button", {
    className: "btn lg",
    onClick: () => {
      sfx.win();
      onDone();
    }
  }, "\u2713 \u0642\u064E\u0631\u064E\u0623\u0652\u062A\u064F \u0627\u0644\u0646\u064E\u0651\u0635\u064E\u0651")));
  const l = U.lines[i];
  const oth = U.other && U.other[i];
  return React.createElement("div", {
    className: "col center",
    style: {
      gap: 14
    }
  }, React.createElement(L1Dots, {
    n: U.lines.length,
    i: i
  }), React.createElement("div", {
    className: "steps naskh"
  }, React.createElement("span", {
    className: "on"
  }, "\u0661. ", G('اسْمَعْ', 'اسْمَعِي')), React.createElement("span", null, "\u2190"), React.createElement("span", {
    className: "on"
  }, "\u0662. ", G('اقْرَأْ مِثْلَهُ', 'اقْرَئِي مِثْلَهُ'))), U.other && i > 0 && U.other[i - 1] && React.createElement("div", {
    className: "row center",
    style: {
      gap: 8,
      alignItems: 'flex-end'
    }
  }, React.createElement(CharImg, {
    def: U.host.char,
    s: 2.6
  }), React.createElement("div", {
    className: "bub them",
    style: {
      maxWidth: 520
    }
  }, React.createElement("div", {
    className: "who naskh"
  }, U.host.name), React.createElement(TT, {
    text: U.other[i - 1]
  }))), React.createElement(VView, {
    v: l,
    s: 7
  }), React.createElement("div", {
    className: "say-line"
  }, React.createElement(TT, {
    text: l.t
  })), React.createElement("div", {
    className: "row wrapf center",
    style: {
      gap: 10
    }
  }, React.createElement(SpeakBtn, {
    text: l.t,
    label: G('اسْمَعْ مَرَّةً أُخْرَى', 'اسْمَعِي مَرَّةً أُخْرَى')
  }), React.createElement("button", {
    className: "btn lg",
    onClick: () => {
      sfx.ok();
      setI(i + 1);
    }
  }, "\u2713 \u0642\u064E\u0631\u064E\u0623\u0652\u062A\u064F\u0647\u064E\u0627 \u0645\u0650\u062B\u0652\u0644\u064E\u0647\u064F")), React.createElement("div", {
    className: "naskh small",
    style: {
      opacity: .8
    }
  }, G('انْقُرْ أَيَّ كَلِمَةٍ لِتَسْمَعَهَا.', 'انْقُرِي أَيَّ كَلِمَةٍ لِتَسْمَعِيهَا.')));
}
function Tiles({
  items,
  onDone
}) {
  const [r, setR] = useState(0);
  const [got, setGot] = useState([]);
  const [bad, setBad] = useState(null);
  const [say, setSay] = useState(false);
  const pool = useMemo(() => r < items.length ? L1_SHUF(items[r].map((w, i) => ({
    w,
    i
  }))) : [], [r]);
  if (r >= items.length) {
    setTimeout(onDone, 0);
    return null;
  }
  const words = items[r];
  if (say) return React.createElement(L1Say, {
    line: words.join(' '),
    onDone: () => {
      setSay(false);
      setGot([]);
      setR(r + 1);
    }
  });
  const pick = p => {
    if (got.includes(p.i)) return;
    if (p.i === got.length) {
      sfx.pop();
      const n = [...got, p.i];
      setGot(n);
      if (n.length === words.length) setTimeout(() => setSay(true), 450);
    } else {
      sfx.bad();
      setBad(p.i);
      setTimeout(() => setBad(null), 400);
    }
  };
  return React.createElement("div", {
    className: "col center",
    style: {
      gap: 12
    }
  }, React.createElement(L1Dots, {
    n: items.length,
    i: r
  }), React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 19
    }
  }, G('رَتِّبِ الْكَلِمَاتِ لِتَصِيرَ جُمْلَةً.', 'رَتِّبِي الْكَلِمَاتِ لِتَصِيرَ جُمْلَةً.')), React.createElement("div", {
    className: "slotrow"
  }, got.map(i => React.createElement("span", {
    key: i,
    className: "cuechip pop"
  }, words[i]))), React.createElement("div", {
    className: "row wrapf center",
    style: {
      gap: 8
    }
  }, pool.map(p => React.createElement("button", {
    key: p.i,
    className: 'tile' + (got.includes(p.i) ? ' used' : '') + (bad === p.i ? ' shake' : ''),
    onClick: () => pick(p)
  }, p.w))));
}
function RuleSt({
  U,
  onDone
}) {
  const [stage, setStage] = useState('tpl');
  const [q, setQ] = useState(0);
  const [bad, setBad] = useState(null);
  const [say, setSay] = useState(null);
  const R = U.rule;
  if (stage === 'tpl') return React.createElement("div", {
    className: "col",
    style: {
      gap: 12
    }
  }, React.createElement("div", {
    className: "tplcard"
  }, React.createElement("div", {
    className: "ttl naskh"
  }, "\u0642\u064E\u0648\u064E\u0627\u0644\u0650\u0628\u064F \u0627\u0644\u0652\u0645\u064E\u062F\u0650\u064A\u0646\u064E\u0629\u0650"), React.createElement("div", {
    className: "row wrapf",
    style: {
      gap: 8
    }
  }, U.templates.map((t, k) => React.createElement("span", {
    key: k,
    className: "tplchip"
  }, t)))), React.createElement(Tiles, {
    items: U.tiles,
    onDone: () => setStage('rule')
  }));
  if (stage === 'rule') return React.createElement("div", {
    className: "col",
    style: {
      gap: 12
    }
  }, React.createElement("div", {
    className: "rulecard"
  }, React.createElement("div", {
    className: "ttl naskh"
  }, "\u0627\u0644\u0652\u0642\u064E\u0627\u0639\u0650\u062F\u064E\u0629\u064F: ", R.title), React.createElement("table", {
    className: "rtable"
  }, React.createElement("thead", null, React.createElement("tr", null, R.cols.map(c => React.createElement("th", {
    key: c
  }, c)))), React.createElement("tbody", null, R.rows.map((r, k) => React.createElement("tr", {
    key: k,
    onClick: () => speak(r.join(' '))
  }, r.map((c, j) => React.createElement("td", {
    key: j
  }, c)))))), React.createElement("div", {
    className: "naskh rnote"
  }, R.note)), React.createElement("div", {
    className: "row center",
    style: {
      gap: 10
    }
  }, React.createElement(SpeakBtn, {
    text: R.note
  }), React.createElement("button", {
    className: "btn lg",
    onClick: () => setStage('quiz')
  }, G('فَهِمْتُ، اخْتَبِرْنِي', 'فَهِمْتُ، اخْتَبِرِينِي'))));
  if (q >= R.quiz.length) return React.createElement(DoneBox, {
    msg: G('عَرَفْتَ الْقَاعِدَةَ!', 'عَرَفْتِ الْقَاعِدَةَ!'),
    onDone: onDone
  });
  const it = R.quiz[q];
  if (say) return React.createElement(L1Say, {
    line: say,
    onDone: () => {
      setSay(null);
      setQ(q + 1);
    }
  });
  return React.createElement("div", {
    className: "col center",
    style: {
      gap: 12
    }
  }, React.createElement(L1Dots, {
    n: R.quiz.length,
    i: q
  }), React.createElement(VView, {
    v: it,
    s: 6
  }), React.createElement("div", {
    className: "say-line sm naskh"
  }, it.q), React.createElement("div", {
    className: "opts"
  }, it.opts.map((o, k) => React.createElement("button", {
    key: k,
    className: 'opt textopt' + (bad === k ? ' shake' : ''),
    onClick: () => {
      if (o === it.ok) {
        sfx.ok();
        setSay(it.q.includes('←') ? o : it.q.includes('…') ? it.q.replace('…', o) : o);
      } else {
        sfx.bad();
        setBad(k);
        setTimeout(() => setBad(null), 400);
      }
    }
  }, React.createElement("span", {
    className: "naskh",
    style: {
      fontSize: 24
    }
  }, o)))));
}
const BLANK = '＿＿＿';
function hideKey(t, key) {
  const i = t.indexOf(key);
  return i < 0 ? t : t.slice(0, i) + BLANK + t.slice(i + key.length);
}
function hideMost(t) {
  const words = plain(t).split(' ');
  return words.map((w, i) => i === 0 ? w : w.replace(/[^\s.،؟!:]+/, '…')).join(' ');
}
function HideSt({
  U,
  onDone
}) {
  const lines = U.lines.filter(l => l.key);
  const [lvl, setLvl] = useState('A');
  const [i, setI] = useState(0);
  const [bad, setBad] = useState(null);
  const [say, setSay] = useState(false);
  const [show, setShow] = useState(false);
  const opts = useMemo(() => {
    if (lvl !== 'A' || i >= lines.length) return [];
    const k = lines[i].key,
      others = L1_SHUF([...new Set(lines.map(l => l.key).filter(x => stripMarks(x) !== stripMarks(k)))]).slice(0, 2);
    return L1_SHUF([k, ...others]);
  }, [lvl, i]);
  if (lvl === 'A') {
    if (i >= lines.length) return React.createElement("div", {
      className: "col center",
      style: {
        gap: 10
      }
    }, React.createElement(Icon, {
      n: "star",
      s: 6
    }), React.createElement("div", {
      className: "h2 naskh"
    }, G('الْآنَ أُخْفِي كَلِمَاتٍ أَكْثَرَ!', 'الْآنَ أُخْفِي كَلِمَاتٍ أَكْثَرَ!')), React.createElement("button", {
      className: "btn lg",
      onClick: () => {
        setLvl('B');
        setI(0);
      }
    }, G('هَيَّا', 'هَيَّا')));
    const l = lines[i];
    if (say) return React.createElement(L1Say, {
      line: l.t,
      onDone: () => {
        setSay(false);
        setI(i + 1);
      }
    });
    return React.createElement("div", {
      className: "col center",
      style: {
        gap: 12
      }
    }, React.createElement("span", {
      className: "pill naskh"
    }, "\u0627\u0644\u0652\u0645\u064E\u0631\u0652\u062D\u064E\u0644\u064E\u0629\u064F \u0661: \u0643\u064E\u0644\u0650\u0645\u064E\u0629\u064C \u0645\u064E\u062E\u0652\u0641\u0650\u064A\u064E\u0651\u0629\u064C"), React.createElement(L1Dots, {
      n: lines.length,
      i: i
    }), React.createElement(VView, {
      v: l,
      s: 6
    }), React.createElement("div", {
      className: "say-line"
    }, React.createElement(TT, {
      text: hideKey(l.t, l.key)
    })), React.createElement("div", {
      className: "naskh",
      style: {
        fontSize: 19
      }
    }, G('مَا الْكَلِمَةُ الْمَخْفِيَّةُ؟', 'مَا الْكَلِمَةُ الْمَخْفِيَّةُ؟')), React.createElement("div", {
      className: "opts"
    }, opts.map((o, k) => React.createElement("button", {
      key: k,
      className: 'opt textopt' + (bad === k ? ' shake' : ''),
      onClick: () => {
        if (o === l.key) {
          sfx.ok();
          setSay(true);
        } else {
          sfx.bad();
          setBad(k);
          setTimeout(() => setBad(null), 400);
        }
      }
    }, React.createElement("span", {
      className: "naskh",
      style: {
        fontSize: 24
      }
    }, o)))));
  }
  if (i >= U.lines.length) return React.createElement(DoneBox, {
    msg: G('قَرَأْتَ بِالْقَرَائِنِ!', 'قَرَأْتِ بِالْقَرَائِنِ!'),
    onDone: onDone
  });
  const l = U.lines[i];
  return React.createElement("div", {
    className: "col center",
    style: {
      gap: 12
    }
  }, React.createElement("span", {
    className: "pill naskh"
  }, "\u0627\u0644\u0652\u0645\u064E\u0631\u0652\u062D\u064E\u0644\u064E\u0629\u064F \u0662: \u0642\u064E\u0631\u064E\u0627\u0626\u0650\u0646\u064F \u0642\u064E\u0644\u0650\u064A\u0644\u064E\u0629\u064C"), React.createElement(L1Dots, {
    n: U.lines.length,
    i: i
  }), React.createElement(VView, {
    v: l,
    s: 7
  }), React.createElement("div", {
    className: "say-line"
  }, show ? React.createElement(TT, {
    text: l.t
  }) : React.createElement("span", {
    className: "naskh hid"
  }, hideMost(l.t))), React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 19
    }
  }, G('انْظُرْ إِلَى الصُّورَةِ وَالْكَلِمَةِ الْأُولَى، وَقُلِ الْجُمْلَةَ كُلَّهَا.', 'انْظُرِي إِلَى الصُّورَةِ وَالْكَلِمَةِ الْأُولَى، وَقُولِي الْجُمْلَةَ كُلَّهَا.')), !show ? React.createElement("button", {
    className: "btn ghost",
    onClick: () => {
      setShow(true);
      speak(plain(l.t));
    }
  }, "\u0642\u064F\u0644\u0652\u062A\u064F\u0647\u064E\u0627\u2026 \u0623\u064E\u0638\u0652\u0647\u0650\u0631\u0650 \u0627\u0644\u0652\u062C\u064F\u0645\u0652\u0644\u064E\u0629\u064E") : React.createElement("button", {
    className: "btn lg",
    onClick: () => {
      sfx.ok();
      setShow(false);
      setI(i + 1);
    }
  }, "\u2713 \u0642\u064F\u0644\u0652\u062A\u064F\u0647\u064E\u0627 \u0635\u064E\u062D\u0650\u064A\u062D\u064E\u0629\u064B"));
}
const BOARD_INK = '#1e3a8a',
  BOARD_TIP = '#e2483d';
function paintBoardBg(x, w, h) {
  x.fillStyle = '#fffdf5';
  x.fillRect(0, 0, w, h);
  x.strokeStyle = '#cfe0f5';
  x.lineWidth = 2;
  x.beginPath();
  x.moveTo(12, h * .72);
  x.lineTo(w - 12, h * .72);
  x.stroke();
  x.setLineDash([6, 8]);
  x.strokeStyle = '#e3ecf8';
  x.lineWidth = 1.5;
  x.beginPath();
  x.moveTo(12, h * .36);
  x.lineTo(w - 12, h * .36);
  x.stroke();
  x.setLineDash([]);
}
function fitGuideFont(x, text, w, h) {
  let fs = Math.floor(h * .55);
  for (; fs > 18; fs -= 2) {
    x.font = `${fs}px 'Noto Naskh Arabic', serif`;
    if (x.measureText(text).width <= w * .9) break;
  }
  return fs;
}
function TeacherBoard({
  guide,
  height = 220,
  doneLabel,
  kidLine,
  onDone
}) {
  const ref = useRef(null);
  const [phase, setPhase] = useState('teacher');
  const [showG, setShowG] = useState(true);
  const [speed, setSpeed] = useState('slow');
  const [count, setCount] = useState(0);
  const strokes = useRef([]),
    cur = useRef(null),
    anim = useRef(0),
    t0 = useRef(0);
  const dims = () => {
    const c = ref.current;
    return [c.clientWidth || 300, height];
  };
  const lw = () => Math.max(4, Math.min(12, height * (guide.length <= 2 ? .055 : .035)));
  const setup = () => {
    const c = ref.current;
    if (!c) return null;
    const dpr = window.devicePixelRatio || 1,
      [w, h] = dims();
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const x = c.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.lineCap = 'round';
    x.lineJoin = 'round';
    return [x, w, h];
  };
  const drawStroke = (x, s, w, h, upto) => {
    const n = upto == null ? s.length : upto;
    if (n < 1) return;
    x.strokeStyle = BOARD_INK;
    x.lineWidth = lw();
    x.beginPath();
    x.moveTo(s[0].x * w, s[0].y * h);
    for (let i = 1; i < n; i++) x.lineTo(s[i].x * w, s[i].y * h);
    if (n === 1) x.lineTo(s[0].x * w + .1, s[0].y * h);
    x.stroke();
  };
  const startMark = (x, s, k, w, h) => {
    const px = s[0].x * w,
      py = s[0].y * h,
      r = 11;
    x.fillStyle = BOARD_TIP;
    x.beginPath();
    x.arc(px, py - r - 6, r, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = '#fff';
    x.font = `bold 14px 'Baloo Bhaijaan 2', sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText('١٢٣٤٥٦٧٨٩'[k] || String(k + 1), px, py - r - 5);
  };
  const paintTeacher = () => {
    const r = setup();
    if (!r) return;
    const [x, w, h] = r;
    paintBoardBg(x, w, h);
    if (showG && guide) {
      const fs = fitGuideFont(x, guide, w, h);
      x.font = `${fs}px 'Noto Naskh Arabic', serif`;
      x.fillStyle = 'rgba(42,29,36,.15)';
      x.textAlign = 'center';
      x.textBaseline = 'alphabetic';
      x.direction = 'rtl';
      x.fillText(guide, w / 2, h * .72);
    }
    strokes.current.forEach(s => drawStroke(x, s, w, h));
  };
  const stopAnim = () => {
    if (anim.current) cancelAnimationFrame(anim.current);
    anim.current = 0;
  };
  const replay = () => {
    stopAnim();
    const S = strokes.current;
    if (!S.length) return;
    const k = speed === 'slow' ? 2.2 : 1,
      GAP = 450 * k;
    const plan = [];
    let at = 300;
    S.forEach(s => {
      const d = Math.max(120, s[s.length - 1].t - s[0].t) * k;
      plan.push({
        s,
        start: at,
        d
      });
      at += d + GAP;
    });
    const total = at;
    const begin = performance.now();
    const frame = now => {
      const r = setup();
      if (!r) return;
      const [x, w, h] = r;
      const el = now - begin;
      paintBoardBg(x, w, h);
      let tip = null;
      plan.forEach((p, i) => {
        if (el < p.start) return;
        const s = p.s,
          local = Math.min(p.d, el - p.start),
          tt = s[0].t + local / k;
        let n = 1;
        while (n < s.length && s[n].t <= tt) n++;
        drawStroke(x, s, w, h, n);
        startMark(x, s, i, w, h);
        if (el < p.start + p.d) tip = s[n - 1];
      });
      if (tip) {
        x.fillStyle = BOARD_TIP;
        x.beginPath();
        x.arc(tip.x * w, tip.y * h, lw() * .9 + 3, 0, Math.PI * 2);
        x.fill();
      }
      if (el < total) anim.current = requestAnimationFrame(frame);else anim.current = 0;
    };
    anim.current = requestAnimationFrame(frame);
  };
  useEffect(() => {
    if (phase === 'teacher') paintTeacher();
  }, [guide, showG, phase]);
  useEffect(() => {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
      if (phase === 'teacher') paintTeacher();
    });
    const ro = new ResizeObserver(() => {
      if (phase === 'teacher') paintTeacher();
    });
    if (ref.current) ro.observe(ref.current);
    return () => {
      ro.disconnect();
      stopAnim();
    };
  }, [phase]);
  useEffect(() => {
    if (phase === 'replay') {
      replay();
      try {
        ref.current.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      } catch (e) {}
    }
  }, [phase, speed]);
  const pos = e => {
    const r = ref.current.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width,
      y: (e.clientY - r.top) / r.height,
      t: performance.now() - t0.current
    };
  };
  const down = e => {
    if (phase !== 'teacher') return;
    e.preventDefault();
    if (!strokes.current.length) t0.current = performance.now();
    cur.current = [pos(e)];
    try {
      ref.current.setPointerCapture(e.pointerId);
    } catch (er) {}
  };
  const move = e => {
    if (!cur.current) return;
    e.preventDefault();
    const p = pos(e),
      s = cur.current,
      r = setup();
    if (!r) return;
    const [x, w, h] = r;
    s.push(p);
    x.strokeStyle = BOARD_INK;
    x.lineWidth = lw();
    x.beginPath();
    x.moveTo(s[s.length - 2].x * w, s[s.length - 2].y * h);
    x.lineTo(p.x * w, p.y * h);
    x.stroke();
  };
  const up = () => {
    if (!cur.current) return;
    strokes.current.push(cur.current);
    cur.current = null;
    setCount(strokes.current.length);
  };
  const clear = () => {
    stopAnim();
    strokes.current = [];
    setCount(0);
    paintTeacher();
  };
  const backToTeacher = () => {
    stopAnim();
    strokes.current = [];
    setCount(0);
    setPhase('teacher');
  };
  return React.createElement("div", {
    className: "col",
    style: {
      gap: 8,
      width: '100%'
    }
  }, React.createElement("div", {
    className: "row between wrapf",
    style: {
      gap: 8
    }
  }, React.createElement("span", {
    className: 'boardtag ' + (phase === 'teacher' ? 't' : 's')
  }, phase === 'teacher' ? 'لَوْحُ الْمُعَلِّمِ: يَكْتُبُ الْمُعَلِّمُ هُنَا' : G('يَنْظُرُ الطَّالِبُ إِلَى الْقَلَمِ', 'تَنْظُرُ الطَّالِبَةُ إِلَى الْقَلَمِ')), phase === 'replay' && React.createElement("div", {
    className: "row",
    style: {
      gap: 4
    }
  }, [['slow', 'بَطِيءٌ'], ['normal', 'عَادِيٌّ']].map(([k, t]) => React.createElement("button", {
    key: k,
    className: 'chip sm' + (speed === k ? ' on' : ''),
    onClick: () => setSpeed(k)
  }, t)))), React.createElement("canvas", {
    ref: ref,
    className: 'pad board' + (phase === 'replay' ? ' replay' : ''),
    style: {
      height
    },
    onPointerDown: down,
    onPointerMove: move,
    onPointerUp: up,
    onPointerLeave: up,
    onPointerCancel: up
  }), phase === 'teacher' ? React.createElement("div", {
    className: "row wrapf center",
    style: {
      gap: 8
    }
  }, React.createElement("button", {
    className: "btn ghost sm",
    onClick: clear
  }, "\u0627\u0645\u0652\u0633\u064E\u062D\u0652"), React.createElement("button", {
    className: "btn ghost sm",
    onClick: () => setShowG(!showG)
  }, showG ? 'أَخْفِ الْمِثَالَ' : 'أَظْهِرِ الْمِثَالَ'), React.createElement("button", {
    className: "btn lg",
    disabled: !count,
    onClick: () => setPhase('replay')
  }, "\u25B6 \u0623\u064E\u0639\u0650\u062F\u0650 \u0627\u0644\u0652\u0645\u064E\u0633\u064E\u0627\u0631\u064E \u0644\u0650\u0644\u0637\u064E\u0651\u0627\u0644\u0650\u0628\u0650")) : React.createElement("div", {
    className: "col",
    style: {
      gap: 10
    }
  }, kidLine && React.createElement("div", {
    className: "kidline naskh"
  }, kidLine), React.createElement("div", {
    className: "row wrapf center",
    style: {
      gap: 8
    }
  }, React.createElement("button", {
    className: "btn ghost sm",
    onClick: backToTeacher
  }, "\u0627\u0643\u0652\u062A\u064F\u0628\u0652 \u0645\u0650\u0646\u0652 \u062C\u064E\u062F\u0650\u064A\u062F\u064D"), React.createElement("button", {
    className: "btn ghost",
    onClick: replay
  }, "\u25B6 \u0645\u064E\u0631\u064E\u0651\u0629\u064B \u0623\u064F\u062E\u0652\u0631\u064E\u0649"), React.createElement("button", {
    className: "btn lg",
    onClick: () => {
      stopAnim();
      sfx.ok();
      onDone();
    }
  }, doneLabel))));
}
function TowerSt({
  U,
  onDone
}) {
  const T = U.tower;
  const [built, setBuilt] = useState(0);
  const [phase, setPhase] = useState('build');
  const [msg, setMsg] = useState('');
  const [shake, setShake] = useState(false);
  const hideText = phase === 'narr' || phase === 'done';
  const tower = /*#__PURE__*/React.createElement("div", {
    className: "r3tower"
  }, phase === 'done' && /*#__PURE__*/React.createElement("div", {
    className: "r3flag"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "flag",
    s: 4
  })), T.slice(0, built).map((l, k) => ({
    l,
    k
  })).reverse().map(({
    l,
    k
  }, j) => /*#__PURE__*/React.createElement("div", {
    key: k,
    className: 'r3floor' + (j === 0 && phase === 'build' ? ' drop' : '')
  }, /*#__PURE__*/React.createElement("span", {
    className: "lnum"
  }, L1_AR(k + 1)), /*#__PURE__*/React.createElement(VView, {
    v: l,
    s: 1.8
  }), hideText ? /*#__PURE__*/React.createElement("span", {
    className: "naskh"
  }, "· · · · ·") : /*#__PURE__*/React.createElement("span", {
    className: "naskh"
  }, plain(l.t)))), /*#__PURE__*/React.createElement("div", {
    className: "r3ground"
  }));
  const bad = g => {
    sfx.bad();
    if (g === 'switch') {
      setShake(true);
      setTimeout(() => setShake(false), 450);
      setMsg(G('جَاءَتْ كَلِمَةٌ عَامِّيَّةٌ. قُلْهَا مَرَّةً أُخْرَى بِالْفُصْحَى.', 'جَاءَتْ كَلِمَةٌ عَامِّيَّةٌ. قُولِيهَا مَرَّةً أُخْرَى بِالْفُصْحَى.'));
    } else setMsg(G('خُذْ نَفَسًا، وَانْظُرْ إِلَى الصُّورَةِ، ثُمَّ قُلْ مَرَّةً أُخْرَى.', 'خُذِي نَفَسًا، وَانْظُرِي إِلَى الصُّورَةِ، ثُمَّ قُولِي مَرَّةً أُخْرَى.'));
  };
  if (phase === 'build') {
    const l = T[built];
    return /*#__PURE__*/React.createElement("div", {
      className: "r3wrap"
    }, /*#__PURE__*/React.createElement("div", {
      className: "col center",
      style: {
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "naskh",
      style: {
        fontSize: 19,
        textAlign: 'center'
      }
    }, G('انْظُرْ إِلَى الصُّورَةِ، وَقُلِ الْجُمْلَةَ بِصَوْتٍ عَالٍ. إِنْ قُلْتَهَا صَحِيحَةً، صَارَتْ طَابِقًا فِي الْبُرْجِ.', 'انْظُرِي إِلَى الصُّورَةِ، وَقُولِي الْجُمْلَةَ بِصَوْتٍ عَالٍ. إِنْ قُلْتِهَا صَحِيحَةً، صَارَتْ طَابِقًا فِي الْبُرْجِ.')), /*#__PURE__*/React.createElement(L1Dots, {
      n: T.length,
      i: built
    }), /*#__PURE__*/React.createElement("div", {
      className: 'r3block' + (shake ? ' shake' : ''),
      key: built
    }, /*#__PURE__*/React.createElement(VView, {
      v: l,
      s: 4
    }), /*#__PURE__*/React.createElement("div", {
      className: "naskh",
      style: {
        fontSize: 17,
        opacity: .8
      }
    }, "الْكَلِمَةُ الَّتِي تُسَاعِدُ:"), /*#__PURE__*/React.createElement("span", {
      className: "cue naskh",
      style: {
        fontSize: 28
      }
    }, plain(l.key || ''))), /*#__PURE__*/React.createElement(SpeakBtn, {
      text: l.t,
      label: G('اسْمَعِ الْجُمْلَةَ', 'اسْمَعِي الْجُمْلَةَ')
    }), /*#__PURE__*/React.createElement(L1Bar, {
      onGrade: g => {
        if (g === 'full') {
          sfx.ok();
          setMsg('');
          const nb = built + 1;
          setBuilt(nb);
          if (nb >= T.length) setPhase('whole');
        } else bad(g);
      }
    }), msg && /*#__PURE__*/React.createElement("div", {
      className: "warnline"
    }, msg)), tower);
  }
  if (phase === 'whole' || phase === 'narr') return /*#__PURE__*/React.createElement("div", {
    className: "r3wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col center",
    style: {
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill naskh"
  }, phase === 'whole' ? G('اكْتَمَلَ الْبُرْجُ!', 'اكْتَمَلَ الْبُرْجُ!') : 'السَّرْدُ الْوَاحِدُ'), /*#__PURE__*/React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 19,
      textAlign: 'center'
    }
  }, phase === 'whole' ? G('قُلِ الطَّوَابِقَ كُلَّهَا، وَاحِدًا بَعْدَ وَاحِدٍ، مِنَ الْأَسْفَلِ إِلَى الْأَعْلَى.', 'قُولِي الطَّوَابِقَ كُلَّهَا، وَاحِدًا بَعْدَ وَاحِدٍ، مِنَ الْأَسْفَلِ إِلَى الْأَعْلَى.') : G('اخْتَفَتِ الْكَلِمَاتُ، وَبَقِيَتِ الصُّوَرُ. قُلِ الْحِكَايَةَ كُلَّهَا مُتَّصِلَةً، بِلَا تَوَقُّفٍ.', 'اخْتَفَتِ الْكَلِمَاتُ، وَبَقِيَتِ الصُّوَرُ. قُولِي الْحِكَايَةَ كُلَّهَا مُتَّصِلَةً، بِلَا تَوَقُّفٍ.')), /*#__PURE__*/React.createElement(L1Bar, {
    onGrade: g => {
      if (g === 'full') {
        sfx.win();
        setMsg('');
        setPhase(phase === 'whole' ? 'narr' : 'done');
      } else bad(g);
    }
  }), msg && /*#__PURE__*/React.createElement("div", {
    className: "warnline"
  }, msg)), tower);
  return /*#__PURE__*/React.createElement("div", {
    className: "r3wrap"
  }, /*#__PURE__*/React.createElement(DoneBox, {
    msg: G('بَنَيْتَ الْبُرْجَ، وَقُلْتَ الْحِكَايَةَ كُلَّهَا!', 'بَنَيْتِ الْبُرْجَ، وَقُلْتِ الْحِكَايَةَ كُلَّهَا!'),
    onDone: onDone
  }), tower);
}
function WriteSt({
  U,
  onDone
}) {
  const W = U.write;
  const words = W.words;
  const uq = a => [...new Set(a)];
  const teachOf = i => {
    const before = new Set([].concat(...words.slice(0, i).map(w => w.letters)));
    return uq(words[i].letters).filter(ch => (!W.newL || W.newL.includes(ch)) && !before.has(ch));
  };
  const first = i => teachOf(i).length ? 'letters' : 'join';
  const [wi, setWi] = useState(0);
  const [stage, setStage] = useState(() => first(0));
  const [li, setLi] = useState(0);
  const [got, setGot] = useState(0);
  const [tick, setTick] = useState([]);
  const [round, setRound] = useState(0);
  const [msg, setMsg] = useState('');
  const cw = words[wi];
  const teach = teachOf(wi);
  const known = uq(cw.letters).filter(ch => !teach.includes(ch));
  const forms = l1WordForms(cw.letters);
  const paper3 = G('انْظُرْ إِلَى الْقَلَمِ: مِنْ أَيْنَ يَبْدَأُ، وَإِلَى أَيْنَ يَذْهَبُ. ثُمَّ اكْتُبْ عَلَى وَرَقَتِكَ ثَلَاثَ مَرَّاتٍ.', 'انْظُرِي إِلَى الْقَلَمِ: مِنْ أَيْنَ يَبْدَأُ، وَإِلَى أَيْنَ يَذْهَبُ. ثُمَّ اكْتُبِي عَلَى وَرَقَتِكِ ثَلَاثَ مَرَّاتٍ.');
  const nextWord = () => {
    if (wi + 1 < words.length) {
      setWi(wi + 1);
      setLi(0);
      setGot(0);
      setStage(first(wi + 1));
    } else setStage('sentence');
  };
  const skip = stage === 'letters' || stage === 'join' ? /*#__PURE__*/React.createElement("button", {
    className: "btn ghost sm skipbtn",
    onClick: () => setStage('word')
  }, G('يَعْرِفُ الْحُرُوفَ: إِلَى الْكَلِمَةِ مُبَاشَرَةً', 'تَعْرِفُ الْحُرُوفَ: إِلَى الْكَلِمَةِ مُبَاشَرَةً')) : null;
  const steps = [['letters', 'الْحُرُوفُ'], ['join', 'الْوَصْلُ'], ['word', 'الْكَلِمَةُ'], ['sentence', 'الْجُمْلَةُ']];
  const head = /*#__PURE__*/React.createElement("div", {
    className: "row wrapf between",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "steps naskh"
  }, steps.map(([k, t], i) => /*#__PURE__*/React.createElement("span", {
    key: k,
    className: stage === k || k === 'sentence' && stage === 'check' ? 'on' : ''
  }, L1_AR(i + 1), ". ", t))), words.length > 1 && stage !== 'sentence' && stage !== 'check' && /*#__PURE__*/React.createElement("span", {
    className: "pill naskh"
  }, "الْكَلِمَةُ ", L1_AR(wi + 1), " مِنْ ", L1_AR(words.length)), skip);
  const paperNote = /*#__PURE__*/React.createElement("div", {
    className: "papernote naskh"
  }, G('جَهِّزْ وَرَقَتَكَ وَقَلَمَكَ. الْمُعَلِّمُ يَكْتُبُ عَلَى اللَّوْحِ، وَأَنْتَ تَكْتُبُ عَلَى الْوَرَقَةِ.', 'جَهِّزِي وَرَقَتَكِ وَقَلَمَكِ. الْمُعَلِّمُ يَكْتُبُ عَلَى اللَّوْحِ، وَأَنْتِ تَكْتُبِينَ عَلَى الْوَرَقَةِ.'));
  if (stage === 'letters') {
    const ch = teach[li],
      L = L1_LET[ch];
    const fs = L.c ? ['iso', 'ini', 'med', 'fin'] : ['iso', 'fin'];
    return /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        gap: 12
      }
    }, head, li === 0 && wi === 0 && paperNote, /*#__PURE__*/React.createElement("div", {
      className: "naskh",
      style: {
        fontSize: 19
      }
    }, W.newL ? 'حَرْفٌ جَدِيدٌ فِي كَلِمَةِ «' : 'حُرُوفُ كَلِمَةِ «', cw.word, "»: ", teach.map((c, k) => /*#__PURE__*/React.createElement("span", {
      key: c,
      className: 'lchip' + (k === li ? ' on' : k < li ? ' done' : '')
    }, c)), known.length > 0 && /*#__PURE__*/React.createElement("span", {
      style: {
        marginInlineStart: 12,
        opacity: .75
      }
    }, " · ", G('حُرُوفٌ تَعْرِفُهَا:', 'حُرُوفٌ تَعْرِفِينَهَا:'), " ", known.map(c => /*#__PURE__*/React.createElement("span", {
      key: c,
      className: "lchip done"
    }, c)))), /*#__PURE__*/React.createElement("div", {
      className: "writegrid"
    }, /*#__PURE__*/React.createElement("div", {
      className: "lettercard"
    }, /*#__PURE__*/React.createElement("div", {
      className: "col center",
      style: {
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "bigletter"
    }, ch), /*#__PURE__*/React.createElement("button", {
      className: "btn ghost sm",
      onClick: () => speak(L.n)
    }, /*#__PURE__*/React.createElement(Icon, {
      n: "speaker",
      s: 2.5
    }), /*#__PURE__*/React.createElement("span", {
      className: "naskh"
    }, L.n))), /*#__PURE__*/React.createElement("div", {
      className: "col",
      style: {
        gap: 8,
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "formsrow"
    }, fs.map(f => /*#__PURE__*/React.createElement("div", {
      key: f,
      className: "formcell"
    }, /*#__PURE__*/React.createElement("div", {
      className: "fl"
    }, l1Form(ch, f)), /*#__PURE__*/React.createElement("div", {
      className: "fn naskh"
    }, L1_FORM_LBL[f])))), /*#__PURE__*/React.createElement("div", {
      className: 'naskh connote ' + (L.c ? 'yes' : 'no')
    }, L.c ? 'هَذَا الْحَرْفُ يَتَّصِلُ بِالْحَرْفِ الَّذِي بَعْدَهُ.' : 'هَذَا الْحَرْفُ لَا يَتَّصِلُ بِالْحَرْفِ الَّذِي بَعْدَهُ.'))), /*#__PURE__*/React.createElement(TeacherBoard, {
      key: 'l' + wi + '-' + li,
      guide: ch,
      height: 230,
      kidLine: paper3,
      doneLabel: G('✓ كَتَبَهُ عَلَى وَرَقَتِهِ', '✓ كَتَبَتْهُ عَلَى وَرَقَتِهَا'),
      onDone: () => {
        if (li + 1 < teach.length) setLi(li + 1);else setStage('join');
      }
    })));
  }
  if (stage === 'join') return /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 12
    }
  }, head, wi === 0 && teach.length === 0 && paperNote, /*#__PURE__*/React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 19
    }
  }, G('انْظُرْ كَيْفَ تَتَّصِلُ الْحُرُوفُ وَاحِدًا بَعْدَ وَاحِدٍ.', 'انْظُرِي كَيْفَ تَتَّصِلُ الْحُرُوفُ وَاحِدًا بَعْدَ وَاحِدٍ.')), /*#__PURE__*/React.createElement("div", {
    className: "row wrapf center",
    style: {
      gap: 8
    }
  }, cw.letters.map((c, k) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: 'tile' + (k < got ? ' used' : ''),
    onClick: () => {
      if (k === got) {
        sfx.pop();
        setGot(got + 1);
      } else if (k > got) sfx.bad();
    }
  }, c))), /*#__PURE__*/React.createElement("div", {
    className: "joinrow"
  }, forms.slice(0, got).map((f, k) => /*#__PURE__*/React.createElement("div", {
    key: k,
    className: "formcell pop"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fl"
  }, l1Form(f.ch, f.f)), /*#__PURE__*/React.createElement("div", {
    className: "fn naskh"
  }, L1_FORM_LBL[f.f]))), got === cw.letters.length && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "eq"
  }, "="), /*#__PURE__*/React.createElement("div", {
    className: "formcell big pop"
  }, /*#__PURE__*/React.createElement("div", {
    className: "fl"
  }, cw.word)))), got === cw.letters.length && /*#__PURE__*/React.createElement("div", {
    className: "row center",
    style: {
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(SpeakBtn, {
    text: cw.word
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn lg",
    onClick: () => setStage('word')
  }, "التَّالِي")));
  if (stage === 'word') return /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 12
    }
  }, head, /*#__PURE__*/React.createElement("div", {
    className: "row center",
    style: {
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bigword naskh"
  }, cw.word), /*#__PURE__*/React.createElement(SpeakBtn, {
    text: cw.word,
    label: false
  })), /*#__PURE__*/React.createElement(TeacherBoard, {
    key: 'word' + wi,
    guide: cw.word,
    height: 220,
    kidLine: paper3,
    doneLabel: G('✓ كَتَبَهَا عَلَى وَرَقَتِهِ', '✓ كَتَبَتْهَا عَلَى وَرَقَتِهَا'),
    onDone: nextWord
  }));
  if (stage === 'sentence') return /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 12
    }
  }, head, /*#__PURE__*/React.createElement("div", {
    className: "papertask"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ttl"
  }, G('اكْتُبْ عَلَى وَرَقَتِكَ', 'اكْتُبِي عَلَى وَرَقَتِكِ')), /*#__PURE__*/React.createElement("div", {
    className: "task"
  }, /*#__PURE__*/React.createElement(TT, {
    text: W.sentence
  }))), msg && /*#__PURE__*/React.createElement("div", {
    className: "warnline"
  }, msg), /*#__PURE__*/React.createElement(TeacherBoard, {
    key: 's' + round,
    guide: plain(W.sentence),
    height: 200,
    kidLine: G('انْظُرْ إِلَى الْقَلَمِ، ثُمَّ اكْتُبِ الْجُمْلَةَ عَلَى وَرَقَتِكَ، وَأَرِهَا لِلْمُعَلِّمِ.', 'انْظُرِي إِلَى الْقَلَمِ، ثُمَّ اكْتُبِي الْجُمْلَةَ عَلَى وَرَقَتِكِ، وَأَرِيهَا لِلْمُعَلِّمِ.'),
    doneLabel: G('✓ كَتَبَهَا، وَأَرَانِي الْوَرَقَةَ', '✓ كَتَبَتْهَا، وَأَرَتْنِي الْوَرَقَةَ'),
    onDone: () => {
      setTick([]);
      setStage('check');
    }
  }));
  const checks = G(['كَتَبَ الْكَلِمَاتِ كُلَّهَا', 'تَرَكَ مَسَافَةً بَيْنَ الْكَلِمَاتِ', 'وَضَعَ عَلَامَةً فِي الْآخِرِ'], ['كَتَبَتِ الْكَلِمَاتِ كُلَّهَا', 'تَرَكَتْ مَسَافَةً بَيْنَ الْكَلِمَاتِ', 'وَضَعَتْ عَلَامَةً فِي الْآخِرِ']);
  return /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 12
    }
  }, head, /*#__PURE__*/React.createElement("div", {
    className: "papertask"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ttl"
  }, G('الْجُمْلَةُ الَّتِي كَتَبَهَا', 'الْجُمْلَةُ الَّتِي كَتَبَتْهَا')), /*#__PURE__*/React.createElement("div", {
    className: "task"
  }, /*#__PURE__*/React.createElement(TT, {
    text: W.sentence
  }))), /*#__PURE__*/React.createElement("b", {
    className: "naskh",
    style: {
      fontSize: 18
    }
  }, "مُرَاجَعَةُ الْوَرَقَةِ:"), /*#__PURE__*/React.createElement("div", {
    className: "row wrapf",
    style: {
      gap: 6
    }
  }, checks.map((c, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: 'ckb' + (tick.includes(i) ? ' on' : ''),
    onClick: () => {
      sfx.pop();
      setTick(tick.includes(i) ? tick.filter(x => x !== i) : [...tick, i]);
    }
  }, tick.includes(i) ? '✓' : '○', " ", c))), /*#__PURE__*/React.createElement("div", {
    className: "tbar fade"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lbl"
  }, "رَأْيُ الْمُعَلِّمِ:"), /*#__PURE__*/React.createElement("button", {
    className: "tb g",
    disabled: tick.length < checks.length,
    onClick: () => {
      sfx.win();
      onDone();
    }
  }, "✓ صَحِيحَةٌ"), /*#__PURE__*/React.createElement("button", {
    className: "tb w",
    onClick: () => {
      sfx.bad();
      setMsg(G('صَحِّحِ الْجُمْلَةَ عَلَى وَرَقَتِكَ. انْظُرْ إِلَى الْقَلَمِ مَرَّةً أُخْرَى.', 'صَحِّحِي الْجُمْلَةَ عَلَى وَرَقَتِكِ. انْظُرِي إِلَى الْقَلَمِ مَرَّةً أُخْرَى.'));
      setRound(round + 1);
      setStage('sentence');
    }
  }, "✎ فِيهَا خَطَأٌ")));
}
function R3WriteBox({
  D,
  onDone
}) {
  const [i, setI] = useState(0);
  const s = D.write[i];
  return /*#__PURE__*/React.createElement("div", {
    className: "col",
    style: {
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "h2 naskh",
    style: {
      textAlign: 'center'
    }
  }, G('آخِرُ خُطْوَةٍ: اكْتُبْ جُمْلَتَيْنِ مِنْ حِكَايَتِكَ', 'آخِرُ خُطْوَةٍ: اكْتُبِي جُمْلَتَيْنِ مِنْ حِكَايَتِكِ')), /*#__PURE__*/React.createElement(L1Dots, {
    n: D.write.length,
    i: i
  }), /*#__PURE__*/React.createElement("div", {
    className: "papertask"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ttl"
  }, G('اكْتُبْ عَلَى وَرَقَتِكَ', 'اكْتُبِي عَلَى وَرَقَتِكِ')), /*#__PURE__*/React.createElement("div", {
    className: "task"
  }, /*#__PURE__*/React.createElement(TT, {
    text: s
  }))), /*#__PURE__*/React.createElement(TeacherBoard, {
    key: 'zw' + i,
    guide: plain(s),
    height: 200,
    kidLine: G('انْظُرْ إِلَى الْقَلَمِ، ثُمَّ اكْتُبِ الْجُمْلَةَ بِخَطِّكَ.', 'انْظُرِي إِلَى الْقَلَمِ، ثُمَّ اكْتُبِي الْجُمْلَةَ بِخَطِّكِ.'),
    doneLabel: G('✓ كَتَبَهَا، وَأَرَانِي الْوَرَقَةَ', '✓ كَتَبَتْهَا، وَأَرَتْنِي الْوَرَقَةَ'),
    onDone: () => {
      sfx.ok();
      if (i + 1 < D.write.length) setI(i + 1);else onDone();
    }
  }));
}
function ClinicSt({
  U,
  onDone
}) {
  const [i, setI] = useState(0);
  const [bad, setBad] = useState(null);
  const [say, setSay] = useState(false);
  const opts = useMemo(() => i < U.clinic.length ? L1_SHUF([U.clinic[i].good, U.clinic[i].bad]) : [], [i]);
  if (i >= U.clinic.length) return React.createElement(DoneBox, {
    msg: G('عَالَجْتَ كُلَّ الْجُمَلِ!', 'عَالَجْتِ كُلَّ الْجُمَلِ!'),
    onDone: onDone
  });
  const c = U.clinic[i];
  if (say) return React.createElement(L1Say, {
    line: c.good,
    note: 'الْعِلَاجُ: ' + c.why,
    onDone: () => {
      setSay(false);
      setI(i + 1);
    }
  });
  return React.createElement("div", {
    className: "col center",
    style: {
      gap: 12
    }
  }, React.createElement(L1Dots, {
    n: U.clinic.length,
    i: i
  }), React.createElement("div", {
    className: "sickcard"
  }, React.createElement("span", {
    className: "pill",
    style: {
      color: '#c2410c'
    }
  }, "\u062C\u064F\u0645\u0652\u0644\u064E\u0629\u064C \u0645\u064E\u0631\u0650\u064A\u0636\u064E\u0629\u064C"), React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 28
    }
  }, React.createElement(TT, {
    text: c.bad
  }))), React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 20
    }
  }, "\u0623\u064E\u064A\u064F\u0651 \u062C\u064F\u0645\u0652\u0644\u064E\u0629\u064D \u0635\u064E\u062D\u0650\u064A\u062D\u064E\u0629\u064C\u061F"), React.createElement("div", {
    className: "col",
    style: {
      gap: 8,
      width: '100%',
      maxWidth: 620
    }
  }, opts.map((o, k) => React.createElement("button", {
    key: k,
    className: 'opt textopt wide' + (bad === k ? ' shake' : ''),
    onClick: () => {
      if (o === c.good) {
        sfx.ok();
        setSay(true);
      } else {
        sfx.bad();
        setBad(k);
        setTimeout(() => setBad(null), 400);
      }
    }
  }, React.createElement("span", {
    style: {
      fontSize: 24
    }
  }, React.createElement(TT, {
    text: o
  }))))));
}
function QASt({
  U,
  onDone
}) {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const [asked, setAsked] = useState(false);
  useEffect(() => {
    if (i < U.qa.length) setTimeout(() => speak(plain(U.qa[i].q)), 250);
  }, [i]);
  if (i < U.qa.length) {
    const c = U.qa[i];
    return React.createElement("div", {
      className: "col center",
      style: {
        gap: 14
      }
    }, React.createElement("div", {
      className: "naskh",
      style: {
        fontSize: 18
      }
    }, G('اقْرَأِ السُّؤَالَ. الْكَلِمَةُ الصَّفْرَاءُ تُسَاعِدُكَ فِي الْجَوَابِ.', 'اقْرَئِي السُّؤَالَ. الْكَلِمَةُ الصَّفْرَاءُ تُسَاعِدُكِ فِي الْجَوَابِ.')), React.createElement(L1Dots, {
      n: U.qa.length + 1,
      i: i
    }), React.createElement("div", {
      className: "say-line sm"
    }, React.createElement(CueText, {
      text: c.q,
      cue: c.qc
    })), React.createElement(SpeakBtn, {
      text: c.q,
      label: false
    }), show ? React.createElement("div", {
      className: "say-line sm fade"
    }, React.createElement(CueText, {
      text: c.a,
      cue: c.ac
    })) : React.createElement("button", {
      className: "btn ghost",
      onClick: () => setShow(true)
    }, "\u0623\u064E\u062C\u064E\u0628\u0652\u062A\u064F\u2026 \u0623\u064E\u0638\u0652\u0647\u0650\u0631\u0650 \u0627\u0644\u0652\u062C\u064E\u0648\u064E\u0627\u0628\u064E"), show && React.createElement("div", {
      className: "row center",
      style: {
        gap: 10
      }
    }, React.createElement("button", {
      className: "btn lg",
      onClick: () => {
        sfx.ok();
        setShow(false);
        setI(i + 1);
      }
    }, "\u2713 \u0623\u064E\u062C\u064E\u0628\u0652\u062A\u064F \u0635\u064E\u062D\u0650\u064A\u062D\u064B\u0627"), React.createElement(SpeakBtn, {
      text: c.a
    })));
  }
  return React.createElement("div", {
    className: "col center",
    style: {
      gap: 14
    }
  }, React.createElement("span", {
    className: "pill naskh"
  }, G('الْآنَ دَوْرُكَ: اسْأَلْ جَدَّكَ', 'الْآنَ دَوْرُكِ: اسْأَلِي جَدَّكِ')), React.createElement(L1Dots, {
    n: U.qa.length + 1,
    i: U.qa.length
  }), React.createElement("div", {
    className: "say-line sm"
  }, React.createElement(TT, {
    text: U.ask.say
  })), !asked ? React.createElement("div", {
    className: "row center",
    style: {
      gap: 10
    }
  }, React.createElement("button", {
    className: "btn lg",
    onClick: () => {
      sfx.ok();
      setAsked(true);
      setTimeout(() => speak(plain(U.ask.reply)), 200);
    }
  }, "\u2713 \u0633\u064E\u0623\u064E\u0644\u0652\u062A\u064F\u0647\u064F"), React.createElement(SpeakBtn, {
    text: U.ask.say
  })) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "bub them fade",
    style: {
      maxWidth: 620
    }
  }, React.createElement("div", {
    className: "who naskh"
  }, "\u062C\u064E\u062F\u0650\u0651\u064A"), React.createElement(TT, {
    text: U.ask.reply
  })), React.createElement(DoneBox, {
    onDone: onDone
  })));
}
function FinalSt({
  U,
  onDone
}) {
  const [open, setOpen] = useState([]);
  const [msg, setMsg] = useState('');
  const reveal = i => {
    if (!open.includes(i)) {
      setOpen([...open, i]);
      speak(plain(U.lines[i].t));
    }
  };
  return React.createElement("div", {
    className: "col",
    style: {
      gap: 12
    }
  }, React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 19
    }
  }, G('انْظُرْ إِلَى الصُّوَرِ، وَاحْكِ كُلَّ شَيْءٍ مِنْ أَوَّلِهِ إِلَى آخِرِهِ. إِنْ تَعَثَّرْتَ، انْقُرِ السَّطْرَ لِتَرَاهُ.', 'انْظُرِي إِلَى الصُّوَرِ، وَاحْكِي كُلَّ شَيْءٍ مِنْ أَوَّلِهِ إِلَى آخِرِهِ. إِنْ تَعَثَّرْتِ، انْقُرِي السَّطْرَ لِتَرَيْهِ.')), React.createElement("div", {
    className: "readbox"
  }, U.lines.map((l, i) => React.createElement("div", {
    key: i,
    className: 'rline' + (open.includes(i) ? ' hl' : ' shut'),
    onClick: () => reveal(i)
  }, React.createElement("span", {
    className: "lnum"
  }, L1_AR(i + 1)), React.createElement(VView, {
    v: l,
    s: 3
  }), open.includes(i) ? React.createElement(TT, {
    text: l.t
  }) : React.createElement("span", {
    className: "naskh hid"
  }, "\xB7 \xB7 \xB7 \xB7 \xB7")))), React.createElement("div", {
    className: "naskh small",
    style: {
      textAlign: 'center',
      opacity: .8
    }
  }, open.length === 0 ? G('بِلَا مُسَاعَدَةٍ: مُمْتَازٌ!', 'بِلَا مُسَاعَدَةٍ: مُمْتَازٌ!') : 'السُّطُورُ الَّتِي ظَهَرَتْ: ' + L1_AR(open.length)), React.createElement(L1Bar, {
    onGrade: g => {
      if (g === 'full') {
        sfx.win();
        onDone();
      } else {
        sfx.bad();
        setMsg(g === 'switch' ? G('جَاءَتْ كَلِمَةٌ عَامِّيَّةٌ. أَعِدِ الْجُمْلَةَ بِالْفُصْحَى.', 'جَاءَتْ كَلِمَةٌ عَامِّيَّةٌ. أَعِيدِي الْجُمْلَةَ بِالْفُصْحَى.') : G('خُذْ نَفَسًا، وَانْقُرِ السَّطْرَ الَّذِي تَعَثَّرْتَ فِيهِ.', 'خُذِي نَفَسًا، وَانْقُرِي السَّطْرَ الَّذِي تَعَثَّرْتِ فِيهِ.'));
      }
    }
  }), msg && React.createElement("div", {
    className: "warnline"
  }, msg));
}
const TS = 16;
function rnd(x, y, s) {
  const n = Math.sin(x * 127.1 + y * 311.7 + (s || 0) * 74.7) * 43758.5453;
  return n - Math.floor(n);
}
function buildMaps(C) {
  const town = {
    id: 'town',
    w: 52,
    h: 38,
    ground: [],
    solid: [],
    statics: [],
    ents: [],
    doors: []
  };
  for (let y = 0; y < town.h; y++) for (let x = 0; x < town.w; x++) {
    town.ground.push('g');
    town.solid.push(false);
  }
  const G = (m, x, y, t) => {
    if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.ground[y * m.w + x] = t;
  };
  const S = (m, x, y) => {
    if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.solid[y * m.w + x] = true;
  };
  const rectG = (m, x0, y0, x1, y1, t) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) G(m, x, y, t);
  };
  const rectS = (m, x0, y0, x1, y1) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) S(m, x, y);
  };
  rectG(town, 0, 12, 51, 12, 's');
  rectG(town, 0, 13, 51, 15, 'r');
  rectG(town, 0, 16, 51, 16, 's');
  rectG(town, 23, 17, 25, 37, 'r');
  rectG(town, 22, 17, 22, 37, 's');
  rectG(town, 26, 17, 26, 37, 's');
  for (let y = 18; y < 36; y++) for (let x = 2; x < 21; x++) if (rnd(x, y) > .86) G(town, x, y, 'f');
  rectG(town, 4, 21, 19, 21, 'p');
  rectG(town, 11, 17, 11, 33, 'p');
  rectG(town, 6, 25, 9, 29, 'w');
  rectS(town, 6, 25, 9, 29);
  rectG(town, 28, 18, 50, 36, 'y');
  rectG(town, 6, 10, 6, 11, 'p');
  rectG(town, 14, 10, 14, 11, 'p');
  for (let x = 28; x <= 50; x++) if (x < 35 || x > 37) {
    S(town, x, 18);
    town.statics.push({
      k: 'fenceH',
      x,
      y: 18
    });
  }
  for (let y = 19; y <= 36; y++) {
    S(town, 28, y);
    S(town, 50, y);
    town.statics.push({
      k: 'fenceV',
      x: 28,
      y
    });
    town.statics.push({
      k: 'fenceV',
      x: 50,
      y
    });
  }
  for (let x = 28; x <= 50; x++) {
    S(town, x, 37);
  }
  const bld = (m, o) => {
    m.statics.push(o);
    rectS(m, o.x, o.y, o.x + o.w - 1, o.y + o.h - 1);
  };
  bld(town, {
    k: 'house',
    x: 2,
    y: 3,
    w: 8,
    h: 7,
    wall: '#f6d7b0',
    roof: C.roof || (C.girl ? '#d9467a' : '#3d5a9e'),
    door: 4
  });
  bld(town, {
    k: 'house',
    x: 12,
    y: 3,
    w: 7,
    h: 7,
    wall: '#d7e8c4',
    roof: '#b4532a',
    door: 2
  });
  bld(town, {
    k: 'shop',
    x: 28,
    y: 4,
    w: 6,
    h: 6,
    wall: '#fbe3e3',
    aw: '#e2483d'
  });
  bld(town, {
    k: 'shop',
    x: 35,
    y: 4,
    w: 6,
    h: 6,
    wall: '#e3eefb',
    aw: '#3a7bd5'
  });
  bld(town, {
    k: 'shop',
    x: 42,
    y: 4,
    w: 7,
    h: 6,
    wall: '#fbf3dc',
    aw: '#2f9e44'
  });
  bld(town, {
    k: 'school',
    x: 39,
    y: 19,
    w: 11,
    h: 6
  });
  bld(town, {
    k: 'clinic',
    x: 29,
    y: 19,
    w: 5,
    h: 4
  });
  town.solid[24 * town.w + 44] = false;
  town.doors.push({
    x: 44,
    y: 24,
    to: 'class',
    tx: 11,
    ty: 13,
    dir: 'u'
  });
  town.statics.push({
    k: 'stage',
    x: 29,
    y: 30,
    w: 5,
    h: 2
  });
  rectS(town, 29, 30, 33, 30);
  town.statics.push({
    k: 'pole',
    x: 35,
    y: 29
  });
  S(town, 35, 29);
  const trees = [[0, 1], [3, 0], [7, 1], [10, 0], [20, 1], [24, 0], [50, 1], [1, 18], [2, 23], [1, 31], [18, 19], [19, 27], [14, 31], [4, 34], [17, 34], [9, 19], [20, 33], [27, 30], [1, 11], [21, 9], [25, 9], [51, 11]];
  trees.forEach(([x, y]) => {
    town.statics.push({
      k: 'tree',
      x,
      y
    });
    S(town, x, y);
  });
  [[14, 24], [4, 29]].forEach(([x, y]) => {
    town.statics.push({
      k: 'bench',
      x,
      y
    });
    S(town, x, y);
    S(town, x + 1, y);
  });
  [[5, 11], [20, 11], [33, 11], [46, 11], [21, 20], [27, 24]].forEach(([x, y]) => {
    town.statics.push({
      k: 'lamp',
      x,
      y
    });
    S(town, x, y);
  });
  town.statics.push({
    k: 'swing',
    x: 15,
    y: 28
  });
  rectS(town, 15, 28, 17, 28);
  const cls = {
    id: 'class',
    w: 22,
    h: 15,
    ground: [],
    solid: [],
    statics: [],
    ents: [],
    doors: []
  };
  for (let y = 0; y < cls.h; y++) for (let x = 0; x < cls.w; x++) {
    cls.ground.push(y < 3 ? 'W' : 'o');
    cls.solid.push(y < 3 || x === 0 || x === 21 || y === 14);
  }
  cls.ground[14 * 22 + 11] = 'o';
  cls.solid[14 * 22 + 11] = false;
  for (let x = 0; x < 22; x++) G(cls, x, 14, x === 11 ? 'o' : 'W');
  for (let y = 0; y < 15; y++) {
    G(cls, 0, y, 'W');
    G(cls, 21, y, 'W');
  }
  cls.statics.push({
    k: 'board',
    x: 7,
    y: 0,
    w: 8
  });
  cls.statics.push({
    k: 'window',
    x: 2,
    y: 1
  });
  cls.statics.push({
    k: 'window',
    x: 17,
    y: 1
  });
  cls.statics.push({
    k: 'tdesk',
    x: 9,
    y: 4,
    w: 3
  });
  rectS(cls, 9, 4, 11, 4);
  const desks = [[3, 7], [6, 7], [14, 7], [17, 7], [3, 10], [6, 10], [14, 10], [17, 10]];
  desks.forEach(([x, y]) => {
    cls.statics.push({
      k: 'desk',
      x,
      y
    });
    rectS(cls, x, y, x + 1, y);
  });
  cls.doors.push({
    x: 11,
    y: 14,
    to: 'town',
    tx: 44,
    ty: 26,
    dir: 'd'
  });
  cls.statics.push({
    k: 'doorIn',
    x: 11,
    y: 14
  });
  town.girl = cls.girl = C.girl;
  return {
    town,
    class: cls
  };
}
function paintStatic(map) {
  const c = document.createElement('canvas');
  c.width = map.w * TS;
  c.height = map.h * TS;
  const g = c.getContext('2d');
  const R = (x, y, w, h, col) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  for (let ty = 0; ty < map.h; ty++) for (let tx = 0; tx < map.w; tx++) {
    const t = map.ground[ty * map.w + tx],
      X = tx * TS,
      Y = ty * TS;
    if (t === 'g' || t === 'f') {
      R(X, Y, TS, TS, '#79c257');
      for (let i = 0; i < 6; i++) {
        const a = rnd(tx, ty, i),
          b = rnd(ty, tx, i + 9);
        R(X + Math.floor(a * 15), Y + Math.floor(b * 15), 1, 2, i % 2 ? '#68b04a' : '#8fd66a');
      }
      if (t === 'f') {
        const cols = ['#ff6b9d', '#ffd166', '#ffffff', '#b28dff'];
        for (let i = 0; i < 3; i++) {
          const a = rnd(tx, ty, i + 20),
            b = rnd(tx, ty, i + 30);
          const fx = X + 2 + Math.floor(a * 11),
            fy = Y + 2 + Math.floor(b * 11);
          R(fx, fy, 2, 2, cols[(tx + ty + i) % 4]);
          R(fx + 1, fy + 2, 1, 1, '#3f8a2c');
        }
      }
    } else if (t === 'r') {
      R(X, Y, TS, TS, '#5a5f6e');
      if (rnd(tx, ty) > .7) R(X + 5, Y + 9, 2, 1, '#525766');
      if (ty === 14 && tx % 2 === 0) R(X + 2, Y + 7, 10, 2, '#f4f1e6');
      if (tx === 24 && ty > 16 && ty % 2 === 0) R(X + 7, Y + 2, 2, 10, '#f4f1e6');
    } else if (t === 's') {
      R(X, Y, TS, TS, '#d3cabb');
      R(X, Y + 15, TS, 1, '#bdb3a4');
      R(X + 15, Y, 1, TS, '#bdb3a4');
      R(X + 7, Y, 1, 7, '#c5bcad');
    } else if (t === 'p') {
      R(X, Y, TS, TS, '#ddbb84');
      if (rnd(tx, ty) > .5) R(X + 4, Y + 5, 2, 2, '#c9a56c');
      if (rnd(ty, tx) > .5) R(X + 10, Y + 11, 2, 1, '#c9a56c');
    } else if (t === 'y') {
      R(X, Y, TS, TS, '#e6d7b6');
      R(X, Y + 15, TS, 1, '#d4c39e');
      R(X + 15, Y, 1, TS, '#d4c39e');
    } else if (t === 'w') {
      R(X, Y, TS, TS, '#4aa3ff');
      R(X + 3 + tx % 3 * 2, Y + 5, 5, 1, '#9fd8ff');
      R(X + 8, Y + 11, 4, 1, '#9fd8ff');
    } else if (t === 'o') {
      R(X, Y, TS, TS, '#c8955c');
      R(X, Y + 7, TS, 1, '#b07f48');
      R(X, Y + 15, TS, 1, '#b07f48');
      R(X + (ty % 2 ? 5 : 11), Y, 1, 7, '#b07f48');
      R(X + (ty % 2 ? 11 : 3), Y + 8, 1, 7, '#b07f48');
    } else if (t === 'W') {
      R(X, Y, TS, TS, '#efe3c9');
      if (ty === 2) {
        R(X, Y + 12, TS, 4, '#b98a55');
        R(X, Y + 12, TS, 1, '#8a5a2e');
      }
    }
  }
  const O = '#2a1d24';
  map.statics.forEach(s => {
    const X = s.x * TS,
      Y = s.y * TS;
    if (s.k === 'house') {
      const W = s.w * TS,
        H = s.h * TS;
      R(X, Y + 30, W, H - 30, s.wall);
      R(X, Y + H - 2, W, 2, O);
      R(X, Y + 30, 2, H - 30, O);
      R(X + W - 2, Y + 30, 2, H - 30, O);
      for (let r = 0; r < 4; r++) {
        R(X - 4 + r * 3, Y + 8 + r * 6, W + 8 - r * 6, 6, r % 2 ? s.roof : shade(s.roof, -18));
      }
      R(X - 4, Y + 30, W + 8, 3, O);
      R(X + 8, Y + 4, W - 16, 4, shade(s.roof, -30));
      R(X + W - 22, Y - 4, 10, 14, '#9a4f2e');
      R(X + W - 23, Y - 6, 12, 3, O);
      const dx = X + s.door * TS - 4;
      R(dx, Y + H - 34, 22, 32, '#7c4a1e');
      R(dx, Y + H - 34, 22, 2, O);
      R(dx + 16, Y + H - 18, 3, 3, '#f6d365');
      [[X + 10, Y + 46], [X + W - 32, Y + 46]].forEach(([wx, wy]) => {
        R(wx - 2, wy - 2, 26, 22, O);
        R(wx, wy, 22, 18, '#9fd8ff');
        R(wx + 10, wy, 2, 18, O);
        R(wx, wy + 8, 22, 2, O);
        R(wx + 2, wy + 2, 4, 3, '#e6f6ff');
      });
      R(X + 6, Y + H + 0, W - 12, 3, 'rgba(0,0,0,.18)');
    } else if (s.k === 'shop') {
      const W = s.w * TS,
        H = s.h * TS;
      R(X, Y + 10, W, H - 10, s.wall);
      R(X, Y + 8, W, 4, O);
      R(X, Y + H - 2, W, 2, O);
      R(X, Y + 10, 2, H - 10, O);
      R(X + W - 2, Y + 10, 2, H - 10, O);
      for (let i = 0; i < W; i += 12) R(X + i, Y + 34, 6, 14, s.aw);
      for (let i = 6; i < W; i += 12) R(X + i, Y + 34, 6, 14, '#ffffff');
      R(X, Y + 48, W, 2, O);
      R(X + 8, Y + 56, W - 40, 30, '#9fd8ff');
      R(X + 8, Y + 56, W - 40, 2, O);
      R(X + 12, Y + 60, 6, 4, '#e6f6ff');
      R(X + W - 28, Y + 56, 20, H - 58, '#7c4a1e');
      R(X + W - 12, Y + 72, 2, 3, '#f6d365');
      R(X + 6, Y + 16, W - 12, 12, '#2a1d24');
      R(X + 8, Y + 18, W - 16, 8, s.aw);
    } else if (s.k === 'school') {
      const W = s.w * TS,
        H = s.h * TS;
      R(X, Y + 8, W, H - 8, map.girl ? '#fff1f2' : '#fdf3d7');
      R(X - 2, Y, W + 4, 10, map.girl ? '#db2777' : '#2f9e44');
      R(X - 2, Y + 10, W + 4, 2, O);
      R(X, Y + H - 2, W, 2, O);
      R(X, Y + 8, 2, H - 8, O);
      R(X + W - 2, Y + 8, 2, H - 8, O);
      for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) {
        if (i === 2 && j === 1) continue;
        const wx = X + 10 + i * 34,
          wy = Y + 22 + j * 30;
        R(wx - 2, wy - 2, 22, 20, O);
        R(wx, wy, 18, 16, '#9fd8ff');
        R(wx + 8, wy, 2, 16, O);
        R(wx + 2, wy + 2, 3, 3, '#e6f6ff');
      }
      const dx = X + 5 * TS - 6;
      R(dx - 2, Y + H - 34, 32, 34, O);
      R(dx, Y + H - 32, 13, 30, '#7c4a1e');
      R(dx + 15, Y + H - 32, 13, 30, '#7c4a1e');
      R(X + W / 2 - 30, Y + 14, 60, 6, '#f6d365');
      R(X + W / 2 - 7, Y - 14, 14, 14, '#ffffff');
      R(X + W / 2 - 7, Y - 14, 14, 2, O);
      R(X + W / 2 - 1, Y - 10, 2, 5, O);
      R(X + W / 2, Y - 6, 4, 2, O);
    } else if (s.k === 'clinic') {
      const W = s.w * TS,
        H = s.h * TS;
      R(X, Y + 6, W, H - 6, '#ffffff');
      R(X - 2, Y, W + 4, 8, '#e2483d');
      R(X, Y + H - 2, W, 2, O);
      R(X, Y + 6, 2, H - 6, O);
      R(X + W - 2, Y + 6, 2, H - 6, O);
      R(X + 8, Y + 16, 20, 6, '#e2483d');
      R(X + 15, Y + 9, 6, 20, '#e2483d');
      R(X + W - 30, Y + H - 30, 20, 28, '#9fd8ff');
      R(X + W - 30, Y + H - 30, 20, 2, O);
      R(X + W - 21, Y + H - 30, 2, 28, O);
    } else if (s.k === 'stage') {
      R(X, Y, s.w * TS, s.h * TS, '#b5651d');
      R(X, Y, s.w * TS, 3, '#d98c3f');
      R(X, Y + s.h * TS - 3, s.w * TS, 3, O);
      for (let i = 0; i < s.w * TS; i += 10) R(X + i, Y + 12, 6, 14, '#a0561a');
      R(X + 4, Y - 26, s.w * TS - 8, 20, map.girl ? '#db2777' : '#2f9e44');
      R(X + 4, Y - 26, s.w * TS - 8, 2, O);
      R(X + 10, Y - 20, s.w * TS - 20, 3, '#f6d365');
    } else if (s.k === 'pole') {
      R(X + 7, Y - 40, 3, 56, '#cbd5e1');
      R(X + 6, Y - 42, 5, 3, '#94a3b8');
      R(X + 4, Y + 12, 9, 4, '#94a3b8');
    } else if (s.k === 'fenceH') {
      R(X, Y + 6, TS, 2, '#8a5a2e');
      R(X, Y + 11, TS, 2, '#8a5a2e');
      R(X + 1, Y + 2, 3, 13, '#b07a45');
      R(X + 9, Y + 2, 3, 13, '#b07a45');
      R(X + 1, Y + 2, 3, 1, O);
      R(X + 9, Y + 2, 3, 1, O);
    } else if (s.k === 'fenceV') {
      R(X + 6, Y, 3, TS, '#b07a45');
      R(X + 5, Y + 4, 5, 2, '#8a5a2e');
    } else if (s.k === 'tree') {
      R(X + 2, Y + 13, 13, 4, 'rgba(0,0,0,.18)');
      R(X + 6, Y + 6, 4, 10, '#7c4a1e');
      const cx = X + 8,
        cy = Y - 2;
      for (let yy = -11; yy <= 9; yy++) for (let xx = -11; xx <= 11; xx++) {
        const d = xx * xx + yy * yy * 1.1;
        if (d < 118) {
          R(cx + xx, cy + yy, 1, 1, d > 92 ? O : xx + yy < -6 ? '#7ed957' : xx + yy > 6 ? '#2b8a3c' : '#3fae4f');
        }
      }
    } else if (s.k === 'bench') {
      R(X + 1, Y + 4, 30, 4, '#b07a45');
      R(X + 1, Y + 9, 30, 3, '#8a5a2e');
      R(X + 3, Y + 12, 2, 4, O);
      R(X + 27, Y + 12, 2, 4, O);
      R(X + 1, Y + 4, 30, 1, O);
    } else if (s.k === 'lamp') {
      R(X + 7, Y - 18, 2, 32, '#3d4354');
      R(X + 4, Y - 22, 8, 5, '#3d4354');
      R(X + 5, Y - 18, 6, 2, '#ffe08a');
      R(X + 5, Y + 13, 6, 3, '#3d4354');
    } else if (s.k === 'swing') {
      R(X, Y - 26, 3, 40, '#e2483d');
      R(X + 45, Y - 26, 3, 40, '#e2483d');
      R(X, Y - 28, 48, 3, '#c0392b');
      R(X + 12, Y - 25, 1, 26, '#555');
      R(X + 20, Y - 25, 1, 26, '#555');
      R(X + 10, Y + 1, 12, 3, '#3a7bd5');
      R(X + 28, Y - 25, 1, 26, '#555');
      R(X + 36, Y - 25, 1, 26, '#555');
      R(X + 26, Y + 1, 12, 3, '#f2b632');
    } else if (s.k === 'board') {
      const W = s.w * TS;
      R(X - 4, Y + 6, W + 8, 30, '#8a5a2e');
      R(X, Y + 9, W, 24, '#24452f');
      R(X + 10, Y + 15, 30, 2, '#d6f5c9');
      R(X + 10, Y + 22, 50, 2, '#d6f5c9');
      R(X + 70, Y + 15, 40, 2, '#d6f5c9');
      R(X + W - 20, Y + 30, 12, 3, '#ffffff');
    } else if (s.k === 'window') {
      R(X - 2, Y + 4, 36, 22, O);
      R(X, Y + 6, 32, 18, '#9fd8ff');
      R(X + 15, Y + 6, 2, 18, O);
      R(X + 3, Y + 8, 5, 4, '#e6f6ff');
    } else if (s.k === 'tdesk') {
      R(X, Y + 2, s.w * TS, 12, '#8a5a2e');
      R(X, Y + 2, s.w * TS, 3, '#b07a45');
      R(X, Y + 13, s.w * TS, 3, O);
    } else if (s.k === 'desk') {
      R(X + 1, Y + 2, 30, 9, '#c8955c');
      R(X + 1, Y + 2, 30, 2, '#e0b07a');
      R(X + 1, Y + 11, 30, 2, O);
      R(X + 3, Y + 13, 3, 3, '#6b4321');
      R(X + 26, Y + 13, 3, 3, '#6b4321');
      R(X + 8, Y + 16, 16, 3, '#3a7bd5');
    } else if (s.k === 'doorIn') {
      R(X - 4, Y, 24, TS, '#7c4a1e');
      R(X - 4, Y, 24, 2, O);
      R(X + 2, Y + 4, 12, 2, '#f6d365');
    }
  });
  return c;
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt,
    g = (n >> 8 & 255) + amt,
    b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}
function L1World({
  C,
  ents,
  signs,
  paused,
  onInteract,
  needs,
  quest,
  ctl
}) {
  const wrapRef = useRef(null),
    canRef = useRef(null);
  const R = useRef({
    keys: {},
    map: 'town',
    px: 9 * TS + 8,
    py: 11 * TS + 10,
    dir: 'd',
    frame: 0,
    ft: 0,
    near: null,
    fade: 0
  });
  const [near, setNear] = useState(null);
  const [place, setPlace] = useState('town');
  const maps = useMemo(() => buildMaps(C), [C.roof, C.girl]);
  const layers = useMemo(() => ({
    town: paintStatic(maps.town),
    class: paintStatic(maps.class)
  }), [maps]);
  R.current.paused = paused;
  R.current.ents = {
    town: ents.map(e => ({
      ...e,
      pos: [e.at[0] * TS + 8, e.at[1] * TS + 14]
    })),
    class: []
  };
  R.current.signs = signs;
  R.current.q = quest;
  R.current.needs = needs;
  const interactRef = useRef(onInteract);
  interactRef.current = onInteract;
  useEffect(() => {
    const can = canRef.current,
      ctx = can.getContext('2d'),
      wrap = wrapRef.current;
    let scale = 3,
      vw = 300,
      vh = 200;
    const fit = () => {
      const cw = wrap.clientWidth,
        ch = wrap.clientHeight;
      scale = Math.max(2, Math.min(5, Math.round(Math.min(cw / 360, ch / 220))));
      vw = Math.ceil(cw / scale);
      vh = Math.ceil(ch / scale);
      can.width = vw;
      can.height = vh;
      can.style.width = vw * scale + 'px';
      can.style.height = vh * scale + 'px';
      ctx.imageSmoothingEnabled = false;
    };
    fit();
    window.__tw = R.current;
    window.__twSet = (mp, x, y) => {
      R.current.map = mp;
      R.current.px = x * TS + 8;
      R.current.py = y * TS + 10;
      setPlace(mp);
    };
    if (ctl) ctl.current = {
      go: (x, y) => {
        const S = R.current;
        S.map = 'town';
        S.px = x * TS + 8;
        S.py = (y + 1) * TS + 10;
        S.dir = 'u';
        S.keys = {};
        S.fade = 0;
        S.pending = null;
        setPlace('town');
      }
    };
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    const km = {
      ArrowUp: 'u',
      KeyW: 'u',
      ArrowDown: 'd',
      KeyS: 'd',
      ArrowLeft: 'l',
      KeyA: 'l',
      ArrowRight: 'r',
      KeyD: 'r'
    };
    const kd = e => {
      if (R.current.paused) return;
      if (km[e.code]) {
        R.current.keys[km[e.code]] = true;
        e.preventDefault();
      }
      if ((e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') && R.current.near) {
        e.preventDefault();
        interactRef.current(R.current.near);
      }
    };
    const ku = e => {
      if (km[e.code]) R.current.keys[km[e.code]] = false;
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    const cars = [{
      x: -40,
      y: 13 * TS + 5,
      d: 1,
      c: '#e2483d',
      v: 46
    }, {
      x: 500,
      y: 14 * TS + 9,
      d: -1,
      c: '#3a7bd5',
      v: 40
    }, {
      x: 260,
      y: 13 * TS + 5,
      d: 1,
      c: '#f2b632',
      v: 52
    }];
    let last = performance.now(),
      raf,
      t = 0;
    const solidAt = (m, px, py) => {
      const tx = Math.floor(px / TS),
        ty = Math.floor(py / TS);
      if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return true;
      return m.solid[ty * m.w + tx];
    };
    const blocked = (m, x, y) => {
      if (solidAt(m, x - 5, y - 3) || solidAt(m, x + 5, y - 3) || solidAt(m, x - 5, y + 1) || solidAt(m, x + 5, y + 1)) return true;
      return (R.current.ents[m.id] || []).some(e => Math.abs(e.pos[0] - x) < 9 && Math.abs(e.pos[1] - y) < 6);
    };
    const drawArrow = (x, y, col) => {
      const b = Math.round(Math.sin(t * 6) * 2);
      ctx.fillStyle = '#2a1d24';
      ctx.fillRect(x - 5, y - 9 + b, 11, 6);
      ctx.fillRect(x - 3, y - 3 + b, 7, 2);
      ctx.fillRect(x - 1, y - 1 + b, 3, 2);
      ctx.fillStyle = col;
      ctx.fillRect(x - 4, y - 8 + b, 9, 4);
      ctx.fillRect(x - 2, y - 4 + b, 5, 2);
      ctx.fillRect(x, y - 2 + b, 1, 1);
    };
    const bubble = (x, y, sym, col) => {
      ctx.fillStyle = '#2a1d24';
      ctx.fillRect(x - 5, y - 9, 11, 10);
      ctx.fillStyle = col;
      ctx.fillRect(x - 4, y - 8, 9, 8);
      ctx.fillStyle = '#2a1d24';
      ctx.fillRect(x - 1, y + 1, 3, 2);
      ctx.fillStyle = '#ffffff';
      if (sym === '!') {
        ctx.fillRect(x, y - 7, 1, 4);
        ctx.fillRect(x, y - 2, 1, 1);
      } else {
        ctx.fillRect(x - 2, y - 4, 1, 1);
        ctx.fillRect(x - 1, y - 3, 1, 1);
        ctx.fillRect(x, y - 4, 1, 1);
        ctx.fillRect(x + 1, y - 5, 1, 1);
        ctx.fillRect(x + 2, y - 6, 1, 1);
      }
    };
    const loop = now => {
      const dt = Math.min(.1, (now - last) / 1000);
      last = now;
      t += dt;
      const S = R.current,
        m = maps[S.map];
      let dx = 0,
        dy = 0;
      if (!S.paused && S.fade <= 0) {
        if (S.keys.u) dy -= 1;
        if (S.keys.d) dy += 1;
        if (S.keys.l) dx -= 1;
        if (S.keys.r) dx += 1;
      }
      if (dx || dy) {
        const sp = 72 * dt * (dx && dy ? .72 : 1);
        const nx = S.px + dx * sp,
          ny = S.py + dy * sp;
        if (!blocked(m, nx, S.py)) S.px = nx;
        if (!blocked(m, S.px, ny)) S.py = ny;
        S.dir = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'r' : 'l' : dy > 0 ? 'd' : 'u';
        S.ft += dt;
        if (S.ft > .16) {
          S.ft = 0;
          S.frame = 1 - S.frame;
        }
      } else S.frame = 0;
      if (S.fade <= 0) m.doors.forEach(d => {
        if (Math.floor(S.px / TS) === d.x && Math.floor((S.py - 2) / TS) === d.y) {
          S.fade = .5;
          S.pending = d;
        }
      });
      if (S.fade > 0) {
        S.fade -= dt;
        if (S.pending && S.fade < .25) {
          const d = S.pending;
          S.pending = null;
          S.map = d.to;
          S.px = d.tx * TS + 8;
          S.py = d.ty * TS + 10;
          S.dir = d.dir;
          setPlace(d.to);
        }
      }
      const ents = S.ents[S.map] || [];
      let nr = null,
        nd = 22;
      ents.forEach(e => {
        const d = Math.hypot(e.pos[0] - S.px, e.pos[1] - S.py);
        if (d < nd) {
          nd = d;
          nr = e;
        }
      });
      const nid = nr ? nr.id : null;
      if (nid !== S.near) {
        S.near = nid;
        setNear(nr ? {
          id: nr.id,
          say: nr.say
        } : null);
      }
      const mw = m.w * TS,
        mh = m.h * TS;
      let cx = Math.round(S.px - vw / 2),
        cy = Math.round(S.py - vh / 2);
      cx = mw <= vw ? Math.round((mw - vw) / 2) : Math.max(0, Math.min(mw - vw, cx));
      cy = mh <= vh ? Math.round((mh - vh) / 2) : Math.max(0, Math.min(mh - vh, cy));
      ctx.fillStyle = S.map === 'class' ? '#3b2a20' : '#2f6b2a';
      ctx.fillRect(0, 0, vw, vh);
      ctx.drawImage(layers[S.map], -cx, -cy);
      if (S.map === 'town') {
        (R.current.signs || []).forEach(sg => {
          const ic = PX.icons[sg.ic];
          const x = sg.x * TS + Math.floor(sg.w * TS / 2) - 6 - cx,
            y = 4 * TS + 16 - cy;
          ctx.fillStyle = '#fffdf5';
          ctx.fillRect(x - 3, y - 2, 18, 15);
          PX.draw(ctx, ic.rows, ic.pal, x, y);
        });
        const fx = 35 * TS + 10 - cx,
          fy = 29 * TS - 40 - cy,
          wv = Math.round(Math.sin(t * 5) * 1.5);
        ctx.fillStyle = '#2a1d24';
        ctx.fillRect(fx, fy, 20, 14);
        ctx.fillStyle = '#e2483d';
        ctx.fillRect(fx + 1, fy + 1, 18, 4 + wv);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(fx + 1, fy + 5 + wv, 18, 4);
        ctx.fillStyle = '#2f9e44';
        ctx.fillRect(fx + 1, fy + 9 + wv, 18, 4 - wv);
        cars.forEach(c => {
          const ahead = Math.abs(S.py - 4 - (c.y + 6)) < 12 && (S.px - c.x - (c.d > 0 ? 26 : 0)) * c.d > -4 && Math.abs(S.px - c.x - 13) < 46;
          if (!ahead) c.x += c.d * c.v * dt;
          if (c.x > mw + 40) c.x = -60;
          if (c.x < -60) c.x = mw + 40;
          const x = Math.round(c.x - cx),
            y = Math.round(c.y - cy);
          ctx.fillStyle = 'rgba(0,0,0,.2)';
          ctx.fillRect(x + 2, y + 12, 24, 3);
          ctx.fillStyle = '#2a1d24';
          ctx.fillRect(x, y + 3, 28, 10);
          ctx.fillRect(x + 6, y - 2, 15, 6);
          ctx.fillStyle = c.c;
          ctx.fillRect(x + 1, y + 4, 26, 8);
          ctx.fillRect(x + 7, y - 1, 13, 5);
          ctx.fillStyle = '#bfe6ff';
          ctx.fillRect(x + (c.d > 0 ? 14 : 8), y, 5, 3);
          ctx.fillStyle = '#f6d365';
          ctx.fillRect(c.d > 0 ? x + 26 : x + 1, y + 6, 1, 2);
          ctx.fillStyle = '#1b1b1b';
          ctx.fillRect(x + 4, y + 11, 5, 4);
          ctx.fillRect(x + 19, y + 11, 5, 4);
        });
      }
      const draws = ents.map(e => ({
        y: e.pos[1],
        e
      })).concat([{
        y: S.py,
        me: true
      }]).sort((a, b) => a.y - b.y);
      draws.forEach(d => {
        if (d.me) {
          const def = C.me;
          const hgt = def.adult ? 20 : 16;
          ctx.fillStyle = 'rgba(0,0,0,.22)';
          ctx.fillRect(Math.round(S.px - cx) - 5, Math.round(S.py - cy) - 1, 11, 3);
          PX.drawChar(ctx, def, S.dir, S.frame, Math.round(S.px - cx) - 6, Math.round(S.py - cy) - hgt + 1);
          return;
        }
        const e = d.e,
          ex = Math.round(e.pos[0] - cx),
          ey = Math.round(e.pos[1] - cy);
        const h = e.char.adult ? 20 : 16;
        const dd = Math.hypot(S.px - e.pos[0], S.py - e.pos[1]);
        let dir = 'd';
        if (dd < 50) {
          const ax = S.px - e.pos[0],
            ay = S.py - e.pos[1];
          dir = Math.abs(ax) > Math.abs(ay) ? ax > 0 ? 'r' : 'l' : ay > 0 ? 'd' : 'u';
        }
        ctx.fillStyle = 'rgba(0,0,0,.22)';
        ctx.fillRect(ex - 5, ey - 1, 11, 3);
        PX.drawChar(ctx, e.char, dir, 0, ex - 6, ey - h + 1);
        const need = S.needs ? S.needs(e.id) : false;
        bubble(ex, ey - h - 3, need ? '!' : 'v', need ? '#f59e0b' : '#16a34a');
      });
      const q = S.q;
      if (q) {
        let tx = null,
          ty = null;
        if (S.map !== 'town') {
          const d = m.doors[0];
          if (d) {
            tx = d.x * TS + 8;
            ty = d.y * TS - 4;
          }
        } else {
          const target = ents.find(e => e.id === q);
          if (target) {
            tx = target.pos[0];
            ty = target.pos[1] - (target.char.adult ? 20 : 16) - 14;
          }
        }
        if (tx != null) {
          const sx = Math.round(tx - cx),
            sy = Math.round(ty - cy);
          if (sx > 6 && sx < vw - 6 && sy > 10 && sy < vh - 4) drawArrow(sx, sy, '#ffd60a');else {
            const ex = Math.max(10, Math.min(vw - 11, sx)),
              ey = Math.max(12, Math.min(vh - 12, sy)),
              pulse = Math.round(Math.sin(t * 6) * 1.5);
            ctx.fillStyle = '#2a1d24';
            ctx.fillRect(ex - 7 - pulse, ey - 7 - pulse, 15 + pulse * 2, 15 + pulse * 2);
            ctx.fillStyle = '#ffd60a';
            ctx.fillRect(ex - 6 - pulse, ey - 6 - pulse, 13 + pulse * 2, 13 + pulse * 2);
            ctx.fillStyle = '#2a1d24';
            const ax = Math.sign(sx - ex),
              ay = Math.sign(sy - ey);
            for (let k = 0; k < 4; k++) {
              if (ax) ctx.fillRect(ex + ax * (k - 1) - (ax < 0 ? 0 : 0), ey - 3 + k, 1, 7 - 2 * k);
              if (ay) ctx.fillRect(ex - 3 + k, ey + ay * (k - 1), 7 - 2 * k, 1);
            }
          }
        }
      }
      if (S.fade > 0) {
        ctx.fillStyle = `rgba(0,0,0,${Math.min(1, (0.5 - Math.abs(S.fade - .25)) * 4)})`;
        ctx.fillRect(0, 0, vw, vh);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
    };
  }, [layers]);
  useEffect(() => {
    if (paused) R.current.keys = {};
  }, [paused]);
  const press = (k, v) => e => {
    e.preventDefault();
    R.current.keys[k] = v;
  };
  return React.createElement("div", {
    className: "game",
    ref: wrapRef
  }, React.createElement("canvas", {
    ref: canRef
  }), React.createElement("div", {
    className: "placebar"
  }, place === 'town' ? 'الْمَدِينَةُ' : 'الْمَدْرَسَةُ'), !paused && near && React.createElement("button", {
    className: "btn lg talk",
    onClick: () => onInteract(near.id)
  }, React.createElement("span", {
    className: "naskh"
  }, near.say), " ", React.createElement("span", {
    className: "small",
    style: {
      opacity: .7
    }
  }, "(E)")), !paused && React.createElement("div", {
    className: "dpad"
  }, React.createElement("span", null), React.createElement("button", {
    "aria-label": "\u0623\u0639\u0644\u0649",
    onPointerDown: press('u', true),
    onPointerUp: press('u', false),
    onPointerLeave: press('u', false)
  }, "\u25B2"), React.createElement("span", null), React.createElement("button", {
    "aria-label": "\u064A\u0633\u0627\u0631",
    onPointerDown: press('l', true),
    onPointerUp: press('l', false),
    onPointerLeave: press('l', false)
  }, "\u25C0"), React.createElement("span", null), React.createElement("button", {
    "aria-label": "\u064A\u0645\u064A\u0646",
    onPointerDown: press('r', true),
    onPointerUp: press('r', false),
    onPointerLeave: press('r', false)
  }, "\u25B6"), React.createElement("span", null), React.createElement("button", {
    "aria-label": "\u0623\u0633\u0641\u0644",
    onPointerDown: press('d', true),
    onPointerUp: press('d', false),
    onPointerLeave: press('d', false)
  }, "\u25BC"), React.createElement("span", null)));
}
const R3_ST = [{
  k: 'sim',
  t: 'قِرَاءَةُ الْمُحَاكَاةِ',
  who: 'read'
}, {
  k: 'tower',
  t: 'بُرْجُ الْقِرَاءَةِ',
  who: 'tower'
}, {
  k: 'talk',
  t: 'كَلَامٌ بِلَا قَرَائِنَ',
  who: 'talk'
}];
function buildReview(rid, P, picks) {
  const pk = n => picks && picks[n] || {};
  const fr = {
    ...pk(3),
    ...pk(5)
  };
  const U1 = buildUnit(1, P, pk(1)),
    U2 = buildUnit(2, P, pk(2)),
    U3 = buildUnit(3, P, fr),
    U6 = buildUnit(6, P, pk(6)),
    U7 = buildUnit(7, P, pk(7));
  const nm = (P.name || '').trim() || G('عُمَر', 'مَرْيَم');
  const NM = `⟦*${nm}⟧`;
  const age = AGES[P.age] || AGES[9],
    C = l1Country(P.country);
  const like = l1Pick(U2, pk(2), 'like'),
    dream = l1Pick(U2, pk(2), 'dream');
  const fn = l1Pick(U3, fr, 'fname'),
    fc = l1Pick(U3, fr, 'fcountry'),
    fl = l1Pick(U3, fr, 'flike');
  const am = l1Pick(U1, pk(1), 'time').v === 'am';
  const sib = l1Pick(U6, pk(6), 'sibs');
  const food = l1Pick(U7, pk(7), 'food'),
    drink = l1Pick(U7, pk(7), 'drink');
  const toy = l1Pick(buildUnit(4, P, pk(4)), pk(4), 'toy');
  const S = {
    salam: {
      t: 'السَّلَامُ عَلَيْكُمْ.',
      scene: 'greet',
      key: 'السَّلَامُ'
    },
    time: {
      t: am ? 'صَبَاحُ الْخَيْرِ.' : 'مَسَاءُ الْخَيْرِ.',
      ic: am ? 'sun' : 'moon',
      key: am ? 'صَبَاحُ' : 'مَسَاءُ'
    },
    how: {
      t: G('كَيْفَ حَالُكَ؟', 'كَيْفَ حَالُكِ؟'),
      ic: 'question',
      key: G('حَالُكَ', 'حَالُكِ')
    },
    fine: {
      t: 'أَنَا بِخَيْرٍ، وَالْحَمْدُ لِلَّهِ.',
      ic: 'star',
      key: 'بِخَيْرٍ'
    },
    name: {
      t: `اسْمِي ${NM}.`,
      ic: 'tag',
      key: 'اسْمِي'
    },
    age: {
      t: `عُمْرِي ${age}.`,
      ic: 'cake',
      key: 'عُمْرِي'
    },
    from: {
      t: `أَنَا ${C.from}.`,
      ic: 'globe',
      key: 'مِنْ'
    },
    like: {
      t: `أُحِبُّ ${like.w}.`,
      ic: like.ic,
      key: 'أُحِبُّ'
    },
    dream: {
      t: `أُرِيدُ أَنْ أَصِيرَ ${dream.w}.`,
      ic: dream.ic,
      key: 'أَصِيرَ'
    },
    qname: {
      t: G('مَا اسْمُكَ؟', 'مَا اسْمُكِ؟'),
      ic: 'tag',
      key: G('اسْمُكَ', 'اسْمُكِ')
    },
    qfrom: {
      t: G('مِنْ أَيْنَ أَنْتَ؟', 'مِنْ أَيْنَ أَنْتِ؟'),
      ic: 'globe',
      key: G('أَنْتَ', 'أَنْتِ')
    },
    qlike: {
      t: G('مَاذَا تُحِبُّ؟', 'مَاذَا تُحِبِّينَ؟'),
      ic: 'heart',
      key: G('تُحِبُّ', 'تُحِبِّينَ')
    },
    also: {
      t: `أَنَا أُحِبُّ ${fl.w} أَيْضًا!`,
      ic: fl.ic,
      key: 'أَيْضًا'
    },
    youfr: {
      t: G('أَنْتَ صَدِيقِي.', 'أَنْتِ صَدِيقَتِي.'),
      scene: 'friend',
      key: G('صَدِيقِي', 'صَدِيقَتِي')
    },
    house: {
      t: 'هَذَا بَيْتِي.',
      ic: 'house',
      key: 'بَيْتِي'
    },
    toy: {
      t: `${toy.dem} ${toy.w}.`,
      ic: toy.ic,
      key: toy.w
    },
    fr: {
      t: G('هَذَا صَدِيقِي.', 'هَذِهِ صَدِيقَتِي.'),
      ch: fn.ch,
      key: G('صَدِيقِي', 'صَدِيقَتِي')
    },
    fname: {
      t: G(`اسْمُهُ ${fn.w}.`, `اسْمُهَا ${fn.w}.`),
      ic: 'tag',
      key: G('اسْمُهُ', 'اسْمُهَا')
    },
    ffrom: {
      t: G(`هُوَ ${fc.w}.`, `هِيَ ${fc.w}.`),
      ic: 'globe',
      key: G('هُوَ', 'هِيَ')
    },
    flike: {
      t: G(`هُوَ يُحِبُّ ${fl.w}.`, `هِيَ تُحِبُّ ${fl.w}.`),
      ic: fl.ic,
      key: G('يُحِبُّ', 'تُحِبُّ')
    },
    fkind: {
      t: G('هُوَ لَطِيفٌ وَذَكِيٌّ.', 'هِيَ لَطِيفَةٌ وَذَكِيَّةٌ.'),
      scene: 'smart',
      key: G('ذَكِيٌّ', 'ذَكِيَّةٌ')
    },
    fam: {
      t: 'هَذِهِ عَائِلَتِي.',
      ic: 'friends',
      key: 'عَائِلَتِي'
    },
    dad: {
      t: 'هَذَا أَبِي. هُوَ يَعْمَلُ.',
      scene: 'works',
      key: 'أَبِي'
    },
    mom: {
      t: 'هَذِهِ أُمِّي. هِيَ تَطْبُخُ.',
      scene: 'cooks',
      key: 'أُمِّي'
    },
    sibs: {
      t: sib.line,
      ch: sib.ch || 'brother',
      key: sib.v === '0' ? 'لَيْسَ' : 'عِنْدِي'
    },
    thanks: {
      t: 'شُكْرًا.',
      scene: 'thanks',
      key: 'شُكْرًا'
    },
    bye: {
      t: 'مَعَ السَّلَامَةِ.',
      scene: 'bye',
      key: 'السَّلَامَةِ'
    },
    wake: {
      t: 'فِي الصَّبَاحِ أَسْتَيْقِظُ.',
      scene: 'wake',
      key: 'أَسْتَيْقِظُ'
    },
    pray: {
      t: 'أُصَلِّي، ثُمَّ آكُلُ.',
      scene: 'pray',
      key: 'ثُمَّ'
    },
    go: {
      t: 'أَذْهَبُ إِلَى الْمَدْرَسَةِ.',
      scene: 'go',
      key: 'أَذْهَبُ'
    },
    play: {
      t: 'بَعْدَ الْمَدْرَسَةِ أَلْعَبُ.',
      ic: 'ball',
      key: 'أَلْعَبُ'
    },
    hungry: {
      t: 'أَشْعُرُ بِالْجُوعِ.',
      scene: 'hunger',
      key: 'بِالْجُوعِ'
    },
    want: {
      t: `أُرِيدُ أَنْ آكُلَ ${food.w}، مِنْ فَضْلِكَ.`,
      ic: food.ic,
      key: food.w
    },
    bism: {
      t: 'بِسْمِ اللَّهِ.',
      ic: 'food',
      key: 'بِسْمِ'
    },
    hamd: {
      t: 'الْحَمْدُ لِلَّهِ. شُكْرًا يَا جَدِّي.',
      ic: 'star',
      key: 'الْحَمْدُ'
    },
    thirsty: {
      t: `أَشْعُرُ بِالْعَطَشِ. أُرِيدُ أَنْ أَشْرَبَ ${drink.w}.`,
      ic: drink.ic,
      key: 'بِالْعَطَشِ'
    },
    sleep: {
      t: 'فِي اللَّيْلِ أَنَامُ.',
      scene: 'sleep',
      key: 'أَنَامُ'
    }
  };
  const U9 = buildUnit(9, P, pk(9)),
    U10 = buildUnit(10, P, pk(10)),
    U11 = buildUnit(11, P, pk(11)),
    U12 = buildUnit(12, P, pk(12)),
    U13 = buildUnit(13, P, pk(13)),
    U14 = buildUnit(14, P, pk(14)),
    U15 = buildUnit(15, P, pk(15)),
    U16 = buildUnit(16, P, pk(16));
  const mt = l1Pick(U12, pk(12), 'mate'),
    fd15 = l1Pick(U15, pk(15), 'food'),
    vs16 = l1Pick(U16, pk(16), 'vis');
  const SICK = G('مَرِيضٌ', 'مَرِيضَةٌ');
  const cp = l => ({
    t: l.t,
    key: l.key,
    ic: l.ic,
    scene: l.scene,
    ch: l.ch
  });
  Object.assign(S, {
    d_home: {
      t: 'بَيْتِي فِي هَذَا الْحَيِّ.',
      ic: 'house',
      key: 'فِي'
    },
    d_near: cp(U10.lines[2]),
    d_bread: cp(U11.lines[1]),
    d_num: cp(U11.lines[2]),
    d_drink: cp(U11.lines[3]),
    d_bag: {
      t: 'فِي الْحَقِيبَةِ، مِنْ فَضْلِكَ.',
      ic: 'bag',
      key: 'الْحَقِيبَةِ'
    },
    d_price: cp(U11.lines[4]),
    d_pay: cp(U11.lines[5]),
    e_come: {
      t: G(`تَعَالَ يَا ${mt.w}!`, `تَعَالَيْ يَا ${mt.w}!`),
      scene: 'come',
      key: G('تَعَالَ', 'تَعَالَيْ')
    },
    e_play: cp(U13.lines[1]),
    e_start: cp(U13.lines[2]),
    e_turn: cp(U13.lines[4]),
    e_sick: {
      t: `أَنَا ${SICK}.`,
      scene: 'sick',
      key: SICK
    },
    e_pain: cp(U14.lines[1]),
    e_back: cp(U13.lines[6]),
    e_we2: cp(U12.lines[6]),
    f_y1: {
      t: 'أَمْسِ لَعِبْتُ فِي الْحَدِيقَةِ.',
      ic: 'park',
      key: 'لَعِبْتُ'
    },
    f_y2: {
      t: `وَأَكَلْتُ ${fd15.w}.`,
      ic: fd15.ic,
      key: 'أَكَلْتُ'
    },
    f_t1: {
      t: 'الْيَوْمَ أَنَا فِي بَيْتِكَ يَا جَدِّي.',
      scene: 'today',
      key: 'الْيَوْمَ'
    },
    f_eid: cp(U16.lines[0]),
    f_w1: cp(U16.lines[4]),
    f_w2: cp(U16.lines[2]),
    f_mub: {
      t: 'عِيدٌ مُبَارَكٌ يَا جَدِّي!',
      scene: 'greet',
      key: 'مُبَارَكٌ'
    },
    z_t: {
      t: `غَدًا سَأَزُورُ ${vs16.w}.`,
      ch: vs16.ch,
      key: 'سَأَزُورُ'
    }
  });
  const CFG2 = {
    rD: {
      title: 'مُرَاجَعَةُ الْمُدُنِ ٩–١١',
      fns: 'أَسْأَلُ عَنِ الْمَكَانِ · أَصِفُ حَيِّي · أَشْتَرِي',
      who: {
        name: 'الْبَائِعُ',
        gen: 'الْبَائِعِ',
        char: L1CH.seller,
        at: [23, 11]
      },
      scene: G(`أَهْلًا يَا ${NM}! أُمُّكَ تُرِيدُ خُبْزًا، وَالدُّكَّانُ فِي حَيِّكُمْ. اذْهَبْ إِلَى الْبَائِعِ: سَلِّمْ، وَاشْتَرِ، وَاسْأَلْ عَنِ الثَّمَنِ.`, `أَهْلًا يَا ${NM}! أُمُّكِ تُرِيدُ خُبْزًا، وَالدُّكَّانُ فِي حَيِّكُمْ. اذْهَبِي إِلَى الْبَائِعِ: سَلِّمِي، وَاشْتَرِي، وَاسْأَلِي عَنِ الثَّمَنِ.`),
      turns: [{
        n: null,
        me: ['salam']
      }, {
        n: G('وَعَلَيْكُمُ السَّلَامُ. أَنْتَ جَارُنَا؟ أَيْنَ بَيْتُكَ؟', 'وَعَلَيْكُمُ السَّلَامُ. أَنْتِ جَارَتُنَا؟ أَيْنَ بَيْتُكِ؟'),
        me: ['d_home', 'd_near']
      }, {
        n: G('أَهْلًا بِكَ! مَاذَا تُرِيدُ؟', 'أَهْلًا بِكِ! مَاذَا تُرِيدِينَ؟'),
        me: ['d_bread']
      }, {
        n: G('كَمْ رَغِيفًا تُرِيدُ؟', 'كَمْ رَغِيفًا تُرِيدِينَ؟'),
        me: ['d_num']
      }, {
        n: G('تَفَضَّلْ. وَمَاذَا تُرِيدُ أَيْضًا؟', 'تَفَضَّلِي. وَمَاذَا تُرِيدِينَ أَيْضًا؟'),
        me: ['d_drink']
      }, {
        n: 'أَيْنَ أَضَعُ الْخُبْزَ؟',
        me: ['d_bag']
      }, {
        n: G('تَفَضَّلْ.', 'تَفَضَّلِي.'),
        me: ['d_price']
      }, {
        n: 'عَشَرَةٌ.',
        me: ['d_pay', 'bye']
      }, {
        n: 'مَعَ السَّلَامَةِ.',
        me: []
      }],
      narr: ['salam', 'd_home', 'd_near', 'd_bread', 'd_num', 'd_drink', 'd_bag', 'd_price', 'd_pay', 'bye'],
      units: [9, 10, 11],
      final: G('قُلْ كُلَّ مَا قُلْتَهُ فِي الدُّكَّانِ مَرَّةً أُخْرَى، مِنْ أَوَّلِهِ.', 'قُولِي كُلَّ مَا قُلْتِهِ فِي الدُّكَّانِ مَرَّةً أُخْرَى، مِنْ أَوَّلِهِ.'),
      values: 'النِّظَامُ · حُبُّ الْحَيِّ · الْأَدَبُ مَعَ الْبَائِعِ'
    },
    rE: {
      title: 'مُرَاجَعَةُ الْمُدُنِ ١٢–١٤',
      fns: 'صَفُّنَا · نَلْعَبُ · أَقُولُ مَا يُؤْلِمُنِي',
      who: {
        name: mt.w,
        gen: mt.w,
        char: L1CH[mt.ch] || L1CH.zaid,
        at: [23, 11]
      },
      scene: G(`أَهْلًا يَا ${NM}! يَوْمٌ فِي الْمَدْرَسَةِ مَعَ زَمِيلِكَ ${mt.w}: تَلْعَبَانِ فِي الِاسْتِرَاحَةِ، ثُمَّ يُؤْلِمُكَ شَيْءٌ، ثُمَّ تَرْجِعَانِ إِلَى الصَّفِّ.`, `أَهْلًا يَا ${NM}! يَوْمٌ فِي الْمَدْرَسَةِ مَعَ زَمِيلَتِكِ ${mt.w}: تَلْعَبَانِ فِي الِاسْتِرَاحَةِ، ثُمَّ يُؤْلِمُكِ شَيْءٌ، ثُمَّ تَرْجِعَانِ إِلَى الصَّفِّ.`),
      turns: [{
        n: null,
        me: ['e_come']
      }, {
        n: 'نَعَمْ؟',
        me: ['e_play']
      }, {
        n: 'هَيَّا! مَنْ يَبْدَأُ؟',
        me: ['e_start']
      }, {
        n: G('أَحْسَنْتَ!', 'أَحْسَنْتِ!'),
        me: ['e_turn']
      }, {
        n: G('مَا بِكَ؟ أَنْتَ لَا تَلْعَبُ!', 'مَا بِكِ؟ أَنْتِ لَا تَلْعَبِينَ!'),
        me: ['e_sick', 'e_pain']
      }, {
        n: G('سَلَامَتُكَ! انْتَهَتِ الِاسْتِرَاحَةُ.', 'سَلَامَتُكِ! انْتَهَتِ الِاسْتِرَاحَةُ.'),
        me: ['e_back']
      }, {
        n: G('هَذَا صَفُّنَا. اجْلِسْ وَاسْتَرِحْ.', 'هَذَا صَفُّنَا. اجْلِسِي وَاسْتَرِيحِي.'),
        me: ['e_we2', 'thanks']
      }, {
        n: 'عَفْوًا.',
        me: []
      }],
      narr: ['e_come', 'e_play', 'e_start', 'e_turn', 'e_sick', 'e_pain', 'e_back', 'e_we2', 'thanks'],
      units: [12, 13, 14],
      final: G('قُلْ كُلَّ مَا حَدَثَ مِنْ أَوَّلِهِ: اللَّعِبَ، ثُمَّ الْأَلَمَ، ثُمَّ الصَّفَّ.', 'قُولِي كُلَّ مَا حَدَثَ مِنْ أَوَّلِهِ: اللَّعِبَ، ثُمَّ الْأَلَمَ، ثُمَّ الصَّفَّ.'),
      values: 'حُبُّ الْعِلْمِ · الْعَدْلُ فِي اللَّعِبِ · الصَّبْرُ'
    },
    rF: {
      title: 'مُرَاجَعَةُ الْمُدُنِ ١٥–١٦',
      fns: 'أَمْسِ · الْيَوْمَ · غَدًا',
      who: {
        name: 'جَدِّي',
        gen: 'جَدِّي',
        char: L1CH.grandpa,
        at: [23, 11]
      },
      scene: G(`أَهْلًا يَا ${NM}! أَنْتَ فِي بَيْتِ جَدِّكَ، وَغَدًا الْعِيدُ. جَدُّكَ يَسْأَلُكَ عَنْ أَمْسِ، وَعَنِ الْيَوْمِ، وَعَنْ غَدٍ.`, `أَهْلًا يَا ${NM}! أَنْتِ فِي بَيْتِ جَدِّكِ، وَغَدًا الْعِيدُ. جَدُّكِ يَسْأَلُكِ عَنْ أَمْسِ، وَعَنِ الْيَوْمِ، وَعَنْ غَدٍ.`),
      turns: [{
        n: G(`أَهْلًا يَا ${NM}! مَاذَا فَعَلْتَ أَمْسِ؟`, `أَهْلًا يَا ${NM}! مَاذَا فَعَلْتِ أَمْسِ؟`),
        me: ['f_y1', 'f_y2']
      }, {
        n: 'صَحَّةً وَعَافِيَةً! وَالْيَوْمَ؟',
        me: ['f_t1']
      }, {
        n: G('أَهْلًا بِكَ! وَغَدًا؟', 'أَهْلًا بِكِ! وَغَدًا؟'),
        me: ['f_eid', 'f_w1', 'f_w2']
      }, {
        n: 'مَا شَاءَ اللَّهُ!',
        me: ['f_mub']
      }, {
        n: G('عِيدٌ مُبَارَكٌ عَلَيْكَ يَا حَبِيبِي!', 'عِيدٌ مُبَارَكٌ عَلَيْكِ يَا حَبِيبَتِي!'),
        me: []
      }],
      narr: ['f_y1', 'f_y2', 'f_t1', 'f_eid', 'f_w1', 'f_w2', 'f_mub'],
      units: [15, 16],
      final: G('قُلْ لِجَدِّكَ كُلَّ شَيْءٍ مِنْ أَوَّلِهِ: أَمْسِ، ثُمَّ الْيَوْمَ، ثُمَّ غَدًا.', 'قُولِي لِجَدِّكِ كُلَّ شَيْءٍ مِنْ أَوَّلِهِ: أَمْسِ، ثُمَّ الْيَوْمَ، ثُمَّ غَدًا.'),
      values: 'صِلَةُ الرَّحِمِ · فَرْحَةُ الْعِيدِ'
    },
    rZ: {
      title: 'حِكَايَتِي',
      fns: 'أُعَرِّفُ بِنَفْسِي · أَصِفُ حَيِّي · أَحْكِي أَمْسِ وَغَدًا',
      who: {
        name: 'جَدَّتِي',
        gen: 'جَدَّتِي',
        char: L1CH.grandma,
        at: [23, 11]
      },
      scene: G(`أَهْلًا يَا ${NM}! جَاءَتْ جَدَّتُكَ مِنْ بَلَدٍ بَعِيدٍ، وَتُرِيدُ أَنْ تَعْرِفَ كُلَّ شَيْءٍ عَنْكَ. قُلْ لَهَا حِكَايَتَكَ، ثُمَّ اكْتُبْ مِنْهَا جُمْلَتَيْنِ.`, `أَهْلًا يَا ${NM}! جَاءَتْ جَدَّتُكِ مِنْ بَلَدٍ بَعِيدٍ، وَتُرِيدُ أَنْ تَعْرِفَ كُلَّ شَيْءٍ عَنْكِ. قُولِي لَهَا حِكَايَتَكِ، ثُمَّ اكْتُبِي مِنْهَا جُمْلَتَيْنِ.`),
      turns: [{
        n: null,
        me: ['salam']
      }, {
        n: G('وَعَلَيْكُمُ السَّلَامُ يَا حَبِيبِي! عَرِّفْنِي بِنَفْسِكَ.', 'وَعَلَيْكُمُ السَّلَامُ يَا حَبِيبَتِي! عَرِّفِينِي بِنَفْسِكِ.'),
        me: ['name', 'age', 'from']
      }, {
        n: G('أَيْنَ بَيْتُكَ؟', 'أَيْنَ بَيْتُكِ؟'),
        me: ['d_home', 'd_near']
      }, {
        n: G('وَمَاذَا تُحِبُّ؟', 'وَمَاذَا تُحِبِّينَ؟'),
        me: ['like']
      }, {
        n: G('مَاذَا فَعَلْتَ أَمْسِ؟', 'مَاذَا فَعَلْتِ أَمْسِ؟'),
        me: ['f_y1']
      }, {
        n: 'وَغَدًا؟',
        me: ['z_t']
      }, {
        n: G('مَا شَاءَ اللَّهُ! أَنْتَ تَتَكَلَّمُ الْعَرَبِيَّةَ جَيِّدًا.', 'مَا شَاءَ اللَّهُ! أَنْتِ تَتَكَلَّمِينَ الْعَرَبِيَّةَ جَيِّدًا.'),
        me: []
      }],
      narr: ['salam', 'name', 'age', 'from', 'd_home', 'd_near', 'like', 'f_y1', 'z_t'],
      units: [2, 10, 15, 16],
      final: G('قُلْ حِكَايَتَكَ كُلَّهَا مُتَّصِلَةً، مِنْ أَوَّلِهَا إِلَى آخِرِهَا.', 'قُولِي حِكَايَتَكِ كُلَّهَا مُتَّصِلَةً، مِنْ أَوَّلِهَا إِلَى آخِرِهَا.'),
      values: 'الِاعْتِزَازُ بِاللُّغَةِ · صِلَةُ الرَّحِمِ',
      write: ['z_t', 'f_y1']
    }
  };
  Object.keys(S).forEach(k => {
    S[k].id = k;
  });
  const QU = G('مَعَكَ', 'مَعَكِ');
  const CFG = {
    rA: {
      title: 'مُرَاجَعَةُ الْمُدُنِ ١–٣',
      fns: 'أُسَلِّمُ · أُعَرِّفُ بِنَفْسِي · أَسْأَلُ',
      who: {
        name: G('وَلَدٌ جَدِيدٌ', 'بِنْتٌ جَدِيدَةٌ'),
        gen: G('الْوَلَدِ الْجَدِيدِ', 'الْبِنْتِ الْجَدِيدَةِ'),
        char: L1CH[fn.ch] || L1CH.newFriendM,
        at: [23, 11]
      },
      scene: G(`أَهْلًا يَا ${NM}! أَوَّلُ يَوْمٍ فِي النَّادِي، وَهُنَاكَ وَلَدٌ جَدِيدٌ. سَلِّمْ عَلَيْهِ، وَعَرِّفْهُ بِنَفْسِكَ، وَاسْأَلْهُ.`, `أَهْلًا يَا ${NM}! أَوَّلُ يَوْمٍ فِي النَّادِي، وَهُنَاكَ بِنْتٌ جَدِيدَةٌ. سَلِّمِي عَلَيْهَا، وَعَرِّفِيهَا بِنَفْسِكِ، وَاسْأَلِيهَا.`),
      turns: [{
        n: null,
        me: ['salam']
      }, {
        n: 'وَعَلَيْكُمُ السَّلَامُ.',
        me: ['time']
      }, {
        n: am ? 'صَبَاحُ النُّورِ.' : 'مَسَاءُ النُّورِ.',
        me: ['how']
      }, {
        n: G('بِخَيْرٍ، وَالْحَمْدُ لِلَّهِ. وَأَنْتَ؟', 'بِخَيْرٍ، وَالْحَمْدُ لِلَّهِ. وَأَنْتِ؟'),
        me: ['fine', 'name']
      }, {
        n: G(`أَهْلًا يَا ${NM}!`, `أَهْلًا يَا ${NM}!`),
        me: ['qname']
      }, {
        n: `اسْمِي ${fn.w}.`,
        me: ['age', 'qfrom']
      }, {
        n: `أَنَا ${fc.w}.`,
        me: ['from', 'like', 'qlike']
      }, {
        n: `أُحِبُّ ${fl.w}.`,
        me: ['also', 'youfr']
      }, {
        n: G('وَأَنْتَ صَدِيقِي! مَعَ السَّلَامَةِ.', 'وَأَنْتِ صَدِيقَتِي! مَعَ السَّلَامَةِ.'),
        me: ['bye']
      }, {
        n: 'إِلَى اللِّقَاءِ.',
        me: []
      }],
      narr: ['salam', 'time', 'how', 'fine', 'name', 'age', 'from', 'like', 'qname', 'qfrom', 'qlike', 'also', 'youfr', 'bye'],
      units: [1, 2, 3],
      final: G('قُلْ كُلَّ مَا قُلْتَهُ لِي مَرَّةً أُخْرَى، مِنْ أَوَّلِهِ: سَلِّمْ، وَعَرِّفْ، وَاسْأَلْ.', 'قُولِي كُلَّ مَا قُلْتِهِ لِي مَرَّةً أُخْرَى، مِنْ أَوَّلِهِ: سَلِّمِي، وَعَرِّفِي، وَاسْأَلِي.'),
      values: 'إِفْشَاءُ السَّلَامِ · الِاعْتِزَازُ بِالِاسْمِ · حُسْنُ السُّؤَالِ'
    },
    rB: {
      title: 'مُرَاجَعَةُ الْمُدُنِ ٤–٦',
      fns: 'أُشِيرُ · أُعَرِّفُ بِصَدِيقِي · بِعَائِلَتِي',
      who: {
        name: 'الْجَارُ الْجَدِيدُ',
        gen: 'الْجَارِ الْجَدِيدِ',
        char: L1CH.neighbor,
        at: [23, 11]
      },
      scene: G(`أَهْلًا يَا ${NM}! جَاءَ جَارٌ جَدِيدٌ إِلَى الْحَيِّ، وَزَارَ بَيْتَكُمْ. سَلِّمْ، وَعَرِّفْهُ بِبَيْتِكَ وَصَدِيقِكَ وَعَائِلَتِكَ.`, `أَهْلًا يَا ${NM}! جَاءَ جَارٌ جَدِيدٌ إِلَى الْحَيِّ، وَزَارَ بَيْتَكُمْ. سَلِّمِي، وَعَرِّفِيهِ بِبَيْتِكِ وَصَدِيقَتِكِ وَعَائِلَتِكِ.`),
      turns: [{
        n: null,
        me: ['salam']
      }, {
        n: G(`وَعَلَيْكُمُ السَّلَامُ. أَنَا جَارُكُمُ الْجَدِيدُ. مَا هَذَا يَا ${NM}؟`, `وَعَلَيْكُمُ السَّلَامُ. أَنَا جَارُكُمُ الْجَدِيدُ. مَا هَذَا يَا ${NM}؟`),
        me: ['house']
      }, {
        n: `وَمَا ${toy.dem === 'هَذَا' ? 'هَذَا' : 'هَذِهِ'}؟`,
        me: ['toy']
      }, {
        n: G('مَنْ هَذَا الْوَلَدُ مَعَكَ؟', 'مَنْ هَذِهِ الْبِنْتُ مَعَكِ؟'),
        me: ['fr', 'fname']
      }, {
        n: G('مِنْ أَيْنَ هُوَ؟', 'مِنْ أَيْنَ هِيَ؟'),
        me: ['ffrom']
      }, {
        n: G('مَاذَا يُحِبُّ؟', 'مَاذَا تُحِبُّ؟'),
        me: ['flike']
      }, {
        n: G('هَلْ هُوَ لَطِيفٌ؟', 'هَلْ هِيَ لَطِيفَةٌ؟'),
        me: ['fkind'],
        pre: 'نَعَمْ، '
      }, {
        n: 'وَهَذِهِ الصُّوَرُ؟',
        me: ['fam', 'dad', 'mom']
      }, {
        n: G('هَلْ عِنْدَكَ إِخْوَةٌ؟', 'هَلْ عِنْدَكِ إِخْوَةٌ؟'),
        me: ['sibs']
      }, {
        n: 'مَا شَاءَ اللَّهُ! بَارَكَ اللَّهُ فِيكُمْ.',
        me: ['thanks', 'bye']
      }, {
        n: 'مَعَ السَّلَامَةِ.',
        me: []
      }],
      narr: ['salam', 'house', 'toy', 'fr', 'fname', 'ffrom', 'flike', 'fkind', 'fam', 'dad', 'mom', 'sibs', 'thanks', 'bye'],
      units: [1, 4, 3, 6],
      final: G('قُلْ كُلَّ شَيْءٍ مَرَّةً أُخْرَى مِنْ أَوَّلِهِ: بَيْتُكَ، وَصَدِيقُكَ، وَعَائِلَتُكَ.', 'قُولِي كُلَّ شَيْءٍ مَرَّةً أُخْرَى مِنْ أَوَّلِهِ: بَيْتُكِ، وَصَدِيقَتُكِ، وَعَائِلَتُكِ.'),
      values: 'النِّظَامُ · حُسْنُ الْجِوَارِ · بِرُّ الْوَالِدَيْنِ'
    },
    rC: {
      title: 'مُرَاجَعَةُ الْمُدُنِ ٧–٨',
      fns: 'أَحْكِي يَوْمِي · أَطْلُبُ بِأَدَبٍ',
      who: {
        name: 'جَدِّي',
        gen: 'جَدِّي',
        char: L1CH.grandpa,
        at: [23, 11]
      },
      scene: G(`أَهْلًا يَا ${NM}! جَدُّكَ فِي الْبَيْتِ يَسْأَلُكَ عَنْ يَوْمِكَ، وَأَنْتَ جَائِعٌ. احْكِ لَهُ، وَاطْلُبْ بِأَدَبٍ.`, `أَهْلًا يَا ${NM}! جَدُّكِ فِي الْبَيْتِ يَسْأَلُكِ عَنْ يَوْمِكِ، وَأَنْتِ جَائِعَةٌ. احْكِي لَهُ، وَاطْلُبِي بِأَدَبٍ.`),
      turns: [{
        n: G(`السَّلَامُ عَلَيْكُمْ يَا ${NM}. مَاذَا تَفْعَلُ فِي الصَّبَاحِ؟`, `السَّلَامُ عَلَيْكُمْ يَا ${NM}. مَاذَا تَفْعَلِينَ فِي الصَّبَاحِ؟`),
        me: ['wake', 'pray']
      }, {
        n: G('وَبَعْدَ الْأَكْلِ؟', 'وَبَعْدَ الْأَكْلِ؟'),
        me: ['go']
      }, {
        n: G('وَبَعْدَ الْمَدْرَسَةِ؟', 'وَبَعْدَ الْمَدْرَسَةِ؟'),
        me: ['play']
      }, {
        n: G('بِمَاذَا تَشْعُرُ الْآنَ؟', 'بِمَاذَا تَشْعُرِينَ الْآنَ؟'),
        me: ['hungry', 'want']
      }, {
        n: 'تَفَضَّلْ.',
        me: ['bism']
      }, {
        n: 'صَحَّةً وَعَافِيَةً.',
        me: ['hamd', 'thirsty']
      }, {
        n: 'خُذْ. وَمَتَى تَنَامُ؟',
        me: ['sleep']
      }, {
        n: G('بَارَكَ اللَّهُ فِيكَ.', 'بَارَكَ اللَّهُ فِيكِ.'),
        me: []
      }],
      narr: ['wake', 'pray', 'go', 'play', 'hungry', 'want', 'bism', 'hamd', 'thirsty', 'sleep'],
      units: [7, 8],
      final: G('احْكِ يَوْمَكَ كُلَّهُ مِنْ أَوَّلِهِ، وَفِي وَسَطِهِ اطْلُبْ طَعَامَكَ بِأَدَبٍ.', 'احْكِي يَوْمَكِ كُلَّهُ مِنْ أَوَّلِهِ، وَفِي وَسَطِهِ اطْلُبِي طَعَامَكِ بِأَدَبٍ.'),
      values: 'الطَّلَبُ بِأَدَبٍ · آدَابُ الطَّعَامِ · تَنْظِيمُ الْوَقْتِ'
    }
  };
  const cfg = CFG[rid] || CFG2[rid] || CFG.rA;
  const order = cfg.narr;
  const say = (id, ti) => {
    const t = cfg.turns[ti];
    return t && t.pre && t.me[0] === id ? t.pre + S[id].t : S[id].t;
  };
  const pickU = {
      picks: []
    },
    pickUnit = {};
  cfg.units.forEach(u => {
    const UU = buildUnit(u, P, u === 3 || u === 5 ? fr : pk(u));
    UU.picks.forEach(p => {
      if (!pickUnit[p.k]) {
        pickU.picks.push(p);
        pickUnit[p.k] = u;
      }
    });
  });
  const mergedPicks = Object.assign({}, ...cfg.units.map(u => u === 3 || u === 5 ? fr : pk(u)));
  const D = {
    S,
    order,
    turns: cfg.turns,
    say,
    narr: cfg.narr,
    NM,
    nm,
    fn,
    pickU,
    pickUnit,
    mergedPicks,
    am,
    title: cfg.title,
    fns: cfg.fns,
    values: cfg.values,
    finalMsg: cfg.final,
    write: cfg.write ? cfg.write.map(id => S[id].t) : null,
    rid
  };
  D.npcs = {
    read: {
      name: G('الْمُعَلِّمُ', 'الْمُعَلِّمَةُ'),
      gen: G('الْمُعَلِّمِ', 'الْمُعَلِّمَةِ'),
      char: G(L1CH.teacherM, L1CH.teacherF),
      at: [36, 17],
      intro: cfg.scene
    },
    tower: {
      name: G('زَيْد', 'سَلْمَى'),
      gen: G('زَيْد', 'سَلْمَى'),
      char: G(L1CH.zaid, L1CH.salma),
      at: [18, 22],
      intro: G('تَعَالَ نَبْنِ بُرْجًا! كُلُّ جُمْلَةٍ تَقْرَؤُهَا صَحِيحَةً تَصِيرُ طَابِقًا.', 'تَعَالَيْ نَبْنِ بُرْجًا! كُلُّ جُمْلَةٍ تَقْرَئِينَهَا صَحِيحَةً تَصِيرُ طَابِقًا.')
    },
    talk: {
      ...cfg.who,
      intro: null
    }
  };
  return D;
}
function R3Sim({
  D,
  setPick,
  onDone
}) {
  const [stage, setStage] = useState('pick');
  const steps = useMemo(() => D.turns.flatMap((t, ti) => t.me.map(id => ({
    id,
    ti
  }))), [D]);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (stage === 'read' && i < steps.length) {
      const st = steps[i],
        t = D.turns[st.ti];
      const first = D.turns[st.ti].me[0] === st.id;
      setTimeout(() => speak(plain(first && t.n ? t.n + ' ' : '') + plain(D.say(st.id, st.ti))), 250);
    }
  }, [stage, i]);
  if (stage === 'pick') return React.createElement(PickPanel, {
    U: D.pickU,
    picks: D.mergedPicks,
    setPick: setPick,
    onDone: () => setStage('read')
  });
  if (i >= steps.length) return React.createElement("div", {
    className: "col",
    style: {
      gap: 10
    }
  }, React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 19
    }
  }, G('الْآنَ اقْرَأِ الْحِوَارَ كُلَّهُ: أَنْتَ تَقْرَأُ جُمَلَكَ، وَالْمُعَلِّمُ يَقْرَأُ جُمَلَ الْجَارِ.', 'الْآنَ اقْرَئِي الْحِوَارَ كُلَّهُ: أَنْتِ تَقْرَئِينَ جُمَلَكِ، وَالْمُعَلِّمَةُ تَقْرَأُ جُمَلَ الْجَارِ.')), React.createElement("div", {
    className: "r3chat"
  }, D.turns.map((t, ti) => React.createElement(React.Fragment, {
    key: ti
  }, t.n && React.createElement("div", {
    className: "bub them"
  }, React.createElement("div", {
    className: "who naskh"
  }, D.npcs.talk.name), React.createElement(TT, {
    text: t.n
  })), t.me.length > 0 && React.createElement("div", {
    className: "bub me"
  }, React.createElement("div", {
    className: "who naskh"
  }, G('أَنَا', 'أَنَا')), t.me.map(id => React.createElement("div", {
    key: id,
    className: "r3l"
  }, React.createElement(VView, {
    v: D.S[id],
    s: 2.2
  }), React.createElement(TT, {
    text: D.say(id, ti)
  }))))))), React.createElement("div", {
    className: "row center"
  }, React.createElement("button", {
    className: "btn lg",
    onClick: () => {
      sfx.win();
      onDone();
    }
  }, "\u2713 \u0642\u064E\u0631\u064E\u0623\u0652\u062A\u064F \u0627\u0644\u0652\u062D\u0650\u0648\u064E\u0627\u0631\u064E")));
  const st = steps[i],
    t = D.turns[st.ti],
    l = D.S[st.id];
  return React.createElement("div", {
    className: "col center",
    style: {
      gap: 12
    }
  }, React.createElement(L1Dots, {
    n: steps.length,
    i: i
  }), React.createElement("div", {
    className: "steps naskh"
  }, React.createElement("span", {
    className: "on"
  }, "\u0661. ", G('اسْمَعْ', 'اسْمَعِي')), React.createElement("span", null, "\u2190"), React.createElement("span", {
    className: "on"
  }, "\u0662. ", G('اقْرَأْ مِثْلَهُ', 'اقْرَئِي مِثْلَهُ'))), t.n ? React.createElement("div", {
    className: "row center",
    style: {
      gap: 8,
      alignItems: 'flex-end'
    }
  }, React.createElement(CharImg, {
    def: D.npcs.talk.char,
    s: 3
  }), React.createElement("div", {
    className: "bub them",
    style: {
      maxWidth: 560
    }
  }, React.createElement("div", {
    className: "who naskh"
  }, D.npcs.talk.name), React.createElement(TT, {
    text: t.n
  }))) : React.createElement("span", {
    className: "pill naskh"
  }, G('أَنْتَ تَبْدَأُ بِالسَّلَامِ', 'أَنْتِ تَبْدَئِينَ بِالسَّلَامِ')), React.createElement(VView, {
    v: l,
    s: 6
  }), React.createElement("div", {
    className: "say-line"
  }, React.createElement(TT, {
    text: D.say(st.id, st.ti)
  })), React.createElement("div", {
    className: "row wrapf center",
    style: {
      gap: 10
    }
  }, React.createElement(SpeakBtn, {
    text: D.say(st.id, st.ti),
    label: G('اسْمَعْ مَرَّةً أُخْرَى', 'اسْمَعِي مَرَّةً أُخْرَى')
  }), React.createElement("button", {
    className: "btn lg",
    onClick: () => {
      sfx.ok();
      setI(i + 1);
    }
  }, "\u2713 \u0642\u064E\u0631\u064E\u0623\u0652\u062A\u064F\u0647\u064E\u0627 \u0645\u0650\u062B\u0652\u0644\u064E\u0647\u064F")), React.createElement("div", {
    className: "naskh small",
    style: {
      opacity: .8
    }
  }, G('انْقُرْ أَيَّ كَلِمَةٍ لِتَسْمَعَهَا.', 'انْقُرِي أَيَّ كَلِمَةٍ لِتَسْمَعِيهَا.')));
}
function R3Tower({
  D,
  onDone
}) {
  const order = useMemo(() => L1_SHUF(D.order), [D]);
  const [floors, setFloors] = useState([]);
  const [msg, setMsg] = useState('');
  const [shake, setShake] = useState(false);
  const left = order.filter(id => !floors.includes(id));
  const cur = left[0];
  const tower = React.createElement("div", {
    className: "r3tower"
  }, left.length === 0 && React.createElement("div", {
    className: "r3flag"
  }, React.createElement(Icon, {
    n: "star",
    s: 4
  })), [...floors].reverse().map((id, k) => React.createElement("div", {
    key: id,
    className: 'r3floor' + (k === 0 ? ' drop' : '')
  }, React.createElement(VView, {
    v: D.S[id],
    s: 1.8
  }), React.createElement("span", {
    className: "naskh"
  }, plain(D.S[id].t)))), React.createElement("div", {
    className: "r3ground"
  }));
  if (!cur) return React.createElement("div", {
    className: "r3wrap"
  }, React.createElement("div", {
    className: "col center",
    style: {
      gap: 10
    }
  }, React.createElement(Icon, {
    n: "star",
    s: 6
  }), React.createElement("div", {
    className: "h2 naskh"
  }, G('بَنَيْتَ الْبُرْجَ كُلَّهُ!', 'بَنَيْتِ الْبُرْجَ كُلَّهُ!')), React.createElement("button", {
    className: "btn lg",
    onClick: onDone
  }, "\u0627\u0646\u0652\u062A\u064E\u0647\u064E\u064A\u0652\u062A\u064F")), tower);
  const l = D.S[cur];
  return React.createElement("div", {
    className: "r3wrap"
  }, React.createElement("div", {
    className: "col center",
    style: {
      gap: 12
    }
  }, React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 19,
      textAlign: 'center'
    }
  }, G('اقْرَأِ الْجُمْلَةَ بِصَوْتٍ عَالٍ. إِنْ قَرَأْتَهَا صَحِيحَةً، صَارَتْ طَابِقًا فِي الْبُرْجِ.', 'اقْرَئِي الْجُمْلَةَ بِصَوْتٍ عَالٍ. إِنْ قَرَأْتِهَا صَحِيحَةً، صَارَتْ طَابِقًا فِي الْبُرْجِ.')), React.createElement("div", {
    className: 'r3block' + (shake ? ' shake' : ''),
    key: cur
  }, React.createElement(VView, {
    v: l,
    s: 4
  }), React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 30
    }
  }, React.createElement(TT, {
    text: l.t
  }))), React.createElement(L1Bar, {
    onGrade: g => {
      if (g === 'full') {
        sfx.ok();
        setMsg('');
        setFloors(f => [...f, cur]);
      } else if (g === 'switch') {
        sfx.bad();
        setShake(true);
        setTimeout(() => setShake(false), 450);
        setMsg(G('جَاءَتْ كَلِمَةٌ عَامِّيَّةٌ. اقْرَأْهَا مَرَّةً أُخْرَى بِالْفُصْحَى.', 'جَاءَتْ كَلِمَةٌ عَامِّيَّةٌ. اقْرَئِيهَا مَرَّةً أُخْرَى بِالْفُصْحَى.'));
      } else {
        speak(plain(l.t));
        setMsg(G('اسْمَعْهَا، ثُمَّ اقْرَأْهَا مِثْلَهُ.', 'اسْمَعِيهَا، ثُمَّ اقْرَئِيهَا مِثْلَهُ.'));
      }
    }
  }), msg && React.createElement("div", {
    className: "warnline"
  }, msg)), tower);
}
function R3Talk({
  D,
  start,
  harvest,
  onHarvest,
  onDone
}) {
  const [stage, setStage] = useState(start || 'dialog');
  const [ti, setTi] = useState(0);
  const [miss, setMiss] = useState(0);
  const [msg, setMsg] = useState('');
  const t = D.turns[ti];
  useEffect(() => {
    if (stage === 'dialog' && t && t.n) setTimeout(() => speak(plain(t.n)), 300);
  }, [stage, ti]);
  if (stage === 'dialog') {
    if (!t.me.length) return React.createElement("div", {
      className: "col center",
      style: {
        gap: 12
      }
    }, React.createElement("div", {
      className: "row center",
      style: {
        gap: 8,
        alignItems: 'flex-end'
      }
    }, React.createElement(CharImg, {
      def: D.npcs.talk.char,
      s: 3.4
    }), React.createElement("div", {
      className: "bub them"
    }, React.createElement("div", {
      className: "who naskh"
    }, D.npcs.talk.name), React.createElement("span", {
      style: {
        fontSize: 24
      }
    }, React.createElement(TT, {
      text: t.n
    })))), React.createElement(DoneBox, {
      msg: G('تَكَلَّمْتَ بِلَا قَرَائِنَ!', 'تَكَلَّمْتِ بِلَا قَرَائِنَ!'),
      label: "\u0627\u0644\u0652\u0622\u0646\u064E \u0627\u0644\u0652\u0643\u064E\u0644\u064E\u0627\u0645\u064F \u0643\u064F\u0644\u064F\u0651\u0647\u064F",
      onDone: () => {
        setMsg('');
        setStage('final');
      }
    }));
    const next = () => {
      onHarvest(t.me);
      setMiss(0);
      setMsg('');
      setTi(ti + 1);
    };
    return React.createElement("div", {
      className: "col center",
      style: {
        gap: 12
      }
    }, React.createElement("span", {
      className: "pill naskh"
    }, G('حِوَارٌ: لَا نَصَّ، وَلَا كَلِمَاتٍ مُسَاعِدَةً', 'حِوَارٌ: لَا نَصَّ، وَلَا كَلِمَاتٍ مُسَاعِدَةً')), React.createElement(L1Dots, {
      n: D.turns.length - 1,
      i: ti
    }), t.n ? React.createElement("div", {
      className: "row center",
      style: {
        gap: 8,
        alignItems: 'flex-end'
      }
    }, React.createElement(CharImg, {
      def: D.npcs.talk.char,
      s: 3.4
    }), React.createElement("div", {
      className: "bub them",
      style: {
        maxWidth: 560
      }
    }, React.createElement("div", {
      className: "who naskh"
    }, D.npcs.talk.name), React.createElement("span", {
      style: {
        fontSize: 24
      }
    }, React.createElement(TT, {
      text: t.n
    })))) : React.createElement("div", {
      className: "row center",
      style: {
        gap: 8,
        alignItems: 'flex-end'
      }
    }, React.createElement(CharImg, {
      def: D.npcs.talk.char,
      s: 3.4
    }), React.createElement("div", {
      className: "say-line sm naskh"
    }, G('هُوَ أَمَامَكَ. ابْدَأْ أَنْتَ.', 'هُوَ أَمَامَكِ. ابْدَئِي أَنْتِ.'))), t.n && React.createElement(SpeakBtn, {
      text: t.n,
      label: G('اسْمَعِ الْجَارَ', 'اسْمَعِي الْجَارَ')
    }), React.createElement("div", {
      className: "r3answer"
    }, miss >= 2 ? React.createElement("div", {
      className: "row center",
      style: {
        gap: 10
      }
    }, t.me.map(id => React.createElement(VView, {
      key: id,
      v: D.S[id],
      s: 4
    }))) : React.createElement("span", {
      className: "naskh hid"
    }, G('جَوَابُكَ…', 'جَوَابُكِ…'))), React.createElement(L1Bar, {
      onGrade: g => {
        if (g === 'full') {
          sfx.ok();
          next();
        } else if (g === 'switch') {
          sfx.bad();
          setMsg(G('جَاءَتْ كَلِمَةٌ عَامِّيَّةٌ. قُلْهَا مَرَّةً أُخْرَى بِالْفُصْحَى.', 'جَاءَتْ كَلِمَةٌ عَامِّيَّةٌ. قُولِيهَا مَرَّةً أُخْرَى بِالْفُصْحَى.'));
        } else {
          const m = miss + 1;
          setMiss(m);
          if (t.n) speak(plain(t.n));
          setMsg(m >= 2 ? G('انْظُرْ إِلَى الصُّورَةِ فَقَطْ، وَقُلِ الْجُمْلَةَ.', 'انْظُرِي إِلَى الصُّورَةِ فَقَطْ، وَقُولِي الْجُمْلَةَ.') : G('خُذْ نَفَسًا، وَاسْمَعِ الْجَارَ مَرَّةً أُخْرَى.', 'خُذِي نَفَسًا، وَاسْمَعِي الْجَارَ مَرَّةً أُخْرَى.'));
        }
      }
    }), msg && React.createElement("div", {
      className: "warnline"
    }, msg));
  }
  return React.createElement(R3Final, {
    D: D,
    harvest: harvest,
    onHarvest: onHarvest,
    onDone: onDone
  });
}
function R3Final({
  D,
  harvest,
  onHarvest,
  onDone
}) {
  const [lvl, setLvl] = useState({});
  const [msg, setMsg] = useState('');
  const tap = id => {
    const v = (lvl[id] || 0) + 1;
    if (v > 2) return;
    setLvl({
      ...lvl,
      [id]: v
    });
    if (v === 2) speak(plain(D.S[id].t));
  };
  const used = Object.keys(lvl).length;
  return React.createElement("div", {
    className: "col",
    style: {
      gap: 12
    }
  }, React.createElement("div", {
    className: "row",
    style: {
      gap: 10,
      alignItems: 'flex-end'
    }
  }, React.createElement(CharImg, {
    def: D.npcs.talk.char,
    s: 3
  }), React.createElement("div", {
    className: "bub them grow",
    style: {
      maxWidth: '100%'
    }
  }, React.createElement("div", {
    className: "who naskh"
  }, D.npcs.talk.name), React.createElement("span", {
    style: {
      fontSize: 22
    }
  }, React.createElement(TT, {
    text: D.finalMsg
  })))), React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 18
    }
  }, G('قُلْ كُلَّ شَيْءٍ مُتَّصِلًا. السُّطُورُ مُغْلَقَةٌ: إِنْ تَعَثَّرْتَ، انْقُرِ السَّطْرَ مَرَّةً لِتَرَى صُورَتَهُ، وَمَرَّتَيْنِ لِتَرَى جُمْلَتَهُ.', 'قُولِي كُلَّ شَيْءٍ مُتَّصِلًا. السُّطُورُ مُغْلَقَةٌ: إِنْ تَعَثَّرْتِ، انْقُرِي السَّطْرَ مَرَّةً لِتَرَيْ صُورَتَهُ، وَمَرَّتَيْنِ لِتَرَيْ جُمْلَتَهُ.')), React.createElement("div", {
    className: "readbox"
  }, D.narr.map((id, k) => {
    const v = lvl[id] || 0,
      l = D.S[id];
    return React.createElement("div", {
      key: id,
      className: 'rline' + (v ? ' hl' : ' shut'),
      onClick: () => tap(id)
    }, React.createElement("span", {
      className: 'lnum' + (harvest.includes(id) ? ' got' : '')
    }, L1_AR(k + 1)), v >= 1 ? React.createElement(VView, {
      v: l,
      s: 2.6
    }) : null, v >= 2 ? React.createElement(TT, {
      text: l.t
    }) : React.createElement("span", {
      className: "naskh hid"
    }, "\xB7 \xB7 \xB7 \xB7 \xB7"));
  })), React.createElement("div", {
    className: "naskh small",
    style: {
      textAlign: 'center',
      opacity: .8
    }
  }, used === 0 ? 'بِلَا مُسَاعَدَةٍ: مُمْتَازٌ!' : 'سُطُورٌ فُتِحَتْ: ' + L1_AR(used)), React.createElement(L1Bar, {
    onGrade: g => {
      if (g === 'full') {
        sfx.win();
        onHarvest(D.narr);
        onDone();
      } else {
        sfx.bad();
        setMsg(g === 'switch' ? G('جَاءَتْ كَلِمَةٌ عَامِّيَّةٌ. أَعِدِ الْجُمْلَةَ بِالْفُصْحَى.', 'جَاءَتْ كَلِمَةٌ عَامِّيَّةٌ. أَعِيدِي الْجُمْلَةَ بِالْفُصْحَى.') : G('خُذْ نَفَسًا، وَانْقُرِ السَّطْرَ الَّذِي تَعَثَّرْتَ فِيهِ.', 'خُذِي نَفَسًا، وَانْقُرِي السَّطْرَ الَّذِي تَعَثَّرْتِ فِيهِ.'));
      }
    }
  }), msg && React.createElement("div", {
    className: "warnline"
  }, msg));
}
function L1Review({
  rid,
  P,
  picks,
  prog,
  setPick,
  markDone,
  addH,
  reset,
  onBack,
  onStudents
}) {
  const D = useMemo(() => buildReview(rid, P, picks), [rid, P, picks, GEN]);
  const gBank = useMemo(() => l1ReviewBank(D), [D]);
  const harvest = (picks && picks[rid] || {}).harvest || [];
  const [panel, setPanel] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [cert, setCert] = useState(false);
  const [games, setGames] = useState(false);
  const [wrote, setWrote] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [qOpen, setQOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 720);
  const worldCtl = useRef(null);
  const toast = m => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(''), 1900);
  };
  const isDone = k => prog.includes(k);
  const nextSt = R3_ST.find(s => !isDone(s.k));
  const SAY = G('تَكَلَّمْ مَعَ ', 'تَكَلَّمِي مَعَ ');
  const ents = ['read', 'tower', 'talk'].map(id => {
    const n = D.npcs[id];
    return {
      id,
      char: n.char,
      at: n.at,
      name: n.name,
      say: SAY + n.gen
    };
  });
  const keyOf = who => (R3_ST.find(s => s.who === who) || {}).k;
  const needs = id => !isDone(keyOf(id));
  const finish = k => {
    setPanel(null);
    markDone(k);
    toast(G('أَحْسَنْتَ! انْتَهَتِ الْمَحَطَّةُ', 'أَحْسَنْتِ! انْتَهَتِ الْمَحَطَّةُ'));
  };
  const goSt = (who, stage) => {
    const n = D.npcs[who];
    if (worldCtl.current) worldCtl.current.go(n.at[0], n.at[1]);
    setDrawer(false);
    setPanel(null);
    setTimeout(() => setPanel({
      who,
      stage
    }), 300);
  };
  const setPk = (k, v) => setPick(D.pickUnit[k], k, v);
  const renderPanel = () => {
    if (!panel) return null;
    const close = () => setPanel(null),
      who = panel.who,
      npc = D.npcs[who];
    const st = R3_ST.find(s => s.who === who);
    return React.createElement(L1Panel, {
      npc: npc,
      station: st.t,
      onClose: close,
      intro: npc.intro
    }, who === 'read' && React.createElement(R3Sim, {
      D: D,
      setPick: setPk,
      onDone: () => finish('sim')
    }), who === 'tower' && React.createElement(R3Tower, {
      D: D,
      onDone: () => finish('tower')
    }), who === 'talk' && React.createElement(R3Talk, {
      D: D,
      start: panel.stage,
      harvest: harvest,
      onHarvest: addH,
      onDone: () => {
        finish('talk');
        setCert(true);
      }
    }));
  };
  const C = {
    girl: P.g === 'f',
    old: false,
    me: G(L1CH.boy, L1CH.girl),
    roof: '#7442b8',
    kids: []
  };
  const signs = [{
    x: 28,
    w: 6,
    ic: 'tag'
  }, {
    x: 35,
    w: 6,
    ic: 'friends'
  }, {
    x: 42,
    w: 7,
    ic: 'hand'
  }];
  return React.createElement("div", null, React.createElement("div", {
    className: "topbar",
    style: {
      height: 56
    }
  }, React.createElement("div", {
    className: "row between",
    style: {
      height: '100%',
      padding: '0 12px'
    }
  }, React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn ghost sm",
    onClick: onBack
  }, "\u0627\u0644\u0652\u0645\u064F\u062F\u064F\u0646\u064F"), React.createElement("div", null, React.createElement("b", {
    className: "naskh",
    style: {
      fontSize: 18
    }
  }, D.title), React.createElement("div", {
    className: "small naskh hide-sm",
    style: {
      lineHeight: 1.1,
      opacity: .75
    }
  }, D.fns))), React.createElement("button", {
    className: "btn sm",
    onClick: () => {
      setPanel(null);
      setGames(true);
    }
  }, "\u0645\u064E\u062F\u0650\u064A\u0646\u064E\u0629\u064F \u0627\u0644\u0652\u0623\u064E\u0644\u0652\u0639\u064E\u0627\u0628\u0650"), React.createElement("button", {
    className: "btn ghost sm",
    onClick: () => setDrawer(true)
  }, "\u0627\u0644\u0652\u0645\u064F\u0639\u064E\u0644\u0650\u0651\u0645\u064F"))), React.createElement(L1World, {
    key: 'r3' + GEN,
    C: C,
    ents: ents,
    signs: signs,
    paused: !!panel || drawer || cert || games,
    onInteract: id => setPanel({
      who: id
    }),
    needs: needs,
    quest: nextSt ? nextSt.who : null,
    ctl: worldCtl
  }), React.createElement("div", {
    className: 'qlog naskh' + (qOpen ? '' : ' shut'),
    style: {
      position: 'fixed',
      top: 'calc(66px + env(safe-area-inset-top,0px))',
      zIndex: 30
    }
  }, React.createElement("button", {
    className: "qhead",
    onClick: () => setQOpen(!qOpen)
  }, React.createElement("b", null, "\u0645\u064E\u062D\u064E\u0637\u064E\u0651\u0627\u062A\u064F \u0627\u0644\u0652\u0645\u064F\u0631\u064E\u0627\u062C\u064E\u0639\u064E\u0629\u0650"), React.createElement("span", {
    className: "qtog"
  }, qOpen ? '▴' : '▾')), qOpen && R3_ST.map(s => {
    const d = isDone(s.k),
      nx = nextSt && nextSt.k === s.k;
    return React.createElement("button", {
      key: s.k,
      className: 'qi qgo' + (d ? ' done' : '') + (nx ? ' next' : ''),
      onClick: () => goSt(s.who)
    }, React.createElement("span", null, d ? '✓' : nx ? '◀' : '·', " ", s.t), React.createElement("span", {
      className: "qarrow"
    }, "\u0627\u0630\u0652\u0647\u064E\u0628\u0652"));
  })), React.createElement("div", {
    className: "harvest"
  }, React.createElement("div", {
    className: "row",
    style: {
      gap: 8,
      maxWidth: 1180,
      margin: '0 auto'
    }
  }, React.createElement("span", {
    className: "small naskh",
    style: {
      fontWeight: 800,
      whiteSpace: 'nowrap'
    }
  }, "\u0634\u064E\u0631\u0650\u064A\u0637\u064F \u0627\u0644\u0652\u062D\u064E\u0635\u064E\u0627\u062F\u0650"), React.createElement("div", {
    className: "hv grow"
  }, D.order.map(id => {
    const l = D.S[id];
    return React.createElement("div", {
      key: id,
      className: 'hslot' + (harvest.includes(id) ? ' on' : ''),
      title: plain(l.t)
    }, React.createElement(VView, {
      v: l,
      s: 1.6
    }), React.createElement("span", {
      className: "naskh"
    }, l.key));
  })))), renderPanel(), drawer && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "modal-bg",
    style: {
      background: 'rgba(0,0,0,.35)'
    },
    onClick: () => setDrawer(false)
  }), React.createElement("div", {
    className: "drawer"
  }, React.createElement("div", {
    className: "row between"
  }, React.createElement("div", {
    className: "h2"
  }, "\u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u0639\u0644\u0645"), React.createElement("button", {
    className: "btn ghost sm",
    onClick: () => setDrawer(false)
  }, "\u0625\u063A\u0644\u0627\u0642")), React.createElement("div", {
    className: "card",
    style: {
      marginTop: 12
    }
  }, React.createElement("b", null, "\u0627\u0630\u0647\u0628 \u0625\u0644\u0649 \u0645\u062D\u0637\u0629"), React.createElement("div", {
    className: "mute small"
  }, "\u064A\u0646\u062A\u0642\u0644 \u0627\u0644\u0637\u0627\u0644\u0628 \u0625\u0644\u0649 \u0635\u0627\u062D\u0628 \u0627\u0644\u0645\u062D\u0637\u0629 \u0648\u062A\u064F\u0641\u062A\u062D \u0645\u0628\u0627\u0634\u0631\u0629."), React.createElement("div", {
    className: "row wrapf",
    style: {
      gap: 6,
      marginTop: 8
    }
  }, R3_ST.map(s => React.createElement("button", {
    key: s.k,
    className: "chip naskh",
    onClick: () => goSt(s.who)
  }, isDone(s.k) ? '✓ ' : '', s.t)), React.createElement("button", {
    className: "chip naskh",
    onClick: () => goSt('talk', 'final')
  }, "\u0627\u0644\u0652\u0643\u064E\u0644\u064E\u0627\u0645\u064F \u0643\u064F\u0644\u064F\u0651\u0647\u064F (\u0627\u0644\u0633\u064E\u0651\u0631\u0652\u062F\u064F)"))), React.createElement("div", {
    className: "card",
    style: {
      marginTop: 12
    }
  }, React.createElement("b", null, "\u0647\u0630\u0647 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629"), React.createElement("div", {
    className: "small"
  }, "\u0627\u0644\u0645\u0648\u0642\u0641: ", React.createElement("span", {
    className: "naskh"
  }, D.npcs.read.intro)), React.createElement("div", {
    className: "small"
  }, "\u0627\u0644\u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A \u0647\u064A \u0627\u062E\u062A\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0637\u0627\u0644\u0628 \u0646\u0641\u0633\u0647\u0627 \u0641\u064A \u0645\u062F\u0646 \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629\u060C \u0648\u062A\u064F\u0639\u062F\u064E\u0651\u0644 \u0641\u064A \u0623\u0648\u0644 \u0645\u062D\u0637\u0629 \u0627\u0644\u0642\u0631\u0627\u0621\u0629."), React.createElement("div", {
    className: "row wrapf",
    style: {
      gap: 6,
      marginTop: 8
    }
  }, React.createElement("button", {
    className: "btn ghost sm",
    onClick: () => {
      reset();
      setDrawer(false);
      toast('بدأت المراجعة من جديد');
    }
  }, "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u0631\u0627\u062C\u0639\u0629"), React.createElement("button", {
    className: "btn ghost sm",
    onClick: () => {
      setDrawer(false);
      onStudents();
    }
  }, "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0637\u0627\u0644\u0628"))))), cert && D.write && !wrote ? React.createElement("div", {
    className: "panel-bg"
  }, React.createElement("div", {
    className: "panel col",
    style: {
      gap: 12,
      maxWidth: 820
    }
  }, React.createElement(R3WriteBox, {
    D: D,
    onDone: () => setWrote(true)
  }))) : cert && React.createElement("div", {
    className: "panel-bg"
  }, React.createElement("div", {
    className: "panel col",
    style: {
      gap: 12,
      maxWidth: 820
    }
  }, React.createElement("div", {
    className: "row center",
    style: {
      gap: 16,
      alignItems: 'flex-end'
    }
  }, React.createElement(Icon, {
    n: "star",
    s: 6
  }), React.createElement(CharImg, {
    def: G(L1CH.boy, L1CH.girl),
    s: 7
  }), React.createElement(CharImg, {
    def: D.npcs.talk.char,
    s: 7
  }), React.createElement(Icon, {
    n: "star",
    s: 6
  })), React.createElement("div", {
    className: "h1 naskh",
    style: {
      textAlign: 'center'
    }
  }, G('أَحْسَنْتَ يَا', 'أَحْسَنْتِ يَا'), " ", React.createElement(TT, {
    text: D.NM
  }), "!"), React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 21,
      textAlign: 'center'
    }
  }, G('أَنْهَيْتَ', 'أَنْهَيْتِ'), " ", D.title, ": ", D.fns, "."), React.createElement("div", {
    className: "papercard"
  }, D.narr.map(id => React.createElement("div", {
    key: id
  }, React.createElement(TT, {
    text: D.S[id].t
  })))), React.createElement("div", {
    className: "naskh",
    style: {
      textAlign: 'center',
      fontSize: 18
    }
  }, "\u0627\u0644\u0652\u0642\u0650\u064A\u064E\u0645\u064F: ", D.values), React.createElement("div", {
    className: "row center",
    style: {
      gap: 10
    }
  }, React.createElement("button", {
    className: "btn ghost",
    onClick: () => setCert(false)
  }, "\u0639\u064E\u0648\u0652\u062F\u064E\u0629\u064C \u0625\u0650\u0644\u064E\u0649 \u0627\u0644\u0652\u0645\u064E\u062F\u0650\u064A\u0646\u064E\u0629\u0650"), React.createElement("button", {
    className: "btn",
    onClick: () => {
      setCert(false);
      onBack();
    }
  }, "\u0625\u0650\u0644\u064E\u0649 \u0627\u0644\u0652\u0645\u064F\u062F\u064F\u0646\u0650")))), games && React.createElement(GameHub, {
    bank: gBank,
    nm: plain(D.nm),
    title: D.title,
    onClose: () => setGames(false)
  }), React.createElement(Toast, {
    msg: toastMsg
  }));
}
const L1_DEF_P = {
  name: '',
  g: null,
  age: null,
  country: null
};
function L1Panel({
  npc,
  station,
  intro,
  onClose,
  children
}) {
  useEffect(() => {
    const k = e => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', k);
    if (intro) setTimeout(() => speak(plain(intro)), 150);
    return () => window.removeEventListener('keydown', k);
  }, []);
  return React.createElement("div", {
    className: "panel-bg",
    onClick: onClose
  }, React.createElement("div", {
    className: "panel fade",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "panel-head"
  }, React.createElement("div", {
    className: "row"
  }, React.createElement("div", {
    style: {
      background: 'var(--acc-soft)',
      border: '3px solid var(--edge)',
      borderRadius: 8,
      padding: '2px 8px'
    }
  }, React.createElement(CharImg, {
    def: npc.char,
    s: 3
  })), React.createElement("div", null, React.createElement("div", {
    className: "h2 naskh"
  }, npc.name), React.createElement("div", {
    className: "small naskh"
  }, "\u0645\u064E\u062D\u064E\u0637\u064E\u0651\u0629\u064F: ", station))), React.createElement("button", {
    className: "btn sm",
    onClick: onClose
  }, "\u0639\u064E\u0648\u0652\u062F\u064E\u0629\u064C \u0625\u0650\u0644\u064E\u0649 \u0627\u0644\u0652\u0645\u064E\u062F\u0650\u064A\u0646\u064E\u0629\u0650")), React.createElement("div", {
    className: "cycle naskh"
  }, React.createElement("span", null, "\u0627\u0644\u0634\u064E\u0651\u0631\u0652\u062D\u064F"), React.createElement("span", null, "\u0627\u0644\u062A\u064E\u0651\u0645\u064E\u0627\u0631\u0650\u064A\u0646\u064F"), React.createElement("span", null, "\u0627\u0644\u0644\u064F\u0651\u0639\u0652\u0628\u064E\u0629\u064F"), React.createElement("span", {
    className: "go"
  }, "\u0627\u0646\u0652\u0637\u064E\u0644\u0650\u0642\u0652")), intro && React.createElement("div", {
    className: "row",
    style: {
      gap: 8,
      alignItems: 'flex-start',
      marginBottom: 12
    }
  }, React.createElement("div", {
    className: "bub them grow",
    style: {
      maxWidth: '100%',
      fontSize: 22
    }
  }, React.createElement(TT, {
    text: intro
  })), React.createElement("button", {
    className: "btn ghost sm icon-btn",
    onClick: () => speak(plain(intro))
  }, React.createElement(Icon, {
    n: "speaker",
    s: 2.5
  }))), children));
}
const L1_DAY = ts => {
  if (!ts) return '';
  const d = new Date(ts);
  return L1_AR(d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear());
};
const L1_STN = n => n === 0 ? 'لا محطات بعد' : n === 1 ? 'محطة واحدة' : n === 2 ? 'محطتان' : n <= 10 ? L1_AR(n) + ' محطات' : L1_AR(n) + ' محطة';
const L1_NEWID = () => 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function l1LoadProfiles() {
  let list = store.get('l1-profiles', null);
  if (!Array.isArray(list)) {
    list = [];
    const old = store.get('l1-p', null);
    if (old && (old.name || '').trim()) {
      const id = L1_NEWID();
      list.push({
        ...L1_DEF_P,
        ...old,
        id,
        created: Date.now(),
        last: Date.now()
      });
      store.set('l1-data-' + id, l1Migrate({
        prog: store.get('l1-prog', {}),
        picks: store.get('l1-picks', {}),
        unit: 1
      }));
    }
    store.set('l1-profiles', list);
  }
  return list;
}
function l1Where(d) {
  const prog = d && d.prog || {};
  const cnt = n => (prog[n] || []).length,
    full = n => cnt(n) >= L1_ST.length;
  const doneCities = L1_META.filter(m => full(m.n)).length;
  const stations = L1_META.reduce((a, m) => a + cnt(m.n), 0);
  let u = d && typeof d.unit === 'number' && cnt(d.unit) && !full(d.unit) ? d.unit : null;
  if (!u) {
    const m = L1_META.find(m => cnt(m.n) && !full(m.n)) || L1_META.find(m => !full(m.n));
    u = m ? m.n : null;
  }
  const next = u ? L1_ST.find(s => !(prog[u] || []).includes(s.k)) : null;
  return {
    doneCities,
    stations,
    unit: u,
    next,
    started: stations > 0
  };
}
const L1_MIG = {
  1: 2,
  2: 5,
  3: 1,
  4: 7,
  5: 4,
  6: 6,
  7: 8
};
function l1Migrate(d) {
  if (!d) return d;
  if (d.v !== 2 && d.v !== 3) d = l1MigrateV2(d);
  if (d.v === 2) {
    const prog = {
      ...(d.prog || {})
    };
    Object.keys(prog).forEach(k => {
      if (/^\d+$/.test(k) && (prog[k] || []).includes('final') && !prog[k].includes('tower')) prog[k] = [...prog[k], 'tower'];
    });
    d = {
      ...d,
      prog,
      v: 3
    };
  }
  return d;
}
function l1MigrateV2(d) {
  const prog = {},
    picks = {};
  Object.keys(d.prog || {}).forEach(k => {
    const n = L1_MIG[k];
    if (n) prog[n] = d.prog[k];
    if (k === 'r3') prog.rB = d.prog[k];
  });
  Object.keys(d.picks || {}).forEach(k => {
    const n = L1_MIG[k];
    if (n) picks[n] = d.picks[k];
    if (k === 'r3') picks.rB = d.picks[k];
  });
  if (picks[5]) picks[3] = {
    ...picks[5],
    ...(picks[3] || {})
  };
  if (prog[5] && prog[5].length) prog[3] = [];
  const unit = typeof d.unit === 'number' ? L1_MIG[d.unit] || 1 : 1;
  return {
    ...d,
    prog,
    picks,
    unit,
    v: 2
  };
}
function l1ReadData(id) {
  const raw = store.get('l1-data-' + id, {});
  const d = l1Migrate({
    prog: raw.prog || {},
    picks: raw.picks || {},
    unit: raw.unit || 1,
    v: raw.v
  });
  if (raw.v !== 3) store.set('l1-data-' + id, d);
  return {
    id,
    prog: d.prog,
    picks: d.picks,
    unit: d.unit,
    v: 3
  };
}
function App() {
  const [profiles, setProfiles] = useState(l1LoadProfiles);
  const [data, setData] = useState(() => {
    const id = store.get('l1-current', null);
    const list = store.get('l1-profiles', []);
    return id && Array.isArray(list) && list.find(p => p.id === id) ? l1ReadData(id) : null;
  });
  const [screen, setScreen] = useState('students');
  const [draft, setDraft] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const fileRef = useRef(null);
  const P = data && profiles.find(p => p.id === data.id) || L1_DEF_P;
  const prog = data && data.prog || {};
  const picks = data && data.picks || {};
  const setProg = f => setData(d => d && {
    ...d,
    prog: typeof f === 'function' ? f(d.prog) : f
  });
  const setPicks = f => setData(d => d && {
    ...d,
    picks: typeof f === 'function' ? f(d.picks) : f
  });
  const [unit, setUnitRaw] = useState(() => data && data.unit || 1);
  const setUnit = n => {
    setUnitRaw(n);
    setData(d => d && {
      ...d,
      unit: n
    });
  };
  const [panel, setPanel] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [cert, setCert] = useState(false);
  const [games, setGames] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [qOpen, setQOpen] = useState(() => typeof window === 'undefined' || window.innerWidth > 720);
  const worldCtl = useRef(null);
  const scr = !data && screen !== 'lobby' ? 'students' : screen === 'lobby' && !draft ? 'students' : screen;
  GEN = (scr === 'lobby' && draft ? draft.g : P.g) || 'm';
  useEffect(() => store.set('l1-profiles', profiles), [profiles]);
  useEffect(() => {
    if (data) {
      store.set('l1-data-' + data.id, {
        prog: data.prog,
        picks: data.picks,
        unit: data.unit,
        v: 3
      });
      store.set('l1-current', data.id);
    }
  }, [data]);
  useEffect(() => {
    if (data) setProfiles(ps => ps.map(p => p.id === data.id ? {
      ...p,
      last: Date.now()
    } : p));
  }, [data && data.id, data && data.prog]);
  useEffect(() => {
    document.body.className = scr !== 'students' && GEN === 'f' ? 'theme-girl' : 'theme-boy';
  }, [scr, GEN]);
  useEffect(() => {
    const b = document.getElementById('boot');
    if (b) b.style.display = 'none';
    if (window.speechSynthesis) speechSynthesis.getVoices();
  }, []);
  const toast = m => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(''), 1900);
  };
  const numU = typeof unit === 'number' ? unit : 1;
  const unitPicks = numU === 5 ? {
    ...(picks[3] || {}),
    ...(picks[5] || {})
  } : picks[numU] || {};
  const U = useMemo(() => buildUnit(numU, P, unitPicks), [numU, P, picks[3], picks[numU], GEN]);
  const gBank = useMemo(() => l1CityBank(U), [U]);
  const done = prog[unit] || [];
  const isDone = k => done.includes(k);
  const markDone = k => setProg(p => {
    const a = p[unit] || [];
    return a.includes(k) ? p : {
      ...p,
      [unit]: [...a, k]
    };
  });
  const setPick = (k, v) => setPicks(p => ({
    ...p,
    [unit]: {
      ...(p[unit] || {}),
      [k]: v
    }
  }));
  const nextSt = L1_ST.find(s => !isDone(s.k));
  const othersDone = L1_ST.filter(s => s.k !== 'final' && s.k !== 'write').every(s => isDone(s.k));
  const openStudent = id => {
    const d = l1ReadData(id);
    setData(d);
    setUnitRaw(d.unit);
    setPanel(null);
    setDrawer(false);
    setCert(false);
    setConfirmDel(null);
    setScreen('map');
  };
  const newStudent = () => {
    setDraft({
      ...L1_DEF_P
    });
    setScreen('lobby');
  };
  const editStudent = (p, from) => {
    setDraft({
      ...p,
      _from: from || 'students'
    });
    setDrawer(false);
    setScreen('lobby');
  };
  const saveDraft = () => {
    const dr = draft;
    if (dr.id) {
      const {
        _from,
        ...clean
      } = dr;
      setProfiles(ps => ps.map(p => p.id === dr.id ? {
        ...p,
        ...clean
      } : p));
      setDraft(null);
      setScreen(_from === 'map' && data && data.id === dr.id ? 'map' : 'students');
      return;
    }
    const id = L1_NEWID();
    const {
      _from,
      ...clean
    } = dr;
    setProfiles(ps => [...ps, {
      ...clean,
      id,
      created: Date.now(),
      last: Date.now()
    }]);
    store.set('l1-data-' + id, {
      prog: {},
      picks: {},
      unit: 1,
      v: 3
    });
    setDraft(null);
    openStudent(id);
  };
  const delStudent = id => {
    try {
      localStorage.removeItem('tawasul1:l1-data-' + id);
    } catch (e) {}
    setProfiles(ps => ps.filter(p => p.id !== id));
    if (data && data.id === id) {
      setData(null);
      try {
        localStorage.removeItem('tawasul1:l1-current');
      } catch (e) {}
    }
    setConfirmDel(null);
    toast('حُذفت بطاقة الطالب');
  };
  const exportAll = () => {
    try {
      const out = {
        app: 'tawasul-l1',
        v: 1,
        at: new Date().toISOString(),
        profiles,
        data: Object.fromEntries(profiles.map(p => [p.id, store.get('l1-data-' + p.id, {})]))
      };
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], {
        type: 'application/json'
      }));
      a.download = 'tawasul-students-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 800);
      toast('حُفظت النسخة في ملف');
    } catch (e) {
      toast('تعذّر حفظ النسخة');
    }
  };
  const importAll = file => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(r.result);
        if (!j || j.app !== 'tawasul-l1' || !Array.isArray(j.profiles)) throw new Error('bad');
        const ids = new Set(j.profiles.map(p => p.id));
        j.profiles.forEach(p => {
          const d = j.data && j.data[p.id] || {
            prog: {},
            picks: {},
            unit: 1,
            v: 3
          };
          store.set('l1-data-' + p.id, l1Migrate(d));
        });
        if (data && ids.has(data.id)) setData(null);
        setProfiles(ps => [...ps.filter(p => !ids.has(p.id)), ...j.profiles]);
        toast('اكتمل الاسترجاع: ' + L1_AR(j.profiles.length) + ' بطاقة');
      } catch (e) {
        toast('هذا الملف ليس نسخة من تواصل');
      }
    };
    r.readAsText(file);
  };
  if (scr === 'students') {
    const list = [...profiles].sort((a, b) => (b.last || 0) - (a.last || 0));
    return React.createElement("div", null, React.createElement("div", {
      className: "topbar",
      style: {
        height: 56
      }
    }, React.createElement("div", {
      className: "row between",
      style: {
        height: '100%',
        padding: '0 12px'
      }
    }, React.createElement("div", {
      className: "row"
    }, React.createElement("div", {
      className: "logo"
    }, "\u062A"), React.createElement("b", {
      className: "naskh",
      style: {
        fontSize: 19
      }
    }, "\u062A\u064E\u0648\u064E\u0627\u0635\u064F\u0644\u064C: \u0627\u0644\u0652\u0645\u064F\u0633\u0652\u062A\u064E\u0648\u064E\u0649 \u0627\u0644\u0652\u0623\u064E\u0648\u064E\u0651\u0644\u064F")), list.length > 0 && React.createElement("button", {
      className: "btn sm",
      onClick: newStudent
    }, "+ \u0637\u0627\u0644\u0628 \u062C\u062F\u064A\u062F"))), React.createElement("div", {
      className: "wrap fade"
    }, React.createElement("div", {
      className: "col",
      style: {
        gap: 2,
        margin: '6px 0 14px'
      }
    }, React.createElement("div", {
      className: "h2"
    }, "\u0637\u0644\u0627\u0628\u064A"), React.createElement("div", {
      className: "small",
      style: {
        opacity: .85
      }
    }, "\u0627\u062E\u062A\u0631 \u0627\u0644\u0637\u0627\u0644\u0628 \u0627\u0644\u0630\u064A \u0645\u0639\u0643 \u0627\u0644\u0622\u0646\u060C \u0641\u062A\u0641\u062A\u062D \u0627\u0644\u0644\u0639\u0628\u0629 \u0645\u0646 \u062D\u064A\u062B \u062A\u0648\u0642\u0641.")), list.length === 0 && React.createElement("div", {
      className: "card col center",
      style: {
        gap: 10,
        padding: 26,
        textAlign: 'center'
      }
    }, React.createElement("div", {
      className: "row center",
      style: {
        gap: 10
      }
    }, React.createElement(CharImg, {
      def: L1CH.boy,
      s: 5
    }), React.createElement(CharImg, {
      def: L1CH.girl,
      s: 5
    })), React.createElement("b", {
      style: {
        fontSize: 20
      }
    }, "\u0644\u0627 \u064A\u0648\u062C\u062F \u0637\u0644\u0627\u0628 \u0628\u0639\u062F"), React.createElement("div", {
      className: "small"
    }, "\u0623\u0636\u0641 \u0628\u0637\u0627\u0642\u0629 \u0644\u0643\u0644 \u0637\u0627\u0644\u0628\u060C \u0641\u064A\u064F\u062D\u0641\u0638 \u062A\u0642\u062F\u0651\u0645\u0647 \u0648\u062D\u062F\u0647 \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632."), React.createElement("button", {
      className: "btn lg",
      onClick: newStudent
    }, "+ \u0623\u0636\u0641 \u0623\u0648\u0644 \u0637\u0627\u0644\u0628")), React.createElement("div", {
      className: "stgrid"
    }, list.map(p => {
      GEN = p.g || 'm';
      const d = data && data.id === p.id ? data : l1ReadData(p.id),
        w = l1Where(d),
        c = l1Country(p.country);
      return React.createElement("div", {
        key: p.id,
        className: 'stucard' + (p.g === 'f' ? ' f' : '')
      }, React.createElement("div", {
        className: "row",
        style: {
          gap: 10,
          alignItems: 'center'
        }
      }, React.createElement("div", {
        className: "av"
      }, React.createElement(CharImg, {
        def: p.g === 'f' ? L1CH.girl : L1CH.boy,
        s: 3.2
      })), React.createElement("div", {
        className: "col grow",
        style: {
          gap: 0,
          minWidth: 0
        }
      }, React.createElement("b", {
        className: "nm"
      }, p.name), React.createElement("span", {
        className: "small",
        style: {
          opacity: .8
        }
      }, L1_AR(p.age), " \u0633\u0646\u0648\u0627\u062A \xB7 ", stripMarks(c.n)))), React.createElement("div", {
        className: "pips",
        "aria-label": "\u062A\u0642\u062F\u0651\u0645 \u0627\u0644\u0645\u062F\u0646"
      }, L1_META.map(m => {
        const k = (d.prog[m.n] || []).length;
        return React.createElement("span", {
          key: m.n,
          className: 'pip' + (k >= L1_ST.length ? ' full' : '') + (w.unit === m.n && w.started ? ' now' : ''),
          title: 'المدينة ' + L1_AR(m.n) + ': ' + L1_AR(k) + ' من ' + L1_AR(L1_ST.length)
        }, React.createElement("i", {
          style: {
            height: k / L1_ST.length * 100 + '%',
            background: m.color
          }
        }), React.createElement("b", null, L1_AR(m.n)));
      })), React.createElement("div", {
        className: "where"
      }, !w.started ? 'لم يبدأ بعد' : w.unit ? React.createElement(React.Fragment, null, "\u0627\u0644\u0622\u0646: \u0627\u0644\u0645\u062F\u064A\u0646\u0629 ", L1_AR(w.unit), " \xAB", stripMarks(l1Title(w.unit).t), "\xBB", React.createElement("br", null), React.createElement("span", {
        className: "small"
      }, "\u0627\u0644\u0645\u062D\u0637\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629: ", stripMarks(w.next.t))) : 'أنهى المستوى الأول كله'), L1_REVIEWS.filter(r => (d.prog[r.id] || []).length > 0).map(r => React.createElement("div", {
        key: r.id,
        className: "small",
        style: {
          opacity: .85
        }
      }, stripMarks(r.t), ": ", (d.prog[r.id] || []).length >= R3_ST.length ? 'أنهاها ✓' : L1_STN((d.prog[r.id] || []).length) + ' من ٣')), React.createElement("div", {
        className: "small",
        style: {
          opacity: .75
        }
      }, "\u0623\u0646\u0647\u0649 ", L1_AR(w.doneCities), " \u0645\u0646 \u0661\u0666 \u0645\u062F\u064A\u0646\u0629 \xB7 ", L1_STN(w.stations), p.last ? ' · آخر حصة ' + L1_DAY(p.last) : ''), confirmDel === p.id ? React.createElement("div", {
        className: "row wrapf",
        style: {
          gap: 6,
          alignItems: 'center'
        }
      }, React.createElement("span", {
        className: "small"
      }, "\u062D\u0630\u0641 ", p.name, " \u0648\u0643\u0644 \u062A\u0642\u062F\u0651\u0645\u0647\u061F"), React.createElement("button", {
        className: "btn sm danger",
        onClick: () => delStudent(p.id)
      }, "\u0646\u0639\u0645\u060C \u0627\u062D\u0630\u0641"), React.createElement("button", {
        className: "btn ghost sm",
        onClick: () => setConfirmDel(null)
      }, "\u0625\u0644\u063A\u0627\u0621")) : React.createElement("div", {
        className: "row wrapf",
        style: {
          gap: 6
        }
      }, React.createElement("button", {
        className: "btn",
        onClick: () => openStudent(p.id)
      }, w.started ? 'متابعة' : 'ابدأ'), React.createElement("button", {
        className: "btn ghost sm",
        onClick: () => editStudent(p)
      }, "\u062A\u0639\u062F\u064A\u0644"), React.createElement("button", {
        className: "btn ghost sm",
        onClick: () => setConfirmDel(p.id)
      }, "\u062D\u0630\u0641")));
    })), React.createElement("div", {
      className: "backup"
    }, React.createElement("div", {
      className: "small",
      style: {
        flex: '1 1 260px'
      }
    }, "\u0627\u0644\u062A\u0642\u062F\u0651\u0645 \u0645\u062D\u0641\u0648\u0638 \u0641\u064A \u0647\u0630\u0627 \u0627\u0644\u0645\u062A\u0635\u0641\u062D \u0639\u0644\u0649 \u0647\u0630\u0627 \u0627\u0644\u062C\u0647\u0627\u0632. \u0627\u062D\u0641\u0638 \u0646\u0633\u062E\u0629 \u0641\u064A \u0645\u0644\u0641 \u0644\u062A\u0646\u0642\u0644\u0647\u0627 \u0625\u0644\u0649 \u062C\u0647\u0627\u0632 \u0622\u062E\u0631\u060C \u0623\u0648 \u0644\u062A\u0633\u062A\u0631\u062C\u0639\u0647\u0627 \u0625\u0646 \u0645\u064F\u0633\u062D\u062A \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u062A\u0635\u0641\u062D."), React.createElement("div", {
      className: "row wrapf",
      style: {
        gap: 6
      }
    }, React.createElement("button", {
      className: "btn ghost sm",
      disabled: !profiles.length,
      onClick: exportAll
    }, "\u062D\u0641\u0638 \u0646\u0633\u062E\u0629 \u0641\u064A \u0645\u0644\u0641"), React.createElement("button", {
      className: "btn ghost sm",
      onClick: () => fileRef.current && fileRef.current.click()
    }, "\u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0646\u0633\u062E\u0629"), React.createElement("input", {
      ref: fileRef,
      type: "file",
      accept: "application/json,.json",
      style: {
        display: 'none'
      },
      onChange: e => {
        importAll(e.target.files[0]);
        e.target.value = '';
      }
    })))), React.createElement(Toast, {
      msg: toastMsg
    }));
  }
  if (scr === 'lobby') {
    const D = draft,
      setD = v => setDraft(v);
    const ready = D.g && D.age && D.country && (D.name || '').trim();
    return React.createElement("div", {
      className: "wrap fade",
      style: {
        maxWidth: 820
      }
    }, React.createElement("div", {
      className: "row",
      style: {
        marginTop: 10
      }
    }, React.createElement("button", {
      className: "btn ghost sm",
      onClick: () => {
        setDraft(null);
        setScreen(D._from === 'map' && data && D.id === data.id ? 'map' : 'students');
      }
    }, "\u0631\u062C\u0648\u0639")), React.createElement("div", {
      className: "col center",
      style: {
        gap: 6,
        margin: '8px 0 14px'
      }
    }, React.createElement("div", {
      className: "row center",
      style: {
        gap: 12,
        alignItems: 'flex-end'
      }
    }, React.createElement(CharImg, {
      def: L1CH.teacherM,
      s: 6
    }), React.createElement(CharImg, {
      def: D.g === 'f' ? L1CH.girl : L1CH.boy,
      s: 8
    }), React.createElement(CharImg, {
      def: L1CH.grandma,
      s: 6
    })), React.createElement("div", {
      className: "h1 naskh"
    }, "\u062A\u064E\u0648\u064E\u0627\u0635\u064F\u0644\u064C: \u0627\u0644\u0652\u0645\u064F\u0633\u0652\u062A\u064E\u0648\u064E\u0649 \u0627\u0644\u0652\u0623\u064E\u0648\u064E\u0651\u0644\u064F"), React.createElement("div", {
      className: "naskh",
      style: {
        fontSize: 19
      }
    }, "\u062B\u064E\u0645\u064E\u0627\u0646\u0650\u064A \u0645\u064F\u062F\u064F\u0646\u064D. \u0641\u0650\u064A \u0643\u064F\u0644\u0650\u0651 \u0645\u064E\u062F\u0650\u064A\u0646\u064E\u0629\u064D \u0646\u064E\u0627\u0633\u064C \u0646\u064F\u0643\u064E\u0644\u0650\u0651\u0645\u064F\u0647\u064F\u0645\u0652\u060C \u0648\u064E\u0643\u064E\u0644\u0650\u0645\u064E\u0627\u062A\u064C \u0646\u064E\u062A\u064E\u0639\u064E\u0644\u064E\u0651\u0645\u064F\u0647\u064E\u0627.")), React.createElement("div", {
      className: "card col",
      style: {
        gap: 14
      }
    }, React.createElement("b", {
      className: "naskh",
      style: {
        fontSize: 20
      }
    }, "\u0623\u064E\u0646\u064E\u0627:"), React.createElement("div", {
      className: "row wrapf",
      style: {
        gap: 8
      }
    }, [['m', 'وَلَدٌ', L1CH.boy], ['f', 'بِنْتٌ', L1CH.girl]].map(([g, t, ch]) => React.createElement("button", {
      key: g,
      className: 'chip' + (D.g === g ? ' on' : ''),
      onClick: () => setD({
        ...D,
        g
      })
    }, React.createElement(CharImg, {
      def: ch,
      s: 2.4
    }), React.createElement("span", {
      className: "naskh",
      style: {
        fontSize: 20
      }
    }, t)))), React.createElement("b", {
      className: "naskh",
      style: {
        fontSize: 20
      }
    }, D.g === 'f' ? 'اسْمُكِ:' : 'اسْمُكَ:'), React.createElement("input", {
      className: "winput",
      style: {
        maxWidth: 320
      },
      value: D.name,
      onChange: e => setD({
        ...D,
        name: e.target.value
      })
    }), React.createElement("b", {
      className: "naskh",
      style: {
        fontSize: 20
      }
    }, D.g === 'f' ? 'كَمْ عُمْرُكِ؟' : 'كَمْ عُمْرُكَ؟'), React.createElement("div", {
      className: "row wrapf",
      style: {
        gap: 6
      }
    }, [6, 7, 8, 9, 10, 11, 12, 13, 14].map(a => React.createElement("button", {
      key: a,
      className: 'chip' + (D.age === a ? ' on' : ''),
      onClick: () => setD({
        ...D,
        age: a
      })
    }, L1_AR(a)))), React.createElement("b", {
      className: "naskh",
      style: {
        fontSize: 20
      }
    }, D.g === 'f' ? 'مِنْ أَيْنَ أَنْتِ؟' : 'مِنْ أَيْنَ أَنْتَ؟'), React.createElement("div", {
      className: "row wrapf",
      style: {
        gap: 6
      }
    }, L1_COUNTRIES.map(c => React.createElement("button", {
      key: c.id,
      className: 'chip' + (D.country === c.id ? ' on' : ''),
      onClick: () => setD({
        ...D,
        country: c.id
      })
    }, React.createElement("span", {
      className: "naskh",
      style: {
        fontSize: 18
      }
    }, c.n)))), React.createElement("div", {
      className: "row center"
    }, React.createElement("button", {
      className: "btn lg",
      disabled: !ready,
      onClick: saveDraft
    }, D.id ? 'حِفْظُ التَّعْدِيلِ' : 'ادْخُلْ إِلَى الْمُدُنِ'))));
  }
  if (scr === 'map') return React.createElement("div", null, React.createElement("div", {
    className: "topbar",
    style: {
      height: 56
    }
  }, React.createElement("div", {
    className: "row between",
    style: {
      height: '100%',
      padding: '0 12px'
    }
  }, React.createElement("div", {
    className: "row"
  }, React.createElement("div", {
    className: "logo"
  }, "\u062A"), React.createElement("b", {
    className: "naskh",
    style: {
      fontSize: 19
    }
  }, "\u062A\u064E\u0648\u064E\u0627\u0635\u064F\u0644\u064C: \u0627\u0644\u0652\u0645\u064F\u0633\u0652\u062A\u064E\u0648\u064E\u0649 \u0627\u0644\u0652\u0623\u064E\u0648\u064E\u0651\u0644\u064F")), React.createElement("button", {
    className: "btn ghost sm",
    onClick: () => setScreen('students'),
    title: "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0637\u0627\u0644\u0628"
  }, React.createElement(CharImg, {
    def: G(L1CH.boy, L1CH.girl),
    s: 1.6
  }), React.createElement("span", {
    className: "naskh"
  }, P.name), React.createElement("span", {
    className: "small",
    style: {
      opacity: .7
    }
  }, "\xB7 \u0627\u0644\u0637\u0644\u0627\u0628")))), React.createElement("div", {
    className: "wrap fade"
  }, React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 20,
      margin: '6px 0 14px'
    }
  }, G('اخْتَرْ مَدِينَةً، وَتَجَوَّلْ فِيهَا، وَكَلِّمْ أَهْلَهَا.', 'اخْتَارِي مَدِينَةً، وَتَجَوَّلِي فِيهَا، وَكَلِّمِي أَهْلَهَا.')), L1_GROUPS.map(g => {
    const r = L1_REVIEWS.find(x => x.id === g.review),
      rd = (prog[r.id] || []).length;
    return React.createElement(React.Fragment, {
      key: g.n
    }, L1_PARTS[g.n] && React.createElement("div", {
      className: "parthead naskh"
    }, L1_PARTS[g.n]), React.createElement("div", {
      className: "grpbox"
    }, React.createElement("div", {
      className: "grphead naskh"
    }, React.createElement("span", {
      className: "num"
    }, L1_AR(g.n)), React.createElement("b", null, g.t), React.createElement("span", {
      className: "small"
    }, g.cities.length ? "\u0627\u0644\u0652\u0645\u064F\u062F\u064F\u0646\u064F " + g.cities.map(L1_AR).join('، ') + " \u062B\u064F\u0645\u064E\u0651 \u0627\u0644\u0652\u0645\u064F\u0631\u064E\u0627\u062C\u064E\u0639\u064E\u0629\u064F" : G('حِكَايَةٌ وَاحِدَةٌ، ثُمَّ جُمْلَتَانِ بِخَطِّكَ', 'حِكَايَةٌ وَاحِدَةٌ، ثُمَّ جُمْلَتَانِ بِخَطِّكِ'))), React.createElement("div", {
      className: "citygrid"
    }, g.cities.map(n => L1_META[n - 1]).map(m => {
      const t = l1Title(m.n),
        d = (prog[m.n] || []).length,
        all = d >= L1_ST.length;
      return React.createElement("button", {
        key: m.n,
        className: "citycard",
        onClick: () => {
          setUnit(m.n);
          setPanel(null);
          setScreen('city');
        }
      }, React.createElement("span", {
        className: "num",
        style: {
          background: m.color
        }
      }, L1_AR(m.n)), all && React.createElement("span", {
        className: "done"
      }, React.createElement(Icon, {
        n: "star",
        s: 3
      })), React.createElement(Icon, {
        n: m.icon,
        s: 6
      }), React.createElement("div", {
        className: "ct"
      }, t.t), React.createElement("div", {
        className: "cf"
      }, t.fn), React.createElement("div", {
        className: "cr small naskh"
      }, t.rule), React.createElement("div", {
        className: "bar"
      }, React.createElement("i", {
        style: {
          width: d / L1_ST.length * 100 + '%'
        }
      })));
    }), React.createElement("button", {
      className: "citycard rvcard",
      onClick: () => {
        setUnit(r.id);
        setPanel(null);
        setScreen('city');
      }
    }, React.createElement("span", {
      className: "num",
      style: {
        background: r.color
      }
    }, "\u0645"), rd >= R3_ST.length && React.createElement("span", {
      className: "done"
    }, React.createElement(Icon, {
      n: "star",
      s: 3
    })), React.createElement(Icon, {
      n: r.icon,
      s: 6
    }), React.createElement("div", {
      className: "ct"
    }, r.t), React.createElement("div", {
      className: "cf"
    }, r.fn), React.createElement("div", {
      className: "cr small naskh"
    }, "\u0642\u0650\u0631\u064E\u0627\u0621\u064E\u0629\u064F \u0645\u064F\u062D\u064E\u0627\u0643\u064E\u0627\u0629\u064D \u2190 \u0628\u064F\u0631\u0652\u062C\u064C \u2190 \u0643\u064E\u0644\u064E\u0627\u0645\u064C \u0628\u0650\u0644\u064E\u0627 \u0642\u064E\u0631\u064E\u0627\u0626\u0650\u0646\u064E"), React.createElement("div", {
      className: "bar"
    }, React.createElement("i", {
      style: {
        width: rd / R3_ST.length * 100 + '%'
      }
    }))))));
  })), React.createElement(Toast, {
    msg: toastMsg
  }));
  if (typeof unit === 'string' && unit.startsWith('r')) return React.createElement(L1Review, {
    rid: unit,
    P: P,
    picks: picks,
    prog: prog[unit] || [],
    setPick: (u, k, v) => setPicks(p => ({
      ...p,
      [u]: {
        ...(p[u] || {}),
        [k]: v
      }
    })),
    markDone: k => setProg(p => {
      const a = p[unit] || [];
      return a.includes(k) ? p : {
        ...p,
        [unit]: [...a, k]
      };
    }),
    addH: ids => setPicks(p => {
      const r = p[unit] || {},
        h = r.harvest || [];
      const n = [...h, ...ids.filter(x => !h.includes(x))];
      return n.length === h.length ? p : {
        ...p,
        [unit]: {
          ...r,
          harvest: n
        }
      };
    }),
    reset: () => {
      setProg(p => ({
        ...p,
        [unit]: []
      }));
      setPicks(p => ({
        ...p,
        [unit]: {}
      }));
    },
    onBack: () => {
      const w = l1Where(data);
      setUnit(w.unit || 1);
      setScreen('map');
    },
    onStudents: () => setScreen('students')
  });
  const SAY = G('تَكَلَّمْ مَعَ ', 'تَكَلَّمِي مَعَ ');
  const ents = ['host', 'vocab', 'rule', 'hide', 'write', 'clinic', 'qa', 'tower'].map(id => {
    const n = U.npcs[id];
    return {
      id,
      char: n.char,
      at: n.at,
      name: n.name,
      say: SAY + n.gen
    };
  });
  const keysOf = id => L1_ST.filter(s => s.who === id).map(s => s.k);
  const needs = id => id === 'host' ? !isDone('read') || othersDone && !isDone('final') : keysOf(id).some(k => !isDone(k));
  const quest = nextSt ? nextSt.who : null;
  const stOf = k => L1_ST.find(s => s.k === k);
  const finish = k => {
    setPanel(null);
    markDone(k);
    toast(G('أَحْسَنْتَ! انْتَهَتِ الْمَحَطَّةُ', 'أَحْسَنْتِ! انْتَهَتِ الْمَحَطَّةُ'));
  };
  const renderPanel = () => {
    if (!panel) return null;
    const close = () => setPanel(null);
    let key = panel;
    if (panel === 'host') key = !isDone('read') ? 'read' : othersDone ? 'final' : 'remind';else key = keysOf(panel)[0];
    const npc = U.npcs[panel];
    const st = stOf(key === 'remind' ? 'read' : key);
    if (key === 'remind') return React.createElement(L1Panel, {
      npc: npc,
      station: st.t,
      onClose: close,
      intro: G('أَحْسَنْتَ! أَكْمِلِ الْمَحَطَّاتِ، ثُمَّ ارْجِعْ إِلَيَّ لِتَحْكِيَ كُلَّ شَيْءٍ.', 'أَحْسَنْتِ! أَكْمِلِي الْمَحَطَّاتِ، ثُمَّ ارْجِعِي إِلَيَّ لِتَحْكِيَ كُلَّ شَيْءٍ.')
    }, React.createElement("div", {
      className: "col",
      style: {
        gap: 8
      }
    }, L1_ST.filter(s => s.k !== 'final' && s.k !== 'write').map(s => React.createElement("div", {
      key: s.k,
      className: "naskh",
      style: {
        fontSize: 20,
        opacity: isDone(s.k) ? .5 : 1
      }
    }, isDone(s.k) ? '✓' : '◀', " ", s.t)), React.createElement("div", {
      className: "row center"
    }, React.createElement("button", {
      className: "btn ghost",
      onClick: () => setPanel('host-read')
    }, G('اقْرَأِ النَّصَّ مَرَّةً أُخْرَى', 'اقْرَئِي النَّصَّ مَرَّةً أُخْرَى')))));
    if (panel === 'host-read') return React.createElement(L1Panel, {
      npc: U.npcs.host,
      station: stOf('read').t,
      onClose: close,
      intro: U.host.intro
    }, React.createElement(ReadSt, {
      U: U,
      picks: unitPicks,
      setPick: setPick,
      onDone: close
    }));
    const intro = key === 'final' ? U.host.final : key === 'read' ? U.host.intro : npc.intro;
    return React.createElement(L1Panel, {
      npc: npc,
      station: st.t,
      onClose: close,
      intro: intro
    }, key === 'vocab' && React.createElement(VocabSt, {
      U: U,
      onDone: () => finish('vocab')
    }), key === 'read' && React.createElement(ReadSt, {
      U: U,
      picks: unitPicks,
      setPick: setPick,
      onDone: () => finish('read')
    }), key === 'rule' && React.createElement(RuleSt, {
      U: U,
      onDone: () => finish('rule')
    }), key === 'hide' && React.createElement(HideSt, {
      U: U,
      onDone: () => finish('hide')
    }), key === 'write' && React.createElement(WriteSt, {
      U: U,
      onDone: () => {
        finish('write');
        if (isDone('final')) setCert(true);
      }
    }), key === 'tower' && React.createElement(TowerSt, {
      U: U,
      onDone: () => finish('tower')
    }), key === 'clinic' && React.createElement(ClinicSt, {
      U: U,
      onDone: () => finish('clinic')
    }), key === 'qa' && React.createElement(QASt, {
      U: U,
      onDone: () => finish('qa')
    }), key === 'final' && React.createElement(FinalSt, {
      U: U,
      onDone: () => {
        markDone('final');
        setPanel(null);
        if (isDone('write')) setCert(true);else toast(G('أَحْسَنْتَ! بَقِيَتِ الْكِتَابَةُ عِنْدَ الْخَطَّاطِ', 'أَحْسَنْتِ! بَقِيَتِ الْكِتَابَةُ عِنْدَ الْخَطَّاطِ'));
      }
    }));
  };
  const goSt = s => {
    const n = U.npcs[s.who];
    if (!n) return;
    if (worldCtl.current) worldCtl.current.go(n.at[0], n.at[1]);
    setPanel(null);
    setTimeout(() => setPanel(s.who), 300);
  };
  const jumpTo = k => {
    const ks = L1_ST.map(s => s.k);
    setProg(p => ({
      ...p,
      [unit]: ks.slice(0, ks.indexOf(k))
    }));
    setDrawer(false);
    setPanel(null);
    toast('بدأت من: ' + stOf(k).t);
  };
  const C = {
    girl: P.g === 'f',
    old: false,
    me: G(L1CH.boy, L1CH.girl),
    roof: U.color,
    kids: []
  };
  const signs = [{
    x: 28,
    w: 6,
    ic: U.icon
  }, {
    x: 35,
    w: 6,
    ic: 'pen'
  }, {
    x: 42,
    w: 7,
    ic: 'openbook'
  }];
  return React.createElement("div", null, React.createElement("div", {
    className: "topbar",
    style: {
      height: 56
    }
  }, React.createElement("div", {
    className: "row between",
    style: {
      height: '100%',
      padding: '0 12px'
    }
  }, React.createElement("div", {
    className: "row"
  }, React.createElement("button", {
    className: "btn ghost sm",
    onClick: () => {
      setPanel(null);
      setScreen('map');
    }
  }, "\u0627\u0644\u0652\u0645\u064F\u062F\u064F\u0646\u064F"), React.createElement("div", null, React.createElement("b", {
    className: "naskh",
    style: {
      fontSize: 18
    }
  }, "\u0627\u0644\u0652\u0645\u064E\u062F\u0650\u064A\u0646\u064E\u0629\u064F ", L1_AR(unit), ": ", U.t), React.createElement("div", {
    className: "small naskh hide-sm",
    style: {
      lineHeight: 1.1,
      opacity: .75
    }
  }, U.fn))), React.createElement("div", {
    className: "row",
    style: {
      gap: 6
    }
  }, React.createElement("button", {
    className: "btn sm",
    onClick: () => {
      setPanel(null);
      setGames(true);
    }
  }, "\u0645\u064E\u062F\u0650\u064A\u0646\u064E\u0629\u064F \u0627\u0644\u0652\u0623\u064E\u0644\u0652\u0639\u064E\u0627\u0628\u0650"), React.createElement("button", {
    className: "btn ghost sm",
    onClick: () => setDrawer(true)
  }, "\u0627\u0644\u0652\u0645\u064F\u0639\u064E\u0644\u0650\u0651\u0645\u064F")))), React.createElement(L1World, {
    key: unit + GEN,
    C: C,
    ents: ents,
    signs: signs,
    paused: !!panel || drawer || cert || games,
    onInteract: id => setPanel(id),
    needs: needs,
    quest: quest,
    ctl: worldCtl
  }), React.createElement("div", {
    className: 'qlog naskh' + (qOpen ? '' : ' shut'),
    style: {
      position: 'fixed',
      top: 'calc(66px + env(safe-area-inset-top,0px))',
      zIndex: 30
    }
  }, React.createElement("button", {
    className: "qhead",
    onClick: () => setQOpen(!qOpen)
  }, React.createElement("b", null, "\u0645\u064E\u062D\u064E\u0637\u064E\u0651\u0627\u062A\u064F \u0627\u0644\u0652\u0645\u064E\u062F\u0650\u064A\u0646\u064E\u0629\u0650"), React.createElement("span", {
    className: "qtog"
  }, qOpen ? '▴' : '▾')), qOpen && React.createElement("div", {
    className: "qhint"
  }, G('انْقُرْ مَحَطَّةً لِتَذْهَبَ إِلَيْهَا', 'انْقُرِي مَحَطَّةً لِتَذْهَبِي إِلَيْهَا')), qOpen && L1_ST.map(s => {
    const d = isDone(s.k),
      nx = nextSt && nextSt.k === s.k;
    return React.createElement("button", {
      key: s.k,
      className: 'qi qgo' + (d ? ' done' : '') + (nx ? ' next' : ''),
      onClick: () => goSt(s)
    }, React.createElement("span", null, d ? '✓' : nx ? '◀' : '·', " ", s.t), React.createElement("span", {
      className: "qarrow"
    }, "\u0627\u0630\u0652\u0647\u064E\u0628\u0652"));
  })), React.createElement("div", {
    className: "harvest"
  }, React.createElement("div", {
    className: "row",
    style: {
      gap: 8,
      maxWidth: 1180,
      margin: '0 auto'
    }
  }, React.createElement("span", {
    className: "small naskh",
    style: {
      fontWeight: 800,
      whiteSpace: 'nowrap'
    }
  }, "\u0643\u064E\u0644\u0650\u0645\u064E\u0627\u062A\u064F \u0627\u0644\u0652\u0645\u064E\u062F\u0650\u064A\u0646\u064E\u0629\u0650"), React.createElement("div", {
    className: "hv grow"
  }, U.vocab.map((v, k) => React.createElement("div", {
    key: k,
    className: 'hslot' + (isDone('vocab') ? ' on' : '')
  }, v.ic ? React.createElement(Icon, {
    n: v.ic,
    s: 2
  }) : v.ch ? React.createElement(CharImg, {
    def: L1CH[v.ch],
    s: 1.2
  }) : null, React.createElement("span", {
    className: "naskh"
  }, v.w)))), React.createElement("b", {
    className: "small naskh hide-sm",
    style: {
      whiteSpace: 'nowrap'
    }
  }, "\u0627\u0644\u0652\u0642\u0650\u064A\u0645\u064E\u0629\u064F: ", U.val))), renderPanel(), drawer && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "modal-bg",
    style: {
      background: 'rgba(0,0,0,.35)'
    },
    onClick: () => setDrawer(false)
  }), React.createElement("div", {
    className: "drawer"
  }, React.createElement("div", {
    className: "row between"
  }, React.createElement("div", {
    className: "h2"
  }, "\u0644\u0648\u062D\u0629 \u0627\u0644\u0645\u0639\u0644\u0645"), React.createElement("button", {
    className: "btn ghost sm",
    onClick: () => setDrawer(false)
  }, "\u0625\u063A\u0644\u0627\u0642")), React.createElement("div", {
    className: "card",
    style: {
      marginTop: 12
    }
  }, React.createElement("b", null, "\u0627\u0630\u0647\u0628 \u0625\u0644\u0649 \u0645\u062D\u0637\u0629"), React.createElement("div", {
    className: "mute small"
  }, "\u064A\u0646\u062A\u0642\u0644 \u0627\u0644\u0637\u0627\u0644\u0628 \u0625\u0644\u0649 \u0635\u0627\u062D\u0628 \u0627\u0644\u0645\u062D\u0637\u0629 \u0648\u062A\u064F\u0641\u062A\u062D \u0645\u0628\u0627\u0634\u0631\u0629\u060C \u062F\u0648\u0646 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u062A\u0642\u062F\u0651\u0645."), React.createElement("div", {
    className: "row wrapf",
    style: {
      gap: 6,
      marginTop: 8
    }
  }, L1_ST.map(s => React.createElement("button", {
    key: s.k,
    className: "chip naskh",
    onClick: () => {
      setDrawer(false);
      goSt(s);
    }
  }, isDone(s.k) ? '✓ ' : '', s.t)))), React.createElement("div", {
    className: "card",
    style: {
      marginTop: 12
    }
  }, React.createElement("b", null, "\u0627\u0628\u062F\u0623 \u0645\u0646 \u0645\u062D\u0637\u0629"), React.createElement("div", {
    className: "mute small"
  }, "\u064A\u064F\u0639\u062F\u0651 \u0645\u0627 \u0642\u0628\u0644\u0647\u0627 \u0645\u0646\u062C\u0632\u064B\u0627. \u0643\u0644 \u0627\u0644\u0645\u062D\u0637\u0627\u062A \u0645\u0641\u062A\u0648\u062D\u0629 \u0623\u064A\u0636\u064B\u0627 \u0641\u064A \u0627\u0644\u0645\u062F\u064A\u0646\u0629."), React.createElement("div", {
    className: "row wrapf",
    style: {
      gap: 6,
      marginTop: 8
    }
  }, L1_ST.map(s => React.createElement("button", {
    key: s.k,
    className: "chip naskh",
    onClick: () => jumpTo(s.k)
  }, s.t)))), React.createElement("div", {
    className: "card",
    style: {
      marginTop: 12
    }
  }, React.createElement("b", null, "\u0647\u0630\u0647 \u0627\u0644\u0645\u062F\u064A\u0646\u0629"), React.createElement("div", {
    className: "small"
  }, "\u0627\u0644\u0648\u0638\u064A\u0641\u0629: ", React.createElement("span", {
    className: "naskh"
  }, U.fn), " \xB7 \u0627\u0644\u0642\u064A\u0645\u0629: ", React.createElement("span", {
    className: "naskh"
  }, U.val)), React.createElement("div", {
    className: "small"
  }, "\u0627\u0644\u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u062E\u0641\u064A\u0629: ", React.createElement("span", {
    className: "naskh"
  }, U.rule.title)), React.createElement("div", {
    className: "small"
  }, "\u0643\u0644\u0645\u0629 \u0627\u0644\u0643\u062A\u0627\u0628\u0629: ", React.createElement("span", {
    className: "naskh"
  }, U.write.word), " \xB7 \u0627\u0644\u062D\u0631\u0648\u0641: ", React.createElement("span", {
    className: "naskh"
  }, [...new Set(U.write.letters)].join(' '))), React.createElement("div", {
    className: "row wrapf",
    style: {
      gap: 6,
      marginTop: 8
    }
  }, React.createElement("button", {
    className: "btn ghost sm",
    onClick: () => {
      setProg(p => ({
        ...p,
        [unit]: []
      }));
      setPicks(p => ({
        ...p,
        [unit]: {}
      }));
      setDrawer(false);
    }
  }, "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062F\u064A\u0646\u0629"), React.createElement("button", {
    className: "btn ghost sm",
    onClick: () => {
      setProg({});
      setPicks({});
      setDrawer(false);
      setScreen('map');
    }
  }, "\u0625\u0639\u0627\u062F\u0629 \u0643\u0644 \u0627\u0644\u0645\u062F\u0646 \u0644\u0647\u0630\u0627 \u0627\u0644\u0637\u0627\u0644\u0628"), React.createElement("button", {
    className: "btn ghost sm",
    onClick: () => editStudent(P, 'map')
  }, "\u062A\u0639\u062F\u064A\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0637\u0627\u0644\u0628"), React.createElement("button", {
    className: "btn ghost sm",
    onClick: () => {
      setDrawer(false);
      setPanel(null);
      setScreen('students');
    }
  }, "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0637\u0627\u0644\u0628"))))), cert && React.createElement("div", {
    className: "panel-bg"
  }, React.createElement("div", {
    className: "panel col",
    style: {
      gap: 12,
      maxWidth: 820
    }
  }, React.createElement("div", {
    className: "row center",
    style: {
      gap: 16,
      alignItems: 'flex-end'
    }
  }, React.createElement(Icon, {
    n: "star",
    s: 6
  }), React.createElement(CharImg, {
    def: G(L1CH.boy, L1CH.girl),
    s: 7
  }), React.createElement(Icon, {
    n: "star",
    s: 6
  })), React.createElement("div", {
    className: "h1 naskh",
    style: {
      textAlign: 'center'
    }
  }, G('أَحْسَنْتَ يَا', 'أَحْسَنْتِ يَا'), " ", P.name, "!"), React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 21,
      textAlign: 'center'
    }
  }, G('أَنْهَيْتَ', 'أَنْهَيْتِ'), " \u0645\u064E\u062F\u0650\u064A\u0646\u064E\u0629\u064E \xAB", U.t, "\xBB: ", U.fn, "."), React.createElement("div", {
    className: "papercard"
  }, U.lines.map((l, i) => React.createElement("div", {
    key: i
  }, React.createElement(TT, {
    text: l.t
  })))), React.createElement("div", {
    className: "naskh",
    style: {
      textAlign: 'center',
      fontSize: 18
    }
  }, "\u0627\u0644\u0652\u0642\u0650\u064A\u0645\u064E\u0629\u064F: ", U.val), React.createElement("div", {
    className: "row center",
    style: {
      gap: 10
    }
  }, React.createElement("button", {
    className: "btn ghost",
    onClick: () => {
      setCert(false);
      setScreen('map');
    }
  }, "\u0625\u0650\u0644\u064E\u0649 \u0627\u0644\u0652\u0645\u064F\u062F\u064F\u0646\u0650"), unit < 16 && React.createElement("button", {
    className: "btn",
    onClick: () => {
      setCert(false);
      setPanel(null);
      setUnit(unit + 1);
    }
  }, "\u0627\u0644\u0652\u0645\u064E\u062F\u0650\u064A\u0646\u064E\u0629\u064F \u0627\u0644\u062A\u064E\u0651\u0627\u0644\u0650\u064A\u064E\u0629\u064F")))), games && React.createElement(GameHub, {
    bank: gBank,
    nm: P.name,
    title: '«' + U.t + '»',
    onClose: () => setGames(false)
  }), React.createElement(Toast, {
    msg: toastMsg
  }));
}
const GH_SAY = () => G('قُلْ', 'قُولِي');
function l1CityBank(U) {
  const c = [];
  (U.rule.quiz || []).forEach(q => c.push({
    k: 'mc',
    v: q,
    prompt: q.q,
    opts: q.opts,
    ok: q.ok
  }));
  U.vocab.forEach(v => c.push({
    k: 'say',
    v,
    prompt: G('مَا هَذَا؟ قُلِ الْكَلِمَةَ.', 'مَا هَذَا؟ قُولِي الْكَلِمَةَ.'),
    ans: v.w
  }));
  U.qa.forEach(q => c.push({
    k: 'say',
    prompt: q.q,
    ans: q.a,
    hear: true
  }));
  U.clinic.forEach(x => c.push({
    k: 'say',
    prompt: G('فِي الْجُمْلَةِ خَطَأٌ. قُلْهَا صَحِيحَةً:', 'فِي الْجُمْلَةِ خَطَأٌ. قُولِيهَا صَحِيحَةً:'),
    bad: x.bad,
    ans: x.good
  }));
  U.tower.forEach(l => c.push({
    k: 'say',
    v: l,
    prompt: G('انْظُرْ إِلَى الصُّورَةِ، وَقُلِ الْجُمْلَةَ.', 'انْظُرِي إِلَى الصُّورَةِ، وَقُولِي الْجُمْلَةَ.'),
    hint: l.key,
    ans: l.t
  }));
  return {
    cards: L1_SHUF(c),
    pairs: L1_SHUF(U.vocab.filter(v => v.ic || v.ch || v.scene)).slice(0, 6).map(v => ({
      v,
      w: v.w
    }))
  };
}
function l1ReviewBank(D) {
  const c = [];
  D.turns.forEach(t => {
    if (t.n && t.me.length) c.push({
      k: 'say',
      prompt: G('أَجِبْ:', 'أَجِيبِي:') + ' ' + plain(t.n),
      ans: t.me.map(id => D.S[id].t).join(' '),
      hear: true
    });
  });
  D.narr.forEach(id => c.push({
    k: 'say',
    v: D.S[id],
    prompt: G('انْظُرْ إِلَى الصُّورَةِ، وَقُلِ الْجُمْلَةَ.', 'انْظُرِي إِلَى الصُّورَةِ، وَقُولِي الْجُمْلَةَ.'),
    hint: D.S[id].key,
    ans: D.S[id].t
  }));
  return {
    cards: L1_SHUF(c),
    pairs: L1_SHUF(D.narr.map(id => D.S[id]).filter(s => s.key)).slice(0, 6).map(s => ({
      v: s,
      w: s.key
    }))
  };
}
function GCard({
  card,
  onResult
}) {
  const [show, setShow] = useState(false);
  const [picked, setPicked] = useState(null);
  return /*#__PURE__*/React.createElement("div", {
    className: "gcard fade"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pill naskh"
  }, G('سُؤَالُ التَّحَدِّي: أَجِبْ لِتَلْعَبَ', 'سُؤَالُ التَّحَدِّي: أَجِيبِي لِتَلْعَبِي')), card.v && /*#__PURE__*/React.createElement(VView, {
    v: card.v,
    s: 3.6
  }), /*#__PURE__*/React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 22,
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement(TT, {
    text: card.prompt
  })), card.hear && /*#__PURE__*/React.createElement(SpeakBtn, {
    text: card.prompt,
    label: false
  }), card.bad && /*#__PURE__*/React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 22,
      textDecoration: 'line-through',
      textDecorationColor: '#ef233c',
      opacity: .85
    }
  }, /*#__PURE__*/React.createElement(TT, {
    text: card.bad
  })), card.hint && /*#__PURE__*/React.createElement("span", {
    className: "cue naskh",
    style: {
      fontSize: 22
    }
  }, plain(card.hint)), card.k === 'mc' ? /*#__PURE__*/React.createElement("div", {
    className: "row wrapf center",
    style: {
      gap: 8
    }
  }, card.opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o,
    className: 'chip naskh' + (picked === o ? ' on' : ''),
    style: {
      fontSize: 22
    },
    disabled: picked !== null,
    onClick: () => {
      setPicked(o);
      const ok = o === card.ok;
      ok ? sfx.ok() : sfx.bad();
      setTimeout(() => onResult(ok), ok ? 450 : 900);
    }
  }, o))) : /*#__PURE__*/React.createElement(React.Fragment, null, show ? /*#__PURE__*/React.createElement("div", {
    className: "say-line sm fade"
  }, /*#__PURE__*/React.createElement(TT, {
    text: card.ans
  })) : /*#__PURE__*/React.createElement("button", {
    className: "btn ghost sm",
    onClick: () => setShow(true)
  }, "أَظْهِرِ الْجَوَابَ (لِلْمُعَلِّمِ)"), /*#__PURE__*/React.createElement("div", {
    className: "tbar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lbl"
  }, "رَأْيُ الْمُعَلِّمِ:"), /*#__PURE__*/React.createElement("button", {
    className: "tb g",
    onClick: () => {
      sfx.ok();
      onResult(true);
    }
  }, "✓ ", G('أَجَابَ صَحِيحًا', 'أَجَابَتْ صَحِيحًا')), /*#__PURE__*/React.createElement("button", {
    className: "tb w",
    onClick: () => {
      sfx.bad();
      onResult(false);
    }
  }, "✗ ", G('لَمْ يُصِبْ', 'لَمْ تُصِبْ')))));
}
function useDeck(bank) {
  const i = useRef(0);
  return () => {
    const c = bank.cards[i.current % bank.cards.length];
    i.current++;
    return c;
  };
}
function GTurn({
  turn,
  nm,
  msg
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "col center",
    style: {
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: 'gh-turn naskh ' + turn
  }, turn === 'me' ? 'الدَّوْرُ: ' + nm : 'الدَّوْرُ: الْمُعَلِّمُ'), msg && /*#__PURE__*/React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 17,
      textAlign: 'center'
    }
  }, msg));
}
function GEnd({
  win,
  nm,
  onAgain
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "col center fade",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: win === 'me' ? 'star' : win === 'tch' ? 'flag' : 'hand',
    s: 5
  }), /*#__PURE__*/React.createElement("div", {
    className: "h2 naskh"
  }, win === 'me' ? G('فُزْتَ يَا ', 'فُزْتِ يَا ') + nm + '!' : win === 'tch' ? 'فَازَ الْمُعَلِّمُ هَذِهِ الْمَرَّةَ!' : 'تَعَادُلٌ!'), /*#__PURE__*/React.createElement("button", {
    className: "btn lg",
    onClick: onAgain
  }, "جَوْلَةٌ جَدِيدَةٌ"));
}
const GH_WRONG = () => G('لَمْ يُصِبْ: الدَّوْرُ لِلْمُعَلِّمِ.', 'لَمْ تُصِبْ: الدَّوْرُ لِلْمُعَلِّمِ.');
function useTurns(onWin) {
  const [turn, setTurn] = useState('me');
  const [phase, setPhase] = useState('card');
  const [msg, setMsg] = useState('');
  const [win, setWin] = useState(null);
  const pass = (to, m) => {
    setTurn(to);
    setPhase(to === 'me' ? 'card' : 'move');
    setMsg(m || '');
  };
  const end = w => {
    setWin(w);
    onWin(w);
    w === 'me' ? sfx.win() : sfx.ok();
  };
  const reset = () => {
    setTurn('me');
    setPhase('card');
    setMsg('');
    setWin(null);
  };
  return {
    turn,
    phase,
    setPhase,
    msg,
    setMsg,
    win,
    pass,
    end,
    reset
  };
}
function XOGame({
  bank,
  nm,
  onWin
}) {
  const next = useDeck(bank);
  const [b, setB] = useState(Array(9).fill(null));
  const [card, setCard] = useState(() => next());
  const T = useTurns(onWin);
  const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const check = nb => {
    for (const [a, c, d] of L) if (nb[a] && nb[a] === nb[c] && nb[a] === nb[d]) return nb[a];
    return nb.every(Boolean) ? 'draw' : null;
  };
  const place = i => {
    if (b[i] || T.win || T.phase !== 'move') return;
    const nb = [...b];
    nb[i] = T.turn;
    setB(nb);
    sfx.pop();
    const w = check(nb);
    if (w) return T.end(w);
    if (T.turn === 'me') T.pass('tch', 'الْآنَ يَلْعَبُ الْمُعَلِّمُ: يَنْقُرُ مُرَبَّعًا.');else {
      setCard(next());
      T.pass('me');
    }
  };
  const again = () => {
    setB(Array(9).fill(null));
    setCard(next());
    T.reset();
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "gwrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col center",
    style: {
      gap: 10
    }
  }, T.win ? /*#__PURE__*/React.createElement(GEnd, {
    win: T.win,
    nm: nm,
    onAgain: again
  }) : /*#__PURE__*/React.createElement(GTurn, {
    turn: T.turn,
    nm: nm,
    msg: T.msg || (T.turn === 'me' && T.phase === 'move' ? G('أَحْسَنْتَ! اخْتَرْ مُرَبَّعًا.', 'أَحْسَنْتِ! اخْتَارِي مُرَبَّعًا.') : '')
  }), /*#__PURE__*/React.createElement("div", {
    className: "xo"
  }, b.map((x, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: x === 'me' ? 'X' : x === 'tch' ? 'O' : '',
    onClick: () => place(i)
  }, x === 'me' ? '✕' : x === 'tch' ? '◯' : ''))), /*#__PURE__*/React.createElement("div", {
    className: "small naskh",
    style: {
      opacity: .8
    }
  }, "✕ ", nm, " · ◯ الْمُعَلِّمُ")), !T.win && T.turn === 'me' && T.phase === 'card' && /*#__PURE__*/React.createElement(GCard, {
    key: b.join() + T.turn,
    card: card,
    onResult: ok => ok ? T.setPhase('move') : (setCard(next()), T.pass('tch', GH_WRONG()))
  }));
}
function C4Game({
  bank,
  nm,
  onWin
}) {
  const R = 6,
    Cn = 7;
  const next = useDeck(bank);
  const [b, setB] = useState(Array(R * Cn).fill(null));
  const [card, setCard] = useState(() => next());
  const T = useTurns(onWin);
  const at = (r, c) => r >= 0 && r < R && c >= 0 && c < Cn ? b2[r * Cn + c] : null;
  let b2 = b;
  const won = (nb, r, c, who) => {
    b2 = nb;
    return [[0, 1], [1, 0], [1, 1], [1, -1]].some(([dr, dc]) => {
      let n = 1;
      for (const s of [1, -1]) {
        let k = 1;
        while (at(r + dr * k * s, c + dc * k * s) === who) {
          n++;
          k++;
        }
      }
      return n >= 4;
    });
  };
  const drop = c => {
    if (T.win || T.phase !== 'move') return;
    let r = R - 1;
    while (r >= 0 && b[r * Cn + c]) r--;
    if (r < 0) return;
    const nb = [...b];
    nb[r * Cn + c] = T.turn;
    setB(nb);
    sfx.pop();
    if (won(nb, r, c, T.turn)) return T.end(T.turn);
    if (nb.every(Boolean)) return T.end('draw');
    if (T.turn === 'me') T.pass('tch', 'الْآنَ يَلْعَبُ الْمُعَلِّمُ: يَنْقُرُ عَمُودًا.');else {
      setCard(next());
      T.pass('me');
    }
  };
  const again = () => {
    setB(Array(R * Cn).fill(null));
    setCard(next());
    T.reset();
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "gwrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col center",
    style: {
      gap: 10
    }
  }, T.win ? /*#__PURE__*/React.createElement(GEnd, {
    win: T.win,
    nm: nm,
    onAgain: again
  }) : /*#__PURE__*/React.createElement(GTurn, {
    turn: T.turn,
    nm: nm,
    msg: T.msg || (T.turn === 'me' && T.phase === 'move' ? G('أَحْسَنْتَ! اخْتَرْ عَمُودًا.', 'أَحْسَنْتِ! اخْتَارِي عَمُودًا.') : '')
  }), /*#__PURE__*/React.createElement("div", {
    className: "c4"
  }, b.map((x, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    className: x || '',
    onClick: () => drop(i % Cn),
    "aria-label": 'عمود ' + (i % Cn + 1)
  }))), /*#__PURE__*/React.createElement("div", {
    className: "small naskh",
    style: {
      opacity: .8
    }
  }, G('أَرْبَعٌ فِي خَطٍّ وَاحِدٍ تَرْبَحُ', 'أَرْبَعٌ فِي خَطٍّ وَاحِدٍ تَرْبَحُ'), " · ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--acc)'
    }
  }, "●"), " ", nm, " · ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#eab308'
    }
  }, "●"), " الْمُعَلِّمُ")), !T.win && T.turn === 'me' && T.phase === 'card' && /*#__PURE__*/React.createElement(GCard, {
    key: b.filter(Boolean).length + T.turn,
    card: card,
    onResult: ok => ok ? T.setPhase('move') : (setCard(next()), T.pass('tch', GH_WRONG()))
  }));
}
const SL_JUMP = {
  3: 11,
  8: 16,
  13: 22,
  19: 27,
  14: 4,
  21: 10,
  25: 17,
  29: 20
};
function SLGame({
  bank,
  nm,
  onWin
}) {
  const next = useDeck(bank);
  const [pos, setPos] = useState({
    me: 0,
    tch: 0
  });
  const [die, setDie] = useState(null);
  const [card, setCard] = useState(() => next());
  const T = useTurns(onWin);
  const roll = () => {
    if (T.win || T.phase !== 'move') return;
    const d = 1 + Math.floor(Math.random() * 6);
    setDie(d);
    sfx.pop();
    let p = Math.min(30, pos[T.turn] + d);
    let note = '';
    if (SL_JUMP[p]) {
      note = SL_JUMP[p] > p ? 'سُلَّمٌ! صَعِدَ إِلَى ' + L1_AR(SL_JUMP[p]) : 'ثُعْبَانٌ! نَزَلَ إِلَى ' + L1_AR(SL_JUMP[p]);
      p = SL_JUMP[p];
    }
    const np = {
      ...pos,
      [T.turn]: p
    };
    setPos(np);
    if (p >= 30) return T.end(T.turn);
    if (T.turn === 'me') T.pass('tch', (note ? note + ' · ' : '') + 'الْآنَ يَرْمِي الْمُعَلِّمُ النَّرْدَ.');else {
      setCard(next());
      T.pass('me', note);
    }
  };
  const again = () => {
    setPos({
      me: 0,
      tch: 0
    });
    setDie(null);
    setCard(next());
    T.reset();
  };
  const cells = [];
  for (let row = 4; row >= 0; row--) {
    const r = [];
    for (let k = 0; k < 6; k++) r.push(row * 6 + (row % 2 ? 6 - k : k + 1));
    cells.push(...r);
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "gwrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col center",
    style: {
      gap: 10
    }
  }, T.win ? /*#__PURE__*/React.createElement(GEnd, {
    win: T.win,
    nm: nm,
    onAgain: again
  }) : /*#__PURE__*/React.createElement(GTurn, {
    turn: T.turn,
    nm: nm,
    msg: T.msg
  }), /*#__PURE__*/React.createElement("div", {
    className: "sl"
  }, cells.map(n => {
    const j = SL_JUMP[n];
    return /*#__PURE__*/React.createElement("div", {
      key: n,
      className: j ? j > n ? 'lad' : 'snk' : ''
    }, /*#__PURE__*/React.createElement("span", null, L1_AR(n)), j && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 10
      }
    }, j > n ? '↑ ' : '↓ ', L1_AR(j)), /*#__PURE__*/React.createElement("span", {
      className: "row",
      style: {
        gap: 1
      }
    }, pos.me === n && /*#__PURE__*/React.createElement(CharImg, {
      def: G(L1CH.boy, L1CH.girl),
      s: 1.1
    }), pos.tch === n && /*#__PURE__*/React.createElement(CharImg, {
      def: G(L1CH.teacherM, L1CH.teacherF),
      s: .9
    })));
  })), /*#__PURE__*/React.createElement("div", {
    className: "row center",
    style: {
      gap: 10
    }
  }, die && /*#__PURE__*/React.createElement("span", {
    className: "cue naskh",
    style: {
      fontSize: 26
    }
  }, L1_AR(die)), !T.win && T.phase === 'move' && /*#__PURE__*/React.createElement("button", {
    className: "btn lg",
    onClick: roll
  }, T.turn === 'me' ? G('ارْمِ النَّرْدَ', 'ارْمِي النَّرْدَ') : 'يَرْمِي الْمُعَلِّمُ النَّرْدَ')), /*#__PURE__*/React.createElement("div", {
    className: "small naskh",
    style: {
      opacity: .8
    }
  }, G('مَنْ يَصِلُ إِلَى ٣٠ أَوَّلًا يَرْبَحُ', 'مَنْ يَصِلُ إِلَى ٣٠ أَوَّلًا يَرْبَحُ'), pos.me === 0 ? ' · ' + nm + ' عِنْدَ الْبِدَايَةِ' : '')), !T.win && T.turn === 'me' && T.phase === 'card' && /*#__PURE__*/React.createElement(GCard, {
    key: pos.me + '-' + pos.tch,
    card: card,
    onResult: ok => ok ? T.setPhase('move') : (setCard(next()), T.pass('tch', GH_WRONG()))
  }));
}
function MemGame({
  bank,
  nm,
  onWin
}) {
  const mk = () => L1_SHUF([].concat(...bank.pairs.map((p, i) => [{
    id: i + 'p',
    pair: i,
    pic: 1,
    p
  }, {
    id: i + 'w',
    pair: i,
    pic: 0,
    p
  }])));
  const [cards, setCards] = useState(mk);
  const [open, setOpen] = useState([]);
  const [got, setGot] = useState({});
  const [confirm, setConfirm] = useState(null);
  const T = useTurns(onWin);
  const [sc, setSc] = useState({
    me: 0,
    tch: 0
  });
  const finish = (ng, ns) => {
    if (Object.keys(ng).length === bank.pairs.length) T.end(ns.me > ns.tch ? 'me' : ns.tch > ns.me ? 'tch' : 'draw');
  };
  const flip = c => {
    if (T.win || confirm !== null || open.length === 2 || got[c.pair] !== undefined || open.includes(c.id)) return;
    sfx.pop();
    const no = [...open, c.id];
    setOpen(no);
    if (no.length < 2) return;
    const [a, b] = no.map(id => cards.find(x => x.id === id));
    if (a.pair === b.pair) {
      if (T.turn === 'me') setConfirm(a.pair);else {
        const ng = {
            ...got,
            [a.pair]: 'tch'
          },
          ns = {
            ...sc,
            tch: sc.tch + 1
          };
        setGot(ng);
        setSc(ns);
        setOpen([]);
        finish(ng, ns);
      }
    } else setTimeout(() => {
      setOpen([]);
      T.pass(T.turn === 'me' ? 'tch' : 'me', T.turn === 'me' ? 'الْآنَ يَقْلِبُ الْمُعَلِّمُ بِطَاقَتَيْنِ.' : '');
      T.setPhase('move');
    }, 1000);
  };
  const judge = ok => {
    const p = confirm;
    setConfirm(null);
    setOpen([]);
    if (ok) {
      sfx.ok();
      const ng = {
          ...got,
          [p]: 'me'
        },
        ns = {
          ...sc,
          me: sc.me + 1
        };
      setGot(ng);
      setSc(ns);
      finish(ng, ns);
    } else {
      sfx.bad();
      T.pass('tch', GH_WRONG());
      T.setPhase('move');
    }
  };
  const again = () => {
    setCards(mk());
    setOpen([]);
    setGot({});
    setConfirm(null);
    setSc({
      me: 0,
      tch: 0
    });
    T.reset();
    T.setPhase('move');
  };
  useEffect(() => {
    T.setPhase('move');
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "col center",
    style: {
      gap: 10
    }
  }, T.win ? /*#__PURE__*/React.createElement(GEnd, {
    win: T.win,
    nm: nm,
    onAgain: again
  }) : /*#__PURE__*/React.createElement(GTurn, {
    turn: T.turn,
    nm: nm,
    msg: T.msg || (T.turn === 'me' ? G('اقْلِبْ بِطَاقَتَيْنِ: صُورَةً وَكَلِمَتَهَا.', 'اقْلِبِي بِطَاقَتَيْنِ: صُورَةً وَكَلِمَتَهَا.') : '')
  }), /*#__PURE__*/React.createElement("div", {
    className: "gh-score naskh"
  }, nm, ": ", L1_AR(sc.me), " · الْمُعَلِّمُ: ", L1_AR(sc.tch)), confirm !== null && /*#__PURE__*/React.createElement("div", {
    className: "gcard fade"
  }, /*#__PURE__*/React.createElement("div", {
    className: "naskh",
    style: {
      fontSize: 20
    }
  }, G('وَجَدْتَ زَوْجًا! قُلِ الْكَلِمَةَ بِصَوْتٍ عَالٍ لِتَأْخُذَهُ.', 'وَجَدْتِ زَوْجًا! قُولِي الْكَلِمَةَ بِصَوْتٍ عَالٍ لِتَأْخُذِيهِ.')), /*#__PURE__*/React.createElement("div", {
    className: "tbar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lbl"
  }, "رَأْيُ الْمُعَلِّمِ:"), /*#__PURE__*/React.createElement("button", {
    className: "tb g",
    onClick: () => judge(true)
  }, "✓ ", G('قَالَهَا صَحِيحَةً', 'قَالَتْهَا صَحِيحَةً')), /*#__PURE__*/React.createElement("button", {
    className: "tb w",
    onClick: () => judge(false)
  }, "✗ ", G('لَمْ يُصِبْ', 'لَمْ تُصِبْ')))), /*#__PURE__*/React.createElement("div", {
    className: "mem"
  }, cards.map(c => {
    const up = open.includes(c.id) || got[c.pair] !== undefined;
    return /*#__PURE__*/React.createElement("button", {
      key: c.id,
      className: (up ? '' : 'back') + (got[c.pair] !== undefined ? ' got' : ''),
      onClick: () => flip(c)
    }, up ? c.pic ? /*#__PURE__*/React.createElement(VView, {
      v: c.p.v,
      s: 2.6
    }) : /*#__PURE__*/React.createElement("span", {
      className: "naskh"
    }, plain(c.p.w)) : null);
  })));
}
const GH_GAMES = [{
  k: 'xo',
  t: 'إِكْس أُو',
  ic: 'star',
  d: 'ثَلَاثَةٌ فِي خَطٍّ'
}, {
  k: 'c4',
  t: 'أَرْبَعَةٌ تَرْبَحُ',
  ic: 'flag',
  d: 'أَرْبَعٌ فِي خَطٍّ'
}, {
  k: 'sl',
  t: 'السُّلَّمُ وَالثُّعْبَانُ',
  ic: 'arrowL',
  d: 'أَوَّلُ مَنْ يَصِلُ ٣٠'
}, {
  k: 'mem',
  t: 'الذَّاكِرَةُ',
  ic: 'question',
  d: 'صُورَةٌ وَكَلِمَتُهَا'
}];
function GameHub({
  bank,
  nm,
  title,
  onClose
}) {
  const [g, setG] = useState(null);
  const [score, setScore] = useState({
    me: 0,
    tch: 0
  });
  const onWin = w => setScore(s => w === 'me' ? {
    ...s,
    me: s.me + 1
  } : w === 'tch' ? {
    ...s,
    tch: s.tch + 1
  } : s);
  const games = GH_GAMES.filter(x => x.k !== 'mem' || bank.pairs.length >= 3);
  const cur = GH_GAMES.find(x => x.k === g);
  return /*#__PURE__*/React.createElement("div", {
    className: "panel-bg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "panel fade col",
    style: {
      gap: 12,
      maxWidth: 1080
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "row between wrapf",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "h2 naskh"
  }, "مَدِينَةُ الْأَلْعَابِ", cur ? ' · ' + cur.t : ''), /*#__PURE__*/React.createElement("div", {
    className: "small naskh",
    style: {
      opacity: .75
    }
  }, G('تَحَدٍّ بَيْنَكَ وَبَيْنَ الْمُعَلِّمِ بِأَسْئِلَةِ ', 'تَحَدٍّ بَيْنَكِ وَبَيْنَ الْمُعَلِّمِ بِأَسْئِلَةِ '), title)), /*#__PURE__*/React.createElement("div", {
    className: "row",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "gh-score naskh"
  }, nm, " ", L1_AR(score.me), " : ", L1_AR(score.tch), " الْمُعَلِّمُ"), g && /*#__PURE__*/React.createElement("button", {
    className: "btn ghost sm",
    onClick: () => setG(null)
  }, "أَلْعَابٌ أُخْرَى"), /*#__PURE__*/React.createElement("button", {
    className: "btn sm",
    onClick: onClose
  }, "عَوْدَةٌ إِلَى الْمَدِينَةِ"))), !g && /*#__PURE__*/React.createElement("div", {
    className: "gh-grid"
  }, games.map(x => /*#__PURE__*/React.createElement("button", {
    key: x.k,
    className: "gh-pick naskh",
    onClick: () => {
      sfx.pop();
      setG(x.k);
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: x.ic,
    s: 5
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20
    }
  }, x.t), /*#__PURE__*/React.createElement("span", {
    className: "small",
    style: {
      opacity: .75
    }
  }, x.d)))), !g && /*#__PURE__*/React.createElement("div", {
    className: "naskh small",
    style: {
      textAlign: 'center',
      opacity: .8
    }
  }, G('قَبْلَ كُلِّ حَرَكَةٍ سُؤَالٌ مِنَ الدَّرْسِ: إِنْ أَجَبْتَ صَحِيحًا لَعِبْتَ، وَإِلَّا صَارَ الدَّوْرُ لِلْمُعَلِّمِ.', 'قَبْلَ كُلِّ حَرَكَةٍ سُؤَالٌ مِنَ الدَّرْسِ: إِنْ أَجَبْتِ صَحِيحًا لَعِبْتِ، وَإِلَّا صَارَ الدَّوْرُ لِلْمُعَلِّمِ.')), g === 'xo' && /*#__PURE__*/React.createElement(XOGame, {
    bank: bank,
    nm: nm,
    onWin: onWin
  }), g === 'c4' && /*#__PURE__*/React.createElement(C4Game, {
    bank: bank,
    nm: nm,
    onWin: onWin
  }), g === 'sl' && /*#__PURE__*/React.createElement(SLGame, {
    bank: bank,
    nm: nm,
    onWin: onWin
  }), g === 'mem' && /*#__PURE__*/React.createElement(MemGame, {
    bank: bank,
    nm: nm,
    onWin: onWin
  })));
}
class Boundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = {
      err: null
    };
  }
  static getDerivedStateFromError(err) {
    return {
      err
    };
  }
  componentDidCatch(err, info) {
    window.__showErr && window.__showErr('React: ' + err.message + '\n' + (info && info.componentStack || '').slice(0, 600));
  }
  render() {
    return this.state.err ? React.createElement("div", {
      className: "wrap"
    }, React.createElement("div", {
      className: "card col center"
    }, React.createElement("div", {
      className: "h2"
    }, "\u062D\u062F\u062B \u062E\u0637\u0623"), React.createElement("button", {
      className: "btn",
      onClick: () => location.reload()
    }, "\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u062A\u0634\u063A\u064A\u0644"))) : this.props.children;
  }
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(Boundary, null, React.createElement(App, null)));
