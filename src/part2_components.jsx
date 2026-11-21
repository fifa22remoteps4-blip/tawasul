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
  const tower = <div className="r3tower crane-wrap">
      <svg className={'crane' + (phase === 'build' ? ' busy' : '')} viewBox="0 0 120 90" aria-hidden="true">
        <rect x="14" y="8" width="7" height="82" fill="#f59e0b" stroke="#2a1d24" strokeWidth="2" />
        <path d="M14 20 L21 28 M14 36 L21 44 M14 52 L21 60 M14 68 L21 76" stroke="#2a1d24" strokeWidth="1.5" />
        <rect x="8" y="6" width="104" height="7" fill="#f59e0b" stroke="#2a1d24" strokeWidth="2" />
        <rect x="2" y="13" width="14" height="9" fill="#475569" stroke="#2a1d24" strokeWidth="2" />
        <g className="hook"><line x1="92" y1="13" x2="92" y2="40" stroke="#2a1d24" strokeWidth="2" /><rect x="80" y="40" width="24" height="12" rx="2" fill="#ffd166" stroke="#2a1d24" strokeWidth="2" /></g>
      </svg>
      {phase === 'done' && <div className="r3flag"><Icon n="flag" s={4} /></div>}
      {T.slice(0, built).map((l, k) => ({
      l,
      k
    })).reverse().map(({
      l,
      k
    }, j) => <div key={k} className={'r3floor' + (j === 0 && phase === 'build' ? ' drop' : '')}>
          <span className="lnum">{L1_AR(k + 1)}</span>
          <VView v={l} s={1.8} />
          {hideText ? <span className="naskh">· · · · ·</span> : <span className="naskh">{plain(l.t)}</span>}
        </div>)}
      <div className="r3ground" />
    </div>;
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
    return <div className="r3wrap">
        <div className="col center" style={{
        gap: 12
      }}>
          <div className="naskh" style={{
          fontSize: 19,
          textAlign: 'center'
        }}>{G('انْظُرْ إِلَى الصُّورَةِ، وَقُلِ الْجُمْلَةَ بِصَوْتٍ عَالٍ. إِنْ قُلْتَهَا صَحِيحَةً، صَارَتْ طَابِقًا فِي الْبُرْجِ.', 'انْظُرِي إِلَى الصُّورَةِ، وَقُولِي الْجُمْلَةَ بِصَوْتٍ عَالٍ. إِنْ قُلْتِهَا صَحِيحَةً، صَارَتْ طَابِقًا فِي الْبُرْجِ.')}</div>
          <L1Dots n={T.length} i={built} />
          <div className={'r3block' + (shake ? ' shake' : '')} key={built}>
            <VView v={l} s={4} />
            <div className="naskh" style={{
            fontSize: 17,
            opacity: .8
          }}>الْكَلِمَةُ الَّتِي تُسَاعِدُ:</div>
            <span className="cue naskh" style={{
            fontSize: 28
          }}>{plain(l.key || '')}</span>
          </div>
          <SpeakBtn text={l.t} label={G('اسْمَعِ الْجُمْلَةَ', 'اسْمَعِي الْجُمْلَةَ')} />
          <L1Bar onGrade={g => {
          if (g === 'full') {
            sfx.ok();
            setMsg('');
            const nb = built + 1;
            setBuilt(nb);
            if (nb >= T.length) setPhase('whole');
          } else bad(g);
        }} />
          {msg && <div className="warnline">{msg}</div>}
        </div>
        {tower}
      </div>;
  }
  if (phase === 'whole' || phase === 'narr') return <div className="r3wrap">
      <div className="col center" style={{
      gap: 12
    }}>
        <span className="pill naskh">{phase === 'whole' ? G('اكْتَمَلَ الْبُرْجُ!', 'اكْتَمَلَ الْبُرْجُ!') : 'السَّرْدُ الْوَاحِدُ'}</span>
        <div className="naskh" style={{
        fontSize: 19,
        textAlign: 'center'
      }}>{phase === 'whole' ? G('قُلِ الطَّوَابِقَ كُلَّهَا، وَاحِدًا بَعْدَ وَاحِدٍ، مِنَ الْأَسْفَلِ إِلَى الْأَعْلَى.', 'قُولِي الطَّوَابِقَ كُلَّهَا، وَاحِدًا بَعْدَ وَاحِدٍ، مِنَ الْأَسْفَلِ إِلَى الْأَعْلَى.') : G('اخْتَفَتِ الْكَلِمَاتُ، وَبَقِيَتِ الصُّوَرُ. قُلِ الْحِكَايَةَ كُلَّهَا مُتَّصِلَةً، بِلَا تَوَقُّفٍ.', 'اخْتَفَتِ الْكَلِمَاتُ، وَبَقِيَتِ الصُّوَرُ. قُولِي الْحِكَايَةَ كُلَّهَا مُتَّصِلَةً، بِلَا تَوَقُّفٍ.')}</div>
        <L1Bar onGrade={g => {
        if (g === 'full') {
          sfx.win();
          setMsg('');
          setPhase(phase === 'whole' ? 'narr' : 'done');
        } else bad(g);
      }} />
        {msg && <div className="warnline">{msg}</div>}
      </div>
      {tower}
    </div>;
  return <div className="r3wrap">
      <DoneBox msg={G('بَنَيْتَ الْبُرْجَ، وَقُلْتَ الْحِكَايَةَ كُلَّهَا!', 'بَنَيْتِ الْبُرْجَ، وَقُلْتِ الْحِكَايَةَ كُلَّهَا!')} onDone={onDone} />
      {tower}
    </div>;
}
function WriteSt(props) {
  return props.U.write.para ? <ParaWrite {...props} /> : <WriteLetters {...props} />;
}
function ParaWrite({
  U,
  onDone
}) {
  const W = U.write;
  const [tick, setTick] = useState([]);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  const checks = ['كَتَبَ أَوْقَاتَ الْيَوْمِ: فِي الصَّبَاحِ، بَعْدَ الْعَصْرِ، فِي الْمَسَاءِ', 'رَبَطَ الْأَحْدَاثَ بِـ«ثُمَّ» وَ«بَعْدَ ذَلِكَ»', 'كُلُّ أَفْعَالِهِ بِـ«أَ»، وَلَيْسَ فِيهَا «بْـ»', 'لَيْسَ فِي فِقْرَتِهِ كَلِمَةٌ عَامِّيَّةٌ', 'وَضَعَ نُقْطَةً فِي آخِرِ كُلِّ جُمْلَةٍ'];
  return <div className="col" style={{
    gap: 12
  }}>
      <div className="papertask"><div className="ttl">اكْتُبْ يَوْمَكَ فِي فِقْرَةٍ وَاحِدَةٍ عَلَى وَرَقَتِكَ، بِالْفُصْحَى</div><div className="task naskh" style={{
        fontSize: 20
      }}>اسْتَعْمِلْ: فِي الصَّبَاحِ · ثُمَّ · بَعْدَ ذَلِكَ · بَعْدَ الْعَصْرِ · فِي الْمَسَاءِ</div></div>
      <div className="row wrapf" style={{
      gap: 6
    }}>{U.templates.map(t => <span key={t} className="chip naskh">{t}</span>)}</div>
      {show ? <div className="papercard fade"><TT text={W.model} /></div> : <button className="btn ghost sm" onClick={() => setShow(true)}>أَظْهِرِ الْفِقْرَةَ النَّمُوذَجِيَّةَ (لِلْمُعَلِّمِ)</button>}
      <b className="naskh" style={{
      fontSize: 18
    }}>مُرَاجَعَةُ الْوَرَقَةِ:</b>
      <div className="row wrapf" style={{
      gap: 6
    }}>{checks.map((c, i) => <button key={i} className={'ckb' + (tick.includes(i) ? ' on' : '')} onClick={() => {
        sfx.pop();
        setTick(tick.includes(i) ? tick.filter(x => x !== i) : [...tick, i]);
      }}>{tick.includes(i) ? '✓' : '○'} {c}</button>)}</div>
      {msg && <div className="warnline">{msg}</div>}
      <div className="tbar">
        <span className="lbl">رَأْيُ الْمُعَلِّمِ:</span>
        <button className="tb g" disabled={tick.length < checks.length} onClick={() => {
        sfx.win();
        onDone();
      }}>✓ فِقْرَةٌ صَحِيحَةٌ</button>
        <button className="tb w" onClick={() => {
        sfx.bad();
        setTick([]);
        setMsg('صَحِّحِ الْجُمَلَ عَلَى وَرَقَتِكَ: ابْحَثْ عَنْ «بْـ» وَعَنِ الْكَلِمَاتِ الْعَامِّيَّةِ.');
      }}>✎ فِيهَا خَطَأٌ</button>
      </div>
    </div>;
}
function WriteLetters({
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
  const skip = stage === 'letters' || stage === 'join' ? <button className="btn ghost sm skipbtn" onClick={() => setStage('word')}>{G('يَعْرِفُ الْحُرُوفَ: إِلَى الْكَلِمَةِ مُبَاشَرَةً', 'تَعْرِفُ الْحُرُوفَ: إِلَى الْكَلِمَةِ مُبَاشَرَةً')}</button> : null;
  const steps = [['letters', 'الْحُرُوفُ'], ['join', 'الْوَصْلُ'], ['word', 'الْكَلِمَةُ'], ['sentence', 'الْجُمْلَةُ']];
  const head = <div className="row wrapf between" style={{
    gap: 8
  }}>
      <div className="steps naskh">{steps.map(([k, t], i) => <span key={k} className={stage === k || k === 'sentence' && stage === 'check' ? 'on' : ''}>{L1_AR(i + 1)}. {t}</span>)}</div>
      {words.length > 1 && stage !== 'sentence' && stage !== 'check' && <span className="pill naskh">الْكَلِمَةُ {L1_AR(wi + 1)} مِنْ {L1_AR(words.length)}</span>}
      {skip}
    </div>;
  const paperNote = <div className="papernote naskh">{G('جَهِّزْ وَرَقَتَكَ وَقَلَمَكَ. الْمُعَلِّمُ يَكْتُبُ عَلَى اللَّوْحِ، وَأَنْتَ تَكْتُبُ عَلَى الْوَرَقَةِ.', 'جَهِّزِي وَرَقَتَكِ وَقَلَمَكِ. الْمُعَلِّمُ يَكْتُبُ عَلَى اللَّوْحِ، وَأَنْتِ تَكْتُبِينَ عَلَى الْوَرَقَةِ.')}</div>;
  if (stage === 'letters') {
    const ch = teach[li],
      L = L1_LET[ch];
    const fs = L.c ? ['iso', 'ini', 'med', 'fin'] : ['iso', 'fin'];
    return <div className="col" style={{
      gap: 12
    }}>
        {head}
        {li === 0 && wi === 0 && paperNote}
        <div className="naskh" style={{
        fontSize: 19
      }}>
          {W.newL ? 'حَرْفٌ جَدِيدٌ فِي كَلِمَةِ «' : 'حُرُوفُ كَلِمَةِ «'}{cw.word}»: {teach.map((c, k) => <span key={c} className={'lchip' + (k === li ? ' on' : k < li ? ' done' : '')}>{c}</span>)}
          {known.length > 0 && <span style={{
          marginInlineStart: 12,
          opacity: .75
        }}> · {G('حُرُوفٌ تَعْرِفُهَا:', 'حُرُوفٌ تَعْرِفِينَهَا:')} {known.map(c => <span key={c} className="lchip done">{c}</span>)}</span>}
        </div>
        <div className="writegrid">
          <div className="lettercard">
            <div className="col center" style={{
            gap: 4
          }}>
              <div className="bigletter">{ch}</div>
              <button className="btn ghost sm" onClick={() => speak(L.n)}><Icon n="speaker" s={2.5} /><span className="naskh">{L.n}</span></button>
            </div>
            <div className="col" style={{
            gap: 8,
            flex: 1
          }}>
              <div className="formsrow">{fs.map(f => <div key={f} className="formcell"><div className="fl">{l1Form(ch, f)}</div><div className="fn naskh">{L1_FORM_LBL[f]}</div></div>)}</div>
              <div className={'naskh connote ' + (L.c ? 'yes' : 'no')}>{L.c ? 'هَذَا الْحَرْفُ يَتَّصِلُ بِالْحَرْفِ الَّذِي بَعْدَهُ.' : 'هَذَا الْحَرْفُ لَا يَتَّصِلُ بِالْحَرْفِ الَّذِي بَعْدَهُ.'}</div>
            </div>
          </div>
          <TeacherBoard key={'l' + wi + '-' + li} guide={ch} height={230} kidLine={paper3} doneLabel={G('✓ كَتَبَهُ عَلَى وَرَقَتِهِ', '✓ كَتَبَتْهُ عَلَى وَرَقَتِهَا')} onDone={() => {
          if (li + 1 < teach.length) setLi(li + 1);else setStage('join');
        }} />
        </div>
      </div>;
  }
  if (stage === 'join') return <div className="col" style={{
    gap: 12
  }}>
      {head}
      {wi === 0 && teach.length === 0 && paperNote}
      <div className="naskh" style={{
      fontSize: 19
    }}>{G('انْظُرْ كَيْفَ تَتَّصِلُ الْحُرُوفُ وَاحِدًا بَعْدَ وَاحِدٍ.', 'انْظُرِي كَيْفَ تَتَّصِلُ الْحُرُوفُ وَاحِدًا بَعْدَ وَاحِدٍ.')}</div>
      <div className="row wrapf center" style={{
      gap: 8
    }}>{cw.letters.map((c, k) => <button key={k} className={'tile' + (k < got ? ' used' : '')} onClick={() => {
        if (k === got) {
          sfx.pop();
          setGot(got + 1);
        } else if (k > got) sfx.bad();
      }}>{c}</button>)}</div>
      <div className="joinrow">
        {forms.slice(0, got).map((f, k) => <div key={k} className="formcell pop"><div className="fl">{l1Form(f.ch, f.f)}</div><div className="fn naskh">{L1_FORM_LBL[f.f]}</div></div>)}
        {got === cw.letters.length && <React.Fragment><div className="eq">=</div><div className="formcell big pop"><div className="fl">{cw.word}</div></div></React.Fragment>}
      </div>
      {got === cw.letters.length && <div className="row center" style={{
      gap: 10
    }}><SpeakBtn text={cw.word} /><button className="btn lg" onClick={() => setStage('word')}>التَّالِي</button></div>}
    </div>;
  if (stage === 'word') return <div className="col" style={{
    gap: 12
  }}>
      {head}
      <div className="row center" style={{
      gap: 10
    }}><div className="bigword naskh">{cw.word}</div><SpeakBtn text={cw.word} label={false} /></div>
      <TeacherBoard key={'word' + wi} guide={cw.word} height={220} kidLine={paper3} doneLabel={G('✓ كَتَبَهَا عَلَى وَرَقَتِهِ', '✓ كَتَبَتْهَا عَلَى وَرَقَتِهَا')} onDone={nextWord} />
    </div>;
  if (stage === 'sentence') return <div className="col" style={{
    gap: 12
  }}>
      {head}
      <div className="papertask"><div className="ttl">{G('اكْتُبْ عَلَى وَرَقَتِكَ', 'اكْتُبِي عَلَى وَرَقَتِكِ')}</div><div className="task"><TT text={W.sentence} /></div></div>
      {msg && <div className="warnline">{msg}</div>}
      <TeacherBoard key={'s' + round} guide={plain(W.sentence)} height={200} kidLine={G('انْظُرْ إِلَى الْقَلَمِ، ثُمَّ اكْتُبِ الْجُمْلَةَ عَلَى وَرَقَتِكَ، وَأَرِهَا لِلْمُعَلِّمِ.', 'انْظُرِي إِلَى الْقَلَمِ، ثُمَّ اكْتُبِي الْجُمْلَةَ عَلَى وَرَقَتِكِ، وَأَرِيهَا لِلْمُعَلِّمِ.')} doneLabel={G('✓ كَتَبَهَا، وَأَرَانِي الْوَرَقَةَ', '✓ كَتَبَتْهَا، وَأَرَتْنِي الْوَرَقَةَ')} onDone={() => {
      setTick([]);
      setStage('check');
    }} />
    </div>;
  const checks = G(['كَتَبَ الْكَلِمَاتِ كُلَّهَا', 'تَرَكَ مَسَافَةً بَيْنَ الْكَلِمَاتِ', 'وَضَعَ عَلَامَةً فِي الْآخِرِ'], ['كَتَبَتِ الْكَلِمَاتِ كُلَّهَا', 'تَرَكَتْ مَسَافَةً بَيْنَ الْكَلِمَاتِ', 'وَضَعَتْ عَلَامَةً فِي الْآخِرِ']);
  return <div className="col" style={{
    gap: 12
  }}>
      {head}
      <div className="papertask"><div className="ttl">{G('الْجُمْلَةُ الَّتِي كَتَبَهَا', 'الْجُمْلَةُ الَّتِي كَتَبَتْهَا')}</div><div className="task"><TT text={W.sentence} /></div></div>
      <b className="naskh" style={{
      fontSize: 18
    }}>مُرَاجَعَةُ الْوَرَقَةِ:</b>
      <div className="row wrapf" style={{
      gap: 6
    }}>{checks.map((c, i) => <button key={i} className={'ckb' + (tick.includes(i) ? ' on' : '')} onClick={() => {
        sfx.pop();
        setTick(tick.includes(i) ? tick.filter(x => x !== i) : [...tick, i]);
      }}>{tick.includes(i) ? '✓' : '○'} {c}</button>)}</div>
      <div className="tbar fade">
        <span className="lbl">رَأْيُ الْمُعَلِّمِ:</span>
        <button className="tb g" disabled={tick.length < checks.length} onClick={() => {
        sfx.win();
        onDone();
      }}>✓ صَحِيحَةٌ</button>
        <button className="tb w" onClick={() => {
        sfx.bad();
        setMsg(G('صَحِّحِ الْجُمْلَةَ عَلَى وَرَقَتِكَ. انْظُرْ إِلَى الْقَلَمِ مَرَّةً أُخْرَى.', 'صَحِّحِي الْجُمْلَةَ عَلَى وَرَقَتِكِ. انْظُرِي إِلَى الْقَلَمِ مَرَّةً أُخْرَى.'));
        setRound(round + 1);
        setStage('sentence');
      }}>✎ فِيهَا خَطَأٌ</button>
      </div>
    </div>;
}
function R3WriteBox({
  D,
  onDone
}) {
  const [i, setI] = useState(0);
  const s = D.write[i];
  return <div className="col" style={{
    gap: 12
  }}>
      <div className="h2 naskh" style={{
      textAlign: 'center'
    }}>{G('آخِرُ خُطْوَةٍ: اكْتُبْ جُمْلَتَيْنِ مِنْ حِكَايَتِكَ', 'آخِرُ خُطْوَةٍ: اكْتُبِي جُمْلَتَيْنِ مِنْ حِكَايَتِكِ')}</div>
      <L1Dots n={D.write.length} i={i} />
      <div className="papertask"><div className="ttl">{G('اكْتُبْ عَلَى وَرَقَتِكَ', 'اكْتُبِي عَلَى وَرَقَتِكِ')}</div><div className="task"><TT text={s} /></div></div>
      <TeacherBoard key={'zw' + i} guide={plain(s)} height={200} kidLine={G('انْظُرْ إِلَى الْقَلَمِ، ثُمَّ اكْتُبِ الْجُمْلَةَ بِخَطِّكَ.', 'انْظُرِي إِلَى الْقَلَمِ، ثُمَّ اكْتُبِي الْجُمْلَةَ بِخَطِّكِ.')} doneLabel={G('✓ كَتَبَهَا، وَأَرَانِي الْوَرَقَةَ', '✓ كَتَبَتْهَا، وَأَرَتْنِي الْوَرَقَةَ')} onDone={() => {
      sfx.ok();
      if (i + 1 < D.write.length) setI(i + 1);else onDone();
    }} />
    </div>;
}
