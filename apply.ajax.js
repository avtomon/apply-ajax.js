$(function () {
    "use strict";

    const HIDE_CLASS = 'clone';

    /**
     * Умная обертка к Ajax-запросу к серверу
     *
     * @param url - адрес обработки
     * @param params - параметры запроса к серверу
     * @param async - асинхронно ли отправлять запрос?
     * @param type - тип запроса (обычно GET или POST)
     *
     * @param callback - функция, отрабатывающая при успешном запросе
     * @param callbackError - функция, отрабатывающая при ошибочном результате запроса
     */
    function request(url, params, async, type, callback, callbackError)
    {
        if (!url) {
            return false;
        }
        params.pagecache_flush = params.pagecache_flush || 0;

        let error = callbackError ? callbackError : alert;

        $.ajax(url, {
            type: type || 'GET',
            dataType: 'json',
            data: params,
            async: async || true,
            success: function (data) {
                if (data.error !== undefined) {
                    error('Произошла ошибка: ' + data.error);
                } else if (data.redirect) {
                    window.location = data.redirect;
                } else if (data.success !== undefined) {
                    callback ? callback(data) : alert('Запрос успешно выполнен');
                } else {
                    error('Произошла ошибка');
                }
            },
            error: function (XMLHttpRequest, textStatus) {
                error('Произошла ошибка: ' + textStatus);
            }
        });
    }

    /**
     * Модифицирует jQuery-элемент вставляя строки value в места отмеченные маркерами с key
     *
     * @param {string} key - ключ для маркеров вставки
     * @param {string} value - значение для вставки
     *
     * @returns {jQuery|boolean}
     */
    $.fn.modifyElement = function (key, value)
    {
        let self = $(this),
            matches = [],
            mask = new RegExp('in_(.+?)_' + key, 'g'),
            overlap;

        while (!(overlap = mask.exec(self.attr('class')))) {
            matches.push(overlap[1]);
        }

        if (!matches.length) {
            return false;
        }

        let insertValue = function (label) {
            let i = $.inArray(label, matches);
            if (i >= 0) {
                delete matches[i];
                return true;
            } else {
                return false;
            }
        };

        if(insertValue('text')) {
            self.html(value);
        }

        if(insertValue('class')) {
            self.addClass(value);
        }

        if(insertValue('val') || insertValue('val')) {
            self.val(value);
        }

        matches.forEach( function () {
            self.attr(this, value);
        });

        return self;
    };

    /**
     * Вставить массив данных в шаблон. Если кортежей данных несколько, то копировать шаблон для каждого кортежа и вставить вслед за исходным,
     * а исходный скрыть, иначе просто вставить данные в шаблон
     *
     * @param {object} data - данные для вставки
     *
     * @returns {jQuery|boolean}
     */
    $.fn.setMultiData = function (data)
    {
        let self = $(this);
        if (!data.success || !data.success.length) {
            return false;
        }

        data = data.success;

        if (!this.hasClass(HIDE_CLASS)) {
            return self.setData(data);
        }

        if (!data[0]) {
            data[0] = data;
        }

        this.addClass(HIDE_CLASS);
        data.forEach( function() {
            self.clone(true).appendTo(self.parent()).setData(this);
        });

        return self;
    };

    /**
     * Вставить набор данных в шаблон, предполагается что на вход дается только один кортеж данных
     *
     * @param data - данные для вставки
     *
     * @returns {jQuery|boolean}
     */
    $.fn.setData = function (data)
    {
        let self = $(this);

        if (!data || !data.length) {
            return false;
        }

        if (data.success) data = data.success;
        if (data[0]) data = data[0];

        self.removeClass(HIDE_CLASS);

        for (let prop in data) {
            if (data.hasOwnProperty(prop)) self.modifyElement(prop, data[prop]);
        }

        return self;
    }
});