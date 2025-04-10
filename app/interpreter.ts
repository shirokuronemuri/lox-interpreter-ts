import { ErrorReporter } from "./error-reporter.js";
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

  inpterpret(expr: Expr): void {
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

  visitGroupingExpr(expr: Grouping): unknown {
    return expr.expression.accept(this);
  }

  visitUnaryExpr(expr: Unary): unknown {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case 'BANG': {
        this.checkNumberOperand(expr.operator, right);
        return !this.isTruthy(right);
      }
      case 'MINUS': {
        this.checkNumberOperand(expr.operator, right);
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
