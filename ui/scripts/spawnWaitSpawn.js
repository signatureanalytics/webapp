#!/usr/bin/env node
const yargs = require('yargs');
const childProcess = require('child_process');
const StreamSnitch = require('stream-snitch');

const argv = yargs
    .usage(
        `spawnWaitSpawn.js takes three arguments: "<cmdline1>" "<regex>" "<cmdline2>"

cmdline1 is spawned (proc1) and it's stdout stream is monitored for text matching regex. \
cmdline2 is spawned (proc2) when that text is found. When proc2 exits, proc1 is killed and \
spawnWaitSpawn exits with proc2's exitcode. Any additional parameters passed to \
spawnWaitSpawn beyond cmdline2 are included as extra parameters to spawn proc2.

example use: 

./spawnWaitSpawn.js "./server.sh start" "server started at https?://.*" npm test `
    )
    .options('timeout', {
        alias: 't',
        description: 'seconds to wait for text matching regex before giving up',
        type: 'number',
    }).argv;

const [cmdline1, regex, cmdline2, ...extraArgs] = argv._;
const timeout = (argv.timeout ?? 60) * 1000;

const spawnWaitForOutput = (cmdline, regex) => {
    const snitch = new StreamSnitch(regex);
    const [cmd, ...args] = cmdline.split(' ');
    const proc = childProcess.spawn(cmd, args);
    setTimeout(_ => {
        console.error(`Process '${cmdline}' timed out without matching ${regex}`);
        proc.kill();
    }, timeout);
    proc.stdout.setEncoding('utf8').pipe(snitch);
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
        process.exit(proc2?.status ?? -1);
    }
})();
