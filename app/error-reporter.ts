export class ErrorReporter {
  static errorsFound = false;

  static report(line: number, message: string): void {
    console.error(`[line ${line}] Error: ${message}`);
    this.errorsFound = true;
  }
}
