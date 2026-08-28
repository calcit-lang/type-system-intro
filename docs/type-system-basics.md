# 类型系统的基本任务

类型检查器表面上是在回答“这段程序类型对不对”，背后其实有几个不同层次的问题。先把它们分开，后面才不会把规则、证明和实现混成一团。

## 1. 类型系统在给程序分类

可以把类型看作一组值的静态描述：

- `Int` 描述整数值；
- `Bool` 描述布尔值；
- `Int -> Bool` 描述接收整数并产生布尔值的函数；
- `List<Int>` 描述元素为整数的列表。

“类型系统”则是一组规则，它规定哪些表达式能被赋予哪些类型。最核心的判断仍是：

$$
\Gamma \vdash e : \tau
$$

它是一个关系，不天然就是一个函数。同一个表达式在某些系统中可能有多个合法类型。类型推断算法会试图从这个关系中计算一个合适的类型。

## 2. 一个最小表达式语言

为了隔离核心概念，先使用以下语法：

$$
\begin{aligned}
e ::= {}& x
  \mid n
  \mid \texttt{true}
  \mid \texttt{false} \\
  &\mid \lambda x.e
  \mid e_1\;e_2
  \mid \texttt{let}\;x=e_1\;\texttt{in}\;e_2
\end{aligned}
$$

类型先只包含：

$$
\tau ::= \alpha \mid \texttt{Int} \mid \texttt{Bool} \mid \tau_1 \to \tau_2
$$

这门语言没有类、对象、隐式转换、重载和可变状态。不是因为那些机制不重要，而是它们会引入额外规则，遮住本章要观察的信息流。

## 3. 四条基础规则

### 变量

$$
\frac{x:\tau \in \Gamma}
     {\Gamma \vdash x:\tau}
\;(\mathrm{T-Var})
$$

朗读：如果上下文 $\Gamma$ 中记录了 `x : tau`，那么在该上下文下，表达式 `x` 的类型是 $\tau$。

规则上方的 $x:\tau \in \Gamma$ 是一次查表，不是递归类型检查。

### 函数抽象

$$
\frac{\Gamma,x:\tau_1 \vdash e:\tau_2}
     {\Gamma \vdash \lambda x.e : \tau_1 \to \tau_2}
\;(\mathrm{T-Abs})
$$

朗读：假设参数 `x` 的类型是 $\tau_1$，如果函数体 `e` 的类型是 $\tau_2$，那么整个函数从 $\tau_1$ 映射到 $\tau_2$。

注意：这条声明式规则没有告诉我们 $\tau_1$ 从哪里获得。它只说“如果存在合适的 $\tau_1$，这个推导成立”。算法可以要求参数标注，也可以创建未知变量再求解。

### 函数应用

$$
\frac{
  \Gamma \vdash e_1 : \tau_1 \to \tau_2
  \qquad
  \Gamma \vdash e_2 : \tau_1
}{
  \Gamma \vdash e_1\;e_2 : \tau_2
}
\;(\mathrm{T-App})
$$

这里的共享变量 $\tau_1$ 表示一条约束：函数希望接收的类型必须与实参类型一致。

### let 绑定（单态版本）

$$
\frac{
  \Gamma \vdash e_1:\tau_1
  \qquad
  \Gamma,x:\tau_1 \vdash e_2:\tau_2
}{
  \Gamma \vdash \texttt{let}\;x=e_1\;\texttt{in}\;e_2:\tau_2
}
\;(\mathrm{T-Let-Mono})
$$

先检查右侧 $e_1$，再把结果类型作为 `x` 的类型检查 $e_2$。这是单态规则；HM 会把它升级成 let 多态规则。

## 4. 声明式、约束式、算法式

同一个类型系统通常有三种展示角度。

### 声明式规则：什么算正确

声明式系统追求清晰地描述合法推导。它可能包含“选择某个类型”之类不能直接执行的步骤。

### 约束生成：把问题变成方程

检查：

```text
fn f => fn x => f(x)
```

可以先给未知部分命名：

```text
f : alpha
x : beta
f(x) : gamma
```

应用要求 `f` 是一个接收 `x` 类型并返回结果类型的函数，因此生成：

$$
\alpha = \beta \to \gamma
$$

求解后整个表达式为：

$$
(\beta \to \gamma) \to \beta \to \gamma
$$

### 算法式规则：按什么顺序计算

算法规则必须明确：

- 何时创建新变量；
- 先递归哪一边；
- 替换如何传播；
- 何时泛化；
- 失败时错误定位在哪里。

“声明式规则很短”不等于实现也只有几行。

## 5. 健全性、完备性、可判定性

论文常讨论三类性质。

### 健全性（soundness）

如果算法说程序具有类型 $\tau$，那么声明式系统也能证明它具有该类型。

直觉：算法不会批准本来不合法的程序。

$$
\text{algorithm accepts} \Longrightarrow \text{declaratively typable}
$$

### 完备性（completeness）

如果声明式系统允许某程序，算法也能找到相应结果。

直觉：算法不会因为搜索策略太弱而错过合法程序。

$$
\text{declaratively typable} \Longrightarrow \text{algorithm finds a typing}
$$

完备性通常要带“结果在替换、实例化或子类型意义下对应”等精确定义。

### 可判定性（decidability）

存在一个总会终止的算法，对任意输入给出“可类型化/不可类型化”的答案。一个声明式关系可以定义得很漂亮，却不一定有可判定的完整推断算法。

## 6. 类型保持与进展

类型安全常被概括为“well-typed programs do not go wrong”，经典拆分是：

- **进展（progress）**：闭合且良类型的表达式，要么已经是值，要么还能继续求值；
- **保持（preservation）**：如果良类型表达式走一步得到新表达式，新表达式仍有原类型。

公式化地写：

$$
\vdash e:\tau
\Longrightarrow
(e\;\text{is a value})
\lor
(\exists e'.\;e\to e')
$$

以及：

$$
\vdash e:\tau \land e\to e'
\Longrightarrow
\vdash e':\tau
$$

这里小箭头 $e\to e'$ 是求值一步，不是函数类型箭头。符号形状相同，所处语法层次不同。

## 7. 语法导向

如果每种表达式形式都能直接决定应用哪条规则，就称规则大体上是 syntax-directed（语法导向的）。例如看到函数应用就选 `T-App`。

语法导向很适合实现，但某些通用规则会破坏这一点。例如：

$$
\frac{\Gamma\vdash e:A \qquad A<:B}
     {\Gamma\vdash e:B}
\;(\mathrm{Sub})
$$

这条子类型提升规则理论上能在任何位置使用，算法必须决定何时用。双向类型系统的重要价值之一，就是把这类方向切换放到可预测的位置。

## 8. 接下来缺少的能力

上述小系统还不能解释：

```text
let id = fn x => x in
(id(1), id(true))
```

如果 `id` 在上下文里只有一个单态类型 $\alpha\to\alpha$，第一次调用会令 $\alpha=\texttt{Int}$，第二次又要求 $\alpha=\texttt{Bool}$，发生冲突。

HM 的关键改动，是让 `let` 绑定保存一个可以在每次使用时重新实例化的**类型方案**。

## 本章检查点

- 能区分声明式类型规则与可执行推断算法。
- 能用 progress/preservation 的直觉说明类型安全承诺。
- 能区分算法健全性、完备性和可判定性。
- 能解释为何同一条包摄规则会给算法带来搜索选择。
