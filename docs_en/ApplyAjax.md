<a name="ApplyAjax"> </a>

## ApplyAjax
Abstraction of ajax-requests to the server + template of the received data.

**Kind**: global class

* [ApplyAjax](#ApplyAjax)
* [new ApplyAjax (settings)](#new_ApplyAjax_new)
* _instance_
* [._DEFAULT_PARAMS](#ApplyAjax + _DEFAULT_PARAMS): <code> Params </code>
* [.data](#ApplyAjax + data): <code> Object </code>\| <code> Array. & lt; Object & gt; </code>\| <code> string </code>
* [.request (url, rawParams, method, callback, callbackError, headers)](#ApplyAjax + request) ⇒ <code> Promise. & lt; (Response\| Error) & gt; </code>
* [.ajaxSubmit (form, before, callback, callbackError, after)](#ApplyAjax + ajaxSubmit) ⇒ <code> Promise. & lt; (Response\| Error) & gt; </code>
* [.modifyElement (object, key, value)](#ApplyAjax + modifyElement) ⇒ <code> HTMLElement </code>
* [.setMultiData (object, data)](#ApplyAjax + setMultiData) ⇒ <code> HTMLElement </code>\| <code> NodeList </code>
* [.setData (object, data)](#ApplyAjax + setData) ⇒ <code> HTMLElement </code>
* _static_
* [.isJson (str)](#ApplyAjax.isJson) ⇒ <code> boolean </code>

<a name="new_ApplyAjax_new"> </a>

### new ApplyAjax (settings)
Constructor


| | Param | Type | Description |
| | --- | --- | --- |
| | settings | <code> Templater.IApplyAjaxArgs </code> | settings |

<a name="ApplyAjax+_DEFAULT_PARAMS"> </a>

### applyAjax._DEFAULT_PARAMS: <code> Params </code>
Default query parameters

**Kind**: instance property of [<code> ApplyAjax </code>](#ApplyAjax)
<a name="ApplyAjax+data"> </a>

### applyAjax.data: <code> Object </code>\| <code> Array. & lt; Object & gt; </code>\| <code> string </code>
Result of query execution

**Kind**: instance property of [<code> ApplyAjax </code>](#ApplyAjax)
<a name="ApplyAjax+request"> </a>

### applyAjax.request (url, rawParams, method, callback, callbackError, headers) ⇒ <code> Promise. & lt; (Response\| Error) & gt; </code>
Ajax-request wrapper to the server

**Kind**: instance method of [<code> ApplyAjax </code>](#ApplyAjax)

| | Param | Type | Description |
| | --- | --- | --- |
| | url | <code> string </code> | processing address |
| | rawParams | <code> RawParams </code> | server request parameters |
| | method | <code> & quot; GET & quot; </code>\| <code> & quot; POST & quot; </code> | type of request (usually GET or POST) |
| | callback | <code> OkCallback </code> | function that works on successful request |
| | callbackError | <code> ErrorCallback </code> | function that works with an error result of a query |
| | headers | <code> object </code> | request headers |

<a name="ApplyAjax+ajaxSubmit"> </a>

### applyAjax.ajaxSubmit (form, before, callback, callbackError, after) ⇒ <code> Promise. & lt; (Response\| Error) & gt; </code>
Ajax-form submission

**Kind**: instance method of [<code> ApplyAjax </code>](#ApplyAjax)

| | Param | Type | Description |
| | --- | --- | --- |
| | form | <code> HTMLFormElement </code> | form that we ship |
| | before | | | function that is performed before sending |
| | callback | <code> OkCallback </code> | callback successful form submission |
| | callbackError | <code> ErrorCallback </code> | callback failed form submission |
| | after | <code> OkCallback </code> | this function is executed after the form is successfully submitted |

<a name="ApplyAjax+modifyElement"> </a>

### applyAjax.modifyElement (object, key, value) ⇒ <code> HTMLElement </code>
Modifies the jQuery element by inserting the value string into the places marked with the key markers.

**Kind**: instance method of [<code> ApplyAjax </code>](#ApplyAjax)

| | Param | Type | Description |
| | --- | --- | --- |
| | object | <code> HTMLElement </code> | object, which we insert |
| | key | <code> string </code> | key for insertion markers |
| | value | <code> string </code> | value for insertion |

<a name="ApplyAjax+setMultiData"> </a>

### applyAjax.setMultiData (object, data) ⇒ <code> HTMLElement </code>\| <code> NodeList </code>


**Kind**: instance method of [<code> ApplyAjax </code>](#ApplyAjax)

| | Param | Type | Description |
| | --- | --- | --- |
| | object | <code> HTMLElement </code>\| <code> NodeList </code> | object, which we insert |
| | data | <code> Object </code>\| <code> Array. & lt; Object & gt; </code>\| <code> string </code> | data for insertion |

<a name="ApplyAjax+setData"> </a>

### applyAjax.setData (object, data) ⇒ <code> HTMLElement </code>
To insert a data set into a template, it is assumed that only one data tuple is given to the input

**Kind**: instance method of [<code> ApplyAjax </code>](#ApplyAjax)

| | Param | Type | Description |
| | --- | --- | --- |
| | object | <code> HTMLElement </code> | object, which we insert |
| | data | <code> Object </code>\| <code> Array. & lt; Object & gt; </code>\| <code> string </code> | data for insertion |

<a name="ApplyAjax.isJson"> </a>

### ApplyAjax.isJson (str) ⇒ <code> boolean </code>
Is the input value a JSON structure

**Kind**: static method of [<code> ApplyAjax </code>](#ApplyAjax)

| | Param | Type | Description |
| | --- | --- | --- |
| | str | <code> string </code> | checked value |

