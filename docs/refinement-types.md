# 精化类型：在普通类型上附加可证明的条件

普通类型能告诉我们 `index` 是整数，却不能告诉我们它是否落在数组边界内：

```ts
function get<A>(items: A[], index: number): A {
  return items[index];
}
```

精化类型（refinement type）在基础类型上附加逻辑谓词，把“整数”缩小为“满足某个条件的整数”：

$$
\{\nu:\mathrm{Int}\mid 0\le\nu\}
$$

读作：“所有满足 $0\le\nu$ 的整数 $\nu$”。$\nu$ 是一个代表当前值的绑定变量，不是运行时多出来的字段。

## 1. 从 TypeScript 的类型守卫建立直觉

```ts
function divide(x: number, y: number) {
  if (y !== 0) {
    return x / y;
  }
  throw new Error("division by zero");
}
```

在 `if` 的真分支里，控制流分析记住了：

$$
y\ne 0
$$

精化类型系统把这种路径事实提升为系统化的类型判断。它不只是给 union 做 narrowing，还可把算术约束交给逻辑求解器。

## 2. 精化类型语法

一个基础形式：

$$
\{\nu:B\mid p\}
$$

- $B$：基础类型，例如 $\mathrm{Int}$、$\mathrm{Bool}$；
- $\nu$：绑定的值变量，代表这个类型中的值；
- $p$：关于 $\nu$ 与环境中其他变量的逻辑谓词；
- 竖线 $\mid$ 读作“使得”。

例子：

$$
\mathrm{Nat}
=
\{\nu:\mathrm{Int}\mid 0\le\nu\}
$$

$$
\mathrm{Pos}
=
\{\nu:\mathrm{Int}\mid 0<\nu\}
$$

$$
\mathrm{NonZero}
=
\{\nu:\mathrm{Int}\mid \nu\ne 0\}
$$

## 3. 函数类型可以让结果依赖参数名

绝对值的精确签名：

$$
\mathrm{abs}:
(x:\mathrm{Int})
\to
\{\nu:\mathrm{Int}\mid 0\le\nu\}
$$

更精确地还可以说返回值等于 $x$ 或 $-x$：

$$
\mathrm{abs}:
(x:\mathrm{Int})
\to
\{\nu:\mathrm{Int}\mid
  \nu=x\lor\nu=-x
\}
$$

箭头左边写成 $(x:A)$ 是因为右边的类型需要引用参数 $x$。这已经带有“类型依赖值”的味道，因此精化类型常被称为受限的依赖类型。

## 4. 子类型变成逻辑蕴含

精化类型之间的安全替代关系可归约为逻辑问题：

$$
\{\nu:B\mid p\}
<:
\{\nu:B\mid q\}
$$

若在当前环境假设下能够证明：

$$
p\Rightarrow q
$$

例如：

$$
\{\nu:\mathrm{Int}\mid \nu>10\}
<:
\{\nu:\mathrm{Int}\mid \nu>0\}
$$

因为：

$$
\nu>10\Rightarrow\nu>0
$$

这不是普通结构子类型比较，而是生成一个验证条件（verification condition），再询问逻辑求解器它是否有效。

## 5. 类型判断里的逻辑环境

上下文不再只含变量的粗类型：

$$
\Gamma =
x:\{\nu:\mathrm{Int}\mid \nu>0\},
y:\{\nu:\mathrm{Int}\mid \nu=x+1\}
$$

它对应可用假设：

$$
x>0
\qquad
y=x+1
$$

于是系统可以证明：

$$
y>1
$$

一个精化子类型判断常写成：

$$
\Gamma\vdash
\{\nu:B\mid p\}
<:
\{\nu:B\mid q\}
$$

实现会把它转成近似如下的逻辑公式：

$$
\llbracket\Gamma\rrbracket
\land p
\Rightarrow q
$$

$\llbracket\Gamma\rrbracket$ 表示从类型环境提取出的逻辑假设。

## 6. 条件分支怎样精化路径

规则的教学化写法：

$$
\frac{
  \Gamma\vdash c:\mathrm{Bool}
  \qquad
  \Gamma,c\vdash e_1:A
  \qquad
  \Gamma,\neg c\vdash e_2:A
}{
  \Gamma\vdash
  \mathbf{if}\ c\ \mathbf{then}\ e_1\ \mathbf{else}\ e_2
  :A
}
$$

- 真分支增加假设 $c$；
- 假分支增加假设 $\neg c$；
- 两条路径分别检查；
- 分支结束后，局部路径条件不能无条件泄露出去。

对除法例子，`y !== 0` 的真分支中可以满足除数类型：

$$
\{\nu:\mathrm{Int}\mid \nu\ne 0\}
$$

## 7. 数组边界例子

安全索引可写为：

$$
\mathrm{get}:
(a:\mathrm{Array}\ A)
\to
\{i:\mathrm{Int}\mid
  0\le i\land i<\mathrm{len}(a)
\}
\to A
$$

调用：

```text
if 0 <= i && i < len(items) then
  get items i
```

真分支提供两条路径事实：

$$
0\le i
\qquad
i<\mathrm{len}(\mathrm{items})
$$

它们正好蕴含 `get` 对索引的要求。

## 8. SMT 求解器到底做什么

SMT 是 satisfiability modulo theories：在布尔逻辑之外，还理解某些背景理论，例如线性整数算术、数组或未解释函数。

检查蕴含：

$$
P\Rightarrow Q
$$

通常转成检查反例是否存在：

$$
P\land\neg Q
$$

- 若该式不可满足（unsat），说明不存在违反 $Q$ 的 $P$ 情况，蕴含成立；
- 若可满足（sat），模型可以作为潜在反例；
- 若返回 unknown，系统不能把它当作证明成功。

SMT 求解器不是“替你理解任意程序的 AI”。类型系统必须把程序路径、函数规格和允许的逻辑片段翻译成严谨公式。

## 9. 一个验证条件的完整拆解

假设：

$$
x:\{\nu:\mathrm{Int}\mid \nu\ge 0\}
$$

程序返回 $x+1$，目标类型是 `Pos`：

$$
\{\nu:\mathrm{Int}\mid \nu>0\}
$$

表达式本身可赋予 singleton-like 精化：

$$
x+1:
\{\nu:\mathrm{Int}\mid \nu=x+1\}
$$

子类型检查生成：

$$
x\ge0
\land
\nu=x+1
\Rightarrow
\nu>0
$$

求解器证明该式有效，于是检查通过。

这里每个变量的来源都应明确：

- $x$ 来自函数参数；
- $\nu$ 代表待检查的返回值；
- $x\ge0$ 来自参数类型；
- $\nu=x+1$ 来自表达式语义；
- $\nu>0$ 来自目标精化。

## 10. 检查与推断不是同一个问题

程序员给出完整精化规格时，系统可以生成验证条件并检查。

但若要求自动发明任意谓词：

$$
\{\nu:\mathrm{Int}\mid ?\}
$$

候选空间近乎无限。Liquid Types 的核心做法之一，是把允许的谓词限制为从有限 qualifier 集合组合而来，再利用谓词抽象进行推断。

因此应区分：

- refinement checking：给定谓词，检查程序；
- refinement inference：在受限逻辑/候选集合内寻找谓词；
- theorem proving：允许用户构造更一般证明。

“用了 SMT”不代表任意性质都能自动推断。

## 11. Liquid Types 为什么叫 Liquid

Liquid Types 把 ML/HM 擅长的高阶函数与代数数据结构类型，与谓词抽象擅长的路径敏感值性质结合。

一个简化流程：

1. 先做 HM 风格推断，确定粗类型骨架；
2. 在基础类型位置放入未知精化；
3. 从程序和用户提供的 qualifiers 得到有限候选；
4. 生成子类型约束；
5. 用抽象解释与 SMT 求解满足约束的精化。

“Liquid”强调精化可在有限逻辑模板中流动并被推断，并不表示所有 refinement type 系统都采用同一算法。

## 12. 与 TypeScript、Rust 的关系

TypeScript 控制流分析能做许多局部 narrowing：

```ts
function length(value: string | undefined) {
  if (value !== undefined) return value.length;
  return 0;
}
```

Rust 则通过枚举、模式匹配、生命周期、const generics 与第三方验证工具表达不同种类的不变量。

这些经验有助于理解“上下文因路径变强”，但二者的标准编译器都不是通用 SMT 驱动的精化类型检查器。

## 13. 精化类型的边界

设计必须明确：

- 允许哪些逻辑公式；
- 函数调用怎样得到逻辑摘要；
- 递归如何证明终止或不变量；
- 可变状态和别名怎样影响事实；
- 非终止、异常和惰性求值如何进入逻辑；
- 求解器超时或 unknown 怎样报告；
- 错误信息如何映射回源代码。

越强的逻辑并不必然越好：可判定性、自动化、性能和错误可理解性之间存在真实取舍。

## 14. 与依赖类型的区别

精化类型：

$$
\{\nu:B\mid p\}
$$

通常保留一个已有基础类型 $B$，再用某个可自动求解的逻辑片段筛选值。

一般依赖类型允许类型本身通过值索引变化，并把证明对象作为普通项处理。两者有重叠，也可组合，但典型工具体验不同：

| 方向 | 常见交互方式 |
| --- | --- |
| 精化类型 | 写规格，自动生成验证条件，SMT 消除大量证明义务 |
| 依赖类型 | 类型检查与归约结合，必要时显式构造证明项 |

## 15. 阅读精化类型论文的清单

1. 基础类型语法是什么？
2. 精化谓词使用哪种逻辑？
3. 类型环境如何转成逻辑假设？
4. 子类型如何转成蕴含？
5. 哪些谓词由用户写，哪些可推断？
6. 求解器返回 sat、unsat、unknown 时分别做什么？
7. 可变性、递归、非终止采用什么语义假设？

## 本章检查点

- 能把 $\{\nu:B\mid p\}$ 逐个符号读成人话。
- 能解释精化子类型为何对应逻辑蕴含。
- 能从 if 分支提取路径条件。
- 能说明 SMT 求解器检查的是生成后的逻辑义务。
- 能区分精化检查、受限推断与一般定理证明。
