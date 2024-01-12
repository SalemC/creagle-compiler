$$
\begin{align}
    [\text{Program}] &\to [\text{Statement}]^* \\
    [\text{Statement}] &\to
    \begin{cases}
        \text{terminate}([\text{Expression}]); \\
        [\text{VariableDefinition}] = [\text{Expression}]; \\
        \text{identifier} = [\text{Expression}]; \\
        [\text{Scope}] \\
        \text{return} \space [\text{Expression}]; \\
        \text{if} \space ([\text{Expression}]) \space [\text{Scope}] \\
        \text{while} \space ([\text{Expression}]) \space [\text{Scope}] \\
        [\text{Type}] \space \text{identifier}([\text{VariableDefinition}]^*, ...) \space [\text{Scope}] \\
        [\text{Term}]
    \end{cases} \\
    [\text{Scope}] &\to [{\text{Statement}^*}] \\
    [\text{VariableDefinition}] &\to \space ?\text{mutable} \space [\text{Type}] \space \text{identifier} \\
    [\text{Type}] &\to
    \begin{cases}
        \text{?unsigned byte} \\
        \text{?unsigned short} \\
        \text{?unsigned integer} \\
        \text{?unsigned long} \\
    \end{cases} \\
    [\text{Expression}] &\to
    \begin{cases}
        [\text{Term}] \\
        [\text{BinaryExpression}] \\
    \end{cases} \\
    [\text{BinaryExpression}] &\to
    \begin{cases}
        [\text{Expression}] \ast [\text{Expression}] & \text{precedence} = 1 \\
        [\text{Expression}] \space / \space [\text{Expression}] & \text{precedence} = 1 \\
        [\text{Expression}] + [\text{Expression}] & \text{precedence} = 0 \\
        [\text{Expression}] - [\text{Expression}] & \text{precedence} = 0 \\
        [\text{Expression}] == [\text{Expression}] & \text{precedence} = 0 \\
        [\text{Expression}] \lt [\text{Expression}] & \text{precedence} = 0 \\
        [\text{Expression}] \lt= [\text{Expression}] & \text{precedence} = 0 \\
        [\text{Expression}] \gt [\text{Expression}] & \text{precedence} = 0 \\
        [\text{Expression}] \gt= [\text{Expression}] & \text{precedence} = 0 \\
    \end{cases} \\
    [\text{Term}] &\to
    \begin{cases}
        [\text{IntegerLiteral}] \\
        \text{identifier} \\
        \text{identifier}([\text{Expression}]^*, ...) \\
        ([\text{Expression}]) \\
    \end{cases} \\
    [\text{IntegerLiteral}] &\to \{1,2,3,\ldots,\infty\} \\
\end{align}
$$
