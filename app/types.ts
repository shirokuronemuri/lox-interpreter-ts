
export const tokenType = {
  LEFT_PAREN: 'LEFT_PAREN',
  RIGHT_PAREN: 'RIGHT_PAREN',
  LEFT_BRACE: 'LEFT_BRACE',
  RIGHT_BRACE: 'RIGHT_BRACE',
  COMMA: 'COMMA',
  DOT: 'DOT',
  MINUS: 'MINUS',
  PLUS: 'PLUS',
  SEMICOLON: 'SEMICOLON',
  SLASH: 'SLASH',
  STAR: 'STAR',
  EQUAL: 'EQUAL',
  EQUAL_EQUAL: 'EQUAL_EQUAL',
  EOF: 'EOF',
  BANG_EQUAL: "BANG_EQUAL",
  BANG: "BANG",
  LESS: 'LESS',
  LESS_EQUAL: 'LESS_EQUAL',
  GREATER: 'GREATER',
  GREATER_EQUAL: 'GREATER_EQUAL',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  IDENTIFIER: 'IDENTIFIER',
} as const;

export const reservedWords = {
  AND: 'and',
  CLASS: 'class',
  ELSE: 'else',
  FALSE: 'false',
  FOR: 'for',
  FUN: 'fun',
  IF: 'if',
  NIL: 'nil',
  OR: 'or',
  PRINT: 'print',
  RETURN: 'return',
  SUPER: 'super',
  THIS: 'this',
  TRUE: 'true',
  VAR: 'var',
  WHILE: 'while',
} as const;

export type ReservedWord = keyof typeof reservedWords;
export type TokenType = keyof typeof tokenType | ReservedWord;

export type Token = {
  type: TokenType;
  lexeme: string;
  literal: any;
  line: number;
};


export const functionType = {
  NONE: 'NONE',
  FUNCTION: 'FUNCTION',
  METHOD: 'METHOD',
} as const;
export type FunctionType = keyof typeof functionType;
