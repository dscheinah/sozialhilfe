#!/usr/bin/env bash

find ./src/frontend/ -type f \( -name "*.js" -or -name "*.html" \) \
    -exec sed -i -E "s#(css|img|js|pages|lib|\.)/.*?\\.(css|jpg|js|html)#\\0?$(date +%s)#g" {} \;
