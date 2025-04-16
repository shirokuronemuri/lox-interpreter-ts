import { ErrorReporter } from "./error-reporter.js";
import { ParseError } from "./error.js";
import type { Assign, Binary, Call, Expr, ExprVisitor, Grouping, Literal, Logical, Unary, Variable } from "./expressions.js";
import type { Interpreter } from "./interpreter.js";
import type { Block, Expression, Function, If, Print, Return, Stmt, StmtVisitor, Var, While } from "./statements.js";
import { functionType, type FunctionType, type Token } from "./types.js";
import { Stack } from "./util/stack.js";

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  readonly scopes: Stack<Map<string, boolean>> = new Stack();
  #currentFunction: FunctionType = functionType.NONE;

  constructor(public readonly interpreter: Interpreter) { }

  resolveMultipleStatements(statements: Stmt[]) {
    for (let stmt of statements) {
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
      this.error(name, 'A variable with this name in current scope already exists.');
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
    if (!this.scopes.isEmpty()
      && this.scopes.peek()!.get(expr.name.lexeme) === false) {
      this.error(expr.name, "Can't read local variable in its own initializer.");
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
    for (let param of func.params) {
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
    if (this.#currentFunction !== functionType.FUNCTION) {
      this.error(stmt.keyword, "Can't return from top-level code.");
    }
    if (stmt.value) {
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
    for (let arg of expr.args) {
      this.resolveExpr(arg);
    }
  }

  visitGroupingExpr(expr: Grouping): void {
    this.resolveExpr(expr.expression);
  }

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
}
