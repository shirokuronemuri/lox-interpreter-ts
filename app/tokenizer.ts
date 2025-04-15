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
    let line = 1;
    let isAtEndOfFile = false;
    for (let i = 0; i < fileContents.length; ++i) {
      switch (fileContents[i]) {
        case '\n': {
          ++line;
          continue;
        }
        case '"': {
          const stringEndIndex = fileContents.indexOf('"', i + 1);
          if (stringEndIndex === -1) {
            ErrorReporter.report(line, "", 'Unterminated string.');
            const newIndex = fileContents.indexOf('\n', i + 1);
            if (newIndex === -1) {
              isAtEndOfFile = true;
              break;
            } else {
              i = newIndex;
              ++line;
            }
          }
          else {
            const stringLiteral = fileContents.slice(i + 1, stringEndIndex);
            i = stringEndIndex;
            line += stringLiteral.split('\n').length - 1;
            this.push('STRING', `"${stringLiteral}"`, line, stringLiteral);
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
          if (this.#checkNextCharacter(fileContents, i, '/')) {
            const newIndex = fileContents.indexOf('\n', i + 1);
            if (newIndex === -1) {
              isAtEndOfFile = true;
              break;
            } else {
              i = newIndex;
              ++line;
            }
          }
          else {
            this.push('SLASH', '/', line);
          }
          break;
        }
        case '>': {
          if (this.#checkNextCharacter(fileContents, i, '=')) {
            this.push('GREATER_EQUAL', '>=', line);
            ++i;
          }
          else {
            this.push('GREATER', '>', line);
          }
          break;
        }
        case '<': {
          if (this.#checkNextCharacter(fileContents, i, '=')) {
            this.push('LESS_EQUAL', '<=', line);
            ++i;
          }
          else {
            this.push('LESS', '<', line);
          }
          break;
        }
        case '!': {
          if (this.#checkNextCharacter(fileContents, i, '=')) {
            this.push('BANG_EQUAL', '!=', line);
            ++i;
          }
          else {
            this.push('BANG', '!', line);
          }
          break;
        }
        case '=': {
          if (this.#checkNextCharacter(fileContents, i, '=')) {
            this.push('EQUAL_EQUAL', '==', line);
            ++i;
          }
          else {
            this.push('EQUAL', '=', line);
          }
          break;
        }
        case '(': {
          this.push('LEFT_PAREN', '(', line);
          break;
        }
        case ')': {
          this.push('RIGHT_PAREN', ')', line);
          break;
        }
        case '{': {
          this.push('LEFT_BRACE', '{', line);
          break;
        }
        case '}': {
          this.push('RIGHT_BRACE', '}', line);
          break;
        }
        case ',': {
          this.push('COMMA', ',', line);
          break;
        }
        case '.': {
          this.push('DOT', '.', line);
          break;
        }
        case '-': {
          this.push('MINUS', '-', line);
          break;
        }
        case '+': {
          this.push('PLUS', '+', line);
          break;
        }
        case ';': {
          this.push('SEMICOLON', ';', line);
          break;
        }
        case '*': {
          this.push('STAR', '*', line);
          break;
        }
        default: {
          const numberLiteralRegex = /^(\d+)(?:\.(\d+))?/;
          const numberMatch = fileContents.slice(i).match(numberLiteralRegex);

          const reservedWordRegex = new RegExp(`^(${Object.values(reservedWords).join('|')})`);
          const reservedWordMatch = fileContents.slice(i).match(reservedWordRegex);

          const identifierRegex = /^[a-zA-Z_][a-zA-Z_0-9]*/;
          const identifierMatch = fileContents.slice(i).match(identifierRegex);
          const identifierMatchedAndNotReservedWord = identifierMatch && identifierMatch[0]
            && !(Object.values(reservedWords) as string[]).includes(identifierMatch[0]);

          if (numberMatch && numberMatch[0]) {
            this.push('NUMBER', numberMatch[0], line, parseFloat(numberMatch[0]));
            i += numberMatch[0].length - 1;
          }
          else if (identifierMatchedAndNotReservedWord) {
            this.push('IDENTIFIER', identifierMatch[0], line);
            i += identifierMatch[0].length - 1;
          }
          else if (reservedWordMatch && reservedWordMatch[0]) {
            const token = Object.keys(reservedWords)
              .find((key) => reservedWords[key as ReservedWord] === reservedWordMatch[0]) as ReservedWord;
            this.push(token, reservedWordMatch[0], line);
            i += reservedWordMatch[0].length - 1;
          }
          else {
            ErrorReporter.report(line, "", `Unexpected character: ${fileContents[i]}`);
          }
        }
      }
      if (isAtEndOfFile) {
        break;
      }
    }

    this.push('EOF', '', line, null);
  }
};
