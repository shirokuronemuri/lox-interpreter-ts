#!/bin/sh
#
# Use this script to run your program LOCALLY.
#
# Note: Changing this script WILL NOT affect how CodeCrafters runs your program.
#
# Learn more: https://codecrafters.io/program-interface

# set -e # Exit early if any commands fail
# exec tsc
# Copied from .codecrafters/run.sh
#
# - Edit this to change how your program runs locally
# - Edit .codecrafters/run.sh to change how your program runs remotely
npm run build
echo "build finished"
exec npm run start "$@"

# TODO FIGURE OUT WHY IT'S NOT SHOWING ANYTHING
