# Hindley–Milner 类型系统

Hindley–Milner（HM）最值得程序员记住的能力是：在一个精心限制的多态系统中，编译器既能自动推断，又能给出主类型（principal type）。ML 家族以及 Haskell 的核心推断传统都受它影响。

本章先讲声明式结构。算法细节留到 [Algorithm W](algorithm-w.md)。

## 1. HM 解决的核心例子

```text
let id = fn x => x in
(id(1), id(true))
```

我们希望 `id` 的类型不是某个固定的 `Int -> Int`，而是：

$$
\forall \alpha.\;\alpha\to\alpha
$$

第一次使用 `id` 时实例化为：

$$
\texttt{Int}\to\texttt{Int}
$$

第二次使用时独立实例化为：

$$
\texttt{Bool}\to\texttt{Bool}
$$

关键是“每次使用独立”。不能把同一个可变未知量先后设成两种类型。

## 2. 单型与类型方案

HM 明确区分 monotype（单型）与 type scheme（类型方案）。

单型：

$$
\tau ::= \alpha
\mid \texttt{Int}
\mid \texttt{Bool}
\mid \tau_1\to\tau_2
$$

类型方案：

$$
\sigma ::= \forall \bar{\alpha}.\tau
$$

$\bar{\alpha}$ 表示一列类型变量，可能为空。例如：

- `Int` 可以写作 $\forall[].\texttt{Int}$；
- $\forall\alpha.\alpha\to\alpha$ 是一个量化一个变量的类型方案；
- $\forall\alpha\beta.(\alpha\to\beta)\to\alpha\to\beta$ 量化两个变量。

经典 HM 中，$\forall$ 出现在类型方案最外层，而不是任意嵌套在箭头左边。也就是说，它主要处理 **rank-1 多态**。

## 3. rank-1 是什么限制

下面是 rank-1 类型方案：

$$
\forall\alpha.\;\alpha\to\alpha
$$

量词在最外层。使用这个值时，调用者选择 $\alpha$ 的实例。

下面则把多态函数作为普通参数：

$$
(\forall\alpha.\alpha\to\alpha)\to\texttt{Int}
$$

$\forall$ 出现在函数参数内部，属于 higher-rank（高阶秩）多态的范围。经典 HM 不会完整推断这种类型。后面的双向系统会说明：使用显式标注与方向信息，仍然可以实用地检查它。

“rank”不是函数阶数，也不是类型变量数量。它粗略衡量全称量词出现在函数箭头左侧嵌套了多深。

## 4. 上下文里存的是类型方案

HM 上下文写作：

$$
\Gamma = x_1:\sigma_1,\ldots,x_n:\sigma_n
$$

其中每个变量对应一个类型方案，而不只是单型。普通 lambda 参数通常以不含全称量词的单型放入上下文；`let` 绑定则可能经过泛化得到多态方案。

## 5. 实例化：每次使用时拆一份新的

如果上下文有：

$$
id : \forall\alpha.\alpha\to\alpha
$$

查询 `id` 时，不直接返回带量词的原方案，而是把量化变量换成新鲜变量：

$$
\operatorname{instantiate}
(\forall\alpha.\alpha\to\alpha)
=
\beta\to\beta
$$

$\beta$ 必须是 fresh。下一次查询会得到另一个新变量，例如 $\gamma\to\gamma$。

一般定义：

$$
\operatorname{instantiate}(\forall\alpha_1\ldots\alpha_n.\tau)
=
\lbrack\beta_1/\alpha_1,\ldots,\beta_n/\alpha_n\rbrack\tau
$$

其中每个 $\beta_i$ 都是新鲜类型变量。

## 6. 泛化：只量化不依赖环境的变量

假设推断出 `fn x => x` 的单型：

$$
\alpha\to\alpha
$$

如果 $\alpha$ 不受外层环境约束，就可以把它泛化：

$$
\operatorname{generalize}(\Gamma,\alpha\to\alpha)
=
\forall\alpha.\alpha\to\alpha
$$

精确定义：

$$
\operatorname{generalize}(\Gamma,\tau)
=
\forall\bigl(
  \operatorname{ftv}(\tau)
  \setminus
  \operatorname{ftv}(\Gamma)
\bigr).\tau
$$

逐项解释：

1. $\operatorname{ftv}(\tau)$：结果类型中的自由类型变量；
2. $\operatorname{ftv}(\Gamma)$：外层环境仍然依赖的自由类型变量；
3. 集合差：只挑出结果类型自己新增、没有被环境固定的变量；
4. 用 $\forall$ 量化这些变量。

为什么不能把环境里的变量也量化？看例子：

```text
fn x =>
  let y = x in
  y
```

若 `x : alpha`，那么 `y` 的类型变量来自外层参数。把 `y` 错误泛化成 `forall alpha. alpha`，就会声称它能在任意类型上使用，仿佛 `x` 同时是整数和字符串。这显然不安全。

## 7. HM 的四条核心规则

为了突出多态，我们使用 `Inst` 和 `Gen` 关系。

### 变量与实例化

一种声明式写法是：

$$
\frac{x:\sigma\in\Gamma \qquad \tau \preceq \sigma}
     {\Gamma\vdash x:\tau}
\;(\mathrm{Var})
$$

$\tau\preceq\sigma$ 表示“$\tau$ 是类型方案 $\sigma$ 的一个实例”。例如：

$$
\texttt{Int}\to\texttt{Int}
\preceq
\forall\alpha.\alpha\to\alpha
$$

不同资料可能把实例关系的符号方向写反，所以不能只凭符号猜含义。

### 函数抽象

$$
\frac{\Gamma,x:\tau_1\vdash e:\tau_2}
     {\Gamma\vdash\lambda x.e:\tau_1\to\tau_2}
\;(\mathrm{Abs})
$$

lambda 参数在经典 HM 中是单态绑定。`x : tau1` 可看作没有量化变量的方案。

### 函数应用

$$
\frac{
  \Gamma\vdash e_1:\tau_1\to\tau_2
  \qquad
  \Gamma\vdash e_2:\tau_1
}{
  \Gamma\vdash e_1\;e_2:\tau_2
}
\;(\mathrm{App})
$$

### let 多态

教学版规则可以写为：

$$
\frac{
  \Gamma\vdash e_1:\tau_1
  \qquad
  \sigma=\operatorname{generalize}(\Gamma,\tau_1)
  \qquad
  \Gamma,x:\sigma\vdash e_2:\tau_2
}{
  \Gamma\vdash
  \texttt{let}\;x=e_1\;\texttt{in}\;e_2
  :\tau_2
}
\;(\mathrm{Let})
$$

朗读：

1. 在旧环境里得到右侧 $e_1$ 的单型 $\tau_1$；
2. 相对于旧环境泛化它，得到方案 $\sigma$；
3. 把 `x : sigma` 加入环境，检查正文 $e_2$；
4. 整个 `let` 的类型就是正文类型 $\tau_2$。

有些正式展示把泛化拆成独立规则，或用 Damas–Milner 的语法和关系定义，不会直接写一个 `generalize` 函数。这里的版本是为了与实现建立直觉对应。

## 8. 完整走一遍 `let id`

程序：

```text
let id = fn x => x in
(id(1), id(true))
```

### 第一步：推断 lambda

为参数 `x` 创建新变量 $\alpha$：

$$
x:\alpha\vdash x:\alpha
$$

于是：

$$
\varnothing\vdash\lambda x.x:\alpha\to\alpha
$$

### 第二步：泛化 let 右侧

$$
\operatorname{ftv}(\alpha\to\alpha)=\{\alpha\}
$$

空环境没有自由类型变量：

$$
\operatorname{ftv}(\varnothing)=\varnothing
$$

所以：

$$
\operatorname{generalize}
(\varnothing,\alpha\to\alpha)
=
\forall\alpha.\alpha\to\alpha
$$

### 第三步：第一次使用

实例化 `id`，得到 $\beta\to\beta$。参数 `1` 是 `Int`，应用约束要求：

$$
\beta = \texttt{Int}
$$

因此 `id(1) : Int`。

### 第四步：第二次使用

再次实例化，必须得到全新的 $\gamma\to\gamma$。参数 `true` 是 `Bool`：

$$
\gamma = \texttt{Bool}
$$

因此 `id(true) : Bool`。最终二元组类型为 `(Int, Bool)`。

## 9. 主类型

表达式 `fn f => fn x => f(x)` 可以具有很多具体类型：

$$
(\texttt{Int}\to\texttt{Bool})
\to\texttt{Int}\to\texttt{Bool}
$$

也可以是：

$$
(\texttt{String}\to\texttt{Int})
\to\texttt{String}\to\texttt{Int}
$$

HM 会得到更一般的：

$$
\forall\alpha\beta.
(\alpha\to\beta)\to\alpha\to\beta
$$

其他具体类型都能通过实例化它得到，所以它是主类型方案。主类型不是“运行时最常出现的类型”，也不是继承层次里的顶类型，而是对该表达式所有合法 HM 类型的最一般概括。

## 10. 箭头结合性与括号

约定：

$$
A\to B\to C
\equiv
A\to(B\to C)
$$

箭头向右结合。因此：

$$
(A\to B)\to A\to B
$$

表示一个高阶函数：第一个参数本身是函数。括号不能省略成 $A\to B\to A\to B$，后者结构不同。

## 11. 常见误解

### `forall` 不是每次调用都执行的循环

它是类型层的量化。运行时通常已被擦除，不会真的遍历所有类型。

### 泛化不是把所有未知量都变成泛型

只能泛化不依赖环境的自由变量；在带可变引用或效果的语言里，还可能受 value restriction（值限制）约束。

### 合一变量不等于泛型参数

合一变量表示“当前还不知道，之后会被求解”；全称量化变量表示“使用者可任意选择”。一个是待填洞，一个是承诺对所有类型成立。

### HM 不是所有多态推断的最终答案

它的完整推断能力来自明确限制。加入 higher-rank 多态、复杂子类型、GADT 等特性后，通常需要标注、双向检查或其他局部推断策略。

下一章会解释 HM 推断最重要的机械工具：替换与合一。

## 本章检查点

- 能区分单型、类型方案与每次使用得到的实例。
- 能写出 $\mathrm{generalize}(\Gamma,\tau)$ 中自由变量集合差。
- 能解释为何 `let id` 可多态而 lambda 参数在经典 HM 中单态。
- 能用“其他类型由实例化得到”解释主类型。
