# GADT 与存在类型：让构造器带回更多类型事实

普通 ADT 的每个构造器都返回同一个类型构造器，区别只在携带的数据：

```rust
enum Option<A> {
    None,
    Some(A),
}
```

`None` 与 `Some` 最终都产生 `Option<A>`。GADT（generalized algebraic data type）放宽了这一点：不同构造器可以返回同一类型族的不同索引，并在模式匹配时带回类型等式。

它解决的核心问题不是“enum 能否多带字段”，而是：

> 程序走进某个分支后，编译器能否知道索引类型已经被这个构造器精化？

## 1. 一个 TypeScript 动机：表达式与返回类型

先看没有 GADT 保证的写法：

```ts
type Expr =
  | { tag: "int"; value: number }
  | { tag: "bool"; value: boolean }
  | { tag: "add"; left: Expr; right: Expr };

function evaluate(expr: Expr): number | boolean {
  // 返回类型丢失了“这个表达式会算出什么”的对应关系
  throw new Error("omitted");
}
```

我们希望类型 `Expr<A>` 的索引 `A` 表示求值结果：

```ts
type Expr<A> =
  | { tag: "int"; value: number }       // 只应是 Expr<number>
  | { tag: "bool"; value: boolean }     // 只应是 Expr<boolean>
  | { tag: "add"; left: Expr<number>; right: Expr<number> };
```

TypeScript 可以用条件类型、断言或构造 API 模拟部分体验，但教学上更清楚的 GADT 构造器签名是：

$$
\begin{aligned}
\mathrm{IntLit} & : \mathrm{Int}\to\mathrm{Expr}\ \mathrm{Int} \\
\mathrm{BoolLit} & : \mathrm{Bool}\to\mathrm{Expr}\ \mathrm{Bool} \\
\mathrm{Add} & :
  \mathrm{Expr}\ \mathrm{Int}
  \to \mathrm{Expr}\ \mathrm{Int}
  \to \mathrm{Expr}\ \mathrm{Int}
\end{aligned}
$$

关键在每行最后的结果类型不完全相同。

## 2. 普通 ADT 与 GADT 的差别

普通参数化树：

$$
\begin{aligned}
\mathrm{Leaf} &: A\to\mathrm{Tree}\ A \\
\mathrm{Node} &: \mathrm{Tree}\ A\to\mathrm{Tree}\ A\to\mathrm{Tree}\ A
\end{aligned}
$$

每个构造器都对任意 $A$ 返回 $\mathrm{Tree}\ A$。

GADT 构造器却可返回一个特定索引：

$$
\mathrm{IntLit}:\mathrm{Int}\to\mathrm{Expr}\ \mathrm{Int}
$$

若模式匹配的输入起初是 $\mathrm{Expr}\ A$，进入 `IntLit n` 分支意味着：

$$
A \sim \mathrm{Int}
$$

$\sim$ 在这里表示类型等式证据或待采用的局部等式，不是子类型符号 $<:$。

## 3. 求值器的类型

我们想写：

$$
\mathrm{eval}:\forall A.\mathrm{Expr}\ A\to A
$$

这个签名非常精确：输入索引是什么，返回类型就是什么。

伪代码：

```text
eval : forall A. Expr A -> A
eval expression =
  case expression of
    IntLit n    -> n
    BoolLit b   -> b
    Add left right -> eval left + eval right
```

逐个分支看：

- `IntLit n` 使 $A\sim\mathrm{Int}$，所以返回 $n:\mathrm{Int}$ 就是返回 $A$；
- `BoolLit b` 使 $A\sim\mathrm{Bool}$；
- `Add` 的两个子项都索引为 $\mathrm{Int}$，加法结果也为 $\mathrm{Int}$。

如果没有分支带来的局部类型精化，检查器只知道目标是抽象的 $A$，就无法接受具体的 `Int` 或 `Bool`。

## 4. 用等式类型把机制显式化

一个极小的类型相等证据可以写成：

$$
\mathrm{Refl}:\forall A.\mathrm{Eq}\ A\ A
$$

`Refl` 只能证明某个类型与自身相等。若我们拿到：

$$
p:\mathrm{Eq}\ A\ B
$$

并对 $p$ 做模式匹配，唯一构造器 `Refl` 会让分支内部把 $A$ 与 $B$ 当作同一类型。

这叫 equality elimination：消费等式证据，从而允许沿等式运输值。粗略规则可读作：

$$
\frac{
  \Gamma\vdash p:\mathrm{Eq}\ A\ B
  \qquad
  \Gamma, A\sim B\vdash e:C
}{
  \Gamma\vdash \mathbf{case}\ p\ \mathbf{of}\ \mathrm{Refl}\Rightarrow e:C
}
$$

真实 GADT 规则会更精确地处理类型变量作用域、构造器量词和分支结果类型；这里先抓住“匹配带来局部等式”。

## 5. 长度索引向量

用自然数索引列表长度：

$$
\begin{aligned}
\mathrm{Nil} &: \mathrm{Vec}\ A\ 0 \\
\mathrm{Cons} &: A\to\mathrm{Vec}\ A\ n\to\mathrm{Vec}\ A\ (n+1)
\end{aligned}
$$

这里：

- $A$ 是元素类型索引；
- $n$ 是长度索引；
- `Nil` 只能得到长度 $0$；
- `Cons` 把长度 $n$ 变为 $n+1$。

安全取头函数可要求非空：

$$
\mathrm{head}:\mathrm{Vec}\ A\ (n+1)\to A
$$

于是 `Nil` 根本不符合输入类型，函数只需处理 `Cons`。

这与 Rust 数组 `[T; N]` 的 const generic 有相似工程直觉，但完整 GADT/依赖类型系统能表达的索引和消去规则更一般。

## 6. 为什么 GADT 推断变困难

在普通 HM 中，模式匹配主要引入构造器参数的类型。GADT 分支还会产生局部等式，而且这些等式只能在分支作用域内使用。

考虑：

```text
fn x =>
  case x of
    IntLit n  => n + 1
    BoolLit b => not b
```

若没有函数签名，推断器必须猜：

- `x` 是不是 `Expr A`；
- 返回类型是否也依赖 $A$；
- 哪些未知类型可以被分支等式精化；
- 不同遍历顺序是否给出稳定结果。

GADT 程序通常不再享有经典 HM 那种简单、自动、主类型齐备的推断体验。实用设计往往要求程序员在关键函数或局部绑定处提供标注，再用双向检查让标注向内传播。

这不是 GADT “破坏编译器”，而是表达力增加后，程序员与推断器必须重新分担信息。

## 7. 刚性变量为什么重要

检查：

$$
\mathrm{eval}:\forall A.\mathrm{Expr}\ A\to A
$$

时，$A$ 应先被看作刚性变量：任意但固定，不能被全局合一成 `Int`。

进入 `IntLit` 分支后，我们获得局部等式：

$$
A\sim\mathrm{Int}
$$

这不等于在全局替换表里永久写下 $A:=\mathrm{Int}$。离开分支，另一个 `BoolLit` 分支仍可使用 $A\sim\mathrm{Bool}$。局部假设的作用域必须被保存。

## 8. 存在类型：隐藏一个类型

全称类型：

$$
\forall\alpha.A
$$

直觉是“使用者选择 $\alpha$，实现必须对所有选择工作”。

存在类型：

$$
\exists\alpha.A
$$

直觉是“生产者选择某个类型，但把具体选择隐藏起来；使用者只能依赖公开接口”。

例如一个隐藏状态类型的计数器包：

$$
\mathrm{Counter}
=
\exists S.
\{
  \mathrm{initial}:S,
  \mathrm{increment}:S\to S,
  \mathrm{read}:S\to\mathrm{Int}
\}
$$

生产者可以选 $S=\mathrm{Int}$，也可以选某个复杂 record。消费者知道“存在某个一致的 $S$”，却不能假定它就是 `Int`。

## 9. Pack 与 unpack

构造存在包：

$$
\mathrm{pack}\ [B,e]\ \mathrm{as}\ \exists\alpha.A
$$

意思是：

- 隐藏的实际类型选为 $B$；
- $e$ 必须具有 $A[B/\alpha]$；
- 对外只暴露 $\exists\alpha.A$。

使用时：

$$
\mathrm{unpack}\ [\alpha,x]=p\ \mathrm{in}\ e
$$

- 打开包 $p$；
- 引入一个新的、抽象的类型名 $\alpha$；
- 引入内容 $x:A$；
- 在 $e$ 内可以使用接口，但不能让隐藏类型逃出作用域。

一个典型规则带逃逸条件：

$$
\frac{
  \Gamma\vdash p:\exists\alpha.A
  \qquad
  \Gamma,\alpha,x:A\vdash e:C
  \qquad
  \alpha\notin\mathrm{ftv}(C)
}{
  \Gamma\vdash
  \mathrm{unpack}\ [\alpha,x]=p\ \mathrm{in}\ e
  :C
}
$$

最后一个条件表示结果类型 $C$ 不能泄露包内部选中的隐藏类型。

## 10. 存在类型与工程模块

下面的 TypeScript 接口只暴露操作，不暴露内部状态类型：

```ts
interface Counter {
  increment(): void;
  read(): number;
}
```

闭包把状态藏在运行时作用域里。存在类型提供更形式化的视角：客户端依赖的是一组操作之间共享某个隐藏表示，而不是表示本身。

Rust 的 trait object、`impl Trait`、模块私有类型与存在类型都有亲缘关系，但每种机制的对象安全、生命周期、动态派发或泛型语义不同，不能直接画等号。

## 11. GADT 构造器里的存在变量

某些构造器会携带一个结果类型中看不到的类型：

$$
\mathrm{PackShow}
:
\forall A.
\mathrm{Show}\ A
\to A
\to \mathrm{ShowBox}
$$

`ShowBox` 的结果不暴露 $A$。模式匹配时，分支得到“某个新鲜类型 $A$、它的 `Show` 能力以及一个 $A$ 值”，但不能假定 $A$ 的具体身份。

因此 GADT 阅读中常同时出现：

- 全称变量：调用构造器的人可以选择；
- 存在变量：构造器打包后对匹配者隐藏；
- 类型等式：结果索引与外层期望匹配时产生。

务必逐个标出变量由谁选择、在哪个作用域有效。

## 12. GADT 与依赖类型的距离

GADT 常被看成索引数据类型的一种实用形式。它能让类型参数反映有限的结构事实，但通常仍区分：

- 值层表达式；
- 类型层索引；
- 哪些值能提升到类型层。

完整依赖类型允许类型依赖一般的值，表达力与检查问题更广。长度索引向量既可以在 GADT 风格系统中编码，也可以在依赖类型系统中直接定义；不要仅凭例子就断言两套系统完全等同。

## 13. 阅读 GADT 规则的清单

看到构造器或模式规则时依次问：

1. 构造器有哪些全称变量？
2. 哪些变量没有出现在结果类型中，因而匹配后是存在的？
3. 构造器返回了哪个具体索引？
4. 模式匹配产生哪些局部类型等式？
5. 哪些类型变量是刚性的，哪些元变量可求解？
6. 等式能否逃出当前分支？
7. 哪些位置必须由程序员标注？

## 本章检查点

- 能说明普通 ADT 与 GADT 的差别在构造器结果类型。
- 能解释 `Expr A` 模式匹配为何会精化 $A$。
- 能区分局部分支等式与全局合一赋值。
- 能用“生产者选择并隐藏”解释存在类型。
- 能指出为什么 GADT 常与双向检查和显式标注配合。
