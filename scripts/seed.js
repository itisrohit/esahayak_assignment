import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function runSeed() {
  try {
    console.log('Running seed script...');
    const { stdout, stderr } = await execPromise('npx ts-node --compiler-options \'{"module":"CommonJS"}\' prisma/seed.ts', {
      cwd: process.cwd(),
    });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('Seed script completed successfully!');
  } catch (error) {
    console.error('Error running seed script:', error);
  }
}

runSeed();