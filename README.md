# Custom Language (Creagle) Compiler in TypeScript

This repository contains a simple compiler built in TypeScript for a completely custom language. Please note that this compiler is not intended for practical use but serves as a reference implementation for understanding the basic concepts of compiler design and construction. It was developed as a personal learning project to explore the inner workings of compilers.

Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Structure](#structure)
- [Contributing](#contributing)
- [License](#license)

## Introduction

Understanding how compilers work is a complex yet essential aspect of programming language development. This project aims to provide insights into the compilation process by implementing a compiler for a custom language using TypeScript.

## Features

- **Lexer and Parser**: The compiler includes a lexer and parser for the custom language to convert source code into an abstract syntax tree (AST).
- **Semantic Analysis**: Basic semantic analysis is performed during parsing to check for simple language rules and enforce basic constraints.
- **Code Generation**: The compiler generates x86-64 Linux assembly code from the AST.
- **Example Language**: The custom language is designed to be minimal and straightforward, allowing for a clear understanding of the compilation process.

## Structure

The project structure is organized as follows:

- `src/`: Contains the source code of the compiler.
    - `Lexer/index.ts`: Implements the lexer for tokenization.
    - `Parser/index.ts`: Implements the parser for creating an abstract syntax tree (AST).
    - `Generator/index.ts`: Implements the generator for generating x86-64 Linux assembly code.
    - `main.ts`: Entry point for the compiler.
 
## Contributing

Contributions to improve the code, add features, or fix bugs are welcome. If you find any issues or have suggestions, please open an [issue](https://github.com/SalemC/creagle-compiler/issues/new).

## License

This project is licensed under the [MIT License](https://github.com/SalemC/creagle-compiler/blob/main/LICENSE). Feel free to use the code for educational purposes or as a reference.
