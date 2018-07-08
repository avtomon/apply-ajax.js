<a name="ApplyAjax"></a>

## ApplyAjax
**Kind**: global class  

* [ApplyAjax](#ApplyAjax)
    * [new ApplyAjax(settings)](#new_ApplyAjax_new)
    * _instance_
        * [._DEFAULT_PARAMS](#ApplyAjax+_DEFAULT_PARAMS) : <code>Params</code>
        * [.data](#ApplyAjax+data) : <code>Object</code> \| <code>Array.&lt;Object&gt;</code> \| <code>string</code>
        * [.request(url, rawParams, method, callback, callbackError, headers)](#ApplyAjax+request) ⇒ <code>Promise.&lt;(Response\|Error)&gt;</code>
        * [.ajaxSubmit(form, before, callback, callbackError, after)](#ApplyAjax+ajaxSubmit) ⇒ <code>Promise.&lt;(Response\|Error)&gt;</code>
        * [.modifyElement(object, key, value)](#ApplyAjax+modifyElement) ⇒ <code>HTMLElement</code>
        * [.setMultiData(object, data)](#ApplyAjax+setMultiData) ⇒ <code>HTMLElement</code> \| <code>NodeList</code>
        * [.setData(object, data)](#ApplyAjax+setData) ⇒ <code>HTMLElement</code>
    * _static_
        * [.isJson(str)](#ApplyAjax.isJson) ⇒ <code>boolean</code>

<a name="new_ApplyAjax_new"></a>

### new ApplyAjax(settings)
Конструктор


| Param | Type | Description |
| --- | --- | --- |
| settings | <code>Templater.IApplyAjaxArgs</code> | настройки |

<a name="ApplyAjax+_DEFAULT_PARAMS"></a>

### applyAjax._DEFAULT_PARAMS : <code>Params</code>
Параметры запроса по умолчанию

**Kind**: instance property of [<code>ApplyAjax</code>](#ApplyAjax)  
<a name="ApplyAjax+data"></a>

### applyAjax.data : <code>Object</code> \| <code>Array.&lt;Object&gt;</code> \| <code>string</code>
Результат выполнения запроса

**Kind**: instance property of [<code>ApplyAjax</code>](#ApplyAjax)  
<a name="ApplyAjax+request"></a>

### applyAjax.request(url, rawParams, method, callback, callbackError, headers) ⇒ <code>Promise.&lt;(Response\|Error)&gt;</code>
Обертка Ajax-запроса к серверу

**Kind**: instance method of [<code>ApplyAjax</code>](#ApplyAjax)  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | адрес обработки |
| rawParams | <code>RawParams</code> | параметры запроса к серверу |
| method | <code>&quot;GET&quot;</code> \| <code>&quot;POST&quot;</code> | тип запроса (обычно GET или POST) |
| callback | <code>OkCallback</code> | функция, отрабатывающая при успешном запросе |
| callbackError | <code>ErrorCallback</code> | функция, отрабатывающая при ошибочном результате запроса |
| headers | <code>object</code> | заголовки запроса |

<a name="ApplyAjax+ajaxSubmit"></a>

### applyAjax.ajaxSubmit(form, before, callback, callbackError, after) ⇒ <code>Promise.&lt;(Response\|Error)&gt;</code>
Ajax-отправка формы

**Kind**: instance method of [<code>ApplyAjax</code>](#ApplyAjax)  

| Param | Type | Description |
| --- | --- | --- |
| form | <code>HTMLFormElement</code> | форма, которую отправляем |
| before |  | функция, выполняемая перед отправкой |
| callback | <code>OkCallback</code> | коллбэк успешной отправки формы |
| callbackError | <code>ErrorCallback</code> | коллбэк неудачной отправки формы |
| after | <code>OkCallback</code> | эта функция выполняется после успешной отправки формы |

<a name="ApplyAjax+modifyElement"></a>

### applyAjax.modifyElement(object, key, value) ⇒ <code>HTMLElement</code>
Модифицирует jQuery-элемент вставляя строки value в места отмеченные маркерами с key.

**Kind**: instance method of [<code>ApplyAjax</code>](#ApplyAjax)  

| Param | Type | Description |
| --- | --- | --- |
| object | <code>HTMLElement</code> | объект, в который вставляем |
| key | <code>string</code> | ключ для маркеров вставки |
| value | <code>string</code> | значение для вставки |

<a name="ApplyAjax+setMultiData"></a>

### applyAjax.setMultiData(object, data) ⇒ <code>HTMLElement</code> \| <code>NodeList</code>
Вставить массив данных в шаблон. Если кортежей данных несколько, то копировать шаблон для каждого кортежа и вставить вслед за исходным,а исходный скрыть, иначе просто вставить данные в шаблон

**Kind**: instance method of [<code>ApplyAjax</code>](#ApplyAjax)  

| Param | Type | Description |
| --- | --- | --- |
| object | <code>HTMLElement</code> \| <code>NodeList</code> | объект, в который вставляем |
| data | <code>Object</code> \| <code>Array.&lt;Object&gt;</code> \| <code>string</code> | данные для вставки |

<a name="ApplyAjax+setData"></a>

### applyAjax.setData(object, data) ⇒ <code>HTMLElement</code>
Вставить набор данных в шаблон, предполагается что на вход дается только один кортеж данных

**Kind**: instance method of [<code>ApplyAjax</code>](#ApplyAjax)  

| Param | Type | Description |
| --- | --- | --- |
| object | <code>HTMLElement</code> | объект, в который вставляем |
| data | <code>Object</code> \| <code>Array.&lt;Object&gt;</code> \| <code>string</code> | данные для вставки |

<a name="ApplyAjax.isJson"></a>

### ApplyAjax.isJson(str) ⇒ <code>boolean</code>
Является ли входное значение JSON-структурой

**Kind**: static method of [<code>ApplyAjax</code>](#ApplyAjax)  

| Param | Type | Description |
| --- | --- | --- |
| str | <code>string</code> | проверяемое значение |

