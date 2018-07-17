'use strict';

namespace Templater {

    /**
     * Параметры запроса
     */
    type Params = { [prop: string]: any };

    /**
     * Заголовки запроса
     */
    type Headers = { [prop: string]: string | boolean };

    /**
     * Обработчик ошибки запроса
     */
    type ErrorCallback = (message: string) => void;

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
    type OkCallback = (data: Array<any> | Object) => void | null;

    /**
     * Сигнатура функции выполняющейся перед отправкой запроса
     */
    type BeforeCallback = (formData: FormData) => Promise<FormData | Error>

    /**
     * Элементы формы
     */
    export type FormElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

    /**
     * Интерфейс свойст класс ApplyAjax
     */
    interface IApplyAjaxArgs {

        /**
         * Класс для обозначения клонируемых элементов
         *
         * @type {string}
         */
        _HIDE_CLASS?: string;

        /**
         * Хост для запросов по умолчаию
         *
         * @type {string}
         */
        _HOST?: string;

        /**
         * В какие атрибуты можно вставлять данные
         *
         * @type {string[]}
         */
        _ALLOWED_ATTRS?: string[];

        /**
         * Хэндлер обработки ошибки
         *
         * @type ErrorCallback
         */
        _DEFAULT_ERROR_CALLBACK?: ErrorCallback;

        /**
         * Настройки запроса
         *
         * @type Headers
         */
        _DEFAULT_HEADERS?: Headers;

        /**
         * Параметры запроса по умолчанию
         *
         * @type Params
         */
        _DEFAULT_PARAMS?: Params;
    }

    /**
     * Абстракция ajax-запросов к серверу + шаблонизация полученных данных. Принцип шаблонизации такой те как у [avtomon/PQSkaTpl](https://github.com/avtomon/PQSkaTpl)
     */
    export class ApplyAjax {

        static defaultSettings: IApplyAjaxArgs = {
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

        /**
         * Класс для обозначения клонируемых элементов
         *
         * @type {string}
         */
        protected _HIDE_CLASS: string;

        /**
         * Хост для запросов по умолчаию
         *
         * @type {string}
         */
        protected _HOST: string;

        /**
         * В какие атрибуты можно вставлять данные
         *
         * @type {string[]}
         */
        protected _ALLOWED_ATTRS: string[];

        /**
         * Хэндлер обработки ошибки
         *
         * @type ErrorCallback
         */
        protected _DEFAULT_ERROR_CALLBACK: ErrorCallback;

        /**
         * Настройки запроса
         *
         * @type Headers
         */
        protected _DEFAULT_HEADERS: Headers;

        /**
         * Параметры запроса по умолчанию
         *
         * @type Params
         */
        protected _DEFAULT_PARAMS: Params = {};

        /**
         * Результат выполнения запроса
         *
         * @type Object | Object[] | string
         */
        public data: Object | Object[] | string = {};

        /**
         * Конструктор
         *
         * @param {Templater.IApplyAjaxArgs} settings - настройки
         */
        constructor(settings: IApplyAjaxArgs = {}) {

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
        static isJson(str: string): boolean {
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
        async request(
            url: USVString,
            rawParams: RawParams,
            method: RequestMethod,
            callback?: OkCallback,
            callbackError?: ErrorCallback,
            headers?: Headers
        ): Promise<Response | Error> {

            if (!url) {
                return new Error('URL запроса не задан');
            }

            let self = this,
                urlObject = new URL(this._HOST + url),
                params: URLSearchParams | FormData | null = rawParams instanceof FormData ? rawParams : new URLSearchParams({...this._DEFAULT_PARAMS, ...rawParams} as Record<string, string>);

            if (method === 'GET') {
                Object.keys(params).forEach(key => urlObject.searchParams.append(key, params[key]));
                params = null;
            }

            let error: ErrorCallback = callbackError ? callbackError : this._DEFAULT_ERROR_CALLBACK,
                options: RequestInit = {
                    ...this._DEFAULT_HEADERS,
                    ...{
                        method: method,
                        body: params,
                        credentials: 'include',
                        headers: new Headers({
                            hash: location.hash.replace('#', ''),
                            //'Content-Type': headers.processData ? 'application/x-www-form-urlencoded' : false,
                        })
                    },
                    ...headers
                };

            return fetch(urlObject.toString(), options).then(
                function (response) {
                    response.json().then(
                        function (data) {
                            self.data = data;
                            if (data.error !== undefined) {
                                error(data.error);
                            } else if (data.redirect) {
                                window.location = data.redirect;
                            } else {
                                callback ? callback(data) : alert('Запрос успешно выполнен');
                            }
                        }
                    );

                    return response;
                },
                function (e: Error): Error {
                    error(`Произошла ошибка: ${e.message}`);

                    return e;
                }
            );
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
        ajaxSubmit(
            form: HTMLFormElement,
            before?: BeforeCallback,
            callback?: OkCallback,
            callbackError?: ErrorCallback,
            after?: OkCallback
        ): Promise<Response | Error> {

            let self = this;

            return new Promise<FormData>(async function (resolve): Promise<FormData | Error> {
                let formData = new FormData(form);

                if (!before) {
                    resolve();
                    return formData;
                }

                return before(formData);
            }).then(
                function (formData: FormData): Promise<Response | Error> {
                    let response = self.request(
                        form.action,
                        formData,
                        'POST',
                        callback,
                        callbackError
                    );

                    response.then(after);

                    return response;
                },
                function (e: Error) {
                    callbackError(e.message);

                    return e;
                }
            );
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

        protected modifyElement(object: HTMLElement, key: string, value: string): HTMLElement {

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
         * Вставить массив данных в шаблон. Если кортежей данных несколько, то копировать шаблон для каждого кортежа и вставить вслед за исходным,
         * а исходный скрыть, иначе просто вставить данные в шаблон
         *
         * @param {HTMLElement | NodeList} object - объект, в который вставляем
         * @param {Object | Object[] | string} data - данные для вставки
         *
         * @returns {HTMLElement | NodeList}
         */
        setMultiData(object: HTMLElement | NodeList, data: Object | Object[] | string = this.data): HTMLElement | NodeList {

            if (typeof data !== 'object' || !Object.keys(data).length) {
                return object;
            }

            let self = this,
                objects: HTMLElement[] = [];

            if (object instanceof Element) {
                objects.push(object);
            } else {
                objects = Array.from(object) as HTMLElement[];
            }

            objects.forEach(function (item: HTMLElement) {
                if (!item.classList.contains(this._HIDE_CLASS)) {
                    return this.setData(object, data);
                }

                let dataArray: Array<Object>;
                if (!Array.isArray(data)) {
                    dataArray[0] = data;
                } else {
                    dataArray = data;
                }

                dataArray.forEach(function (record: Object) {
                    let clone = item.cloneNode(true);
                    item.parentElement.appendChild(clone);
                    self.setData(clone as HTMLElement, record);
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
        setData(object: HTMLElement, data: Object | Object[] | string = this.data): HTMLElement {

            if (typeof data !== 'object' || !Object.keys(data).length) {
                return object;
            }

            let dataObject: Object = data;
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