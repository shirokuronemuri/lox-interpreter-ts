import { ErrorReporter } from "./error-reporter.js";
import { Binary, Expr, Grouping, Literal, Unary } from "./expressions.js";
import type { Token, TokenType } from "./types.js";

class ParseError extends SyntaxError { }

export class Parser {
  #tokens: Token[];
  #position: number = 0;
  constructor(tokens: Token[]) {
    this.#tokens = tokens;
  }

  peek(): Token {
    const token = this.#tokens[this.#position];
    if (!token) {
      throw new Error(`accessing next token at index out of bounds: ${this.#position}`);
    }
    return token;
  }

  isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  check(type: TokenType): boolean {
    if (this.isAtEnd()) {
      return false;
    }
    return this.peek().type === type;
  }

  advance(): Token {
    if (!this.isAtEnd()) {
      ++this.#position;
    }
    return this.previous();
  }

  previous(): Token {
    const token = this.#tokens[this.#position - 1];
    if (!token) {
      throw new Error(`accessing previous token at index out of bounds: ${this.#position}`);
    }
    return token;
  }

  match(...types: TokenType[]): boolean {
    for (let type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }
    throw this.error(this.peek(), message);
  }

  error(token: Token, message: string) {
    if (token.type === 'EOF') {
      ErrorReporter.report(token.line, ' at end', message);
    }
    else {
      ErrorReporter.report(token.line, ` at '${token.lexeme}'`, message);
    }
    return new ParseError();
  }

  equality(): Expr {
    let expr = this.comparison();

    while (this.match('BANG_EQUAL', 'EQUAL_EQUAL')) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  comparison(): Expr {
    let expr = this.term();

    while (this.match('LESS', 'LESS_EQUAL', 'GREATER', 'GREATER_EQUAL')) {
      const operator = this.previous();
      const right = this.term();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  term(): Expr {
    let expr = this.factor();

    while (this.match('PLUS', 'MINUS')) {
      const operator = this.previous();
      const right = this.factor();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  factor(): Expr {
    let expr = this.unary();

    while (this.match('STAR', 'SLASH')) {
      const operator = this.previous();
      const right = this.unary();
      expr = new Binary(expr, operator, right);
    }

    return expr;
  }

  unary(): Expr {
    if (this.match('BANG', 'MINUS')) {
      const operator = this.previous();
      const right = this.unary();
      return new Unary(operator, right);
    }

    return this.primary();
  }

  primary(): Expr {
    if (this.match('TRUE')) return new Literal(true);
    if (this.match('FALSE')) return new Literal(false);
    if (this.match('NIL')) return new Literal(null);

    if (this.match('NUMBER', 'STRING')) {
      return new Literal(this.previous().literal);
    }

    if (this.match('LEFT_PAREN')) {
      const expr = this.expression();
      this.consume('RIGHT_PAREN', 'Expected ")" after expression.');
      return new Grouping(expr);
    }

    throw this.error(this.peek(), "Expression expected.");
  }

  expression(): Expr {
    return this.equality();
  }

  parse(): Expr | null {
    try {
      return this.expression();
    }
    catch (err) {
      if (err instanceof ParseError) {
        return null;
      }
      else {
        console.error(`something went very wrong: ${err}`);
        process.exit(1);
      }
    }
  }
}
