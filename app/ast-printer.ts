import type { Binary, Expr, Grouping, Literal, Unary, ExprVisitor, Variable, Assign, Logical, Call, Get, Set, This } from "./expressions.js";

export class AstPrinter implements ExprVisitor<string> {
  print(expr: Expr): void {
    console.log(expr.accept(this));
  }

  visitVariableExpr(expr: Variable): string {
    return "not implemented";
  }

  visitAssignExpr(expr: Assign): string {
    return "not implemented";
  }

  visitThisExpr(expr: This): string {
    return "not implemented";
  }

  visitGetExpr(expr: Get): string {
    return "not implemented";
  }

  visitSetExpr(expr: Set): string {
    return "not implemented";
  }

  visitCallExpr(expr: Call): string {
    return "not implemented";
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
