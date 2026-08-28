# 双向类型检查

双向类型系统把一个宽泛的“判断表达式类型”拆成两个方向：

$$
\Gamma\vdash e\Rightarrow A
$$

$$
\Gamma\vdash e\Leftarrow A
$$

- $\Rightarrow$：**综合**（synthesize，也常写 infer）——输入表达式，输出类型；
- $\Leftarrow$：**检查**（check）——输入表达式和期望类型，验证是否匹配。

箭头表示信息流，不是求值方向，也不是函数类型箭头。

## 1. 为什么一个方向不够舒服

变量的类型很容易从环境查出：

```text
x
```

如果环境里 `x : Int`，自然从表达式得到类型，适合综合。

未标注参数的 lambda 则不同：

```text
fn x => x
```

只看表达式，`x` 可以是很多类型；但若上下文期望：

```text
Int -> Int
```

我们可以把输入类型 `Int` 传入函数体，检查 `x` 是否产生 `Int`。它适合检查。

双向设计的核心不是“检查两遍”，而是让类型信息顺着最自然的方向流动。

## 2. 两种判断式的输入与输出

| 判断 | 已知输入 | 需要得到 |
| --- | --- | --- |
| $\Gamma\vdash e\Rightarrow A$ | 环境、表达式 | 类型 $A$ |
| $\Gamma\vdash e\Leftarrow A$ | 环境、表达式、期望类型 $A$ | 成功或失败 |

在代码里大致是：

```text
synth(context, expression) -> Type
check(context, expression, expectedType) -> Unit
```

“双向类型推断”是常见中文叫法，但严格说整个方法通常叫双向类型检查；只有 $\Rightarrow$ 分支在综合类型。

## 3. 表达式分成可综合与可检查

一个经典的小系统使用两类语法：

$$
\begin{aligned}
i &::= x \mid i\;c \mid (c:A) \\
c &::= i \mid \lambda x.c
\end{aligned}
$$

- $i$：inferable/synthesizable，可综合项；
- $c$：checkable，可检查项；
- 变量能查表；
- 应用能从函数类型得到结果；
- 带注解表达式 `(c : A)` 能从注解开始综合；
- lambda 默认只能检查。

现代实现不一定真的使用两套 AST 类型，也可以让 `synth`/`check` 对同一 AST 分派。但语法分类清楚地表达了标注应出现在哪里。

## 4. 变量规则：从环境向外综合

$$
\frac{x:A\in\Gamma}
     {\Gamma\vdash x\Rightarrow A}
\;(\Rightarrow\mathrm{Var})
$$

朗读：如果上下文中 `x` 的类型是 $A$，那么表达式 `x` 综合出 $A$。

## 5. 注解规则：把检查切回综合

$$
\frac{\Gamma\vdash e\Leftarrow A}
     {\Gamma\vdash (e:A)\Rightarrow A}
\;(\Rightarrow\mathrm{Anno})
$$

注解 `(e : A)` 告诉检查器：先按已知类型 $A$ 检查 $e$；成功后，整个注解表达式就能综合出 $A$。

它是一个方向切换点：

$$
\text{annotation}
:
\text{check inside}
\longrightarrow
\text{synthesize outside}
$$

例如：

```text
(fn x => x : Int -> Int)
```

裸 lambda 不能综合，但注解给出预期类型，因此整个表达式可以综合 `Int -> Int`。

## 6. lambda 规则：把箭头类型拆开向内检查

$$
\frac{\Gamma,x:A\vdash e\Leftarrow B}
     {\Gamma\vdash\lambda x.e\Leftarrow A\to B}
\;(\Leftarrow\mathrm{Lam})
$$

逐项朗读：

1. 已知整个 lambda 应当具有 $A\to B$；
2. 因而参数 `x` 应当是 $A$；
3. 把 `x : A` 放入上下文；
4. 检查函数体 `e` 是否符合 $B$；
5. 若成功，整个 lambda 符合 $A\to B$。

这里没有猜测参数类型。信息从外层期望类型流向内层参数。

## 7. 应用规则：先综合函数，再检查参数

$$
\frac{
  \Gamma\vdash e_1\Rightarrow A\to B
  \qquad
  \Gamma\vdash e_2\Leftarrow A
}{
  \Gamma\vdash e_1\;e_2\Rightarrow B
}
\;(\Rightarrow\mathrm{App})
$$

信息流是：

1. 从函数位置 $e_1$ 综合出箭头类型 $A\to B$；
2. 用它的参数类型 $A$ 检查实参 $e_2$；
3. 应用表达式综合出返回类型 $B$。

这解释了为什么下面的 lambda 参数可以不标注：

```text
map(fn x => x + 1, numbers)
```

如果先综合出 `map` 希望第一个参数是 `Int -> Int`，就能按这个期望类型检查 lambda。

## 8. 从综合切到检查

最简单的等类型版本：

$$
\frac{
  \Gamma\vdash e\Rightarrow A
  \qquad
  A=B
}{
  \Gamma\vdash e\Leftarrow B
}
\;(\Leftarrow\mathrm{Sub})
$$

规则名常写 `Sub`，即使这里暂时只是类型相等。若系统有子类型，可以改为：

$$
\frac{
  \Gamma\vdash e\Rightarrow A
  \qquad
  A<:B
}{
  \Gamma\vdash e\Leftarrow B
}
\;(\Leftarrow\mathrm{Sub})
$$

读作：如果表达式自己综合出更具体的 $A$，而 $A$ 是期望类型 $B$ 的子类型，那么它也能按 $B$ 检查。

这是另一个方向切换点：先综合，再比较期望类型。

## 9. 完整推导：带注解的恒等函数

表达式：

```text
(fn x => x : Int -> Int)
```

目标是综合类型。使用注解规则，先产生检查任务：

$$
\varnothing\vdash\lambda x.x
\Leftarrow
\texttt{Int}\to\texttt{Int}
$$

lambda 规则把箭头拆开：

$$
x:\texttt{Int}\vdash x\Leftarrow\texttt{Int}
$$

变量先综合：

$$
x:\texttt{Int}\vdash x\Rightarrow\texttt{Int}
$$

再由切换规则确认综合类型与期望类型相同。最终：

$$
\varnothing\vdash
(\lambda x.x:\texttt{Int}\to\texttt{Int})
\Rightarrow
\texttt{Int}\to\texttt{Int}
$$

推导树写成：

$$
\frac{
  \dfrac{
    \dfrac{x:\texttt{Int}\in\Gamma}
          {\Gamma\vdash x\Rightarrow\texttt{Int}}
  }{
    \Gamma\vdash x\Leftarrow\texttt{Int}
  }
}{
  \varnothing\vdash
  (\lambda x.x:\texttt{Int}\to\texttt{Int})
  \Rightarrow
  \texttt{Int}\to\texttt{Int}
}
$$

其中中间还隐含了 lambda 检查规则；正式排版时可以把每层规则名全部标出。真正重要的是观察方向变化：注解向内给类型，变量向外给类型。

## 10. `if` 怎样利用期望类型

检查模式可写：

$$
\frac{
  \Gamma\vdash e_0\Leftarrow\texttt{Bool}
  \qquad
  \Gamma\vdash e_1\Leftarrow A
  \qquad
  \Gamma\vdash e_2\Leftarrow A
}{
  \Gamma\vdash
  \texttt{if}\;e_0\;\texttt{then}\;e_1\;\texttt{else}\;e_2
  \Leftarrow A
}
\;(\Leftarrow\mathrm{If})
$$

如果外层已知整个 `if` 应是 $A$，两个分支都直接按 $A$ 检查。这对分支内 lambda 很有用。

综合模式则可能先综合一个分支，再用它检查另一个：

$$
\frac{
  \Gamma\vdash e_0\Leftarrow\texttt{Bool}
  \qquad
  \Gamma\vdash e_1\Rightarrow A
  \qquad
  \Gamma\vdash e_2\Leftarrow A
}{
  \Gamma\vdash
  \texttt{if}\;e_0\;\texttt{then}\;e_1\;\texttt{else}\;e_2
  \Rightarrow A
}
$$

这种规则可能引入分支顺序偏向。更丰富的子类型系统也可能计算 join。语言设计者要明确选择，而不是把“两个分支应该差不多”留成模糊直觉。

## 11. 可直接执行的伪代码

```text
function synth(context, expression): Type
  match expression:
    Variable(name):
      return lookup(context, name)

    Annotation(term, annotatedType):
      check(context, term, annotatedType)
      return annotatedType

    Apply(function, argument):
      functionType = synth(context, function)
      (inputType, outputType) = expectFunction(functionType)
      check(context, argument, inputType)
      return outputType

    otherwise:
      error CannotSynthesize(expression)

function check(context, expression, expectedType):
  match (expression, expectedType):
    case (Lambda(parameter, body), Function(input, output)):
      check(context + (parameter : input), body, output)

    case (If(condition, yes, no), expected):
      check(context, condition, Bool)
      check(context, yes, expected)
      check(context, no, expected)

    otherwise:
      actualType = synth(context, expression)
      requireSubtype(actualType, expectedType)
```

这个核心版本没有合一变量，也不能综合裸 lambda。工程语言经常在它上面加入局部元变量、实例化、隐式参数等机制。

## 12. 双向不等于完全不用合一

双向描述的是信息流组织方式，并不禁止未知变量或合一。一个实际系统可以：

- 在综合函数应用时创建结果元变量；
- 在检查多态调用时实例化全称变量；
- 在局部范围内合一；
- 在关键边界要求用户标注。

因此“HM = 合一，双向 = 不合一”是错误二分。更准确的对比是：HM 的经典目标是在受限语言里得到主类型；双向系统的目标是显式安排综合与检查的边界，使更丰富的系统仍保持可预测。

## 13. 全称类型的方向

为了理解 higher-rank 多态，考虑类型：

$$
\forall\alpha.A
$$

检查一个表达式是否对所有 $\alpha$ 都成立时，要引入一个新的、不可随意求解的类型变量（常称刚性变量、eigenvariable 或 skolem）：

$$
\frac{
  \Gamma,\alpha\vdash e\Leftarrow A
}{
  \Gamma\vdash e\Leftarrow\forall\alpha.A
}
\;(\Leftarrow\forall)
$$

这里 $\alpha$ 必须 fresh，并且不能逃出作用域。

使用一个综合出的多态值时，则通常实例化它：

$$
\frac{
  \Gamma\vdash e\Rightarrow\forall\alpha.A
}{
  \Gamma\vdash e\Rightarrow\lbrack\hat\alpha/\alpha\rbrack A
}
\;(\Rightarrow\forall\mathrm{Elim})
$$

$\hat\alpha$ 常用来表示可求解的存在型元变量。不同论文记法差异很大：有的用 $\hat\alpha$，有的用 $?\alpha$，有的用 unification variable。

### 刚性变量与可求解变量

- 刚性 $\alpha$：代表“任意但固定”的类型，不能为通过检查而设成 `Int`；
- 可求解 $\hat\alpha$：代表待求解的洞，可以在作用域允许时被实例化。

混淆二者会让实现错误接受并非真正多态的程序。

## 14. higher-rank 例子

函数类型：

$$
(\forall\alpha.\alpha\to\alpha)
\to
(\texttt{Int}\times\texttt{Bool})
$$

它要求参数本身是一个真正多态的恒等函数。函数体可以分别把该参数用于 `Int` 和 `Bool`：

```text
fn polyId => (polyId(1), polyId(true))
```

经典 HM 的 lambda 参数是单态的，不能自动赋予这种内层 `forall`。双向系统若从外层注解得到上述期望类型，就能在检查 lambda 时把多态类型放入上下文。

调用这样的函数时，实参也需要能按 $\forall\alpha.\alpha\to\alpha$ 检查。标注提供了不可从局部语法唯一恢复的意图。

## 15. 算法上下文为何可能有顺序

简单系统把 $\Gamma$ 当映射即可。支持 higher-rank 推断的算法上下文可能包含：

$$
\Gamma ::= \cdot
\mid \Gamma,x:A
\mid \Gamma,\alpha
\mid \Gamma,\hat\alpha
\mid \Gamma,\hat\alpha=\tau
\mid \Gamma,\blacktriangleright
$$

其中可能有：

- 程序变量绑定；
- 刚性类型变量；
- 未解存在变量；
- 已解存在变量；
- 作用域标记。

顺序表达变量何时创建，从而限制某个解能引用哪些更早的变量。这是防止类型变量逃逸的关键。此时上下文不只是哈希表，而更像带作用域纪律的状态日志。

## 16. eta 与双向检查的直觉

假设 `f` 可以按 $A\to B$ 检查，那么：

```text
fn x => f(x)
```

也应该能按 $A\to B$ 检查。lambda 规则给 `x : A`，应用规则检查 `f(x) : B`。这种与 eta 展开/缩减的良好互动，是设计双向规则时的重要考量之一。

## 17. 标注放在哪里才可预测

一个好的双向系统不只是“有标注就能过”，还应说明：

- 哪些语法天然综合；
- 哪些语法天然检查；
- 哪些地方必须写标注才能改变方向；
- 添加无关代码是否会突然要求更多标注；
- 错误是否落在信息首次矛盾的位置。

标注是程序员与检查器之间的信息边界，不应成为随实现细节漂移的随机仪式。

## 本章检查点

- 能区分 $\Rightarrow$ 综合和 $\Leftarrow$ 检查的输入输出。
- 能解释变量、应用为何适合综合，未标注 lambda 为何适合检查。
- 能用标注规则和 subsumption 说明两种方向怎样切换。
- 能说明 higher-rank 检查中刚性变量与存在元变量的差别。
