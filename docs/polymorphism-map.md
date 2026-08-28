# 多态地图：泛型、重载、子类型不要混成一团

“多态”字面上只是“多种形态”。不同语言机制让程序以完全不同的方式适用于多种类型。HM 讲的是其中一类，不是所有泛型与重载的总称。

## 1. 参数多态：程序不查看具体类型

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

理论类型：

$$
\forall\alpha.\alpha\to\alpha
$$

实现对 $\alpha$ 的结构一无所知，因此只能返回传入值、忽略它、保存它，不能无依据地调用某个只属于字符串的方法。

这类“统一地对所有类型工作”称为 parametric polymorphism（参数多态）。

## 2. 特设多态：不同类型选择不同实现

Rust trait：

```rust
fn render<T: Display>(value: T) -> String {
    value.to_string()
}
```

调用会依赖 `T` 对应的 `Display` 实现。运算对不同类型可能有不同行为。

函数重载、type class、trait、某些运算符重载都属于 ad-hoc polymorphism 的家族，但各语言的解析与一致性规则不同。

参数多态说“同一实现不关心类型”；特设多态说“根据类型找到合适实现”。

## 3. 子类型多态：更具体的值可用于更一般的位置

TypeScript 的结构类型：

```ts
type Named = { name: string };
const user = { name: 'Ada', id: 1 };

function greet(value: Named) {
  return `Hello ${value.name}`;
}

greet(user);
```

`user` 具有额外字段，但仍能用于只需要 `Named` 的位置。可用关系常写：

$$
\{\mathrm{name}:\mathrm{String},\mathrm{id}:\mathrm{Int}\}
<:
\{\mathrm{name}:\mathrm{String}\}
$$

这类能力依赖子类型或赋值兼容，而不是把函数变成 $\forall\alpha$ 的参数多态函数。

## 4. 三种多态放在一张表里

| 类别 | “多种类型”从哪里来 | 实现是否随类型变化 | 典型机制 |
| --- | --- | --- | --- |
| 参数多态 | 调用者实例化类型参数 | 通常统一 | HM、System F、泛型 |
| 特设多态 | 约束求解选择实现 | 会变化 | trait、type class、重载 |
| 子类型多态 | 安全替代关系 | 由接收方接口决定 | 继承、结构子类型 |

真实语言可以组合三者。Rust 泛型函数可以有 trait bound；TypeScript 泛型参数可以有结构约束。

## 5. System F：显式的类型抽象

System F 的恒等函数可以写成教学记法：

$$
\Lambda\alpha.\lambda x:\alpha.x
$$

其中：

- 大写 $\Lambda\alpha$：抽象一个类型参数；
- 小写 $\lambda x$：抽象一个值参数。

它的类型：

$$
\forall\alpha.\alpha\to\alpha
$$

使用时显式传类型：

$$
(\Lambda\alpha.\lambda x:\alpha.x)
\;[\mathrm{Int}]\;42
$$

先进行类型层 beta 归约，再进行值层 beta 归约，最终得到 `42`。

## 6. Church style 与 Curry style

### Church style

项里保留类型抽象、类型应用与参数标注。检查器看到程序员提供的类型结构。

### Curry style

项更接近无标注程序，类型信息由外部推导关系赋予。HM 常以这种“程序本身少写类型”的体验出现。

两种 presentation 研究的可判定性边界可能不同。论文说“System F type checking”时，要确认它检查的是显式类型项，还是要为省略类型信息的项做推断。

## 7. HM 与 System F 的关系

两者都能描述：

$$
\forall\alpha.\alpha\to\alpha
$$

差别主要在使用与推断纪律。

经典 HM：

- `let` 绑定处泛化；
- lambda 参数单态；
- 类型方案的 `forall` 在最外层；
- 能完整推断主类型。

System F：

- 类型抽象可以作为显式项结构；
- 全称类型能更自由地嵌套；
- 表达力更强；
- 省略所有类型信息后的完整推断不再具有 HM 的简单性质。

可以把 HM 看作选择了一个特别适合自动推断的多态片段，而不是“简写版所有 System F”。

## 8. Rank 到底在数什么

rank 粗略衡量全称量词出现在函数参数左侧的嵌套深度。

Rank-1：

$$
\forall\alpha.\alpha\to\alpha
$$

量词只在外层。

更高 rank：

$$
(\forall\alpha.\alpha\to\alpha)
\to
\mathrm{Int}
$$

函数接收一个本身必须多态的参数。

下面两个不要混淆：

$$
\forall\alpha.(\alpha\to\alpha)\to\mathrm{Int}
$$

$$
(\forall\alpha.\alpha\to\alpha)\to\mathrm{Int}
$$

第一式由整个函数的调用者选择一个 $\alpha$；第二式要求实参能对所有 $\alpha$ 工作。量词移动会改变“谁选择类型”。

## 9. Predicative 与 impredicative

实例化 $\forall\alpha.A$ 时，如果 $\alpha$ 只能替换成不含全称量词的单型，称为 predicative（直谓式）限制。

如果允许把一个多态类型本身传给 $\alpha$，则进入 impredicative（非直谓）实例化：

$$
\alpha
:=
\forall\beta.\beta\to\beta
$$

非直谓多态表达力强，但推断和实现更困难。看到“支持 higher-rank”不能自动推出“支持任意 impredicative inference”。

## 10. Parametricity 给出什么直觉

若一个总函数具有纯粹类型：

$$
\forall\alpha.\alpha\to\alpha
$$

且没有异常、反射、类型检查、未定义行为等逃逸，它几乎没有别的选择，只能返回输入。

仅从类型就能约束实现行为，这类推理常被称作 free theorem。类型不是完整规格，但多态类型能排除大量实现。

## 11. Rust 单态化与理论多态不是冲突

Rust 编译器常为具体泛型实例生成专门机器代码（monomorphization）。这属于实现策略。

源语言层仍可把函数理解为对任意满足约束的 `T` 工作。不要把：

- 类型系统如何描述程序；
- 编译器如何生成代码；

混成同一个问题。

## 12. TypeScript 泛型的现实扩展

TypeScript 还包含：

- 结构约束；
- union/intersection；
- conditional type；
- mapped type；
- 类型级字符串与模板操作；
- 有意保留的非健全兼容行为。

所以某段 TypeScript 泛型语法看起来像 $\forall$，并不意味着整套 TypeScript 类型系统就是 System F。理论核心是理解某种机制，真实语言是多个机制的组合。

## 13. 阅读多态论文的四个问题

看到 `forall` 时先问：

1. 量词可以出现在哪里？
2. 谁负责选择实例类型？
3. 实例类型能否本身多态？
4. 类型参数是显式的、推断的，还是由约束求解得到？

这四问通常比只记“支持泛型”更有区分度。

## 本章检查点

- 用一句话区分参数多态与 trait 重载。
- 说明为什么“有额外字段的对象可传入”不等于 `forall`。
- 比较量词在箭头外与箭头参数内部时，谁选择类型。
- 解释为什么 Rust 单态化不否定源语言的泛型抽象。
- 看到“高阶秩”时，为什么还要继续问是否允许非直谓实例化？
