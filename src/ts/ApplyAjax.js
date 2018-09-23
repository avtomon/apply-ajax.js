'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export var Templater;
(function (Templater) {
    /**
     * Абстракция ajax-запросов к серверу + шаблонизация полученных данных. Принцип шаблонизации такой те как у [avtomon/PQSkaTpl](https://github.com/avtomon/PQSkaTpl)
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
            /**
             * Результат выполнения запроса
             *
             * @type Object | Object[] | string
             */
            this.data = {};
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
         * Запрос файлов с прослойкой из кэша
         *
         * @param {string} url
         * @param {FileOkCallback} fileCallback
         * @param {FileTypeHandler} type
         * @returns {Promise<Templater.FileType>}
         */
        requestFile(url, fileCallback, type = 'text') {
            return __awaiter(this, void 0, void 0, function* () {
                if (!ApplyAjax._fileCache[url]) {
                    ApplyAjax._fileCache[url] = yield fetch(url).then(function (response) {
                        return response[type]();
                    });
                }
                fileCallback(ApplyAjax._fileCache[url]);
                return ApplyAjax._fileCache[url];
            });
        }
        /**
         * Хэндлер успешной отправки Ajax-запроса
         *
         * @param {Response} response - объект ответа сервера
         * @param {OkCallback} callback - обработчик успешного выполнения запроса, переданный вызывающим кодом
         * @param {ErrorCallback} error - обработчик ошибки, переданный вызывающим кодом
         *
         * @returns {Promise<any>}
         */
        requestOkHandler(response, callback, callbackError) {
            return response.json().then(function (data) {
                this.data = data;
                if (data.error !== undefined) {
                    callbackError(data.error);
                }
                else if (data.redirect) {
                    window.location = data.redirect;
                }
                else {
                    callback ? callback(data) : alert('Запрос успешно выполнен');
                }
                return data;
            }.bind(this));
        }
        /**
         * Хэндлер ошибки отправки Ajax-запроса
         *
         * @param {Error} e - объект ошибки
         * @param {ErrorCallback} callbackError - обработчик ошибки, переданный вызывающим кодом
         */
        requestErrorHandler(e, callbackError) {
            callbackError(`Произошла ошибка: ${e.message}`);
            throw e;
        }
        /**
         * Обертка Ajax-запроса к серверу
         *
         * @param {string} url - адрес обработки
         * @param {RawParams} rawParams - параметры запроса к серверу
         * @param {"GET" | "POST"} method - тип запроса (обычно GET или POST)
         * @param {OkCallback} callback - функция, отрабатывающая при успешном запросе
         * @param {ErrorCallback} callbackError - функция, отрабатывающая при ошибочном результате запроса
         * @param {object} Headers - заголовки запроса
         *
         * @returns {Promise<Response | void>}
         */
        request(url, rawParams, method, callback, callbackError, headers) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!url) {
                    throw new Error('URL запроса не задан');
                }
                let urlObject = new URL(this._HOST + url), params = rawParams instanceof FormData ? rawParams : new URLSearchParams(Object.assign({}, this._DEFAULT_PARAMS, rawParams));
                if (method === 'GET') {
                    Object.keys(params).forEach(key => urlObject.searchParams.append(key, params[key]));
                    params = '';
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
                    .then(function (response) {
                    if (!response.ok) {
                        throw new Error(response.statusText);
                    }
                    return response;
                })
                    .then(function (response) {
                    this.requestOkHandler(response, callback, callbackError);
                    return response;
                }.bind(this), function (e) {
                    this.requestErrorHandler(e, callbackError);
                }.bind(this));
            });
        }
        /**
         * Ajax-отправка формы
         *
         * @param {HTMLFormElement} form - форма, которую отправляем
         * @param {BeforeCallback} before - функция, выполняемая перед отправкой
         * @param {OkCallback} callback - коллбэк успешной отправки формы
         * @param {ErrorCallback} callbackError - коллбэк неудачной отправки формы
         *
         * @returns {Promise<Response | void>}
         */
        ajaxSubmit(form, before, callback, callbackError) {
            let self = this;
            let promise = new Promise(function (resolve, reject) {
                return __awaiter(this, void 0, void 0, function* () {
                    let formData = new FormData(form), result = before ? yield before(formData) : true;
                    if (result) {
                        resolve(formData);
                        return;
                    }
                    reject();
                });
            });
            return promise.then(function (formData) {
                return self.request(form.action, formData, 'POST', callback, callbackError);
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
            Array.from(formData.entries()).forEach(function (value) {
                toObject[value[0]] = value[1];
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
         *
         * @returns {Promise<Worker | void>}
         */
        workerSubmit(form, before, callback, callbackError) {
            return __awaiter(this, void 0, void 0, function* () {
                if (window['Worker']) {
                    const worker = new Worker("/vendor/avtomon/ApplyAjax.js/dist/js/workerSubmit.js");
                    let formData = new FormData(form), result = before ? yield before(formData) : true;
                    callbackError = callbackError ? callbackError : this._DEFAULT_ERROR_CALLBACK;
                    if (!result) {
                        return;
                    }
                    worker.postMessage(JSON.stringify({
                        url: form.action,
                        formData: ApplyAjax.formDataToObject(formData),
                        headers: this._DEFAULT_HEADERS
                    }));
                    worker.onmessage = function (e) {
                        let response = JSON.parse(e.data[0]);
                        if (!response) {
                            this.requestErrorHandler(new Error('Произошла ошибка при отправке формы'), callbackError);
                            return;
                        }
                        if (response.error) {
                            this.requestErrorHandler(new Error(response.error), callbackError);
                            return;
                        }
                        let responseRecords = new URLSearchParams(response);
                        this.requestOkHandler(new Response(responseRecords), callback, callbackError);
                        return;
                    }.bind(this);
                    return worker;
                }
                throw new Error('Веб-воркеры не поддерживаются браузером');
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
                        self.setData(clone, record);
                    }
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
                    object.querySelectorAll("[class*='_${prop}']").forEach(function (item) {
                        this.modifyElement(item, prop, data[prop]);
                    });
                }
            }, this);
            object.classList.remove(this._HIDE_CLASS);
            return object;
        }
    }
    /**
     * Значения по умолчанию
     *
     * @type {{_HOST: string; _HIDE_CLASS: string; _ALLOWED_ATTRS: string[]; _DEFAULT_ERROR_CALLBACK: (message?: any) => void; _DEFAULT_HEADERS: {processData: boolean}; _DEFAULT_PARAMS: {XDEBUG_SESSION_START: string}}}
     */
    ApplyAjax._defaultSettings = {
        _HOST: '',
        _HIDE_CLASS: 'clone',
        _ALLOWED_ATTRS: ['class', 'text', 'val', 'value', 'id', 'src', 'title', 'href', 'data-object-src'],
        _DEFAULT_ERROR_CALLBACK: alert,
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
//# sourceMappingURL=ApplyAjax.js.map