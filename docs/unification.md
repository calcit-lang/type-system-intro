# 替换、约束与合一

HM 类型推断可以理解为不断生成“这些类型必须相等”的约束，再用合一（unification）求出最一般的解。本章把这台求解器拆开。

## 1. 类型变量是待解的洞

推断：

```text
fn x => x + 1
```

刚进入 lambda 时，还不知道 `x` 的类型，于是创建新变量 $\alpha$。如果 `+` 要求两个参数都是 `Int`，就得到约束：

$$
\alpha = \texttt{Int}
$$

求解后，函数类型从：

$$
\alpha\to\texttt{Int}
$$

变成：

$$
\texttt{Int}\to\texttt{Int}
$$

## 2. 替换的数据结构

替换 $S$ 是从类型变量到类型的有限映射：

$$
S = \lbrack\alpha\mapsto\texttt{Int},\;
     \beta\mapsto\texttt{Bool}\to\texttt{Bool}\rbrack
$$

把 $S$ 作用到类型上：

$$
S(\alpha\to\beta)
=
\texttt{Int}\to(\texttt{Bool}\to\texttt{Bool})
$$

代码模型可以是：

```text
Substitution = Map<TypeVarId, Type>
```

## 3. 替换如何递归作用

$$
\begin{aligned}
S(\texttt{Int}) &= \texttt{Int} \\
S(\alpha) &=
  \begin{cases}
  \tau & \text{if } \alpha\mapsto\tau\in S \\
  \alpha & \text{otherwise}
  \end{cases} \\
S(\tau_1\to\tau_2) &= S(\tau_1)\to S(\tau_2)
\end{aligned}
$$

替换也要作用于类型方案和环境，但不能替换被 $\forall$ 绑定的变量：

$$
S(\forall\alpha.\tau)
=
\forall\alpha.\bigl(S\setminus\{\alpha\}\bigr)(\tau)
$$

右侧表示先从替换的定义域里移除 $\alpha$，再进入方案内部。

## 4. 替换组合：顺序非常重要

若算法先得到 $S_1$，后来又得到 $S_2$，组合写作：

$$
S_2\circ S_1
$$

含义是先应用 $S_1$，再应用 $S_2$：

$$
(S_2\circ S_1)(\tau)=S_2(S_1(\tau))
$$

例子：

$$
S_1=\lbrack\alpha\mapsto\beta\rbrack,
\qquad
S_2=\lbrack\beta\mapsto\texttt{Int}\rbrack
$$

那么：

$$
(S_2\circ S_1)(\alpha)=\texttt{Int}
$$

若实现只把两个 `Map` 粗暴拼接，`alpha` 可能仍指向 `beta`，后续必须反复追链。可以允许链存在并在 `apply`/`prune` 中压缩，也可以维持完全规范化的替换；但语义必须等价于函数组合。

## 5. 什么是合一

给定两个类型 $\tau_1$ 和 $\tau_2$，合一寻找替换 $S$，使得：

$$
S(\tau_1)=S(\tau_2)
$$

写作：

$$
\operatorname{unify}(\tau_1,\tau_2)=S
$$

若不存在这样的替换，则类型错误。

我们不仅想找任意解，还想找 most general unifier（MGU，最一般合一子）：其他解都可以在它的基础上继续替换得到。

## 6. 合一的核心情况

### 相同基础类型

$$
\operatorname{unify}(\texttt{Int},\texttt{Int})=[]
$$

不需要产生替换。

### 类型变量与类型

$$
\operatorname{unify}(\alpha,\tau)
=
\lbrack\alpha\mapsto\tau\rbrack
$$

但要满足两个条件：

1. 若 $\tau=\alpha$，结果是空替换；
2. 若 $\alpha\in\operatorname{ftv}(\tau)$，必须失败。

第二项就是 occurs check（出现检查）。

### 函数类型

要合一：

$$
\tau_1\to\tau_2
\quad\text{与}\quad
\tau_3\to\tau_4
$$

先合一参数，再把所得替换作用于结果类型后继续合一：

$$
\begin{aligned}
S_1 &= \operatorname{unify}(\tau_1,\tau_3) \\
S_2 &= \operatorname{unify}(S_1(\tau_2),S_1(\tau_4)) \\
S &= S_2\circ S_1
\end{aligned}
$$

不能并行地忽略 $S_1$，因为参数部分的新信息可能影响结果部分。

### 构造器不一致

$$
\operatorname{unify}(\texttt{Int},\texttt{Bool})
$$

失败。函数类型与整数类型合一也失败。错误应展示两边的来源，而不仅是“unification failed”。

## 7. occurs check 为什么不能省

尝试合一：

$$
\alpha = \alpha\to\beta
$$

如果接受替换 $\lbrack\alpha\mapsto\alpha\to\beta\rbrack$，展开一次得到：

$$
\alpha = (\alpha\to\beta)\to\beta
$$

再展开：

$$
\alpha = ((\alpha\to\beta)\to\beta)\to\beta
$$

形成无限类型。在普通有限 HM 类型树中必须拒绝，所以检查：

$$
\alpha\notin\operatorname{ftv}(\tau)
$$

经典触发例子是自应用：

```text
fn x => x(x)
```

若 `x : alpha`，作为函数使用要求：

$$
\alpha = \alpha\to\beta
$$

occurs check 因此报告类型错误。

## 8. 完整合一例子

合一：

$$
\alpha\to\texttt{Bool}
\quad\text{与}\quad
\texttt{Int}\to\beta
$$

### 参数部分

$$
\operatorname{unify}(\alpha,\texttt{Int})
=
S_1=\lbrack\alpha\mapsto\texttt{Int}\rbrack
$$

### 返回值部分

应用 $S_1$ 后仍要合一：

$$
\operatorname{unify}(\texttt{Bool},\beta)
=
S_2=\lbrack\beta\mapsto\texttt{Bool}\rbrack
$$

### 组合

$$
S_2\circ S_1
=
\lbrack\alpha\mapsto\texttt{Int},
  \beta\mapsto\texttt{Bool}\rbrack
$$

两边都变成：

$$
\texttt{Int}\to\texttt{Bool}
$$

## 9. 带多个约束的求解

假设约束集：

$$
C=\left\{
  \alpha=\beta\to\gamma,
  \beta=\texttt{Int},
  \gamma=\texttt{Bool}
\right\}
$$

逐个求解并传播：

1. $\alpha\mapsto\beta\to\gamma$；
2. $\beta\mapsto\texttt{Int}$，同时更新前式为 $\alpha\mapsto\texttt{Int}\to\gamma$；
3. $\gamma\mapsto\texttt{Bool}$；
4. 最终 $\alpha\mapsto\texttt{Int}\to\texttt{Bool}$。

顺序可能改变中间状态，但正确的 MGU 在变量重命名和等价替换意义下应一致。

## 10. 一个清晰的伪代码版本

```text
function unify(left, right):
  left  = prune(left)
  right = prune(right)

  match (left, right):
    case (TypeVar(a), TypeVar(b)) if a == b:
      return emptySubstitution

    case (TypeVar(a), type):
      return bind(a, type)

    case (type, TypeVar(a)):
      return bind(a, type)

    case (Int, Int) | (Bool, Bool):
      return emptySubstitution

    case (Function(a1, a2), Function(b1, b2)):
      s1 = unify(a1, b1)
      s2 = unify(apply(s1, a2), apply(s1, b2))
      return compose(s2, s1)

    otherwise:
      error TypeMismatch(left, right)

function bind(a, type):
  if type == TypeVar(a):
    return emptySubstitution
  if a in freeTypeVariables(type):
    error InfiniteType(a, type)
  return singletonSubstitution(a, type)
```

## 11. 合一与普通相等检查不同

相等检查只问两个已知类型是否一致。合一允许给未知变量赋值：

$$
\alpha\to\texttt{Int}
\quad\text{与}\quad
\texttt{Bool}\to\beta
$$

它们当前不相等，但可通过：

$$
\lbrack\alpha\mapsto\texttt{Bool},
 \beta\mapsto\texttt{Int}\rbrack
$$

变得相等。

## 12. 错误信息需要保留约束来源

真实实现不应只保存裸方程，最好连同来源：

```text
Constraint {
  expected: Int,
  actual: Bool,
  origin: argument #1 of call at line 8,
  because: function inferred at line 3 expects Int
}
```

数学规则关心是否有解；编译器还要回答“哪个表达式制造了这条无解约束”。这也是双向检查常能改善错误局部性的原因之一。

## 本章检查点

- 能手工合一两个简单箭头类型并组合替换。
- 能说明 occurs check 为何拒绝 $\alpha=\alpha\to\beta$。
- 能区分刚性变量、可求解变量与全称变量。
- 能解释最一般合一子为什么比任意一个具体解更有用。
