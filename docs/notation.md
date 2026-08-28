# 先学会读公式

这一章不是数学预备课，而是一份“类型系统论文阅读语法”。目标是看到一条规则时，能够像读函数签名一样把它拆开。

## 1. 元变量：字母代表一类东西

论文常用希腊字母，是为了把“论文里的变量”与“被研究程序里的变量”分开。

| 写法 | 常见读法 | 通常表示 | 例子 |
| --- | --- | --- | --- |
| $e$ | expression | 表达式 | `x`、`42`、`f(x)` |
| $x,y,f$ | variable | 程序变量 | 参数名、局部变量名 |
| $\tau, \sigma$ | tau, sigma | 类型 | `Int`、`a -> a` |
| $\alpha, \beta$ | alpha, beta | 类型变量 | 尚不知道的类型 |
| $\Gamma$ | Gamma | 类型上下文/环境 | `x : Int, f : Int -> Bool` |
| $S, T$ | substitution | 类型替换 | `[Int/alpha]` |
| $C$ | constraints | 约束集合 | `{alpha = Int}` |

这些只是惯例，不是法律。论文完全可以用 $A,B$ 表示类型，用 $\Delta$ 表示上下文。关键是先找到它的“Syntax”或“Judgments”定义。

## 2. 类型语法中的 `::=` 和竖线

下面是在定义一个小型类型语言：

$$
\tau ::= \alpha \mid \texttt{Int} \mid \texttt{Bool} \mid \tau_1 \to \tau_2
$$

逐项朗读：

> 类型 $\tau$ 被定义为：类型变量 $\alpha$，或者 `Int`，或者 `Bool`，或者从类型 $\tau_1$ 到类型 $\tau_2$ 的函数类型。

- `::=`：定义为、由以下形式构成；
- `|`：或者；
- 下标 `1`、`2`：只是区分两个可能不同的类型，不表示数组索引；
- 递归出现的 $\tau$：说明函数的参数与返回值本身还可以是函数类型。

表达式也可以用同样方法定义：

$$
e ::= x \mid n \mid \lambda x.e \mid e_1\;e_2 \mid
      \texttt{let}\;x=e_1\;\texttt{in}\;e_2
$$

这里的 $e_1\;e_2$ 表示函数应用，也就是常见语法里的 `e1(e2)`。

## 3. 冒号：某个项具有某个类型

$$
x : \texttt{Int}
$$

读作“$x$ 具有类型 `Int`”。它不一定是源代码中的声明；在论文里，它经常是一条数学事实或上下文中的假设。

## 4. 上下文 $\Gamma$

上下文可以先粗略理解成一个只读映射：

$$
\Gamma = x : \texttt{Int},\; f : \texttt{Int} \to \texttt{Bool}
$$

对应程序员熟悉的结构：

```text
Gamma = {
  x: Int,
  f: Int -> Bool
}
```

写成 $\Gamma, y : \texttt{String}$ 时，表示在旧上下文基础上临时增加绑定 `y : String`。作用域规则通常要求同名变量如何遮蔽，也要求类型变量不能逃出其作用域。

## 5. 判断符号 $\vdash$

最常见的类型判断是：

$$
\Gamma \vdash e : \tau
$$

读作：

> 在上下文 $\Gamma$ 下，可以推出表达式 $e$ 具有类型 $\tau$。

也可以更口语化：

> 如果我们知道 $\Gamma$ 里的那些变量类型，那么 `e` 的类型是 $\tau$。

$\vdash$ 左边是可用的假设，右边是要成立的结论。它不是赋值，也不是程序运行时的操作。

有些系统还会写输出上下文：

$$
\Gamma \vdash e \Rightarrow A \dashv \Delta
$$

这表示算法从输入上下文 $\Gamma$ 开始，综合出类型 $A$，并得到更新后的输出上下文 $\Delta$。$\dashv$ 可以看作把最终状态隔在右边的分隔符；具体含义必须以论文定义为准。

## 6. 横线：推理规则，不是分数

一条推理规则通常长这样：

$$
\frac{\text{前提}_1 \qquad \text{前提}_2}
     {\text{结论}}
\;(\mathrm{Rule-Name})
$$

含义是：只要横线上方的所有前提成立，就可以得到横线下方的结论。`qquad` 只是排版空格；并排的前提表示“并且”。右侧括号里是规则名。

例如函数应用：

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

逐项翻译：

1. 在同一个上下文 $\Gamma$ 下，$e_1$ 是一个从 $\tau_1$ 到 $\tau_2$ 的函数；
2. 在 $\Gamma$ 下，参数 $e_2$ 的类型正好是 $\tau_1$；
3. 因此调用 $e_1\;e_2$ 的结果类型是 $\tau_2$。

把它翻成检查器轮廓：

```text
function typeOfApply(gamma, e1, e2):
  functionType = typeOf(gamma, e1)
  require functionType has shape inputType -> outputType
  argumentType = typeOf(gamma, e2)
  require argumentType equals inputType
  return outputType
```

## 7. 没有前提的规则

常量规则可能是：

$$
\frac{\;}{\Gamma \vdash 42 : \texttt{Int}}
\;(\mathrm{T-Int})
$$

横线上没有前提，表示它是一条公理式规则：不需要先证明别的类型判断，整数常量本身就具有 `Int` 类型。$\Gamma$ 仍然出现，是因为无论周围有哪些变量，`42` 都是 `Int`。

## 8. 集合成员、定义与相等

常见符号不要混在一起：

- $x \in X$：`x` 是集合 `X` 的成员；
- $x \notin X$：不是成员；
- $A = B$：两边相等；
- $f(x) = y$：函数在该输入上的结果；
- $X \triangleq Y$ 或 $X := Y$：把左边定义为右边；
- $X \cup Y$：集合并集；
- $X \setminus Y$：从 `X` 删除 `Y` 中的成员；
- $\varnothing$：空集。

例如：

$$
\operatorname{ftv}(\tau_1 \to \tau_2)
=
\operatorname{ftv}(\tau_1) \cup \operatorname{ftv}(\tau_2)
$$

读作：函数类型中的自由类型变量，是参数类型和返回类型的自由类型变量集合的并集。

## 9. 自由变量与绑定变量

在类型方案中：

$$
\forall \alpha.\; \alpha \to \alpha
$$

$\forall \alpha$ 绑定了后面出现的 $\alpha$。它读作“对于任意类型 alpha”。这个类型方案表示恒等函数可以作用于任何一种类型。

对比：

$$
\alpha \to \beta
$$

如果外层没有量词绑定 $\alpha,\beta$，它们就是自由类型变量。自由与绑定不是字母自身的属性，而取决于出现位置和作用域。

定义自由类型变量函数：

$$
\begin{aligned}
\operatorname{ftv}(\texttt{Int}) &= \varnothing \\
\operatorname{ftv}(\alpha) &= \{\alpha\} \\
\operatorname{ftv}(\tau_1 \to \tau_2)
  &= \operatorname{ftv}(\tau_1) \cup \operatorname{ftv}(\tau_2) \\
\operatorname{ftv}(\forall\alpha.\tau)
  &= \operatorname{ftv}(\tau) \setminus \{\alpha\}
\end{aligned}
$$

这里 `ftv` 是 *free type variables* 的缩写。

## 10. 替换记号

$$
\lbrack\texttt{Int}/\alpha\rbrack\tau
$$

常见读法是“在 $\tau$ 中用 `Int` 替换自由出现的 $\alpha$”。也有论文写成 $\lbrack\alpha \mapsto \texttt{Int}\rbrack\tau$ 或 $S(\tau)$。

例如：

$$
\lbrack\texttt{Int}/\alpha\rbrack(\alpha \to \alpha)
=
\texttt{Int} \to \texttt{Int}
$$

替换只处理**自由出现**，不能误伤被内层量词重新绑定的同名字母。实现时通常还要避免变量捕获。

## 11. 规则旁边的条件

规则可能带 side condition（附加条件）：

$$
\frac{\Gamma \vdash e : \tau}
     {\Gamma \vdash e : \forall\alpha.\tau}
\quad
\alpha \notin \operatorname{ftv}(\Gamma)
$$

最后一项不属于结论，而是在说：只有当 $\alpha$ 不在上下文的自由类型变量中时，才允许应用这条规则。附加条件经常承担作用域、安全性或新鲜变量约束，不能跳过。

## 12. 新鲜变量

“取一个 fresh $\alpha$”表示创建一个此前从未使用、不会与现有变量混淆的新类型变量。代码里不要真的只靠名字字符串判断新鲜性，通常使用递增 ID：

```text
freshTypeVar() => TypeVar(nextId++)
```

即使打印时都显示成 `a`，内部的 `a#17` 与 `a#23` 也必须是不同变量。

## 13. 推导树怎样读

要证明 `(fn x => x) 1 : Int`，可以构造：

$$
\frac{
  \dfrac{x:\texttt{Int} \vdash x:\texttt{Int}}
        {\varnothing \vdash \lambda x.x : \texttt{Int}\to\texttt{Int}}
  \qquad
  \varnothing \vdash 1:\texttt{Int}
}{
  \varnothing \vdash (\lambda x.x)\;1 : \texttt{Int}
}
$$

从叶子往下读：

1. 假设 `x : Int`，变量 `x` 是 `Int`；
2. 因此 `fn x => x` 是 `Int -> Int`；
3. 常量 `1` 是 `Int`；
4. 函数参数类型吻合，所以应用结果是 `Int`。

从结论往上读则像执行搜索：我想证明一次函数应用，就需要分别证明“函数部分是箭头类型”和“参数部分匹配输入类型”。

## 14. 论文公式的固定阅读清单

每看到一个新判断式，先回答：

1. 输入是什么，输出是什么？
2. 哪些字母是表达式、类型、上下文、替换？
3. 每个变量在哪里被绑定？
4. 这是声明式规则，还是可直接执行的算法规则？
5. 规则是否有附加条件？
6. 相等表示语法完全相同、定义相等，还是某种子类型/实例化关系？
7. 应用规则时，未知信息从哪里来？

接下来所有章节都会沿用这份清单。

## 本章检查点

- 能把 $\Gamma\vdash e:A$ 的环境、表达式和类型分别指出来。
- 能说明推导横线不是除法，而是“前提成立则结论成立”。
- 能找到 $\forall$、$\lambda$ 与 let 绑定变量的作用域。
- 读到陌生符号时，会先查论文定义而不是按外形猜含义。
