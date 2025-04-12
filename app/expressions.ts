import type { Token } from "./types.js";

export interface ExprVisitor<R> {
  visitLiteralExpr(expr: Literal): R;
  visitUnaryExpr(expr: Unary): R;
  visitBinaryExpr(expr: Binary): R;
  visitGroupingExpr(expr: Grouping): R;
  visitVariableExpr(expr: Variable): R;
  visitAssignExpr(expr: Assign): R;
}

export abstract class Expr {
  abstract accept<R>(visitor: ExprVisitor<R>): R;
}

export class Literal extends Expr {
  constructor(public readonly value: unknown) {
    super();
  }

  override accept<R>(visitor: ExprVisitor<R>): R {
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

  override accept<R>(visitor: ExprVisitor<R>): R {
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

  override accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitBinaryExpr(this);
  };
}

export class Grouping extends Expr {
  constructor(public readonly expression: Expr) {
    super();
  }

  override accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitGroupingExpr(this);
  };
}

export class Variable extends Expr {
  constructor(public readonly name: Token) {
    super();
  };

  override accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitVariableExpr(this);
  }
}

export class Assign extends Expr {
  constructor(public readonly name: Token, public readonly value: Expr) {
    super();
  }

  override accept<R>(visitor: ExprVisitor<R>): R {
    return visitor.visitAssignExpr(this);
  }
}
