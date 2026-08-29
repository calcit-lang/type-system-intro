# 效果系统：函数除了返回值还可能做什么

下面两个 TypeScript 函数都有返回类型 `number`：

```ts
function pureLength(text: string): number {
  return text.length;
}

function nextId(): number {
  console.log("allocating id");
  return Math.random();
}
```

普通函数类型只描述输入与返回值：

$$
\mathrm{String}\to\mathrm{Number}
$$

却没有区分打印、随机性、状态、异常或异步。效果系统（effect system）把这类计算行为也放进静态判断。

## 0. 研究脉络：Effects 不是一条单线演化史

先给一个避免混淆的结论：研究文献里的 *effect* 至少有三条彼此交织、但问题不同的路线。

| 路线 | 主要问题 | 常见记法 | 本章对应位置 |
| --- | --- | --- | --- |
| type-and-effect | 编译前能否保守地知道程序会做什么？ | $\Gamma\vdash e:A\;!\;\varepsilon$ | §1–10、§17–20 |
| monadic semantics / monad | 怎样给带状态、异常、非确定性等计算一个统一的组合语义？ | $M\ A$、`bind` | §15 |
| algebraic operations and handlers | 怎样把“请求操作”与“在何处解释它”解耦？ | $op:P\rightsquigarrow R$、`handle` | §11–13 |

它们会互相借鉴，却不能相互替换。例如，`Promise<A>` 或 `M A` 可以编码某种计算；这并不自动给出一个能推断 effect row 的静态系统。反过来，语言也可以实现 handler，却暂时不保证所有操作都被静态处理。

### 0.1 一条适合阅读论文的时间线

| 时期 | 代表工作 | 新增的表达能力 | 对普通程序员最有用的理解 |
| --- | --- | --- | --- |
| 1986–1988 | Gifford、Lucassen，随后 Lucassen、Gifford 的多态效果系统 | 将 type、effect、region 作为不同 kind 的描述；把效果用于调度与并行分析 | 函数签名不只说“返回什么”，也可近似说“会碰到哪块状态” |
| 1989–1991 | Moggi 的 computational $\lambda$-calculus 与 monad | 把“值”和“计算”分开，为状态、异常、非确定性等给出统一语义接口 | `Promise`、`Result`、`State` 这类包装不是随意技巧；它们有共同的组合结构 |
| 1992 | Talpin、Jouvelot 的 type-and-effect discipline | 在隐式多态、region 和命令式构造共存时重建 principal type 与最小效果 | `let` 泛化必须看分配/状态，不能只看值类型 |
| 2002–2009 | Plotkin、Power；Plotkin、Pretnar | 把效果写成操作签名，并把 exception handler 推广为一般 handler | 程序发出 `Ask`，解释策略可以在外层按环境替换 |
| 2013–2014 | Eff、Koka 等 | 把用户定义 operation、handler、row-polymorphic effect 与推断放进可运行语言 | effect row 让高阶库不必把所有“其他效果”写死 |
| 近年的工程化 | OCaml 5、Koka、Effekt 等不同设计 | handler、并发、一次/多次 continuation、优化与实际 API 设计相遇 | “有 handler”不等于“有静态 effect safety”；实现选择仍会影响错误发生时机和性能 |

这张表不是“旧理论被新理论替代”的排行榜。研究常在不同目标之间取舍：并行调度关心 region；库抽象关心多态与 row；并发 runtime 关心 continuation 的表示和成本；API 设计关心用户是否能读懂签名。

### 0.2 三条路线怎样在公式上分开

**静态摘要**问“编译器证明了什么”。

$$
\Gamma\vdash e:A\;!\;\varepsilon
$$

这里的 $\varepsilon$ 是对运行行为的保守近似；它参与合一、泛化、子效果和健全性论证。

**monad**问“计算怎样组合”。最小接口可写成：

$$
\mathrm{return}:A\to M\ A
$$

$$
\mathrm{bind}:M\ A
\to
(A\to M\ B)
\to
M\ B
$$

它把“取得一个 $A$ 后继续做下一步计算”的控制流显式化。$M$ 是计算类型构造器；它不是本身就等于一个效果标签集合。

**代数操作与 handler**问“谁来解释请求”。

$$
\mathrm{Ask}:\mathrm{Key}\rightsquigarrow\mathrm{String}
$$

操作签名先规定请求和恢复结果；handler 再决定请求是读真实环境、读测试字典、记录日志，还是根本不恢复。把这三层分开，读论文时就不会把 `perform`、`M A` 和 $\varepsilon$ 当作同一件事。

## 1. Type 与 effect 是两个维度

一种判断式：

$$
\Gamma\vdash e:A\;!\;\varepsilon
$$

读作：

> 在环境 $\Gamma$ 下，表达式 $e$ 返回 $A$ 类型的值，并可能产生效果 $\varepsilon$。

符号分工：

- $A$：返回值的形状；
- $\varepsilon$：求值过程的行为摘要；
- 感叹号 $!$：这里是分隔符，不表示逻辑否定；
- $\varnothing$：空效果，表示该系统定义下的纯计算。

例如：

$$
\Gamma\vdash 1+2:\mathrm{Int}\;!\;\varnothing
$$

$$
\Gamma\vdash \mathrm{print}("hi"):
\mathbf 1\;!\;\{\mathrm{IO}\}
$$

## 2. 效果也可写在函数箭头上

另一种记法：

$$
A\xrightarrow{\varepsilon}B
$$

读作：“接收 $A$，调用时返回 $B$，并产生 $\varepsilon$。”

于是：

$$
\mathrm{String}
\xrightarrow{\varnothing}
\mathrm{Int}
$$

表示纯长度函数，而：

$$
\mathbf 1
\xrightarrow{\{\mathrm{Random},\mathrm{IO}\}}
\mathrm{Int}
$$

表示调用时可能使用随机性与 I/O。

要区分两个时刻：

- 创建 lambda 通常只是产生闭包，可能本身纯；
- 调用闭包时才发生箭头上记录的 latent effect（潜在效果）。

## 3. Lambda 规则：把主体效果藏进箭头

$$
\frac{
  \Gamma,x:A
  \vdash e:B\;!\;\varepsilon
}{
  \Gamma
  \vdash
  \lambda x.e:
  A\xrightarrow{\varepsilon}B
  \;!\;\varnothing
}
$$

从下方看：

- 构造 lambda 的当前效果是 $\varnothing$；
- 主体将来运行时可能产生 $\varepsilon$；
- 这份未来行为被记录在函数类型箭头上。

如果闭包创建本身要读取可变环境或执行初始化，规则会更复杂；最小演算先把 lambda 当作值。

## 4. 应用规则：组合三部分效果

$$
\frac{
  \Gamma\vdash e_1:
  A\xrightarrow{\varepsilon_f}B
  \;!\;\varepsilon_1
  \qquad
  \Gamma\vdash e_2:A\;!\;\varepsilon_2
}{
  \Gamma\vdash e_1\ e_2:B
  \;!\;
  (\varepsilon_1\cup
   \varepsilon_2\cup
   \varepsilon_f)
}
$$

应用一个函数可能依次发生：

1. 求值函数表达式 $e_1$ 的效果 $\varepsilon_1$；
2. 求值参数 $e_2$ 的效果 $\varepsilon_2$；
3. 执行函数主体的潜在效果 $\varepsilon_f$。

集合并 $\cup$ 是最简单的组合方式。若语言关心顺序、次数或区域，效果代数可能比集合更丰富。

## 5. Let 规则也要组合效果

$$
\frac{
  \Gamma\vdash e_1:A\;!\;\varepsilon_1
  \qquad
  \Gamma,x:A\vdash e_2:B\;!\;\varepsilon_2
}{
  \Gamma\vdash
  \mathbf{let}\ x=e_1\ \mathbf{in}\ e_2
  :B\;!\;
  (\varepsilon_1\cup\varepsilon_2)
}
$$

这条规则说明类型推断不能只返回类型。算法可能返回：

```ts
type InferResult = {
  type: Type;
  effect: Effect;
  substitution: Substitution;
};
```

HM 的替换、泛化和合一仍可存在，但现在还要解效果变量与效果约束。

## 6. Subeffecting：少做可以当作多做

如果：

$$
\varepsilon_1\subseteq\varepsilon_2
$$

则一段只产生 $\varepsilon_1$ 的计算，可以用于允许 $\varepsilon_2$ 的位置：

$$
\frac{
  \Gamma\vdash e:A\;!\;\varepsilon_1
  \qquad
  \varepsilon_1\subseteq\varepsilon_2
}{
  \Gamma\vdash e:A\;!\;\varepsilon_2
}
$$

纯函数：

$$
\varnothing
\subseteq
\{\mathrm{IO}\}
$$

因此纯回调可传给“最多允许 I/O”的接口。反方向不安全：要求纯计算的位置不能接收可能打印或写状态的函数。

这和子类型的方向很像，但比较的是效果描述。

## 7. 异常效果

抛出：

$$
\Gamma\vdash
\mathrm{raise}\ e:
A\;!\;
(\varepsilon\cup\{\mathrm{Throw}\ E\})
$$

返回类型可以是任意 $A$，因为正常路径不会返回。

捕获异常会消除或变换部分效果：

$$
\frac{
  \Gamma\vdash e:A
  \;!\;
  (\varepsilon\cup\{\mathrm{Throw}\ E\})
  \qquad
  \Gamma,x:E\vdash h:A\;!\;\varepsilon_h
}{
  \Gamma\vdash
  \mathbf{try}\ e\ \mathbf{catch}\ x\Rightarrow h
  :A
  \;!\;
  (\varepsilon\cup\varepsilon_h)
}
$$

处理器覆盖 `Throw E` 后，该效果不再向外逃逸；但主体和处理分支的其他效果仍保留。

真实语言还要考虑捕获哪些异常、finally、取消和异步边界。

## 8. 状态效果与 region

粗粒度写法：

$$
\{\mathrm{State}\}
$$

更精确的效果可以指出访问哪个区域：

$$
\{\mathrm{Read}\ \rho,
  \mathrm{Write}\ \rho\}
$$

$\rho$ 是 region 变量。两个计算若只写不同 region，编译器可能证明它们可以安全重排或并行。

例如：

$$
e_1:A\;!\;\{\mathrm{Write}\ \rho_1\}
$$

$$
e_2:B\;!\;\{\mathrm{Write}\ \rho_2\}
$$

若：

$$
\rho_1\ne\rho_2
$$

则它们不会写同一静态区域。但别名、动态分配和区域逃逸会让分析更复杂。

## 9. 效果多态：高阶函数不应夸大效果

考虑 `map`。如果回调纯，`map` 应纯；如果回调打印，`map` 应带打印效果。

$$
\mathrm{map}:
\forall A,B,\varepsilon.
(A\xrightarrow{\varepsilon}B)
\to
\mathrm{List}\ A
\xrightarrow{\varepsilon}
\mathrm{List}\ B
$$

$\varepsilon$ 是效果变量。

它表达：

- `map` 自己不额外引入某个固定效果；
- 输出计算的效果由回调决定；
- 同一实现对不同效果实例工作。

这叫 effect polymorphism。它与类型参数多态相似，但量化对象是效果描述。

## 10. Effect row：保留“还有其他效果”

效果行可以写：

$$
\{\mathrm{IO},\mathrm{Throw}\ E\mid\varepsilon\}
$$

竖线后的 $\varepsilon$ 表示开放尾部：“至少有 IO 和 Throw E，还可能有别的效果。”

处理掉 Throw：

$$
\{\mathrm{IO},\mathrm{Throw}\ E\mid\varepsilon\}
\longrightarrow
\{\mathrm{IO}\mid\varepsilon\}
$$

开放 row 使处理器和高阶函数不用枚举所有无关效果。

实现会面临：

- 标签顺序是否重要；
- 重复标签是否允许；
- row variable 怎样合一；
- effect masking 是否健全；
- 处理器如何只移除自己负责的标签。

## 11. Algebraic effect：把效果看作操作

定义一个读取配置的操作：

$$
\mathrm{ask}:
\mathrm{Key}\rightsquigarrow\mathrm{String}
$$

$\rightsquigarrow$ 在这里表示效果操作签名：调用者提交 `Key`，恢复时得到 `String`。

程序可以写：

```text
let host = perform Ask("host")
connect(host)
```

`perform` 不直接决定怎样取得配置；它把请求交给外层 handler。

## 12. Handler 同时解释结果与操作

教学化 handler：

```text
handle program with
  return x      -> x
  Ask(key, resume) ->
    resume(localConfig[key])
```

两类分支：

- `return x`：程序正常结束；
- `Ask(key, resume)`：截获操作，并决定是否、何时、用什么值继续。

`resume` 表示被挂起的其余计算，常称 continuation。

处理器可以：

- 恢复一次：普通依赖注入；
- 不恢复：异常/提前退出；
- 恢复多次：非确定性搜索；
- 延迟恢复：协程或调度。

具体 algebraic effect 系统会限制 continuation 的使用次数、作用域与类型，不能从这个伪代码推断所有实现都允许任意多次恢复。

## 13. 一个 handler 的类型直觉

假设计算：

$$
e:A\;!\;\{\mathrm{Ask}\mid\varepsilon\}
$$

处理 Ask 后：

$$
\mathrm{handleAsk}(e):
A\;!\;\varepsilon
$$

handler 消除了自己解释的效果，并把未知尾部 $\varepsilon$ 原样转发。

若 handler 把返回值从 $A$ 转换为 $B$，更一般地：

$$
\mathrm{Handler}
\bigl(
  A\;!\;\{\mathrm{Ask}\mid\varepsilon\},
  B\;!\;\varepsilon
\bigr)
$$

真实规则需要给每个操作分支中的参数、continuation 和最终结果精确赋型。

## 14. `Result`、`Promise` 是效果系统吗

`Result<A,E>` 把失败编码成普通和类型：

```rust
fn parse(input: &str) -> Result<i32, ParseError>
```

`Promise<A>` 把异步结果包装成值：

```ts
function load(): Promise<User>
```

它们让行为出现在普通类型中，确实能达到一部分效果追踪目标。但一般效果系统还提供：

- 独立的 effect judgment；
- 组合与 subeffecting；
- 效果多态；
- handler 消除；
- 对控制效果或区域的统一规则。

所以“显式数据编码效果”与“专门的效果系统”有关联，但不是同义词。

## 15. Monad 与效果系统的关系

Monad 常把计算写成类型构造器：

$$
M\ A
$$

例如状态计算：

$$
\mathrm{State}\ S\ A
$$

效果系统可能写：

$$
A\;!\;\{\mathrm{State}\ S\}
$$

两者都能组织效果，但视角不同：

- monad：把效果计算编码成一种值/类型构造；
- effect system：给表达式附静态行为摘要；
- algebraic handler：为一组操作提供局部解释。

语言可以同时使用它们。不要把 “effect”、 “monad”、 “algebraic effect” 当作同一个词的不同拼写。

## 16. Rust 与 TypeScript 的工程对照

Rust 的普通函数类型没有通用 effect row，但很多效果进入显式 API：

- `Result<T,E>`：可恢复失败；
- `Future<Output=T>`：异步计算；
- `&mut T`：独占状态访问；
- `unsafe fn`：调用方要满足额外安全契约；
- panic 与分配通常不完整出现在函数类型中。

TypeScript：

- `Promise<T>` 显式异步返回；
- `throws` 不进入静态函数类型；
- I/O、DOM 修改和全局状态通常不出现在类型里；
- 库可通过 `Result`、schema 或 capability object 人工显式化。

这说明现实语言会把一些效果编码进类型，另一些留给文档、lint、运行时或独立分析。

## 17. HM、可变引用与值限制

天真的 let 泛化与可变引用组合可能不健全。直觉例子：

```text
let cell = ref (fn x => x)
cell := (fn n => n + 1)
(!cell) true
```

如果 `cell` 被错误泛化成可在每次使用时选择不同类型的引用，就可能先写入 `Int -> Int`，再按 `Bool -> Bool` 读出。

ML 家族常用 value restriction：只在满足某种“非扩张值”条件时泛化。效果系统提供另一种观察角度：若绑定表达式具有分配/状态效果，就不应按纯值那样自由泛化。

具体语言的值限制规则不同，不能仅用“有空效果就一定泛化”概括全部细节。

## 18. 效果健全性说什么

类型健全性常说良类型程序不会进入某类错误状态。效果健全性则希望静态效果是运行行为的保守近似：

若：

$$
\Gamma\vdash e:A\;!\;\varepsilon
$$

且运行 $e$ 实际执行操作 $op$，则应有：

$$
op\in\varepsilon
$$

或在系统定义的闭包/子效果关系中被 $\varepsilon$ 覆盖。

静态摘要可以多报：

$$
\mathrm{actual}(e)
\subseteq
\varepsilon
$$

但不能漏掉需要保证的实际效果。精确性影响优化和可用性，健全性决定承诺是否可信。

## 19. 效果推断与双向检查

一个算法判断可返回类型、效果和更新后的约束状态：

$$
\Gamma
\vdash e
\Rightarrow
A\;!\;\varepsilon
\dashv\Theta
$$

检查模式：

$$
\Gamma
\vdash e
\Leftarrow
A\;!\;\varepsilon
\dashv\Theta
$$

其中 $\Theta$ 可以保存：

- 类型元变量；
- 效果 row 元变量；
- 子效果约束；
- region 约束；
- 作用域标记。

这再次说明“双向”是信息流骨架，不是只能处理简单无效果 lambda 演算的算法。

### 19.1 从 HM 的类型方案扩展到 type-and-effect 方案

在普通 HM 中，`let` 绑定常得到：

$$
\sigma=\forall\overline{\alpha}.A
$$

其中 $\overline{\alpha}$ 是被泛化的类型变量。加入效果变量后，一个教学化方案可以写成：

$$
\sigma=\forall\overline{\alpha},\overline{\varepsilon}.
A\;!\;\varepsilon
$$

这里：

- $\overline{\alpha}$：类型变量，例如 `map` 的元素类型；
- $\overline{\varepsilon}$：效果或 effect-row 变量；
- $A\;!\;\varepsilon$：这个表达式的值形状和行为摘要一起被量化。

因此 `map` 的“回调是什么效果，结果就是什么效果”不是额外的口头约定，而是量化变量在签名中出现：

$$
\mathrm{map}:
\forall A,B,\varepsilon.
(A\xrightarrow{\varepsilon}B)
\to
\mathrm{List}\ A
\xrightarrow{\varepsilon}
\mathrm{List}\ B
$$

算法层仍像 Algorithm W 一样做三件事：实例化、生成约束、求解/合一；只是约束不再只有 $A\doteq B$，还会出现 effect row、region 或子效果约束。不同论文对“效果变量何时可泛化”有不同精确定义；遇到状态和分配时，必须同时检查 value restriction、region escape 或 effect masking 的前提，不能机械照搬 `generalize`。

### 19.2 双向检查把“效果信息从哪里来”写清楚

双向系统特别适合把标注边界和效果边界放在同一个公式里。设函数箭头带有潜在效果：

$$
A\xrightarrow{\varepsilon}B
$$

若外层已经期待这个函数类型，lambda 可以在检查模式获得参数类型和主体效果目标：

$$
\frac{
  \Gamma,x:A\vdash e\Leftarrow B\;!\;\varepsilon
}{
  \Gamma\vdash
  \lambda x.e
  \Leftarrow
  A\xrightarrow{\varepsilon}B
  \;!\;\varnothing
}
$$

逐项读：

- 前提中的 $A$ 不是从未标注 `x` 猜出来，而是由期望箭头给出；
- 前提中的 $\varepsilon$ 是函数被调用时允许主体产生的效果；
- 结论的 $\varnothing$ 仍只说“此刻造出 lambda 值”是纯的；它没有抹去箭头上的 latent effect。

综合模式则很适合变量、已标注表达式和应用：

$$
\frac{
  \Gamma\vdash e_1
  \Rightarrow
  A\xrightarrow{\varepsilon_f}B
  \;!\;\varepsilon_1
  \qquad
  \Gamma\vdash e_2
  \Leftarrow
  A
  \;!\;\varepsilon_2
}{
  \Gamma\vdash e_1\ e_2
  \Rightarrow
  B
  \;!\;
  (\varepsilon_1\cup\varepsilon_2\cup\varepsilon_f)
}
$$

这条规则与 §4 的应用规则相同的核心事实是：效果随求值顺序流动；双向化只是明确哪一部分由已知签名提供，哪一部分由子表达式综合出来。若系统允许 subeffecting，检查阶段还会有一个从实际效果到允许效果的桥：

$$
\frac{
  \Gamma\vdash e\Rightarrow A\;!\;\varepsilon
  \qquad
  \varepsilon\subseteq\varepsilon_{\mathrm{allow}}
}{
  \Gamma\vdash e\Leftarrow A\;!\;\varepsilon_{\mathrm{allow}}
}
$$

它的方向非常重要：一个实际纯的实现可满足“允许 I/O”的接口；一个实际会写状态的实现不能借由这条规则伪装成纯函数。

## 20. 什么时候效果值得进入类型

适合静态追踪的效果通常满足：

- 会改变 API 能否安全组合；
- 会影响并行、缓存、事务或重试；
- 需要确保被处理；
- 错过它的代价高；
- 能用可理解的摘要表达。

不一定要追踪所有行为。若效果标签过细，类型会变得嘈杂、推断约束膨胀、库接口难以稳定。

效果系统的设计问题不是“能记录多少”，而是“哪些行为值得成为可组合的静态契约”。

## 21. 阅读效果论文的清单

1. judgment 如何同时写 type 与 effect？
2. 效果是集合、row、序列、代数还是 capability？
3. 函数的潜在效果放在哪里？
4. 应用和 let 如何组合效果？
5. 是否有 subeffecting 与效果多态？
6. handler 怎样消除或转发效果？
7. continuation 能使用几次？
8. 状态、异常、异步与并发分别怎样建模？
9. 论文证明 effect soundness、type safety 还是二者？

## 本章检查点

- 能逐项解释 $\Gamma\vdash e:A\;!\;\varepsilon$。
- 能说明 lambda 创建的当前效果与函数箭头上的潜在效果。
- 能从应用规则解释效果集合为何需要合并。
- 能用 `map` 说明效果多态的动机。
- 能区分显式 `Result`、monad、效果系统与 algebraic handler。
- 能解释状态效果为何会影响 HM 泛化和 value restriction。
