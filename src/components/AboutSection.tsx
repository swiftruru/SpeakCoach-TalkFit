const fillerCategories = [
  { label: '填充音', words: ['嗯', '啊', 'ㄜ'], color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  { label: '連接贅詞', words: ['然後', '而且', '再來', '接下來'], color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { label: '指示贅詞', words: ['這個', '那個'], color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  { label: '習慣性開場', words: ['老實說', '我覺得', '基本上', '其實'], color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  { label: '習慣性結尾', words: ['你懂我意思嗎', '對不對', '是不是', '對'], color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
]

const highlights = [
  { num: '01', text: '不用連網也不燒 token，靠 Apple Intelligence on-device 語音辨識' },
  { num: '02', text: '即時回饋用觸覺震動，不跳通知，不打斷你的 flow' },
  { num: '03', text: 'AI 只負責語音轉文字，贅字偵測、語速計算、圖表都是自己寫的邏輯' },
  { num: '04', text: '歷史紀錄讓進步看得見，比「我覺得有變好」有說服力多了' },
]

export function AboutSection() {
  return (
    <section className="border-t border-divider bg-bg-base px-8 py-14">
      {/* Section header */}
      <div className="max-w-5xl mx-auto mb-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 rounded-full bg-accent-blue" />
          <span className="text-xs font-semibold text-accent-blue-light tracking-widest uppercase">
            Design Story
          </span>
        </div>
        <h2 className="text-3xl font-bold text-text-primary leading-tight">
          為什麼做這個 App？
        </h2>
        <p className="text-base text-text-secondary mt-2">
          說來話長 TalkFit &mdash; 一個幫你偵測演講贅字與語速的練習工具
        </p>
      </div>

      {/* Two-column cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">

        {/* ── Left: App idea ── */}
        <div className="bg-bg-surface rounded-3xl border border-divider overflow-hidden flex flex-col">
          {/* Card header strip */}
          <div className="px-6 pt-6 pb-4 border-b border-divider">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <h3 className="text-base font-bold text-text-primary">App 點子</h3>
            </div>
          </div>

          <div className="px-6 py-5 flex flex-col gap-6">
            {/* Problem */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-red flex-shrink-0" />
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">
                  想解決的問題
                </p>
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                練演講或簡報的時候，最煩的就是那些自己聽不到的壞習慣。「然後」講了三十次、每句話結尾都加一個「對」、緊張的時候瘋狂「嗯嗯嗯」。這些東西朋友不好意思跟你說，自己錄音回聽又很折磨，大部分人的結局就是上台之後才發現又犯了。
              </p>
            </div>

            {/* Solution */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green flex-shrink-0" />
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">
                  如何解決
                </p>
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                打開 App，按下開始，對著手機練你的演講。利用 Apple Intelligence on-device 語音辨識，即時轉文字並分析語速和用字習慣。贅字太多或語速失控時，手機輕震提醒，不打斷節奏。練完後生成完整分析報告，清楚看到哪裡需要改。
              </p>
            </div>

            {/* Highlights */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-purple flex-shrink-0" />
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">
                  特色亮點
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                {highlights.map(({ num, text }) => (
                  <div key={num} className="flex items-start gap-3">
                    <span className="text-[10px] font-bold text-accent-blue-light bg-accent-blue/10 rounded-md px-1.5 py-0.5 flex-shrink-0 mt-0.5 tabular-nums">
                      {num}
                    </span>
                    <p className="text-[13px] text-text-secondary leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Filler categories */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-amber flex-shrink-0" />
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest">
                  偵測的贅字類型
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                {fillerCategories.map(({ label, words, color }) => (
                  <div key={label} className="flex items-start gap-2 flex-wrap">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md flex-shrink-0 ${color}`}>
                      {label}
                    </span>
                    <span className="text-[12px] text-text-muted leading-5">
                      {words.join('　')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Participation motivation ── */}
        <div className="bg-bg-surface rounded-3xl border border-divider overflow-hidden flex flex-col">
          {/* Card header strip */}
          <div className="px-6 pt-6 pb-4 border-b border-divider">
            <div className="flex items-center gap-2">
              <span className="text-lg">🙋</span>
              <h3 className="text-base font-bold text-text-primary">為什麼參加這次活動？</h3>
            </div>
          </div>

          <div className="px-6 py-5 flex flex-col gap-0">
            {/* Pull quote */}
            <div className="rounded-2xl bg-accent-blue/8 border border-accent-blue/20 px-4 py-3.5 mb-5">
              <p className="text-[13px] text-text-primary leading-relaxed font-medium">
                最近剛開始接觸 iOS 開發，還在懵懵懂懂的階段。一直很好奇在真正的產品開發流程裡，AI Coding 到底是怎麼運作的——這兩件事加在一起，就是想參加這次活動最大的原因。
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-text-secondary leading-relaxed">
                程式基礎方面，平常主要寫 Web 前端、Python 和 .NET，面對新語言和框架時有一些可以借力的基礎。比較缺的是 iOS 的實戰經驗，還有和其他開發者合作碰撞想法的機會。能在三天內走完從想法到產品的流程，是平常自學很難得到的體驗。
              </p>

              <p className="text-[13px] text-text-secondary leading-relaxed">
                目前已經有一個想做的 App 點子（說來話長 TalkFit），很想趁這個機會驗證看看它到底能不能實現。
              </p>

              <p className="text-[13px] text-text-secondary leading-relaxed">
                也很期待 Hackathon 當天能認識一群對 AI 和 App 同樣有熱情的人，直接在實戰中互相學習。對我來說這不只是學一個新技術，更像是幫自己打開一個新的可能性。
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
