'use strict';
import { Utils } from "/vendor/avtomon/good-funcs.js/dist/js/GoodFuncs.js";
export var Templater;
(function (Templater) {
    /**
     * Кастомный объект ответа от сервера
     */
    class LiteResponse {
        constructor(data, ok, status, isJson) {
            this.data = data;
            this.ok = ok;
            this.status = status;
            this.isJson = isJson;
        }
    }
    Templater.LiteResponse = LiteResponse;
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
             * Хост по умолчанию
             *
             * @type {string}
             * @private
             */
            this._HOST = '';
            /**
             * Класс для обозначения клонируемых элементов
             *
             * @type {string}
             * @private
             */
            this._HIDE_CLASS = '';
            /**
             * Параметры запроса по умолчанию
             *
             * @type Params
             * @private
             */
            this._DEFAULT_PARAMS = {};
            /**
             * Субдомен для отправки форм
             *
             * @type {string}
             * @private
             */
            this._DEFAULT_SUBDOMAIN = '';
            /**
             * @type {string}
             * @private
             */
            this._DATA_DEPENDS_ON_ATTRIBUTE = 'data-depends-on';
            /**
             * @type {string}
             * @private
             */
            this._DEFAULT_ATTRIBUTE_PREFIX = 'data-default-';
            /**
             * @type {string}
             * @private
             */
            this._NO_DISPLAY_CLASS = 'no-display';
            /**
             * @type {string}
             * @private
             */
            this._PARENT_SELECTOR = '.parent';
            /**
             * @type {string}
             * @private
             */
            this._NO_DATA_SELECTOR = '.no-data';
            /**
             * @type {string}
             * @private
             */
            this._SUBPARENT_SELECTOR = '.subparent';
            Object.keys(ApplyAjax._defaultSettings).forEach(function (option) {
                this[option] = settings[option] || ApplyAjax._defaultSettings[option];
            }, this);
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
         * Хэндлер успешной отправки Ajax-запроса
         *
         * @param {LiteResponse} response - объект ответа сервера
         * @param {ErrorCallback} callbackError - обработчик ошибки, переданный вызывающим кодом
         * @param {OkCallback} callback - обработчик успешного выполнения запроса, переданный вызывающим кодом
         *
         * @returns {Promise<null | Object>}
         */
        async requestOkHandler(response, callbackError, callback) {
            if (response.status < 200 || response.status >= 400) {
                callbackError(response);
                return response;
            }
            this.response = response;
            if (response.data['redirect']) {
                window.location = response.data['redirect'];
            }
            else {
                callback && callback(response);
            }
            return response;
        }
        /**
         * @param {Response} response
         *
         * @returns {Promise<Templater.LiteResponse>}
         */
        static async getLiteResponse(response) {
            const contentType = response.headers.get('Content-Type'), isJson = (contentType && contentType.includes('application/json'));
            return new LiteResponse(isJson ? await response.json() : await response.text(), response.ok, response.status, isJson);
        }
        /**
         * Обертка Ajax-запроса к серверу
         *
         * @param {string} url - адрес обработки
         * @param {RawParams} rawParams - параметры запроса к серверу
         * @param {"GET" | "POST"} method - тип запроса (обычно GET или POST)
         * @param {OkCallback} callback - функция, отрабатывающая при успешном запросе
         * @param {ErrorCallback} callbackError - функция, отрабатывающая при ошибочном результате запроса
         * @param {Headers} headers - заголовки запроса
         *
         * @returns {Promise<LiteResponse | void>}
         */
        async request(url, rawParams, method = 'POST', callback = null, callbackError = null, headers = null) {
            if (!url) {
                throw new Error('URL запроса не задан');
            }
            let urlObject = new URL(this._HOST + url);
            let params = undefined;
            if (method === 'GET') {
                Object.keys(rawParams).forEach(function (key) {
                    if (Array.isArray(rawParams[key])) {
                        for (let index in rawParams[key]) {
                            urlObject.searchParams.append(key, rawParams[key][index]);
                        }
                        return;
                    }
                    urlObject.searchParams.append(key, rawParams[key]);
                });
            }
            else {
                params = rawParams instanceof FormData
                    ? rawParams
                    : new URLSearchParams(Object.assign(Object.assign({}, this._DEFAULT_PARAMS), rawParams));
            }
            callbackError = callbackError ? callbackError : this._DEFAULT_ERROR_CALLBACK;
            let options = {
                method: method,
                body: params,
                credentials: 'include',
                headers: new Headers(Object.assign(Object.assign(Object.assign({}, this._DEFAULT_HEADERS), {
                    hash: location.hash.replace('#', '')
                }), headers))
            };
            return fetch(urlObject.toString(), options)
                .then(async function (response) {
                const liteResponse = await ApplyAjax.getLiteResponse(response);
                this.requestOkHandler(liteResponse, callbackError, callback);
                return liteResponse;
            }.bind(this), async function (response) {
                const liteResponse = await ApplyAjax.getLiteResponse(response);
                callbackError && callbackError(liteResponse);
                return liteResponse;
            });
        }
        /**
         * Ajax-отправка формы
         *
         * @param {HTMLFormElement} form - форма, которую отправляем
         * @param {BeforeCallback} before - функция, выполняемая перед отправкой
         * @param {OkCallback} callback - коллбэк успешной отправки формы
         * @param {ErrorCallback} callbackError - коллбэк неудачной отправки формы
         * @param {string | null} url - адрес обработки
         *
         * @returns {Promise<LiteResponse | void>}
         */
        ajaxSubmit(form, before, callback, callbackError, url = null) {
            let self = this;
            let promise = new Promise(async function (resolve, reject) {
                let formData = new FormData(form), result = before ? await before(formData) : true;
                if (result) {
                    resolve(formData);
                    return;
                }
                reject();
            });
            return promise.then(function (formData) {
                if (!url && !form.getAttribute('action')) {
                    throw Error('URL or form action must be filled.');
                }
                const subdomain = form.dataset.subdomain !== undefined
                    ? form.dataset.subdomain
                    : self._DEFAULT_SUBDOMAIN, action = subdomain
                    ? `${subdomain}.${location.hostname}${form.getAttribute('action')}`
                    : form.getAttribute('action');
                return self.request(url || action, formData, 'POST', callback, callbackError);
            });
        }
        ;
        /**
         * Превратить объект FormData в обычный объект
         *
         * @param {FormData} formData - объект FormData
         *
         * @returns {Params}
         */
        static formDataToObject(formData) {
            let toObject = {};
            Array.from(formData.keys()).forEach(function (key) {
                toObject[key] = key.includes('[]') ? formData.getAll(key) : formData.get(key);
            });
            return toObject;
        }
        /**
         * Отправка формы при помощи воркера
         *
         * @param {HTMLFormElement} form - объект формы
         * @param {BeforeCallback} before - функция, выполняемая перед отправкой
         * @param {OkCallback} callback - коллбэк успешной отправки формы
         * @param {ErrorCallback} callbackError - коллбэк неудачной отправки формы
         * @param {string | null} url - адрес обработки
         *
         * @returns {Promise<Worker | void>}
         */
        async workerSubmit(form, before, callback, callbackError, url = null) {
            const self = this;
            if (window['Worker']) {
                if (!url && !form.getAttribute('action')) {
                    throw Error('URL or form action must be filled.');
                }
                if (!this.worker) {
                    this.worker = new Worker("/vendor/avtomon/apply-ajax.js/dist/js/workerSubmit.js");
                }
                let formData = new FormData(form), result = before ? await before(formData) : true;
                callbackError = callbackError ? callbackError : this._DEFAULT_ERROR_CALLBACK;
                if (!result) {
                    return;
                }
                const subdomain = form.dataset.subdomain !== undefined
                    ? form.dataset.subdomain
                    : self._DEFAULT_SUBDOMAIN, action = subdomain
                    ? `${subdomain}.${location.hostname}${form.getAttribute('action')}`
                    : form.getAttribute('action');
                this.worker.postMessage({
                    url: url || action,
                    formData: ApplyAjax.formDataToObject(formData),
                    headers: this._DEFAULT_HEADERS
                });
                this.worker.onmessage = function (response) {
                    const liteResponse = response.data;
                    return this.requestOkHandler(liteResponse, callbackError, callback);
                }.bind(this);
                return;
            }
            throw new Error('Веб-воркеры не поддерживаются браузером');
        }
        ;
        /**
         * @param {string[]} labels
         * @param {string[]} matches
         *
         * @returns {IMatches}
         */
        static isInsertable(labels, matches) {
            if (labels.filter(value => matches.includes(value)).length) {
                return {
                    matches: labels.filter(value => !matches.includes(value)),
                    insertable: true
                };
            }
            return {
                matches: matches,
                insertable: false
            };
        }
        /**
         * @param {string} html
         *
         * @returns {string}
         */
        stripHtml(html) {
            let tmp = document.createElement("DIV");
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || '';
        }
        /**
         * Модифицирует jQuery-элемент вставляя строки value в места отмеченные маркерами с key.
         *
         * @param {HTMLElement} object - объект, в который вставляем
         * @param {string} key - ключ для маркеров вставки
         * @param {string} value - значение для вставки
         *
         * @returns {void}
         */
        modifyElement(object, key, value) {
            let matches = (object.getAttribute(`data-in-${key}`) || '').trim(), insertable;
            if (!matches) {
                return;
            }
            matches = matches.split(',').map(function (item) {
                return item.trim();
            });
            if (null === value || '' === value) {
                value = object.getAttribute(`${this._DEFAULT_ATTRIBUTE_PREFIX}${key}`) || '';
            }
            ({ matches, insertable } = ApplyAjax.isInsertable(['html'], matches));
            if (insertable) {
                object.innerHTML = value;
            }
            ({ matches, insertable } = ApplyAjax.isInsertable(['text'], matches));
            if (insertable) {
                object.innerText = this.stripHtml(value);
            }
            ({ matches, insertable } = ApplyAjax.isInsertable(['class'], matches));
            if (insertable) {
                let classes = value.split(' ').map(function (item) {
                    return item.trim();
                });
                classes.forEach(function (className) {
                    object.classList.add(className);
                });
            }
            ({ matches, insertable } = ApplyAjax.isInsertable(['checked'], matches));
            if (insertable) {
                object.checked = Boolean(value);
            }
            ({ matches, insertable } = ApplyAjax.isInsertable(['selected'], matches));
            if (insertable) {
                object.selected = Boolean(value);
            }
            matches.forEach(function (attr) {
                const attrValue = object.getAttribute(attr);
                if (attrValue && attrValue.includes(`{${key}}`)) {
                    object.setAttribute(attr, attrValue.replace(new RegExp(`\{${key}\}`, 'g'), value));
                    return;
                }
                object.setAttribute(attr, value);
            });
        }
        /**
         * Вставить массив данных в шаблон. Если кортежей данных несколько, то копировать шаблон для каждого кортежа
         * и вставить вслед за исходным, а исходный скрыть, иначе просто вставить данные в шаблон
         *
         * @param {HTMLElement | NodeList} object - объект, в который вставляем
         * @param {Object | Object[]} data - данные для вставки
         *
         * @returns {HTMLElement | NodeList}
         */
        setMultiData(object, data = this.response.data) {
            if (typeof data !== 'object' || !Object.keys(data).length) {
                return object;
            }
            let self = this, objects = [];
            if (!Array.isArray(data)) {
                data = [data];
            }
            if (object instanceof Element) {
                objects.push(object);
            }
            else {
                objects = Array.from(object);
            }
            objects.forEach(function (parent) {
                self.isShowNoData(data, parent);
                self.dataDependsCheck(data, parent);
            });
            if (!data) {
                return object;
            }
            objects.forEach(function (item) {
                if (!item.classList.contains(self._HIDE_CLASS)) {
                    return self.setData(item, data);
                }
                data.forEach(function (record) {
                    let clone = item.cloneNode(true);
                    if (item.parentElement) {
                        self.setData(clone, record);
                        item.parentElement.appendChild(clone);
                    }
                });
            });
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
        setData(object, data) {
            if (typeof data !== 'object' || !Object.keys(data).length) {
                return object;
            }
            let dataObject = data;
            if (Array.isArray(data)) {
                dataObject = data[0];
            }
            let self = this;
            Object.keys(dataObject).forEach(function (prop) {
                if (dataObject[prop] instanceof Object) {
                    self.setMultiData(object.querySelectorAll(`.${prop}${self._SUBPARENT_SELECTOR}`), dataObject[prop]);
                    return;
                }
                if (ApplyAjax.isJson(dataObject[prop])) {
                    dataObject[prop] = JSON.parse(dataObject[prop]);
                    self.setMultiData(object.querySelectorAll(`.${prop}${self._SUBPARENT_SELECTOR}`), dataObject[prop]);
                }
                self.modifyElement(object, prop, dataObject[prop]);
                object.querySelectorAll(`[data-in-${prop}]`).forEach(function (item) {
                    if (!self.dataDependsCheck(dataObject[prop], item)) {
                        return;
                    }
                    self.modifyElement(item, prop, dataObject[prop]);
                });
            });
            object.classList.remove(this._HIDE_CLASS);
            return object;
        }
        /**
         * Если данных нет, то прячет зависимые от этих данных элементы
         *
         * @param data
         * @param {HTMLElement} element
         *
         * @returns {boolean}
         */
        dataDependsCheck(data, element) {
            if (data) {
                return true;
            }
            let dependsParents, self = this;
            if (element.hasAttribute(this._DATA_DEPENDS_ON_ATTRIBUTE)) {
                dependsParents = [element];
            }
            else {
                dependsParents = Utils.GoodFuncs.parents(element, `[${this._DATA_DEPENDS_ON_ATTRIBUTE}]`)
                    .filter(function (parent) {
                    return element.matches(parent.getAttribute(self._DATA_DEPENDS_ON_ATTRIBUTE) || '');
                });
            }
            if (!dependsParents.length) {
                return true;
            }
            dependsParents.forEach(function (parent) {
                parent.classList.add(self._NO_DISPLAY_CLASS);
            });
            return false;
        }
        /**
         * Показать блок с сообщением об отсутствии данных, если данных нет
         *
         * @param {Object[]} data
         * @param {HTMLElement} parent
         *
         * @returns {boolean}
         */
        isShowNoData(data, parent) {
            let p = parent.parentElement ? parent.parentElement.closest(this._PARENT_SELECTOR) : null, noDataElement = p ? p.querySelector(this._NO_DATA_SELECTOR) : null;
            if (!noDataElement || !p) {
                return true;
            }
            let self = this;
            if (!data) {
                Array.from(p.children).forEach(function (child) {
                    child.classList.add(self._NO_DISPLAY_CLASS);
                });
                noDataElement.classList.remove(this._NO_DISPLAY_CLASS);
                return false;
            }
            Array.from(p.children).forEach(function (child) {
                child.classList.remove(self._NO_DISPLAY_CLASS);
            });
            noDataElement.classList.add(this._NO_DISPLAY_CLASS);
            return true;
        }
    }
    /**
     * Значения по умолчанию
     */
    ApplyAjax._defaultSettings = {
        _HOST: window.location.origin && window.location.origin !== 'null'
            ? window.location.origin
            : window.location.ancestorOrigins[0],
        _HIDE_CLASS: 'clone',
        _DEFAULT_ERROR_CALLBACK: function (liteResponse) {
            alert(liteResponse.data['message'] || 'Произошла ошибка');
        },
        _DEFAULT_HEADERS: {
            processData: true,
            'X-REQUESTED-WITH': 'xmlhttprequest',
            Accept: 'application/json'
        },
        _DEFAULT_PARAMS: {
            XDEBUG_SESSION_START: 'PHPSTORM'
        },
        _DEFAULT_SUBDOMAIN: 'save'
    };
    Templater.ApplyAjax = ApplyAjax;
})(Templater || (Templater = {}));
