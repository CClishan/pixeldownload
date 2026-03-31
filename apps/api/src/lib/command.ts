import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { AppError } from './errors.js';

const execFileAsync = promisify(execFile);

export type CommandRunnerResult = {
  stdout: string;
  stderr: string;
};

export type CommandRunner = (command: string, args: string[]) => Promise<CommandRunnerResult>;

export const runCommand: CommandRunner = async (command, args) => {
  try {
    const result = await execFileAsync(command, args, {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      timeout: 60_000
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new AppError('provider_unavailable', `${command} is not installed on this API.`, 500);
    }

    if (error && typeof error === 'object' && 'stdout' in error && 'stderr' in error) {
      const stderr = typeof error.stderr === 'string' ? error.stderr : '';
      const stdout = typeof error.stdout === 'string' ? error.stdout : '';
      const message = [stderr, stdout].find((value) => value.trim().length > 0);
      throw new AppError('provider_error', message?.trim() || `${command} failed to execute.`, 502);
    }

    throw error;
  }
};
