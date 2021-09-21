#!/usr/bin/env node
const childProcess = require('child_process');
const StreamSnitch = require('stream-snitch');
const [, , cmdline1, regex, cmdline2, ...extraArgs] = process.argv;

const spawnWaitForOutput = (cmdline, regex) => {
    const snitch = new StreamSnitch(regex);
    const [cmd, ...args] = cmdline.split(' ');
    const proc = childProcess.spawn(cmd, args);
    proc.stdout.setEncoding('utf8');
    proc.stdout.pipe(snitch);
    return new Promise((resolve, reject) => {
        snitch.on('match', _ => resolve(proc));
        snitch.on('close', _ => reject(`Process '${cmdline}' ended without matching: ${regex}`));
    });
};

(async _ => {
    let proc1, proc2;
    try {
        proc1 = await spawnWaitForOutput(cmdline1, new RegExp(regex));
        const [cmd, ...args] = cmdline2.split(' ');
        proc2 = childProcess.spawnSync(cmd, [...args, ...extraArgs], { stdio: 'inherit' });
    } finally {
        if (proc1) {
            proc1.kill();
        }
        process.exit(proc2.status || -1);
    }
})();
