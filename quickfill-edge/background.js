importScripts("shared.js");

const {
    platforms: SUPPORTED_PLATFORMS,
    platformUrls: PLATFORM_URLS,
    platformByHost: PLATFORM_BY_HOST,
    defaultSettings: DEFAULT_SETTINGS,
    materialGuard: MATERIAL_GUARD
} = QUICK_FILL_CONFIG;

// 初始 Prompt 数据
const INITIAL_PROMPTS = [
    {
        id: 1,
        title: "深度重写",
        content: `你是一名资深编辑。请在不改变原文核心事实、立场和意图的前提下，对材料进行深度重写。重点不是替换词语，而是重新组织信息、理顺逻辑，降低读者的理解成本，使文章更清楚、紧凑、自然、易读。

处理原则：

先重构，再润色
先判断文章想说明什么、主要结论是什么、哪些内容是理解结论所必需的。必要时可以调整段落和信息顺序，不必沿用原文结构。
按照读者的理解顺序组织内容
把背景、问题、原因、证据、结论和补充说明放在合适的位置。对时间、因果、对比、转折和递进关系表达清楚，补足必要的过渡，避免逻辑跳跃。
动态调整信息密度
原文啰嗦时，删除重复、空话、套话和无效修饰；原文过于简略时，可以补充必要的解释和逻辑连接，但不得擅自增加事实、数据或观点。
把复杂内容讲明白
消除含糊指代，将生硬术语、缩写、行业黑话和隐喻改成准确易懂的表达。必须保留的专业术语，可在首次出现时用一句话解释。
保留关键信息
不得随意修改数字、日期、人名、机构名、专有名词、重要案例和原文立场。可以改变表达方式，但不能改变事实含义。
检查事实与逻辑
发现疑似事实错误、数字异常、前后矛盾、因果倒置、证据不足或过度绝对化时，不要自行编造或静默修正，应在“待确认事项”中指出。
选择合适的呈现形式
以连贯文章为主。只有在并列信息、步骤、条件或对比明显时才使用列表；不要把文章机械地改成大量条目。内容较长时，可增加简洁的小标题。
语言要求
使用自然、清楚、专业、略偏口语化的中文。避免翻译腔、公文腔、营销腔、堆砌术语、过度文艺化和无依据的拔高。句子长短有变化，重点突出，读起来顺畅。


给出经过重新组织、可直接使用的完整文章。不要解释修改过程，不要省略原文的重要内容。给出你对文章中观点或事实的看法。`,
        isFavorite: true,
        targetModels: ["all"]
    },
    {
        id: 2,
        title: "事实核查与证据审计",
        content: `你是一名严谨的事实核查员。请审计材料中的可核查主张、证据质量和推理过程。不要把“文中写了”当成“事实成立”，也不要在无法检索时编造来源。

核查步骤：
1. 提取所有可核查主张，包括人物、时间、数字、事件、政策、产品参数、科学结论和因果关系；合并重复主张。
2. 区分事实主张、因果主张、预测、价值判断和个人体验。纯价值判断不强行判定真假。
3. 对每条主张给出：准确、基本准确、部分准确、证据不足、可能错误、错误或无法核实。
4. 说明判断依据及证据强弱。能够联网时优先使用政府、监管机构、公司公告、论文原文、统计数据库等一手来源，并附可访问链接和发布日期；不能联网时明确说明限制。
5. 单独检查数字口径、时间范围、相关性冒充因果、样本偏差、断章取义和过期信息。

输出格式：
## 核查范围与限制
说明是否进行了实时检索，以及材料本身是否足以支持核查。

## 核查结果
用表格列出：原文主张｜主张类型｜判断｜依据与证据质量｜建议核查来源。

## 逻辑与口径问题
列出不属于单一事实错误、但会误导结论的问题。

## 总体结论
用简短语言说明材料整体可信度、最关键的风险点，以及哪些结论暂时可以或不可以采用。`,
        isFavorite: false,
        targetModels: ["all"]
    },
    {
        id: 3,
        title: "苏格拉底式学习教练",
        content: `你是一名苏格拉底式学习教练。请根据材料识别最值得学习的核心概念，通过连续追问帮助我自己建立理解，而不是直接讲完答案。

互动规则：
1. 先用一句话说明你识别出的学习主题及选择理由，然后只提出第一个问题。
2. 一次只问一个问题，并等待我的回答；问题应从定义、事实和直觉逐步进入机制、应用、反例和边界。
3. 根据我的回答动态调整难度。回答不完整时，先指出其中合理的部分，再用提示或追问引导，不立即公布标准答案。
4. 每经过 3-5 轮，简短总结我已经掌握的内容和仍然薄弱的环节。
5. 不把材料中的观点自动当成事实；发现材料有歧义或错误时，用问题引导我识别。
6. 如果材料不适合教学，说明原因，并提出一个更合适的学习切入点。

现在请只输出：学习主题、选择理由和第一个问题。`,
        isFavorite: false,
        targetModels: ["all"]
    },
    {
        id: 4,
        title: "双层解释：通俗与专业",
        content: `请识别材料中最需要解释的核心概念、机制或争议，并分别面向初学者和专业读者进行解释。两种版本必须讲同一件事，只是深度和语言不同。

输出格式：
## 核心概念
用一句话给出准确、无循环定义的解释。

## 通俗版
- 假设读者没有相关背景，从“它解决什么问题”开始。
- 使用一个贴切的生活类比，并明确类比在哪些地方会失效。
- 避免术语堆砌，但不能为了简单而牺牲准确性。

## 专业版
- 给出标准概念、关键组成、运行机制和必要前提。
- 必要时说明公式、理论背景、行业语境或主要争议。
- 区分共识、推断和仍有争议的部分。

## 两层对应关系
用简短表格说明通俗类比中的元素分别对应哪些专业概念。

## 常见误解与边界
指出 2-4 个容易产生的误解，以及该解释不适用的情况。

只依据材料能够支持的内容作答；需要外部知识时明确标注。`,
        isFavorite: false,
        targetModels: ["all"]
    },
    {
        id: 5,
        title: "结构化阅读笔记",
        content: `请把材料整理成一份高密度、可复习、可追溯的 Markdown 阅读笔记。目标是保留关键论证和证据，而不是把原文机械缩短。

输出格式：
## 一句话结论
用一句完整的话概括材料最重要的结论。

## 核心问题与观点
- 材料试图回答什么问题？
- 列出 3-7 条核心观点，每条都能独立理解，并标明它是事实、作者观点还是推断。

## 关键事实与证据
用表格列出：事实或数据｜它支持的观点｜材料中的依据｜可信度或待核查点。

## 论证结构
用“前提 → 推理 → 中间结论 → 最终结论”还原主要论证链；存在多条路线时分别列出。

## 重要人物、术语与时间线
只保留理解材料所必需的信息；没有相关内容则省略该部分。

## 局限与疑点
指出证据不足、概念混用、遗漏变量、逻辑跳跃和可能过期的信息。

## 可继续追问
给出 3-5 个能显著加深理解的问题，避免泛泛而问。

不得补写材料中没有的事实；不确定内容统一标注“待核实”。`,
        isFavorite: false,
        targetModels: ["all"]
    },
    {
        id: 6,
        title: "第一性原理分析",
        content: `请用第一性原理分析材料中的核心问题：暂时放下惯例、类比和作者结论，从可确认的事实、目标与约束重新推导。

输出格式：
## 问题定义
说明真正需要解决的问题、决策主体和期望结果；如果原问题定义含糊，先重写问题。

## 事实、假设与价值取向
用表格区分：内容｜类型（事实/假设/价值取向）｜证据状态｜对结论的重要性。

## 不可绕过的约束
列出资源、时间、技术、制度、人性或物理约束，并区分硬约束与可改变约束。

## 从基本事实重新推导
逐步写出“因为 A，所以 B”的推导链。每一步说明依赖的前提，避免从口号直接跳到结论。

## 与原文结论对照
指出重新推导后哪些结论仍成立、哪些需要收窄、哪些缺乏支持。

## 可行方案与权衡
给出 2-3 个方案，比较收益、成本、风险、可逆性和适用条件，不假装存在无代价的最优解。

## 最敏感的不确定因素
指出哪几个假设一旦改变，会最显著地改变结论，以及应如何验证。

材料不足以完成推导时，明确列出缺口，不用常识猜测填满。`,
        isFavorite: false,
        targetModels: ["all"]
    },
    {
        id: 7,
        title: "批判性分析与钢人化",
        content: `请对材料进行批判性分析。先用最强、最公平的方式还原作者观点，再检查其证据和推理；不要为了“批判”而挑刺，也不要只复述原文。

输出格式：
## 核心主张
提炼 1-3 个真正决定全文立场的结论，并区分描述性判断、因果判断和价值判断。

## 最强版本的论证
说明在什么前提下、凭什么证据，作者的观点最有可能成立。

## 证据审计
用表格列出：关键论据｜支持的主张｜证据强度｜缺失信息或替代解释。

## 推理问题
检查概念偷换、循环论证、因果倒置、样本偏差、幸存者偏差、遗漏变量、错误类比和过度外推。只指出确实存在或高度可疑的问题。

## 被忽略的视角
给出最有力的反方解释、利益相关方视角或材料未考虑的变量。

## 更稳妥的结论
说明哪些部分可以接受、哪些只能暂时保留、哪些不成立，并给出结论适用的范围和置信度。

## 如何进一步验证
列出最能支持或推翻核心结论的 3-5 项证据。

引用材料时优先简短转述；不要虚构作者没有表达的主张。`,
        isFavorite: false,
        targetModels: ["all"]
    },
    {
        id: 8,
        title: "自然中文重写式翻译",
        content: `这不是逐句直译，也不是摘要。先完整理解原文要表达的事实、观点、逻辑和语气，再按照中文读者的阅读习惯重新组织语言。最终成文应像中国作者直接用中文写成，而不是一篇翻译稿。

## 要求
1. **准确优先**
   数据、事实、专有名词、因果关系、限定条件和作者立场不得改变。不要增加原文没有的信息，也不要把推测写成事实。
2. **摆脱英文结构**
   不照搬英文语序、句法和段落结构。可以拆句、并句、调整语序和段落，使逻辑更符合中文表达习惯。
3. **消除翻译腔**
   避免生硬的被动句、名词化表达、主语重复、长句套长句，以及滥用“进行”“实现”“对于”“关于”“基于”等词。
4. **中文自然有节奏**
   语言清楚、流畅、克制。可以自然使用口语、四字表达、成语或有画面感的说法，但不要堆砌辞藻、强行煽情或制造金句。
5. **保持原文文体**
   原文是新闻、科普、评论、叙事、学术或访谈，就采用相应的中文风格。专业术语使用规范译名，首次出现时可写为“中文名称（英文缩写）”，例如“大语言模型（LLM）”。
6. **保持信息完整**
   除非另有要求，不要压缩、扩写或总结，篇幅和信息密度与原文大体相当。

## 输出

只输出重写后的中文正文，不解释过程，不逐句对照，不添加原文没有的标题或评价。

输出前自行检查：是否准确、完整、自然，是否还残留明显英文语序。`,
        isFavorite: true,
        targetModels: ["all"]
    },
    {
        id: 9,
        title: "代码审查与优化",
        content: `你是一名资深软件工程师。请结合材料中能够确定的语言、运行环境和目标，对代码进行审查。优先发现会导致错误、安全问题或维护成本的问题，不为追求“高级写法”进行无意义重构。

输出格式：
## 功能与执行流程
简要说明代码解决什么问题、主要输入输出和关键流程。

## 问题清单
按严重程度排序，用表格列出：级别｜位置或代码片段｜问题｜触发条件｜影响｜修复建议。
重点检查正确性、边界条件、异步与并发、资源释放、安全、兼容性、性能和可测试性。

## 关键假设
列出因上下文缺失而无法确认的运行环境、数据结构、依赖版本或业务规则；不要把假设写成事实。

## 改进方案
说明建议保留什么、修改什么，以及这样做的收益和代价。区分必须修复与可选优化。

## 可替换代码
仅在能够可靠改进时给出完整或最小可替换代码。保持原有接口和行为，除非明确说明为何必须改变；不要省略关键错误处理。

## 验证建议
给出覆盖主要风险的测试用例和验证步骤。

如果材料只有代码片段，明确指出无法从片段确认的问题，不虚构项目上下文。`,
        isFavorite: false,
        targetModels: ["all"]
    },
    {
        id: 10,
        title: "自然中译英",
        content: `你是一名专业英文译者。请将中文材料翻译成自然、准确、符合英语母语者表达习惯的英文。

翻译原则：
1. 根据原文场景自动选择日常、商务、技术、学术或正式语体，并保持全文一致。
2. 忠实保留事实、立场、语气强度和不确定程度，不擅自润色成更夸张、更客气或更确定的表达。
3. 先理解句意再重组英文，避免中文语序、冗余主语、直译成语和中式英语。
4. 人名、机构、产品、数字、日期、单位、术语和格式必须准确；已有通行英文名称时优先使用。
5. 原文有歧义时采用最符合上下文的译法；无法可靠判断时，在译文后附一条简短 Translator’s note，不自行补充事实。

输出要求：
- 只输出完整英文译文。
- 除非歧义会实质影响理解，否则不要附解释、备选版本或翻译过程。`,
        isFavorite: false,
        targetModels: ["all"]
    },
    {
        id: 11,
        title: "得体回复助手",
        content: `请根据材料起草一份可以直接发送的回复。先判断沟通目标、双方关系、必要信息和语气，再组织内容；不要替我承诺材料中没有确认的时间、责任、价格或行动。

处理原则：
1. 明确回应对方最关心的问题，不回避核心诉求。
2. 立场清楚、不卑不亢；可以友善，但避免过度道歉、讨好、情绪化或操控性表达。
3. 拒绝、催促、纠错或谈判时，说明边界和下一步，尽量减少不必要的对立。
4. 保留必要的人名、日期、金额、附件和行动项；缺失信息使用方括号占位，不要编造。
5. 删除空泛寒暄和重复表态，使回复简洁自然。

输出格式：
## 推荐版本
给出最适合当前场景、可直接发送的完整回复。

## 简短版本
给出更精简的版本；如果推荐版本已经很短，可省略。

## 发送前确认
只列出必须由我确认或补充的信息；没有则写“无”。`,
        isFavorite: false,
        targetModels: ["all"]
    },
    {
        id: 12,
        title: "待办、日程与决策提取",
        content: `请从材料中提取能够执行或需要跟进的信息，并严格区分已确认事项、暂定事项和推测。不要补写材料中没有的负责人、时间或结论。

输出格式：
## 日程与会议
用表格列出：日期与时间｜时区｜事项｜参与人｜地点或链接｜状态｜依据。

## 待办事项
用表格列出：任务｜负责人｜截止时间｜优先级｜依赖项｜状态｜上下文。

## 已确定的决策
列出明确达成的决定、适用范围和相关负责人。

## 待确认事项
列出缺失或冲突的信息，例如负责人不明、相对日期无基准、时间及时区不清、方案尚未拍板。

处理规则：
1. “明天、下周、月底”等相对时间只有在材料提供基准日期时才换算，并保留原始表述。
2. 没有说明的字段填“未说明”，不要猜测。
3. 同一事项在多处出现时合并，并保留最新、最明确的信息；存在冲突时并列标注。
4. 不把建议、愿望或讨论中的方案写成已确定任务。
5. 如果没有某类信息，写“无”，不要生成空表。`,
        isFavorite: false,
        targetModels: ["all"]
    },
    {
        id: 13,
        title: "高密度信息提取",
        content: `请将材料压缩成高密度、忠实、可快速阅读的信息摘要。删除闲聊、重复、修辞和无效铺垫，但保留理解结论所需的证据、限定条件和不确定性。

输出格式：
## 核心摘要
用 3-7 条要点覆盖材料最重要的信息，每条都写清“谁、做了什么、为什么重要”。

## 关键事实与数据
用表格列出：信息｜相关主体｜时间｜数字或单位｜材料中的作用｜是否待核实。

## 事件或论证脉络
材料以事件为主时给出时间线；以观点为主时给出“前提 → 论据 → 结论”。二者都不适用时省略。

## 立场与证据边界
区分材料明确陈述的事实、引用他人的说法、作者观点和推测；说明主要倾向及可能偏差。

## 仍需关注
列出会显著影响理解、但材料没有交代或需要实时核查的信息。

要求：
- 保留人名、机构、地点、型号、价格、比例、日期和关键术语。
- 不增加材料外的背景知识，不把推测改写成事实，不为了简短删除关键限定词。`,
        isFavorite: true,
        targetModels: ["all"]
    },
    {
        id: 14,
        title: "高质量追问清单",
        content: `请根据材料生成一组能够减少不确定性、检验结论或推动决策的高质量追问。不要提出材料已经回答的问题，也不要用“还有什么”“如何看待”之类的泛泛问题凑数。

生成规则：
1. 先识别材料的核心结论、关键假设和最大信息缺口。
2. 每个问题只追问一个核心点，确保可以通过事实、证据、解释或行动来回答。
3. 问题按价值排序，优先提出答案最可能改变判断或行动的问题。
4. 根据材料实际内容选择类别；不适用的类别可以省略。

输出格式：
## 最优先的 3 个问题
对每个问题说明：为什么重要｜什么样的答案会改变当前判断。

## 事实与证据
核对数字、时间、来源、样本、口径和可验证主张。

## 机制与逻辑
追问因果关系、隐藏前提、替代解释和边界条件。

## 反方与风险
从最强反方视角追问失败情形、利益冲突和被忽略的变量。

## 决策与执行
追问目标、约束、成本、负责人、时间表、成功标准和退出条件。

总问题数控制在 8-15 个；材料很短时宁可更少，不重复换词。`,
        isFavorite: false,
        targetModels: ["all"]
    },
    {
        id: 15,
        title: "智能表格整理",
        content: `请将材料整理成便于比较、查找和继续处理的表格。先根据内容确定最合适的行粒度和字段，不要机械套用固定模板。

处理规则：
1. 一行只表示一个可独立比较的对象、事件、观点或任务；不要把多个事项塞进同一单元格。
2. 保留关键名称、日期、数字、单位、状态和限定条件；统一格式，但不要擅自换算口径。
3. 合并明确重复的信息；内容冲突时保留各版本并标注来源位置或“存在冲突”。
4. 缺失信息填“未说明”，不确定内容标注“待核实”，不要猜测。
5. 内容类型差异很大时拆成多个表格，不强行放进一张宽表。

输出格式：
## 表格
先用一句话说明选择这些字段的原因，然后给出 Markdown 表格。

## 关键发现
列出不超过 3 条由表格直接支持的结论。

## 数据质量问题
指出缺失、冲突、口径不一致或无法比较的字段；没有则写“无”。

不得添加材料以外的事实，也不要把表格中的空缺自行补齐。`,
        isFavorite: false,
        targetModels: ["all"]
    },
    {
        id: 16,
        title: "标题、导语与金句",
        content: `请根据材料生成准确、有吸引力但不过度承诺的标题、导语和金句。传播效果必须建立在忠实原意之上，不制造材料没有的冲突、数字、因果或确定性。

输出格式：
## 标题
给出 10 个不重复的标题：
- 克制信息型 4 个：准确说明主题和价值。
- 观点型 3 个：突出材料中真实存在的核心判断。
- 悬念型 3 个：保留信息缺口，但不能隐瞒关键前提或故意误导。

## 导语
给出 3 个 80 字以内的版本，分别采用：直接切题、问题切入、场景切入。每个版本都应交代读者为什么值得继续读。

## 金句
提取或改写 5-8 条可独立传播的句子，并标注“原文提取”或“基于原意改写”。不得把改写内容伪装成作者原话。

## 风险表达
列出材料中不宜用于标题或传播的说法，并说明风险属于夸张、证据不足、断章取义、过度归因还是可能侵权。

要求：
- 避免“震惊、真相、彻底、必然、所有人都”等标题党词汇，除非材料有充分依据。
- 不虚构引语，不改变数字口径，不把相关性写成因果。
- 各标题应体现不同角度，而不是只替换同义词。`,
        isFavorite: false,
        targetModels: ["all"]
    },
    {
        id: 17,
        title: "文章结构分析教练",
        content: `你是一名文章分析教练。你的任务不是复述或简单摘要，而是示范如何从文章中识别变量、机制、因果链和适用边界，帮助我训练结构化分析能力。

分析原则：
1. 先顺着文章内部逻辑理解作者，再进行校正；不要上来否定，也不要盲目认同。
2. 严格区分文章明确提供的信息、作者的个人体验和作者据此作出的推断。
3. “文章声称的事实”不等于“已经证实的事实”。无法外部核实时标注“待核实”，不要自行补充来源或细节。
4. 分析模型要少而精，只选择真正有解释力的 2-4 个；候选模型包括但不限于因果变量、激励结构、系统动力学、博弈、叙事和概率决策。
5. 结论必须能回到文章中的具体信息。优先简短转述依据，不要堆砌术语。

输出格式：
## 主旨与核心问题
- 用 2-3 句话概括文章主旨。
- 用一个问题说明文章真正试图解释或说服读者的是什么。

## 最适合的分析模型
用表格列出：分析模型｜为什么适用｜能解释什么｜解释不了什么。

## 关键变量与结构
用表格列出：人物或群体｜利益与目标｜资源｜约束｜关键选择｜代价｜结果。
如果涉及多方互动，说明各方策略如何相互影响。

## 机制与因果链
- 用“触发因素 → 行动或机制 → 中间结果 → 最终结果”还原核心解释链。
- 区分相关关系、因果主张和文章没有证明的跳跃。
- 指出可能被忽略的变量、替代解释或反馈回路。

## 证据分层
分别列出：
1. 可核查事实：能够被外部来源验证的陈述，以及材料当前提供的支持。
2. 个人体验：作者亲历、观察或个案感受。
3. 解释与判断：作者的归因、推测、价值判断和可能受情绪或叙事放大的部分。

## 值得学习的结构性规律
提炼 3-5 条规律。每条说明：规律｜文章依据｜成立条件｜反例或失效边界。

## 逻辑漏洞与核查清单
检查样本偏差、幸存者偏差、过度归因、因果倒置、概念混用、遗漏变量和事实疑点。
涉及财经、行业、政策、医学或其他时效性信息时，用表格列出：待核查主张｜核查原因｜优先来源类型。

## 整体判断
- 文章对理解现实最有价值的地方是什么？
- 哪些结论不能被过度相信？
- 要形成更可靠的判断，还缺少哪些信息或对照案例？

语言清楚、直接、有分析深度。材料不足时明确指出，不要为了完成结构而编造内容。`,
        isFavorite: false,
        targetModels: ["all"]
    }
];

const MAX_SELECTION_LENGTH = 50000;
const TASK_STORAGE_PREFIX = "pendingTask:";
const DEFAULT_ACTION_TITLE = "点击打开设置";
const claimedTaskKeys = new Set();
const feedbackTimers = new Map();
const BUILT_IN_PROMPT_IDS = new Set(INITIAL_PROMPTS.map(prompt => prompt.id));
let stateMutationQueue = Promise.resolve();
const FEEDBACK_BADGES = {
    no_selection: ["未选", "#757575"],
    blocked: ["受限", "#E65100"],
    not_configured: ["未配", "#E65100"],
    too_long: ["过长", "#C62828"],
    disabled: ["关闭", "#E65100"],
    opening_auto: ["发送", "#1565C0"],
    opening_fill: ["填入", "#1565C0"],
    filled: ["已填", "#2E7D32"],
    sent: ["已发", "#2E7D32"],
    editor_not_found: ["失败", "#C62828"],
    fill_failed: ["失败", "#C62828"],
    send_not_found: ["未发", "#E65100"],
    error: ["错误", "#C62828"]
};

// 点击扩展图标打开设置页
chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

// 安装或更新时刷新内置提示词，同时保留收藏、目标模型和使用次数。
chrome.runtime.onInstalled.addListener(() => {
    initializeExtension().catch(error => console.error("初始化扩展失败:", error));
});

async function initializeExtension() {
    const data = await chrome.storage.local.get(["prompts", "settings"]);
    await chrome.storage.local.set({
        prompts: buildPromptList(data.prompts || []),
        settings: withSettingDefaults(data.settings)
    });
    await rebuildContextMenus();
}

function withSettingDefaults(settings = {}) {
    return {
        targets: {
            ...DEFAULT_SETTINGS.targets,
            ...(settings.targets || {})
        },
        autoSend: settings.autoSend === true,
        defaultPromptId: Object.hasOwn(settings, "defaultPromptId")
            ? settings.defaultPromptId
            : DEFAULT_SETTINGS.defaultPromptId,
        shortcuts: {
            ...DEFAULT_SETTINGS.shortcuts,
            ...(settings.shortcuts || {})
        }
    };
}

function getTargetModels(prompt) {
    return prompt.targetModels.includes("all")
        ? SUPPORTED_PLATFORMS
        : prompt.targetModels;
}

function buildPromptList(existingPrompts) {
    const existingById = new Map(existingPrompts.map(p => [p.id, p]));

    const builtIns = INITIAL_PROMPTS.map(prompt => {
        const saved = existingById.get(prompt.id);
        return {
            ...prompt,
            isBuiltIn: true,
            isFavorite: saved?.isFavorite ?? prompt.isFavorite,
            useCount: saved?.useCount ?? 0,
            targetModels: saved?.targetModels ?? prompt.targetModels
        };
    });

    const customPrompts = existingPrompts
        .filter(prompt => !BUILT_IN_PROMPT_IDS.has(prompt.id));

    return [...builtIns, ...customPrompts];
}

// 重建右键菜单
async function rebuildContextMenus() {
    await chrome.contextMenus.removeAll();
    const { prompts = [] } = await chrome.storage.local.get("prompts");
    const favorites = prompts.filter(prompt => prompt.isFavorite);

    if (!favorites.length) {
        chrome.contextMenus.create({
            id: "send-default",
            title: "发送到 AI (默认)",
            contexts: ["selection"]
        });
        return;
    }

    favorites.forEach(prompt => {
        chrome.contextMenus.create({
            id: `prompt-${prompt.id}`,
            title: prompt.title,
            contexts: ["selection"]
        });
    });
}

// 处理设置页菜单更新、内容脚本领取任务及执行结果反馈。
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "UPDATE_MENU") {
        rebuildContextMenus().catch(error => console.error("更新右键菜单失败:", error));
        return;
    }

    if (msg.type === "CLAIM_PENDING_TASK") {
        claimPendingTask(msg.platform, sender)
            .then(task => sendResponse({ task }))
            .catch(error => {
                console.error("领取临时任务失败:", error);
                sendResponse({ task: null });
            });
        return true;
    }

    if (msg.type === "SAVE_OPTIONS_STATE") {
        saveOptionsState(msg.prompts, msg.settings)
            .then(prompts => sendResponse({ prompts }))
            .catch(error => {
                console.error("保存设置失败:", error);
                sendResponse({ error: error.message });
            });
        return true;
    }

    if (msg.type === "SAVE_SETTINGS") {
        enqueueStateMutation(() =>
            chrome.storage.local.set({ settings: withSettingDefaults(msg.settings) })
        )
            .then(() => sendResponse({ ok: true }))
            .catch(error => {
                console.error("保存全局设置失败:", error);
                sendResponse({ error: error.message });
            });
        return true;
    }

    if (msg.type === "CONTENT_STATUS") {
        const feedbackTabId = Number.isInteger(msg.sourceTabId) ? msg.sourceTabId : sender.tab?.id;
        showFeedback(msg.status, msg.message, feedbackTabId);
    }
});

// 右键菜单点击处理
chrome.contextMenus.onClicked.addListener((info, tab) => {
    const text = info.selectionText || "";
    if (!text.trim()) {
        showFeedback("no_selection", "没有选中文字", tab?.id);
        return;
    }

    if (info.menuItemId === "send-default") {
        sendPrompt(null, text, tab?.id)
            .catch(error => handleSendError(error, tab?.id));
    } else if (String(info.menuItemId).startsWith("prompt-")) {
        sendPrompt(Number(String(info.menuItemId).slice("prompt-".length)), text, tab?.id)
            .catch(error => handleSendError(error, tab?.id));
    }
});

// 快捷键处理
chrome.commands.onCommand.addListener(async (command) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id || /^(chrome|edge|about):\/\//.test(tab.url || "")) {
        showFeedback("blocked", "当前页面不允许扩展读取选中文字", tab?.id);
        return;
    }

    let text;
    try {
        text = await readSelection(tab.id);
    } catch (error) {
        console.error("读取选中文字失败:", error);
        showFeedback("blocked", "无法读取当前页面，请改用右键菜单", tab.id);
        return;
    }

    if (!text) {
        showFeedback("no_selection", "没有选中文字", tab.id);
        return;
    }

    if (command === "send-selection") {
        try {
            await sendPrompt(null, text, tab.id);
        } catch (error) {
            handleSendError(error, tab.id);
        }
        return;
    }

    if (command.startsWith("slot-")) {
        const { settings: savedSettings } = await chrome.storage.local.get("settings");
        const promptId = withSettingDefaults(savedSettings).shortcuts[command];
        if (promptId == null) {
            showFeedback("not_configured", "这个快捷槽位尚未绑定提示词", tab.id);
            return;
        }
        try {
            await sendPrompt(promptId, text, tab.id);
        } catch (error) {
            handleSendError(error, tab.id);
        }
    }
});

function handleSendError(error, sourceTabId) {
    console.error("发送提示词失败:", error);
    showFeedback("error", "发送提示词失败", sourceTabId);
}

async function readSelection(tabId) {
    const results = await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        world: "ISOLATED",
        func: () => {
            const activeElement = document.activeElement;
            if (activeElement instanceof HTMLTextAreaElement ||
                activeElement instanceof HTMLInputElement) {
                const { selectionStart, selectionEnd, value } = activeElement;
                if (Number.isInteger(selectionStart) &&
                    Number.isInteger(selectionEnd) &&
                    selectionEnd > selectionStart) {
                    return {
                        text: value.slice(selectionStart, selectionEnd),
                        isFormControl: true
                    };
                }
            }

            return {
                text: window.getSelection()?.toString() || "",
                isFormControl: false
            };
        }
    });

    const selections = results
        .map(({ result }) => result)
        .filter(result => result?.text?.trim());

    return selections.find(result => result.isFormControl)?.text
        || selections[0]?.text
        || "";
}

function buildFinalPrompt(promptContent, text) {
    return `${promptContent.trim()}\n\n---\n\n${MATERIAL_GUARD}\n\n<用户提供材料>\n${text}\n</用户提供材料>`;
}

// 核心发送逻辑：为每个平台创建独立、绑定标签页的会话任务。
async function sendPrompt(promptId, text, sourceTabId) {
    if (text.length > MAX_SELECTION_LENGTH) {
        showFeedback("too_long", `选中文字过长（最多 ${MAX_SELECTION_LENGTH} 字符）`, sourceTabId);
        return;
    }

    const data = await chrome.storage.local.get(["prompts", "settings"]);
    const settings = withSettingDefaults(data.settings);
    const finalId = promptId ?? settings.defaultPromptId;

    if (finalId == null) {
        showFeedback("not_configured", "尚未绑定默认提示词", sourceTabId);
        return;
    }

    const prompts = data.prompts || [];
    const prompt = prompts.find(item => item.id === finalId);
    if (!prompt) {
        showFeedback("error", "未找到要使用的提示词", sourceTabId);
        return;
    }

    const enabledTargets = getTargetModels(prompt)
        .filter(platform => settings.targets[platform]);
    if (!enabledTargets.length) {
        showFeedback("disabled", "没有可用的目标平台，请检查设置", sourceTabId);
        chrome.runtime.openOptionsPage();
        return;
    }

    const task = {
        prompt: buildFinalPrompt(prompt.content, text),
        autoSend: settings.autoSend === true,
        sourceTabId
    };
    const results = await Promise.allSettled(
        enabledTargets.map(platform => createTaskAndTab(platform, task))
    );
    const openedCount = results.filter(result => result.status === "fulfilled").length;

    if (!openedCount) {
        showFeedback("error", "无法打开 AI 页面", sourceTabId);
        return;
    }

    await incrementUseCount(finalId)
        .catch(error => console.error("更新使用次数失败:", error));
    showFeedback(
        settings.autoSend ? "opening_auto" : "opening_fill",
        settings.autoSend
            ? `已打开 ${openedCount} 个平台并尝试自动发送`
            : `已打开 ${openedCount} 个平台并填入内容`,
        sourceTabId
    );
}

async function createTaskAndTab(platform, task) {
    // 先创建空标签页取得 tabId，再写入 session，最后才导航到 AI 页面。
    // 这样内容脚本启动时，临时任务一定已经存在。
    const tab = await chrome.tabs.create({ url: "about:blank", active: false });
    const storageKey = `${TASK_STORAGE_PREFIX}${tab.id}`;

    try {
        await chrome.storage.session.set({
            [storageKey]: {
                ...task,
                platform,
                sourceTabId: Number.isInteger(task.sourceTabId) ? task.sourceTabId : null
            }
        });
        await chrome.tabs.update(tab.id, { url: PLATFORM_URLS[platform] });
    } catch (error) {
        await Promise.allSettled([
            chrome.storage.session.remove(storageKey),
            chrome.tabs.remove(tab.id)
        ]);
        throw error;
    }
}

async function incrementUseCount(promptId) {
    return enqueueStateMutation(async () => {
        const { prompts = [] } = await chrome.storage.local.get("prompts");
        const prompt = prompts.find(item => item.id === promptId);
        if (!prompt) return;

        prompt.useCount += 1;
        await chrome.storage.local.set({ prompts });
    });
}

function saveOptionsState(nextPrompts, nextSettings) {
    return enqueueStateMutation(async () => {
        const { prompts: storedPrompts = [] } = await chrome.storage.local.get("prompts");
        const counts = new Map(
            storedPrompts.map(prompt => [prompt.id, prompt.useCount])
        );
        const prompts = nextPrompts.map(prompt => ({
            ...prompt,
            useCount: counts.get(prompt.id) ?? prompt.useCount
        }));

        await chrome.storage.local.set({
            prompts,
            settings: withSettingDefaults(nextSettings)
        });
        return prompts;
    });
}

function enqueueStateMutation(mutation) {
    const result = stateMutationQueue.then(mutation);
    stateMutationQueue = result.catch(() => {});
    return result;
}

function platformFromUrl(url = "") {
    try {
        return PLATFORM_BY_HOST[new URL(url).hostname] || null;
    } catch (_) {
        return null;
    }
}

async function claimPendingTask(platform, sender) {
    if (!SUPPORTED_PLATFORMS.includes(platform) || !sender.tab?.id || platformFromUrl(sender.url) !== platform) {
        return null;
    }

    const storageKey = `${TASK_STORAGE_PREFIX}${sender.tab.id}`;
    if (claimedTaskKeys.has(storageKey)) return null;

    claimedTaskKeys.add(storageKey);
    try {
        const items = await chrome.storage.session.get(storageKey);
        const task = items[storageKey];
        if (!task || task.platform !== platform) return null;

        // 读取成功后立即删除，刷新页面无法再次消费同一份用户文字。
        await chrome.storage.session.remove(storageKey);
        return {
            prompt: task.prompt,
            autoSend: task.autoSend === true,
            sourceTabId: task.sourceTabId
        };
    } finally {
        claimedTaskKeys.delete(storageKey);
    }
}

// 页面未完成领取就被关闭时，删除与该标签页绑定的临时内容。
chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.storage.session.remove(`${TASK_STORAGE_PREFIX}${tabId}`);
});

function showFeedback(status, message, tabId) {
    const [text, color] = FEEDBACK_BADGES[status] || ["提示", "#455A64"];
    const target = Number.isInteger(tabId) ? { tabId } : {};
    chrome.action.setBadgeBackgroundColor({ color, ...target });
    chrome.action.setBadgeText({ text, ...target });
    chrome.action.setTitle({ title: message || DEFAULT_ACTION_TITLE, ...target });

    const scope = target.tabId ?? "global";
    if (feedbackTimers.has(scope)) clearTimeout(feedbackTimers.get(scope));
    feedbackTimers.set(scope, setTimeout(() => {
        feedbackTimers.delete(scope);
        clearFeedback(scope);
    }, 6000));
}

function clearFeedback(scope) {
    const tabId = scope === "global" ? undefined : Number(scope);
    const target = Number.isInteger(tabId) ? { tabId } : {};
    chrome.action.setBadgeText({ text: "", ...target });
    chrome.action.setTitle({ title: DEFAULT_ACTION_TITLE, ...target });
}
