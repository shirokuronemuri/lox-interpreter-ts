import { AstPrinter, Expr, Literal } from "./expressions.js";
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

  primary(): Expr {
    if (this.match('TRUE')) return new Literal(true);
    if (this.match('FALSE')) return new Literal(false);
    if (this.match('NIL')) return new Literal(null);

    if (this.match('NUMBER')) {
      return new Literal(this.previous().literal);
    }

    throw new ParseError("unsupported syntax");
  }

  expression(): Expr {
    return this.primary();
  }

  parse(): Expr | null {
    try {
      return this.expression();
    }
    catch (err) {
      if (err instanceof ParseError) {
        console.error(err.message);
        return null;
      }
      else {
        console.error(`something went very wrong: ${err}`);
        process.exit(1);
      }
    }
  }
}
