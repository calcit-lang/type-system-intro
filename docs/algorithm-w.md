# Algorithm W：从规则到算法

Algorithm W 是 HM 推断的经典算法表达。它遍历表达式，创建新鲜类型变量、实例化类型方案、合一约束，并把替换持续传给后续步骤。

不同教材在返回值顺序、替换表示和 `let` 细节上会略有不同。本章使用一个常见接口：

$$
W(\Gamma,e)=(S,\tau)
$$

读作：给定环境 $\Gamma$ 和表达式 $e$，算法返回替换 $S$ 与类型 $\tau$。最终有效类型通常要看 $S(\tau)$。

## 1. 为什么同时返回替换与类型

推断子表达式不仅得到自身类型，还可能解决环境中已有的未知量。例如调用某参数函数时，可能发现那个函数必须接收 `Int`。后续兄弟节点必须看到这条新信息，所以替换是算法状态的一部分。

可以把它类比为：

```text
infer(environment, expression)
  -> { learnedFacts, inferredType }
```

## 2. 变量规则

若 $x:\sigma\in\Gamma$：

$$
W(\Gamma,x)=([],\operatorname{instantiate}(\sigma))
$$

步骤：

1. 从环境查出类型方案；
2. 把所有量化变量换成新鲜变量；
3. 没有新增约束，所以返回空替换。

伪代码：

```text
case Variable(name):
  scheme = lookup(environment, name)
  return (emptySubstitution, instantiate(scheme))
```

未绑定变量不是新建类型变量，而应直接报作用域错误。

## 3. 常量规则

$$
W(\Gamma,42)=([],\texttt{Int})
$$

$$
W(\Gamma,\texttt{true})=([],\texttt{Bool})
$$

若语言有重载数字字面量，这里会更复杂；本教程暂不加入重载。

## 4. lambda 规则

对 $\lambda x.e$：

1. 创建新鲜变量 $\alpha$；
2. 在环境中加入单态方案 $x:\alpha$；
3. 推断函数体，得到 $(S_1,\tau_1)$；
4. 返回函数类型 $S_1(\alpha)\to\tau_1$。

公式化：

$$
\frac{
  \alpha\;\text{fresh}
  \qquad
  W(\Gamma,x:\alpha,e)=(S_1,\tau_1)
}{
  W(\Gamma,\lambda x.e)
  =
  (S_1,S_1(\alpha)\to\tau_1)
}
$$

为什么参数类型要应用 $S_1$？函数体可能已经通过使用 `x` 解决了 $\alpha$。

例子：

```text
fn x => x + 1
```

初始 `x : alpha`，函数体使 $\alpha=Int$，所以不能返回旧的 $\alpha\to Int$，而要返回 `Int -> Int`。

## 5. 应用规则

对 $e_1\;e_2$：

1. 推断函数部分：$W(\Gamma,e_1)=(S_1,\tau_1)$；
2. 用 $S_1$ 更新环境，再推断参数：
   $W(S_1(\Gamma),e_2)=(S_2,\tau_2)$；
3. 创建新鲜结果变量 $\alpha$；
4. 合一更新后的函数类型与 $\tau_2\to\alpha$：
   $S_3=\operatorname{unify}(S_2(\tau_1),\tau_2\to\alpha)$；
5. 返回组合替换和最终结果类型。

$$
\begin{aligned}
W(\Gamma,e_1) &= (S_1,\tau_1) \\
W(S_1\Gamma,e_2) &= (S_2,\tau_2) \\
S_3 &= \operatorname{unify}
  (S_2\tau_1,\tau_2\to\alpha) \\
W(\Gamma,e_1\;e_2)
  &= (S_3\circ S_2\circ S_1,S_3\alpha)
\end{aligned}
$$

这里省略了“apply”的括号：$S_1\Gamma$ 就是 $S_1(\Gamma)$。

### 为什么要按这个顺序传播

$e_1$ 得到的事实可能影响 $e_2$ 所在环境；$e_2$ 得到的事实也可能进一步改变 $e_1$ 的类型。最后才能要求 `e1` 具有“参数类型到新结果类型”的形状。

## 6. let 规则

对：

```text
let x = e1 in e2
```

步骤：

1. $W(\Gamma,e_1)=(S_1,\tau_1)$；
2. 更新环境：$\Gamma_1=S_1(\Gamma)$；
3. 更新结果类型并相对新环境泛化：
   $\sigma=\operatorname{generalize}(\Gamma_1,S_1(\tau_1))$；
4. 在 $\Gamma_1,x:\sigma$ 下推断 $e_2$，得到 $(S_2,\tau_2)$；
5. 返回 $(S_2\circ S_1,\tau_2)$。

$$
\begin{aligned}
(S_1,\tau_1) &= W(\Gamma,e_1) \\
\Gamma_1 &= S_1(\Gamma) \\
\sigma &= \operatorname{generalize}(\Gamma_1,S_1(\tau_1)) \\
(S_2,\tau_2) &= W(\Gamma_1,x:\sigma,e_2) \\
W(\Gamma,\texttt{let}\;x=e_1\;\texttt{in}\;e_2)
  &= (S_2\circ S_1,\tau_2)
\end{aligned}
$$

最常见实现错误之一，是在应用 $S_1$ 之前就泛化。这样可能把已经被环境约束的变量错误地量化。

## 7. 完整追踪：`fn f => fn x => f(x)`

目标表达式：

```text
fn f => fn x => f(x)
```

### 进入外层 lambda

创建：

$$
f:\alpha
$$

### 进入内层 lambda

创建：

$$
x:\beta
$$

环境为：

$$
\Gamma = f:\alpha, x:\beta
$$

### 推断应用 `f(x)`

- `f` 实例化后仍为 $\alpha$；
- `x` 为 $\beta$；
- 创建应用结果变量 $\gamma$；
- 合一：

$$
\alpha = \beta\to\gamma
$$

得到：

$$
S=\lbrack\alpha\mapsto\beta\to\gamma\rbrack
$$

所以 `f(x) : gamma`。

### 退出内层 lambda

$$
\lambda x.f(x):\beta\to\gamma
$$

### 退出外层 lambda

外层参数原来是 $\alpha$，应用替换后是 $\beta\to\gamma$：

$$
\lambda f.\lambda x.f(x)
:
(\beta\to\gamma)\to\beta\to\gamma
$$

顶层若允许泛化，得到：

$$
\forall\beta\gamma.
(\beta\to\gamma)\to\beta\to\gamma
$$

## 8. 完整追踪：一次类型错误

```text
fn f => (f(1), f(true))
```

为 `f` 创建 $\alpha$。

第一次调用：

$$
\alpha = \texttt{Int}\to\beta
$$

于是 $f$ 已被约束为接收 `Int`。

第二次调用要求：

$$
\texttt{Int}\to\beta
=
\texttt{Bool}\to\gamma
$$

合一参数类型时遇到：

$$
\texttt{Int}=\texttt{Bool}
$$

失败。为什么不能让 `f` 多态？因为 lambda 参数在经典 HM 中是单态的；只有 `let` 绑定会泛化。

对比：

```text
let f = fn x => x in (f(1), f(true))
```

这里 `f` 经 let 泛化，每次使用能独立实例化，所以合法。

## 9. Algorithm J、W 与“先收集后求解”

实现 HM 不只有一种工程结构：

- **Algorithm W 风格**：显式返回并组合替换，便于论文证明；
- **Algorithm J 风格**：使用可变的统一变量/union-find 原地求解，工程上常更直接；
- **约束生成后集中求解**：先遍历 AST 产生带来源的约束，再交给求解器。

它们可以实现相近的 HM 语义，但状态管理、错误定位与扩展方式不同。不要因为实现没有名为 `W` 的函数，就断定它不是 HM 推断。

## 10. 顶层是否泛化

`W` 核心返回单型与替换。REPL 或模块边界通常再相对顶层环境泛化，展示：

```text
val map : forall a b. (a -> b) -> List<a> -> List<b>
```

局部 lambda 参数则不能偷偷泛化。泛化发生在哪里，是语言设计的一部分。

## 11. 带递归绑定时怎么办

非递归 `let` 推断 `e1` 时，`x` 不在环境中。`let rec` 或递归定义通常要：

1. 先给 `x` 一个新鲜单型占位；
2. 在包含 `x` 的环境中推断右侧；
3. 合一占位与推断结果；
4. 再按语言规则决定能否泛化。

多态递归通常不能由经典 HM 完整推断，需要类型标注。

## 12. 一份可映射到代码的总览

```text
infer(environment, expression):
  match expression:
    Variable(name):
      return (empty, instantiate(environment[name]))

    Integer(_):
      return (empty, Int)

    Lambda(parameter, body):
      parameterType = freshTypeVariable()
      local = environment + (parameter : mono(parameterType))
      (s1, bodyType) = infer(local, body)
      return (s1, Function(apply(s1, parameterType), bodyType))

    Apply(function, argument):
      resultType = freshTypeVariable()
      (s1, functionType) = infer(environment, function)
      (s2, argumentType) = infer(apply(s1, environment), argument)
      s3 = unify(
        apply(s2, functionType),
        Function(argumentType, resultType)
      )
      return (compose(s3, s2, s1), apply(s3, resultType))

    Let(name, value, body):
      (s1, valueType) = infer(environment, value)
      solvedEnvironment = apply(s1, environment)
      scheme = generalize(
        solvedEnvironment,
        apply(s1, valueType)
      )
      local = solvedEnvironment + (name : scheme)
      (s2, bodyType) = infer(local, body)
      return (compose(s2, s1), bodyType)
```

这段代码只是一张路线图。生产实现还需要源位置、类型构造器、递归类型、错误累积、性能结构和语言自身的泛化限制。

## 13. Algorithm W 的边界

W 的漂亮之处来自 HM 的边界：

- let 多态；
- lambda 参数单态；
- 全称量词只在类型方案外层；
- 没有任意的 higher-rank 推断；
- 没有让相等求解复杂化的丰富子类型关系。

当系统变强时，“为所有表达式自动合成最一般类型”可能变得不可判定或不再有主类型。双向类型检查选择改变问题：有些位置综合类型，有些位置要求调用者提供期望类型。

## 本章检查点

- 能说明 W 为什么同时返回替换与类型。
- 能按变量、lambda、应用、let 四个分支追踪环境和替换。
- 能指出泛化前为什么必须先把最新替换作用到环境与类型。
- 能说明 W 的主类型结果依赖 HM 的语言边界。
