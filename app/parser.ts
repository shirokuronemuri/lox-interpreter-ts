import { ErrorReporter } from "./error-reporter.js";
import { ParseError } from "./error.js";
import { Assign, Binary, Call, Expr, Grouping, Literal, Logical, Unary, Variable } from "./expressions.js";
import { Block, Class, Expression, Function, If, Print, Return, Stmt, Var, While } from "./statements.js";
import { functionType, type FunctionType, type Token, type TokenType } from "./types.js";


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

  synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === 'SEMICOLON') return;

      switch (this.peek().type) {
        case 'CLASS':
        case 'FUN':
        case 'VAR':
        case 'FOR':
        case 'IF':
        case 'WHILE':
        case 'PRINT':
        case 'RETURN':
          return;
      }

      this.advance();
    }
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

  assignment(): Expr {
    const expr = this.or();
    if (this.match('EQUAL')) {
      const equals = this.previous();
      const value = this.assignment();
      if (expr instanceof Variable) {
        const name = expr.name;
        return new Assign(name, value);
      }

      this.error(equals, "Invalid assignment target.");
    }

    return expr;
  }

  or(): Expr {
    let expr = this.and();
    while (this.match('OR')) {
      const operator = this.previous();
      const right = this.and();
      expr = new Logical(expr, operator, right);
    }
    return expr;
  }

  and(): Expr {
    let expr = this.equality();
    while (this.match('AND')) {
      const operator = this.previous();
      const right = this.equality();
      expr = new Logical(expr, operator, right);
    }
    return expr;
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

    return this.call();
  }

  call(): Expr {
    let expr = this.primary();

    while (true) {
      if (this.match('LEFT_PAREN')) {
        expr = this.finishCall(expr);
      }
      else {
        break;
      }
    }

    return expr;
  }

  finishCall(callee: Expr): Expr {
    const args: Expr[] = [];
    if (!this.check('RIGHT_PAREN')) {
      args.push(this.expression());
      while (this.match('COMMA')) {
        if (args.length > 255) {
          this.error(this.peek(), 'Can\'t have more than 255 arguments.');
        }
        args.push(this.expression());
      }
    }

    const paren = this.consume('RIGHT_PAREN', 'Expected ")" after arguments.');
    return new Call(callee, paren, args);
  }

  primary(): Expr {
    if (this.match('TRUE')) return new Literal(true);
    if (this.match('FALSE')) return new Literal(false);
    if (this.match('NIL')) return new Literal(null);

    if (this.match('NUMBER', 'STRING')) {
      return new Literal(this.previous().literal);
    }

    if (this.match('IDENTIFIER')) {
      return new Variable(this.previous());
    }

    if (this.match('LEFT_PAREN')) {
      const expr = this.expression();
      this.consume('RIGHT_PAREN', 'Expected ")" after expression.');
      return new Grouping(expr);
    }

    throw this.error(this.peek(), "Expression expected.");
  }

  expression(): Expr {
    return this.assignment();
  }

  printStatement(): Stmt {
    const value: Expr = this.expression();
    this.consume('SEMICOLON', 'Expected ";" after value');
    return new Print(value);
  }

  expressionStatement(): Stmt {
    const expr: Expr = this.expression();
    this.consume('SEMICOLON', 'Expected ";" after expression');
    return new Expression(expr);
  }

  varDeclaration(): Stmt {
    const name = this.consume('IDENTIFIER', 'Expected variable name.');

    let initializer: Expr | null = null;
    if (this.match('EQUAL')) {
      initializer = this.expression();
    }

    this.consume('SEMICOLON', 'Expected ";" after variable declaration.');
    return new Var(name, initializer);
  }

  block(): Stmt[] {
    const statements: (Stmt | null)[] = [];
    while (!this.check('RIGHT_BRACE') && !this.isAtEnd()) {
      statements.push(this.declaration());
    }

    this.consume('RIGHT_BRACE', "Expected } after block.");
    return statements.filter(stmt => stmt !== null);
  }

  ifStatement(): Stmt {
    this.consume('LEFT_PAREN', 'Expected "(" after "if".');
    const condition = this.expression();
    this.consume('RIGHT_PAREN', 'Expected ")" after condition.');
    const thenBranch = this.statement();
    let elseBranch: Stmt | null = null;
    if (this.match('ELSE')) {
      elseBranch = this.statement();
    }

    return new If(condition, thenBranch, elseBranch);
  }

  whileStatement(): Stmt {
    this.consume('LEFT_PAREN', 'Expected "(" after "while".');
    const condition = this.expression();
    this.consume('RIGHT_PAREN', 'Expected ")" after condition.');
    const body = this.statement();

    return new While(condition, body);
  }

  forStatement(): Stmt {
    this.consume('LEFT_PAREN', 'Expected "(" after "for".');

    let initializer: Stmt | null;
    if (this.match('SEMICOLON')) {
      initializer = null;
    }
    else if (this.match('VAR')) {
      initializer = this.varDeclaration();
    }
    else {
      initializer = this.expressionStatement();
    }

    let condition: Expr | null = null;
    if (!this.check('SEMICOLON')) {
      condition = this.expression();
    }
    this.consume('SEMICOLON', 'Expected ";" after loop condition.');

    let increment: Expr | null = null;
    if (!this.check('RIGHT_PAREN')) {
      increment = this.expression();
    }
    this.consume('RIGHT_PAREN', 'Expected ")" after for clause.');

    let body = this.statement();

    if (increment != null) {
      body = new Block([body, new Expression(increment)]);
    }

    if (condition === null) {
      condition = new Literal(true);
    }
    body = new While(condition, body);

    if (initializer != null) {
      body = new Block([initializer, body]);
    }

    return body;
  }

  returnStatement(): Stmt {
    const keyword = this.previous();
    let value: Expr | null = null;
    if (!this.check('SEMICOLON')) {
      value = this.expression();
    }

    this.consume('SEMICOLON', 'Expected semicolon after return value.');
    return new Return(keyword, value);
  }

  statement(): Stmt {
    if (this.match('IF')) return this.ifStatement();
    if (this.match('WHILE')) return this.whileStatement();
    if (this.match('FOR')) return this.forStatement();
    if (this.match('PRINT')) return this.printStatement();
    if (this.match('RETURN')) return this.returnStatement();
    if (this.match('LEFT_BRACE')) return new Block(this.block());

    return this.expressionStatement();
  }

  function(type: FunctionType) {
    const name = this.consume('IDENTIFIER', `expected ${type} name.`);
    this.consume('LEFT_PAREN', `expected "(" after ${type} name.`);
    const params: Token[] = [];
    if (!this.check('RIGHT_PAREN')) {
      params.push(this.consume('IDENTIFIER', 'Expected parameter name.'));
      while (this.match('COMMA')) {
        if (params.length >= 255) {
          this.error(this.peek(), 'Can\'t have more than 255 parameters');
        }
        params.push(this.consume('IDENTIFIER', 'Expected parameter name.'));
      }
    }
    this.consume('RIGHT_PAREN', 'Expected ")" after parameters.');

    this.consume('LEFT_BRACE', `Expected "{" before ${type} body.`);
    const body = this.block();
    return new Function(name, params, body);
  }

  classDeclaration(): Stmt {
    const name = this.consume('IDENTIFIER', 'Expected class name.');
    this.consume('LEFT_BRACE', 'Expected "{" before class body.');
    const methods: Function[] = [];
    while (!this.check('RIGHT_BRACE') && !this.isAtEnd()) {
      methods.push(this.function(functionType.METHOD));
    }

    this.consume('RIGHT_BRACE', 'Expected "}" after class body.');
    return new Class(name, methods);
  }

  declaration(): Stmt | null {
    try {
      if (this.match('CLASS')) return this.classDeclaration();
      if (this.match('FUN')) return this.function(functionType.FUNCTION);
      if (this.match('VAR')) return this.varDeclaration();

      return this.statement();
    }
    catch (err) {
      if (err instanceof ParseError) {
        this.synchronize();
        return null;
      }
      else {
        console.error(`something went very wrong: ${err}`);
        process.exit(1);
      }
    }
  }

  parseOne(): Expr | null {
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

  parse(): (Stmt | null)[] {
    const statements: (Stmt | null)[] = [];
    while (!this.isAtEnd()) {
      try {
        statements.push(this.declaration());
      }
      catch (err) {
        if (err instanceof ParseError) {
          break;
        }
        else {
          console.error(`something went very wrong: ${err}`);
          process.exit(1);
        }
      }
    }

    return statements;
  }
}
