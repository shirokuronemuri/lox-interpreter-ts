import { Tokenizer } from "./tokenizer.js";
import type { Token } from "./types.js";

interface Visitor<R> {
  visitLiteralExpr(expr: Literal): R;
  visitUnaryExpr(expr: Unary): R;
  visitBinaryExpr(expr: Binary): R;
  visitGroupingExpr(expr: Grouping): R;
}

abstract class Expr {
  abstract accept<R>(visitor: Visitor<R>): R;
}

class Literal extends Expr {
  constructor(public readonly value: unknown) {
    super();
  }

  override accept<R>(visitor: Visitor<R>): R {
    return visitor.visitLiteralExpr(this);
  };
}
class Unary extends Expr {
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
class Binary extends Expr {
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
class Grouping extends Expr {
  constructor(
    public readonly expression: Expr
  ) {
    super();
  }

  override accept<R>(visitor: Visitor<R>): R {
    return visitor.visitGroupingExpr(this);
  };
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: ./your_program.sh tokenize <filename>");
    process.exit(1);
  }

  const command = args[0];
  if (command !== "tokenize") {
    console.error(`Usage: Unknown command: ${command}`);
    process.exit(1);
  }

  const filename = args[1];
  if (!filename) {
    console.error(`No file specified for tokenizer`);
    process.exit(1);
  }

  const tokenizer = new Tokenizer(filename);
  tokenizer.tokenize();
  tokenizer.output();
  if (tokenizer.errors.length > 0) {
    process.exit(65);
  }
}

main();
