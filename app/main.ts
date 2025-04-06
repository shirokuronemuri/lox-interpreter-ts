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


for (let i = 0; i < fileContent.length; ++i) {
  if (fileContent[i] === '(') {
    console.log('LEFT_PAREN ( null');
  }
  else if (fileContent[i] === ')') {
    console.log('RIGHT_PAREN ) null');
  }
}
console.log("EOF  null");
