import fs from "node:fs";

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

let fileContent;

try {
  fileContent = fs.readFileSync(filename, "utf8");
}
catch (err) {
  if (err instanceof Error) {
    console.error(err.message);
  }
  else {
    console.error(err);
  }
  process.exit(1);
}

let hasCompileErrors = false;

const fileLines = fileContent.split('\n');
for (let fileLine of fileLines) {
  for (let j = 0; j < fileLine.length; ++j)
    switch (fileLine[j]) {
      case '(': {
        console.log('LEFT_PAREN ( null');
        break;
      }
      case ')': {
        console.log('RIGHT_PAREN ) null');
        break;
      }
      case '{': {
        console.log('LEFT_BRACE { null');
        break;
      }
      case '}': {
        console.log('RIGHT_BRACE } null');
        break;
      }
      case ',': {
        console.log('COMMA , null');
        break;
      }
      case '.': {
        console.log('DOT . null');
        break;
      }
      case '-': {
        console.log('MINUS - null');
        break;
      }
      case '+': {
        console.log('PLUS + null');
        break;
      }
      case ';': {
        console.log('SEMICOLON ; null');
        break;
      }
      case '/': {
        console.log('SLASH / null');
        break;
      }
      case '*': {
        console.log('STAR * null');
        break;
      }
      default: {
        hasCompileErrors = true;
        console.error(`[line 1] Error: Unexpected character: ${fileLine[j]}`);
      }
    }
}

console.log("EOF  null");

if (hasCompileErrors) {
  process.exit(65);
}
