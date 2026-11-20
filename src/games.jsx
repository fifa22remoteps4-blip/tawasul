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
  return <div className="gcard fade">
      <span className="pill naskh">{G('سُؤَالُ التَّحَدِّي: أَجِبْ لِتَلْعَبَ', 'سُؤَالُ التَّحَدِّي: أَجِيبِي لِتَلْعَبِي')}</span>
      {card.v && <VView v={card.v} s={3.6} />}
      <div className="naskh" style={{
      fontSize: 22,
      textAlign: 'center'
    }}><TT text={card.prompt} /></div>
      {card.hear && <SpeakBtn text={card.prompt} label={false} />}
      {card.bad && <div className="naskh" style={{
      fontSize: 22,
      textDecoration: 'line-through',
      textDecorationColor: '#ef233c',
      opacity: .85
    }}><TT text={card.bad} /></div>}
      {card.hint && <span className="cue naskh" style={{
      fontSize: 22
    }}>{plain(card.hint)}</span>}
      {card.k === 'mc' ? <div className="row wrapf center" style={{
      gap: 8
    }}>{card.opts.map(o => <button key={o} className={'chip naskh' + (picked === o ? ' on' : '')} style={{
        fontSize: 22
      }} disabled={picked !== null} onClick={() => {
        setPicked(o);
        const ok = o === card.ok;
        ok ? sfx.ok() : sfx.bad();
        setTimeout(() => onResult(ok), ok ? 450 : 900);
      }}>{o}</button>)}</div> : <React.Fragment>
          {show ? <div className="say-line sm fade"><TT text={card.ans} /></div> : <button className="btn ghost sm" onClick={() => setShow(true)}>أَظْهِرِ الْجَوَابَ (لِلْمُعَلِّمِ)</button>}
          <div className="tbar">
            <span className="lbl">رَأْيُ الْمُعَلِّمِ:</span>
            <button className="tb g" onClick={() => {
            sfx.ok();
            onResult(true);
          }}>✓ {G('أَجَابَ صَحِيحًا', 'أَجَابَتْ صَحِيحًا')}</button>
            <button className="tb w" onClick={() => {
            sfx.bad();
            onResult(false);
          }}>✗ {G('لَمْ يُصِبْ', 'لَمْ تُصِبْ')}</button>
          </div>
        </React.Fragment>}
    </div>;
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
  return <div className="col center" style={{
    gap: 6
  }}>
      <span className={'gh-turn naskh ' + turn}>{turn === 'me' ? 'الدَّوْرُ: ' + nm : 'الدَّوْرُ: الْمُعَلِّمُ'}</span>
      {msg && <div className="naskh" style={{
      fontSize: 17,
      textAlign: 'center'
    }}>{msg}</div>}
    </div>;
}
function GEnd({
  win,
  nm,
  onAgain
}) {
  return <div className="col center fade" style={{
    gap: 8
  }}>
      <Icon n={win === 'me' ? 'star' : win === 'tch' ? 'flag' : 'hand'} s={5} />
      <div className="h2 naskh">{win === 'me' ? G('فُزْتَ يَا ', 'فُزْتِ يَا ') + nm + '!' : win === 'tch' ? 'فَازَ الْمُعَلِّمُ هَذِهِ الْمَرَّةَ!' : 'تَعَادُلٌ!'}</div>
      <button className="btn lg" onClick={onAgain}>جَوْلَةٌ جَدِيدَةٌ</button>
    </div>;
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
  return <div className="gwrap">
      <div className="col center" style={{
      gap: 10
    }}>
        {T.win ? <GEnd win={T.win} nm={nm} onAgain={again} /> : <GTurn turn={T.turn} nm={nm} msg={T.msg || (T.turn === 'me' && T.phase === 'move' ? G('أَحْسَنْتَ! اخْتَرْ مُرَبَّعًا.', 'أَحْسَنْتِ! اخْتَارِي مُرَبَّعًا.') : '')} />}
        <div className="xo">{b.map((x, i) => <button key={i} className={x === 'me' ? 'X' : x === 'tch' ? 'O' : ''} onClick={() => place(i)}>{x === 'me' ? '✕' : x === 'tch' ? '◯' : ''}</button>)}</div>
        <div className="small naskh" style={{
        opacity: .8
      }}>✕ {nm} · ◯ الْمُعَلِّمُ</div>
      </div>
      {!T.win && T.turn === 'me' && T.phase === 'card' && <GCard key={b.join() + T.turn} card={card} onResult={ok => ok ? T.setPhase('move') : (setCard(next()), T.pass('tch', GH_WRONG()))} />}
    </div>;
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
  return <div className="gwrap">
      <div className="col center" style={{
      gap: 10
    }}>
        {T.win ? <GEnd win={T.win} nm={nm} onAgain={again} /> : <GTurn turn={T.turn} nm={nm} msg={T.msg || (T.turn === 'me' && T.phase === 'move' ? G('أَحْسَنْتَ! اخْتَرْ عَمُودًا.', 'أَحْسَنْتِ! اخْتَارِي عَمُودًا.') : '')} />}
        <div className="c4">{b.map((x, i) => <button key={i} className={x || ''} onClick={() => drop(i % Cn)} aria-label={'عمود ' + (i % Cn + 1)} />)}</div>
        <div className="small naskh" style={{
        opacity: .8
      }}>{G('أَرْبَعٌ فِي خَطٍّ وَاحِدٍ تَرْبَحُ', 'أَرْبَعٌ فِي خَطٍّ وَاحِدٍ تَرْبَحُ')} · <span style={{
          color: 'var(--acc)'
        }}>●</span> {nm} · <span style={{
          color: '#eab308'
        }}>●</span> الْمُعَلِّمُ</div>
      </div>
      {!T.win && T.turn === 'me' && T.phase === 'card' && <GCard key={b.filter(Boolean).length + T.turn} card={card} onResult={ok => ok ? T.setPhase('move') : (setCard(next()), T.pass('tch', GH_WRONG()))} />}
    </div>;
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
  return <div className="gwrap">
      <div className="col center" style={{
      gap: 10
    }}>
        {T.win ? <GEnd win={T.win} nm={nm} onAgain={again} /> : <GTurn turn={T.turn} nm={nm} msg={T.msg} />}
        <div className="sl">{cells.map(n => {
          const j = SL_JUMP[n];
          return <div key={n} className={j ? j > n ? 'lad' : 'snk' : ''}>
              <span>{L1_AR(n)}</span>
              {j && <span style={{
              fontSize: 10
            }}>{j > n ? '↑ ' : '↓ '}{L1_AR(j)}</span>}
              <span className="row" style={{
              gap: 1
            }}>{pos.me === n && <CharImg def={G(L1CH.boy, L1CH.girl)} s={1.1} />}{pos.tch === n && <CharImg def={G(L1CH.teacherM, L1CH.teacherF)} s={.9} />}</span>
            </div>;
        })}</div>
        <div className="row center" style={{
        gap: 10
      }}>
          {die && <span className="cue naskh" style={{
          fontSize: 26
        }}>{L1_AR(die)}</span>}
          {!T.win && T.phase === 'move' && <button className="btn lg" onClick={roll}>{T.turn === 'me' ? G('ارْمِ النَّرْدَ', 'ارْمِي النَّرْدَ') : 'يَرْمِي الْمُعَلِّمُ النَّرْدَ'}</button>}
        </div>
        <div className="small naskh" style={{
        opacity: .8
      }}>{G('مَنْ يَصِلُ إِلَى ٣٠ أَوَّلًا يَرْبَحُ', 'مَنْ يَصِلُ إِلَى ٣٠ أَوَّلًا يَرْبَحُ')}{pos.me === 0 ? ' · ' + nm + ' عِنْدَ الْبِدَايَةِ' : ''}</div>
      </div>
      {!T.win && T.turn === 'me' && T.phase === 'card' && <GCard key={pos.me + '-' + pos.tch} card={card} onResult={ok => ok ? T.setPhase('move') : (setCard(next()), T.pass('tch', GH_WRONG()))} />}
    </div>;
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
  return <div className="col center" style={{
    gap: 10
  }}>
      {T.win ? <GEnd win={T.win} nm={nm} onAgain={again} /> : <GTurn turn={T.turn} nm={nm} msg={T.msg || (T.turn === 'me' ? G('اقْلِبْ بِطَاقَتَيْنِ: صُورَةً وَكَلِمَتَهَا.', 'اقْلِبِي بِطَاقَتَيْنِ: صُورَةً وَكَلِمَتَهَا.') : '')} />}
      <div className="gh-score naskh">{nm}: {L1_AR(sc.me)} · الْمُعَلِّمُ: {L1_AR(sc.tch)}</div>
      {confirm !== null && <div className="gcard fade">
          <div className="naskh" style={{
        fontSize: 20
      }}>{G('وَجَدْتَ زَوْجًا! قُلِ الْكَلِمَةَ بِصَوْتٍ عَالٍ لِتَأْخُذَهُ.', 'وَجَدْتِ زَوْجًا! قُولِي الْكَلِمَةَ بِصَوْتٍ عَالٍ لِتَأْخُذِيهِ.')}</div>
          <div className="tbar"><span className="lbl">رَأْيُ الْمُعَلِّمِ:</span><button className="tb g" onClick={() => judge(true)}>✓ {G('قَالَهَا صَحِيحَةً', 'قَالَتْهَا صَحِيحَةً')}</button><button className="tb w" onClick={() => judge(false)}>✗ {G('لَمْ يُصِبْ', 'لَمْ تُصِبْ')}</button></div>
        </div>}
      <div className="mem">{cards.map(c => {
        const up = open.includes(c.id) || got[c.pair] !== undefined;
        return <button key={c.id} className={(up ? '' : 'back') + (got[c.pair] !== undefined ? ' got' : '')} onClick={() => flip(c)}>
            {up ? c.pic ? <VView v={c.p.v} s={2.6} /> : <span className="naskh">{plain(c.p.w)}</span> : null}
          </button>;
      })}</div>
    </div>;
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
  return <div className="panel-bg">
      <div className="panel fade col" style={{
      gap: 12,
      maxWidth: 1080
    }}>
        <div className="row between wrapf" style={{
        gap: 8
      }}>
          <div>
            <div className="h2 naskh">مَدِينَةُ الْأَلْعَابِ{cur ? ' · ' + cur.t : ''}</div>
            <div className="small naskh" style={{
            opacity: .75
          }}>{G('تَحَدٍّ بَيْنَكَ وَبَيْنَ الْمُعَلِّمِ بِأَسْئِلَةِ ', 'تَحَدٍّ بَيْنَكِ وَبَيْنَ الْمُعَلِّمِ بِأَسْئِلَةِ ')}{title}</div>
          </div>
          <div className="row" style={{
          gap: 8
        }}>
            <span className="gh-score naskh">{nm} {L1_AR(score.me)} : {L1_AR(score.tch)} الْمُعَلِّمُ</span>
            {g && <button className="btn ghost sm" onClick={() => setG(null)}>أَلْعَابٌ أُخْرَى</button>}
            <button className="btn sm" onClick={onClose}>عَوْدَةٌ إِلَى الْمَدِينَةِ</button>
          </div>
        </div>
        {!g && <div className="gh-grid">{games.map(x => <button key={x.k} className="gh-pick naskh" onClick={() => {
          sfx.pop();
          setG(x.k);
        }}><Icon n={x.ic} s={5} /><span style={{
            fontSize: 20
          }}>{x.t}</span><span className="small" style={{
            opacity: .75
          }}>{x.d}</span></button>)}</div>}
        {!g && <div className="naskh small" style={{
        textAlign: 'center',
        opacity: .8
      }}>{G('قَبْلَ كُلِّ حَرَكَةٍ سُؤَالٌ مِنَ الدَّرْسِ: إِنْ أَجَبْتَ صَحِيحًا لَعِبْتَ، وَإِلَّا صَارَ الدَّوْرُ لِلْمُعَلِّمِ.', 'قَبْلَ كُلِّ حَرَكَةٍ سُؤَالٌ مِنَ الدَّرْسِ: إِنْ أَجَبْتِ صَحِيحًا لَعِبْتِ، وَإِلَّا صَارَ الدَّوْرُ لِلْمُعَلِّمِ.')}</div>}
        {g === 'xo' && <XOGame bank={bank} nm={nm} onWin={onWin} />}
        {g === 'c4' && <C4Game bank={bank} nm={nm} onWin={onWin} />}
        {g === 'sl' && <SLGame bank={bank} nm={nm} onWin={onWin} />}
        {g === 'mem' && <MemGame bank={bank} nm={nm} onWin={onWin} />}
      </div>
    </div>;
}
