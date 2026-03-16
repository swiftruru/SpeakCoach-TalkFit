export function AboutSection() {
  const fillerTags: { label: string; words: string }[] = [
    { label: '填充音', words: '嗯、啊、ㄜ' },
    { label: '連接贅詞', words: '然後、而且、再來、接下來' },
    { label: '指示贅詞', words: '這個、那個' },
    { label: '習慣性開場白', words: '老實說、我覺得、基本上、其實' },
    { label: '習慣性結尾', words: '你懂我意思嗎、對不對、是不是、對' },
  ]

  const highlights = [
    '不用連網也不燒 token，靠 Apple Intelligence on-device 語音辨識',
    '即時回饋用觸覺震動，不跳通知，不打斷你的 flow',
    'AI 只負責語音轉文字，贅字偵測、語速計算、統計圖表都是自己寫的邏輯',
    '歷史紀錄讓進步看得見，比「我覺得有變好」有說服力多了',
  ]

  return (
    <section className="border-t border-divider bg-bg-base px-8 py-12">
      {/* Section header */}
      <div className="max-w-5xl mx-auto mb-8">
        <span className="text-xs px-2.5 py-1 rounded-full bg-accent-blue/10 text-accent-blue-light font-medium">
          設計動機
        </span>
        <h2 className="text-xl font-bold text-text-primary mt-3">
          為什麼做這個 App？
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          說來話長 TalkFit — 一個幫你偵測演講贅字與語速的練習工具
        </p>
      </div>

      {/* Two-column cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Left: App idea */}
        <div className="bg-bg-surface rounded-2xl p-6 border border-divider flex flex-col gap-5">
          <h3 className="text-sm font-bold text-text-primary">App 點子</h3>

          {/* Problem */}
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
              ＊ 想解決的問題
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              練演講或簡報的時候，最煩的就是那些自己聽不到的壞習慣。「然後」講了三十次、每句話結尾都加一個「對」、緊張的時候瘋狂「嗯嗯嗯」。這些東西朋友不好意思跟你說，自己錄音回聽又很折磨，大部分人的結局就是上台之後才發現又犯了。
            </p>
          </div>

          {/* Solution */}
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-1.5">
              ＊ 如何解決
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              打開 App，按下開始，對著手機練你的演講。App 利用 Apple Intelligence 的 on-device 語音辨識，即時把你說的話轉成文字，同時在背景分析語速和用字習慣。如果贅字太多或語速失控，手機會輕輕震一下提醒你，不會打斷節奏。講完後生成完整分析報告，清楚看到哪裡需要改。
            </p>
          </div>

          {/* Highlights */}
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">
              ＊ 特色亮點
            </p>
            <ul className="flex flex-col gap-1.5">
              {highlights.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary leading-relaxed">
                  <span className="text-accent-blue-light mt-0.5 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Filler word types */}
          <div>
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wide mb-2">
              偵測的贅字類型
            </p>
            <div className="flex flex-col gap-2">
              {fillerTags.map(({ label, words }) => (
                <div key={label} className="flex items-start gap-2 flex-wrap">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-bg-card2 text-text-secondary border border-divider font-medium flex-shrink-0">
                    {label}
                  </span>
                  <span className="text-[11px] text-text-muted leading-5">{words}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Participation motivation */}
        <div className="bg-bg-surface rounded-2xl p-6 border border-divider flex flex-col gap-4">
          <h3 className="text-sm font-bold text-text-primary">為什麼參加這次活動？</h3>

          <p className="text-sm text-text-secondary leading-relaxed">
            最近剛開始接觸 iOS 開發，但老實說還在懵懵懂懂的階段，很多東西看得懂卻還不太會自己從頭建起來。另一方面，平常雖然會用 AI 工具輔助寫程式，但一直很好奇在真正的產品開發流程裡，AI Coding 到底是怎麼運作的。這兩件事加在一起，就是想參加這次活動最大的原因。
          </p>

          <p className="text-sm text-text-secondary leading-relaxed">
            程式基礎方面，平常主要寫 Web 前端、Python 和 .NET，面對新語言和框架時有一些可以借力的基礎。比較缺的是 iOS 的實戰經驗，還有和其他開發者合作碰撞想法的機會。能在三天內走完從想法到產品的流程，是平常自學很難得到的體驗。
          </p>

          <p className="text-sm text-text-secondary leading-relaxed">
            目前已經有一個想做的 App 點子（說來話長 TalkFit，一個幫你偵測演講贅字和語速的練習工具），很想趁這個機會驗證看看它到底能不能實現。
          </p>

          <p className="text-sm text-text-secondary leading-relaxed">
            也很期待 Hackathon 當天能認識一群對 AI 和 App 同樣有熱情的人，直接在實戰中跟大家互相學習。對我來說這不只是學一個新技術，更像是幫自己打開一個新的可能性。
          </p>
        </div>
      </div>
    </section>
  )
}
