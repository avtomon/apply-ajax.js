#!/usr/bin/env bash

SRC_DIR="$1_ru"
TO_LANG="$2"
TRANS_PATH="/var/www/trans"
CURRENT_PATH="$3"

UPPER_LANG=`echo "$TO_LANG" | awk '{print toupper($0)}'`

if [[ "$TO_LANG" = "en" ]]; then
    DESC_FILE="$CURRENT_PATH/README.md"
else
    DESC_FILE="$CURRENT_PATH/README.$TO_LANG-$UPPER_LANG.md"
fi

`"$TRANS_PATH" -no-autocorrect -no-ansi -no-warn "ru:$2" "file://$CURRENT_PATH/README.ru-RU.md" | sed -f translate.sed > "$DESC_FILE"`