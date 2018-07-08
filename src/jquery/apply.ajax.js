(function ($) {
    'use strict';

    let applyAjax = $.applyAjax = {},
        HIDE_CLASS = 'clone',
        HOST = location.origin,
        ALLOWED_ATTRS = ['class', 'text', 'val', 'value', 'id', 'src', 'title', 'href', 'data-object-src'],
        DEFAULT_ERROR_CALLBACK = alert,
        REQUEST_SETTINGS = {
            processData: true
        },
        DEFAULT_PARAMS = {};

    /**
     * Конструктор
     *
     * @param {string} HOST - хост на который будут отправляться запросы
     * @param {string} HIDE_CLASS - класс-метка для вставки массива записей
     * @param {string} ALLOWED_ATTRS - какие атрибуты разрешено вставлять в HTML-элементы
     * @param {string} DEFAULT_ERROR_CALLBACK - обработчик ошибки по умолчанию
     * @param {object} REQUEST_SETTINGS - настройки Ajax по умолчанию
     * @param {object} DEFAULT_PARAMS - параметры запроса по умолчанию
     */
    applyAjax.init = function (settings = {})
    {
        HOST = settings.HOST || HOST;
        HIDE_CLASS = settings.HIDE_CLASS || HIDE_CLASS;
        ALLOWED_ATTRS = settings.ALLOWED_ATTRS || ALLOWED_ATTRS;
        DEFAULT_ERROR_CALLBACK = settings.DEFAULT_ERROR_CALLBACK || DEFAULT_ERROR_CALLBACK;
        REQUEST_SETTINGS = settings.REQUEST_SETTINGS || REQUEST_SETTINGS;
        DEFAULT_PARAMS = settings.DEFAULT_PARAMS || DEFAULT_PARAMS;
    }

    /**
     * Является ли входное значение JSON-структурой
     *
     * @param str - проверяемое значение
     *
     * @returns {boolean}
     */
    function isJson(str) {
        try {
            let json = JSON.parse(str);
            if (json instanceof Object) {
                return true;
            }
        } catch (e) {

        }

        return false;
    }

    /**
     * Умная обертка к Ajax-запросу к серверу
     *
     * @param {string} url - адрес обработки
     * @param {object} params - параметры запроса к серверу
     * @param {bool} async - асинхронно ли отправлять запрос?
     * @param {string} type - тип запроса (обычно GET или POST)
     * @param {function} callback - функция, отрабатывающая при успешном запросе
     * @param {function} callbackError - функция, отрабатывающая при ошибочном результате запроса
     * @param {bool} processData - преобразовывать ли параметры запроса в строку
     */
    applyAjax.request = function(url, params, async, type, callback, callbackError, requestSettings = REQUEST_SETTINGS)
    {
        if (!url) {
            return false;
        }

        let error = callbackError ? callbackError : DEFAULT_ERROR_CALLBACK;

        $.ajax(HOST + url + '?XDEBUG_SESSION_START=PHPSTORM', $.extend({}, {
            type: type || 'GET',
            contentType: requestSettings.processData ? 'application/x-www-form-urlencoded' : false,
            data: params instanceof FormData ? params : $.extend({}, DEFAULT_PARAMS, params),
            xhrFields: {
                withCredentials: true
            },
            headers: {
                hash: location.hash.replace('#', '')
            },
            async: async ? true : false,
            success: function (data) {
                if (!isJson(data)) {
                    callback ? callback(data) : alert('Запрос успешно выполнен');
                    return;
                }

                data = JSON.parse(data);
                if (data.error !== undefined) {
                    error(data.error);
                } else if (data.redirect) {
                    window.location = data.redirect;
                } else {
                    callback ? callback(data) : alert('Запрос успешно выполнен');
                }
            },
            error: function (XMLHttpRequest, textStatus) {
                error('Произошла ошибка: ' + textStatus);
            }
        }, requestSettings));
    }

    /**
     * Ajax-отправка формы
     *
     * @param {jQuery} object - Форма, которую отправляем
     * @param {function} before - функция, выполняемая перед отправкой
     * @param {function} callback - коллбэк успешной отправки формы
     * @param {function} callbackError - коллбэк неудачной отправки формы
     * @param {function} after - эта функция выполняется полсе отправки формы (успешной либо нет)
     *
     * @returns {*}
     */
    applyAjax.ajaxSubmit = function (form, before, callback, callbackError, after)
    {
        let formData;
        if (!form.is('form')) {
            return false;
        }

        let p = new Promise(function (resolve, reject) {
            //alert(before);
            if (!before) {
                //resolve();
                return;
            }

            let result = before(form)
            if (result) {
                formData = result instanceof FormData ? result : new FormData(form[0])
                resolve();
            } else {
                reject();
            }
        });

        p.then(
            function () {
                applyAjax.request(
                    form.attr('action'),
                    formData,
                    true,
                    form.attr('method'),
                    callback,
                    callbackError,
                    {
                        processData: false
                    }
                );
            }
        );

        return false;
    };

    /**
     * Проверка на наличеие метки вставки
     *
     * @param {string} label
     * @param {array} matches
     *
     * @returns {boolean}
     */
    function isInsertable(label, matches) {
        let i = $.inArray(label, matches);
        if (i >= 0) {
            delete matches[i];
            return true;
        } else {
            return false;
        }
    };

    /**
     * Модифицирует jQuery-элемент вставляя строки value в места отмеченные маркерами с key
     *
     * @param {jQuery} object - объект, в который вставляем
     * @param {string} key - ключ для маркеров вставки
     * @param {string} value - значение для вставки
     *
     * @returns {jQuery|boolean}
     */
    function modifyElement(object, key, value)
    {
        let matches = [],
            mask = new RegExp('in_(' + ALLOWED_ATTRS.join('|') + ')_' + key, 'g'),
            overlap;

        while (overlap = mask.exec(object.attr('class'))) {
            matches.push(overlap[1]);
        }

        if (!matches.length) {
            return false;
        }

        if(isInsertable('text', matches)) {
            object.html(value);
        }

        if(isInsertable('class', matches)) {
            object.addClass(value);
        }

        if(isInsertable('href', matches)) {
            object.attr('href', object.attr('href') + value);
        }

        if(isInsertable('val', matches) || isInsertable('value', matches)) {
            object.val(value);
        }

        matches.forEach(function(attr) {
            object.attr(attr, value);
        });

        return object;
    };

    /**
     * Вставить массив данных в шаблон. Если кортежей данных несколько, то копировать шаблон для каждого кортежа и вставить вслед за исходным,
     * а исходный скрыть, иначе просто вставить данные в шаблон
     *
     * @param {jQuery} object - объект, в который вставляем
     * @param {object} data - данные для вставки
     *
     * @returns {jQuery|boolean}
     */
    applyAjax.setMultiData = function (object, data)
    {
        if (!data instanceof Object || !Object.keys(data).length) {
            return false;
        }

        if (!object.hasClass(HIDE_CLASS)) {
            return applyAjax.setData(object, data);
        }

        if (!data[0]) {
            data[0] = data;
        }

        data.forEach( function(record) {
            applyAjax.setData(
                object
                    .clone(true)
                    .appendTo(object.parent()),
                record
            );
        });

        return object;
    };

    /**
     * Вставить набор данных в шаблон, предполагается что на вход дается только один кортеж данных
     *
     * @param {jQuery} object - объект, в который вставляем
     * @param {object} data - данные для вставки
     *
     * @returns {jQuery|boolean}
     */
    applyAjax.setData = function (object, data)
    {
        if (!data instanceof Object || !Object.keys(data).length) {
            return false;
        }

        if (data[0]) data = data[0];

        for (let prop in data) {
            if (!data.hasOwnProperty(prop)) {
                continue;
            }

            if (data[prop] instanceof Object) {
                applyAjax.setMultiData(object.find('.' + prop), data[prop]);
            } else if (isJson(data[prop])) {
                data[prop] = JSON.parse(data[prop]);
                applyAjax.setMultiData(object.find('.' + prop), data[prop]);
            } else {
                modifyElement(object, prop, data[prop]);

                object.find('*[class*=_' + prop + ']').each( function () {
                    modifyElement($(this), prop, data[prop]);
                });
            }
        }

        object.removeClass(HIDE_CLASS);

        return object;
    }
}(typeof jQuery === 'function' ? jQuery : this));