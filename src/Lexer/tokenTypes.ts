export const DATA_TYPES = {
    byte: 'byte',
    short: 'short',
    integer: 'integer',
    long: 'long',
} as const;

export const KEYWORDS = {
    ...DATA_TYPES,
    unsigned: 'unsigned',
    mutable: 'mutable',
    let: 'let',
    return: 'return',
    true: 'true',
    false: 'false',
    if: 'if',
    else: 'else',
    terminate: 'terminate',
    while: 'while',
} as const;

export const SYMBOLS = {
    semicolon: 'semicolon',
    assignment: 'assignment',
    equal: 'equal',
    bang: 'bang',
    notEqual: 'not_equal',
    greaterThan: 'greater_than',
    greaterThanOrEqual: 'greater_than_or_equal',
    lessThan: 'less_than',
    lessThanOrEqual: 'less_than_or_equal',
    openCurlyBrace: 'open_curly_brace',
    closeCurlyBrace: 'close_curly_brace',
    openParenthesis: 'open_parenthesis',
    closeParenthesis: 'close_parenthesis',
    plus: 'plus',
    hyphen: 'hyphen',
    forwardSlash: 'forward_slash',
    asterisk: 'asterisk',
    comma: 'comma',
    identifier: 'identifier',
} as const;

export const TOKEN_TYPES = {
    ...KEYWORDS,
    ...SYMBOLS,
    illegal: 'illegal',
    eof: 'eof',
    integer: 'integer',
} as const;
