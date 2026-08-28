# 子类型与型变：为什么函数参数方向会反过来

HM 的核心求解围绕类型相等。TypeScript 的结构兼容、面向对象继承和许多 API 设计还需要一种有方向的关系：子类型。

## 1. 子类型表示安全替代

$$
A <: B
$$

读作“$A$ 是 $B$ 的子类型”。核心承诺：凡是只要求 $B$ 的位置，都能安全使用 $A$。

这常被称为 substitution principle。注意这里的 substitution 是“值的安全替代”，不是 HM 中的类型变量替换映射。

## 2. 结构子类型与名义子类型

TypeScript 主要比较结构：

```ts
type Point = { x: number; y: number };

const point3d = { x: 1, y: 2, z: 3 };
const point: Point = point3d;
```

`point3d` 至少提供 `Point` 要求的字段，因此可以使用。

名义系统则主要依赖声明关系、类型名字或显式实现。Rust struct 即使字段相同，通常也不是同一个类型；trait 实现关系承担另一类抽象角色。

结构/名义是兼容关系的设计维度，不等于静态/动态，也不等于强/弱类型。

## 3. 记录的宽度子类型

教学规则：字段更多的记录可以作为字段更少的记录使用。

$$
\{x:\mathrm{Int},y:\mathrm{Int},z:\mathrm{Int}\}
<:
\{x:\mathrm{Int},y:\mathrm{Int}\}
$$

原因是接收方只会读取 `x`、`y`，额外的 `z` 不妨碍使用。

这叫 width subtyping。还可以定义 depth subtyping，让字段类型本身按子类型关系变化，但可变字段会带来额外限制。

## 4. 顶类型与底类型

顶类型 $\top$ 可以接收所有类型：

$$
A<:\top
$$

TypeScript 的 `unknown` 提供相关直觉：所有值可赋给它，但不能未经缩小就随意操作。

底类型 $\bot$ 是所有类型的子类型：

$$
\bot<:A
$$

它没有正常返回的值。Rust `!` 和 TypeScript `never` 提供相关直觉。

工程语言中的 `any` 往往具有双向逃逸行为，不应简单当成普通 $\top$。

## 5. 联合类型像最小公共上界

TypeScript：

```ts
type Id = string | number;
```

可以把 `A | B` 看作同时容纳 $A$ 与 $B$ 的类型：

$$
A <: A\lor B
\qquad
B <: A\lor B
$$

使用联合值前，要缩小到具体分支或只执行所有分支都支持的操作。

在纯理论里，union type 的具体规则要看系统；TypeScript 的 union、控制流分析和赋值兼容包含大量工程扩展。

## 6. 交叉类型像同时满足两边

```ts
type Positioned = { x: number; y: number };
type Named = { name: string };
type NamedPoint = Positioned & Named;
```

直觉上：

$$
A\land B <: A
\qquad
A\land B <: B
$$

值同时满足两边要求。交叉类型与记录合并有关，但遇到冲突字段、函数重载和分配律时，真实语言语义会更复杂。

## 7. 函数子类型规则

最重要也最反直觉的规则：

$$
\frac{A_2<:A_1 \qquad B_1<:B_2}
     {A_1\to B_1 <: A_2\to B_2}
\;(\mathrm{S-Fun})
$$

参数方向反过来，返回值方向保持。

术语：

- 参数位置 contravariant（逆变）；
- 返回位置 covariant（协变）。

## 8. 为什么参数必须逆变

假设：

```text
Animal
  ↑
  Dog
```

即：

$$
\mathrm{Dog}<:\mathrm{Animal}
$$

位置需要：

```ts
(dog: Dog) => Animal
```

能否传入：

```ts
(animal: Animal) => Dog
```

可以。这个函数能处理任意 `Animal`，当然能处理 `Dog`；它返回 `Dog`，也当然是 `Animal`。

方向写成：

$$
(\mathrm{Animal}\to\mathrm{Dog})
<:
(\mathrm{Dog}\to\mathrm{Animal})
$$

这正是参数逆变、结果协变。

## 9. 错误方向会怎样

若一个位置可能传入任意 `Animal`，却接收只会处理 `Dog` 的函数：

```ts
const onlyDog = (dog: Dog) => dog.bark();
```

调用方若传来 `Cat`，函数会访问不存在的 `bark`。所以“输入更窄”的函数不能冒充“输入更宽”的函数。

## 10. 容器为什么会遇到型变问题

只读数组：

```ts
ReadonlyArray<Dog>
```

若只从中读取，把它当作 `ReadonlyArray<Animal>` 通常安全，因为读出的 `Dog` 也是 `Animal`。这体现协变。

可写数组若允许：

```text
Array<Dog> <: Array<Animal>
```

接收方就可能向其中写入 `Cat`，破坏原数组“只含 Dog”的承诺。

因此可变位置往往要求 invariant（不变），或使用更精细的读写权限规则。

## 11. 正位置与负位置

可以从整个类型表达式向内计算极性：

- 箭头返回值保持符号；
- 箭头参数翻转符号；
- 翻转两次又回到正方向。

例如：

$$
(A\to B)\to C
$$

相对整个类型：

- $C$ 在正位置；
- 外层参数 $A\to B$ 在负位置；
- 其中 $A$ 再翻转一次，回到正位置；
- 其中 $B$ 保持外层负位置。

这种极性分析会在双向类型、逻辑聚焦以及类型构造器型变检查中反复出现。

## 12. 包摄规则为什么不语法导向

$$
\frac{\Gamma\vdash e:A \qquad A<:B}
     {\Gamma\vdash e:B}
\;(\mathrm{Sub})
$$

它可以在推导任意位置使用。若直接作为算法规则，检查器必须猜何时提升类型，搜索空间和错误位置都会变差。

双向系统常把子类型检查集中在“综合转检查”的边界：

$$
\frac{\Gamma\vdash e\Rightarrow A \qquad A<:B}
     {\Gamma\vdash e\Leftarrow B}
$$

这样只有在已知实际类型与期望类型时才检查 $A<:B$。

## 13. 子类型与实例化关系不同

$$
\mathrm{Int}\to\mathrm{Int}
\preceq
\forall\alpha.\alpha\to\alpha
$$

这里左边是右边的一个多态实例。它不必等同于普通子类型关系。

在 higher-rank 系统中，论文可能把某种实例化关系编码为有方向的 declarative subtyping，但必须查看该论文的正式定义，不能只凭 $<:$ 名字推断。

## 14. TypeScript 的赋值兼容不等于纯子类型演算

TypeScript 文档明确指出，为兼容 JavaScript 的常见模式，系统允许一些无法静态证明安全的行为。函数参数双变、`any`、可选参数等机制会让实际 assignability 超出一套简单健全子类型演算。

学习理论规则的价值是建立一把标尺：看到工程语言偏离时，可以具体问“它在哪条规则上为可用性作了什么取舍”。

## 15. Rust 中的相关但不同机制

Rust 也有与子类型相关的生命周期关系和 coercion，但普通 struct/trait 抽象主要不是 TypeScript 式任意结构子类型。

`&'long T` 与 `&'short T` 的关系还受到生命周期、可变借用与型变影响。不要把 `Dog <: Animal` 的面向对象直觉直接套到所有 Rust 类型。

## 16. 实现子类型检查器的最小轮廓

```text
subtype(actual, expected):
  if actual == expected:
    succeed

  match (actual, expected):
    case (_, Top):
      succeed

    case (Bottom, _):
      succeed

    case (Function(a1, b1), Function(a2, b2)):
      subtype(a2, a1) // 参数逆变
      subtype(b1, b2) // 返回协变

    case (Record(fields1), Record(fields2)):
      require every field in fields2 exists compatibly in fields1

    otherwise:
      fail
```

真实实现还要处理递归类型、union/intersection、泛型、类型别名、错误路径与缓存。

## 本章检查点

1. 为什么字段更多的只读记录可作为字段更少的记录？
2. 为什么 `any` 不能简单当作普通顶类型？
3. 用“调用方会传什么”解释函数参数逆变。
4. 为什么只读容器容易协变，而可写容器常需要不变？
5. 双向系统把子类型检查放在哪个方向切换点？
