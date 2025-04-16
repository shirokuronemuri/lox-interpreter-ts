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

  getAt(distance: number, name: string): unknown {
    return this.ancestor(distance).#values.get(name);
  }

  assignAt(distance: number, name: Token, value: unknown) {
    this.ancestor(distance).#values.set(name.lexeme, value);
  }

  ancestor(distance: number): Environment {
    let environment: Environment = this;
    for (let i = 0; i < distance; ++i) {
      if (environment.enclosing) {
        environment = environment.enclosing;
      }
    }

    return environment;
  }


}
