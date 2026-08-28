# 依赖类型：当类型可以提到值

简单函数类型：

$$
A\to B
$$

要求返回类型 $B$ 不因具体参数值而变化。依赖函数类型允许返回类型引用参数：

$$
(x:A)\to B(x)
$$

这句话就是“类型依赖值”的最小核心。它可以让数组长度、协议状态甚至数学命题进入类型，但也要求我们重新理解函数、pair、等式、归约与类型检查。

## 1. 从 Rust const generic 建立有限直觉

```rust
fn first<T, const N: usize>(values: [T; N]) -> &T {
    &values[0]
}
```

这里 `N` 出现在类型 `[T; N]` 中。工程语言会限制哪些值能用于类型索引、哪些运算可在编译期执行。

依赖类型理论研究更一般的形式：若 $a:A$ 是一个值，类型族 $B(a)$ 可以随 $a$ 改变。

不要因此断言 const generics 就是完整依赖类型。它只提供了正确的第一步直觉：类型表达式能够引用某类值。

## 2. 类型族是什么

把：

$$
\mathrm{Vec}:\mathrm{Type}\to\mathrm{Nat}\to\mathrm{Type}
$$

读成一个接受两个参数的类型构造器：

1. 先接收元素类型 $A:\mathrm{Type}$；
2. 再接收长度 $n:\mathrm{Nat}$；
3. 返回一个类型 $\mathrm{Vec}\ A\ n:\mathrm{Type}$。

固定 $A$ 后：

$$
\mathrm{Vec}\ A : \mathrm{Nat}\to\mathrm{Type}
$$

它把每个自然数映射到一个不同类型，因此称为由 `Nat` 索引的类型族：

$$
\mathrm{Vec}\ A\ 0,quad
\mathrm{Vec}\ A\ 1,quad
\mathrm{Vec}\ A\ 2,ldots
$$

## 3. Π 类型：依赖函数

依赖函数类型写作：

$$
\Pi(x:A).B(x)
$$

也常写作：

$$
(x:A)\to B(x)
$$

逐个符号：

- $\Pi$：dependent product / dependent function 的绑定器；
- $x:A$：输入值 $x$ 的类型是 $A$；
- $B(x)$：返回类型允许提到 $x$；
- $x$ 的作用域是点号后的 $B(x)$。

如果 $B$ 根本不使用 $x$：

$$
\Pi(x:A).B
$$

就退化为普通函数类型：

$$
A\to B
$$

所以普通箭头是 Π 类型的非依赖特例。

## 4. Π 与 forall 不要草率画等号

System F 的：

$$
\forall\alpha. A
$$

绑定一个类型变量。

依赖类型中的：

$$
\Pi(x:B). A(x)
$$

绑定一个值变量，而且结果类型能使用这个值。

在 Curry–Howard 视角与统一语法的理论中，`forall` 常由 Π 表示；但读具体论文时仍要确认：

- 变量属于哪个 universe；
- 参数是隐式还是显式；
- 是值级参数、类型级参数，还是统一后的普通项；
- 是否有擦除标记。

## 5. Π 类型的引入与消去

引入规则：

$$
\frac{
  \Gamma,x:A\vdash e:B(x)
}{
  \Gamma\vdash
  \lambda x.e:
  \Pi(x:A).B(x)
}
\;(\Pi\mathrm I)
$$

意思是：假设任意 $x:A$，若主体能产生相应的 $B(x)$，则 lambda 是依赖函数。

消去规则：

$$
\frac{
  \Gamma\vdash f:\Pi(x:A).B(x)
  \qquad
  \Gamma\vdash a:A
}{
  \Gamma\vdash f\ a:B(a)
}
\;(\Pi\mathrm E)
$$

与普通函数应用的关键差别是：结果类型把形式参数 $x$ 替换为实际参数 $a$。

## 6. 向量拼接的类型

$$
\mathrm{append}:
\Pi(A:\mathrm{Type}).
\Pi(m:\mathrm{Nat}).
\Pi(n:\mathrm{Nat}).
\mathrm{Vec}\ A\ m
\to
\mathrm{Vec}\ A\ n
\to
\mathrm{Vec}\ A\ (m+n)
$$

它不只说“输入输出都是列表”，还记录输出长度。

调用：

$$
\mathrm{append}\ \mathrm{Bool}\ 2\ 3\ xs\ ys
:
\mathrm{Vec}\ \mathrm{Bool}\ (2+3)
$$

归约后：

$$
\mathrm{Vec}\ \mathrm{Bool}\ 5
$$

类型检查因而必须能够计算类型中出现的表达式。

## 7. Definitional equality：通过计算相等

判断两个依赖类型是否相等，不能只比较语法字符串：

$$
\mathrm{Vec}\ A\ (2+3)
$$

与：

$$
\mathrm{Vec}\ A\ 5
$$

应当在自然数加法归约后被视为相同。通过内建计算规则成立的相等称为 definitional equality（定义相等、判断相等）。

常写：

$$
A\equiv B
$$

一个 conversion 规则：

$$
\frac{
  \Gamma\vdash e:A
  \qquad
  A\equiv B
  \qquad
  \Gamma\vdash B:\mathrm{Type}
}{
  \Gamma\vdash e:B
}
$$

这里的 $\equiv$ 不是用户传入的一份等式证明，而是类型检查器通过归约/规范化直接判定的关系。

## 8. Propositional equality：把相等当作类型

并非所有真实相等都能靠定义归约直接看出。我们还需要等式类型：

$$
\mathrm{Eq}_A(a,b)
$$

或常见记法：

$$
a =_A b
$$

自反构造器：

$$
\mathrm{refl}_a:a=_A a
$$

若有：

$$
p:a=_A b
$$

$p$ 是一个证明项。系统允许沿 $p$ 把依赖于 $a$ 的数据运输到依赖于 $b$ 的类型。

区分：

- definitionally equal：检查器直接计算后相同；
- propositionally equal：需要一个显式证明项。

把两者混淆，是阅读依赖类型错误信息时最常见的困难之一。

## 9. Σ 类型：依赖 pair

普通积类型：

$$
A\times B
$$

第二部分类型固定。依赖 pair：

$$
\Sigma(x:A).B(x)
$$

允许第二部分的类型依赖第一部分的值。

一个“长度和对应向量”的包：

$$
\Sigma(n:\mathrm{Nat}).\mathrm{Vec}\ A\ n
$$

值可能是：

$$
(3,[a_1,a_2,a_3])
$$

第二项必须具有第一项所指定的长度。

如果 $B$ 不使用 $x$：

$$
\Sigma(x:A).B
\cong
A\times B
$$

因此普通 pair 是 Σ 类型的非依赖特例。

## 10. Σ 与存在类型的关系

存在类型：

$$
\exists x:A.B(x)
$$

与 Σ 都表达“有某个 $x$，并有与它对应的数据”。在命题即类型视角下，Σ 的值同时携带 witness 与证据。

但工程模块中的存在抽象强调“隐藏 witness”，而依赖 pair 的第一投影通常可以访问。要达到抽象封装，还需结合模块边界、擦除或不可见性规则。

所以可用这条记忆：

- Σ：数据中携带索引及依赖于它的第二部分；
- 存在抽象：接口刻意不让客户端依赖具体 witness。

二者逻辑结构相关，编程接口语义不一定相同。

## 11. 命题即类型

在 Curry–Howard 解释下：

| 逻辑 | 类型 |
| --- | --- |
| 命题 $P$ | 类型 $P$ |
| $P$ 的证明 | 类型 $P$ 的值 |
| $P\Rightarrow Q$ | 函数 $P\to Q$ |
| $\forall x:A.P(x)$ | $\Pi(x:A).P(x)$ |
| $\exists x:A.P(x)$ | $\Sigma(x:A).P(x)$ |

例如：

$$
\Pi(n:\mathrm{Nat}).\mathrm{Even}(n)\to\mathrm{Even}(n+2)
$$

既可读作函数类型，也可读作定理：“对任意自然数 $n$，若 $n$ 为偶数，则 $n+2$ 为偶数。”

实现这个函数就是构造证明。

## 12. Universe：类型也需要类型

如果问：

$$
\mathrm{Nat}:?
$$

我们可能写：

$$
\mathrm{Nat}:\mathrm{Type}
$$

但若再写：

$$
\mathrm{Type}:\mathrm{Type}
$$

在强大的依赖类型系统中会导致 Girard 悖论一类不一致问题。常见设计使用 universe 层级：

$$
\mathrm{Type}_0:\mathrm{Type}_1
$$

$$
\mathrm{Type}_1:\mathrm{Type}_2
$$

并允许较小 universe 的类型在适当规则下用于较大 universe。

论文可能写 `Set`、`Type`、$\mathcal U_i$ 或省略层级。看到“类型的类型”时要立刻查 universe 规则。

## 13. 类型检查为什么依赖求值

在 STLC 中，类型结构大多是静态语法树。依赖类型中，类型里含普通项：

$$
\mathrm{Vec}\ A\ (\mathrm{length}\ xs)
$$

比较类型可能要求计算 `length xs`。因此元理论通常需要关心：

- 归约是否终止；
- 规范形是否唯一或可比较；
- 开放项怎样归约；
- 带递归的定义何时被接受；
- 可判定类型检查依赖哪些规范化性质。

许多证明助手要求定义满足终止性/结构递归，不只是为了运行安全，也是为了让类型相等检查保持可靠。

## 14. Bidirectional checking 再次出现

依赖类型的 lambda、隐式参数和复杂等式会让无标注综合非常困难。双向类型检查很自然：

检查依赖 lambda：

$$
\frac{
  \Gamma,x:A\vdash e\Leftarrow B(x)
}{
  \Gamma\vdash
  \lambda x.e
  \Leftarrow
  \Pi(x:A).B(x)
}
$$

期望的 Π 类型把参数类型 $A$ 与主体期望 $B(x)$ 向内传递。

函数应用则通常从函数位置综合出 Π 类型，再把实参代入结果。现代依赖语言还会加入隐式参数、元变量、合一和 elaboration，但“综合消去式、检查引入式”的方向仍很重要。

## 15. Proof relevance 与擦除

证明参数是否参与运行？

考虑：

$$
\mathrm{safeHead}:
\Pi(n:\mathrm{Nat}).
\mathrm{Vec}\ A\ (n+1)
\to A
$$

$n$ 可能只帮助检查，并不需要作为独立运行时数据。另一方面，Σ pair 的第一项可能真的决定后续计算。

依赖语言常区分：

- runtime-relevant 参数：执行时保留；
- erased / irrelevant 参数：只用于静态检查；
- implicit 参数：源码省略但 elaborator 补出。

“出现在类型里”不自动决定运行时是否存在，必须看语言的相关性和擦除规则。

## 16. 与 GADT、精化类型的比较

| 系统 | 类型能知道什么 | 常见自动化 |
| --- | --- | --- |
| GADT | 构造器决定的离散类型索引与等式 | 模式匹配精化、受标注引导的推断 |
| 精化类型 | 基础值满足某逻辑谓词 | 验证条件 + SMT |
| 依赖类型 | 类型可依赖一般项，证明本身是程序 | 归约、合一、elaboration + 用户证明 |

边界可以重叠：

- 向量长度可由 GADT 索引表达；
- 算术边界可由精化谓词表达；
- 依赖类型可直接让返回类型含 $m+n$ 并要求相关证明。

选择哪种工具取决于需要表达的性质、期望自动化程度和可接受的标注/证明成本。

## 17. 一个完整小例子：有限索引

定义：

$$
\mathrm{Fin}:\mathrm{Nat}\to\mathrm{Type}
$$

$\mathrm{Fin}\ n$ 表示严格小于 $n$ 的自然数。安全索引：

$$
\mathrm{lookup}:
\Pi(A:\mathrm{Type}).
\Pi(n:\mathrm{Nat}).
\mathrm{Vec}\ A\ n
\to
\mathrm{Fin}\ n
\to A
$$

它把“索引合法”从运行时布尔检查变成参数类型。

但合法索引仍要从某处构造：

- 静态常量可能直接证明；
- 动态整数需要边界检查，成功后才能包装成 $\mathrm{Fin}\ n$；
- 检查没有消失，而是被集中到构造证据的边界。

这是类型驱动设计的重要现实：强类型把不变量搬到接口上，但不会凭空创造事实。

## 18. 阅读依赖类型公式的七问

1. 哪些名字是值，哪些是类型，哪些是 universe？
2. 每个绑定器的作用域到哪里？
3. 当前讨论定义相等还是命题相等？
4. 类型检查会归约哪些表达式？
5. 哪些参数显式、隐式或擦除？
6. 递归/终止规则是什么？
7. 当前 judgment 是综合、检查、良构性还是相等检查？

## 本章检查点

- 能把 $\Pi(x:A).B(x)$ 读成返回类型依赖输入的函数。
- 能把 $\Sigma(x:A).B(x)$ 读成第二部分类型依赖第一部分的 pair。
- 能区分定义相等与带证明项的命题相等。
- 能解释为什么依赖类型检查需要计算类型中的程序。
- 能说明强类型不会消除动态检查，而会把检查集中在证据构造边界。
