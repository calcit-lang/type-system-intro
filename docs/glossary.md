# 术语与符号速查

## 符号

| 符号 | 含义 | 典型读法 |
| --- | --- | --- |
| $e$ | 表达式元变量 | expression e |
| $x$ | 程序变量 | variable x |
| $\tau,A,B$ | 类型元变量 | type tau / A / B |
| $\alpha,\beta$ | 类型变量 | alpha / beta |
| $\hat\alpha$ | 常用来表示可求解存在变量 | existential alpha |
| $\sigma$ | 类型方案 | type scheme sigma |
| $\Gamma$ | 类型上下文/环境 | Gamma |
| $S$ | 类型替换 | substitution S |
| $C$ | 约束集合 | constraints C |
| $\vdash$ | 在假设下可推出 | turnstile |
| $e:A$ | 表达式 `e` 具有类型 `A` | e has type A |
| $A\to B$ | 从 `A` 到 `B` 的函数类型 | A to B |
| $\forall\alpha.A$ | 对任意类型 alpha，A 成立 | forall alpha, A |
| $\exists\alpha.A$ | 存在某类型 alpha，使 A 成立 | exists alpha, A |
| $\Lambda\alpha.e$ | 抽象一个类型参数 | type abstraction |
| $e[A]$ | 把类型 A 传给多态项 e | type application |
| $A\sim B$ | 当前作用域中的类型等式 | type equality |
| $\{\nu:B\mid p\}$ | 满足谓词 p 的 B 值 | refinement type |
| $\Pi(x:A).B(x)$ | 返回类型依赖 x 的函数 | dependent function |
| $\Sigma(x:A).B(x)$ | 第二部分类型依赖 x 的 pair | dependent pair |
| $? $ / $\mathrm{Dyn}$ | 缺少静态精度的动态类型 | dynamic type |
| $A\sim B$ | 两个渐进类型一致、不冲突 | consistency |
| $A\sqsubseteq B$ | 渐进类型之间的精度关系 | precision |
| $e\langle A\Rightarrow B\rangle$ | 从 A 到 B 的运行时 cast | cast |
| $A\multimap B$ | 消费一个 A 的线性函数 | linear arrow |
| $!A$ | 可受控复制/丢弃的线性逻辑模态 | exponential |
| $\Gamma;\Delta\vdash e:A$ | 非线性与线性上下文下的判断 | resource judgment |
| $\Gamma\vdash e:A\;!\;\varepsilon$ | e 返回 A 并产生效果 ε | type-and-effect |
| $A\xrightarrow{\varepsilon}B$ | 调用时产生 ε 的函数 | effectful arrow |
| $\Gamma\vdash e\Rightarrow A$ | `e` 综合出 `A` | synthesize |
| $\Gamma\vdash e\Leftarrow A$ | 按 `A` 检查 `e` | check |
| $A<:B$ | `A` 是 `B` 的子类型 | A subtype B |
| $\lbrack B/\alpha\rbrack A$ | 在 `A` 中用 `B` 替换自由的 alpha | substitution |
| $\operatorname{ftv}(A)$ | `A` 的自由类型变量集合 | free type variables |
| $S_2\circ S_1$ | 先做 `S1` 再做 `S2` | composition |
| $\varnothing$ | 空集合或空环境，依上下文而定 | empty set |
| $\in$ / $\notin$ | 属于 / 不属于 | member / not member |
| $\cup$ / $\setminus$ | 集合并 / 集合差 | union / difference |
| $\preceq$ | 常用于实例关系，方向以论文定义为准 | instance relation |

## 术语

### alpha-equivalence（alpha 等价）

只改变绑定变量名字而结构相同。例如 $\forall\alpha.\alpha\to\alpha$ 与 $\forall\beta.\beta\to\beta$ 等价。

### annotation（类型标注）

程序员写下的类型信息。双向系统中常用于从检查模式切换到综合模式，或在 higher-rank 边界明确意图。

### bidirectional typing（双向类型检查）

把类型判断拆成“综合类型”与“按期望类型检查”两个相互调用的方向。

### bound variable（绑定变量）

处在 lambda、forall 等绑定结构作用域内的变量。绑定身份由作用域决定，不由打印名字决定。

### constraint（约束）

类型推断中必须满足的关系，例如 $\alpha=\texttt{Int}$ 或 $A<:B$。

### declarative system（声明式系统）

描述什么程序合法的规则系统，重点是规格与推理，不一定直接给出执行顺序。

### eigenvariable / skolem variable（特征变量 / Skolem 变量）

检查全称命题时引入的任意但固定的刚性变量。它不能像合一变量一样随意求解。

### free variable（自由变量）

没有被当前结构绑定的变量。泛化要比较类型与环境中的自由类型变量。

### generalization（泛化）

把不依赖环境的自由类型变量用 $\forall$ 量化，形成类型方案。

### higher-rank polymorphism（高阶秩多态）

允许全称量词出现在函数参数等嵌套位置，而不只在最外层。通常需要标注与更精细的检查算法。

### consistency（类型一致性）

渐进类型中描述精确类型与动态未知是否冲突的关系，常写作 $A\sim B$。它通常不传递，不能当成相等。

### cast / blame

Cast 是静态区与动态区交界的运行时检查；blame 在高阶边界失败时记录哪一侧违反了契约。

### gradual guarantee（渐进保证）

约束增加或删除类型精度时，静态接受关系与动态行为应该怎样保持关联。它不是“标注变化绝不影响任何行为”。

### weakening / contraction

Weakening 允许不用某个假设，对应丢弃；contraction 允许重复使用同一假设，对应复制。线性系统会限制这两条结构规则。

### linear / affine（线性 / 仿射）

线性资源要求恰好使用一次，仿射资源允许不用但不能重复使用。Rust 所有权是相关工程系统，不是最小线性演算的直接实现。

### borrow（借用）

暂时取得访问权限而不转移所有权。Rust 还会追踪共享/独占、生命周期和引用指向关系。

### latent effect（潜在效果）

创建函数时不发生、调用函数主体时才可能发生的效果，常标在效果箭头上。

### effect polymorphism（效果多态）

对效果变量量化，使 `map` 一类高阶函数精确保留回调的效果，而不是统一标成最大效果。

### effect row（效果行）

由效果标签与开放尾变量组成的描述，能表示“至少有这些效果，还可能有其他效果”。

### algebraic effect / handler

Algebraic effect 把效果表示为操作；handler 截获操作，并通过 continuation 决定是否及怎样继续剩余计算。

### subeffecting（子效果）

允许效果更少的计算用于允许更多效果的位置。它类似子类型提升，但比较的是行为摘要。

### region（区域）

静态标识一组存储位置或效果作用范围，用于追踪别名、状态访问与生命周期。

### GADT（广义代数数据类型）

允许构造器返回类型族的特定索引。模式匹配某个构造器时，分支上下文可获得对应的局部类型等式。

### existential type（存在类型）

形如 $\exists\alpha.A$。生产者选择并隐藏具体类型，消费者只能依赖公开结构，不能让隐藏类型逃逸。

### refinement type（精化类型）

形如 $\{\nu:B\mid p\}$，用逻辑谓词 $p$ 筛选基础类型 $B$ 的值。子类型检查常转成逻辑蕴含。

### SMT solver

在布尔逻辑和指定背景理论下检查公式可满足性。精化类型检查器常用它证明验证条件，但必须正确处理 sat、unsat 与 unknown。

### Pi type（Π 类型）

依赖函数类型 $\Pi(x:A).B(x)$；实参为 $a$ 时，结果类型是 $B(a)$。

### Sigma type（Σ 类型）

依赖 pair 类型 $\Sigma(x:A).B(x)$；第二部分的类型随第一部分的值变化。

### definitional equality（定义相等）

两个类型经系统内建归约后相同，不需要用户提供证明项。它不同于作为普通类型和数据出现的命题相等。

### universe（类型宇宙）

容纳类型的分层类型，例如 $\mathrm{Type}_0:\mathrm{Type}_1$。层级用于组织“类型的类型”并避免强系统中的悖论。

### Hindley–Milner / HM

具有 let 多态、主类型和完整类型推断性质的一类经典系统。经典核心限制在 rank-1 多态。

### instantiation（实例化）

把类型方案的量化变量替换成新鲜变量，得到一次独立使用的单型或更具体类型。

### judgment（判断式）

规则系统要证明的命题形式，例如 $\Gamma\vdash e:A$。规则的前提和结论都是判断。

### kind（种类）

“类型的类型”。例如普通值类型常具有 kind `Type`，列表构造器可能是 `Type -> Type`。本文第一阶段没有展开 kind checking。

### let polymorphism（let 多态）

在 `let` 绑定处泛化，并在每次变量使用时独立实例化。lambda 参数在经典 HM 中仍为单态。

### monotype（单型）

不带外层全称量化的类型，例如 $\alpha\to\alpha$。其中仍可以包含待求解变量。

### most general unifier / MGU（最一般合一子）

使两个类型相等的最一般替换；其他合一解可由它继续实例化得到。

### occurs check（出现检查）

绑定 $\alpha:=A$ 前检查 $\alpha$ 是否自由出现在 $A$ 中，用于拒绝 $\alpha=\alpha\to\beta$ 这类无限类型。

### principal type（主类型）

某表达式的最一般类型，其他合法类型都能通过实例化得到。

### rank-1 polymorphism

全称量词只在类型方案最外层出现的多态层次，是经典 HM 自动推断的核心范围。

### scheme（类型方案）

形如 $\forall\bar\alpha.\tau$ 的多态类型描述，环境里的 let 绑定通常保存方案。

### soundness（健全性）

算法接受的结果确实被声明式规格允许；也常指类型系统保证的运行时安全性质，具体要看论文命题。

### completeness（完备性）

声明式规格允许的程序或推导不会被算法无故错过。正式定理通常还说明输出之间的对应关系。

### substitution（替换）

从类型变量到类型的映射，以及把该映射递归作用到类型、方案和环境的操作。

### subsumption（包摄/子类型提升）

如果表达式有类型 $A$ 且 $A<:B$，则也可以按 $B$ 使用。双向系统常把它放在从综合到检查的切换点。

### synthesis（综合）

从表达式和环境计算出类型，写作 $\Gamma\vdash e\Rightarrow A$。

### checking（检查）

给定表达式与期望类型，验证表达式是否符合，写作 $\Gamma\vdash e\Leftarrow A$。

### type safety（类型安全）

良类型程序不会进入系统定义的某类错误状态。小步语义里常由 progress 与 preservation 表达。

### unification（合一）

寻找替换使两个含变量的类型相等。HM 的类型等式约束求解以一阶合一为核心。

### value restriction（值限制）

带可变状态或效果的 ML 系语言对 let 泛化施加的限制，防止不安全的多态引用。具体条件依语言而异。
