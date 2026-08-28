# Lambda 演算与简单类型：HM 之前的地基

HM、System F、双向类型检查都继承了 lambda 演算的基本语言。如果不先理解绑定、替换和函数应用，后面的类型变量会和程序变量混在一起。

本章只要求你会读简单 TypeScript/Rust 函数。

## 1. 只保留函数的最小语言

无类型 lambda 演算的语法：

$$
e ::= x \mid \lambda x.e \mid e_1\;e_2
$$

三种形式分别是：

1. 变量 $x$；
2. 函数 $\lambda x.e$；
3. 函数应用 $e_1\;e_2$。

对照 TypeScript：

```ts
// λx.x
const identity = (x: unknown) => x;

// f x
f(x);
```

`unknown` 只是对照语法时的占位；无类型 lambda 演算本身没有 TypeScript 类型。

## 2. 括号怎样省略

函数应用向左结合：

$$
f\;x\;y
\equiv
(f\;x)\;y
$$

lambda 的函数体尽量向右延伸：

$$
\lambda x.\lambda y.x
\equiv
\lambda x.(\lambda y.x)
$$

因此：

$$
\lambda f.\lambda x.f\;x
$$

对应：

```ts
const apply = f => x => f(x);
```

## 3. 绑定变量与自由变量

在：

$$
\lambda x.x
$$

函数头的 $x$ 绑定函数体里的 $x$。

在：

$$
\lambda x.f\;x
$$

$x$ 被绑定，$f$ 是自由变量。自由变量的含义必须由外部环境提供。

定义自由程序变量：

$$
\begin{aligned}
\mathrm{fv}(x) &= \{x\} \\
\mathrm{fv}(e_1\;e_2) &= \mathrm{fv}(e_1)\cup\mathrm{fv}(e_2) \\
\mathrm{fv}(\lambda x.e) &= \mathrm{fv}(e)\setminus\{x\}
\end{aligned}
$$

这里是 `fv`，不是后文的 `ftv`：

- `fv`：自由程序变量；
- `ftv`：自由类型变量。

## 4. Alpha 等价：绑定名字不重要

下面两个函数只改了局部参数名：

$$
\lambda x.x
\equiv_\alpha
\lambda y.y
$$

称为 alpha-equivalent。编译器内部常用唯一 ID 或 de Bruijn index 避免被表面名字误导。

但：

$$
\lambda x.y
$$

不能随便把 $x$ 政名为 $y$，否则原本自由的 $y$ 会被捕获。

## 5. Beta 归约：函数调用就是替换

核心计算规则：

$$
(\lambda x.e_1)\;e_2
\longrightarrow_\beta
[e_2/x]e_1
$$

读作：把函数体 $e_1$ 中自由出现的 $x$ 替换成实参 $e_2$。

例子：

$$
(\lambda x.x)\;42
\longrightarrow_\beta
42
$$

再看：

$$
(\lambda x.\lambda y.x)\;a
\longrightarrow_\beta
\lambda y.a
$$

这对应一个忽略第二参数、永远返回第一个参数的函数。

## 6. 变量捕获为什么危险

考虑：

$$
(\lambda x.\lambda y.x)\;y
$$

如果机械把 $x$ 替换成 $y$，得到：

$$
\lambda y.y
$$

结果错误：实参中原本自由的 $y$ 被内层 lambda 捕获了。

正确做法是先把内层绑定变量改成新鲜名字：

$$
\lambda x.\lambda z.x
$$

再替换：

$$
(\lambda x.\lambda z.x)\;y
\longrightarrow_\beta
\lambda z.y
$$

这叫 capture-avoiding substitution（避免捕获的替换）。类型替换也要遵守类似作用域纪律。

## 7. 求值策略是另一层选择

表达式：

$$
(\lambda x.1)\;\Omega
$$

其中 $\Omega$ 是一个不会终止的表达式。

- call by value：先求实参，可能永远到不了函数体；
- call by name：先把实参代入，由于 `x` 没被使用，可直接得到 `1`；
- call by need：在 call by name 基础上共享求值结果。

类型规则与求值策略有关联，但不是同一个定义。看到 $e\to e'$ 时，要先确认论文在定义哪种操作语义。

## 8. 为什么无类型自应用会制造麻烦

无类型演算允许：

$$
\lambda x.x\;x
$$

甚至：

$$
\Omega
=
(\lambda x.x\;x)(\lambda x.x\;x)
$$

它归约一步仍是自己，因此不会终止。

简单类型会拒绝 `x x`。若 $x:A$，作为函数又要求 $x:A\to B$，于是需要：

$$
A=A\to B
$$

在普通有限简单类型中无解。

## 9. 给 lambda 演算加上简单类型

类型语法：

$$
A ::= \mathrm{Int}
\mid \mathrm{Bool}
\mid A\to B
$$

带参数标注的表达式：

$$
e ::= x
\mid n
\mid \mathrm{true}
\mid \mathrm{false}
\mid \lambda x:A.e
\mid e_1\;e_2
$$

TypeScript 对照：

```ts
const not = (value: boolean): boolean => !value;
```

Rust 对照：

```rust
fn not(value: bool) -> bool { !value }
```

## 10. 三条核心类型规则

### 变量

$$
\frac{x:A\in\Gamma}
     {\Gamma\vdash x:A}
\;(\mathrm{Var})
$$

上下文中记录了 `x : A`，所以查询变量得到 $A$。

### Lambda

$$
\frac{\Gamma,x:A\vdash e:B}
     {\Gamma\vdash\lambda x:A.e:A\to B}
\;(\mathrm{Abs})
$$

假设参数是 $A$，函数体是 $B$，整个函数就是 $A\to B$。

### 应用

$$
\frac{
  \Gamma\vdash e_1:A\to B
  \qquad
  \Gamma\vdash e_2:A
}{
  \Gamma\vdash e_1\;e_2:B
}
\;(\mathrm{App})
$$

函数需要 $A$，实参正好是 $A$，因此结果是 $B$。

## 11. 手工推导一个带类型的调用

表达式：

$$
(\lambda x:\mathrm{Int}.x)\;1
$$

叶子事实：

$$
x:\mathrm{Int}\vdash x:\mathrm{Int}
$$

由 lambda 规则：

$$
\varnothing\vdash
\lambda x:\mathrm{Int}.x
:
\mathrm{Int}\to\mathrm{Int}
$$

整数规则给出：

$$
\varnothing\vdash 1:\mathrm{Int}
$$

最后由应用规则：

$$
\varnothing\vdash
(\lambda x:\mathrm{Int}.x)\;1
:
\mathrm{Int}
$$

类型推导描述“这个调用是否合法”；beta 归约描述“这个调用怎样执行”：

$$
(\lambda x:\mathrm{Int}.x)\;1
\longrightarrow
1
$$

## 12. Progress 与 Preservation 从哪里来

类型安全的经典拆分：

### Progress

闭合且良类型的表达式，要么已经是值，要么还能走一步。

$$
\vdash e:A
\Longrightarrow
\mathrm{value}(e)
\lor
\exists e'.\;e\to e'
$$

### Preservation

良类型表达式求值一步后，类型保持不变。

$$
\vdash e:A
\land
e\to e'
\Longrightarrow
\vdash e':A
$$

二者合起来排除“一个良类型闭合程序卡在未定义操作上”的情况。它不自动保证终止、业务正确、无资源耗尽或无逻辑漏洞。

## 13. Curry–Howard 的最小直觉

函数类型：

$$
A\to B
$$

可以读作逻辑蕴含：“如果有 $A$ 的证明，就能得到 $B$ 的证明”。

一个程序：

$$
\lambda x:A.e
$$

就是在假设 $A$ 的证据 $x$ 后，构造 $B$ 的证据 $e$。

恒等函数：

$$
\lambda x:A.x : A\to A
$$

对应最朴素的命题：如果 $A$ 成立，那么 $A$ 成立。

这个对应会在积类型、和类型、全称量化和依赖类型中继续扩展，但当前只需记住：类型规则也可以被看作证明构造规则。

## 14. STLC 为什么还不够

恒等函数需要为每个类型写一次：

$$
\lambda x:\mathrm{Int}.x
:
\mathrm{Int}\to\mathrm{Int}
$$

$$
\lambda x:\mathrm{Bool}.x
:
\mathrm{Bool}\to\mathrm{Bool}
$$

程序结构完全相同，却没有单一类型表达“对任意 $A$ 都成立”。下一步需要参数多态：

$$
\forall A.\;A\to A
$$

System F 会显式表达这种能力；HM 则在受限位置自动推断它。

## 15. 常见混淆检查

### 程序变量与类型变量

在 $\lambda x.x$ 中，$x$ 是程序变量；在 $\forall\alpha.\alpha\to\alpha$ 中，$\alpha$ 是类型变量。它们位于不同语法层。

### 程序替换与类型替换

$[e/x]e'$ 替换程序变量；$[A/\alpha]B$ 替换类型变量。作用域原则相似，处理对象不同。

### 求值箭头与函数类型箭头

$e\to e'$ 表示一步求值；$A\to B$ 表示函数类型。要依赖两边是表达式还是类型来判断。

### 能类型化与会终止

STLC 的标准纯核心具有强规范化性质，但真实语言加入递归、循环、异常等机制后，良类型程序当然仍可能不终止。

## 本章练习

1. 标出 $\lambda f.\lambda x.f\;x$ 中每个变量是自由还是绑定。
2. 说明为什么 $(\lambda x.\lambda y.x)\;y$ 不能直接替换成 $\lambda y.y$。
3. 为 `(fn x: Bool => x) true` 画出三层类型推导。
4. 分别写出它的类型推导结论与一步求值结论。
5. 用自己的话解释：为什么 STLC 的恒等函数还需要多态扩展？

## 本章检查点

- 能区分自由变量与绑定变量，并解释变量捕获。
- 能手工完成一次避免捕获的 beta 归约。
- 能为变量、lambda 和应用画出小型 STLC 推导树。
- 能区分求值箭头、函数类型箭头和替换记号。
