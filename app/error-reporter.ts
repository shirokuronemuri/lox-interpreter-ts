export class ErrorReporter {
  static errorsFound = false;

  static report(line: number, position: string, message: string): void {
    console.error(`[line ${line}] Error${position}: ${message}`);
    this.errorsFound = true;
  }
}
