import type { Expr, Variable } from "./expressions.js";
import type { Token } from "./types.js";

export interface StmtVisitor<R> {
  visitPrintStmt(stmt: Print): R;
  visitExpressionStmt(stmt: Expression): R;
  visitVarStmt(stmt: Var): R;
  visitBlockStmt(stmt: Block): R;
  visitIfStmt(stmt: If): R;
  visitWhileStmt(stmt: While): R;
  visitFunctionStmt(stmt: Function): R;
  visitReturnStmt(stmt: Return): R;
  visitClassStmt(stmt: Class): R;
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
  constructor(
    public readonly name: Token,
    public readonly initializer: Expr | null,
  ) {
    super();
  }

  override accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitVarStmt(this);
  }
}

export class Block extends Stmt {
  constructor(public readonly statements: Stmt[]) {
    super();
  }

  override accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitBlockStmt(this);
  }
}

export class If extends Stmt {
  constructor(
    public readonly condition: Expr,
    public readonly thenBranch: Stmt,
    public readonly elseBranch: Stmt | null,
  ) {
    super();
  }

  override accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitIfStmt(this);
  }
}

export class While extends Stmt {
  constructor(
    public readonly condition: Expr,
    public readonly body: Stmt,
  ) {
    super();
  }

  override accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitWhileStmt(this);
  }
}

export class Function extends Stmt {
  constructor(
    public readonly name: Token,
    public readonly params: Token[],
    public readonly body: Stmt[],
  ) {
    super();
  }

  override accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitFunctionStmt(this);
  }
}

export class Return extends Stmt {
  constructor(
    public readonly keyword: Token,
    public readonly value: Expr | null,
  ) {
    super();
  }

  override accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitReturnStmt(this);
  }
}

export class Class extends Stmt {
  constructor(
    public readonly name: Token,
    public readonly superclass: Variable | null,
    public readonly methods: Function[],
  ) {
    super();
  }

  override accept<R>(visitor: StmtVisitor<R>): R {
    return visitor.visitClassStmt(this);
  }
}
