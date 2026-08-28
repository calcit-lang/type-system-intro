# 线性与仿射类型：把“值能用几次”写进规则

普通类型规则关心一个值是什么：

$$
x:\mathrm{File}
$$

线性/仿射类型还关心它被使用几次：

- 线性：恰好一次；
- 仿射：至多一次；
- 非线性：可重复使用，也可不用。

Rust 所有权提供了很好的工程入口，但不能简单写成“Rust 就是线性类型”。本章会先解释最小规则，再逐项对照 move、borrow、`Copy` 和析构。

## 1. 为什么普通上下文会悄悄复制变量

STLC 的函数应用规则：

$$
\frac{
  \Gamma\vdash e_1:A\to B
  \qquad
  \Gamma\vdash e_2:A
}{
  \Gamma\vdash e_1\ e_2:B
}
$$

同一个 $\Gamma$ 同时出现在两个前提中。若 $x:A\in\Gamma$，两边的推导都可能使用 $x$。从资源角度看，这条规则隐含允许复制上下文。

变量也可以完全不出现在表达式里：

$$
\Gamma,x:A\vdash 42:\mathrm{Int}
$$

这隐含允许丢弃 $x$。

逻辑中对应两条结构规则：

### Weakening：允许不用

$$
\frac{
  \Gamma\vdash e:B
}{
  \Gamma,x:A\vdash e:B
}
$$

### Contraction：允许重复

$$
\frac{
  \Gamma,x:A,y:A\vdash e:B
}{
  \Gamma,z:A\vdash e[z/x,z/y]:B
}
$$

普通程序变量通常默认支持 weakening 和 contraction。线性逻辑的关键变化是：它们不再对所有假设无条件成立。

## 2. 线性上下文必须被消费

把判断写成：

$$
\Gamma;\Delta\vdash e:A
$$

- $\Gamma$：非线性上下文，可以复制或丢弃；
- $\Delta$：线性上下文，每项必须恰好使用一次；
- 分号把两种使用纪律分开。

变量规则：

$$
\frac{}{
  \Gamma;x:A\vdash x:A
}
$$

线性上下文里只有 $x:A$，表达式正好消费一次 $x$。

下面通常不合法：

$$
\Gamma;x:A\nvdash (x,x):A\otimes A
$$

因为 $x$ 被复制。

也不合法：

$$
\Gamma;x:A\nvdash 42:\mathrm{Int}
$$

因为 $x$ 被丢弃。

## 3. 线性函数箭头

线性函数类型常写：

$$
A\multimap B
$$

读作“消费一个 $A$，产生一个 $B$”。

引入规则：

$$
\frac{
  \Gamma;\Delta,x:A\vdash e:B
}{
  \Gamma;\Delta\vdash
  \lambda x.e:A\multimap B
}
$$

主体必须按线性纪律使用 $x$。

应用规则最关键：

$$
\frac{
  \Gamma;\Delta_1\vdash f:A\multimap B
  \qquad
  \Gamma;\Delta_2\vdash a:A
}{
  \Gamma;\Delta_1,\Delta_2
  \vdash f\ a:B
}
$$

不是把同一个 $\Delta$ 复制到两个前提，而是把资源上下文分成互不重叠的 $\Delta_1$ 与 $\Delta_2$。

实现时，这个“split”可能是搜索问题；算法系统更常让每个子表达式输入并输出剩余资源，避免枚举所有分割。

## 4. 线性 pair 不是普通 pair

乘法积写作：

$$
A\otimes B
$$

构造规则：

$$
\frac{
  \Gamma;\Delta_1\vdash e_1:A
  \qquad
  \Gamma;\Delta_2\vdash e_2:B
}{
  \Gamma;\Delta_1,\Delta_2
  \vdash
  (e_1,e_2):A\otimes B
}
$$

两部分消费不同资源。

解构规则：

$$
\frac{
  \Gamma;\Delta_1\vdash p:A\otimes B
  \qquad
  \Gamma;\Delta_2,x:A,y:B\vdash e:C
}{
  \Gamma;\Delta_1,\Delta_2
  \vdash
  \mathbf{let}\ (x,y)=p\ \mathbf{in}\ e:C
}
$$

打开 pair 后，$x$、$y$ 都必须按纪律消费。

## 5. 仿射类型放宽“必须使用”

仿射系统允许 weakening，但不允许 contraction：

- 值可以不用；
- 值不能重复使用。

因此：

$$
x:A\vdash 42:\mathrm{Int}
$$

可以成立，但：

$$
x:A\nvdash(x,x):A\otimes A
$$

仍不成立。

这与许多所有权语言的直觉更接近：离开作用域时资源可以被自动析构，所以不是“每个值都必须由源码显式使用一次”；但已经 move 的非复制值不能再次使用。

## 6. Rust move 的对应直觉

```rust
fn consume(text: String) {
    println!("{text}");
}

fn main() {
    let value = String::from("hello");
    consume(value);
    // println!("{value}"); // 已 move
}
```

`String` 不是 `Copy`。把它按值传入 `consume` 后，旧绑定不能再用。

可把这一段粗略读成：

$$
\mathrm{consume}:
\mathrm{String}
\multimap
\mathbf{1}
$$

$\mathbf 1$ 是 unit 类型。函数取得所有权并最终消费资源。

但 Rust 允许函数提前返回、panic、让值在作用域末尾自动 drop，所以更接近带析构语义的仿射纪律，而不是“源码中每个值文本上恰好出现一次”。

## 7. `Copy` 表示受控复制能力

```rust
let x: i32 = 1;
let y = x;
println!("{x} {y}");
```

`i32: Copy`，赋值不会让旧绑定失效。在线性逻辑记法中，可复制资源常通过指数模态：

$$
!A
$$

读作“of course A”：这个 $A$ 被允许复制和丢弃。

典型规则允许从 $!A$ 得到 $A$，也允许对 $!A$ 做 contraction/weakening。

不要直接宣称 Rust `Copy<T>` 就是逻辑里的 $!A$：

- `Copy` 是语言 trait，并受数据布局与析构规则约束；
- $!$ 是理论中的模态，规则依演算而异；
- Rust 还有借用、生命周期和内部可变性。

它们共同表达“复制必须有依据”，但不是同一个构造。

## 8. Borrow：暂时使用而不取得所有权

```rust
fn length(text: &String) -> usize {
    text.len()
}

let value = String::from("hello");
let n = length(&value);
println!("{value} has {n} bytes");
```

`&value` 创建共享借用。函数可以观察 `String`，但不能取得并销毁它；调用后所有者仍可使用。

可变借用：

```rust
fn append_mark(text: &mut String) {
    text.push('!');
}
```

Rust 的核心别名纪律常概括为：

- 任意多个共享借用；
- 或一个独占可变借用；
- 两者不能在重叠生命周期同时存在。

线性/仿射“使用次数”提供基础资源直觉，borrow checker 进一步跟踪引用关系、生命周期、重借用与 place。完整 Rust 所有权不能只靠一个 $A\multimap B$ 规则描述。

## 9. 生命周期是关系，不只是计数

若：

```rust
fn choose<'a>(left: &'a str, right: &'a str) -> &'a str
```

生命周期参数说明返回借用不能活得比相关输入更久。这里要追踪：

- 引用指向哪个 place；
- 允许访问到何时；
- 共享还是独占；
- move 是否让原 place 不再初始化。

线性逻辑回答“资源是否复制/丢弃”；借用系统还回答“谁暂时拥有访问权限”。二者有关联，但问题维度不同。

## 10. 会话类型：把协议也当作线性资源

一个网络通道不能随意重复走同一步协议。会话类型可以写：

$$
\mathrm{Send}\ \mathrm{Request}.
\mathrm{Recv}\ \mathrm{Response}.
\mathrm{End}
$$

发送后，通道类型变化为：

$$
\mathrm{Recv}\ \mathrm{Response}.
\mathrm{End}
$$

如果旧通道仍能被复制使用，就可能重复发送或违反协议。线性使用保证每一步消费旧状态并产生新状态。

伪代码：

```text
send :
  Request
  -> Channel (Send Request next)
  -o Channel next
```

`-o` 对应 $\multimap$。通道的类型索引表达协议状态，线性箭头保证状态转换不会分叉。

## 11. 文件句柄与 typestate

文件 API 可以表达：

$$
\mathrm{open}:
\mathrm{Path}
\to
\mathrm{File}\ \mathrm{Open}
$$

$$
\mathrm{close}:
\mathrm{File}\ \mathrm{Open}
\multimap
\mathrm{File}\ \mathrm{Closed}
$$

若 `close` 消费打开句柄，就不能再从旧值读取：

$$
\mathrm{read}:
\mathrm{File}\ \mathrm{Open}
\multimap
(\mathrm{Bytes}\otimes\mathrm{File}\ \mathrm{Open})
$$

读取后还要返回更新后的句柄，因为线性输入已经被消费。真实语言可能把状态更新藏在独占借用里，使 API 更符合工程习惯。

## 12. 为何资源类型能支持原地更新

若编译器知道某数组引用是唯一的，就没有其他别名能观察中间状态。于是函数式接口：

$$
\mathrm{update}:
\mathrm{Array}
\multimap
\mathrm{Index}
\to
\mathrm{Value}
\to
\mathrm{Array}
$$

可以安全实现成原地更新，并把同一块存储作为“新数组”返回。

线性类型不是自动优化保证，但提供了别名/所有权信息，使原地更新、无引用计数资源和确定性释放变得可证明。

## 13. 与垃圾回收不是二选一

常见误解：

> 有线性类型就完全不需要垃圾回收。

实际系统可以同时有：

- 线性资源：文件、通道、独占缓冲区；
- 普通共享值：不可变树、闭包、字符串；
- 区域或引用计数；
- 受控复制模态 $!A$。

类型系统决定哪些值遵守哪种纪律，运行时管理策略可以按类别组合。

## 14. 算法检查：输入资源与剩余资源

声明式规则用 $\Delta_1,\Delta_2$ 分割上下文，算法不想猜所有分法。可设计判断：

$$
\Gamma;\Delta
\vdash e\Rightarrow A
\dashv\Delta'
$$

读作：

> 输入可用线性资源 $\Delta$，综合 $e$ 的类型 $A$，输出尚未消费的 $\Delta'$。

变量：

$$
\Gamma;\Delta,x:A
\vdash x\Rightarrow A
\dashv\Delta
$$

应用先检查函数，再把剩余资源交给参数：

$$
\frac{
  \Gamma;\Delta_0
  \vdash e_1\Rightarrow A\multimap B
  \dashv\Delta_1
  \qquad
  \Gamma;\Delta_1
  \vdash e_2\Leftarrow A
  \dashv\Delta_2
}{
  \Gamma;\Delta_0
  \vdash e_1\ e_2\Rightarrow B
  \dashv\Delta_2
}
$$

这再次显示双向检查的价值：类型信息和资源状态都沿语法顺序流动。

## 15. 分支必须怎样合并资源

```text
if condition then
  consume resource
else
  keep resource
```

两条分支结束后的资源状态不同。若后续代码继续使用 `resource`，系统必须拒绝或要求统一处理。

教学化规则会要求两个分支产生相同剩余上下文：

$$
\frac{
  \Gamma;\Delta\vdash c:\mathrm{Bool}
  \qquad
  \Gamma;\Delta\vdash e_1:A\dashv\Delta'
  \qquad
  \Gamma;\Delta\vdash e_2:A\dashv\Delta'
}{
  \Gamma;\Delta
  \vdash
  \mathbf{if}\ c\ \mathbf{then}\ e_1\ \mathbf{else}\ e_2
  :A\dashv\Delta'
}
$$

真实 borrow checker 还会计算控制流汇合点上的初始化、借用与 drop 状态。

## 16. Closure 捕获为什么复杂

闭包可能：

- 只读借用捕获变量；
- 可变借用捕获变量；
- move 捕获所有权；
- 被调用一次、可变调用多次或共享调用多次。

Rust 的 `FnOnce`、`FnMut`、`Fn` 大致反映闭包对捕获环境的使用能力。

若闭包消费一个线性捕获，它自己也不能无条件重复调用。类型系统必须把环境的资源纪律反映到闭包类型，而不只是给函数代码一个普通 $A\to B$。

## 17. 与效果系统的边界

资源类型追踪“某个值怎样被使用”；效果系统追踪“某段计算可能做什么”。

打开文件：

$$
\mathrm{open}:
\mathrm{Path}
\to^{\{\mathrm{IO}\}}
\mathrm{File}
$$

可同时有：

- `IO` 效果：执行了外部操作；
- 线性 `File`：句柄不能重复关闭或在 move 后再用。

两者可以组合，不能互相替代。

## 18. 阅读资源类型论文的清单

1. 系统是 linear（恰好一次）还是 affine（至多一次）？
2. weakening、contraction 对哪些类型开放？
3. 是否有 $!A$、借用、region 或 uniqueness 类型？
4. 函数应用怎样分割或线程化资源上下文？
5. 分支怎样合并剩余资源？
6. 闭包捕获怎样改变可调用次数？
7. 析构、异常、panic 和并发怎样处理？
8. 工程语言的所有权特性是核心演算的哪一层扩展？

## 本章检查点

- 能用 weakening 与 contraction 解释普通上下文为何允许丢弃和复制。
- 能逐项读懂线性应用规则里的 $\Delta_1,\Delta_2$。
- 能区分线性“恰好一次”与仿射“至多一次”。
- 能说明 Rust move/`Copy` 提供相关直觉，却不等于完整线性演算。
- 能区分资源使用纪律、借用关系和计算效果三个维度。
