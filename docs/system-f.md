# System F：把“对所有类型”写进程序

HM 已经能给 `let id = fn x => x` 推断出：

$$
\forall\alpha.\alpha\to\alpha
$$

但 HM 把全称量词限制在类型方案的外层，并主要在 `let` 处泛化。System F 问得更直接：

> 如果“抽象一个类型”和“传入一个类型”也成为核心语言里的显式动作，会怎样？

这一步把参数多态从推断器的隐含行为，变成了可以写规则、做归约的程序结构。

## 1. 先从 TypeScript 泛型读起

```ts
function identity<A>(value: A): A {
  return value;
}

identity<number>(42);
```

这里有两层参数：

- `A` 是类型参数；
- `value` 是值参数。

System F 把两层分别写成：

$$
\Lambda\alpha.\lambda x:\alpha.x
$$

请注意大小写：

- $\Lambda\alpha.e$：类型抽象，绑定类型变量 $\alpha$；
- $\lambda x:A.e$：值抽象，绑定值变量 $x$；
- $e\,[A]$：类型应用，把类型 $A$ 交给一个多态项；
- $e_1\ e_2$：值应用，把值 $e_2$ 交给函数 $e_1$。

它们是两套相似但不相同的语法。

## 2. System F 的类型与项

一个最小 Church-style System F 可以写成：

$$
\begin{aligned}
A,B ::= {}& \alpha
\mid A\to B
\mid \forall\alpha.A \\
e ::= {}& x
\mid \lambda x:A.e
\mid e_1\ e_2
\mid \Lambda\alpha.e
\mid e\,[A]
\end{aligned}
$$

逐项翻译：

- $A,B$ 是类型的元变量；
- $\alpha$ 是类型变量；
- $A\to B$ 是函数类型；
- $\forall\alpha.A$ 是全称类型；
- $e$ 是程序表达式；
- 类型标注、类型应用直接保留在项里。

“Church style”在这里意味着核心项带着足够的显式类型信息。它不同于把类型全部擦掉、再要求推断器恢复的 Curry-style 问题。

## 3. 为什么需要类型变量上下文

STLC 的上下文通常只记录值变量：

$$
\Gamma = x_1:A_1,\ldots,x_n:A_n
$$

System F 还要知道哪些类型变量当前有效。这里用两个上下文：

$$
\Delta;\Gamma\vdash e:A
$$

- $\Delta$：类型变量上下文，例如 $\alpha,\beta$；
- $\Gamma$：值变量上下文，例如 $x:\alpha$；
- 分号只是把两类信息分开；
- 整句读作：“类型变量假设 $\Delta$、值变量假设 $\Gamma$ 下，$e$ 具有类型 $A$。”

有些教材把两者放进同一个 $\Gamma$。记号不同不代表理论不同，先查看论文的上下文定义。

## 4. 类型抽象规则

$$
\frac{
  \Delta,\alpha;\Gamma\vdash e:A
  \qquad
  \alpha\notin \mathrm{ftv}(\Gamma)
}{
  \Delta;\Gamma\vdash \Lambda\alpha.e:\forall\alpha.A
}
\;(\forall\mathrm{I})
$$

从下往上读：

1. 目标是证明类型抽象具有 $\forall\alpha.A$；
2. 暂时把新的类型变量 $\alpha$ 放进 $\Delta$；
3. 在这个任意但固定的 $\alpha$ 下检查主体 $e:A$；
4. $\alpha\notin\mathrm{ftv}(\Gamma)$ 防止把外部环境已经固定的类型错误地推广成“任意类型”。

$\mathrm{ftv}(\Gamma)$ 表示环境中出现的自由类型变量。规则名里的 I 是 introduction：它说明怎样构造一个全称类型的值。

恒等函数的推导核心是：

$$
\frac{
  \alpha; x:\alpha\vdash x:\alpha
}{
  \alpha;\varnothing\vdash \lambda x:\alpha.x:\alpha\to\alpha
}
$$

再应用 $\forall\mathrm I$：

$$
\varnothing;\varnothing
\vdash
\Lambda\alpha.\lambda x:\alpha.x
:
\forall\alpha.\alpha\to\alpha
$$

## 5. 类型应用规则

$$
\frac{
  \Delta;\Gamma\vdash e:\forall\alpha.A
  \qquad
  \Delta\vdash B\ \mathrm{type}
}{
  \Delta;\Gamma\vdash e\,[B]:A[B/\alpha]
}
\;(\forall\mathrm{E})
$$

- E 是 elimination：消费一个全称值；
- $B$ 是本次选择的实例类型；
- $A[B/\alpha]$ 表示在 $A$ 中把自由出现的 $\alpha$ 替换为 $B$；
- $\Delta\vdash B\ \mathrm{type}$ 表示 $B$ 在当前类型变量作用域中是良构类型。

若：

$$
\mathrm{id}:\forall\alpha.\alpha\to\alpha
$$

则：

$$
\mathrm{id}\,[\mathrm{Int}]
:
(\alpha\to\alpha)[\mathrm{Int}/\alpha]
=
\mathrm{Int}\to\mathrm{Int}
$$

于是它可以继续应用到 $42$。

## 6. 类型层也有 Beta 归约

值层归约：

$$
(\lambda x:A.e)\ v
\longrightarrow
e[v/x]
$$

类型层归约：

$$
(\Lambda\alpha.e)\,[B]
\longrightarrow
e[B/\alpha]
$$

所以：

$$
(\Lambda\alpha.\lambda x:\alpha.x)
[\mathrm{Int}]
\ 42
$$

先变成：

$$
(\lambda x:\mathrm{Int}.x)\ 42
$$

再变成 $42$。类型替换与值替换发生在不同语法层，不能用同一张无作用域字符串表处理。

## 7. 量词位置决定“谁选择类型”

比较：

$$
\forall\alpha.(\alpha\to\alpha)\to\mathrm{Int}
$$

和：

$$
(\forall\alpha.\alpha\to\alpha)\to\mathrm{Int}
$$

第一种：调用整个函数时，调用者先选一个 $\alpha$，函数参数只需在该类型上工作。

第二种：函数接收一个真正多态的参数；被调用函数内部可以把这个参数分别用在 `Int`、`Bool` 等类型上。

TypeScript 用一个近似例子表达第二种意图：

```ts
type PolyId = <A>(x: A) => A;

function useTwice(id: PolyId): [number, string] {
  return [id(1), id("ok")];
}
```

这里“泛型在参数内部”，已经不是经典 HM 中 lambda 参数只持有单型的普通情况。

## 8. Predicative 与 impredicative

实例化 $\forall\alpha.A$ 时，允许拿什么替换 $\alpha$？

若只允许单型：

$$
\alpha := \mathrm{Int}\to\mathrm{Bool}
$$

这是 predicative 限制。

若还允许多态类型本身：

$$
\alpha := \forall\beta.\beta\to\beta
$$

则称为 impredicative 实例化。System F 的核心表达力允许这种类型，但“给擦除类型的程序自动找到这些实例化”远比 HM 困难。

## 9. 为什么检查容易，完整推断困难

对于显式项：

$$
(\Lambda\alpha.\lambda x:\alpha.x)[\mathrm{Int}]\ 42
$$

检查器看得见：

- 哪里引入 $\alpha$；
- lambda 参数是什么类型；
- 哪里选择了 $\mathrm{Int}$。

如果输入只有：

```text
(fn x => x) 42
```

还要求系统恢复任意嵌套的全称量词、类型抽象与类型应用，搜索空间与可判定性边界会发生根本变化。经典结果不是“System F 无法类型检查”，而是：

- 显式 Church-style System F 的类型检查可机械完成；
- 擦除类型信息后的完整 System F 类型推断不可判定；
- 实用语言通常靠标注、rank 限制、局部推断或双向检查恢复可用性。

## 10. 类型擦除

System F 的许多运行语义会在执行前擦掉类型抽象、类型应用与标注：

$$
|\Lambda\alpha.e|=|e|
\qquad
|e[A]|=|e|
$$

$$
|\lambda x:A.e|=\lambda x.|e|
$$

这叫 type erasure。它说明类型参数可以只服务于静态检查，不必作为运行时对象存在。

但不要过度推广：

- Rust 可能单态化泛型；
- Java 采用自己的擦除策略；
- 运行时类型反射会保留或重建部分信息；
- “理论上可擦除”不等于“所有编译器都用同一种实现”。

## 11. Parametricity 与 free theorem

若一个纯、终止、没有反射或未定义行为的函数具有：

$$
f:\forall\alpha.\alpha\to\alpha
$$

它无法检查 $\alpha$ 究竟是什么，也无法凭空构造任意 $\alpha$。因此它的行为受到强约束：正常返回时只能交回输入。

这类“仅从多态类型推导程序行为”的原则称为 parametricity；得到的行为定理常被称为 free theorem。

它不是说类型完整描述了实现。异常、无限循环、类型反射、强制转换和语言中的非健全逃生口都会改变结论的前提。

## 12. 与 HM、双向检查的连接

| 系统 | 多态在哪里 | 谁写类型信息 | 主要优势 |
| --- | --- | --- | --- |
| HM | let 绑定的 rank-1 类型方案 | 多数由算法推断 | 主类型、完整自动推断 |
| System F | 项中显式抽象/应用，可嵌套 ∀ | 核心项显式写出 | 简洁研究高阶多态 |
| 双向 higher-rank | ∀ 可更深嵌套 | 关键边界写标注 | 用信息方向控制标注与搜索 |

可以把实用编译器的 elaboration 理解为：用户写较轻的表面语法，检查器在标注帮助下把它翻译成更显式的 System-F-like 核心项。

## 13. 手工练习

### 练习 A：区分两种应用

给：

$$
e=\Lambda\alpha.\lambda x:\alpha.x
$$

指出 $e[\mathrm{Bool}]$ 与 $e\ \mathrm{true}$ 哪一个先合法。答案：先做类型应用得到 $\mathrm{Bool}\to\mathrm{Bool}$，然后才能做值应用。

### 练习 B：找作用域

$$
\Lambda\alpha.
(\lambda x:\alpha.
  \Lambda\alpha.\lambda y:\alpha.y)
$$

内层 $\alpha$ 遮蔽外层 $\alpha$。实现时最好给绑定变量唯一 ID，而不是只比较打印名字。

### 练习 C：解释量词

用“谁选择类型”的语言解释：

$$
\forall\alpha.\alpha\to\alpha
$$

答案应包含：使用这个值的一方可以选择任意实例类型，而实现必须对所有选择统一成立。

## 本章检查点

- 能区分 $\Lambda$、$\lambda$、类型应用和值应用。
- 能逐项解释 $\forall$ 引入与消去规则。
- 能说明 HM 的 let 多态为何只是多态世界的一个可推断片段。
- 能区分“显式 System F 类型检查”与“擦除标注后的完整推断”。
- 能解释类型擦除是语义/实现选择，而不是泛型的唯一编译方式。
