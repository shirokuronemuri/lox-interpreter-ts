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

class AstPrinter implements Visitor<string> {
  print(expr: Expr): string {
    return expr.accept(this);
  }

  visitBinaryExpr(expr: Binary): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitGroupingExpr(expr: Grouping): string {
    return this.parenthesize("group", expr.expression);
  }

  visitLiteralExpr(expr: Literal): string {
    if (expr.value === null || expr.value === undefined) return 'nil';
    return expr.value.toString();
  }

  visitUnaryExpr(expr: Unary): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  parenthesize(name: string, ...exprs: Expr[]) {
    let output = `(${name}`;
    exprs.forEach((expr) => {
      output += ` ${expr.accept(this)}`;
    });
    output += ')';

    return output;
  }
}

class Parser {
  #tokenizer: Tokenizer;
  #expressions: Expr[] = [];
  constructor(filename: string) {
    this.#tokenizer = new Tokenizer(filename);
    this.#tokenizer.tokenize();
  }

  parse() {
    while (this.#tokenizer.length > 1) {
      const token = this.#tokenizer.pop();
      if (!token) {
        console.error("No tokens in the stack, terminating");
        process.exit(1);
      }
      switch (token.type) {
        case 'NIL': {
          this.#expressions.push(new Literal('nil'));
          break;
        }
        case 'TRUE': {
          this.#expressions.push(new Literal('true'));
          break;
        }
        case 'FALSE': {
          this.#expressions.push(new Literal('false'));
          break;
        }
        default: {

        }
      }
    }
  }

  output() {
    this.#expressions.forEach((expr) => {
      console.log(new AstPrinter().print(expr));
    });
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: ./your_program.sh tokenize <filename>");
    process.exit(1);
  }

  const command = args[0];
  switch (command) {
    case 'tokenize': {
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
      break;
    }
    case 'parse': {
      const filename = args[1];
      if (!filename) {
        console.error(`No file specified for parser`);
        process.exit(1);
      }

      const parser = new Parser(filename);
      parser.parse();
      parser.output();
      break;
    }
    default: {
      console.error(`Usage: Unknown command: ${command}`);
      process.exit(1);
    }
  }
}

main();
