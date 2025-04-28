import { AstPrinter } from "./ast-printer.js";
import { ErrorReporter } from "./error-reporter.js";
import { Interpreter } from "./interpreter.js";
import { Parser } from "./parser.js";
import { Resolver } from "./resolver.js";
import { Tokenizer } from "./tokenizer.js";

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Usage: ./your_program.sh tokenize <filename>");
    process.exit(1);
  }

  const checkForErrors = (exitCode: number) => {
    if (ErrorReporter.errorsFound) {
      process.exit(exitCode);
    }
  };

  const tokenize = (): Tokenizer => {
    const filename = args[1];
    if (!filename) {
      console.error(`No file specified`);
      process.exit(1);
    }
    const tokenizer = new Tokenizer(filename);
    tokenizer.tokenize();
    return tokenizer;
  };

  const command = args[0];
  switch (command) {
    case "tokenize": {
      const tokenizer = tokenize();
      tokenizer.output();
      checkForErrors(65);
      break;
    }
    case "parse": {
      const tokenizer = tokenize();
      const parser = new Parser(tokenizer.tokens);
      const expression = parser.parseOne();
      checkForErrors(65);
      new AstPrinter().print(expression!);
      break;
    }
    case "evaluate": {
      const tokenizer = tokenize();
      const parser = new Parser(tokenizer.tokens);
      const expression = parser.parseOne();
      checkForErrors(65);
      const interpreter = new Interpreter();
      interpreter.interpretOne(expression!);
      checkForErrors(70);
      break;
    }
    case "run": {
      const tokenizer = tokenize();
      const parser = new Parser(tokenizer.tokens);
      const expressions = parser.parse().filter((expr) => expr !== null);
      checkForErrors(65);

      const interpreter = new Interpreter();
      const resolver = new Resolver(interpreter);
      resolver.resolveMultipleStatements(expressions);
      checkForErrors(65);
      interpreter.interpret(expressions);
      checkForErrors(70);
      break;
    }
    default: {
      console.error(`Usage: Unknown command: ${command}`);
      process.exit(1);
    }
  }
}

main();
