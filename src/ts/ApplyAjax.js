'use strict';
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
             */
            this._HOST = '';
            /**
             * Класс для обозначения клонируемых элементов
             *
             * @type {string}
             */
            this._HIDE_CLASS = '';
            /**
             * В какие атрибуты можно вставлять данные
             *
             * @type {string[]}
             */
            this._ALLOWED_ATTRS = [];
            /**
             * Параметры запроса по умолчанию
             *
             * @type Params
             */
            this._DEFAULT_PARAMS = {};
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
            if (response.status === 307 && response.data['redirect']) {
                window.location = response['redirect'];
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
                    : new URLSearchParams(Object.assign({}, this._DEFAULT_PARAMS, rawParams));
            }
            callbackError = callbackError ? callbackError : this._DEFAULT_ERROR_CALLBACK;
            let options = {
                method: method,
                body: params,
                credentials: 'include',
                headers: new Headers(Object.assign({}, this._DEFAULT_HEADERS, {
                    hash: location.hash.replace('#', '')
                }, headers))
            };
            return fetch(urlObject.toString(), options)
                .then(async function (response) {
                const liteResponse = await ApplyAjax.getLiteResponse(response);
                this.requestOkHandler(liteResponse, callbackError, callback);
                return liteResponse;
            }.bind(this), async function (response) {
                const liteResponse = await ApplyAjax.getLiteResponse(response);
                callbackError(liteResponse);
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
         * @returns {Promise<Response | void>}
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
                return self.request(url || form.getAttribute('action'), formData, 'POST', callback, callbackError);
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
            if (window['Worker']) {
                if (!this.worker) {
                    this.worker = new Worker("/vendor/avtomon/apply-ajax.js/dist/js/workerSubmit.js");
                }
                let formData = new FormData(form), result = before ? await before(formData) : true;
                callbackError = callbackError ? callbackError : this._DEFAULT_ERROR_CALLBACK;
                if (!result) {
                    return;
                }
                this.worker.postMessage({
                    url: url || form.action,
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
         * Модифицирует jQuery-элемент вставляя строки value в места отмеченные маркерами с key.
         *
         * @param {HTMLElement} object - объект, в который вставляем
         * @param {string} key - ключ для маркеров вставки
         * @param {string} value - значение для вставки
         *
         * @returns {void}
         */
        modifyElement(object, key, value) {
            if (object.classList.contains(`in_text_${key}`)) {
                object.innerHTML = value;
            }
            if (object.classList.contains(`in_class_${key}`)) {
                object.classList.add(value);
            }
            if (object.classList.contains(`in_href_${key}`)) {
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
        }
        /**
         * Вставить массив данных в шаблон. Если кортежей данных несколько, то копировать шаблон для каждого кортежа
         * и вставить вслед за исходным, а исходный скрыть, иначе просто вставить данные в шаблон
         *
         * @param {HTMLElement | NodeList} object - объект, в который вставляем
         * @param {Object | Object[] | string} data - данные для вставки
         *
         * @returns {HTMLElement | NodeList}
         */
        setMultiData(object, data = this.response.data) {
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
                let dataArray = [];
                if (!Array.isArray(data)) {
                    dataArray[0] = data;
                }
                else {
                    dataArray = data;
                }
                dataArray.forEach(function (record) {
                    let clone = item.cloneNode(true);
                    if (item.parentElement) {
                        item.parentElement.appendChild(clone);
                        this.setData(clone, record);
                    }
                }, this);
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
        setData(object, data) {
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
                    let selectorsArray = [];
                    this._ALLOWED_ATTRS.forEach(function (attr) {
                        selectorsArray.push(`[class*='in_${attr}_${prop}']`);
                    });
                    object.querySelectorAll(selectorsArray.join(', ')).forEach(function (item) {
                        this.modifyElement(item, prop, data[prop]);
                    }, this);
                }
            }, this);
            object.classList.remove(this._HIDE_CLASS);
            return object;
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
        _ALLOWED_ATTRS: [
            'class',
            'text',
            'val',
            'value',
            'id',
            'src',
            'title',
            'href',
            'data-object-src',
            'data-type',
            'data-file-type',
            'data-form',
            'data-src',
            'data-object-src',
            'data-account-id'
        ],
        _DEFAULT_ERROR_CALLBACK: function (liteResponse) {
            alert(liteResponse.data['message'] || 'Произошла ошибка');
        },
        _DEFAULT_HEADERS: {
            processData: true,
            'X-REQUESTED-WITH': 'xmlhttprequest'
        },
        _DEFAULT_PARAMS: {
            XDEBUG_SESSION_START: 'PHPSTORM'
        }
    };
    Templater.ApplyAjax = ApplyAjax;
})(Templater || (Templater = {}));
