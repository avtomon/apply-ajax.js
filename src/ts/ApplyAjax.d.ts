export declare namespace Templater {
    interface Data {
        [prop: string]: any;
    }
    /**
     * Кастомный объект ответа от сервера
     */
    class LiteResponse {
        readonly data: Data;
        readonly ok: boolean;
        readonly status: number;
        readonly isJson: boolean;
        constructor(data: Data, ok: boolean, status: number, isJson: boolean);
    }
    /**
     * Параметры запроса
     */
    type Params = {
        [prop: string]: any;
    };
    /**
     * Заголовки запроса
     */
    type Headers = {
        [prop: string]: string | boolean;
    };
    /**
     * Обработчик ошибки запроса
     */
    type ErrorCallback = (response: LiteResponse) => void;
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
    type OkCallback = (response: LiteResponse) => void;
    /**
     * Сигнатура функции выполняющейся перед отправкой запроса
     */
    type BeforeCallback = (formData: FormData) => Promise<boolean>;
    /**
     * Элементы формы
     */
    type FormElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    interface IMatches {
        matches: string[];
        insertable: boolean;
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
        _HOST?: string;
        /**
         * Класс для обозначения клонируемых элементов
         *
         * @type {string}
         */
        _HIDE_CLASS?: string;
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
     * Абстракция ajax-запросов к серверу + шаблонизация полученных данных.
     */
    class ApplyAjax {
        /**
         * Значения по умолчанию
         */
        static _defaultSettings: IApplyAjaxArgs;
        /**
         * Хост по умолчанию
         *
         * @type {string}
         */
        protected _HOST: string;
        /**
         * Класс для обозначения клонируемых элементов
         *
         * @type {string}
         */
        protected _HIDE_CLASS: string;
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
        protected _DEFAULT_PARAMS: Params;
        /**
         * @type {string}
         */
        protected DATA_DEPENDS_ON_ATTRIBUTE: string;
        /**
         * @type {string}
         */
        protected DEFAULT_ATTRIBUTE_PREFIX: string;
        /**
         * @type {string}
         */
        protected NO_DISPLAY_CLASS: string;
        /**
         * @type {string}
         */
        protected PARENT_SELECTOR: string;
        /**
         * @type {string}
         */
        protected NO_DATA_SELECTOR: string;
        /**
         * Результат выполнения запроса
         *
         * @type LiteResponse
         */
        response: LiteResponse;
        /**
         * Воркер фоновой отправки формы
         *
         * @type Worker
         */
        worker: Worker;
        /**
         * Конструктор
         *
         * @param {Templater.IApplyAjaxArgs} settings - настройки
         */
        constructor(settings?: IApplyAjaxArgs);
        /**
         * Является ли входное значение JSON-структурой
         *
         * @param {string} str - проверяемое значение
         *
         * @returns {boolean}
         */
        static isJson(str: any): boolean;
        /**
         * Хэндлер успешной отправки Ajax-запроса
         *
         * @param {LiteResponse} response - объект ответа сервера
         * @param {ErrorCallback} callbackError - обработчик ошибки, переданный вызывающим кодом
         * @param {OkCallback} callback - обработчик успешного выполнения запроса, переданный вызывающим кодом
         *
         * @returns {Promise<null | Object>}
         */
        protected requestOkHandler(response: LiteResponse, callbackError: ErrorCallback, callback?: OkCallback | null): Promise<LiteResponse>;
        /**
         * @param {Response} response
         *
         * @returns {Promise<Templater.LiteResponse>}
         */
        protected static getLiteResponse(response: Response): Promise<LiteResponse>;
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
        request(url: String, rawParams: RawParams, method?: RequestMethod, callback?: OkCallback | null, callbackError?: ErrorCallback | null, headers?: Headers | null): Promise<LiteResponse | void>;
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
        ajaxSubmit(form: HTMLFormElement, before?: BeforeCallback, callback?: OkCallback, callbackError?: ErrorCallback, url?: String | null): Promise<Response | void>;
        /**
         * Превратить объект FormData в обычный объект
         *
         * @param {FormData} formData - объект FormData
         *
         * @returns {Params}
         */
        protected static formDataToObject(formData: FormData): Params;
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
        workerSubmit(form: HTMLFormElement, before?: BeforeCallback, callback?: OkCallback, callbackError?: ErrorCallback, url?: String | null): Promise<void>;
        /**
         * @param {string[]} labels
         * @param {string[]} matches
         *
         * @returns {IMatches}
         */
        protected static isInsertable(labels: string[], matches: string[]): IMatches;
        /**
         * Модифицирует jQuery-элемент вставляя строки value в места отмеченные маркерами с key.
         *
         * @param {HTMLElement} object - объект, в который вставляем
         * @param {string} key - ключ для маркеров вставки
         * @param {string} value - значение для вставки
         *
         * @returns {void}
         */
        protected modifyElement(object: HTMLElement, key: string, value: string): void;
        /**
         * Вставить массив данных в шаблон. Если кортежей данных несколько, то копировать шаблон для каждого кортежа
         * и вставить вслед за исходным, а исходный скрыть, иначе просто вставить данные в шаблон
         *
         * @param {HTMLElement | NodeList} object - объект, в который вставляем
         * @param {Object | Object[]} data - данные для вставки
         *
         * @returns {HTMLElement | NodeList}
         */
        setMultiData(object: HTMLElement | NodeList, data?: Object | Object[]): HTMLElement | NodeList;
        /**
         * Вставить набор данных в шаблон, предполагается что на вход дается только один кортеж данных
         *
         * @param {HTMLElement} object - объект, в который вставляем
         * @param {Object | Object[] | string} data - данные для вставки
         *
         * @returns {HTMLElement}
         */
        setData(object: HTMLElement, data: Object | Object[] | string): HTMLElement;
        /**
         * Если данных нет, то прячет зависимые от этих данных элементы
         *
         * @param data
         * @param {HTMLElement} element
         *
         * @returns {boolean}
         */
        protected dataDependsCheck(data: any, element: HTMLElement): boolean;
        /**
         * Показать блок с сообщением об отсутствии данных, если данных нет
         *
         * @param {Object[]} data
         * @param {HTMLElement} parent
         *
         * @returns {boolean}
         */
        protected isShowNoData(data: Object[], parent: HTMLElement): boolean;
    }
}
