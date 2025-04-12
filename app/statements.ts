import type { Expr } from "./expressions.js";
import type { Token } from "./types.js";

export interface StmtVisitor<R> {
  visitPrintStmt(stmt: Print): R;
  visitExpressionStmt(stmt: Expression): R;
  visitVarStmt(stmt: Var): R;
}

export abstract class Stmt {
  abstract accept<R>(visitor: StmtVisitor<R>): R;
}

export class Print extends Stmt {
  constructor(public readonly expression: Expr) {
    super();
  }

  override accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitPrintStmt(this);
  }
}

export class Expression extends Stmt {
  constructor(public readonly expression: Expr) {
    super();
  }

  override accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitExpressionStmt(this);
  }
}

export class Var extends Stmt {
  constructor(public readonly name: Token, public readonly initializer: Expr | null) {
    super();
  }

  override accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitVarStmt(this);
  }
}
