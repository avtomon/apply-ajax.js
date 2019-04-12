export declare namespace Templater {
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
     * Доступные типы обработчиков файлов
     */
    type FileTypeHandler = 'text' | 'arrayBuffer' | 'blob';
    /**
     * Доступные типы файлов
     */
    type FileType = string | Blob | ArrayBuffer;
    /**
     * Файловый кэш
     */
    type FileCache = {
        [prop: string]: FileType;
    };
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
    type OkCallback = (data: Array<any> | Object) => void;
    /**
     * Обработчик файлов
     */
    type FileOkCallback = (response: string | ArrayBuffer | Blob) => void;
    /**
     * Сигнатура функции выполняющейся перед отправкой запроса
     */
    type BeforeCallback = (formData: FormData) => Promise<boolean>;
    /**
     * Элементы формы
     */
    type FormElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
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
     * Абстракция ajax-запросов к серверу + шаблонизация полученных данных.
     */
    class ApplyAjax {
        /**
         * Значения по умолчанию
         */
        protected static _defaultSettings: IApplyAjaxArgs;
        /**
         * Файловый кэш
         *
         * @type {FileCache}
         */
        protected static _fileCache: FileCache;
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
        protected _DEFAULT_PARAMS: Params;
        /**
         * Результат выполнения запроса
         *
         * @type Object | Object[] | string
         */
        data: Object | Object[] | string;
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
         * Запрос файлов с прослойкой из кэша
         *
         * @param {string} url
         * @param {FileOkCallback} fileCallback
         * @param {FileTypeHandler} type
         * @returns {Promise<Templater.FileType>}
         */
        requestFile(url: string, fileCallback: FileOkCallback, type?: FileTypeHandler): Promise<FileType>;
        /**
         * Хэндлер успешной отправки Ajax-запроса
         *
         * @param {Response | Object} response - объект ответа сервера
         * @param {OkCallback} callback - обработчик успешного выполнения запроса, переданный вызывающим кодом
         * @param {ErrorCallback} callbackError - обработчик ошибки, переданный вызывающим кодом
         *
         * @returns {Promise<null | Object>}
         */
        protected requestOkHandler(response: Object, callback: OkCallback, callbackError: ErrorCallback): Promise<null | Object>;
        /**
         * Хэндлер ошибки отправки Ajax-запроса
         *
         * @param {Error} e - объект ошибки
         * @param {ErrorCallback} callbackError - обработчик ошибки, переданный вызывающим кодом
         */
        protected static requestErrorHandler(e: Error, callbackError: ErrorCallback): void;
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
        request(url: String, rawParams: RawParams, method: RequestMethod, callback?: OkCallback, callbackError?: ErrorCallback, headers?: Headers): Promise<Response | void>;
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
        ajaxSubmit(form: HTMLFormElement, before?: BeforeCallback, callback?: OkCallback, callbackError?: ErrorCallback): Promise<Response | void>;
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
         *
         * @returns {Promise<Worker | void>}
         */
        workerSubmit(form: HTMLFormElement, before?: BeforeCallback, callback?: OkCallback, callbackError?: ErrorCallback): Promise<Worker | void>;
        /**
         * Модифицирует jQuery-элемент вставляя строки value в места отмеченные маркерами с key.
         *
         * @param {HTMLElement} object - объект, в который вставляем
         * @param {string} key - ключ для маркеров вставки
         * @param {string} value - значение для вставки
         *
         * @returns {HTMLElement}
         */
        protected modifyElement(object: HTMLElement, key: string, value: string): HTMLElement;
        /**
         * Вставить массив данных в шаблон. Если кортежей данных несколько, то копировать шаблон для каждого кортежа
         * и вставить вслед за исходным, а исходный скрыть, иначе просто вставить данные в шаблон
         *
         * @param {HTMLElement | NodeList} object - объект, в который вставляем
         * @param {Object | Object[] | string} data - данные для вставки
         *
         * @returns {HTMLElement | NodeList}
         */
        setMultiData(object: HTMLElement | NodeList, data?: Object | Object[] | string): HTMLElement | NodeList;
        /**
         * Вставить набор данных в шаблон, предполагается что на вход дается только один кортеж данных
         *
         * @param {HTMLElement} object - объект, в который вставляем
         * @param {Object | Object[] | string} data - данные для вставки
         *
         * @returns {HTMLElement}
         */
        setData(object: HTMLElement, data?: Object | Object[] | string): HTMLElement;
    }
}
