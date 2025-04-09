import type { Token } from "./types.js";

export interface Visitor<R> {
  visitLiteralExpr(expr: Literal): R;
  visitUnaryExpr(expr: Unary): R;
  visitBinaryExpr(expr: Binary): R;
  visitGroupingExpr(expr: Grouping): R;
}

export abstract class Expr {
  abstract accept<R>(visitor: Visitor<R>): R;
}

export class Literal extends Expr {
  constructor(public readonly value: unknown) {
    super();
  }

  override accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLiteralExpr(this);
  };
}

export class Unary extends Expr {
  constructor(
    public readonly operator: Token,
    public readonly right: Expr
  ) {
    super();
  }

  override accept<R>(visitor: Visitor<R>): R {
    return visitor.visitUnaryExpr(this);
  };
}

export class Binary extends Expr {
  constructor(
    public readonly left: Expr,
    public readonly operator: Token,
    public readonly right: Expr,
  ) {
    super();
  }

  override accept<R>(visitor: Visitor<R>): R {
    return visitor.visitBinaryExpr(this);
  };
}

export class Grouping extends Expr {
  constructor(
    public readonly expression: Expr
  ) {
    super();
  }

  override accept<R>(visitor: Visitor<R>): R {
    return visitor.visitGroupingExpr(this);
  };
}

export class AstPrinter implements Visitor<string> {
  print(expr: Expr): string {
    return expr.accept(this);
  }

  visitBinaryExpr(expr: Binary): string {
    return this.#parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitGroupingExpr(expr: Grouping): string {
    return this.#parenthesize("group", expr.expression);
  }

  visitLiteralExpr(expr: Literal): string {
    if (expr.value === null || expr.value === undefined) return 'nil';
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
