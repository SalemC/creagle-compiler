$$
\begin{align}
    [\text{Program}] &\to [\text{Statement}]^* \\
    [\text{Statement}] &\to
    \begin{cases}
        \text{terminate}([\text{Expr}]); \\
        \text{const} \space \text{identifier} = [\text{Expr}]; \\
    \end{cases} \\

    [\text{Expr}] &\to
    \begin{cases}
        [\text{Term}] \\
    \end{cases} \\

    [\text{Term}] &\to
    \begin{cases}
        \text{IntegerLiteral} \\
        \text{identifier} \\
    \end{cases} \\

    [\text{IntegerLiteral}] &\to \{1,2,3,\ldots,\infty\} \\
\end{align}
$$
