'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var Templater;
(function (Templater) {
    /**
     * Абстракция ajax-запросов к серверу + шаблонизация полученных данных.
     */
    class ApplyAjax {
        /**
         * Конструктор
         *
         * @param {Templater.IApplyAjaxArgs} settings - настройки
         */
        constructor(settings = {}) {
            /**
             * Параметры запроса по умолчанию
             *
             * @type Params
             */
            this._DEFAULT_PARAMS = {};
            /**
             * Результат выполнения запроса
             *
             * @type Object | Object[] | string
             */
            this.data = {};
            Object.keys(ApplyAjax.defaultSettings).forEach(function (option) {
                this[option] = settings[option] || ApplyAjax.defaultSettings[option];
            });
        }
        /**
         * Является ли входное значение JSON-структурой
         *
         * @param {string} str - проверяемое значение
         *
         * @returns {boolean}
         */
        static isJson(str) {
            try {
                let json = JSON.parse(str);
                if (json instanceof Object) {
                    return true;
                }
            }
            catch (e) {
            }
            return false;
        }
        /**
         * Обертка Ajax-запроса к серверу
         *
         * @param {string} url - адрес обработки
         * @param {RawParams} rawParams - параметры запроса к серверу
         * @param {"GET" | "POST"} method - тип запроса (обычно GET или POST)
         * @param {OkCallback} callback - функция, отрабатывающая при успешном запросе
         * @param {ErrorCallback} callbackError - функция, отрабатывающая при ошибочном результате запроса
         * @param {object} headers - заголовки запроса
         *
         * @returns {Promise<Response | Error>}
         */
        request(url, rawParams, method, callback, callbackError, headers) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!url) {
                    return new Error('URL запроса не задан');
                }
                let self = this, urlObject = new URL(this._HOST + url), params = rawParams instanceof FormData ? rawParams : new URLSearchParams(Object.assign({}, this._DEFAULT_PARAMS, rawParams));
                if (method === 'GET') {
                    Object.keys(params).forEach(key => urlObject.searchParams.append(key, params[key]));
                    params = null;
                }
                let error = callbackError ? callbackError : this._DEFAULT_ERROR_CALLBACK, options = Object.assign({}, this._DEFAULT_HEADERS, {
                    method: method,
                    body: params,
                    credentials: 'include',
                    headers: new Headers({
                        hash: location.hash.replace('#', ''),
                    })
                }, headers);
                return fetch(urlObject.toString(), options).then(function (response) {
                    response.json().then(function (data) {
                        self.data = data;
                        if (data.error !== undefined) {
                            error(data.error);
                        }
                        else if (data.redirect) {
                            window.location = data.redirect;
                        }
                        else {
                            callback ? callback(data) : alert('Запрос успешно выполнен');
                        }
                    });
                    return response;
                }, function (e) {
                    error(`Произошла ошибка: ${e.message}`);
                    return e;
                });
            });
        }
        /**
         * Ajax-отправка формы
         *
         * @param {HTMLFormElement} form - форма, которую отправляем
         * @param {} before - функция, выполняемая перед отправкой
         * @param {OkCallback} callback - коллбэк успешной отправки формы
         * @param {ErrorCallback} callbackError - коллбэк неудачной отправки формы
         * @param {OkCallback} after - эта функция выполняется после успешной отправки формы
         *
         * @returns {Promise<Response | Error>}
         */
        ajaxSubmit(form, before, callback, callbackError, after) {
            let self = this;
            return new Promise(function (resolve) {
                return __awaiter(this, void 0, void 0, function* () {
                    let formData = new FormData(form);
                    if (!before) {
                        resolve();
                        return formData;
                    }
                    return before(formData);
                });
            }).then(function (formData) {
                let response = self.request(form.action, formData, 'POST', callback, callbackError);
                response.then(after);
                return response;
            }, function (e) {
                callbackError(e.message);
                return e;
            });
        }
        ;
        /**
         * Модифицирует jQuery-элемент вставляя строки value в места отмеченные маркерами с key.
         *
         * @param {HTMLElement} object - объект, в который вставляем
         * @param {string} key - ключ для маркеров вставки
         * @param {string} value - значение для вставки
         *
         * @returns {HTMLElement}
         */
        modifyElement(object, key, value) {
            if (object.classList.contains(`in_text_{$key}`)) {
                object.innerHTML = value;
            }
            if (object.classList.contains(`in_class_{$key}`)) {
                object.classList.add(value);
            }
            if (object.classList.contains(`in_href_{$key}`)) {
                let objectAnchor = object;
                objectAnchor.href = objectAnchor.href + value;
            }
            if (object.classList.contains('val') || object.classList.contains('value')) {
                object.value = value;
            }
            this._ALLOWED_ATTRS.forEach(function (attr) {
                if (['text', 'class', 'href', 'val', 'value'].indexOf(attr) >= 0) {
                    return;
                }
                object.setAttribute(attr, value);
            });
            return object;
        }
        /**
         * Вставить массив данных в шаблон. Если кортежей данных несколько, то копировать шаблон для каждого кортежа и вставить вслед за исходным,
         * а исходный скрыть, иначе просто вставить данные в шаблон
         *
         * @param {HTMLElement | NodeList} object - объект, в который вставляем
         * @param {Object | Object[] | string} data - данные для вставки
         *
         * @returns {HTMLElement | NodeList}
         */
        setMultiData(object, data = this.data) {
            if (typeof data !== 'object' || !Object.keys(data).length) {
                return object;
            }
            let self = this, objects = [];
            if (object instanceof Element) {
                objects.push(object);
            }
            else {
                objects = Array.from(object);
            }
            objects.forEach(function (item) {
                if (!item.classList.contains(this._HIDE_CLASS)) {
                    return this.setData(object, data);
                }
                let dataArray;
                if (!Array.isArray(data)) {
                    dataArray[0] = data;
                }
                else {
                    dataArray = data;
                }
                dataArray.forEach(function (record) {
                    let clone = item.cloneNode(true);
                    item.parentElement.appendChild(clone);
                    self.setData(clone, record);
                });
            }, this);
            return object;
        }
        /**
         * Вставить набор данных в шаблон, предполагается что на вход дается только один кортеж данных
         *
         * @param {HTMLElement} object - объект, в который вставляем
         * @param {Object | Object[] | string} data - данные для вставки
         *
         * @returns {HTMLElement}
         */
        setData(object, data = this.data) {
            if (typeof data !== 'object' || !Object.keys(data).length) {
                return object;
            }
            let dataObject = data;
            if (Array.isArray(data)) {
                dataObject = data[0];
            }
            Object.keys(dataObject).forEach(function (prop) {
                if (dataObject[prop] instanceof Object) {
                    this.setMultiData(object.querySelectorAll('.' + prop), data[prop]);
                }
                else if (ApplyAjax.isJson(data[prop])) {
                    data[prop] = JSON.parse(data[prop]);
                    this.setMultiData(object.querySelectorAll('.' + prop), data[prop]);
                }
                else {
                    this.modifyElement(object, prop, data[prop]);
                    object.querySelectorAll('[class*=_' + prop + ']').forEach(function (item) {
                        this.modifyElement(item, prop, data[prop]);
                    });
                }
            }, this);
            object.classList.remove(this._HIDE_CLASS);
            return object;
        }
    }
    ApplyAjax.defaultSettings = {
        _HIDE_CLASS: 'clone',
        _HOST: location.origin,
        _ALLOWED_ATTRS: ['class', 'text', 'val', 'value', 'id', 'src', 'title', 'href', 'data-object-src'],
        _DEFAULT_ERROR_CALLBACK: alert,
        _DEFAULT_HEADERS: {
            processData: true
        },
        _DEFAULT_PARAMS: {
            XDEBUG_SESSION_START: 'PHPSTORM'
        }
    };
    Templater.ApplyAjax = ApplyAjax;
})(Templater || (Templater = {}));
//# sourceMappingURL=ApplyAjax.js.map