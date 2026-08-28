# 给普通程序员的类型系统导论

这是一份从程序员视角出发的类型系统教程。它不假定读者学过数理逻辑，也不会把论文里的公式当作“不证自明”的语言。教程使用 React + Vinext/Vite 构建成静态阅读站点，Markdown 中的数学公式由 KaTeX 渲染。

教程特别关注两条路线：

- **Hindley–Milner（HM）类型系统**：为什么 ML/Haskell 风格的代码常常不写类型也能得到一个最一般的类型；
- **双向类型检查（bidirectional typing）**：为什么把“推导类型”和“按已知类型检查”拆成两个方向，能让更强的类型系统仍然容易实现、容易理解。

每个公式都尽量按以下顺序讲解：先给直觉，再列符号表，然后逐项朗读，最后用代码走一遍推导。

## 本地阅读

安装依赖并启动开发站点：

```bash
npm install
npm run dev
```

构建可发布到任意子目录的静态页面：

```bash
npm run build
```

发布内容位于 `dist/client/`。构建前会严格检查所有 Markdown 内部链接，并使用与页面相同的 KaTeX 引擎逐一解析公式；任何非法公式都会让构建失败。

也可以直接从 [`docs/introduction.md`](docs/introduction.md) 阅读原始 Markdown，章节顺序记录在 [`docs/SUMMARY.md`](docs/SUMMARY.md)。

## 文档边界

这不是一份覆盖所有类型理论的百科全书。第一阶段集中讲清：

1. 类型判断式和推导树怎样读；
2. 自由类型变量、替换、合一、实例化、泛化分别在做什么；
3. HM 的声明式规则与 Algorithm W 如何对应；
4. 双向系统中的综合（synthesis）与检查（checking）如何配合；
5. 从论文规则落到一个可实现的类型检查器时，需要哪些数据结构和错误信息。

## 约定

- 示例语言采用接近 TypeScript/ML 的伪代码，不绑定某门语言；
- `Int`、`Bool`、`String` 是基础类型；
- `a -> b` 表示函数类型，箭头向右结合；
- 数学公式使用 LaTeX，由 `remark-math` 与 KaTeX 渲染；
- “推断”有时是宽泛说法；在双向章节中会严格区分“综合”和“检查”。

## 参考资料

核心论文与延伸阅读集中在 [`docs/references.md`](docs/references.md)。正文会明确区分：哪些是经典系统本身，哪些是为了教学而做的简化。

## License

MIT
