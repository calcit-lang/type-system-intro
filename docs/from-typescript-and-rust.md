# 从 TypeScript 与 Rust 已知经验出发

你不需要先忘掉工程经验，再学习类型理论。相反，类型理论中的很多问题，你已经在 TypeScript 或 Rust 中见过，只是编译器没有把背后的名字告诉你。

这一章先建立一张“熟悉语法 → 理论问题”的对照表。它不是说两门语言严格实现了后文的小型演算，而是告诉你：抽象概念究竟在解释哪一类实际现象。

## 1. 你已经在使用类型判断

TypeScript：

```ts
const length: number = 3;
```

Rust：

```rust
let length: i32 = 3;
```

论文会把类似事实压缩成：

$$
\Gamma \vdash \mathrm{length} : \mathrm{Int}
$$

暂时只需要把它读成：

> 根据当前作用域中已经知道的信息，`length` 是整数。

这里的 $\Gamma$ 很像 IDE 在光标位置能够看到的变量表；$\vdash$ 表示“根据左边的信息，可以确认右边的结论”。

## 2. 类型推断不是“运行一下看看”

```ts
const answer = 40 + 2;
```

```rust
let answer = 40 + 2;
```

两门语言都能在没有显式结果标注时推断类型。但这通常不是先执行程序再观察结果，而是静态分析语法与运算规则。

最小化地说，加法规则可能要求：

$$
\frac{
  \Gamma\vdash e_1:\mathrm{Int}
  \qquad
  \Gamma\vdash e_2:\mathrm{Int}
}{
  \Gamma\vdash e_1+e_2:\mathrm{Int}
}
$$

真实 TypeScript 和 Rust 的数字、重载与 trait 规则更复杂；小公式的作用是隔离一个原则，而不是复刻整个编译器。

## 3. 泛型对应“同一份程序适用于多种类型”

TypeScript：

```ts
function identity<T>(value: T): T {
  return value;
}
```

Rust：

```rust
fn identity<T>(value: T) -> T {
    value
}
```

理论记法常写：

$$
\forall\alpha.\;\alpha\to\alpha
$$

$\forall\alpha$ 不是循环，而是一个承诺：调用者选择任意类型 $\alpha$，函数都保持“输入什么类型，就返回什么类型”的关系。

稍后会区分两件目前看起来很像的事：

- **类型变量**：代码或推断过程中的占位符；
- **全称量化**：声明程序对所有允许的类型都成立。

## 4. Rust trait 与 TypeScript 结构类型不是一回事

Rust：

```rust
fn show<T: Display>(value: T) -> String {
    format!("{value}")
}
```

这里的 `T: Display` 表示 `T` 必须提供某种能力。它接近受约束的参数多态或 ad-hoc polymorphism（特设多态）机制。

TypeScript：

```ts
type Named = { name: string };

function show(value: Named): string {
  return value.name;
}
```

TypeScript 主要按结构判断兼容：只要值具有所需形状，就可能被接受。Rust trait 则需要实现关系和一致性规则。

二者都能表达“不是所有类型都可以”，但其证据、解析方式与兼容关系不同。后文不会把它们粗暴归为同一种多态。

## 5. `unknown`、`any` 与动态类型边界

```ts
declare const input: unknown;

if (typeof input === 'string') {
  input.toUpperCase();
}
```

`unknown` 表示某个值可能来自任意类型，但使用者必须先缩小范围。它很像安全边界上的“我还不知道”。

```ts
declare const input: any;
input.notReallyThere().alsoNotThere;
```

`any` 会关闭许多检查。它不是普通意义上的顶类型，也不能仅用“所有值的集合”解释，因为它同时影响赋值和操作检查。

这提醒我们：工程语言中的类型可能承担多重任务，不能看见相似符号就直接套用某个纯理论模型。

## 6. Rust 的 `enum` 是代数数据类型的入口

```rust
enum Option<T> {
    None,
    Some(T),
}
```

它表示“没有值，或者有一个 `T`”：

$$
\mathrm{Option}(T) \cong 1 + T
$$

这里的 $+$ 不是数字加法，而是 sum type（和类型）：值来自左侧构造器或右侧构造器。$1$ 表示只有一个值的 unit 类型，对应 `None` 这一个选择。

TypeScript 的判别联合有相似用途：

```ts
type Result<T, E> =
  | { tag: 'ok'; value: T }
  | { tag: 'error'; error: E };
```

模式匹配或控制流缩小，本质上是在证明当前值属于和类型的哪一个分支。

## 7. Rust 借用检查不是 HM 的附赠功能

```rust
fn first<'a>(items: &'a [String]) -> &'a String {
    &items[0]
}
```

生命周期参数描述引用之间的有效期关系。它与泛型都使用参数语法，但解决的是资源与作用域问题，而不是经典 HM 的 rank-1 let 多态。

后续看到“HM 能完整推断”时，请自动补上范围：它针对一个受限制的纯函数核心，不包含 Rust 所有权、trait 求解、子类型强制转换等整套机制。

## 8. TypeScript 的实用性不以完全健全为唯一目标

TypeScript 为适配 JavaScript，明确允许一些无法在编译期保证安全的兼容行为。学习“健全性”时，不要把它误解成对语言好坏的单一评分。

更有用的问题是：

1. 这套系统声称保证什么？
2. 哪些边界允许逃逸？
3. 逃逸是显式的还是隐式的？
4. 理论模型证明的性质，是否覆盖真实语言的全部扩展？

Rust 在安全子集中追求更强的内存安全保证，但 `unsafe`、FFI 和编译器实现同样构成明确边界。

## 9. 一张工程经验到理论概念的地图

| 你见过的代码现象 | 后文对应概念 |
| --- | --- |
| IDE 自动得到局部变量类型 | 类型推断、约束生成 |
| 泛型函数 `<T>` | 参数多态、全称量化 |
| Rust trait bound | 受约束多态、特设多态 |
| TypeScript 对象按形状兼容 | 结构类型、子类型/赋值兼容 |
| `enum` / 判别联合 | 和类型、代数数据类型 |
| `match` 穷尽性检查 | 消去规则、覆盖检查 |
| `unknown` 后做 narrowing | 渐进类型、流敏感精化 |
| lambda 参数由调用位置确定 | 双向类型检查 |
| Rust 生命周期 | 仿射/线性资源纪律的工程亲属 |
| 编译器说 expected/found | 检查模式与综合模式的信息边界 |

## 10. 这门课会刻意简化什么

为了让每条公式能被手工运行，我们会逐层加能力：

1. 先只有变量、函数和应用；
2. 再加入基础类型；
3. 再加入 let 多态；
4. 再拆分综合与检查；
5. 最后才讨论子类型、效果、依赖类型等分支。

这与工程开发中先写最小复现相同：不是否认真实系统复杂，而是一次只改变一个变量。

## 本章检查点

读完后，尝试不用术语回答：

- 为什么 `identity` 的泛型参数不等于“一个以后会被永久填上的洞”？
- 为什么 TypeScript 结构兼容与 Rust trait 实现不是同一规则？
- 为什么学习 HM 时暂时不讨论 Rust 借用检查器？
- 为什么“语言不完全健全”不能直接推出“类型系统没有价值”？

如果回答不出来，可以继续往下读；这些问题会在后续章节反复回访。
