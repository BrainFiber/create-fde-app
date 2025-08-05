import chalk from 'chalk';
import ora from 'ora';

class Logger {
  constructor() {
    this.spinner = null;
  }

  info(message) {
    console.log(message);
  }

  success(message) {
    console.log(chalk.green('✓'), message);
  }

  error(message, error) {
    console.error(chalk.red('✗'), message);
    if (error) {
      console.error(chalk.red(error));
    }
  }

  warn(message) {
    console.warn(chalk.yellow('⚠'), message);
  }

  startSpinner(message) {
    this.spinner = ora(message).start();
  }

  stopSpinner(success = true, message) {
    if (this.spinner) {
      if (success) {
        this.spinner.succeed(message);
      } else {
        this.spinner.fail(message);
      }
      this.spinner = null;
    }
  }
}

export const logger = new Logger();