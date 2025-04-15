import { RuntimeError } from "./error.js";
import type { Token } from "./types.js";

export class Environment {
  #values: Map<string, unknown> = new Map();

  constructor(public readonly enclosing: Environment | null = null) { }

  define(name: string, value: unknown) {
    this.#values.set(name, value);
  }

  assign(name: Token, value: unknown) {
    if (this.#values.has(name.lexeme)) {
      this.#values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing !== null) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable "${name.lexeme}".`);
  }

  get(name: Token): unknown {
    if (this.#values.has(name.lexeme)) {
      return this.#values.get(name.lexeme);
    }

    if (this.enclosing !== null) {
      return this.enclosing.get(name);
    }

    throw new RuntimeError(name, `Undefined variable ${name.lexeme}.`);
  }
}
