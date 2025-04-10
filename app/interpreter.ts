import type { Binary, Expr, Grouping, Literal, Unary, Visitor } from "./expressions.js";
import type { Token } from "./types.js";

class RuntimeError extends Error {
  constructor(public readonly token: Token, message: string) {
    super(message);
  }
}

export class Interpreter implements Visitor<unknown> {
  isTruthy(value: unknown): boolean {
    if (value === null) return false;
    if (typeof value === 'boolean') return value;
    return true;
  }

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
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case 'STAR': {
        return (left as number) * (right as number);
      }
      case 'SLASH': {
        return (left as number) / (right as number);
      }
      case 'PLUS': {
        if (typeof left === 'string' && typeof right === 'string') {
          return left + right;
        }

        return (left as number) + (right as number);
      }
      case 'MINUS': {
        return (left as number) - (right as number);
      }
      case 'GREATER': {
        return (left as number) > (right as number);
      }
      case 'GREATER_EQUAL': {
        return (left as number) >= (right as number);
      }
      case 'LESS': {
        return (left as number) < (right as number);
      }
      case 'LESS_EQUAL': {
        return (left as number) <= (right as number);
      }

    }

    return null;
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
        return -(right as number);
      }
    }

    return null;
  }

  stringify(value: unknown) {
    if (value === null) return 'nil';

    return value;
  }

}
