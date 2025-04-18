import { Environment } from "./environment.js";
import { ErrorReporter } from "./error-reporter.js";
import { ReturnThrow, RuntimeError } from "./error.js";
import type { Binary, Expr, Grouping, Literal, Unary, ExprVisitor, Variable, Assign, Logical, Call, Get, Set, This, Super } from "./expressions.js";
import { LoxClass, LoxInstance } from "./lox-class.js";
import { LoxCallable, LoxFunction } from "./lox-function.js";
import { Class, Return, type Block, type Expression, type Function, type If, type Print, type Stmt, type StmtVisitor, type Var, type While } from "./statements.js";
import type { Token } from "./types.js";

export class Interpreter implements ExprVisitor<unknown>, StmtVisitor<void> {
  readonly globals = new Environment();
  readonly #locals: Map<Expr, number> = new Map();
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

  resolve(expr: Expr, depth: number): void {
    this.#locals.set(expr, depth);
  }

  lookUpVariable(name: Token, expr: Expr): unknown {
    const distance = this.#locals.get(expr);
    if (distance !== undefined) {
      return this.#environment.getAt(distance, name.lexeme);
    }
    else {
      return this.globals.get(name);
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

    const distance = this.#locals.get(expr);
    if (distance !== undefined) {
      this.#environment.assignAt(distance, expr.name, value);
    }
    else {
      this.globals.assign(expr.name, value);
    }


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
    return this.lookUpVariable(expr.name, expr);
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
    if (value === null || value === undefined) return 'nil';
    return value.toString();
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

  visitFunctionStmt(stmt: Function): void {
    const func = new LoxFunction(stmt, this.#environment, false);
    this.#environment.define(stmt.name.lexeme, func);
  }

  visitReturnStmt(stmt: Return): void {
    let value: unknown = null;
    if (stmt.value !== null) {
      value = this.evaluate(stmt.value);
    }

    throw new ReturnThrow(value);
  }

  visitClassStmt(stmt: Class): void {
    let superclass: unknown = null;
    if (stmt.superclass) {
      superclass = this.evaluate(stmt.superclass);
      if (!(superclass instanceof LoxClass)) {
        throw new RuntimeError(stmt.superclass.name, 'Superclass must be a class.');
      }
    }

    this.#environment.define(stmt.name.lexeme, null);

    if (stmt.superclass) {
      this.#environment = new Environment(this.#environment);
      this.#environment.define("super", superclass);
    }

    const methods: Map<string, LoxFunction> = new Map();
    for (let method of stmt.methods) {
      const func = new LoxFunction(method, this.#environment, method.name.lexeme === 'init');
      methods.set(method.name.lexeme, func);
    }

    const newClass = new LoxClass(stmt.name.lexeme, superclass as LoxClass, methods);
    if (stmt.superclass) {
      this.#environment = this.#environment.enclosing as Environment;
    }
    this.#environment.assign(stmt.name, newClass);
  }

  visitGetExpr(expr: Get): unknown {
    const object = this.evaluate(expr.object);
    if (object instanceof LoxInstance) {
      return object.get(expr.name);
    }

    throw new RuntimeError(expr.name, 'Only class instances can have properties.');
  }

  visitSetExpr(expr: Set): unknown {
    const object = this.evaluate(expr.object);

    if (!(object instanceof LoxInstance)) {
      throw new RuntimeError(expr.name, 'Only instances can have fields.');
    }

    const value = this.evaluate(expr.value);
    object.set(expr.name, value);
    return value;
  }

  visitThisExpr(expr: This): unknown {
    return this.lookUpVariable(expr.keyword, expr);
  }

  visitSuperExpr(expr: Super): unknown {
    const distance = this.#locals.get(expr);
    if (distance === undefined) {
      throw new RuntimeError(expr.keyword, 'Error accessing superclass.');
    }
    const superclass = this.#environment.getAt(distance, 'super') as LoxClass;
    const object = this.#environment.getAt(distance - 1, 'this') as LoxInstance;
    const method = superclass.findMethod(expr.method.lexeme);

    if (!method) {
      throw new RuntimeError(expr.method, `Undefined property ${expr.method.lexeme}.`);
    }
    return method?.bind(object);
  }
}
