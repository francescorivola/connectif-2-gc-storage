#!/usr/bin/env node

import cli from './cli';

cli().parseAsync(process.argv).catch(error => {
    console.error(error.message.red);
    process.exit(1);
});