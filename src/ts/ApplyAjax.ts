'use strict';

import {Utils} from "/vendor/avtomon/good-funcs.js/dist/js/GoodFuncs.js";

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

    interface IMatches {
        matches : string[],
        insertable : boolean
    }

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
            _DEFAULT_ERROR_CALLBACK: function (liteResponse : LiteResponse) {
                alert(liteResponse.data['message'] || 'Произошла ошибка');
            },
            _DEFAULT_HEADERS: {
                processData: true,
                'X-REQUESTED-WITH': 'xmlhttprequest',
                Accept: 'application/json'
            },
            _DEFAULT_PARAMS: {
                XDEBUG_SESSION_START: 'PHPSTORM'
            }
        };

        /**
         * Хост по умолчанию
         *
         * @type {string}
         * @private
         */
        protected _HOST : string = '';

        /**
         * Класс для обозначения клонируемых элементов
         *
         * @type {string}
         * @private
         */
        protected _HIDE_CLASS : string = '';

        /**
         * Хэндлер обработки ошибки
         *
         * @type ErrorCallback
         * @private
         */
        protected _DEFAULT_ERROR_CALLBACK : ErrorCallback;

        /**
         * Настройки запроса
         *
         * @type Headers
         * @private
         */
        protected _DEFAULT_HEADERS : Headers;

        /**
         * Параметры запроса по умолчанию
         *
         * @type Params
         * @private
         */
        protected _DEFAULT_PARAMS : Params = {};

        /**
         * @type {string}
         * @private
         */
        protected _DATA_DEPENDS_ON_ATTRIBUTE = 'data-depends-on';

        /**
         * @type {string}
         * @private
         */
        protected _DEFAULT_ATTRIBUTE_PREFIX = 'data-default-';

        /**
         * @type {string}
         * @private
         */
        protected _NO_DISPLAY_CLASS = 'no-display';

        /**
         * @type {string}
         * @private
         */
        protected _PARENT_SELECTOR = '.parent';

        /**
         * @type {string}
         * @private
         */
        protected _NO_DATA_SELECTOR = '.no-data';

        /**
         * @type {string}
         * @private
         */
        protected _SUBPARENT_SELECTOR = '.subparent';

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

            if (response.status < 200 || response.status >= 400) {
                callbackError(response);
                return response;
            }

            this.response = response;
            if (response.data['redirect']) {
                window.location = response.data['redirect'];
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

            let urlObject : URL = new URL(this._HOST + url);

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
                        callbackError && callbackError(liteResponse);

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
         * @param {string | null} url - адрес обработки
         *
         * @returns {Promise<LiteResponse | void>}
         */
        public ajaxSubmit(
            form : HTMLFormElement,
            before? : BeforeCallback,
            callback? : OkCallback,
            callbackError? : ErrorCallback,
            url : String | null = null
        ) : Promise<LiteResponse | void> {

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
                function (formData : FormData) : Promise<LiteResponse | void> {
                    if (!url && !form.getAttribute('action')) {
                        throw Error('URL or form action must be filled.');
                    }

                    const action : string = form.dataset.subdomain
                        ? `${form.dataset.subdomain}.${location.hostname}${form.getAttribute('action')}`
                        : form.getAttribute('action') as string;

                    return self.request(
                        url || action,
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
         * @param {string | null} url - адрес обработки
         *
         * @returns {Promise<Worker | void>}
         */
        public async workerSubmit(
            form : HTMLFormElement,
            before? : BeforeCallback,
            callback? : OkCallback,
            callbackError? : ErrorCallback,
            url : String | null = null
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
                        url: url || form.action,
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
         * @param {string[]} labels
         * @param {string[]} matches
         *
         * @returns {IMatches}
         */
        protected static isInsertable(labels : string[], matches : string[]) : IMatches {
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
        protected stripHtml(html : string) : string
        {
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

        protected modifyElement(object : HTMLElement, key : string, value : string) : void {

            let matches : string | string[] = (object.getAttribute(`data-in-${key}`) || '').trim(),
                insertable;

            if (!matches) {
                return;
            }

            matches = matches.split(',').map(function (item) {
                return item.trim();
            });

            if (null === value || '' === value) {
                value = object.getAttribute(`${this._DEFAULT_ATTRIBUTE_PREFIX}${key}`) || '';
            }

            ({matches, insertable} = ApplyAjax.isInsertable(['html'], matches));
            if (insertable) {
                object.innerHTML = value;
            }

            ({matches, insertable} = ApplyAjax.isInsertable(['text'], matches));
            if (insertable) {
                object.innerText = this.stripHtml(value);
            }

            ({matches, insertable} = ApplyAjax.isInsertable(['class'], matches));
            if (insertable) {
                let classes = value.split(' ').map(function (item : string) {
                    return item.trim();
                });

                classes.forEach(function (className) {
                    object.classList.add(className);
                });
            }

            ({matches, insertable} = ApplyAjax.isInsertable(['checked'], matches));
            if (insertable) {
                (object as HTMLInputElement).checked = Boolean(value);
            }

            ({matches, insertable} = ApplyAjax.isInsertable(['selected'], matches));
            if (insertable) {
                (object as HTMLOptionElement).selected = Boolean(value);
            }

            matches.forEach(function (attr : string) {
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
        public setMultiData(
            object : HTMLElement | NodeList,
            data : Object | Object[] = this.response.data
        ) : HTMLElement | NodeList {

            if (typeof data !== 'object' || !Object.keys(data).length) {
                return object;
            }

            let self = this,
                objects : HTMLElement[] = [];

            if (!Array.isArray(data)) {
                data = [data];
            }

            if (object instanceof Element) {
                objects.push(object);
            } else {
                objects = Array.from(object) as HTMLElement[];
            }

            objects.forEach(function (parent : HTMLElement) {
                self.isShowNoData(data as Object[], parent);
                self.dataDependsCheck(data, parent);
            });

            if (!data) {
                return object;
            }

            objects.forEach(function (item : HTMLElement) {

                if (!item.classList.contains(self._HIDE_CLASS)) {
                    return self.setData(item, data);
                }

                (data as Object[]).forEach(function (record : Object) {
                    let clone : Node = item.cloneNode(true);
                    if (item.parentElement) {
                        self.setData(clone as HTMLElement, record);
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
        public setData(object : HTMLElement, data : Object | Object[] | string) : HTMLElement {

            if (typeof data !== 'object' || !Object.keys(data).length) {
                return object;
            }

            let dataObject : object = data;
            if (Array.isArray(data)) {
                dataObject = data[0];
            }

            let self = this;
            Object.keys(dataObject).forEach(function (prop : string) {
                if (dataObject[prop] instanceof Object) {
                    self.setMultiData(object.querySelectorAll(`.${prop}${self._SUBPARENT_SELECTOR}`), dataObject[prop]);
                    return;
                }

                if (ApplyAjax.isJson(dataObject[prop])) {
                    dataObject[prop] = JSON.parse(dataObject[prop]);
                    self.setMultiData(object.querySelectorAll(`.${prop}${self._SUBPARENT_SELECTOR}`), dataObject[prop]);
                }

                self.modifyElement(object, prop, dataObject[prop]);

                object.querySelectorAll(`[data-in-${prop}]`).forEach(function (item : HTMLElement) {
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
        protected dataDependsCheck(data : any, element : HTMLElement) : boolean {
            if (data) {
                return true;
            }

            let dependsParents : HTMLElement[],
                self = this;
            if (element.hasAttribute(this._DATA_DEPENDS_ON_ATTRIBUTE)) {
                dependsParents = [element];
            } else {
                dependsParents = Utils.GoodFuncs.parents(element, `[${this._DATA_DEPENDS_ON_ATTRIBUTE}]`)
                    .filter(function (parent : HTMLElement) {
                        return element.matches(parent.getAttribute(self._DATA_DEPENDS_ON_ATTRIBUTE) || '');
                    });
            }

            if (!dependsParents.length) {
                return true;
            }

            dependsParents.forEach(function (parent : HTMLElement) {
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
        protected isShowNoData(data : Object[], parent : HTMLElement) : boolean {
            let p : Element | null = parent.parentElement ? parent.parentElement.closest(this._PARENT_SELECTOR) : null,
                noDataElement : HTMLElement | null = p ? p.querySelector(this._NO_DATA_SELECTOR) : null;

            if (!noDataElement || !p) {
                return true;
            }

            let self = this;
            if (!data) {
                Array.from(p.children).forEach(function (child) {
                    child.classList.add(self._NO_DISPLAY_CLASS)
                });
                noDataElement.classList.remove(this._NO_DISPLAY_CLASS);

                return false;
            }

            Array.from(p.children).forEach(function (child) {
                child.classList.remove(self._NO_DISPLAY_CLASS)
            });
            noDataElement.classList.add(this._NO_DISPLAY_CLASS);

            return true;
        }
    }
}
