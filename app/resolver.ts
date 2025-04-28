//prettier-ignore
import type { Assign, Binary, Call, Expr, ExprVisitor, Get, Grouping, Literal, Logical, Set, Super, This, Unary, Variable } from "./expressions.js";
//prettier-ignore
import type { Block, Class, Expression, Function, If, Print, Return, Stmt, StmtVisitor, Var, While } from "./statements.js";
//prettier-ignore
import { classType, functionType, type ClassType, type FunctionType, type Token } from "./types.js";
import { ErrorReporter } from "./error-reporter.js";
import type { Interpreter } from "./interpreter.js";
import { Stack } from "./util/stack.js";

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  readonly scopes: Stack<Map<string, boolean>> = new Stack();
  #currentFunction: FunctionType = functionType.NONE;
  #currentClass: ClassType = classType.NONE;

  constructor(public readonly interpreter: Interpreter) {}

  resolveMultipleStatements(statements: Stmt[]) {
    for (const stmt of statements) {
      this.resolveStmt(stmt);
    }
  }

  resolveStmt(stmt: Stmt) {
    stmt.accept(this);
  }

  resolveExpr(expr: Expr) {
    expr.accept(this);
  }

  resolveLocal(expr: Expr, name: Token) {
    for (let i = this.scopes.size() - 1; i >= 0; i--) {
      if (this.scopes.get(i)!.has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.size() - 1 - i);
        return;
      }
    }
  }

  beginScope() {
    this.scopes.push(new Map<string, boolean>());
  }

  endScope() {
    this.scopes.pop();
  }

  delcare(name: Token) {
    if (this.scopes.isEmpty()) return;
    const scope = this.scopes.peek()!;
    if (scope.has(name.lexeme)) {
      this.error(
        name,
        "A variable with this name in current scope already exists.",
      );
    }
    scope.set(name.lexeme, false);
  }

  define(name: Token) {
    if (this.scopes.isEmpty()) return;
    this.scopes.peek()!.set(name.lexeme, true);
  }

  error(token: Token, message: string) {
    ErrorReporter.report(token.line, ` at '${token.lexeme}'`, message);
  }

  visitBlockStmt(stmt: Block): void {
    this.beginScope();
    this.resolveMultipleStatements(stmt.statements);
    this.endScope();
  }

  visitVarStmt(stmt: Var): void {
    this.delcare(stmt.name);
    if (stmt.initializer) {
      this.resolveExpr(stmt.initializer);
    }
    this.define(stmt.name);
  }

  visitVariableExpr(expr: Variable): void {
    if (
      !this.scopes.isEmpty() &&
      this.scopes.peek()!.get(expr.name.lexeme) === false
    ) {
      this.error(
        expr.name,
        "Can't read local variable in its own initializer.",
      );
    }
    this.resolveLocal(expr, expr.name);
  }

  visitAssignExpr(expr: Assign): void {
    this.resolveExpr(expr.value);
    this.resolveLocal(expr, expr.name);
  }

  visitFunctionStmt(stmt: Function): void {
    this.delcare(stmt.name);
    this.define(stmt.name);
    this.resolveFunction(stmt, functionType.FUNCTION);
  }

  resolveFunction(func: Function, type: FunctionType): void {
    const enclosingFunction = this.#currentFunction;
    this.#currentFunction = type;

    this.beginScope();
    for (const param of func.params) {
      this.delcare(param);
      this.define(param);
    }
    this.resolveMultipleStatements(func.body);
    this.endScope();

    this.#currentFunction = enclosingFunction;
  }

  visitExpressionStmt(stmt: Expression): void {
    this.resolveExpr(stmt.expression);
  }

  visitIfStmt(stmt: If): void {
    this.resolveExpr(stmt.condition);
    this.resolveStmt(stmt.thenBranch);
    if (stmt.elseBranch) this.resolveStmt(stmt.elseBranch);
  }

  visitPrintStmt(stmt: Print): void {
    this.resolveExpr(stmt.expression);
  }

  visitReturnStmt(stmt: Return): void {
    if (this.#currentFunction === functionType.NONE) {
      this.error(stmt.keyword, "Can't return from top-level code.");
    }
    if (stmt.value) {
      if (this.#currentFunction === functionType.INITIALIZER) {
        this.error(stmt.keyword, "Can't return a value from an initializer.");
      }
      this.resolveExpr(stmt.value);
    }
  }

  visitWhileStmt(stmt: While): void {
    this.resolveExpr(stmt.condition);
    this.resolveStmt(stmt.body);
  }

  visitBinaryExpr(expr: Binary): void {
    this.resolveExpr(expr.left);
    this.resolveExpr(expr.right);
  }

  visitCallExpr(expr: Call): void {
    this.resolveExpr(expr.callee);
    for (const arg of expr.args) {
      this.resolveExpr(arg);
    }
  }

  visitGroupingExpr(expr: Grouping): void {
    this.resolveExpr(expr.expression);
  }

  //eslint-disable-next-line
  visitLiteralExpr(expr: Literal): void {
    return;
  }

  visitLogicalExpr(expr: Logical): void {
    this.resolveExpr(expr.left);
    this.resolveExpr(expr.right);
  }

  visitUnaryExpr(expr: Unary): void {
    this.resolveExpr(expr.right);
  }

  visitClassStmt(stmt: Class): void {
    const enclosingClass = this.#currentClass;
    this.#currentClass = classType.CLASS;

    this.delcare(stmt.name);
    this.define(stmt.name);

    if (stmt.superclass && stmt.name.lexeme === stmt.superclass.name.lexeme) {
      this.error(stmt.superclass.name, "A class can't inherit from itself.");
    }

    if (stmt.superclass) {
      this.#currentClass = classType.SUBCLASS;
      this.resolveExpr(stmt.superclass);
      this.beginScope();
      this.scopes.peek()?.set("super", true);
    }

    this.beginScope();
    this.scopes.peek()?.set("this", true);
    for (const method of stmt.methods) {
      let declaration: FunctionType = functionType.METHOD;
      if (method.name.lexeme === "init") {
        declaration = functionType.INITIALIZER;
      }
      this.resolveFunction(method, declaration);
    }
    this.endScope();

    if (stmt.superclass) {
      this.endScope();
    }
    this.#currentClass = enclosingClass;
  }

  visitGetExpr(expr: Get): void {
    this.resolveExpr(expr.object);
  }

  visitSetExpr(expr: Set): void {
    this.resolveExpr(expr.value);
    this.resolveExpr(expr.object);
  }

  visitThisExpr(expr: This): void {
    if (this.#currentClass === classType.NONE) {
      this.error(expr.keyword, "can't use 'this' outside of a class.");
    }
    this.resolveLocal(expr, expr.keyword);
  }

  visitSuperExpr(expr: Super): void {
    if (this.#currentClass === classType.NONE) {
      this.error(expr.keyword, 'Can\'t use "super" outside of a class.');
    }
    if (this.#currentClass === classType.CLASS) {
      this.error(
        expr.keyword,
        'Can\'t use "super" in a class with no subclasses.',
      );
    }
    this.resolveLocal(expr, expr.keyword);
  }
}
