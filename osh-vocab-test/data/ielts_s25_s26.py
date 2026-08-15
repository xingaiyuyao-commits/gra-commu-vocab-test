# -*- coding: utf-8 -*-
"""IELTS月1分・Day29〜30用（Series25「動詞⑨」・Series26「動詞⑩」、新規40語）。
ユーザー指示により2周目（既存語の使い回し）はClacelのみとし、TOEIC/IELTSは新規語で対応する方針に変更。
NAWLの実質使用可能語をほぼ使い切ったため、一般的な学術頻出動詞から選定。時制曖昧文チェック・40%/60%比率を執筆時に適用済み。"""

SERIES = {}

SERIES[25] = dict(
    pos_label="動詞 Verbs ⑨",
    words=[
        ("postulate", "/ˈpɑːs.tʃə.leɪt/", "verb", "postulates, postulated", "仮定する、提唱する", "This theory still <i>postulates</i> that all matter is made of tiny particles.", "この理論は今でも、全ての物質が微小な粒子でできていると仮定している。"),
        ("stipulate", "/ˈstɪp.jə.leɪt/", "verb", "stipulates, stipulated", "規定する、明記する", "This contract currently <i>stipulates</i> a thirty-day notice period.", "この契約書は現在、30日前の通知期間を規定している。"),
        ("substantiate", "/səbˈstæn.ʃi.eɪt/", "verb", "substantiates, substantiated", "実証する、裏付ける", "Last year, new evidence <i>substantiated</i> the original claim.", "昨年、新しい証拠が当初の主張を裏付けた。"),
        ("corroborate", "/kəˈrɑː.bə.reɪt/", "verb", "corroborates, corroborated", "裏付ける、確証する", "Additional testimony should <i>corroborate</i> the police report.", "追加の証言は警察の報告書を裏付けるはずだ。"),
        ("extrapolate", "/ɪkˈstræp.ə.leɪt/", "verb", "extrapolates, extrapolated", "推定する、外挿する", "Last year, researchers <i>extrapolated</i> future trends from the existing data.", "昨年、研究者たちは既存のデータから将来の傾向を推定した。"),
        ("synthesize", "/ˈsɪn.θə.saɪz/", "verb", "synthesizes, synthesized", "統合する、合成する", "The report will <i>synthesize</i> findings from multiple studies.", "その報告書は複数の研究結果を統合する予定だ。"),
        ("formalize", "/ˈfɔːr.mə.laɪz/", "verb", "formalizes, formalized", "正式なものにする", "Please <i>formalize</i> the agreement in writing.", "その合意を書面で正式なものにしてください。"),
        ("codify", "/ˈkoʊ.də.faɪ/", "verb", "codifies, codified", "成文化する、体系化する", "Last century, the rules were <i>codified</i> into a single legal document.", "前世紀、その規則は一つの法律文書にまとめられた。"),
        ("delineate", "/dɪˈlɪn.i.eɪt/", "verb", "delineates, delineated", "明確に示す、輪郭を描く", "This map currently <i>delineates</i> the boundary between the two regions.", "この地図は現在、その二つの地域の境界を明確に示している。"),
        ("enumerate", "/ɪˈnuː.mə.reɪt/", "verb", "enumerates, enumerated", "列挙する", "Please <i>enumerate</i> the main causes of the decline.", "その減少の主な原因を列挙してください。"),
        ("exemplify", "/ɪɡˈzem.plə.faɪ/", "verb", "exemplifies, exemplified", "例証する、典型となる", "This case still <i>exemplifies</i> a common problem in the field.", "この事例は今でも、その分野におけるよくある問題の典型となっている。"),
        ("annotate", "/ˈæn.ə.teɪt/", "verb", "annotates, annotated", "注釈をつける", "Please <i>annotate</i> the document with your comments.", "その文書にあなたのコメントで注釈をつけてください。"),
        ("transcend", "/trænˈsend/", "verb", "transcends, transcended", "超越する", "Great art can <i>transcend</i> cultural boundaries.", "優れた芸術は文化の境界を超越することがある。"),
        ("underpin", "/ˌʌn.dɚˈpɪn/", "verb", "underpins, underpinned", "支える、基礎となる", "Strong evidence still <i>underpins</i> the researchers' conclusion.", "強力な証拠が今でも研究者たちの結論を支えている。"),
        ("disseminate", "/dɪˈsem.ə.neɪt/", "verb", "disseminates, disseminated", "広める、普及させる", "The organization will <i>disseminate</i> the report to all members.", "その団体はその報告書を全会員に広める予定だ。"),
        ("perpetuate", "/pɚˈpetʃ.u.eɪt/", "verb", "perpetuates, perpetuated", "永続させる", "Last year, the policy <i>perpetuated</i> existing inequalities.", "昨年、その方針は既存の不平等を永続させた。"),
        ("proliferate", "/prəˈlɪf.ə.reɪt/", "verb", "proliferates, proliferated", "急増する、増殖する", "Social media platforms <i>proliferated</i> rapidly last decade.", "この前の10年、ソーシャルメディアのプラットフォームは急速に急増した。"),
        ("reconcile", "/ˈrek.ən.saɪl/", "verb", "reconciles, reconciled", "和解させる、調和させる", "Last month, the two companies <i>reconciled</i> their differences.", "先月、その二つの会社は意見の相違を解消した。"),
        ("refute", "/rɪˈfjuːt/", "verb", "refutes, refuted", "論駁する、反証する", "Last year, the new data <i>refuted</i> the earlier hypothesis.", "昨年、新しいデータは以前の仮説を反証した。"),
        ("reiterate", "/riˈɪt̬.ə.reɪt/", "verb", "reiterates, reiterated", "繰り返し述べる", "The professor will <i>reiterate</i> the main points at the end.", "教授は最後に要点を繰り返し述べる予定だ。"),
    ],
)

SERIES[26] = dict(
    pos_label="動詞 Verbs ⑩",
    words=[
        ("stem", "/stem/", "verb", "stems, stemmed", "生じる、由来する", "Historically, many of these problems <i>stemmed</i> from poor communication.", "歴史的に、これらの問題の多くはコミュニケーション不足に起因していた。"),
        ("permeate", "/ˈpɝː.mi.eɪt/", "verb", "permeates, permeated", "浸透する", "New ideas can <i>permeate</i> an organization slowly, even without formal training.", "新しいアイデアは、正式な研修がなくても組織にゆっくりと浸透することがある。"),
        ("instigate", "/ˈɪn.stə.ɡeɪt/", "verb", "instigates, instigated", "扇動する、引き起こす", "Last month, a minor dispute <i>instigated</i> a major conflict.", "先月、些細な対立が大きな衝突を引き起こした。"),
        ("legitimize", "/lɪˈdʒɪt̬.ə.maɪz/", "verb", "legitimizes, legitimized", "正当化する", "Last year, the new law <i>legitimized</i> practices that were once informal.", "昨年、その新しい法律はかつて非公式だった慣行を正当化した。"),
        ("optimize", "/ˈɑːp.tə.maɪz/", "verb", "optimizes, optimized", "最適化する", "Last month, engineers <i>optimized</i> the code for faster performance.", "先月、エンジニアたちはより速いパフォーマンスのためにコードを最適化した。"),
        ("cohere", "/koʊˈhɪr/", "verb", "coheres, cohered", "まとまる、一貫する", "The various arguments in the essay do not <i>cohere</i> well.", "そのエッセイの様々な議論はうまくまとまっていない。"),
        ("complicate", "/ˈkɑːm.plə.keɪt/", "verb", "complicates, complicated", "複雑にする", "Last year, new regulations <i>complicated</i> the approval process.", "昨年、新しい規制が承認プロセスを複雑にした。"),
        ("curtail", "/kɚˈteɪl/", "verb", "curtails, curtailed", "削減する、切り詰める", "The company plans to <i>curtail</i> spending next quarter.", "その会社は来四半期、支出を削減する計画だ。"),
        ("underlie", "/ˌʌn.dɚˈlaɪ/", "verb", "underlies, underlay", "根底にある", "A simple principle still <i>underlies</i> this complex theory.", "単純な原理が今でもこの複雑な理論の根底にある。"),
        ("encapsulate", "/ɪnˈkæp.sjə.leɪt/", "verb", "encapsulates, encapsulated", "要約する、凝縮する", "This sentence still <i>encapsulates</i> the author's main argument well.", "この一文は今でも著者の主な主張をうまく要約している。"),
        ("mitigate", "/ˈmɪt̬.ə.ɡeɪt/", "verb", "mitigates, mitigated", "軽減する", "New measures were introduced to <i>mitigate</i> the risk.", "リスクを軽減するために新しい対策が導入された。"),
        ("alleviate", "/əˈliː.vi.eɪt/", "verb", "alleviates, alleviated", "緩和する", "Last month, the new policy <i>alleviated</i> some of the financial pressure.", "先月、その新しい方針は財政的な圧力の一部を緩和した。"),
        ("exacerbate", "/ɪɡˈzæs.ɚ.beɪt/", "verb", "exacerbates, exacerbated", "悪化させる", "Poor sleep can <i>exacerbate</i> stress levels.", "睡眠不足はストレスレベルを悪化させることがある。"),
        ("counteract", "/ˌkaʊn.t̬ɚˈækt/", "verb", "counteracts, counteracted", "中和する、対抗する", "Last year, the government introduced measures to <i>counteract</i> inflation.", "昨年、政府はインフレに対抗する対策を導入した。"),
        ("rectify", "/ˈrek.tə.faɪ/", "verb", "rectifies, rectified", "是正する、修正する", "Please <i>rectify</i> the error before submitting the final report.", "最終報告書を提出する前にその誤りを是正してください。"),
        ("consolidate", "/kənˈsɑː.lə.deɪt/", "verb", "consolidates, consolidated", "統合する、強化する", "Last year, the two firms <i>consolidated</i> their operations.", "昨年、その二つの企業は業務を統合した。"),
        ("streamline", "/ˈstriːm.laɪn/", "verb", "streamlines, streamlined", "効率化する", "Last year, the new software <i>streamlined</i> the entire workflow.", "昨年、その新しいソフトウェアは業務フロー全体を効率化した。"),
        ("juxtapose", "/ˈdʒʌk.stə.poʊz/", "verb", "juxtaposes, juxtaposed", "並置する", "Last year, the exhibit <i>juxtaposed</i> modern and ancient art.", "昨年、その展示会は現代美術と古代美術を並置した。"),
        ("calibrate", "/ˈkæl.ə.breɪt/", "verb", "calibrates, calibrated", "調整する、較正する", "Yesterday, technicians <i>calibrated</i> the equipment before the test.", "昨日、技術者たちは試験の前に機器を較正した。"),
        ("paraphrase", "/ˈper.ə.freɪz/", "verb", "paraphrases, paraphrased", "言い換える", "Please <i>paraphrase</i> the quotation in your own words.", "その引用をあなた自身の言葉で言い換えてください。"),
    ],
)
