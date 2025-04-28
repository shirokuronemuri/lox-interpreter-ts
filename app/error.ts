import type { Token } from "./types.js";

export class ParseError extends SyntaxError {}

export class RuntimeError extends Error {
  constructor(
    public readonly token: Token,
    message: string,
  ) {
    super(message);
  }
}

export class ReturnThrow extends Error {
  constructor(public readonly value: unknown) {
    super();
  }
}
