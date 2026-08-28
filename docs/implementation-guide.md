# 实现一个小型类型检查器

这一章把前面的数学对象映射为程序结构。建议先实现最小 HM，再改造成双向入口；这样可以分别观察合一与信息方向，而不是一次处理所有复杂度。

## 1. 第一版语言边界

表达式：

```text
Expression =
  | Variable(name)
  | Integer(value)
  | Boolean(value)
  | Lambda(parameter, body)
  | Apply(function, argument)
  | Let(name, value, body)
  | Annotation(expression, type)
```

类型：

```text
Type =
  | IntegerType
  | BooleanType
  | FunctionType(input, output)
  | TypeVariable(id)

Scheme = Forall(boundVariableIds, bodyType)
```

先不要加入数组、记录、重载、子类型或递归类型。每多一个构造器都要同步更新自由变量、替换、合一、打印与测试。

## 2. 不要用字符串充当变量身份

显示名可以是 `a`、`b`，内部身份应是稳定 ID：

```text
TypeVariable {
  id: 42,
  hint: "a"
}
```

`forall a. ...` 中的 `a` 与另一个作用域中的 `a` 可以同名但不是同一变量。使用 ID 能避免 alpha-renaming（约束变量重命名）问题渗入求解器。

## 3. 环境的数据模型

基础 HM：

```text
TypeEnvironment = PersistentMap<Name, Scheme>
```

持久化映射或“复制并扩展”的接口很适合作用域：

```text
bodyEnvironment = environment.extend(parameter, mono(parameterType))
```

离开 lambda 后自然丢弃扩展，不要修改全局表再手动恢复。

支持 higher-rank 存在变量的算法可能需要有序上下文：

```text
ContextEntry =
  | TermBinding(name, type)
  | Universal(typeVarId)
  | Unsolved(existentialId)
  | Solved(existentialId, type)
  | Marker(markerId)
```

这两种结构解决的问题不同，不要在尚未需要作用域顺序时过早引入复杂上下文。

## 4. 纯函数工具层

先独立完成并测试：

```text
freeTypeVariables(type) -> Set<Id>
freeSchemeVariables(scheme) -> Set<Id>
freeEnvironmentVariables(environment) -> Set<Id>

applySubstitution(substitution, type) -> Type
applySubstitutionToScheme(substitution, scheme) -> Scheme
applySubstitutionToEnvironment(substitution, environment) -> Environment

composeSubstitutions(newer, older) -> Substitution
instantiate(scheme) -> Type
generalize(environment, type) -> Scheme
unify(left, right, origin) -> Substitution
```

这些函数的错误会在整个推断器里放大。尤其要为“替换不能进入同名量词”“组合顺序”“occurs check”写单元测试。

## 5. 推断状态

最小状态：

```text
InferenceState {
  nextTypeVariableId: Integer
}
```

若使用原地合一，则状态还会保存变量链接。无论采用纯函数还是可变实现，都要让“创建新鲜变量”集中在一个入口，便于测试重放与漂亮打印。

## 6. 错误类型要结构化

```text
TypeError =
  | UnboundVariable {
      name,
      span
    }
  | TypeMismatch {
      expected,
      actual,
      span,
      expectationOrigin
    }
  | ExpectedFunction {
      actual,
      calleeSpan
    }
  | InfiniteType {
      variable,
      type,
      span
    }
  | CannotSynthesize {
      expressionKind,
      span,
      annotationHint
    }
```

不要在深层工具里直接拼最终字符串。保留结构，最外层诊断器再决定显示、颜色、代码片段和因果链。

## 7. 第一阶段：实现 HM 核心

推荐顺序：

1. 基础类型与函数类型；
2. 自由变量计算；
3. 替换应用与组合；
4. 合一与 occurs check；
5. 单态 lambda/应用推断；
6. `Scheme`、实例化、泛化；
7. `let` 多态；
8. 注解节点（先按“推断后合一”实现）。

每一步都保留小测试，不要等语言解析器完成才测类型核心。可以直接手写 AST。

## 8. HM 必测例子

### 恒等函数

```text
fn x => x
```

期望（忽略变量名字）：

$$
\alpha\to\alpha
$$

### 函数组合

```text
fn f => fn g => fn x => f(g(x))
```

期望：

$$
(\beta\to\gamma)
\to
(\alpha\to\beta)
\to
\alpha\to\gamma
$$

### let 多态

```text
let id = fn x => x in
(id(1), id(true))
```

期望：`(Int, Bool)`。若失败，优先检查：是否在 `let` 泛化、是否每次变量查找都实例化、实例化是否 fresh。

### lambda 参数不多态

```text
fn f => (f(1), f(true))
```

期望失败：`Int` 与 `Bool` 无法合一。

### 无限类型

```text
fn x => x(x)
```

期望 `InfiniteType`，而不是栈溢出。

## 9. 第二阶段：拆分 `synth` 与 `check`

先保留原有合一工具，再引入：

```text
synthesize(environment, expression) -> (substitution, type)
check(environment, expression, expectedType) -> substitution
```

核心分工：

- 变量、常量、注解、函数应用：优先综合；
- lambda：若有期望函数类型，优先检查；
- `if`：若有期望类型，把它传给两个分支；
- 其他可综合表达式需要检查时，先综合再合一/子类型比较。

## 10. 双向入口的混合伪代码

```text
function check(env, expression, expected): Substitution
  expected = prune(expected)

  match (expression, expected):
    case (Lambda(parameter, body), Function(input, output)):
      return check(env + (parameter : mono(input)), body, output)

    case (If(condition, yes, no), expected):
      s1 = check(env, condition, Bool)
      s2 = check(apply(s1, env), yes, apply(s1, expected))
      s3 = check(
        apply(compose(s2, s1), env),
        no,
        apply(compose(s2, s1), expected)
      )
      return compose(s3, s2, s1)

    otherwise:
      (s1, actual) = synth(env, expression)
      s2 = unify(apply(s1, actual), apply(s1, expected))
      return compose(s2, s1)
```

如果系统有子类型，最后一步不再是对称的 `unify`，而可能是有方向的 `subtype(actual, expected)` 或实例化判断。

## 11. 期望类型应尽早使用

不理想的实现：

```text
check(e, expected):
  actual = inferEverythingFromScratch(e)
  unify(actual, expected)
```

它形式上有 `check`，却没有把期望类型传进 lambda、分支和复合结构，失去了双向的主要优势。

理想结构是在看到引入形式时立即拆解期望类型。例如 lambda 对应函数类型的引入，元组表达式对应积类型的引入，记录字面量对应记录类型的引入。

## 12. 引入形式与消去形式

一个实用设计原则：

- **引入形式**说明怎样构造该类型的值，通常适合检查；
- **消去形式**说明怎样使用/观察该类型的值，通常适合综合。

例子：

| 类型 | 引入形式（常检查） | 消去形式（常综合） |
| --- | --- | --- |
| $A\to B$ | lambda | 函数应用 |
| $A\times B$ | `(e1, e2)` | `.first` / 模式拆分 |
| 记录 | `{ field = e }` | `record.field` |
| 全称类型 | 类型抽象/按 forall 检查 | 类型实例化 |

这不是不可违反的语法规定，而是从逻辑规则与信息流得到的可靠起点。

## 13. pretty printer 也是类型检查器的一部分

内部类型：

```text
Function(a, Function(b, c))
```

应打印：

```text
a -> b -> c
```

内部类型：

```text
Function(Function(a, b), c)
```

必须打印：

```text
(a -> b) -> c
```

打印器还应：

- 按首次出现给变量命名 `a, b, c`；
- 不泄露内部 ID，除非调试模式；
- 对用户写过的类型尽量保留熟悉名字；
- 对错误里的共享变量使用一致名称。

## 14. 属性测试

除了例子测试，可以检查性质：

### 合一正确性

若 `unify(a, b) = S` 成功，则：

$$
S(a)=S(b)
$$

### 替换组合

$$
(S_2\circ S_1)(t)=S_2(S_1(t))
$$

### 实例化的新鲜性

同一多态方案实例化两次，量化变量 ID 不应相同。

### 泛化不捕获环境变量

$$
\operatorname{bound}(
  \operatorname{generalize}(\Gamma,t)
)
\cap
\operatorname{ftv}(\Gamma)
=\varnothing
$$

## 15. 调试日志要记录信息流

一个有用的调试输出：

```text
SYNTH apply @ 4:3
  SYNTH variable map => forall a b. (a -> b) -> List a -> List b
  INSTANTIATE => (?1 -> ?2) -> List ?1 -> List ?2
  CHECK lambda <= ?1 -> ?2
    bind x : ?1
    SYNTH x => ?1
    ...
  SOLVE ?1 := Int
```

它比只打印最终替换更能说明错误从哪里产生，也与论文推导树建立直接对应。

## 16. 何时进入 higher-rank

在以下测试全部稳定后再扩展：

- rank-1 let 多态；
- 刚性变量与可求解变量能明确区分；
- 作用域退出时能检测变量逃逸；
- 注解能在 `check`/`synth` 之间切换；
- 错误保留 expected/actual 与来源。

进入 higher-rank 后，优先完整照一套经过证明的算法实现，不要把 HM 的对称合一随意延伸到 `forall` 内部。全称类型的实例化具有方向与作用域约束。

## 17. 完成定义

第一版可以用以下标准判断“做完了”：

1. 所有教程示例都能由手写 AST 运行；
2. 合一与替换性质测试通过；
3. `let id` 成功而 lambda 参数多态例子失败；
4. `fn x => x(x)` 给出无限类型错误；
5. 双向模式能用外层 `Int -> Int` 检查未标注 lambda；
6. 失败诊断同时说明期望、实际与约束来源；
7. 打印结果不暴露不稳定内部 ID。

做到这里，已经拥有一个足够扎实的实验平台，可以继续研究记录、代数数据类型、模式匹配、子类型或 higher-rank 多态。

## 本章检查点

- 实现中能区分打印名字与绑定变量的内部身份。
- 合一、替换、泛化和实例化各有独立测试。
- 错误对象会保存 expected、actual、源码位置与约束来源。
- 新增语言特性前，会先写判断式、明确变量权限和算法信息流。
