'use strict';

export namespace Templater {

    /**
     * Параметры запроса
     */
    type Params = { [prop : string] : any };

    /**
     * Заголовки запроса
     */
    type Headers = { [prop : string] : string | boolean };

    /**
     * Доступные типы обработчиков файлов
     */
    type FileTypeHandler = 'text' | 'arrayBuffer' | 'blob';

    /**
     * Доступные типы файлов
     */
    type FileType = string | Blob | ArrayBuffer

    /**
     * Файловый кэш
     */
    type FileCache = { [prop : string] : FileType };

    /**
     * Обработчик ошибки запроса
     */
    export type ErrorCallback = (message : string) => void;

    /**
     * Параметры запроса на входе
     */
    type RawParams = Object | FormData;

    /**
     * Метод отправки запроса
     */
    type RequestMethod = 'GET' | 'POST';

    /**
     * Обработчик успешного зароса
     */
    export type OkCallback = (data : Array<any> | Object) => void;

    /**
     * Обработчик файлов
     */
    type FileOkCallback = (response : string | ArrayBuffer | Blob) => void

    /**
     * Сигнатура функции выполняющейся перед отправкой запроса
     */
    export type BeforeCallback = (formData : FormData) => Promise<boolean>

    /**
     * Элементы формы
     */
    export type FormElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

    /**
     * Интерфейс свойст класс ApplyAjax
     */
    interface IApplyAjaxArgs {

        /**
         * Хост по умолчанию
         *
         * @type {string}
         */
        _HOST? : string;

        /**
         * Класс для обозначения клонируемых элементов
         *
         * @type {string}
         */
        _HIDE_CLASS? : string;

        /**
         * В какие атрибуты можно вставлять данные
         *
         * @type {string[]}
         */
        _ALLOWED_ATTRS? : string[];

        /**
         * Хэндлер обработки ошибки
         *
         * @type ErrorCallback
         */
        _DEFAULT_ERROR_CALLBACK? : ErrorCallback;

        /**
         * Настройки запроса
         *
         * @type Headers
         */
        _DEFAULT_HEADERS? : Headers;

        /**
         * Параметры запроса по умолчанию
         *
         * @type Params
         */
        _DEFAULT_PARAMS? : Params;
    }

    /**
     * Абстракция ajax-запросов к серверу + шаблонизация полученных данных.
     */
    export class ApplyAjax {

        /**
         * Значения по умолчанию
         */
        protected static _defaultSettings : IApplyAjaxArgs = {
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

        /**
         * Файловый кэш
         *
         * @type {FileCache}
         */
        protected static _fileCache : FileCache;

        /**
         * Хост по умолчанию
         *
         * @type {string}
         */
        protected _HOST : string = '';

        /**
         * Класс для обозначения клонируемых элементов
         *
         * @type {string}
         */
        protected _HIDE_CLASS : string = '';

        /**
         * В какие атрибуты можно вставлять данные
         *
         * @type {string[]}
         */
        protected _ALLOWED_ATTRS : string[] = [];

        /**
         * Хэндлер обработки ошибки
         *
         * @type ErrorCallback
         */
        protected _DEFAULT_ERROR_CALLBACK : ErrorCallback;

        /**
         * Настройки запроса
         *
         * @type Headers
         */
        protected _DEFAULT_HEADERS : Headers;

        /**
         * Параметры запроса по умолчанию
         *
         * @type Params
         */
        protected _DEFAULT_PARAMS : Params = {};

        /**
         * Результат выполнения запроса
         *
         * @type Object | Object[] | string
         */
        public data : Object | Object[] | string = {};

        /**
         * Конструктор
         *
         * @param {Templater.IApplyAjaxArgs} settings - настройки
         */
        public constructor(settings : IApplyAjaxArgs = {}) {

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
        public static isJson(str : any) : boolean {
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
         * Запрос файлов с прослойкой из кэша
         *
         * @param {string} url
         * @param {FileOkCallback} fileCallback
         * @param {FileTypeHandler} type
         * @returns {Promise<Templater.FileType>}
         */
        public async requestFile(
            url : string,
            fileCallback : FileOkCallback,
            type : FileTypeHandler = 'text'
        ) : Promise<FileType> {

            if (!ApplyAjax._fileCache[url]) {
                ApplyAjax._fileCache[url] = await fetch(url).then(function (response : Response) : Promise<FileType> {

                    return response[type]();
                });
            }

            fileCallback(ApplyAjax._fileCache[url]);

            return ApplyAjax._fileCache[url];
        }

        /**
         * Хэндлер успешной отправки Ajax-запроса
         *
         * @param {Response | Object} response - объект ответа сервера
         * @param {OkCallback} callback - обработчик успешного выполнения запроса, переданный вызывающим кодом
         * @param {ErrorCallback} callbackError - обработчик ошибки, переданный вызывающим кодом
         *
         * @returns {Promise<null | Object>}
         */
        protected async requestOkHandler(
            response : Object,
            callback : OkCallback,
            callbackError : ErrorCallback
        ) : Promise<null | Object> {

            if (response instanceof Response) {
                response = await response.json();
            }

            this.data = response;
            if (response['error'] !== undefined) {
                callbackError(response['error']);
            } else if (response['redirect']) {
                window.location = response['redirect'];
            } else {
                callback ? callback(response) : alert('Запрос успешно выполнен');
            }

            return response;
        }

        /**
         * Хэндлер ошибки отправки Ajax-запроса
         *
         * @param {Error} e - объект ошибки
         * @param {ErrorCallback} callbackError - обработчик ошибки, переданный вызывающим кодом
         */
        protected static requestErrorHandler(e : Error, callbackError : ErrorCallback) {

            callbackError(`Произошла ошибка: ${e.message}`);
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
         * @returns {Promise<Response | void>}
         */
        public async request(
            url : String,
            rawParams : RawParams,
            method : RequestMethod,
            callback? : OkCallback,
            callbackError? : ErrorCallback,
            headers? : Headers
        ) : Promise<Response | void> {

            if (!url) {
                throw new Error('URL запроса не задан');
            }

            let urlObject = new URL(this._HOST + url),
                params : URLSearchParams | FormData | string
                    = rawParams instanceof FormData
                    ? rawParams
                    : new URLSearchParams({...this._DEFAULT_PARAMS, ...rawParams} as Record<string, string>);

            if (method === 'GET') {
                Object.keys(params).forEach(key => urlObject.searchParams.append(key, params[key]));
                params = '';
            }

            callbackError = callbackError ? callbackError : this._DEFAULT_ERROR_CALLBACK;

            let options : RequestInit = {
                method: method,
                body: params,
                credentials: 'include',
                headers: new Headers({
                    ...this._DEFAULT_HEADERS,
                    ...{
                        hash: location.hash.replace('#', '')
                    },
                    ...headers
                })
            };

            return fetch(urlObject.toString(), options)
                .then(function (response : Response) {
                    if (!response.ok) {
                        throw new Error(response.statusText)
                    }

                    return response;
                })
                .then(
                    function (response) {
                        this.requestOkHandler(response, callback, callbackError);

                        return response;
                    }.bind(this),
                    function (e : Error) : void {
                        this.requestErrorHandler(e, callbackError);
                    }.bind(this)
                );
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
        public ajaxSubmit(
            form : HTMLFormElement,
            before? : BeforeCallback,
            callback? : OkCallback,
            callbackError? : ErrorCallback,
        ) : Promise<Response | void> {

            let self = this;

            let promise = new Promise<FormData | null>(async function (resolve : (formData : FormData) => void,
                                                                       reject : (e? : Error) => void) : Promise<void> {
                let formData : FormData = new FormData(form),
                    result : boolean = before ? await before(formData) : true;

                if (result) {
                    resolve(formData);
                    return;
                }

                reject();
            });

            return promise.then(
                function (formData : FormData) : Promise<Response | void> {
                    return self.request(
                        form.action,
                        formData,
                        'POST',
                        callback,
                        callbackError
                    );
                }
            );
        };

        /**
         * Превратить объект FormData в обычный объект
         *
         * @param {FormData} formData - объект FormData
         *
         * @returns {Params}
         */
        protected static formDataToObject(formData : FormData) : Params {

            let toObject : Params = {};
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
        public async workerSubmit(
            form : HTMLFormElement,
            before? : BeforeCallback,
            callback? : OkCallback,
            callbackError? : ErrorCallback,
        ) : Promise<Worker | void> {

            if (window['Worker']) {

                const worker : Worker = new Worker("/vendor/avtomon/apply-ajax.js/dist/js/workerSubmit.js");

                let formData : FormData = new FormData(form),
                    result : boolean = before ? await before(formData) : true;

                callbackError = callbackError ? callbackError : this._DEFAULT_ERROR_CALLBACK;

                if (!result) {
                    return;
                }

                worker.postMessage(
                    {
                        url: form.action,
                        formData: ApplyAjax.formDataToObject(formData),
                        headers: this._DEFAULT_HEADERS
                    }
                );

                worker.onmessage = function (response : MessageEvent) {
                    const liteResponse : LiteResponse = response.data;
                    if (!liteResponse.ok) {
                        ApplyAjax.requestErrorHandler(
                            new Error(liteResponse.error.message || 'Произошла ошибка при отправке формы'),
                            callbackError
                        );
                        return;
                    }

                    this.requestOkHandler(liteResponse.data, callback, callbackError);
                }.bind(this);

                return worker;
            }

            throw new Error('Веб-воркеры не поддерживаются браузером');
        };

        /**
         * Модифицирует jQuery-элемент вставляя строки value в места отмеченные маркерами с key.
         *
         * @param {HTMLElement} object - объект, в который вставляем
         * @param {string} key - ключ для маркеров вставки
         * @param {string} value - значение для вставки
         *
         * @returns {HTMLElement}
         */

        protected modifyElement(object : HTMLElement, key : string, value : string) : HTMLElement {

            if (object.classList.contains(`in_text_{$key}`)) {
                object.innerHTML = value;
            }

            if (object.classList.contains(`in_class_{$key}`)) {
                object.classList.add(value);
            }

            if (object.classList.contains(`in_href_{$key}`)) {
                let objectAnchor = object as HTMLAnchorElement;
                objectAnchor.href = objectAnchor.href + value;
            }

            if (object.classList.contains('val') || object.classList.contains('value')) {
                (object as FormElement).value = value;
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
         * Вставить массив данных в шаблон. Если кортежей данных несколько, то копировать шаблон для каждого кортежа
         * и вставить вслед за исходным, а исходный скрыть, иначе просто вставить данные в шаблон
         *
         * @param {HTMLElement | NodeList} object - объект, в который вставляем
         * @param {Object | Object[] | string} data - данные для вставки
         *
         * @returns {HTMLElement | NodeList}
         */
        public setMultiData(
            object : HTMLElement | NodeList,
            data : Object | Object[] | string = this.data
        ) : HTMLElement | NodeList {

            if (typeof data !== 'object' || !Object.keys(data).length) {
                return object;
            }

            let self = this,
                objects : HTMLElement[] = [];

            if (object instanceof Element) {
                objects.push(object);
            } else {
                objects = Array.from(object) as HTMLElement[];
            }

            objects.forEach(function (item : HTMLElement) {
                if (!item.classList.contains(this._HIDE_CLASS)) {
                    return this.setData(object, data);
                }

                let dataArray : Array<Object> = [];
                if (!Array.isArray(data)) {
                    dataArray[0] = data;
                } else {
                    dataArray = data;
                }

                dataArray.forEach(function (record : Object) {
                    let clone = item.cloneNode(true);
                    if (item.parentElement) {
                        item.parentElement.appendChild(clone);
                        self.setData(clone as HTMLElement, record);
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
        public setData(object : HTMLElement, data : Object | Object[] | string = this.data) : HTMLElement {

            if (typeof data !== 'object' || !Object.keys(data).length) {
                return object;
            }

            let dataObject : object = data;
            if (Array.isArray(data)) {
                dataObject = data[0];
            }

            Object.keys(dataObject).forEach(function (prop) {
                if (dataObject[prop] instanceof Object) {
                    this.setMultiData(object.querySelectorAll('.' + prop), data[prop]);
                } else if (ApplyAjax.isJson(data[prop])) {
                    data[prop] = JSON.parse(data[prop]);
                    this.setMultiData(object.querySelectorAll('.' + prop), data[prop]);
                } else {
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
}
