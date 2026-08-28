# 和、积与代数数据类型：从 `enum` 看见逻辑结构

函数类型不是类型系统的全部。TypeScript 的对象、tuple、判别联合，以及 Rust 的 struct、tuple、enum，都可以从几种简单的类型构造理解。

“代数数据类型”中的代数，指的是类型构造在“可取值数量”和组合结构上表现得像加法与乘法。

## 1. 积类型：同时拥有两份数据

Rust：

```rust
struct Point {
    x: f64,
    y: f64,
}
```

TypeScript：

```ts
type Point = {
  x: number;
  y: number;
};
```

理论上可写成：

$$
\mathrm{Point}
=
\mathrm{Number}\times\mathrm{Number}
$$

一个 `Point` 同时包含横坐标和纵坐标，因此称 product type（积类型）。

如果类型 $A$ 有 $m$ 个可能值，类型 $B$ 有 $n$ 个可能值，那么有限情况下 $A\times B$ 有：

$$
m\times n
$$

个组合。

例如 `Bool × Bool` 有四个值：

```text
(false, false)
(false, true)
(true, false)
(true, true)
```

## 2. 积类型的引入与消去

构造一对值：

$$
\frac{\Gamma\vdash e_1:A \qquad \Gamma\vdash e_2:B}
     {\Gamma\vdash(e_1,e_2):A\times B}
\;(\mathrm{Pair})
$$

这是引入规则：提供一个 $A$ 和一个 $B$，就得到 $A\times B$。

读取第一部分：

$$
\frac{\Gamma\vdash e:A\times B}
     {\Gamma\vdash\mathrm{fst}(e):A}
\;(\mathrm{Fst})
$$

读取第二部分同理得到 $B$。字段访问和 tuple 解构都是积类型的消去方式。

## 3. 和类型：在多个分支中选择一个

Rust：

```rust
enum Shape {
    Circle { radius: f64 },
    Rectangle { width: f64, height: f64 },
}
```

TypeScript：

```ts
type Shape =
  | { tag: 'circle'; radius: number }
  | { tag: 'rectangle'; width: number; height: number };
```

理论结构：

$$
\mathrm{Shape}
=
\mathrm{Number}
+
(\mathrm{Number}\times\mathrm{Number})
$$

$+$ 表示 sum type（和类型）：一个值要么来自左分支，要么来自右分支。

有限情况下，如果 $A$ 有 $m$ 个值，$B$ 有 $n$ 个值，$A+B$ 有：

$$
m+n
$$

个值。

## 4. 和类型的引入规则

把 $A$ 放进左分支：

$$
\frac{\Gamma\vdash e:A}
     {\Gamma\vdash\mathrm{inl}(e):A+B}
\;(\mathrm{Inl})
$$

把 $B$ 放进右分支：

$$
\frac{\Gamma\vdash e:B}
     {\Gamma\vdash\mathrm{inr}(e):A+B}
\;(\mathrm{Inr})
$$

`inl`、`inr` 是教学构造器名。真实 Rust 使用 `Some`、`None`、`Ok`、`Err` 等具有业务意义的名字；TypeScript 常用 `tag` 字段区分分支。

## 5. 模式匹配是和类型的消去规则

要从 $A+B$ 得到 $C$，必须分别说明：

- 若拿到 $A$，怎样得到 $C$；
- 若拿到 $B$，怎样得到 $C$。

规则：

$$
\frac{
  \Gamma\vdash e:A+B
  \qquad
  \Gamma,x:A\vdash e_1:C
  \qquad
  \Gamma,y:B\vdash e_2:C
}{
  \Gamma\vdash
  \mathrm{case}\;e\;\mathrm{of}\;
  \mathrm{inl}(x)\Rightarrow e_1\mid
  \mathrm{inr}(y)\Rightarrow e_2
  :C
}
\;(\mathrm{Case})
$$

这解释了两条编译器要求：

1. 分支必须覆盖所有构造器；
2. 分支结果要能汇合到预期类型。

## 6. `Option<T>` 为什么是 `1 + T`

Rust：

```rust
enum Option<T> {
    None,
    Some(T),
}
```

`None` 不携带数据，只有一个可能值。记 unit 类型为 $1$，则：

$$
\mathrm{Option}(T)=1+T
$$

TypeScript 的常见近似是 `T | undefined`，但要注意 JavaScript 的 `undefined` 还参与可选字段、缺省参数等其他语义；它并非永远与显式 `None` 构造器完全相同。

## 7. `Result<T,E>` 为什么是 `T + E`

$$
\mathrm{Result}(T,E)=T+E
$$

`Ok(T)` 与 `Err(E)` 清楚记录成功或失败。与抛异常相比，错误分支进入普通类型结构，调用者可以通过模式匹配处理。

但 `Result` 本身不等于一整套效果系统。它把某类失败编码成显式数据，无法自动描述任意 I/O、状态或控制效果。

## 8. Unit 与 Never：一个值和零个值

Unit 类型只有一个值：

$$
|1|=1
$$

Rust 中是 `()`。函数不需要返回有意义信息时，可以返回 unit。

空类型没有任何值：

$$
|0|=0
$$

Rust 的 `!` 与 TypeScript 的 `never` 提供相关工程直觉。若真的拥有一个空类型的值，就能通过不可能情况推出任意结果：

$$
\frac{\Gamma\vdash e:0}
     {\Gamma\vdash\mathrm{absurd}(e):A}
$$

问题在于正常、安全、终止的代码不应凭空构造出 $0$ 的值。

## 9. Curry–Howard 下的和与积

| 类型构造 | 逻辑对应 | 编程直觉 |
| --- | --- | --- |
| $A\times B$ | $A\land B$ | 同时有 A 与 B |
| $A+B$ | $A\lor B$ | A 或 B，且知道是哪边 |
| $1$ | 真 | 唯一的平凡证据 |
| $0$ | 假 | 没有构造方式 |
| $A\to B$ | $A\Rightarrow B$ | 用 A 构造 B |

这张表帮助理解规则结构，但不要把真实语言中带副作用、异常和非终止的所有程序直接当成纯证明。

## 10. 递归数据类型

链表可以定义为：

$$
\mathrm{List}(A)
=
1 + (A\times\mathrm{List}(A))
$$

读作：列表要么为空，要么包含一个头元素和另一条列表。

Rust：

```rust
enum List<T> {
    Nil,
    Cons(T, Box<List<T>>),
}
```

`Box` 是具体内存布局要求；递归类型等式表达的是结构。语言需要决定递归是 iso-recursive、equi-recursive，还是通过命名数据声明处理。

## 11. 穷尽性检查与不可达分支

对于：

```rust
match value {
    Some(x) => use_value(x),
    None => use_default(),
}
```

编译器知道 `Option<T>` 只有两个构造器，因此两个分支覆盖全集。

如果遗漏 `None`，类型检查之外还需要 coverage checking。很多论文把普通 typing judgment 与模式覆盖判断分开定义。

TypeScript 常用 `never` 做穷尽性提示：

```ts
function assertNever(value: never): never {
  throw new Error(`unexpected: ${value}`);
}
```

当所有联合分支都被排除后，剩余值应为 `never`。

## 12. 从 ADT 到 GADT

普通构造器通常返回同一个参数化类型，例如 `Some<T>: T -> Option<T>`。

GADT 允许不同构造器返回带不同类型索引的结果。匹配构造器时，检查器可获得新的类型等式。

直觉例子是类型安全表达式树：

```text
IntLiteral  : Int  -> Expr<Int>
BoolLiteral : Bool -> Expr<Bool>
Add         : Expr<Int> -> Expr<Int> -> Expr<Int>
If          : Expr<Bool> -> Expr<a> -> Expr<a> -> Expr<a>
```

求值器可以具有：

$$
\mathrm{eval}:\mathrm{Expr}(A)\to A
$$

返回类型由表达式树的索引决定。完整 GADT 检查会涉及局部类型等式、刚性变量和更复杂的推断边界。

## 13. 双向系统怎样处理构造器

引入形式通常适合检查：若已知期望是 `Option<Int>`，检查 `Some(1)` 时可把 `Int` 传给参数。

消去形式通常从被匹配值的类型开始综合，再在每个分支扩展上下文。这与 lambda/应用的双向分工属于同一设计原则。

## 本章检查点

1. 为什么对象或 tuple 被称为积类型？
2. 为什么 `Option<T>` 是 $1+T$，不是普通数字加法？
3. 为什么处理 $A+B$ 必须分别处理两侧？
4. `never` 在穷尽性检查中提供了什么证据？
5. GADT 比普通 ADT 多让构造器返回类型携带了什么信息？
