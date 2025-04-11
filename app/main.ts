import { AstPrinter } from "./ast-printer.js";
import { ErrorReporter } from "./error-reporter.js";
import { type Expr } from "./expressions.js";
import { Interpreter } from "./interpreter.js";
import { Parser } from "./parser.js";
import { Tokenizer } from "./tokenizer.js";

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
      if (ErrorReporter.errorsFound) {
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

      const tokenizer = new Tokenizer(filename);
      tokenizer.tokenize();
      const parser = new Parser(tokenizer.tokens);
      const expression = parser.parseOne();
      if (!expression || ErrorReporter.errorsFound) {
        process.exit(65);
      }
      new AstPrinter().print(expression);
      break;
    }
    case 'evaluate': {
      const filename = args[1];
      if (!filename) {
        console.error(`No file specified for the interpreter`);
        process.exit(1);
      }

      const tokenizer = new Tokenizer(filename);
      tokenizer.tokenize();
      const parser = new Parser(tokenizer.tokens);
      const expression = parser.parseOne();
      if (!expression || ErrorReporter.errorsFound) {
        process.exit(65);
      }
      const interpreter = new Interpreter();
      interpreter.interpretOne(expression);
      if (ErrorReporter.errorsFound) {
        process.exit(70);
      }
      break;
    }
    case 'run': {
      const filename = args[1];
      if (!filename) {
        console.error(`No file specified for the interpreter`);
        process.exit(1);
      }

      const tokenizer = new Tokenizer(filename);
      tokenizer.tokenize();
      const parser = new Parser(tokenizer.tokens);
      const expressions = parser.parse();
      if (ErrorReporter.errorsFound) {
        process.exit(65);
      }
      const interpreter = new Interpreter();
      interpreter.interpret(expressions);
      if (ErrorReporter.errorsFound) {
        process.exit(70);
      }
      break;
    }
    default: {
      console.error(`Usage: Unknown command: ${command}`);
      process.exit(1);
    }
  }
}

main();
