import introduction from '../docs/introduction.md?raw';
import fromTypescriptAndRust from '../docs/from-typescript-and-rust.md?raw';
import historyRoadmap from '../docs/history-roadmap.md?raw';
import notation from '../docs/notation.md?raw';
import lambdaCalculus from '../docs/lambda-calculus.md?raw';
import basics from '../docs/type-system-basics.md?raw';
import algebraicDataTypes from '../docs/algebraic-data-types.md?raw';
import polymorphismMap from '../docs/polymorphism-map.md?raw';
import subtypingAndVariance from '../docs/subtyping-and-variance.md?raw';
import hm from '../docs/hindley-milner.md?raw';
import unification from '../docs/unification.md?raw';
import algorithmW from '../docs/algorithm-w.md?raw';
import bidirectional from '../docs/bidirectional-typing.md?raw';
import comparison from '../docs/hm-and-bidirectional.md?raw';
import systemF from '../docs/system-f.md?raw';
import gadtsAndExistentials from '../docs/gadts-and-existentials.md?raw';
import refinementTypes from '../docs/refinement-types.md?raw';
import dependentTypes from '../docs/dependent-types.md?raw';
import gradualTyping from '../docs/gradual-typing.md?raw';
import linearAndAffineTypes from '../docs/linear-and-affine-types.md?raw';
import effectSystems from '../docs/effect-systems.md?raw';
import implementation from '../docs/implementation-guide.md?raw';
import glossary from '../docs/glossary.md?raw';
import references from '../docs/references.md?raw';

export type Chapter = {
  id: string;
  number: string;
  title: string;
  eyebrow: string;
  minutes: number;
  level: '基础' | '核心' | '进阶';
  prerequisites: string[];
  goals: string[];
  content: string;
};

export type ChapterGroup = {
  label: string;
  chapters: Chapter[];
};

export const chapterGroups: ChapterGroup[] = [
  {
    label: '00 · 从工程经验出发',
    chapters: [
      { id: 'introduction', number: '0.1', title: '开始阅读', eyebrow: 'READING MAP', minutes: 8, level: '基础', prerequisites: ['会阅读简单的函数和变量声明'], goals: ['知道全文路线，以及公式、规则、算法三层的区别'], content: introduction },
      { id: 'from-typescript-and-rust', number: '0.2', title: '从 TS / Rust 出发', eyebrow: 'FAMILIAR GROUND', minutes: 24, level: '基础', prerequisites: ['见过 TypeScript 泛型或 Rust 泛型即可'], goals: ['把熟悉语法对应到类型判断、泛化、trait 与所有权等理论问题'], content: fromTypescriptAndRust },
      { id: 'history-roadmap', number: '0.3', title: '理论发展路线', eyebrow: 'HISTORICAL MAP', minutes: 32, level: '基础', prerequisites: ['知道编译器会做静态类型检查'], goals: ['能按“问题 → 理论工具”理解主要类型系统的发展动机'], content: historyRoadmap },
    ],
  },
  {
    label: '01 · 函数与规则地基',
    chapters: [
      { id: 'notation', number: '1.1', title: '先学会读公式', eyebrow: 'FORMULA GRAMMAR', minutes: 28, level: '基础', prerequisites: ['不需要数学逻辑背景'], goals: ['能逐字拆解判断式、推导规则、量词和附加条件'], content: notation },
      { id: 'lambda-calculus', number: '1.2', title: 'Lambda 与简单类型', eyebrow: 'LAMBDA / STLC', minutes: 42, level: '基础', prerequisites: ['会读函数与调用', '已读公式记号'], goals: ['理解绑定、替换、归约与简单类型 lambda 演算'], content: lambdaCalculus },
      { id: 'type-system-basics', number: '1.3', title: '类型系统的基本任务', eyebrow: 'FOUNDATIONS', minutes: 24, level: '基础', prerequisites: ['会读 Γ ⊢ e : A'], goals: ['区分类型规格、推断算法、健全性与完备性'], content: basics },
      { id: 'algebraic-data-types', number: '1.4', title: '和、积与 ADT', eyebrow: 'DATA / LOGIC', minutes: 34, level: '基础', prerequisites: ['见过 Rust enum 或 TS 判别联合'], goals: ['从构造器和模式匹配理解和类型、积类型与递归类型'], content: algebraicDataTypes },
      { id: 'polymorphism-map', number: '1.5', title: '多态地图', eyebrow: 'POLYMORPHISM', minutes: 30, level: '基础', prerequisites: ['理解函数类型与类型变量'], goals: ['区分参数多态、特设多态、子类型多态和 higher-rank'], content: polymorphismMap },
      { id: 'subtyping-and-variance', number: '1.6', title: '子类型与型变', eyebrow: 'SUBTYPING', minutes: 36, level: '核心', prerequisites: ['理解函数类型与结构类型'], goals: ['能解释函数参数逆变、返回值协变与可变容器不变'], content: subtypingAndVariance },
    ],
  },
  {
    label: '02 · Hindley–Milner',
    chapters: [
      { id: 'hindley-milner', number: '2.1', title: 'HM 类型系统', eyebrow: 'LET POLYMORPHISM', minutes: 36, level: '核心', prerequisites: ['理解类型变量、let 与函数类型'], goals: ['理解类型方案、泛化、实例化与主类型'], content: hm },
      { id: 'unification', number: '2.2', title: '替换、约束与合一', eyebrow: 'UNIFICATION', minutes: 34, level: '核心', prerequisites: ['理解 HM 中的单型与类型变量'], goals: ['能手工合一简单类型，并解释 occurs check'], content: unification },
      { id: 'algorithm-w', number: '2.3', title: 'Algorithm W', eyebrow: 'INFERENCE ALGORITHM', minutes: 38, level: '核心', prerequisites: ['理解泛化、实例化、替换与合一'], goals: ['能沿 AST 手工运行 Algorithm W 的关键分支'], content: algorithmW },
    ],
  },
  {
    label: '03 · 双向类型检查',
    chapters: [
      { id: 'bidirectional-typing', number: '3.1', title: '双向类型检查', eyebrow: 'SYNTHESIZE / CHECK', minutes: 44, level: '核心', prerequisites: ['理解判断式、函数规则与类型标注'], goals: ['能区分综合与检查，并理解信息在语法树上的流向'], content: bidirectional },
      { id: 'hm-and-bidirectional', number: '3.2', title: 'HM 与双向系统', eyebrow: 'COMPARISON', minutes: 20, level: '核心', prerequisites: ['已读 HM 与双向类型检查'], goals: ['能为语言特性选择全局合一、局部检查或两者组合'], content: comparison },
    ],
  },
  {
    label: '04 · 类型携带更多信息',
    chapters: [
      { id: 'system-f', number: '4.1', title: 'System F', eyebrow: 'EXPLICIT POLYMORPHISM', minutes: 42, level: '进阶', prerequisites: ['理解 STLC、∀ 与 HM 的 let 多态'], goals: ['能读写类型抽象/应用，并说明为何完整推断更困难'], content: systemF },
      { id: 'gadts-and-existentials', number: '4.2', title: 'GADT 与存在类型', eyebrow: 'INDEXED DATA', minutes: 46, level: '进阶', prerequisites: ['理解 ADT、模式匹配、System F 与类型等式'], goals: ['理解模式匹配如何精化类型，以及存在类型如何隐藏表示'], content: gadtsAndExistentials },
      { id: 'refinement-types', number: '4.3', title: '精化类型', eyebrow: 'TYPES + PREDICATES', minutes: 44, level: '进阶', prerequisites: ['理解子类型判断与路径条件'], goals: ['能读精化类型、生成验证条件，并理解 SMT 的职责边界'], content: refinementTypes },
      { id: 'dependent-types', number: '4.4', title: '依赖类型', eyebrow: 'TYPES DEPEND ON VALUES', minutes: 52, level: '进阶', prerequisites: ['理解函数类型、ADT、∀ 与精化类型'], goals: ['能读 Π/Σ 类型，并区分索引、证明参数与运行时数据'], content: dependentTypes },
    ],
  },
  {
    label: '05 · 动态、资源与效果',
    chapters: [
      { id: 'gradual-typing', number: '5.1', title: '渐进类型', eyebrow: 'STATIC / DYNAMIC', minutes: 46, level: '进阶', prerequisites: ['理解子类型、函数型变与双向检查'], goals: ['区分动态未知、顶类型与 any，并理解 cast、blame 和渐进保证'], content: gradualTyping },
      { id: 'linear-and-affine-types', number: '5.2', title: '线性与仿射类型', eyebrow: 'RESOURCE USAGE', minutes: 50, level: '进阶', prerequisites: ['理解上下文、函数规则与 Rust move/borrow'], goals: ['能读资源上下文规则，并区分线性、仿射、所有权与借用'], content: linearAndAffineTypes },
      { id: 'effect-systems', number: '5.3', title: '效果系统', eyebrow: 'TYPE AND EFFECT', minutes: 68, level: '进阶', prerequisites: ['理解函数类型、HM 与高阶函数'], goals: ['能读 type-and-effect judgment，并理解效果组合、多态与 handler', '能按静态摘要、monad 与 handler 三条路线定位效果研究论文'], content: effectSystems },
    ],
  },
  {
    label: '06 · 从纸面到代码',
    chapters: [
      { id: 'implementation-guide', number: '6.1', title: '实现小型检查器', eyebrow: 'IMPLEMENTATION', minutes: 42, level: '核心', prerequisites: ['理解 HM、合一与双向判断'], goals: ['把类型语法、上下文、合一和错误路径翻译成代码'], content: implementation },
      { id: 'glossary', number: '6.2', title: '术语与符号速查', eyebrow: 'GLOSSARY', minutes: 22, level: '基础', prerequisites: ['可在任意阶段查阅'], goals: ['快速定位全文常用符号和术语'], content: glossary },
      { id: 'references', number: '6.3', title: '参考资料', eyebrow: 'PRIMARY SOURCES', minutes: 16, level: '进阶', prerequisites: ['先读对应主题的教程章节'], goals: ['知道如何回到原论文核对定义与定理边界'], content: references },
    ],
  },
];

export const chapters = chapterGroups.flatMap(group => group.chapters);

export const chapterByMarkdownFile = new Map(
  chapters.map(chapter => [`${chapter.id}.md`, chapter.id]),
);
