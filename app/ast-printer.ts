import type { Binary, Expr, Grouping, Literal, Unary, ExprVisitor, Variable, Assign, Logical } from "./expressions.js";

export class AstPrinter implements ExprVisitor<string> {
  print(expr: Expr): void {
    console.log(expr.accept(this));
  }

  visitVariableExpr(expr: Variable): string {
    return expr.name.lexeme;
  }

  visitAssignExpr(expr: Assign): string {
    return expr.name.lexeme;
  }

  visitLogicalExpr(expr: Logical): string {
    return "not implemented";
  }

  visitBinaryExpr(expr: Binary): string {
    return this.#parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitGroupingExpr(expr: Grouping): string {
    return this.#parenthesize("group", expr.expression);
  }

  visitLiteralExpr(expr: Literal): string {
    if (expr.value === null || expr.value === undefined) return 'nil';
    if (typeof expr.value === 'number' && Number.isInteger(expr.value)) return expr.value + '.0';
    return expr.value.toString();
  }

  visitUnaryExpr(expr: Unary): string {
    return this.#parenthesize(expr.operator.lexeme, expr.right);
  }

  #parenthesize(name: string, ...exprs: Expr[]) {
    let output = `(${name}`;
    exprs.forEach((expr) => {
      output += ` ${expr.accept(this)}`;
    });
    output += ')';

    return output;
  }
}
