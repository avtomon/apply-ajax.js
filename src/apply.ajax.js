$(function () {
    "use strict";

    const HIDE_CLASS = 'clone';
    const HOST = 'http://private.futuredu-test.ru';

    /**
     * Умная обертка к Ajax-запросу к серверу
     *
     * @param {string} url - адрес обработки
     * @param {object} params - параметры запроса к серверу
     * @param {bool} async - асинхронно ли отправлять запрос?
     * @param {string} type - тип запроса (обычно GET или POST)
     *
     * @param {function} callback - функция, отрабатывающая при успешном запросе
     * @param {function} callbackError - функция, отрабатывающая при ошибочном результате запроса
     */
    function request(url, params, async, type, callback, callbackError)
    {
        if (!url) {
            return false;
        }
        //params.append('XDEBUG_SESSION', 'PHPSTORM');

        let d = $.Deferred(),
            error = callbackError ? callbackError : alert;

        $.ajax(HOST + url, {
            type: type || 'GET',
            dataType: 'json',
            contentType: false,
            processData: false,
            data: params,
            async: async ? true : false,
            success: function (data) {
                if (data.error !== undefined) {
                    error('Произошла ошибка: ' + data.error);
                    d.reject();
                } else if (data.redirect) {
                    window.location = data.redirect;
                } else {
                    callback ? callback(data) : alert('Запрос успешно выполнен');
                    d.resolve();
                }
            },
            error: function (XMLHttpRequest, textStatus) {
                error('Произошла ошибка: ' + textStatus);
                d.reject();
            }
        });

        return d.promise();
    }

    $.fn.ajaxSubmit = function (before, callback, callbackError, after) {
        if (!this.is('form')) {
            return false;
        }

        let f = $(this),
            d = $.Deferred( function () {
            if (!before) {
                this.resolve();
                return;
            }

            if (before()) {
                this.resolve();
            } else {
                this.reject();
            }

            this.done(request(
                f.attr('action'),
                new FormData(f[0]),
                true,
                f.attr('method'),
                callback,
                callbackError)
                .always(after))
        });

        return d.promise();
    };

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
        let self = this,
            matches = [],
            mask = new RegExp('in_(.+?)_' + key, 'g'),
            overlap;

        while (!(overlap = mask.exec(self.attr('class')))) {
            matches.push(overlap[1]);
        }

        if (!matches.length) {
            return false;
        }

        let isInsertable = function (label) {
            let i = $.inArray(label, matches);
            if (i >= 0) {
                delete matches[i];
                return true;
            } else {
                return false;
            }
        };

        if(isInsertable('text')) {
            self.html(value);
        }

        if(isInsertable('class')) {
            self.addClass(value);
        }

        if(isInsertable('val') || insertValue('value')) {
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
        let self = this;
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

        data.forEach( function() {
            self.clone(true).appendTo(self.parent()).setData(this);
        });

        return self;
    };

    /**
     * Вставить набор данных в шаблон, предполагается что на вход дается только один кортеж данных
     *
     * @param {object} data - данные для вставки
     *
     * @returns {jQuery|boolean}
     */
    $.fn.setData = function (data)
    {
        if (!data || !data.length) {
            return false;
        }

        let self = this;

        if (data.success) data = data.success;
        if (data[0]) data = data[0];

        for (let prop in data) {
            if (data.hasOwnProperty(prop)) {
                self.modifyElement(prop, data[prop]);
            }

            if (data[prop] instanceof Object) {
                self.find('.' + prop).setMultiData(data[prop]);
            } else {
                self.find("*[class*=_" + prop).each( function ()
                {
                    $(this).modifyElement(prop, data[prop]);
                });
            }
        }

        self.removeClass(HIDE_CLASS);

        return self;
    }
});
