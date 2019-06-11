'use strict';

export namespace Templater {

    interface Data {
        [prop : string] : any
    }

    /**
     * Кастомный объект ответа от сервера
     */
    export class LiteResponse {

        public constructor(
            public readonly data : Data,
            public readonly ok : boolean,
            public readonly status : number,
            public readonly isJson : boolean
        ) {
        }
    }

    /**
     * Параметры запроса
     */
    type Params = { [prop : string] : any };

    /**
     * Заголовки запроса
     */
    type Headers = { [prop : string] : string | boolean };

    /**
     * Обработчик ошибки запроса
     */
    export type ErrorCallback = (response : LiteResponse) => void;

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
    export type OkCallback = (response : LiteResponse) => void;

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
        public static _defaultSettings : IApplyAjaxArgs = {
            _HOST: window.location.origin && window.location.origin !== 'null'
                ? window.location.origin
                : window.location.ancestorOrigins[0],
            _HIDE_CLASS: 'clone',
            _ALLOWED_ATTRS: ['class', 'text', 'val', 'value', 'id', 'src', 'title', 'href', 'data-object-src'],
            _DEFAULT_ERROR_CALLBACK: function (liteResponse : LiteResponse) {
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

        public static _ALLOWED_ATTRS = [
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
            'data-account-id',
        ];

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
         * @type LiteResponse
         */
        public response : LiteResponse;

        /**
         * Воркер фоновой отправки формы
         *
         * @type Worker
         */
        public worker : Worker;

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
         * Хэндлер успешной отправки Ajax-запроса
         *
         * @param {LiteResponse} response - объект ответа сервера
         * @param {ErrorCallback} callbackError - обработчик ошибки, переданный вызывающим кодом
         * @param {OkCallback} callback - обработчик успешного выполнения запроса, переданный вызывающим кодом
         *
         * @returns {Promise<null | Object>}
         */
        protected async requestOkHandler(
            response : LiteResponse,
            callbackError : ErrorCallback,
            callback? : OkCallback | null,
        ) : Promise<LiteResponse> {

            if (response.status < 200 && response.status >= 400) {
                callbackError(response);
                return response;
            }

            this.response = response;
            if (response.status === 307 && response.data['redirect']) {
                window.location = response['redirect'];
            } else {
                callback && callback(response);
            }

            return response;
        }

        /**
         * @param {Response} response
         *
         * @returns {Promise<Templater.LiteResponse>}
         */
        protected static async getLiteResponse(response : Response) : Promise<LiteResponse> {
            const contentType : string | null = response.headers.get('Content-Type'),
                isJson : boolean = (contentType && contentType.includes('application/json')) as boolean;
            return new LiteResponse(
                isJson ? await response.json() : await response.text(),
                response.ok,
                response.status,
                isJson
            );
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
        public async request(
            url : String,
            rawParams : RawParams,
            method : RequestMethod = 'POST',
            callback : OkCallback | null = null,
            callbackError : ErrorCallback | null = null,
            headers : Headers | null = null
        ) : Promise<LiteResponse | void> {

            if (!url) {
                throw new Error('URL запроса не задан');
            }

            let urlObject = new URL(this._HOST + url);

            let params : URLSearchParams | FormData | undefined = undefined;
            if (method === 'GET') {
                Object.keys(rawParams).forEach(function (key) {
                    if (Array.isArray(rawParams[key])) {
                        for (let index in rawParams[key]) {
                            urlObject.searchParams.append(key, rawParams[key][index]);
                        }

                        return;
                    }

                    urlObject.searchParams.append(key, rawParams[key])
                });
            } else {
                params = rawParams instanceof FormData
                    ? rawParams
                    : new URLSearchParams({...this._DEFAULT_PARAMS, ...rawParams} as Record<string, string>);
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
                .then(async function (response : Response) : Promise<LiteResponse> {
                        const liteResponse : LiteResponse = await ApplyAjax.getLiteResponse(response);

                        this.requestOkHandler(liteResponse, callbackError, callback);

                        return liteResponse;
                    }.bind(this),
                    async function (response : Response) : Promise<LiteResponse> {
                        const liteResponse : LiteResponse = await ApplyAjax.getLiteResponse(response);
                        callbackError(liteResponse);

                        return liteResponse;
                    }) as Promise<LiteResponse>;
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
         *
         * @returns {Promise<Worker | void>}
         */
        public async workerSubmit(
            form : HTMLFormElement,
            before? : BeforeCallback,
            callback? : OkCallback,
            callbackError? : ErrorCallback,
        ) : Promise<void> {

            if (window['Worker']) {

                if (!this.worker) {
                    this.worker = new Worker("/vendor/avtomon/apply-ajax.js/dist/js/workerSubmit.js");
                }

                let formData : FormData = new FormData(form),
                    result : boolean = before ? await before(formData) : true;

                callbackError = callbackError ? callbackError : this._DEFAULT_ERROR_CALLBACK;

                if (!result) {
                    return;
                }

                this.worker.postMessage(
                    {
                        url: form.action,
                        formData: ApplyAjax.formDataToObject(formData),
                        headers: this._DEFAULT_HEADERS
                    }
                );

                this.worker.onmessage = function (response : MessageEvent) : void {
                    const liteResponse : LiteResponse = response.data;

                    return this.requestOkHandler(liteResponse, callbackError, callback);
                }.bind(this);

                return;
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
            data : Object | Object[] | string = this.response.data
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
        public setData(object : HTMLElement, data : Object | Object[] | string) : HTMLElement {

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

                    object.querySelectorAll(`[class*='_${prop}']`).forEach(function (item : HTMLElement) {
                        this.modifyElement(item, prop, data[prop]);
                    });
                }
            }, this);

            object.classList.remove(this._HIDE_CLASS);

            return object;
        }
    }
}
