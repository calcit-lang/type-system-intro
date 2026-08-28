# 渐进类型：静态世界与动态世界怎样安全相接

TypeScript 程序员很熟悉这条迁移路线：

```ts
// 第一天：来自旧 JavaScript，暂时不知道结构
declare const input: any;

// 后来：逐步补出边界
type User = { name: string };
```

但“允许少写标注”还不足以定义渐进类型。严格的渐进类型研究三个问题：

1. 未知类型与静态类型怎样比较；
2. 静态区和动态区交界时插入什么运行时检查；
3. 检查失败时，错误责任应该落在哪一侧。

## 1. 动态类型不是顶类型

用 $?$ 表示动态未知类型：

$$
A ::= \mathrm{Int}
\mid \mathrm{Bool}
\mid A\to B
\mid ?
$$

$?$ 的意思是：“这个位置暂时缺少静态精度，运行时再检查。”

它不是普通子类型层次中的顶类型 $\top$：

- $A<:\top$ 通常表示任何 $A$ 都能安全向上转换；
- $?$ 与 $A$ 之间允许双向跨越，但其中一个方向必须加入运行时检查；
- 从 $?\to?$ 取出函数结果时，不能凭静态规则直接断言它一定是 `Int`。

TypeScript 的 `unknown`、`any` 与理论 $?$ 也不完全相同：

- `unknown` 要求使用前缩小；
- `any` 会关闭许多静态检查，并传播；
- 理论渐进类型通常给边界 cast 明确定义运行语义。

## 2. 类型一致性：允许信息不完整

经典相等要求两个类型结构完全一致。渐进系统常引入一致性关系：

$$
A\sim B
$$

读作：“$A$ 与 $B$ 在现有精度下不冲突。”

基础规则：

$$
\frac{}{?\sim A}
\qquad
\frac{}{A\sim ?}
$$

$$
\frac{}{
\mathrm{Int}\sim\mathrm{Int}
}
$$

函数按组成部分一致：

$$
\frac{
  A_1\sim A_2
  \qquad
  B_1\sim B_2
}{
  A_1\to B_1
  \sim
  A_2\to B_2
}
$$

因此：

$$
?\to\mathrm{Int}
\sim
\mathrm{Bool}\to?
$$

因为参数处 $?\sim\mathrm{Bool}$，结果处 $\mathrm{Int}\sim?$。

但：

$$
\mathrm{Int}\not\sim\mathrm{Bool}
$$

两边都是精确且冲突的类型。

## 3. 一致性不是等价关系

相等是传递的：

$$
A=B\land B=C\Rightarrow A=C
$$

一致性通常不传递。因为：

$$
\mathrm{Int}\sim?
\qquad
?\sim\mathrm{Bool}
$$

但：

$$
\mathrm{Int}\not\sim\mathrm{Bool}
$$

这条反例非常重要。若实现把 $\sim$ 当作普通等价类或可传递闭包，就会错误接受静态冲突。

一致性也不是“两个类型有公共子类型”，更不是 HM 的合一。它描述精确信息与未知信息之间的兼容。

## 4. 精度关系：谁知道得更多

渐进类型还需要区分“兼容”与“精度”。常用记法：

$$
A\sqsubseteq B
$$

本文约定读作：“$A$ 不比 $B$ 更精确”，也就是 $B$ 至少知道得和 $A$ 一样多。

于是：

$$
?\sqsubseteq\mathrm{Int}
$$

$$
?\to?
\sqsubseteq
\mathrm{Int}\to\mathrm{Bool}
$$

不同论文可能把箭头方向反过来。不要背图形方向，应先看作者对“more precise”的定义和例子。

两种关系承担不同任务：

- $A\sim B$：两边能否在边界相接；
- $A\sqsubseteq B$：哪一边包含更多静态信息。

## 5. 表面类型判断

一个教学化的应用规则：

$$
\frac{
  \Gamma\vdash e_1:A\to B
  \qquad
  \Gamma\vdash e_2:A'
  \qquad
  A'\sim A
}{
  \Gamma\vdash e_1\ e_2:B
}
$$

若函数期望 `Int`，实参类型是 $? $，一致性允许表面程序通过：

$$
?\sim\mathrm{Int}
$$

但这里欠下了一笔运行时检查。仅把规则写成“接受”还没有完整语义。

## 6. Cast calculus：把欠下的检查写出来

表面程序：

```text
let f: Int -> Int = ...
let x: ? = dynamicInput()
f x
```

细化翻译可以插入 cast：

$$
f\ (x\langle ?\Rightarrow\mathrm{Int}\rangle)
$$

记号：

- $e\langle A\Rightarrow B\rangle$：把已知为 $A$ 的值当作 $B$；
- $A\Rightarrow B$ 不是逻辑蕴含，而是一次运行时类型边界；
- 若值的运行时标签符合 $B$，cast 成功；
- 否则程序产生动态类型错误。

从精确类型进入动态世界：

$$
42\langle\mathrm{Int}\Rightarrow?\rangle
$$

通常只需包装或附带类型标签。

从动态世界回到精确类型：

$$
v\langle?\Rightarrow\mathrm{Int}\rangle
$$

必须检查 $v$ 是否真是整数。

## 7. 函数 cast 为什么不能只看外壳

假设：

$$
f:?\to?
$$

要把它当作：

$$
\mathrm{Int}\to\mathrm{Bool}
$$

不能只在转换瞬间检查“它是函数”。还必须在每次调用时：

1. 把外部 `Int` 参数转换到原函数期望的 $? $；
2. 调用原函数；
3. 把动态结果从 $? $ 检查为 `Bool`。

可理解为生成代理：

$$
\lambda x:\mathrm{Int}.
\bigl(
  f\,
  (x\langle\mathrm{Int}\Rightarrow?\rangle)
\bigr)
\langle?\Rightarrow\mathrm{Bool}\rangle
$$

函数参数仍体现逆变方向：外部调用者交来的值要送进原函数；返回值沿协变方向送回外部。

## 8. Blame：失败是谁的责任

边界通常带标签：

$$
e\langle A\Rightarrow B\rangle^{\ell}
$$

$\ell$ 记录模块、源码位置或边界一侧。若 cast 失败，运行时报告 blame $\ell$。

为什么需要它？考虑：

- 静态模块承诺向外提供 `Int -> Int`；
- 动态模块交回一个实际上返回字符串的函数；
- 错误在静态模块调用之后才暴露。

好的 blame 规则应指出违反边界契约的一侧，而不是只说“某个 cast 失败”。

论文中的正/负标签、极性翻转和 blame theorem 会更形式化。新手先记住：高阶值跨边界时，责任也必须沿代理传播。

## 9. 渐进保证在保证什么

“加标注不应随意改变程序体验”可形式化为 gradual guarantee 的不同版本。

静态方向的直觉：

> 把精确类型替换成更不精确的 $? $，不应突然产生新的编译期拒绝。

动态方向的直觉：

> 改变标注精度后，程序结果应保持相关；差异主要来自更早或更晚触发的 cast 错误。

这不是说“增加任意标注永远不改变行为”。标注会改变插入的 cast、优化机会和错误发生位置。正式定理会精确定义程序精度关系以及允许观察到的差异。

## 10. TypeScript 为什么只是近亲

TypeScript 非常适合建立迁移动机：

```ts
function greet(value: unknown): string {
  if (
    typeof value === "object" &&
    value !== null &&
    "name" in value
  ) {
    return String(value.name);
  }
  return "Hello";
}
```

但 TypeScript 的主要设计目标包括：

- 与现有 JavaScript 生态兼容；
- 结构类型和复杂类型级编程；
- 类型擦除；
- 有意允许某些不健全但实用的赋值；
- `any`、`unknown`、类型断言具有不同语义。

经典渐进演算则通常定义明确的动态类型、cast 和运行错误语义。因此可以说 TypeScript 提供渐进迁移经验，但不能把整门语言简单等同于某个健全的 gradual calculus。

## 11. `any`、`unknown`、$?$、$\top$ 对照

| 概念 | 能否直接调用/访问 | 回到具体类型是否检查 | 理论角色 |
| --- | --- | --- | --- |
| TypeScript `any` | 基本允许 | 经常没有可靠运行时检查 | 静态检查逃生口 |
| TypeScript `unknown` | 先缩小 | 由控制流或用户代码确认 | 安全顶层输入 |
| 渐进类型 $? $ | 由演算规则决定 | 通常插入 cast | 缺少静态精度 |
| 顶类型 $\top$ | 只能用顶类型公开操作 | 不自动恢复具体类型 | 子类型层次的最大元素 |

一个名字看起来都表示“不知道”，但它们允许的操作和承诺完全不同。

## 12. 与双向类型检查的配合

渐进语言也可以把 typing 拆成综合和检查。

当 lambda 没有参数标注且外部也没有期望类型时，系统可选择：

- 拒绝并要求标注；
- 把参数设为 $? $；
- 创建推断变量，稍后求解。

这三种设计给出不同的错误时机与迁移体验。

按期望函数类型检查：

$$
\frac{
  \Gamma,x:A\vdash e\Leftarrow B
}{
  \Gamma\vdash
  \lambda x.e
  \Leftarrow
  A\to B
}
$$

仍然能减少不必要的动态未知。渐进类型不是“所有缺失标注都变成 any”，它也可以积极利用已知期望类型。

## 13. 边界、FFI 与反序列化

最值得使用动态边界的位置通常是真实不确定来源：

- JSON；
- 网络响应；
- 插件；
- FFI；
- 旧模块；
- 用户输入。

一个稳健模式：

```ts
const raw: unknown = JSON.parse(text);
const user: User = decodeUser(raw); // 检查集中在这里
useUser(user);                      // 内部保持精确
```

理论上的 cast boundary 与工程上的 decoder 有相同精神：把不确定性压在边界，不让它无声传播到整个内部程序。

## 14. 与精化类型的区别

两者都可能含运行时检查，却回答不同问题。

渐进类型：

$$
?
\Rightarrow
\mathrm{Int}
$$

问：“这个动态值是否具有目标类型的运行形状？”

精化类型：

$$
\{\nu:\mathrm{Int}\mid\nu>0\}
$$

问：“这个整数是否满足更精确的逻辑性质？”

系统可以组合两者：先检查输入是整数，再验证或动态检查它为正数。

## 15. 实现一条渐进边界需要什么

一个最小实现至少要有：

```ts
type Type =
  | { tag: "int" }
  | { tag: "bool" }
  | { tag: "function"; from: Type; to: Type }
  | { tag: "dynamic" };

type Cast = {
  from: Type;
  to: Type;
  blame: SourceSpan;
};
```

并分别实现：

1. consistency：能否相接；
2. precision：哪一边更精确；
3. elaboration：在哪里插入 cast；
4. runtime cast：基础值检查与高阶代理；
5. blame：失败定位；
6. 与优化器的交互：不能删掉会影响错误语义的检查。

## 16. 阅读渐进类型论文的清单

1. 动态类型写作 $? $、`Dyn` 还是星号？
2. 一致性关系如何定义，是否明确不传递？
3. 精度关系方向是什么？
4. 表面语言怎样翻译到 cast calculus？
5. 函数、record、引用的 cast 如何包装？
6. blame 标签怎样传播？
7. 论文证明哪一种 gradual guarantee？
8. 状态、对象身份和并发是否影响行为定理？

## 本章检查点

- 能说明 $? $ 与顶类型、`any`、`unknown`的区别。
- 能给出一致性不传递的反例。
- 能解释从动态类型回到精确类型为什么必须插入 cast。
- 能拆解高阶函数边界中的参数 cast 与结果 cast。
- 能说明渐进类型理论不等于“标注可写可不写”。
