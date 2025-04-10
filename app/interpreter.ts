import type { Binary, Expr, Grouping, Literal, Unary, Visitor } from "./expressions.js";
import type { Token } from "./types.js";

class RuntimeError extends Error {
  constructor(public readonly token: Token, message: string) {
    super(message);
  }
}

export class Interpreter implements Visitor<unknown> {
  evaluate(expr: Expr) {
    return expr.accept(this);
  }

  inpterpret(expr: Expr) {
    try {
      const value = this.evaluate(expr);
      console.log(this.stringify(value));
    }
    catch (err) {
      if (err instanceof RuntimeError) {
        console.error('runtime errors not supported yet');
      }
      else {
        console.error('something very wrong');
      }
    }
  }

  visitLiteralExpr(expr: Literal): unknown {
    return expr.value;
  }

  visitBinaryExpr(expr: Binary): unknown {
    return 1;
  }

  visitGroupingExpr(expr: Grouping): unknown {
    return expr.expression.accept(this);
  }

  visitUnaryExpr(expr: Unary): unknown {
    return 1;
  }

  stringify(value: unknown) {
    if (value === null) return 'nil';

    return value;
  }

}
