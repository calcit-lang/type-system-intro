# 参考资料

本教程采用教学化的小系统来建立直觉。若要确认原始定义、定理边界和 higher-rank 算法，请回到论文。下面优先列原论文、作者页面与系统综述。

## 历史、Lambda 演算与 Curry–Howard

### Philip Wadler：Propositions as Types

- [论文 PDF](https://homepages.inf.ed.ac.uk/wadler/papers/propositions-as-types/propositions-as-types.pdf)

这篇历史性综述解释命题/类型、证明/程序、证明化简/程序求值三层对应，并梳理 Curry、Howard、Church、Girard、Reynolds 等路线。适合在读完 lambda 演算章节后阅读。

### Stanford Encyclopedia of Philosophy：Church 的 lambda 演算与类型理论

- [Lambda 演算与类型理论条目](https://plato.stanford.edu/archives/sum2024/entries/church/supplementD.html)

用于核对 Church 的函数抽象、简单类型理论与历史背景。它是哲学与逻辑参考资料，不是编译器实现教程。

## 参数多态与 System F

### John C. Reynolds：Towards a Theory of Type Structure

- [论文 PDF](https://www.cs.cmu.edu/~crary/819-f09/Reynolds74.pdf)

Reynolds 1974 年关于多态类型结构与表示独立性的经典工作。System F 也由 Girard 在逻辑方向独立发展，因此常称 Girard–Reynolds 多态 lambda 演算。

### Philip Wadler：Programming Language Foundations in Agda 中的 System F 讲义

- [System F 讲义 PDF](https://homepages.inf.ed.ac.uk/wadler/papers/plfa/paris.pdf)

适合在原始论文之前快速确认类型抽象、类型应用和 System F 的历史坐标。正文的 System F 章节保持 Church-style 显式核心，以免把类型检查与完整推断混为一谈。

## Hindley–Milner 与主类型

### Damas 与 Milner：Principal type-schemes for functional programs

- [论文 PDF（重排版）](https://steshaw.org/hm/milner-damas.pdf)

这是理解 HM 主类型方案、健全性和完备性结果的核心来源。论文记法与现代教程不完全相同；建议先读完本文的符号、泛化和 Algorithm W 章节，再对照原文。

### Milner：A Theory of Type Polymorphism in Programming

- [论文条目与 PDF（作者/研究资料镜像）](https://homepages.inf.ed.ac.uk/wadler/papers/papers-we-love/milner-type-polymorphism.pdf)

经典 ML 多态类型理论来源之一。阅读时注意区分语义健全性讨论、推断算法与后来的 Damas–Milner 主类型证明。

## 双向类型检查

### Dunfield 与 Krishnaswami：Complete and Easy Bidirectional Typechecking for Higher-Rank Polymorphism

- [作者项目页](https://research.cs.queensu.ca/home/jana/papers/bidir/)
- [论文 PDF](https://www.cl.cam.ac.uk/~nk480/bidir.pdf)
- [arXiv](https://arxiv.org/abs/1306.6032)

论文给出 higher-rank 多态的声明式双向系统与算法系统，并证明算法相对于声明式系统的健全性与完备性。它比本教程的基础 `synth/check` 系统多出有序算法上下文、存在变量、实例化/子类型判断等关键机制。

推荐阅读顺序：

1. 先辨认两种 typing judgment；
2. 再看 declarative subtyping/typing；
3. 单独抄下 algorithmic context 的每种条目；
4. 最后追踪 application judgment 与 existential instantiation；
5. 证明部分等算法规则已经能手工运行后再读。

### Dunfield 与 Krishnaswami：Bidirectional Typing

- [arXiv 综述](https://arxiv.org/abs/1908.05839)

系统梳理双向类型的历史、设计原则与不同类型构造。适合在掌握基础规则后建立全景图。

### Pierce 与 Turner：Local Type Inference

- [论文 PDF](https://www.cis.upenn.edu/~bcpierce/papers/lti-popl.pdf)

讨论局部类型信息传播、多态实例化与匿名函数参数推断。它与“所有信息全局推断”形成重要对照。

## GADT 与存在类型

### Peyton Jones、Vytiniotis、Weirich 与 Washburn：Simple Unification-based Type Inference for GADTs

- [论文 PDF（宾夕法尼亚大学作者页面）](https://www.seas.upenn.edu/~sweirich/papers/gadt.pdf)

论文明确讨论 GADT 与 HM 推断结合时的困难，以及怎样利用程序员标注控制推断。正文只提炼“构造器结果索引、模式分支等式、刚性变量与标注边界”，没有复刻论文的 wobbly types 算法。

## 精化类型

### Rondon、Kawaguchi 与 Jhala：Liquid Types

- [UC eScholarship 论文页与 PDF](https://escholarship.org/uc/item/0vx7j8zc)

Liquid Types 将 ML 类型推断与谓词抽象结合，在受限 qualifiers 中自动推断精化，并借助逻辑求解验证数组越界、除零等性质。正文把 refinement checking、受限 inference 与一般定理证明明确分开。

## 依赖类型

### The Univalent Foundations Program：Homotopy Type Theory

- [官方网站与开放 PDF](https://homotopytypetheory.org/book/)

第一章系统介绍依赖函数、依赖 pair、类型族、等式类型与 universe。正文只使用其中最基础的依赖类型地基，不要求读者掌握同伦论或 univalence。

## 辅助阅读

### TypeScript 与 Rust 官方资料

- [TypeScript：结构类型与兼容性](https://www.typescriptlang.org/docs/handbook/type-compatibility)
- [Rust Book：泛型、Trait 与生命周期](https://doc.rust-lang.org/book/ch10-00-generics.html)

正文使用两门语言建立直觉，但会明确标注：TypeScript 的实用结构兼容、Rust trait/所有权与教学演算之间并非一一对应。

### Siek 与 Taha：Gradual Typing for Functional Languages

- [论文 PDF](https://web.stanford.edu/class/cs242/materials/old/siek06__gradual.pdf)

如果想理解 TypeScript 式“动态世界逐步增加类型”的理论亲属，这篇工作给出了渐进类型的经典形式化起点。注意 TypeScript 整体设计并不等同于论文中的小演算。

## 线性、仿射类型与 Rust 所有权

### Philip Wadler：Linear Types Can Change the World!

- [作者论文索引与摘要](https://homepages.inf.ed.ac.uk/wadler/topics/linear-logic.html)

经典工作从 Girard 线性逻辑出发，强调线性值不能被复制或丢弃，并讨论安全原地更新。正文进一步区分线性“恰好一次”、仿射“至多一次”与 Rust 的工程化所有权/析构组合。

### Rust 官方资料：引用与借用

- [Rust Book：References and Borrowing](https://doc.rust-lang.org/stable/book/ch04-02-references-and-borrowing.html)
- [Rust Reference：Borrow operators](https://doc.rust-lang.org/reference/expressions/operator-expr.html#borrow-operators)

用于核对 `&T`、`&mut T` 与生命周期的实际语言语义。正文把它们作为资源类型的工程桥梁，而不是把 borrow checker 简化成一个线性 lambda 演算。

## 效果系统与 Algebraic Effects

### Lucassen 与 Gifford：Polymorphic Effect Systems

- [论文 PDF](https://cs.ioc.ee/ewscs/2010/mycroft/lucassen-popl88.pdf)

论文将 type、effect 与 region 作为不同静态描述，讨论效果/区域多态和效果健全性。正文采用简化的 $A\;!\;\varepsilon$ 判断解释效果组合。

### Plotkin 与 Pretnar：Handlers of Algebraic Effects

- [爱丁堡大学论文 PDF](https://www.pure.ed.ac.uk/ws/portalfiles/portal/17909848/Plotkin_Pretnar_2009_Handlers_of_Algebraic_Effects.pdf)

这项工作把异常处理器推广到可由代数理论描述的效果。正文只介绍 operation、continuation 与 handler 的程序员直觉，并明确区分 effect system、monad 和 algebraic effects。

### Types and Programming Languages

Benjamin C. Pierce 著。适合系统补充 lambda calculus、小步语义、进展/保持、子类型与更多类型构造。它不是 HM 或现代双向 higher-rank 算法的唯一来源，但能补足大量论文默认背景。

### Practical Foundations for Programming Languages

Robert Harper 著。以判断式和推导规则为中心组织编程语言基础，适合训练“把规则当定义来读”的习惯。

## 阅读论文时怎样使用本教程

遇到陌生规则时：

1. 在[术语与符号速查](glossary.md)确认符号类别；
2. 用[先学会读公式](notation.md)的清单标出输入、输出、绑定和附加条件；
3. 判断规则是声明式还是算法式；
4. 用一个最小代码例子手工应用规则；
5. 对比[实现指南](implementation-guide.md)，写出它需要的数据结构；
6. 若规则涉及 $\forall$，明确变量是刚性还是可求解；
7. 若判断带输入/输出上下文，逐项记录上下文如何变化。

## 关于正文中的简化

- HM 章节使用现代教学版 `generalize/instantiate` 表述，没有复刻每篇原论文的全部关系与证明记法；
- 基础双向章节先展示简单类型 lambda calculus，再解释 higher-rank 所需的额外变量与上下文；
- 子类型只用于说明方向切换，没有定义一套完整的子类型语言；
- 一般递归、多态递归与完整 region calculus 仍只标出边界；
- GADT、精化类型和依赖类型章节给出教学化核心规则，但没有覆盖某一门真实语言的全部 elaboration、求解器或终止检查。

这些简化是为了分层教学，不应被引用为某篇论文算法的逐字复现。
