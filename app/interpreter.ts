import { ErrorReporter } from "./error-reporter.js";
import type { Binary, Expr, Grouping, Literal, Unary, ExprVisitor, Variable, Assign, Logical, Call } from "./expressions.js";
import type { Block, Expression, If, Print, Stmt, StmtVisitor, Var, While } from "./statements.js";
import type { Token } from "./types.js";

abstract class LoxCallable {
  abstract arity(): number;
  abstract call(interpreter: Interpreter, args: unknown[]): unknown;
  abstract toString(): string;
}

class RuntimeError extends Error {
  constructor(public readonly token: Token, message: string) {
    super(message);
  }
}

class Environment {
  #values: Map<string, unknown> = new Map();

  constructor(public readonly enclosing: Environment | null = null) { }

  define(name: string, value: unknown) {
    this.#values.set(name, value);
  }

  assign(name: Token, value: unknown) {
    if (this.#values.has(name.lexeme)) {
      this.#values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing !== null) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable "${name.lexeme}".`);
  }

  get(name: Token): unknown {
    if (this.#values.has(name.lexeme)) {
      return this.#values.get(name.lexeme);
    }

    if (this.enclosing !== null) {
      return this.enclosing.get(name);
    }

    throw new RuntimeError(name, `Undefined variable ${name.lexeme}.`);
  }
}

export class Interpreter implements ExprVisitor<unknown>, StmtVisitor<void> {
  readonly globals = new Environment();
  #environment = this.globals;

  constructor() {
    this.globals.define('clock', new class extends LoxCallable {
      override arity(): number {
        return 0;
      }

      override call(interpreter: Interpreter, args: unknown[]): unknown {
        return Math.floor(Date.now() / 1000);
      }

      override toString(): string {
        return "<native fn>";
      }
    });
  }

  isTruthy(value: unknown): boolean {
    if (value === null) return false;
    if (typeof value === 'boolean') return value;
    return true;
  }

  checkNumberOperand(operator: Token, right: unknown): void {
    if (typeof right === 'number') return;
    throw new RuntimeError(operator, 'Operand must be a number.');
  };
  checkNumberOperands(operator: Token, left: unknown, right: unknown): void {
    if (typeof left === 'number' && typeof right === 'number') return;
    throw new RuntimeError(operator, 'Operands must be numbers.');
  };

  evaluate(expr: Expr): unknown {
    return expr.accept(this);
  }

  execute(stmt: Stmt): void {
    stmt.accept(this);
  }

  interpretOne(expr: Expr) {
    try {
      const value = this.evaluate(expr);
      console.log(this.stringify(value));
    }
    catch (err) {
      if (err instanceof RuntimeError) {
        ErrorReporter.report(err.token.line, ` at ${err.token.lexeme}`, err.message);
      }
      else {
        console.error(`something went very wrong: ${err}`);
        process.exit(1);
      }
    }
  }

  interpret(statements: Stmt[]): void {
    try {
      for (let statement of statements) {
        this.execute(statement);
      }
    }
    catch (err) {
      if (err instanceof RuntimeError) {
        ErrorReporter.report(err.token.line, ` at ${err.token.lexeme}`, err.message);
      }
      else {
        console.error(`something went very wrong: ${err}`);
        process.exit(1);
      }
    }
  }

  visitLiteralExpr(expr: Literal): unknown {
    return expr.value;
  }

  visitBinaryExpr(expr: Binary): unknown {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case 'STAR': {
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) * (right as number);
      }
      case 'SLASH': {
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) / (right as number);
      }
      case 'PLUS': {
        if (typeof left === 'string' && typeof right === 'string') {
          return left + right;
        }
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) + (right as number);
      }
      case 'MINUS': {
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) - (right as number);
      }
      case 'GREATER': {
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) > (right as number);
      }
      case 'GREATER_EQUAL': {
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) >= (right as number);
      }
      case 'LESS': {
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) < (right as number);
      }
      case 'LESS_EQUAL': {
        this.checkNumberOperands(expr.operator, left, right);
        return (left as number) <= (right as number);
      }
      case 'EQUAL_EQUAL': {
        return left === right;
      }
      case 'BANG_EQUAL': {
        return left !== right;
      }
    }

    return null;
  }

  visitAssignExpr(expr: Assign): unknown {
    const value = this.evaluate(expr.value);
    this.#environment.assign(expr.name, value);
    return value;
  }

  visitGroupingExpr(expr: Grouping): unknown {
    return expr.expression.accept(this);
  }

  visitUnaryExpr(expr: Unary): unknown {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case 'BANG': {
        return !this.isTruthy(right);
      }
      case 'MINUS': {
        this.checkNumberOperand(expr.operator, right);
        return -(right as number);
      }
    }

    return null;
  }

  visitVarStmt(stmt: Var): void {
    let value = null;
    if (stmt.initializer !== null) {
      value = this.evaluate(stmt.initializer);
    }

    this.#environment.define(stmt.name.lexeme, value);
  }

  visitVariableExpr(expr: Variable): unknown {
    return this.#environment.get(expr.name);
  }

  visitLogicalExpr(expr: Logical): unknown {
    const left = this.evaluate(expr.left);

    if (expr.operator.type === 'OR') {
      if (this.isTruthy(left)) return left;
    }
    else {
      if (!this.isTruthy(left)) return left;
    }

    return this.evaluate(expr.right);
  }

  visitCallExpr(expr: Call): unknown {
    const callee = this.evaluate(expr.callee);

    if (!(callee instanceof LoxCallable)) {
      throw new RuntimeError(expr.paren, 'Can only call functions and classes');
    }

    const args: unknown[] = [];
    for (let arg of expr.args) {
      args.push(this.evaluate(arg));
    }

    const func = callee as LoxCallable;
    if (args.length !== func.arity()) {
      throw new RuntimeError(expr.paren, `Expected ${func.arity()} arguments but got ${args.length}.`);
    }

    return func.call(this, args);
  }

  stringify(value: unknown) {
    if (value === null) return 'nil';
    return value;
  }

  visitExpressionStmt(stmt: Expression): void {
    this.evaluate(stmt.expression);
  }

  visitPrintStmt(stmt: Print): void {
    const value = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
  }


  visitBlockStmt(stmt: Block): void {
    this.executeBlock(stmt.statements, new Environment(this.#environment));
  }

  executeBlock(statements: Stmt[], environment: Environment) {
    const previousEnv = this.#environment;
    try {
      this.#environment = environment;

      for (let statement of statements) {
        this.execute(statement);
      }
    }
    finally {
      this.#environment = previousEnv;
    }
  }

  visitIfStmt(stmt: If): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    }
    else if (stmt.elseBranch) {
      this.execute(stmt.elseBranch);
    }
  }

  visitWhileStmt(stmt: While): void {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
  }
}
