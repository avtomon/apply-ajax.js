/**
 * Добавить данные к форме
 *
 * @param {FormData} formData
 * @param {Object} appendToForm
 * @returns {FormData}
 */
function addToForm(formData, appendToForm) {
    if (typeof appendToForm === "undefined") {
        return formData;
    }
    for (let field in appendToForm) {
        if (!appendToForm.hasOwnProperty(field)) {
            continue;
        }
        if (!Array.isArray(appendToForm[field])) {
            appendToForm[field] = [appendToForm[field]];
        }
        appendToForm[field].forEach(function (item) {
            if (item.name) {
                formData.append(field, item, item.name);
            }
            else {
                formData.append(field, item);
            }
        });
    }
    return formData;
}
class LiteResponse {
    constructor(data, ok, status, isJson) {
        this.data = data;
        this.ok = ok;
        this.status = status;
        this.isJson = isJson;
    }
}
onmessage = async function (e) {
    let params = e.data, postError = function (errorMessage) {
        postMessage(new LiteResponse({ message: errorMessage }, false, 400));
    };
    if (!params) {
        postError('Не были переданы необходимые параметры выполнения');
        return;
    }
    let url = params['url'];
    if (!url) {
        postError('Не был передан адрес обработчика отправки формы');
        return;
    }
    let formData = params['formData'];
    if (!formData || !Object.keys(formData).length) {
        postError('Форма пуста');
        return;
    }
    let body = addToForm(new FormData(), formData);
    let options = {
        method: 'POST',
        body: body,
        credentials: 'include',
        headers: params['headers']
    };
    fetch(url, options)
        .then(async function (response) {
        const isJson = response.headers.get('Content-Type').includes('application/json');
        postMessage(new LiteResponse(isJson ? await response.json() : await response.text(), response.ok, response.status, isJson));
    });
};
