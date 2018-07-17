#!/usr/bin/bash

BASE_PATH=`pwd`

gulp build

./translate.sh docs en "$BASE_PATH/"

git add -A
git commit --allow-empty-message -m '' --no-edit
git push origin master

composer update --prefer-source
