import fs from "node:fs";
import { reservedWords, type ReservedWord, type Token, type TokenType } from "./types.js";
import { ErrorReporter } from "./error-reporter.js";


export class Tokenizer {
  #tokens: Token[] = [];

  constructor(public filename: string) { }

  push(type: TokenType, lexeme: string, line: number, literal: any = null): void {
    this.#tokens.push({
      type,
      lexeme,
      literal,
      line
    });
  }

  get tokens(): Token[] {
    return [...this.#tokens];
  }

  output(): void {
    this.#tokens.forEach(token => {
      if (token.type === "NUMBER" && Number.isInteger(token.literal)) {
        console.log(token.type, token.lexeme, token.literal + '.0');
      }
      else {
        console.log(token.type, token.lexeme, token.literal);
      }
    });
  }

  #getFileContents(): string {
    try {
      return fs.readFileSync(this.filename, "utf8");
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
  }

  #checkNextCharacter(fileLine: string, i: number, ch: string): boolean {
    if (fileLine.length <= i + 1) {
      return false;
    }
    return fileLine[i + 1] === ch;
  }

  tokenize(): void {
    const fileContents = this.#getFileContents();
    const fileLines = fileContents.split('\n');

    for (let i = 0; i < fileLines.length; ++i) {
      const fileLine = fileLines[i]!;
      for (let j = 0; j < fileLine.length; ++j) {
        let ignoreLine = false;

        switch (fileLine[j]) {
          case '"': {
            // let resultString = "";
            // ++j;
            // while (true) {
            //   if (i >= fileLines.length) {
            //     ErrorReporter.report(i - 1, "", 'Unterminated string.');
            //     break;
            //   }
            //   else if (j >= fileLine.length) {
            //     resultString += '\n';
            //     ++i;
            //     j = 0;
            //   }
            //   else if (fileLines[i]![j] === '"') {
            //     this.push('STRING', `"${resultString}"`, i + 1, resultString);
            //     break;
            //   }
            //   else {
            //     resultString += fileLines[i]![j];
            //     ++j;
            //   }
            // }
            // TODO ADD TOKENIZING MULTILINE STRINGS, PROBABLY REWRITE THE WHOLE LOOP THING
            const stringEndIndex = fileLine.indexOf('"', j + 1);
            if (stringEndIndex === -1) {
              ErrorReporter.report(i + 1, "", 'Unterminated string.');
            }
            else {
              const stringLiteral = fileLine.slice(j + 1, stringEndIndex);
              j = stringEndIndex;
              this.push('STRING', `"${stringLiteral}"`, i + 1, stringLiteral);
            }
            break;
          }
          case ' ': {
            continue;
          }
          case '\t': {
            continue;
          }
          case '/': {
            if (this.#checkNextCharacter(fileLine, j, '/')) {
              ignoreLine = true;
            }
            else {
              this.push('SLASH', '/', i + 1);
            }
            break;
          }
          case '>': {
            if (this.#checkNextCharacter(fileLine, j, '=')) {
              this.push('GREATER_EQUAL', '>=', i + 1);
              ++j;
            }
            else {
              this.push('GREATER', '>', i + 1);
            }
            break;
          }
          case '<': {
            if (this.#checkNextCharacter(fileLine, j, '=')) {
              this.push('LESS_EQUAL', '<=', i + 1);
              ++j;
            }
            else {
              this.push('LESS', '<', i + 1);
            }
            break;
          }
          case '!': {
            if (this.#checkNextCharacter(fileLine, j, '=')) {
              this.push('BANG_EQUAL', '!=', i + 1);
              ++j;
            }
            else {
              this.push('BANG', '!', i + 1);
            }
            break;
          }
          case '=': {
            if (this.#checkNextCharacter(fileLine, j, '=')) {
              this.push('EQUAL_EQUAL', '==', i + 1);
              ++j;
            }
            else {
              this.push('EQUAL', '=', i + 1);
            }
            break;
          }
          case '(': {
            this.push('LEFT_PAREN', '(', i + 1);
            break;
          }
          case ')': {
            this.push('RIGHT_PAREN', ')', i + 1);
            break;
          }
          case '{': {
            this.push('LEFT_BRACE', '{', i + 1);
            break;
          }
          case '}': {
            this.push('RIGHT_BRACE', '}', i + 1);
            break;
          }
          case ',': {
            this.push('COMMA', ',', i + 1);
            break;
          }
          case '.': {
            this.push('DOT', '.', i + 1);
            break;
          }
          case '-': {
            this.push('MINUS', '-', i + 1);
            break;
          }
          case '+': {
            this.push('PLUS', '+', i + 1);
            break;
          }
          case ';': {
            this.push('SEMICOLON', ';', i + 1);
            break;
          }
          case '/': {
            this.push('SLASH', '/', i + 1);
            break;
          }
          case '*': {
            this.push('STAR', '*', i + 1);
            break;
          }
          default: {
            const numberLiteralRegex = /^(\d+)(?:\.(\d+))?/;
            const numberMatch = fileLine.slice(j).match(numberLiteralRegex);

            const reservedWordRegex = new RegExp(`^(${Object.values(reservedWords).join('|')})`);
            const reservedWordMatch = fileLine.slice(j).match(reservedWordRegex);

            const identifierRegex = /^[a-zA-Z_][a-zA-Z_0-9]*/;
            const identifierMatch = fileLine.slice(j).match(identifierRegex);
            if (numberMatch && numberMatch[0]) {
              this.push('NUMBER', numberMatch[0], i + 1, parseFloat(numberMatch[0]));
              j += numberMatch[0].length - 1;
            }
            else if (reservedWordMatch && reservedWordMatch[0]) {
              const token = Object.keys(reservedWords)
                .find((key) => reservedWords[key as ReservedWord] === reservedWordMatch[0]) as ReservedWord;
              this.push(token, reservedWordMatch[0], i + 1);
              j += reservedWordMatch[0].length - 1;
            }
            else if (identifierMatch && identifierMatch[0]) {
              this.push('IDENTIFIER', identifierMatch[0], i + 1);
              j += identifierMatch[0].length - 1;
            }
            else {
              ErrorReporter.report(i + 1, "", `Unexpected character: ${fileLine[j]}`);
            }
          }
        }

        if (ignoreLine) {
          break;
        }
      }
    }

    this.push('EOF', '', fileLines.length, null);
  }
};
