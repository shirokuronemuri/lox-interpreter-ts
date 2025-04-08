import { Tokenizer } from "./tokenizer.js";

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
