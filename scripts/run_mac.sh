#!/bin/bash

cd ../server
yarn start &
cd ../client
yarn start &

wait