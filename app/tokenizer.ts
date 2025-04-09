import fs from "node:fs";
import { reservedWords, type ReservedWord, type Token, type TokenType } from "./types.js";


export class Tokenizer {
  #tokens: Token[] = [];
  #errors: string[] = [];

  constructor(public filename: string) { }

  push(type: TokenType, lexeme: string, literal: any = null): void {
    this.#tokens.push({
      type,
      lexeme,
      literal
    });
  }

  pop(): Token | undefined {
    return this.#tokens.shift();
  }

  get length(): number {
    return this.#tokens.length;
  }

  get tokens(): Token[] {
    return [...this.#tokens];
  }

  get errors(): string[] {
    return [...this.#errors];
  }

  output(): void {
    this.#tokens.forEach(token => {
      console.log(token.type, token.lexeme, token.literal);
    });
    this.#errors.forEach((error) => {
      console.error(error);
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

    for (let [i, fileLine] of fileLines.entries()) {
      for (let j = 0; j < fileLine.length; ++j) {
        let ignoreLine = false;

        switch (fileLine[j]) {
          case '"': {
            const stringEndIndex = fileLine.indexOf('"', j + 1);
            if (stringEndIndex === -1) {
              this.#errors.push(`[line ${i + 1}] Error: Unterminated string.`);
              ignoreLine = true;
            }
            else {
              const stringLiteral = fileLine.slice(j + 1, stringEndIndex);
              j = stringEndIndex;
              this.push('STRING', `"${stringLiteral}"`, stringLiteral);
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
              this.push('SLASH', '/');
            }
            break;
          }
          case '>': {
            if (this.#checkNextCharacter(fileLine, j, '=')) {
              this.push('GREATER_EQUAL', '>=');
              ++j;
            }
            else {
              this.push('GREATER', '>');
            }
            break;
          }
          case '<': {
            if (this.#checkNextCharacter(fileLine, j, '=')) {
              this.push('LESS_EQUAL', '<=');
              ++j;
            }
            else {
              this.push('LESS', '<');
            }
            break;
          }
          case '!': {
            if (this.#checkNextCharacter(fileLine, j, '=')) {
              this.push('BANG_EQUAL', '!=');
              ++j;
            }
            else {
              this.push('BANG', '!');
            }
            break;
          }
          case '=': {
            if (this.#checkNextCharacter(fileLine, j, '=')) {
              this.push('EQUAL_EQUAL', '==');
              ++j;
            }
            else {
              this.push('EQUAL', '=');
            }
            break;
          }
          case '(': {
            this.push('LEFT_PAREN', '(');
            break;
          }
          case ')': {
            this.push('RIGHT_PAREN', ')');
            break;
          }
          case '{': {
            this.push('LEFT_BRACE', '{');
            break;
          }
          case '}': {
            this.push('RIGHT_BRACE', '}');
            break;
          }
          case ',': {
            this.push('COMMA', ',');
            break;
          }
          case '.': {
            this.push('DOT', '.');
            break;
          }
          case '-': {
            this.push('MINUS', '-');
            break;
          }
          case '+': {
            this.push('PLUS', '+');
            break;
          }
          case ';': {
            this.push('SEMICOLON', ';');
            break;
          }
          case '/': {
            this.push('SLASH', '/');
            break;
          }
          case '*': {
            this.push('STAR', '*');
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
              const integerPart = numberMatch[1];
              const decimalPart = numberMatch[2]?.replace(/0+$/, '');
              const numberLiteral = integerPart + (decimalPart?.length ? `.${decimalPart}` : ".0");
              this.push('NUMBER', numberMatch[0], numberLiteral);
              j += numberMatch[0].length - 1;
            }
            else if (reservedWordMatch && reservedWordMatch[0]) {
              const token = Object.keys(reservedWords)
                .find((key) => reservedWords[key as ReservedWord] === reservedWordMatch[0]) as ReservedWord;
              this.push(token, reservedWordMatch[0]);
              j += reservedWordMatch[0].length - 1;
            }
            else if (identifierMatch && identifierMatch[0]) {
              this.push('IDENTIFIER', identifierMatch[0]);
              j += identifierMatch[0].length - 1;
            }
            else {
              this.#errors.push(`[line ${i + 1}] Error: Unexpected character: ${fileLine[j]}`);
            }
          }
        }

        if (ignoreLine) {
          break;
        }
      }
    }

    this.push('EOF', '', null);
  }
}
